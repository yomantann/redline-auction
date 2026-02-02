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

// Min bid / penalty based on game duration
function getMinBidPenalty(duration: GameDuration): number {
  switch (duration) {
    case 'short': return 1.0;  // Sprint: 1s min bid
    case 'long': return 4.0;   // Marathon: 4s min bid
    default: return 2.0;       // Standard: 2s min bid
  }
}

// Bot names for auto-fill
const BOT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];
const BOT_PERSONALITIES = ['aggressive', 'conservative', 'random', 'balanced'] as const;

// Character/Driver IDs by variant for bot random assignment
// These match the client-side character definitions - all variants use base characters
// plus variant-specific characters defined in SOCIAL_CHARACTERS and BIO_CHARACTERS
const STANDARD_DRIVER_IDS = [
  'harambe', 'popcat', 'winter', 'pepe', 'nyan', 'karen', 'fine', 'bf', 
  'rat', 'baldwin', 'sigma', 'gigachad', 'thinker', 'disaster', 'buttons', 'primate', 'harold'
];
// Social mode adds: prom_king, idol_core from SOCIAL_CHARACTERS
const SOCIAL_DRIVER_IDS = [
  'prom_king', 'idol_core'
];
// Bio mode adds: tank, danger_zone from BIO_CHARACTERS
const BIO_DRIVER_IDS = [
  'tank', 'danger_zone'
];

// Driver ID to display name mapping (matches client-side character names)
const DRIVER_NAMES: Record<string, string> = {
  'harambe': 'Guardian H',
  'popcat': 'Click-Click',
  'winter': 'Frostbyte',
  'pepe': 'Sadman Logic',
  'nyan': 'Rainbow Dash',
  'karen': 'The Accuser',
  'fine': 'Low Flame',
  'bf': 'Wandering Eye',
  'rat': 'The Rind',
  'baldwin': 'The Anointed',
  'sigma': 'Executive P',
  'gigachad': 'Alpha Prime',
  'thinker': 'Roll Safe',
  'disaster': 'Hotwired',
  'buttons': 'Panic Bot',
  'primate': 'Primate Prime',
  'harold': 'Pain Hider',
  'prom_king': 'Prom King',
  'idol_core': 'Idol Core',
  'tank': 'The Tank',
  'danger_zone': 'Danger Zone'
};

export type BotPersonality = typeof BOT_PERSONALITIES[number];
export type GameDuration = 'standard' | 'long' | 'short';
export type GameVariant = 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';
export type ProtocolType = 
  | 'DATA_BLACKOUT' | 'DOUBLE_STAKES' | 'SYSTEM_FAILURE' 
  | 'OPEN_HAND' | 'MUTE_PROTOCOL' 
  | 'PRIVATE_CHANNEL' | 'NO_LOOK' | 'LOCK_ON' 
  | 'THE_MOLE' | 'PANIC_ROOM' 
  | 'UNDERDOG_VICTORY' | 'TIME_TAX'
  | 'TRUTH_DARE' | 'SWITCH_SEATS' | 'HUM_TUNE' | 'NOISE_CANCEL'
  | 'HYDRATE' | 'BOTTOMS_UP' | 'PARTNER_DRINK' | 'WATER_ROUND'
  | null;

// Protocol pools by variant
const STANDARD_PROTOCOLS: ProtocolType[] = [
  'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
  'OPEN_HAND', 'MUTE_PROTOCOL', 'PRIVATE_CHANNEL', 
  'NO_LOOK', 'THE_MOLE', 'PANIC_ROOM',
  'UNDERDOG_VICTORY', 'TIME_TAX'
];

const SOCIAL_PROTOCOLS: ProtocolType[] = [
  'TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'
];

const BIO_PROTOCOLS: ProtocolType[] = [
  'HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'
];

// Driver/Character ability definitions (minimal for server-side processing)
type AbilityEffect = 'TIME_REFUND' | 'TOKEN_BOOST' | 'DISRUPT' | 'PEEK';

interface DriverAbility {
  name: string;
  effect: AbilityEffect;
  triggerCondition: 'WIN' | 'LOSE' | 'ALWAYS' | 'CONDITIONAL';
  refundAmount?: number;
  description: string;
}

