import { log } from "./index";

// Game Constants
const STANDARD_INITIAL_TIME = 300.0;
const LONG_INITIAL_TIME = 600.0;
const SHORT_INITIAL_TIME = 150.0;
const STANDARD_TOTAL_ROUNDS = 9;
const LONG_TOTAL_ROUNDS = 18;
const SHORT_TOTAL_ROUNDS = 9;
const COUNTDOWN_SECONDS = 3;
const MIN_PLAYERS = 4;

// Bot names for auto-fill
const BOT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];
const BOT_PERSONALITIES = ['aggressive', 'conservative', 'random', 'balanced'] as const;

export type BotPersonality = typeof BOT_PERSONALITIES[number];
export type GameDuration = 'standard' | 'long' | 'short';

export interface GamePlayer {
  id: string;
  socketId: string | null; // null for bots
  name: string;
  selectedDriver?: string; // Driver/character ID selected by the player
  driverConfirmed?: boolean; // Has the player confirmed their driver selection in-game
  isBot: boolean;
  personality?: BotPersonality;
  tokens: number;
  remainingTime: number;
  isEliminated: boolean;
  currentBid: number | null;
  isHolding: boolean;
}

export interface GameState {
  lobbyCode: string;
  players: GamePlayer[];
  round: number;
  totalRounds: number;
  phase: 'driver_selection' | 'waiting_for_ready' | 'countdown' | 'bidding' | 'round_end' | 'game_over';
  roundStartTime: number | null;
  countdownRemaining: number;
  gameDuration: GameDuration;
  initialTime: number;
  roundWinner: { id: string; name: string; bid: number } | null;
  eliminatedThisRound: string[];
}

// Active games storage
const activeGames = new Map<string, GameState>();
const gameIntervals = new Map<string, NodeJS.Timeout>();

// Event emitter callback type
type EmitCallback = (lobbyCode: string, event: string, data: any) => void;
let emitToLobby: EmitCallback | null = null;

export function setEmitCallback(callback: EmitCallback) {
  emitToLobby = callback;
}

function getInitialTime(duration: GameDuration): number {
  switch (duration) {
    case 'long': return LONG_INITIAL_TIME;
    case 'short': return SHORT_INITIAL_TIME;
    default: return STANDARD_INITIAL_TIME;
  }
}

function getTotalRounds(duration: GameDuration): number {
  switch (duration) {
    case 'long': return LONG_TOTAL_ROUNDS;
    case 'short': return SHORT_TOTAL_ROUNDS;
    default: return STANDARD_TOTAL_ROUNDS;
  }
}

export function createGame(
  lobbyCode: string,
  lobbyPlayers: Array<{ id: string; socketId: string; name: string; selectedDriver?: string }>,
  duration: GameDuration = 'standard'
): GameState {
  const initialTime = getInitialTime(duration);
  const totalRounds = getTotalRounds(duration);
  
  // Convert lobby players to game players
  const gamePlayers: GamePlayer[] = lobbyPlayers.map(p => ({
    id: p.id,
    socketId: p.socketId,
    name: p.name,
    selectedDriver: p.selectedDriver,
    isBot: false,
    tokens: 0,
    remainingTime: initialTime,
    isEliminated: false,
    currentBid: null,
    isHolding: false,
  }));
  
  // Auto-fill with bots if less than MIN_PLAYERS
  let botIndex = 0;
  while (gamePlayers.length < MIN_PLAYERS) {
    const personality = BOT_PERSONALITIES[botIndex % BOT_PERSONALITIES.length];
    gamePlayers.push({
      id: `bot_${botIndex}_${Date.now()}`,
      socketId: null,
      name: `${BOT_NAMES[botIndex]} (Bot)`,
      isBot: true,
      personality,
      tokens: 0,
      remainingTime: initialTime,
      isEliminated: false,
      currentBid: null,
      isHolding: false,
    });
    botIndex++;
  }
  
  // Mark bots as having confirmed drivers (they don't need to select)
  gamePlayers.forEach(p => {
    if (p.isBot) {
      p.driverConfirmed = true;
    } else {
      p.driverConfirmed = false;
      // Clear any pre-selected drivers from lobby - players pick fresh in game
      p.selectedDriver = undefined;
    }
  });
  
  const gameState: GameState = {
    lobbyCode,
    players: gamePlayers,
    round: 1,
    totalRounds,
    phase: 'driver_selection', // Start in driver selection phase - humans must pick their driver
    roundStartTime: null,
    countdownRemaining: COUNTDOWN_SECONDS,
    gameDuration: duration,
    initialTime,
    roundWinner: null,
    eliminatedThisRound: [],
  };
  
  activeGames.set(lobbyCode, gameState);
  log(`Game created for lobby ${lobbyCode} with ${gamePlayers.length} players (${lobbyPlayers.length} human, ${gamePlayers.length - lobbyPlayers.length} bots)`, "game");
  
  return gameState;
}

