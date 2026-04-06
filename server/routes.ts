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
  rttSubmitBid,
  rttChallenge,
  marginSubmitGuess,
  marginForfeit,
  vaultKeep,
  vaultReroll,
  vaultBank,
  type GameDuration
} from "./gameEngine";
import { recordGameSnapshot, recordGameSummary, createGameId, recordContactMessage } from "./snapshotDb";
import { insertGameSnapshotSchema, insertGameSummarySchema } from "@shared/schema";

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
  variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL' | 'HAUNTED' | 'WAGER';
  gameDuration: GameDuration; // 'short' | 'standard' | 'long'
  // WAGER Competitive fields
  competitiveBidTier?: 'CHUMP_CHANGE' | 'MID_LANE' | 'HIGH_ROLLER' | 'REDLINE' | null;
  competitiveBidAmount?: number | null;
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

      // WAGER Competitive: require at least 4 real players, no bots
      if (lobby.settings.competitiveBidTier) {
        if (readyPlayers.length < 4) {
          if (callback) callback({ success: false, error: "WAGER Competitive requires at least 4 real players. Invite more friends!" });
          return;
        }
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
        competitiveBidTier: lobby.settings.competitiveBidTier ?? null,
        competitiveBidAmount: lobby.settings.competitiveBidAmount ?? null,
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

    // WAGER mode: player submits wager
    socket.on("submit_wager", (data: {
      targetId: string | null;
      percent: number;
      amount: number;
      isDoubleDown: boolean;
      sidePotHigh: boolean | null;
    }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in lobby" }); return; }
      const game = getGameState(lobbyCode);
      if (!game) { if (callback) callback({ success: false, error: "No game" }); return; }
      if (game.phase !== 'wager_phase') { if (callback) callback({ success: false, error: "Not in wager phase" }); return; }
      const player = game.players.find(p => p.socketId === socket.id);
      if (!player) { if (callback) callback({ success: false, error: "Player not found" }); return; }

      const maxWager = Math.round(player.remainingTime * 0.75 * 10) / 10;
      const clampedAmount = Math.min(maxWager, Math.max(0, data.amount));
      const clampedPercent = Math.min(75, Math.max(0, data.percent));
      const target = data.isDoubleDown && game.previousRoundWinnerId
        ? game.previousRoundWinnerId
        : data.targetId;

      player.wagerTargetId = target ?? undefined;
      player.wagerPercent = clampedPercent;
      player.wagerAmount = clampedAmount;
      player.isDoubleDown = data.isDoubleDown;
      player.wagerResolved = false;
      player.wagerWon = undefined;
      player.sidePotWagerHigh = data.sidePotHigh ?? undefined;

      broadcastGameState(lobbyCode);
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

      if (data.ability === 'possession' && data.targetId) {
        player.possessionTargetId = data.targetId;
        player.possessionRoundsLeft = 3;
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'purgatory') {
        player.possessionRoundsLeft = 2;
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'vendetta_win') {
        player.isGhost = false;
        player.remainingTime = 30;
        const target = game.players.find(p => p.id === data.targetId);
        if (target) target.remainingTime = Math.max(0, target.remainingTime * 0.75);
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'vendetta_lose') {
        // Ghost stays ghost; alive player already unaffected (they won)
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'bargain' && data.targetId && data.offerAmount && data.accepted) {
        const target = game.players.find(p => p.id === data.targetId);
        if (target && player.tokens >= data.offerAmount) {
          player.tokens -= data.offerAmount;
          target.tokens += data.offerAmount;
          player.remainingTime += data.offerAmount * 40;
          target.remainingTime = Math.max(0, target.remainingTime - data.offerAmount * 40);
        }
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'curse') {
        game.ghostCurseActive = true;
        player.ghostAbilityUsed = true;
      } else if (data.ability === 'reaper' && data.targetId) {
        const target = game.players.find(p => p.id === data.targetId);
        if (target && !target.isGhost && !target.isEliminated) {
          const idx = Math.floor(Math.random() * 8) + 1;
          const savedTime = target.remainingTime;
          target.isGhost = true;
          target.remainingTime = 0;
          target.ghostImage = `hnt_ghost_${idx}`;
          target.ghostReason = 'forced';
          target.ghostTimeAtDeath = savedTime;
        }
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

    socket.on("rtt_bid", (data: { qty: number; face: number }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = rttSubmitBid(lobbyCode, socket.id, data.qty, data.face);
      if (callback) callback(result);
    });

    socket.on("rtt_challenge", (data: { type: 'liar' | 'spot_on' }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = rttChallenge(lobbyCode, socket.id, data.type);
      if (callback) callback(result);
    });

    socket.on("margin_guess", (data: { guess: string }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = marginSubmitGuess(lobbyCode, socket.id, data.guess);
      if (callback) callback(result);
    });

    socket.on("margin_forfeit", (_data: Record<string, never>, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = marginForfeit(lobbyCode, socket.id);
      if (callback) callback(result);
    });

    socket.on("vault_keep", (data: { keptIndices: number[] }, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = vaultKeep(lobbyCode, socket.id, data.keptIndices ?? []);
      if (callback) callback(result);
    });

    socket.on("vault_reroll", (_data: Record<string, never>, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = vaultReroll(lobbyCode, socket.id);
      if (callback) callback(result);
    });

    socket.on("vault_bank", (_data: Record<string, never>, callback?) => {
      const lobbyCode = playerToLobby.get(socket.id);
      if (!lobbyCode) { if (callback) callback({ success: false, error: "Not in a lobby" }); return; }
      const result = vaultBank(lobbyCode, socket.id);
      if (callback) callback(result);
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

  return httpServer;
}