const DRIVER_ABILITIES: Record<string, DriverAbility> = {
  // Standard Mode Drivers - IDs match client character definitions
  'harambe': { name: 'SPIRIT SHIELD', effect: 'TIME_REFUND', triggerCondition: 'WIN', refundAmount: 11, description: '+11s if you win Round 1' },
  'popcat': { name: 'HYPER CLICK', effect: 'TOKEN_BOOST', triggerCondition: 'CONDITIONAL', description: '+1 token if close win (within 1.1s of 2nd)' },
  'winter': { name: 'CYRO FREEZE', effect: 'TIME_REFUND', triggerCondition: 'ALWAYS', refundAmount: 1.0, description: '+1.0s every round' },
  'pepe': { name: 'SAD REVEAL', effect: 'PEEK', triggerCondition: 'CONDITIONAL', description: 'See opponent holding' },
  'nyan': { name: 'RAINBOW RUN', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', refundAmount: 3.5, description: '+3.5s if bid > 40s' },
  'karen': { name: 'MANAGER CALL', effect: 'DISRUPT', triggerCondition: 'ALWAYS', refundAmount: -2, description: '-2s from random opponent' },
  'fine': { name: 'FIRE WALL', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', description: 'Immune to protocols' },
  'bf': { name: 'SNEAK PEEK', effect: 'PEEK', triggerCondition: 'CONDITIONAL', description: 'See random opponent holding' },
  'rat': { name: 'CHEESE TAX', effect: 'DISRUPT', triggerCondition: 'LOSE', refundAmount: 2, description: 'Steal 2s from winner' },
  'baldwin': { name: 'ROYAL DECREE', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', refundAmount: 4, description: '+4s if bid near 20s' },
  'sigma': { name: 'AXE SWING', effect: 'DISRUPT', triggerCondition: 'ALWAYS', refundAmount: -2, description: '-2s from player with most time' },
  'gigachad': { name: 'JAWLINE', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', description: 'No penalty during countdown' },
  'thinker': { name: 'CALCULATED', effect: 'PEEK', triggerCondition: 'ALWAYS', description: 'Immune to abilities' },
  'disaster': { name: 'BURN IT', effect: 'DISRUPT', triggerCondition: 'ALWAYS', refundAmount: -1, description: '-1s from everyone else' },
  'buttons': { name: 'PANIC MASH', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', description: '50% +3s, 50% -3s' },
  'primate': { name: 'CHEF SPECIAL', effect: 'TOKEN_BOOST', triggerCondition: 'CONDITIONAL', description: '+1 token if comeback win' },
  'harold': { name: 'PAIN HIDE', effect: 'TIME_REFUND', triggerCondition: 'WIN', refundAmount: 0.5, description: '+0.5s per win' },
  'tank': { name: 'IRON STOMACH', effect: 'TIME_REFUND', triggerCondition: 'ALWAYS', refundAmount: 0, description: 'Immune to drink penalties' },
};

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
  // Round statistics
  totalTimeBid: number;
  roundImpact?: { type: string; value: number; source: string };
  netImpact: number; // Cumulative time impact from abilities/protocols (not bids)
  abilityUsed: boolean;
  penaltyAppliedThisRound?: boolean; // Track if penalty was already applied this round
}

export interface GameLogEntry {
  round: number;
  type: 'bid' | 'elimination' | 'win' | 'protocol' | 'ability' | 'impact';
  playerId?: string;
  playerName?: string;
  message: string;
  value?: number;
  timestamp: number;
}

export interface GameSettings {
  difficulty: 'CASUAL' | 'COMPETITIVE';
  protocolsEnabled: boolean;
  abilitiesEnabled: boolean;
  variant: GameVariant;
  gameDuration: GameDuration;
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
  // New fields for multiplayer parity
  settings: GameSettings;
  activeProtocol: ProtocolType;
  protocolHistory: ProtocolType[];
  gameLog: GameLogEntry[];
  isDoubleTokensRound: boolean;
  molePlayerId: string | null;
  allHumansHoldingStartTime: number | null; // Track when all humans started holding
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
  duration: GameDuration = 'standard',
  lobbySettings?: Partial<GameSettings>
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
    totalTimeBid: 0,
    netImpact: 0,
    abilityUsed: false,
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
      totalTimeBid: 0,
      netImpact: 0,
      abilityUsed: false,
    });
    botIndex++;
  }
  
  // Bots will get drivers assigned AFTER all human players have confirmed
  // This is handled in confirmDriverInGame when all humans are done
  gamePlayers.forEach(p => {
    p.driverConfirmed = false;
    p.selectedDriver = undefined;
  });
  
  // Merge lobby settings with defaults
  // Map duration: server receives 'sprint' from client, but also accept 'short' for compatibility
  const rawDuration = lobbySettings?.gameDuration as string | undefined;
  const mappedDuration: GameDuration = (rawDuration === 'sprint' || rawDuration === 'short') 
    ? 'short' 
    : (rawDuration === 'long' ? 'long' : 'standard');
  
  const settings: GameSettings = {
    difficulty: lobbySettings?.difficulty || 'CASUAL',
    protocolsEnabled: lobbySettings?.protocolsEnabled || false,
    abilitiesEnabled: lobbySettings?.abilitiesEnabled || false,
    variant: lobbySettings?.variant || 'STANDARD',
    gameDuration: mappedDuration,
  };
  
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
    settings,
    activeProtocol: null,
    protocolHistory: [],
    gameLog: [],
    isDoubleTokensRound: false,
    molePlayerId: null,
    allHumansHoldingStartTime: null,
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
  
  // Check if all HUMAN players have confirmed - then assign drivers to bots
  const humanPlayers = game.players.filter(p => !p.isBot);
  const allHumansConfirmed = humanPlayers.every(p => p.driverConfirmed);
  
  if (allHumansConfirmed) {
    // Now assign random drivers to bots
    const variant = game.settings.variant || 'STANDARD';
    const availableDrivers = [
      ...STANDARD_DRIVER_IDS,
      ...(variant === 'SOCIAL_OVERDRIVE' ? SOCIAL_DRIVER_IDS : []),
      ...(variant === 'BIO_FUEL' ? BIO_DRIVER_IDS : [])
    ];
    
    // Get drivers already taken by humans
    const usedDrivers = game.players
      .filter(p => p.selectedDriver)
      .map(p => p.selectedDriver!);
    
    game.players.forEach(p => {
      if (p.isBot) {
        const unusedDrivers = availableDrivers.filter(d => !usedDrivers.includes(d));
        if (unusedDrivers.length > 0) {
          const randomDriver = unusedDrivers[Math.floor(Math.random() * unusedDrivers.length)];
          p.selectedDriver = randomDriver;
          // Update bot name to be the driver name
          p.name = DRIVER_NAMES[randomDriver] || randomDriver;
          usedDrivers.push(randomDriver);
        }
        p.driverConfirmed = true;
      }
    });
    
    broadcastGameState(lobbyCode);
    log(`All human players confirmed, bots assigned drivers in game ${lobbyCode}, starting round 1`, "game");
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
    
    // Update bids for holding players (include min bid offset)
    const minBid = getMinBidPenalty(g.gameDuration);
    g.players.forEach(p => {
      if (p.isHolding && !p.isEliminated) {
        p.currentBid = elapsed + minBid; // Bid starts at min bid value
        
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
  
  // Random base chance increases with time - with more variance
  const baseChance = elapsed / 30; // 3.3% per second base
  
  // Add per-bot random offset to make timing less predictable
  const botVariance = (Math.random() - 0.5) * 2; // -1 to +1 random offset each check
  const varianceMultiplier = 0.5 + Math.random(); // 0.5x to 1.5x multiplier
  
  // Minimum wait time before bots consider releasing (2-6 seconds based on personality)
  const minWaitByPersonality = {
    aggressive: 6 + Math.random() * 4,
    conservative: 2 + Math.random() * 2,
    random: 1 + Math.random() * 5,
    balanced: 3 + Math.random() * 3,
  };
  const minWait = minWaitByPersonality[bot.personality || 'balanced'];
  
  // Don't even consider releasing before minimum wait
  if (elapsed < minWait) return false;
  
  switch (bot.personality) {
    case 'aggressive':
      // Hold longer, only release if really pushed - with more variance
      if (elapsed > maxBid) return true;
      if (holdingOthers === 0 && Math.random() > 0.3) return true; // 70% chance to release when alone
      return Math.random() < (baseChance * 0.3 * varianceMultiplier);
      
    case 'conservative':
      // Release early - with variance
      if (elapsed > 5 + botVariance * 2) return Math.random() < baseChance * 2 * varianceMultiplier;
      if (elapsed > maxBid * 0.5) return Math.random() > 0.3; // 70% chance
      return Math.random() < (baseChance * 1.5 * varianceMultiplier);
      
    case 'random':
      // Unpredictable - maximum variance
      if (elapsed > maxBid) return true;
      return Math.random() < (baseChance * (0.3 + Math.random() * 1.4)); // Very wide range
      
    case 'balanced':
    default:
      // Moderate strategy - with some variance
      if (elapsed > maxBid) return true;
      if (holdingOthers === 0 && Math.random() > 0.4) return true; // 60% chance
      return Math.random() < (baseChance * varianceMultiplier);
  }
}

// Process driver abilities at end of round
function processAbilities(game: GameState, winnerId: string | null) {
  if (!game.settings.abilitiesEnabled) return;
  
  const abilityImpacts: Array<{ playerId: string; targetId?: string; ability: string; effect: string; value: number }> = [];
  
  // Find the "Thinker" player who is immune to abilities
  const thinkerPlayer = game.players.find(p => p.selectedDriver === 'thinker' && !p.isEliminated);
  const immunePlayerIds = thinkerPlayer ? [thinkerPlayer.id] : [];
  
  // Find winner and 2nd place for HYPER CLICK check
  const sortedByBid = [...game.players]
    .filter(p => p.currentBid !== null && !p.isEliminated)
    .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
  const winnerBid = sortedByBid[0]?.currentBid || 0;
  const secondBid = sortedByBid[1]?.currentBid || 0;
  const winMargin = winnerBid - secondBid;
  
  game.players.forEach(player => {
    if (player.isEliminated || !player.selectedDriver) return;
    
    const ability = DRIVER_ABILITIES[player.selectedDriver];
    if (!ability) return;
    
    const isWinner = player.id === winnerId;
    const playerBid = player.currentBid || 0;
    
    // Check if ability should trigger
    let triggered = false;
    let refundAmount = ability.refundAmount || 0;
    let targetId: string | undefined;
    
    switch (ability.triggerCondition) {
      case 'WIN':
        if (isWinner) {
          // Special case for Spirit Shield (harambe) - only Round 1
          if (player.selectedDriver === 'harambe' && game.round !== 1) break;
          triggered = true;
        }
        break;
        
      case 'LOSE':
        if (!isWinner && winnerId) {
          triggered = true;
          targetId = winnerId;
        }
        break;
        
      case 'ALWAYS':
        triggered = true;
        break;
        
      case 'CONDITIONAL':
        // Handle specific conditional abilities with correct driver IDs
        if (player.selectedDriver === 'nyan' && playerBid > 40) {
          // Rainbow Run: +3.5s if bid > 40s
          triggered = true;
        } else if (player.selectedDriver === 'baldwin' && Math.abs(playerBid - 20) <= 0.5) {
          // Royal Decree: +4s if bid near 20s
          triggered = true;
        } else if (player.selectedDriver === 'buttons') {
          // Panic Mash: 50% chance +3s or -3s
          triggered = true;
          refundAmount = Math.random() < 0.5 ? 3 : -3;
        } else if (player.selectedDriver === 'popcat' && isWinner && sortedByBid.length >= 2 && winMargin <= 1.1 && winMargin > 0) {
          // Hyper Click: +1 token if win within 1.1s of 2nd place (requires valid 2nd place)
          triggered = true;
        } else if (player.selectedDriver === 'primate' && isWinner) {
          // Chef Special: +1 token if comeback win (had fewer tokens)
          const othersTokens = game.players.filter(p => p.id !== player.id && !p.isEliminated).map(p => p.tokens);
          if (othersTokens.length > 0 && player.tokens < Math.max(...othersTokens)) {
            triggered = true;
          }
        }
        break;
    }
    
    if (!triggered) return;
    
    // Mark ability as used
    player.abilityUsed = true;
    
    // Apply the ability effect
    switch (ability.effect) {
      case 'TIME_REFUND':
        if (refundAmount !== 0) {
          player.remainingTime += refundAmount;
          player.netImpact += refundAmount; // Accumulate into total
          player.roundImpact = { type: 'REFUND', value: refundAmount, source: ability.name };
          abilityImpacts.push({
            playerId: player.id,
            ability: ability.name,
            effect: 'TIME_REFUND',
            value: refundAmount,
          });
          addGameLogEntry(game, {
            type: 'ability',
            playerId: player.id,
            playerName: player.name,
            message: `${player.name} triggered ${ability.name}: ${refundAmount > 0 ? '+' : ''}${refundAmount.toFixed(1)}s`,
            value: refundAmount,
          });
        }
        break;
        
      case 'TOKEN_BOOST':
        player.tokens += 1;
        abilityImpacts.push({
          playerId: player.id,
          ability: ability.name,
          effect: 'TOKEN_BOOST',
          value: 1,
        });
        addGameLogEntry(game, {
          type: 'ability',
          playerId: player.id,
          playerName: player.name,
          message: `${player.name} triggered ${ability.name}: +1 token`,
          value: 1,
        });
        break;
        
      case 'DISRUPT':
        if (refundAmount !== 0) {
          // Find target based on ability type
          let target: GamePlayer | undefined;
          
          if (player.selectedDriver === 'rat' && targetId) {
            // Cheese Tax: target the winner
            target = game.players.find(p => p.id === targetId);
          } else if (player.selectedDriver === 'sigma') {
            // Axe Swing: target player with most time
            const nonEliminated = game.players.filter(p => p.id !== player.id && !p.isEliminated && !immunePlayerIds.includes(p.id));
            target = nonEliminated.reduce((max, p) => p.remainingTime > (max?.remainingTime || 0) ? p : max, undefined as GamePlayer | undefined);
          } else if (player.selectedDriver === 'karen' || player.selectedDriver === 'disaster') {
            // Manager Call / Burn It: random opponents or all
            const targets = game.players.filter(p => p.id !== player.id && !p.isEliminated && !immunePlayerIds.includes(p.id));
            if (player.selectedDriver === 'disaster') {
              // Burn It: affects all others
              targets.forEach(t => {
                t.remainingTime += refundAmount;
                t.netImpact += refundAmount; // Accumulate into total
                t.roundImpact = { type: 'DISRUPT', value: refundAmount, source: ability.name };
                abilityImpacts.push({
                  playerId: player.id,
                  targetId: t.id,
                  ability: ability.name,
                  effect: 'DISRUPT',
                  value: refundAmount,
                });
              });
              if (targets.length > 0) {
                addGameLogEntry(game, {
                  type: 'ability',
                  playerId: player.id,
                  playerName: player.name,
                  message: `${player.name} triggered ${ability.name}: ${refundAmount}s to all opponents`,
                  value: refundAmount,
                });
              }
              return; // Already handled all targets
            } else {
              target = targets[Math.floor(Math.random() * targets.length)];
            }
          }
          
          if (target && !immunePlayerIds.includes(target.id)) {
            // For Cheese Tax (LOSE trigger), we ADD to self and REMOVE from target
            if (player.selectedDriver === 'rat') {
              player.remainingTime += Math.abs(refundAmount);
              player.netImpact += Math.abs(refundAmount); // Accumulate into total
              player.roundImpact = { type: 'STEAL', value: Math.abs(refundAmount), source: ability.name };
              target.remainingTime -= Math.abs(refundAmount);
              target.netImpact -= Math.abs(refundAmount); // Accumulate into total
              target.roundImpact = { type: 'STOLEN', value: -Math.abs(refundAmount), source: ability.name };
            } else {
              target.remainingTime += refundAmount; // negative value
              target.netImpact += refundAmount; // Accumulate into total (negative)
              target.roundImpact = { type: 'DISRUPT', value: refundAmount, source: ability.name };
            }
            
            abilityImpacts.push({
              playerId: player.id,
              targetId: target.id,
              ability: ability.name,
              effect: 'DISRUPT',
              value: refundAmount,
            });
            addGameLogEntry(game, {
              type: 'ability',
              playerId: player.id,
              playerName: player.name,
              message: `${player.name} triggered ${ability.name}: ${refundAmount}s to ${target.name}`,
              value: refundAmount,
            });
          }
        }
        break;
    }
  });
  
  return abilityImpacts;
}

function endRound(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'round_end';
  
  // Find winner (highest bid among non-eliminated)
  const participants = game.players.filter(p => p.currentBid !== null && p.currentBid > 0 && !game.eliminatedThisRound.includes(p.id));
  
  let winnerId: string | null = null;
  
  if (participants.length > 0) {
    const winner = participants.reduce((max, p) => (p.currentBid || 0) > (max.currentBid || 0) ? p : max);
    winnerId = winner.id;
    game.roundWinner = { id: winner.id, name: winner.name, bid: winner.currentBid || 0 };
    
    // Award token(s) - double if DOUBLE_STAKES protocol is active
    const tokensAwarded = game.isDoubleTokensRound ? 2 : 1;
    winner.tokens += tokensAwarded;
    
    addGameLogEntry(game, {
      type: 'win',
      playerId: winner.id,
      playerName: winner.name,
      message: `${winner.name} won round ${game.round} with ${winner.currentBid?.toFixed(1)}s bid${game.isDoubleTokensRound ? ' (2x tokens!)' : ''}`,
      value: winner.currentBid || 0,
    });
    
    log(`Round ${game.round} winner: ${winner.name} with bid of ${winner.currentBid?.toFixed(1)}s${game.isDoubleTokensRound ? ' (DOUBLE STAKES)' : ''}`, "game");
  } else {
    addGameLogEntry(game, {
      type: 'win',
      message: `Round ${game.round} had no winner`,
    });
  }
  
  // Handle SECRET PROTOCOLS (UNDERDOG_VICTORY, TIME_TAX) - revealed at round end
  if (game.activeProtocol === 'UNDERDOG_VICTORY') {
    // Find lowest bidder with valid bid (>= min bid) who is not eliminated
    const minBid = getMinBidPenalty(game.settings.gameDuration);
    const eligible = game.players.filter(p => !p.isEliminated && p.currentBid !== null && p.currentBid >= minBid);
    eligible.sort((a, b) => (a.currentBid || 0) - (b.currentBid || 0));
    
    if (eligible.length > 0) {
      const underdog = eligible[0];
      underdog.tokens += 1;
      addGameLogEntry(game, {
        type: 'protocol',
        playerId: underdog.id,
        playerName: underdog.name,
        message: `SECRET REVEALED: UNDERDOG VICTORY! ${underdog.name} wins +1 token for lowest bid!`,
        value: 1,
      });
      log(`UNDERDOG_VICTORY: ${underdog.name} awarded +1 token for lowest bid in lobby ${game.lobbyCode}`, "game");
    }
  }
  
  if (game.activeProtocol === 'TIME_TAX') {
    // Deduct 10s from all non-eliminated players
    game.players.forEach(p => {
      if (!p.isEliminated && p.remainingTime > 0) {
        p.remainingTime = Math.max(0, p.remainingTime - 10);
        p.netImpact -= 10; // Track protocol impact
        if (p.remainingTime === 0) {
          p.isEliminated = true;
          if (!game.eliminatedThisRound.includes(p.id)) {
            game.eliminatedThisRound.push(p.id);
          }
        }
      }
    });
    addGameLogEntry(game, {
      type: 'protocol',
      message: `SECRET REVEALED: TIME TAX! -10s to all survivors!`,
      value: -10,
    });
    log(`TIME_TAX: -10s to all survivors in lobby ${game.lobbyCode}`, "game");
  }
  
  // Process abilities before time deduction (allows for refunds)
  processAbilities(game, winnerId);
  
  // Check for eliminations from ability effects (clamp and eliminate players with <= 0 time)
  game.players.forEach(p => {
    if (p.remainingTime < 0) {
      p.remainingTime = 0;
    }
    if (p.remainingTime === 0 && !p.isEliminated) {
      p.isEliminated = true;
      if (!game.eliminatedThisRound.includes(p.id)) {
        game.eliminatedThisRound.push(p.id);
        addGameLogEntry(game, {
          type: 'elimination',
          playerId: p.id,
          playerName: p.name,
          message: `${p.name} was eliminated (ability effect)`,
        });
        log(`${p.name} eliminated by ability effect in lobby ${game.lobbyCode}`, "game");
      }
    }
  });
  
  // Log all bids and deduct time
  game.players.forEach(p => {
    if (p.currentBid && p.currentBid > 0) {
      // Track total time bid for stats
      p.totalTimeBid += p.currentBid;
      
      addGameLogEntry(game, {
        type: 'bid',
        playerId: p.id,
        playerName: p.name,
        message: `${p.name} bid ${p.currentBid.toFixed(1)}s`,
        value: p.currentBid,
      });
      
      p.remainingTime -= p.currentBid;
      if (p.remainingTime <= 0) {
        p.remainingTime = 0;
        p.isEliminated = true;
        if (!game.eliminatedThisRound.includes(p.id)) {
          game.eliminatedThisRound.push(p.id);
          addGameLogEntry(game, {
            type: 'elimination',
            playerId: p.id,
            playerName: p.name,
            message: `${p.name} was eliminated (ran out of time)`,
          });
        }
      }
    }
  });
  
  broadcastGameState(lobbyCode);
  
  // Mark all players as not acknowledged for round end
  game.players.forEach(p => {
    if (!p.isBot && !p.isEliminated) {
      (p as any).roundEndAcknowledged = false;
    } else {
      // Bots and eliminated players auto-acknowledge
      (p as any).roundEndAcknowledged = true;
    }
  });
  
  // Check for game over - wait for player acknowledgment instead of auto-advancing
  const activePlayers = game.players.filter(p => !p.isEliminated);
  if (activePlayers.length <= 1 || game.round >= game.totalRounds) {
    // For game over, we can still auto-advance after a short delay
    setTimeout(() => endGame(lobbyCode), 3000);
  }
  // Otherwise, wait for players to acknowledge round end (via player_ready_next event)
}

// Select a random protocol for the round based on variant and settings
function selectProtocolForRound(game: GameState): ProtocolType {
  if (!game.settings.protocolsEnabled) return null;
  
  // 50% chance of no protocol for variety
  if (Math.random() < 0.5) return null;
  
  let protocolPool: ProtocolType[] = [];
  
  switch (game.settings.variant) {
    case 'SOCIAL_OVERDRIVE':
      protocolPool = [...SOCIAL_PROTOCOLS];
      break;
    case 'BIO_FUEL':
      protocolPool = [...BIO_PROTOCOLS];
      break;
    case 'STANDARD':
    default:
      protocolPool = [...STANDARD_PROTOCOLS];
      break;
  }
  
  // Filter out recently used protocols (avoid repetition)
  const recentProtocols = game.protocolHistory.slice(-3);
  const availableProtocols = protocolPool.filter(p => !recentProtocols.includes(p));
  
  if (availableProtocols.length === 0) {
    // All protocols used recently, allow any
    return protocolPool[Math.floor(Math.random() * protocolPool.length)];
  }
  
  return availableProtocols[Math.floor(Math.random() * availableProtocols.length)];
}

// Add entry to game log
function addGameLogEntry(game: GameState, entry: Omit<GameLogEntry, 'round' | 'timestamp'>) {
  game.gameLog.push({
    ...entry,
    round: game.round,
    timestamp: Date.now(),
  });
}

// Start the waiting_for_ready phase (used for each round)
function startWaitingForReady(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  game.phase = 'waiting_for_ready';
  game.roundWinner = null;
  game.eliminatedThisRound = [];
  game.isDoubleTokensRound = false;
  
  // Select protocol for this round
  const protocol = selectProtocolForRound(game);
  game.activeProtocol = protocol;
  if (protocol) {
    game.protocolHistory.push(protocol);
    addGameLogEntry(game, {
      type: 'protocol',
      message: `Protocol activated: ${protocol}`,
    });
    
    // Handle specific protocol effects at round start
    if (protocol === 'DOUBLE_STAKES' || protocol === 'PANIC_ROOM') {
      game.isDoubleTokensRound = true;
    }
    if (protocol === 'THE_MOLE') {
      // Randomly select a non-eliminated player as the mole
      const activePlayers = game.players.filter(p => !p.isEliminated && !p.isBot);
      if (activePlayers.length > 0) {
        game.molePlayerId = activePlayers[Math.floor(Math.random() * activePlayers.length)].id;
      }
    } else {
      game.molePlayerId = null;
    }
    
    log(`Protocol ${protocol} activated for round ${game.round} in lobby ${lobbyCode}`, "game");
  }
  
  // Reset all player holding/bid status and ability tracking for new round
  game.players.forEach(p => {
    if (!p.isEliminated) {
      p.isHolding = false;
      p.currentBid = null;
      p.roundImpact = undefined;
      p.abilityUsed = false;
      p.penaltyAppliedThisRound = false;
    }
    // Reset round end acknowledgment for all players (human and bot)
    (p as any).roundEndAcknowledged = p.isBot ? true : false;
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
      // Track when all humans started holding
      if (g.allHumansHoldingStartTime === null) {
        g.allHumansHoldingStartTime = Date.now();
        log(`All human players holding, starting 3-second countdown in lobby ${lobbyCode}`, "game");
        broadcastGameState(lobbyCode);
      }
      
      // Check if they've been holding for 3 seconds
      const holdDuration = (Date.now() - g.allHumansHoldingStartTime) / 1000;
      if (holdDuration >= 3) {
        clearInterval(readyCheckInterval);
        g.allHumansHoldingStartTime = null;
        log(`All human players held for 3 seconds in lobby ${lobbyCode}, starting countdown`, "game");
        startCountdown(lobbyCode);
      }
    } else {
      // Reset the timer if someone let go
      if (g.allHumansHoldingStartTime !== null) {
        g.allHumansHoldingStartTime = null;
        broadcastGameState(lobbyCode);
      }
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
  
  // During countdown: releasing means abandoning this round with penalty (once per round)
  if (game.phase === 'countdown') {
    player.isHolding = false;
    
    // Only apply penalty once per round
    if (player.penaltyAppliedThisRound) {
      log(`${player.name} already received penalty this round, no additional penalty`, "game");
      broadcastGameState(lobbyCode);
      return;
    }
    
    // Apply penalty based on game pace
    const penalty = getMinBidPenalty(game.gameDuration);
    player.remainingTime -= penalty;
    player.penaltyAppliedThisRound = true;
    
    // Track penalty as negative bid for display in bid history
    player.currentBid = -penalty;
    
    addGameLogEntry(game, {
      type: 'impact',
      playerId: player.id,
      playerName: player.name,
      message: `${player.name} released during countdown: -${penalty.toFixed(1)}s penalty`,
      value: -penalty,
    });
    
    log(`${player.name} released during countdown in lobby ${lobbyCode}, penalty: -${penalty}s`, "game");
    
    // Check for elimination
    if (player.remainingTime <= 0) {
      player.remainingTime = 0;
      player.isEliminated = true;
      game.eliminatedThisRound.push(player.id);
      addGameLogEntry(game, {
        type: 'elimination',
        playerId: player.id,
        playerName: player.name,
        message: `${player.name} was eliminated (countdown penalty)`,
      });
    }
    
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

// Player acknowledges round end (clicks to continue)
export function playerAcknowledgeRoundEnd(lobbyCode: string, socketId: string) {
  const game = activeGames.get(lobbyCode);
  if (!game || game.phase !== 'round_end') return;
  
  const player = game.players.find(p => p.socketId === socketId);
  if (!player || player.isEliminated) return;
  
  (player as any).roundEndAcknowledged = true;
  log(`${player.name} acknowledged round end in lobby ${lobbyCode}`, "game");
  
  // Check if all human players have acknowledged
  const humanPlayers = game.players.filter(p => !p.isBot && !p.isEliminated);
  const allAcknowledged = humanPlayers.every(p => (p as any).roundEndAcknowledged === true);
  
  if (allAcknowledged && humanPlayers.length > 0) {
    // Check for game over
    const activePlayers = game.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1 || game.round >= game.totalRounds) {
      endGame(lobbyCode);
    } else {
      // Advance to next round
      game.round++;
      startWaitingForReady(lobbyCode);
    }
  } else {
    // Broadcast updated state so clients can see who has acknowledged
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
  // Add timer offset based on game pace (starts at min bid time, not 0)
  const minBid = getMinBidPenalty(game.gameDuration);
  const rawElapsed = game.roundStartTime && game.phase === 'bidding' 
    ? (Date.now() - game.roundStartTime) / 1000 
    : 0;
  const elapsedTime = rawElapsed + minBid; // Timer starts at min bid value
  
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
      roundEndAcknowledged: (p as any).roundEndAcknowledged || false,
      roundImpact: p.roundImpact,
      netImpact: p.netImpact,
      abilityUsed: p.abilityUsed,
    })),
    roundWinner: game.roundWinner,
    eliminatedThisRound: game.eliminatedThisRound,
    gameLog: game.gameLog,
    activeProtocol: game.activeProtocol,
    settings: game.settings,
    allHumansHoldingStartTime: game.allHumansHoldingStartTime,
    gameDuration: game.gameDuration,
    minBid: minBid,
  };
  
  emitToLobby(lobbyCode, 'game_state', stateForClients);
}