export function startGame(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  log(`Starting game for lobby ${lobbyCode}`, "game");
  // Game starts in driver_selection phase - broadcast state to clients
  broadcastGameState(lobbyCode);
}

// Handle driver selection during driver_selection phase
export function selectDriverInGame(lobbyCode: string, playerId: string, driverId: string): { success: boolean; error?: string } {
  const game = activeGames.get(lobbyCode);
  if (!game) return { success: false, error: "Game not found" };
  
  if (game.phase !== 'driver_selection') {
    return { success: false, error: "Not in driver selection phase" };
  }
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { success: false, error: "Player not found" };
  
  if (player.isBot) return { success: false, error: "Bots cannot select drivers" };
  
  // Check if driver is already taken by another player
  const driverTaken = game.players.some(p => p.id !== playerId && p.selectedDriver === driverId);
  if (driverTaken) {
    return { success: false, error: "Driver already taken" };
  }
  
  player.selectedDriver = driverId;
  broadcastGameState(lobbyCode);
  
  log(`Player ${player.name} selected driver ${driverId} in game ${lobbyCode}`, "game");
  return { success: true };
}

// Handle driver confirmation during driver_selection phase
export function confirmDriverInGame(lobbyCode: string, playerId: string): { success: boolean; error?: string } {
  const game = activeGames.get(lobbyCode);
  if (!game) return { success: false, error: "Game not found" };
  
  if (game.phase !== 'driver_selection') {
    return { success: false, error: "Not in driver selection phase" };
  }
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { success: false, error: "Player not found" };
  
  if (!player.selectedDriver) {
    return { success: false, error: "Must select a driver first" };
  }
  
  player.driverConfirmed = true;
  broadcastGameState(lobbyCode);
  
  log(`Player ${player.name} confirmed driver ${player.selectedDriver} in game ${lobbyCode}`, "game");
  
  // Check if all human players have confirmed
  const allConfirmed = game.players.every(p => p.driverConfirmed);
  if (allConfirmed) {
    log(`All players confirmed drivers in game ${lobbyCode}, starting round 1`, "game");
    startWaitingForReady(lobbyCode);
  }
  
  return { success: true };
}

function startCountdown(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'countdown';
  game.countdownRemaining = COUNTDOWN_SECONDS;
  game.roundWinner = null;
  game.eliminatedThisRound = [];
  
  // Reset bids but preserve holding state from waiting_for_ready
  // Players who were holding continue to hold through countdown
  game.players.forEach(p => {
    if (!p.isEliminated) {
      p.currentBid = null;
      // Don't reset isHolding - preserve from waiting_for_ready phase
    }
  });
  
  broadcastGameState(lobbyCode);
  
  log(`Round ${game.round} countdown started for lobby ${lobbyCode}`, "game");
  
  // Countdown interval
  const interval = setInterval(() => {
    const g = activeGames.get(lobbyCode);
    if (!g) {
      clearInterval(interval);
      return;
    }
    
    g.countdownRemaining--;
    
    if (g.countdownRemaining <= 0) {
      clearInterval(interval);
      startBidding(lobbyCode);
    } else {
      broadcastGameState(lobbyCode);
    }
  }, 1000);
  
  gameIntervals.set(`${lobbyCode}_countdown`, interval);
}

