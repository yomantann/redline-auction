import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";
import { log } from "./index";
import { 
  createGame, 
  startGame, 
  playerPressBid,
  playerReleaseBid, 
  playerAcknowledgeRoundEnd,
  playerOverclockClick,
  getGameState, 
  removePlayerFromGame,
  disconnectPlayerFromGame,
  reconnectPlayerToGame,
  cleanupGame,
  setEmitCallback,
  setEmitToPlayerCallback,
  selectDriverInGame,
  confirmDriverInGame,
  broadcastGameState,
  activateRelicMP,
  castVoteRelic,
  type GameDuration
} from "./gameEngine";
import { recordGameSnapshot, recordGameSummary, createGameId, recordContactMessage, recordStripeTransaction } from "./snapshotDb";
import {
  insertGameSnapshotSchema,
  insertGameSummarySchema,
  convertAchievementsSchema,
  convertGameSchema,
  purchaseCosmeticSchema,
  equipCosmeticSchema,
  purchaseCurrencySchema,
  playerProfiles,
} from "@shared/schema";
import {
  COSMETICS_CATALOG,
  COSMETIC_CATEGORY_CONFIG,
  createDefaultProfile,
  convertAchievementsToCurrency,
  convertGameToCurrency,
  purchaseCosmetic,
  equipCosmetic,
  unequipCosmetic,
  purchaseCurrency,
  addCurrencyFromStripe,
} from "./currencyEngine";
import { isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";

// Rate limiter for wallet/profile mutation endpoints — protects against abuse
const walletRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Socket.IO instance - exported for later expansion
export let io: SocketIOServer;

// Lobby types
interface LobbyPlayer {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  selectedDriver?: string;
  disconnected?: boolean;
}

interface GameSettings {
  difficulty: 'CASUAL' | 'COMPETITIVE';
  protocolsEnabled: boolean;
  bonusTrophiesEnabled: boolean;
  abilitiesEnabled: boolean;
  variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL' | 'HAUNTED';
  gameDuration: GameDuration; // 'short' | 'standard' | 'long'
}

// Map client duration names to server duration names
function mapDuration(clientDuration: string): GameDuration {
  switch (clientDuration) {
    case 'sprint': return 'short';
    case 'long': return 'long';
    case 'standard': 
    default: return 'standard';
  }
}

interface Lobby {
  code: string;
  hostSocketId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  createdAt: number;
  status: 'waiting' | 'starting' | 'in_game';
  settings: GameSettings;
  isPublic: boolean;
}

// In-memory lobby storage
const lobbies = new Map<string, Lobby>();
const playerToLobby = new Map<string, string>(); // socketId -> lobbyCode

// Generate a random 4-character lobby code
function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (lobbies.has(code)) {
    return generateLobbyCode();
  }
  return code;
}

// Broadcast lobby update to all players in a lobby
function broadcastLobbyUpdate(lobbyCode: string) {
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) return;
  
  io.to(lobbyCode).emit('lobby_update', {
    code: lobby.code,
    players: lobby.players,
    hostSocketId: lobby.hostSocketId,
    status: lobby.status,
    maxPlayers: lobby.maxPlayers,
    settings: lobby.settings,
    isPublic: lobby.isPublic
  });
}

