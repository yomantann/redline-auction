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
  getGameState, 
  removePlayerFromGame,
  cleanupGame,
  setEmitCallback,
  type GameDuration
} from "./gameEngine";

// Socket.IO instance - exported for later expansion
export let io: SocketIOServer;

// Lobby types
interface LobbyPlayer {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  selectedDriver?: string; // Driver/character ID selected by the player
}

interface GameSettings {
  difficulty: 'CASUAL' | 'COMPETITIVE';
  protocolsEnabled: boolean;
  abilitiesEnabled: boolean;
  variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';
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
    settings: lobby.settings
  });
}

// Remove player from their current lobby
function removePlayerFromLobby(socketId: string) {
  const lobbyCode = playerToLobby.get(socketId);
  if (!lobbyCode) return;
  
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) {
    playerToLobby.delete(socketId);
    return;
  }
  
  // If game is in progress, handle player leaving game
  if (lobby.status === 'in_game') {
    removePlayerFromGame(socketId);
  }
  
  lobby.players = lobby.players.filter(p => p.socketId !== socketId);
  playerToLobby.delete(socketId);
  
  log(`Player ${socketId} left lobby ${lobbyCode}. ${lobby.players.length} players remaining.`, "lobby");
  
  if (lobby.players.length === 0) {
    lobbies.delete(lobbyCode);
    cleanupGame(lobbyCode);
    log(`Lobby ${lobbyCode} deleted (empty)`, "lobby");
    return;
  }
  
  if (lobby.hostSocketId === socketId && lobby.players.length > 0) {
    lobby.hostSocketId = lobby.players[0].socketId;
    lobby.players[0].isHost = true;
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

  // Set up game engine emit callback
  setEmitCallback((lobbyCode: string, event: string, data: any) => {
    io.to(lobbyCode).emit(event, data);
  });

  // Socket.IO connection handling
  io.on("connection", (socket: Socket) => {
    log(`Client connected: ${socket.id}`, "socket.io");

    // CREATE LOBBY
    socket.on("create_lobby", (data: { 
      playerName: string; 
      settings?: Partial<GameSettings>;
    }, callback) => {
      const { playerName, settings: hostSettings } = data;
      
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
        maxPlayers: 8,
        createdAt: Date.now(),
        status: 'waiting',
        settings: { ...defaultSettings, ...hostSettings, gameDuration: mappedDuration }
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
        settings: lobby.settings
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
        settings: lobby.settings
      }});
      
      broadcastLobbyUpdate(upperCode);
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
        // Can only ready up if a driver is selected
        if (!player.isReady && !player.selectedDriver) {
          if (callback) callback({ success: false, error: "Must select a driver first" });
          return;
        }
        
        player.isReady = !player.isReady;
        log(`${player.name} is ${player.isReady ? 'ready' : 'not ready'} in lobby ${lobbyCode}`, "lobby");
        broadcastLobbyUpdate(lobbyCode);
        if (callback) callback({ success: true, isReady: player.isReady });
      }
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
      
      // Validate all ready players have selected a driver (before changing status)
      const playersWithoutDriver = readyPlayers.filter(p => !p.selectedDriver);
      if (playersWithoutDriver.length > 0) {
        if (callback) callback({ success: false, error: "All players must select a driver" });
        return;
      }
      
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
      
      const gameState = createGame(lobbyCode, gamePlayers, lobby.settings.gameDuration);
      
      // Emit game started event
      io.to(lobbyCode).emit('game_started', {
        lobbyCode,
        players: gameState.players,
        totalRounds: gameState.totalRounds,
        initialTime: gameState.initialTime
      });
      
      log(`Game started in lobby ${lobbyCode} with ${gamePlayers.length} human players`, "game");
      
      // Start the game after a short delay for clients to prepare
      setTimeout(() => {
        startGame(lobbyCode);
      }, 1000);
      
      if (callback) callback({ success: true });
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

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      log(`Client disconnected: ${socket.id} (reason: ${reason})`, "socket.io");
      removePlayerFromLobby(socket.id);
    });
  });

  log("Socket.IO initialized with lobby and game system", "socket.io");

  // API routes will go here
  // prefix all routes with /api

  return httpServer;
}