function startBidding(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'bidding';
  game.roundStartTime = Date.now();
  
  // Preserve holding state from countdown/waiting phase
  // Human players who were holding continue holding (must release to lock bid)
  // Bots auto-hold during bidding phase
  game.players.forEach(p => {
    if (!p.isEliminated) {
      // Bots always start holding in bidding phase
      if (p.isBot) {
        p.isHolding = true;
      }
      // Humans preserve their holding state (they must have been holding through countdown)
      p.currentBid = 0;
    }
  });
  
  broadcastGameState(lobbyCode);
  
  log(`Round ${game.round} bidding started for lobby ${lobbyCode}`, "game");
  
  // Bidding tick interval (100ms for smooth updates)
  const interval = setInterval(() => {
    const g = activeGames.get(lobbyCode);
    if (!g || g.phase !== 'bidding') {
      clearInterval(interval);
      return;
    }
    
    const elapsed = (Date.now() - (g.roundStartTime || Date.now())) / 1000;
    
    // Update bids for holding players
    g.players.forEach(p => {
      if (p.isHolding && !p.isEliminated) {
        p.currentBid = elapsed;
        
        // Auto-eliminate if bid exceeds remaining time
        if (p.currentBid >= p.remainingTime) {
          p.isHolding = false;
          p.currentBid = p.remainingTime;
          p.isEliminated = true;
          g.eliminatedThisRound.push(p.id);
          log(`${p.name} eliminated (ran out of time) in lobby ${lobbyCode}`, "game");
        }
      }
    });
    
    // Bot AI: decide when to release
    processBotBids(g);
    
    // Check if round should end (all players released)
    const holdingPlayers = g.players.filter(p => p.isHolding && !p.isEliminated);
    
    // End round when all players have released, but wait at least 0.5s 
    // (to give time for late starters and prevent instant round ends)
    if (holdingPlayers.length === 0 && elapsed > 0.5) {
      clearInterval(interval);
      endRound(lobbyCode);
      return;
    }
    
    broadcastGameState(lobbyCode);
  }, 100);
  
  gameIntervals.set(`${lobbyCode}_bidding`, interval);
}

function processBotBids(game: GameState) {
  const elapsed = (Date.now() - (game.roundStartTime || Date.now())) / 1000;
  
  game.players.forEach(p => {
    if (p.isBot && p.isHolding && !p.isEliminated) {
      const shouldRelease = decideBotRelease(p, elapsed, game);
      if (shouldRelease) {
        p.isHolding = false;
        p.currentBid = elapsed;
        log(`Bot ${p.name} released at ${elapsed.toFixed(1)}s in lobby ${game.lobbyCode}`, "game");
      }
    }
  });
}

function decideBotRelease(bot: GamePlayer, elapsed: number, game: GameState): boolean {
  const maxBid = bot.remainingTime * 0.8; // Don't bid more than 80% of remaining time
  const otherPlayers = game.players.filter(p => p.id !== bot.id && !p.isEliminated);
  const holdingOthers = otherPlayers.filter(p => p.isHolding).length;
  
  // Random base chance increases with time
  const baseChance = elapsed / 30; // 3.3% per second base
  
  switch (bot.personality) {
    case 'aggressive':
      // Hold longer, only release if really pushed
      if (elapsed > maxBid) return true;
      if (holdingOthers === 0) return true;
      return Math.random() < baseChance * 0.3;
      
    case 'conservative':
      // Release early
      if (elapsed > 5) return Math.random() < baseChance * 2;
      if (elapsed > maxBid * 0.5) return true;
      return Math.random() < baseChance * 1.5;
      
    case 'random':
      // Unpredictable
      if (elapsed > maxBid) return true;
      return Math.random() < baseChance * (0.5 + Math.random());
      
    case 'balanced':
    default:
      // Moderate strategy
      if (elapsed > maxBid) return true;
      if (holdingOthers === 0) return true;
      return Math.random() < baseChance;
  }
}