// Remove player from their current lobby
function removePlayerFromLobby(socketId: string, isDisconnect = false) {
  const lobbyCode = playerToLobby.get(socketId);
  if (!lobbyCode) return;
  
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) {
    playerToLobby.delete(socketId);
    return;
  }
  
  if (lobby.status === 'in_game' && isDisconnect) {
    const lobbyPlayer = lobby.players.find(p => p.socketId === socketId);
    if (lobbyPlayer) {
      lobbyPlayer.disconnected = true;
      lobbyPlayer.socketId = '';
      playerToLobby.delete(socketId);
      log(`Player ${lobbyPlayer.name} disconnected from active game ${lobbyCode} - can rejoin`, "lobby");
      
      disconnectPlayerFromGame(lobbyCode, socketId);
      
      if (lobby.hostSocketId === socketId) {
        const connected = lobby.players.find(p => !p.disconnected && p.socketId);
        if (connected) {
          lobby.hostSocketId = connected.socketId;
          connected.isHost = true;
          log(`New host assigned in lobby ${lobbyCode}: ${connected.socketId}`, "lobby");
        }
      }
      
      broadcastLobbyUpdate(lobbyCode);
      return;
    }
  }
  
  if (lobby.status === 'in_game') {
    removePlayerFromGame(socketId);
  }
  
  lobby.players = lobby.players.filter(p => p.socketId !== socketId);
  playerToLobby.delete(socketId);
  
  log(`Player ${socketId} left lobby ${lobbyCode}. ${lobby.players.length} players remaining.`, "lobby");
  
  const connectedPlayers = lobby.players.filter(p => !p.disconnected);
  if (connectedPlayers.length === 0) {
    lobbies.delete(lobbyCode);
    cleanupGame(lobbyCode);
    log(`Lobby ${lobbyCode} deleted (no connected players)`, "lobby");
    return;
  }
  
  if (lobby.hostSocketId === socketId && connectedPlayers.length > 0) {
    lobby.hostSocketId = connectedPlayers[0].socketId;
    connectedPlayers[0].isHost = true;
    log(`New host assigned in lobby ${lobbyCode}: ${lobby.hostSocketId}`, "lobby");
  }
  
  broadcastLobbyUpdate(lobbyCode);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize Socket.IO
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:5000", "http://0.0.0.0:5000"],
      credentials: true
    }
  });

  // Set up game engine emit callbacks
  setEmitCallback((lobbyCode: string, event: string, data: any) => {
    io.to(lobbyCode).emit(event, data);
  });
  setEmitToPlayerCallback((socketId: string, event: string, data: any) => {
    io.to(socketId).emit(event, data);
  });

  // Socket.IO connection handling
  io.on("connection", (socket: Socket) => {
    log(`Client connected: ${socket.id}`, "socket.io");

    // CREATE LOBBY
    socket.on("create_lobby", (data: { 
      playerName: string; 
      settings?: Partial<GameSettings>;
      isPublic?: boolean;
    }, callback) => {
      const { playerName, settings: hostSettings, isPublic } = data;
      
      if (playerToLobby.has(socket.id)) {
        callback({ success: false, error: "Already in a lobby" });
        return;
      }
      
      const code = generateLobbyCode();
      const player: LobbyPlayer = {
        id: `player_${Date.now()}`,
        socketId: socket.id,
        name: playerName || "Player 1",
        isHost: true,
        isReady: false
      };
      
      // Default settings merged with host's settings
      const defaultSettings: GameSettings = {
        difficulty: 'CASUAL',
        protocolsEnabled: true,
        bonusTrophiesEnabled: true,
        abilitiesEnabled: true,
        variant: 'STANDARD',
        gameDuration: 'standard'
      };
      
      // Map client duration to server duration
      const mappedDuration = hostSettings?.gameDuration 
        ? mapDuration(hostSettings.gameDuration) 
        : defaultSettings.gameDuration;
      
      const lobby: Lobby = {
        code,
        hostSocketId: socket.id,
        players: [player],
        maxPlayers: 16,
        createdAt: Date.now(),
        status: 'waiting',
        settings: { ...defaultSettings, ...hostSettings, gameDuration: mappedDuration },
        isPublic: isPublic ?? false
      };
      
      lobbies.set(code, lobby);
      playerToLobby.set(socket.id, code);
      socket.join(code);
      
      log(`Lobby ${code} created by ${playerName} (${socket.id})`, "lobby");
      
      callback({ success: true, code, lobby: {
        code: lobby.code,
        players: lobby.players,
        hostSocketId: lobby.hostSocketId,
        status: lobby.status,
        maxPlayers: lobby.maxPlayers,
        settings: lobby.settings,
        isPublic: lobby.isPublic
      }});
      
      broadcastLobbyUpdate(code);
    });

    // JOIN LOBBY
    socket.on("join_lobby", (data: { code: string; playerName: string }, callback) => {
      const { code, playerName } = data;
      const upperCode = code.toUpperCase();
      
      if (playerToLobby.has(socket.id)) {
        callback({ success: false, error: "Already in a lobby" });
        return;
      }
      
      const lobby = lobbies.get(upperCode);
      if (!lobby) {
        callback({ success: false, error: "Lobby not found" });
        return;
      }
      
      if (lobby.players.length >= lobby.maxPlayers) {
        callback({ success: false, error: "Lobby is full" });
        return;
      }
      
      if (lobby.status !== 'waiting') {
        callback({ success: false, error: "Game already in progress" });
        return;
      }
      
      const player: LobbyPlayer = {
        id: `player_${Date.now()}`,
        socketId: socket.id,
        name: playerName || `Player ${lobby.players.length + 1}`,
        isHost: false,
        isReady: false
      };
      
      lobby.players.push(player);
      playerToLobby.set(socket.id, upperCode);
      socket.join(upperCode);
      
      log(`${playerName} (${socket.id}) joined lobby ${upperCode}. ${lobby.players.length} players now.`, "lobby");
      
      callback({ success: true, lobby: {
        code: lobby.code,
        players: lobby.players,
        hostSocketId: lobby.hostSocketId,
        status: lobby.status,
        maxPlayers: lobby.maxPlayers,
        settings: lobby.settings,
        isPublic: lobby.isPublic
      }});
      
      broadcastLobbyUpdate(upperCode);
    });

    // JOIN RANDOM PUBLIC LOBBY
    socket.on("join_random_lobby", (data: { playerName: string }, callback) => {
      const { playerName } = data;
      
      if (playerToLobby.has(socket.id)) {
        callback({ success: false, error: "Already in a lobby" });
        return;
      }
      
      const availableLobbies = Array.from(lobbies.values()).filter(
        lobby => lobby.isPublic && lobby.status === 'waiting' && lobby.players.length < lobby.maxPlayers
      );
      
      if (availableLobbies.length === 0) {
        callback({ success: false, error: "No public lobbies available" });
        return;
      }
      
      const lobby = availableLobbies[Math.floor(Math.random() * availableLobbies.length)];
      
      const player: LobbyPlayer = {
        id: `player_${Date.now()}`,
        socketId: socket.id,
        name: playerName || `Player ${lobby.players.length + 1}`,
        isHost: false,
        isReady: false
      };
      
      lobby.players.push(player);
      playerToLobby.set(socket.id, lobby.code);
      socket.join(lobby.code);
      
      log(`${playerName} (${socket.id}) joined random public lobby ${lobby.code}. ${lobby.players.length} players now.`, "lobby");
      
      callback({ success: true, lobby: {
        code: lobby.code,
        players: lobby.players,
        hostSocketId: lobby.hostSocketId,
        status: lobby.status,
        maxPlayers: lobby.maxPlayers,
        settings: lobby.settings,
        isPublic: lobby.isPublic
      }});
      
      broadcastLobbyUpdate(lobby.code);
    });

    // LEAVE LOBBY
    socket.on("leave_lobby", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      socket.leave(lobbyCode);
      removePlayerFromLobby(socket.id);
      
      if (callback) callback({ success: true });
    });

    // UPDATE LOBBY SETTINGS (host only)
    socket.on("update_lobby_settings", (data: { settings: Partial<GameSettings> }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        if (callback) callback({ success: false, error: "Lobby not found" });
        return;
      }
      
      // Only host can update settings
      if (lobby.hostSocketId !== socket.id) {
        if (callback) callback({ success: false, error: "Only host can update settings" });
        return;
      }
      
      // Map client duration to server duration if provided
      const newSettings = { ...data.settings };
      if (newSettings.gameDuration) {
        newSettings.gameDuration = mapDuration(newSettings.gameDuration);
      }
      
      // Merge new settings
      lobby.settings = { ...lobby.settings, ...newSettings };
      
      log(`Lobby ${lobbyCode} settings updated by host`, "lobby");
      
      broadcastLobbyUpdate(lobbyCode);
      
      if (callback) callback({ success: true });
    });

    // PLAYER READY TOGGLE
    socket.on("toggle_ready", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        if (callback) callback({ success: false, error: "Lobby not found" });
        return;
      }
      
      const player = lobby.players.find(p => p.socketId === socket.id);
      if (player) {
        // Driver selection now happens after game starts, no longer required for ready-up
        player.isReady = !player.isReady;
        log(`${player.name} is ${player.isReady ? 'ready' : 'not ready'} in lobby ${lobbyCode}`, "lobby");
        broadcastLobbyUpdate(lobbyCode);
        if (callback) callback({ success: true, isReady: player.isReady });
      }
    });

    // UPDATE PLAYER NAME (before game starts)
    socket.on("update_player_name", (data: { newName: string }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }

      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        if (callback) callback({ success: false, error: "Lobby not found" });
        return;
      }

      if (lobby.status !== 'waiting') {
        if (callback) callback({ success: false, error: "Game already in progress" });
        return;
      }

      const trimmedName = data.newName?.trim().slice(0, 20);
      if (!trimmedName) {
        if (callback) callback({ success: false, error: "Name cannot be empty" });
        return;
      }

      const player = lobby.players.find(p => p.socketId === socket.id);
      if (!player) {
        if (callback) callback({ success: false, error: "Player not found" });
        return;
      }

      player.name = trimmedName;
      log(`${socket.id} changed name to ${trimmedName} in lobby ${lobbyCode}`, "lobby");

      broadcastLobbyUpdate(lobbyCode);
      if (callback) callback({ success: true });
    });

    // SELECT DRIVER
    socket.on("select_driver", (data: { driverId: string }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        if (callback) callback({ success: false, error: "Lobby not found" });
        return;
      }
      
      const player = lobby.players.find(p => p.socketId === socket.id);
      if (!player) {
        if (callback) callback({ success: false, error: "Player not found" });
        return;
      }
      
      // Check if driver is already taken by another player
      const driverTaken = lobby.players.some(p => 
        p.socketId !== socket.id && p.selectedDriver === data.driverId
      );
      if (driverTaken) {
        if (callback) callback({ success: false, error: "Driver already taken" });
        return;
      }
      
      player.selectedDriver = data.driverId;
      log(`${player.name} selected driver ${data.driverId} in lobby ${lobbyCode}`, "lobby");
      broadcastLobbyUpdate(lobbyCode);
      if (callback) callback({ success: true, driverId: data.driverId });
    });

    // START GAME (host only)
    socket.on("start_game", (data: { duration?: GameDuration }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        if (callback) callback({ success: false, error: "Lobby not found" });
        return;
      }
      
      // Only host can start
      if (lobby.hostSocketId !== socket.id) {
        if (callback) callback({ success: false, error: "Only host can start" });
        return;
      }
      
      // Need at least 1 ready player (bots will fill the rest)
      const readyPlayers = lobby.players.filter(p => p.isReady);
      if (readyPlayers.length < 1) {
        if (callback) callback({ success: false, error: "Need at least 1 ready player" });
        return;
      }
      
      // Driver selection now happens after game starts, no validation needed here
      
      // All validations passed - now update lobby status
      lobby.status = 'in_game';
      broadcastLobbyUpdate(lobbyCode);
      
      // Create game with ready players only (include driver selection)
      const gamePlayers = readyPlayers.map(p => ({
        id: p.id,
        socketId: p.socketId,
        name: p.name,
        selectedDriver: p.selectedDriver
      }));
      
      const gameState = createGame(lobbyCode, gamePlayers, lobby.settings.gameDuration, {
        difficulty: lobby.settings.difficulty,
        protocolsEnabled: lobby.settings.protocolsEnabled,
        bonusTrophiesEnabled: lobby.settings.bonusTrophiesEnabled,
        abilitiesEnabled: lobby.settings.abilitiesEnabled,
        variant: lobby.settings.variant,
      });
      
      // Emit game started event
      io.to(lobbyCode).emit('game_started', {
        lobbyCode,
        players: gameState.players,
        totalRounds: gameState.totalRounds,
        initialTime: gameState.initialTime,
        settings: gameState.settings,
      });
      
      log(`Game started in lobby ${lobbyCode} with ${gamePlayers.length} human players`, "game");
      
      // Start the game after a short delay for clients to prepare
      setTimeout(() => {
        startGame(lobbyCode);
      }, 1000);
      
      if (callback) callback({ success: true });
    });

    // SELECT DRIVER IN GAME (during driver_selection phase)
    socket.on("select_driver_in_game", (data: { driverId: string }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      // Find player ID from socket ID
      const lobby = lobbies.get(lobbyCode);
      const player = lobby?.players.find(p => p.socketId === socket.id);
      if (!player) {
        if (callback) callback({ success: false, error: "Player not found" });
        return;
      }
      
      const result = selectDriverInGame(lobbyCode, player.id, data.driverId);
      if (callback) callback(result);
    });

    // CONFIRM DRIVER IN GAME (during driver_selection phase)
    socket.on("confirm_driver", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      // Find player ID from socket ID
      const lobby = lobbies.get(lobbyCode);
      const player = lobby?.players.find(p => p.socketId === socket.id);
      if (!player) {
        if (callback) callback({ success: false, error: "Player not found" });
        return;
      }
      
      const result = confirmDriverInGame(lobbyCode, player.id);
      if (callback) callback(result);
    });

    // PLAYER PRESSES BUTTON (starts holding/ready)
    socket.on("player_press", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      playerPressBid(lobbyCode, socket.id);
      
      if (callback) callback({ success: true });
    });

    // PLAYER RELEASES BID (stops holding)
    socket.on("player_release", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      playerReleaseBid(lobbyCode, socket.id);
      
      if (callback) callback({ success: true });
    });

    // PLAYER ACKNOWLEDGES ROUND END (clicks to continue to next round)
    socket.on("player_ready_next", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      playerAcknowledgeRoundEnd(lobbyCode, socket.id);
      
      if (callback) callback({ success: true });
    });

    // Haunted mode: player selects a haunted item/relic
    socket.on("select_haunted_item", (data: { itemId: string; itemName: string }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback?.({ success: false, error: "Not in a lobby" });
        return;
      }
      const game = getGameState(lobbyCode);
      if (!game) { if (callback) callback?.({ success: false, error: "No active game" }); return; }
      const player = game.players.find(p => p.socketId === socket.id);
      if (player) {
        player.selectedItem = data.itemName;
        // Broadcast updated state to all players in lobby
        io.to(lobbyCode).emit("game_state_update", { players: game.players.map(p => ({ id: p.id, selectedItem: p.selectedItem })) });
      }
      if (callback) callback?.({ success: true });
    });

    // Haunted mode: player resolves a ghost ability (from client-side interactive phase)
    socket.on("resolve_ghost_ability", (data: { 
      ability: string; 
      targetId?: string; 
      accepted?: boolean;
      offerAmount?: number;
    }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback?.({ success: false, error: "Not in lobby" }); return; }
      const game = getGameState(lobbyCode);
      if (!game) { if (callback) callback?.({ success: false, error: "No game" }); return; }
      const player = game.players.find(p => p.socketId === socket.id);
      if (!player || !player.isGhost) { if (callback) callback?.({ success: false, error: "Not a ghost" }); return; }

      if (data.ability === 'purgatory') {
        player.possessionRoundsLeft = 2;
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'reaper' && data.targetId) {
        const target = game.players.find(p => p.id === data.targetId);
        if (target && !target.isGhost && !target.isEliminated) {
          const savedTime = target.remainingTime;
          target.isGhost = true;
          target.remainingTime = 0;
          target.ghostImage = `hnt_ghost_${Math.floor(Math.random() * 6) + 1}`;
          target.ghostReason = 'forced';
          target.ghostTimeAtDeath = savedTime;
          target.ghostAbility = Math.random() < 0.25 ? 'reaper' : 'purgatory';
          target.ghostAbilityUsed = false;
        }
        // After reaper fires, ghost enters purgatory-style countdown
        player.possessionRoundsLeft = 2;
        player.ghostAbilityUsed = true;
      }

      // Broadcast updated state to all players
      broadcastGameState(lobbyCode);
      if (callback) callback?.({ success: true });
    });

    // Haunted mode: activate a relic (MP)
    socket.on("activate_relic", (data: { relicId: string; targetId?: string; curseType?: 'time' | 'trophy' }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback?.({ success: false, error: "Not in a lobby" }); return; }
      const result = activateRelicMP(lobbyCode, socket.id, data.relicId, data.targetId, data.curseType);
      if (callback) callback?.(result);
    });

    // Haunted mode: cast a vote for an active relic vote
    socket.on("cast_relic_vote", (data: { optionId: string }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback?.({ success: false, error: "Not in a lobby" }); return; }
      const result = castVoteRelic(lobbyCode, socket.id, data.optionId);
      if (callback) callback?.(result);
      });
    
    // OVERCLOCK CLICK: player clicks during OVERCLOCK protocol phase
    socket.on("overclock_click", (callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) {
        if (callback) callback({ success: false, error: "Not in a lobby" });
        return;
      }
      
      playerOverclockClick(lobbyCode, socket.id);
      
      if (callback) callback({ success: true });
    });

    // Handle disconnection
    socket.on("rejoin_game", (data: { code: string; playerName: string }, callback) => {
      const { code, playerName } = data;
      const upperCode = code.toUpperCase();
      
      if (playerToLobby.has(socket.id)) {
        callback({ success: false, error: "Already in a lobby" });
        return;
      }
      
      const lobby = lobbies.get(upperCode);
      if (!lobby) {
        callback({ success: false, error: "Lobby not found" });
        return;
      }
      
      if (lobby.status !== 'in_game') {
        callback({ success: false, error: "No active game to rejoin" });
        return;
      }
      
      const disconnectedPlayer = lobby.players.find(
        p => p.disconnected && p.name === playerName
      );
      
      if (!disconnectedPlayer) {
        callback({ success: false, error: "No matching disconnected player found" });
        return;
      }
      
      disconnectedPlayer.socketId = socket.id;
      disconnectedPlayer.disconnected = false;
      playerToLobby.set(socket.id, upperCode);
      socket.join(upperCode);
      
      const reconnected = reconnectPlayerToGame(upperCode, disconnectedPlayer.id, socket.id);
      
      if (!reconnected) {
        callback({ success: false, error: "Failed to reconnect to game" });
        return;
      }
      
      log(`${playerName} (${socket.id}) rejoined game in lobby ${upperCode}`, "lobby");
      
      callback({ success: true, lobby: {
        code: lobby.code,
        players: lobby.players,
        hostSocketId: lobby.hostSocketId,
        status: lobby.status,
        maxPlayers: lobby.maxPlayers,
        settings: lobby.settings
      }});
      
      broadcastLobbyUpdate(upperCode);
    });

    socket.on("disconnect", (reason) => {
      log(`Client disconnected: ${socket.id} (reason: ${reason})`, "socket.io");
      removePlayerFromLobby(socket.id, true);
    });
  });

  log("Socket.IO initialized with lobby and game system", "socket.io");

  // API routes - prefix all routes with /api
  
  // Singleplayer snapshot recording endpoint
  app.post("/api/game/snapshot", async (req, res) => {
    try {
      const snapshot = insertGameSnapshotSchema.parse({
        ...req.body,
        isMultiplayer: 0, // Force singleplayer flag
      });
      await recordGameSnapshot(snapshot);
      res.json({ success: true });
    } catch (error) {
      log(`Snapshot recording failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });
  
  app.post("/api/game/summary", async (req, res) => {
    try {
      const summary = insertGameSummarySchema.parse({
        ...req.body,
        isMultiplayer: 0,
      });
      await recordGameSummary(summary);
      res.json({ success: true });
    } catch (error) {
      log(`Game summary recording failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  // Generate unique game ID for singleplayer games
  app.get("/api/game/new-id", (_req, res) => {
    res.json({ gameId: createGameId() });
  });

  app.post("/api/contact", async (req, res) => {
    try {
      console.log('[Contact] Request body:', req.body);
      const { insertContactSchema } = await import("@shared/schema");
      const message = insertContactSchema.parse(req.body);
      console.log('[Contact] Parsed message:', message);
      await recordContactMessage(message);
      res.json({ success: true });
    } catch (error) {
      console.error('[Contact] Full error:', error);
      log(`Contact form failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });


  // ── Player Profile & Wallet API ──────────────────────────────────────────────
  // All wallet/currency routes require Replit Auth (req.user.claims.sub).
  // Guests (unauthenticated) get { success: true, skipped: true } — never an error.

  // GET /api/player/profile – fetch or auto-create the authenticated player's profile
  app.get("/api/player/profile", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json(null);
    try {
      const userId: string = req.user.claims.sub;
      const [existing] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (existing) return res.json({ success: true, profile: existing });

      // First login — auto-create profile from Replit Auth claims
      const newProfile = createDefaultProfile(
        userId,
        req.user.claims.first_name || req.user.claims.email?.split('@')[0] || 'Driver',
        req.user.claims.profile_image_url ?? null,
      );
      const [created] = await db.insert(playerProfiles).values(newProfile as any).returning();
      return res.json({ success: true, profile: created });
    } catch (error) {
      log(`Get player profile failed: ${error}`, "api");
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // GET /api/cosmetics – return full cosmetics catalog + category config
  app.get("/api/cosmetics", (_req, res) => {
    res.json({ success: true, cosmetics: COSMETICS_CATALOG, categoryConfig: COSMETIC_CATEGORY_CONFIG });
  });

  // POST /api/player/convert-game – end-game credit conversion (idempotent per gameId)
  app.post("/api/player/convert-game", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const parsed = convertGameSchema.parse(req.body);

      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!profile) return res.json({ success: true, skipped: true });

      const alreadyConverted = (profile.convertedGameIds as string[]).includes(parsed.gameId);
      const { creditsEarned, milestoneUnlocked, updatedProfile } = convertGameToCurrency(
        profile,
        parsed.gameId,
        parsed.trophies,
        parsed.momentFlags,
        parsed.isWinner,
        parsed.variant,
        parsed.isMultiplayer,
      );

      await db.update(playerProfiles)
        .set({ ...(updatedProfile as any), updatedAt: new Date() })
        .where(eq(playerProfiles.id, userId));

      res.json({ success: true, creditsEarned, milestoneUnlocked, alreadyConverted, profile: updatedProfile });
    } catch (error) {
      log(`Convert-game failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  // POST /api/player/purchase – purchase a cosmetic with in-game credits
  app.post("/api/player/purchase", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const { cosmeticId } = purchaseCosmeticSchema.parse(req.body);

      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!profile) return res.json({ success: true, skipped: true });

      const updatedProfile = purchaseCosmetic(profile, cosmeticId);
      await db.update(playerProfiles)
        .set({ ...(updatedProfile as any), updatedAt: new Date() })
        .where(eq(playerProfiles.id, userId));

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      log(`Purchase cosmetic failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  // POST /api/player/equip – equip an owned cosmetic
  app.post("/api/player/equip", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const { cosmeticId } = equipCosmeticSchema.parse(req.body);

      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!profile) return res.json({ success: true, skipped: true });

      const updatedProfile = equipCosmetic(profile, cosmeticId);
      await db.update(playerProfiles)
        .set({ equippedCosmetics: updatedProfile.equippedCosmetics as any, updatedAt: new Date() })
        .where(eq(playerProfiles.id, userId));

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      log(`Equip cosmetic failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  // POST /api/player/unequip – unequip a cosmetic
  app.post("/api/player/unequip", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const { cosmeticId } = equipCosmeticSchema.parse(req.body);

      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!profile) return res.json({ success: true, skipped: true });

      const updatedProfile = unequipCosmetic(profile, cosmeticId);
      await db.update(playerProfiles)
        .set({ equippedCosmetics: updatedProfile.equippedCosmetics as any, updatedAt: new Date() })
        .where(eq(playerProfiles.id, userId));

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      log(`Unequip cosmetic failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  // POST /api/player/purchase-currency – Stripe placeholder (item metadata tracked)
  app.post("/api/player/purchase-currency", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const { amount, purchasedItemType, purchasedItemId, purchasedItemLabel } =
        purchaseCurrencySchema.parse(req.body);

      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!profile) return res.json({ success: true, skipped: true });

      // Record the pending transaction with full item metadata.
      // stripePaymentIntentId is null until Stripe creates a real PaymentIntent.
      await recordStripeTransaction({
        userId,
        stripePaymentIntentId: null,
        creditsAmount: amount,
        purchasedItemType: purchasedItemType ?? 'credits_pack',
        purchasedItemId: purchasedItemId ?? null,
        purchasedItemLabel: purchasedItemLabel ?? null,
        status: 'pending',
      });

      const result = await purchaseCurrency(userId, amount, purchasedItemType, purchasedItemId, purchasedItemLabel);
      res.json({ success: true, ...result });
    } catch (error) {
      log(`Purchase currency failed: ${error}`, "api");
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  // POST /api/player/stats – record game result for authenticated player
  app.post("/api/player/stats", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const { won } = req.body as { won: boolean };

      const [existing] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!existing) return res.json({ success: true, skipped: true });

      await db.update(playerProfiles)
        .set({
          totalGames: existing.totalGames + 1,
          totalWins: won ? existing.totalWins + 1 : existing.totalWins,
          updatedAt: new Date(),
        })
        .where(eq(playerProfiles.id, userId));

      return res.json({ success: true });
    } catch (error) {
      log(`Player stats update failed: ${error}`, "api");
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // POST /api/player/cosmetics/equip – slot-based equip (legacy/Game.tsx compatibility)
  app.post("/api/player/cosmetics/equip", walletRateLimit, async (req: any, res) => {
    if (!req.isAuthenticated?.()) return res.json({ success: true, skipped: true });
    try {
      const userId: string = req.user.claims.sub;
      const { slot, cosmeticId } = req.body as { slot: string; cosmeticId: string };

      const [existing] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, userId));
      if (!existing) return res.json({ success: true, skipped: true });

      const updated = { ...((existing.equippedCosmetics as Record<string, string>) || {}), [slot]: cosmeticId };
      await db.update(playerProfiles)
        .set({ equippedCosmetics: updated, updatedAt: new Date() })
        .where(eq(playerProfiles.id, userId));

      return res.json({ success: true, equippedCosmetics: updated });
    } catch (error) {
      log(`Cosmetic equip failed: ${error}`, "api");
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ── Stripe Webhook (stub — wire in when Stripe is integrated) ─────────────
  //
  // STRIPE_HOOK: Uncomment when Stripe is live. Must be before express.json().
  //
  // app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  //   const sig = req.headers['stripe-signature'];
  //   try {
  //     const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  //     if (event.type === 'payment_intent.succeeded') {
  //       const intent = event.data.object as any;
  //       const { userId } = intent.metadata;
  //       // 1. Look up pending stripe_transactions row by stripePaymentIntentId
  //       // 2. Mark it 'completed'
  //       // 3. Load player profile, call addCurrencyFromStripe(), save
  //     }
  //     res.json({ received: true });
  //   } catch (err) {
  //     return res.status(400).send(`Webhook Error: ${err}`);
  //   }
  // });

  return httpServer;
}