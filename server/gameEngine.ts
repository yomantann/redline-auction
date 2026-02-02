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
  phase: 'countdown' | 'bidding' | 'round_end' | 'game_over';
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
  lobbyPlayers: Array<{ id: string; socketId: string; name: string }>,
  duration: GameDuration = 'standard'
): GameState {
  const initialTime = getInitialTime(duration);
  const totalRounds = getTotalRounds(duration);
  
  // Convert lobby players to game players
  const gamePlayers: GamePlayer[] = lobbyPlayers.map(p => ({
    id: p.id,
    socketId: p.socketId,
    name: p.name,
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
  
  const gameState: GameState = {
    lobbyCode,
    players: gamePlayers,
    round: 1,
    totalRounds,
    phase: 'countdown',
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
  startCountdown(lobbyCode);
}

function startCountdown(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'countdown';
  game.countdownRemaining = COUNTDOWN_SECONDS;
  game.roundWinner = null;
  game.eliminatedThisRound = [];
  
  // Reset all player bids and holding status
  game.players.forEach(p => {
    if (!p.isEliminated) {
      p.currentBid = null;
      p.isHolding = false;
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
  
  // All non-eliminated players start holding
  game.players.forEach(p => {
    if (!p.isEliminated) {
      p.isHolding = true;
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
    if (holdingPlayers.length === 0) {
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
    // Start next round after delay
    setTimeout(() => {
      game.round++;
      startCountdown(lobbyCode);
    }, 3000);
  }
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
  
  // During countdown: player is indicating they're ready
  if (game.phase === 'countdown') {
    player.isHolding = true;
    log(`${player.name} pressed (ready) during countdown in lobby ${lobbyCode}`, "game");
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
  
  // During countdown: releasing means not ready/abandoning
  if (game.phase === 'countdown') {
    player.isHolding = false;
    log(`${player.name} released (not ready) during countdown in lobby ${lobbyCode}`, "game");
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
  const countdownInterval = gameIntervals.get(`${lobbyCode}_countdown`);
  const biddingInterval = gameIntervals.get(`${lobbyCode}_bidding`);
  
  if (countdownInterval) clearInterval(countdownInterval);
  if (biddingInterval) clearInterval(biddingInterval);
  
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