function endRound(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'round_end';
  
  // Find winner (highest bid among non-eliminated)
  const participants = game.players.filter(p => p.currentBid !== null && p.currentBid > 0 && !game.eliminatedThisRound.includes(p.id));
  
  if (participants.length > 0) {
    const winner = participants.reduce((max, p) => (p.currentBid || 0) > (max.currentBid || 0) ? p : max);
    game.roundWinner = { id: winner.id, name: winner.name, bid: winner.currentBid || 0 };
    
    // Award token and deduct time
    winner.tokens++;
    
    log(`Round ${game.round} winner: ${winner.name} with bid of ${winner.currentBid?.toFixed(1)}s`, "game");
  }
  
  // Deduct bids from all participants' remaining time
  game.players.forEach(p => {
    if (p.currentBid && p.currentBid > 0) {
      p.remainingTime -= p.currentBid;
      if (p.remainingTime <= 0) {
        p.remainingTime = 0;
        p.isEliminated = true;
        if (!game.eliminatedThisRound.includes(p.id)) {
          game.eliminatedThisRound.push(p.id);
        }
      }
    }
  });
  
  broadcastGameState(lobbyCode);
  
  // Check for game over
  const activePlayers = game.players.filter(p => !p.isEliminated);
  if (activePlayers.length <= 1 || game.round >= game.totalRounds) {
    setTimeout(() => endGame(lobbyCode), 3000);
  } else {
    // Start next round after delay - go to waiting_for_ready phase
    setTimeout(() => {
      game.round++;
      startWaitingForReady(lobbyCode);
    }, 3000);
  }
}

// Start the waiting_for_ready phase (used for each round)
function startWaitingForReady(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'waiting_for_ready';
  game.roundWinner = null;
  game.eliminatedThisRound = [];
  
  // Reset all player holding/bid status for new round
  game.players.forEach(p => {
    if (!p.isEliminated) {
      p.isHolding = false;
      p.currentBid = null;
    }
  });
  
  broadcastGameState(lobbyCode);
  
  log(`Round ${game.round} waiting for ready in lobby ${lobbyCode}`, "game");
  
  // Check periodically if all humans are ready
  const readyCheckInterval = setInterval(() => {
    const g = activeGames.get(lobbyCode);
    if (!g || g.phase !== 'waiting_for_ready') {
      clearInterval(readyCheckInterval);
      return;
    }
    
    // Check if all non-eliminated human players are holding
    const humanPlayers = g.players.filter(p => !p.isBot && !p.isEliminated);
    const allHumansHolding = humanPlayers.every(p => p.isHolding);
    
    if (allHumansHolding && humanPlayers.length > 0) {
      clearInterval(readyCheckInterval);
      log(`All human players ready in lobby ${lobbyCode}, starting countdown`, "game");
      startCountdown(lobbyCode);
    }
  }, 100);
  
  gameIntervals.set(`${lobbyCode}_ready_check`, readyCheckInterval);
}

function endGame(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'game_over';
  
  // Sort players by tokens (descending), then by remaining time
  game.players.sort((a, b) => {
    if (b.tokens !== a.tokens) return b.tokens - a.tokens;
    return b.remainingTime - a.remainingTime;
  });
  
  log(`Game over for lobby ${lobbyCode}. Winner: ${game.players[0]?.name}`, "game");
  
  broadcastGameState(lobbyCode);
  
  // Cleanup
  clearGameIntervals(lobbyCode);
}

// Player presses button to start holding (ready to bid)
export function playerPressBid(lobbyCode: string, socketId: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  const player = game.players.find(p => p.socketId === socketId);
  if (!player || player.isEliminated) return;
  
  // During waiting_for_ready phase: player is pressing to indicate ready
  if (game.phase === 'waiting_for_ready') {
    player.isHolding = true;
    log(`${player.name} pressed (ready) during waiting phase in lobby ${lobbyCode}`, "game");
    broadcastGameState(lobbyCode);
    return;
  }
  
  // During countdown: player continues holding
  if (game.phase === 'countdown') {
    player.isHolding = true;
    log(`${player.name} pressed during countdown in lobby ${lobbyCode}`, "game");
    broadcastGameState(lobbyCode);
    return;
  }
  
  // During bidding: already handled by startBidding (all players start holding)
  if (game.phase === 'bidding' && !player.isHolding) {
    // Re-press during bidding means nothing - can't rejoin after release
    return;
  }
}

export function playerReleaseBid(lobbyCode: string, socketId: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  const player = game.players.find(p => p.socketId === socketId);
  if (!player || player.isEliminated) return;
  
  // During waiting_for_ready: releasing means not ready
  if (game.phase === 'waiting_for_ready') {
    player.isHolding = false;
    log(`${player.name} released (not ready) during waiting phase in lobby ${lobbyCode}`, "game");
    broadcastGameState(lobbyCode);
    return;
  }
  
  // During countdown: releasing means abandoning this round
  if (game.phase === 'countdown') {
    player.isHolding = false;
    log(`${player.name} released during countdown in lobby ${lobbyCode}`, "game");
    broadcastGameState(lobbyCode);
    return;
  }
  
  // During bidding: lock in the bid
  if (game.phase === 'bidding' && player.isHolding) {
    const elapsed = (Date.now() - (game.roundStartTime || Date.now())) / 1000;
    player.isHolding = false;
    player.currentBid = elapsed;
    
    log(`${player.name} released at ${elapsed.toFixed(1)}s in lobby ${lobbyCode}`, "game");
    
    // Broadcast immediately
    broadcastGameState(lobbyCode);
  }
}

export function getGameState(lobbyCode: string): GameState | undefined {
  return activeGames.get(lobbyCode);
}

export function removePlayerFromGame(socketId: string) {
  activeGames.forEach((game: GameState, lobbyCode: string) => {
    const player = game.players.find((p: GamePlayer) => p.socketId === socketId);
    if (player) {
      player.isEliminated = true;
      player.isHolding = false;
      log(`${player.name} left game ${lobbyCode}`, "game");
      broadcastGameState(lobbyCode);
      
      // Check if game should end
      const activePlayers = game.players.filter((p: GamePlayer) => !p.isEliminated && !p.isBot);
      if (activePlayers.length === 0) {
        log(`All human players left game ${lobbyCode}, ending game`, "game");
        endGame(lobbyCode);
      }
    }
  });
}

export function cleanupGame(lobbyCode: string) {
  clearGameIntervals(lobbyCode);
  activeGames.delete(lobbyCode);
  log(`Game ${lobbyCode} cleaned up`, "game");
}

function clearGameIntervals(lobbyCode: string) {
  const readyCheckInterval = gameIntervals.get(`${lobbyCode}_ready_check`);
  const countdownInterval = gameIntervals.get(`${lobbyCode}_countdown`);
  const biddingInterval = gameIntervals.get(`${lobbyCode}_bidding`);
  
  if (readyCheckInterval) clearInterval(readyCheckInterval);
  if (countdownInterval) clearInterval(countdownInterval);
  if (biddingInterval) clearInterval(biddingInterval);
  
  gameIntervals.delete(`${lobbyCode}_ready_check`);
  gameIntervals.delete(`${lobbyCode}_countdown`);
  gameIntervals.delete(`${lobbyCode}_bidding`);
}

function broadcastGameState(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game || !emitToLobby) return;
  
  // Calculate elapsed time since round start for bidding phase
  const elapsedTime = game.roundStartTime && game.phase === 'bidding' 
    ? (Date.now() - game.roundStartTime) / 1000 
    : 0;
  
  // Send sanitized game state to all players
  const stateForClients = {
    round: game.round,
    totalRounds: game.totalRounds,
    phase: game.phase,
    countdownRemaining: game.countdownRemaining,
    elapsedTime: elapsedTime, // Server-authoritative elapsed time
    players: game.players.map(p => ({
      id: p.id,
      socketId: p.socketId,
      name: p.name,
      selectedDriver: p.selectedDriver,
      driverConfirmed: p.driverConfirmed,
      isBot: p.isBot,
      tokens: p.tokens,
      remainingTime: p.remainingTime,
      isEliminated: p.isEliminated,
      currentBid: p.currentBid,
      isHolding: p.isHolding,
    })),
    roundWinner: game.roundWinner,
    eliminatedThisRound: game.eliminatedThisRound,
  };
  
  emitToLobby(lobbyCode, 'game_state', stateForClients);
}
