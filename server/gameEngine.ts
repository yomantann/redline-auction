import { log } from "./index";
import { recordGameSnapshot, recordGameSummary, createGameId } from "./snapshotDb";

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
  'guardian_h', 'click_click', 'frostbyte', 'sadman', 'rainbow_dash', 'accuser', 'low_flame', 'wandering_eye', 
  'the_rind', 'anointed', 'executive_p', 'alpha_prime', 'roll_safe', 'hotwired', 'panic_bot', 'primate', 'pain_hider'
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
  'guardian_h': 'Guardian H',
  'click_click': 'Click-Click',
  'frostbyte': 'Frostbyte',
  'sadman': 'Sadman Logic',
  'rainbow_dash': 'Rainbow Dash',
  'accuser': 'The Accuser',
  'low_flame': 'Low Flame',
  'wandering_eye': 'Wandering Eye',
  'the_rind': 'The Rind',
  'anointed': 'The Anointed',
  'executive_p': 'Executive P',
  'alpha_prime': 'Alpha Prime',
  'roll_safe': 'Roll Safe',
  'hotwired': 'Hotwired',
  'panic_bot': 'Panic Bot',
  'primate': 'Primate Prime',
  'pain_hider': 'Pain Hider',
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
  | 'NO_LOOK' | 'LOCK_ON' 
  | 'THE_MOLE' | 'PANIC_ROOM' 
  | 'UNDERDOG_VICTORY' | 'TIME_TAX' | 'PRIVATE_CHANNEL'
  | 'TRUTH_DARE' | 'SWITCH_SEATS' | 'HUM_TUNE' | 'NOISE_CANCEL'
  | 'HYDRATE' | 'BOTTOMS_UP' | 'PARTNER_DRINK' | 'WATER_ROUND'
  | null;

// Protocol pools by variant
const STANDARD_PROTOCOLS: ProtocolType[] = [
  'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
  'OPEN_HAND', 'MUTE_PROTOCOL', 
  'NO_LOOK', 'THE_MOLE', 'PANIC_ROOM',
  'UNDERDOG_VICTORY', 'TIME_TAX', 'PRIVATE_CHANNEL'
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
  'guardian_h': { name: 'SPIRIT SHIELD', effect: 'TIME_REFUND', triggerCondition: 'WIN', refundAmount: 11, description: '+11s if you win Round 1' },
  'click_click': { name: 'HYPER CLICK', effect: 'TOKEN_BOOST', triggerCondition: 'CONDITIONAL', description: '+1 token if close win (within 1.1s of 2nd)' },
  'frostbyte': { name: 'CYRO FREEZE', effect: 'TIME_REFUND', triggerCondition: 'ALWAYS', refundAmount: 1.0, description: '+1.0s every round' },
  'sadman': { name: 'SAD REVEAL', effect: 'PEEK', triggerCondition: 'CONDITIONAL', description: 'See opponent holding' },
  'rainbow_dash': { name: 'RAINBOW RUN', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', refundAmount: 3.5, description: '+3.5s if bid > 40s' },
  'accuser': { name: 'MANAGER CALL', effect: 'DISRUPT', triggerCondition: 'ALWAYS', refundAmount: -2, description: '-2s from random opponent' },
  'low_flame': { name: 'FIRE WALL', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', description: 'Immune to protocols' },
  'wandering_eye': { name: 'SNEAK PEEK', effect: 'PEEK', triggerCondition: 'CONDITIONAL', description: 'See random opponent holding' },
  'the_rind': { name: 'CHEESE TAX', effect: 'DISRUPT', triggerCondition: 'LOSE', refundAmount: 2, description: 'Steal 2s from winner' },
  'anointed': { name: 'ROYAL DECREE', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', refundAmount: 4, description: '+4s if bid near 20s' },
  'executive_p': { name: 'AXE SWING', effect: 'DISRUPT', triggerCondition: 'ALWAYS', refundAmount: -2, description: '-2s from player with most time' },
  'alpha_prime': { name: 'JAWLINE', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', description: 'No penalty during countdown' },
  'roll_safe': { name: 'CALCULATED', effect: 'PEEK', triggerCondition: 'ALWAYS', description: 'Immune to abilities' },
  'hotwired': { name: 'BURN IT', effect: 'DISRUPT', triggerCondition: 'ALWAYS', refundAmount: -1, description: '-1s from everyone else' },
  'panic_bot': { name: 'PANIC MASH', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', description: '50% +3s, 50% -3s' },
  'primate': { name: 'CHEF\'S SPECIAL', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', refundAmount: 4, description: '+4s if win by >10s margin' },
  'pain_hider': { name: 'HIDE PAIN', effect: 'TIME_REFUND', triggerCondition: 'LOSE', refundAmount: 3, description: '+3s if you lose by >15s' },
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
  roundImpacts: { type: string; value: number; source: string }[];
  netImpact: number; // Cumulative time impact from abilities/protocols (not bids)
  abilityUsed: boolean;
  penaltyAppliedThisRound?: boolean; // Track if penalty was already applied this round
  // Game-level accumulators for game over screen
  momentFlagsEarned: string[];
  protocolWinsEarned: string[];
}

export interface GameLogEntry {
  round: number;
  type: 'bid' | 'elimination' | 'win' | 'protocol' | 'ability' | 'impact';
  playerId?: string;
  playerName?: string;
  message: string;
  value?: number;
  timestamp: number;
  basic?: boolean;
}

export interface GameSettings {
  difficulty: 'CASUAL' | 'COMPETITIVE';
  protocolsEnabled: boolean;
  abilitiesEnabled: boolean;
  variant: GameVariant;
  gameDuration: GameDuration;
}

export interface GameState {
  gameId: string; // Unique identifier for database snapshots
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
  settings: GameSettings;
  activeProtocol: ProtocolType;
  protocolHistory: ProtocolType[];
  gameLog: GameLogEntry[];
  isDoubleTokensRound: boolean;
  molePlayerId: string | null;
  privateChannelPlayerIds: [string, string] | null;
  allHumansHoldingStartTime: number | null;
  isMultiplayer: boolean;
  botTargetBids: Record<string, number>;
}

// Active games storage
const activeGames = new Map<string, GameState>();
const gameIntervals = new Map<string, NodeJS.Timeout>();

// Event emitter callback types
type EmitCallback = (lobbyCode: string, event: string, data: any) => void;
type EmitToPlayerCallback = (socketId: string, event: string, data: any) => void;
let emitToLobby: EmitCallback | null = null;
let emitToPlayer: EmitToPlayerCallback | null = null;

export function setEmitCallback(callback: EmitCallback) {
  emitToLobby = callback;
}

export function setEmitToPlayerCallback(callback: EmitToPlayerCallback) {
  emitToPlayer = callback;
}

// Reality Mode Ability Definitions
interface RealityAbilityConfig {
  name: string;
  triggerChance: number;
  triggerType: 'random' | 'always' | 'on_win' | 'every_3_rounds' | 'once_per_game';
  visibility: 'driver_only' | 'target_only' | 'driver_and_target' | 'all';
  needsTarget: boolean;
  description: string;
  timing: 'start' | 'end';
}

const SOCIAL_ABILITY_CONFIG: Record<string, RealityAbilityConfig | null> = {
  'prom_king': { name: 'PROM COURT', triggerChance: 0.1, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Make a rule for the game!', timing: 'end' },
  'idol_core': { name: 'FANCAM', triggerChance: 0.1, triggerType: 'random', visibility: 'all', needsTarget: true, description: 'shows hidden talent or drops button!', timing: 'start' },
  'tank': { name: "PEOPLE'S ELBOW", triggerChance: 0.3, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Challenge to thumb war!', timing: 'end' },
  'danger_zone': { name: 'PRIVATE DANCE', triggerChance: 0.3, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Give a command!', timing: 'end' },
  'guardian_h': { name: 'VIBE GUARD', triggerChance: 1.0, triggerType: 'always', visibility: 'driver_only', needsTarget: false, description: 'Designate a player immune to social dares this round.', timing: 'start' },
  'click_click': { name: 'MISCLICK', triggerChance: 0.25, triggerType: 'random', visibility: 'driver_and_target', needsTarget: true, description: 'must hold bid without using hands!', timing: 'end' },
  'frostbyte': { name: 'COLD SHOULDER', triggerChance: 0.5, triggerType: 'random', visibility: 'driver_only', needsTarget: false, description: 'Ignore all social interactions this round.', timing: 'start' },
  'sadman': { name: 'SAD STORY', triggerChance: 0.05, triggerType: 'random', visibility: 'target_only', needsTarget: true, description: 'Share a sad story.', timing: 'end' },
  'rainbow_dash': { name: 'SUGAR RUSH', triggerChance: 0.15, triggerType: 'random', visibility: 'all', needsTarget: true, description: 'must speak 2x speed!', timing: 'start' },
  'accuser': { name: 'COMPLAINT', triggerChance: 0.15, triggerType: 'random', visibility: 'all', needsTarget: false, description: "Vote on winner's punishment!", timing: 'end' },
  'low_flame': { name: 'HOT SEAT', triggerChance: 0.25, triggerType: 'random', visibility: 'driver_only', needsTarget: false, description: 'Choose a player to answer a truth!', timing: 'end' },
  'wandering_eye': { name: 'DISTRACTION', triggerChance: 0.35, triggerType: 'random', visibility: 'driver_only', needsTarget: false, description: 'Point at something! Anyone who looks must drop buzzer.', timing: 'start' },
  'the_rind': { name: 'SNITCH', triggerChance: 0.05, triggerType: 'random', visibility: 'target_only', needsTarget: true, description: "Reveal someone's tell!", timing: 'end' },
  'anointed': { name: 'COMMAND SILENCE', triggerChance: 0.5, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Command silence!', timing: 'start' },
  'executive_p': { name: "CC'D", triggerChance: 0.2, triggerType: 'random', visibility: 'driver_and_target', needsTarget: true, description: 'must copy your actions next round!', timing: 'end' },
  'alpha_prime': { name: 'MOG', triggerChance: 0.1, triggerType: 'random', visibility: 'driver_and_target', needsTarget: true, description: '10 pushups or ff next round!', timing: 'end' },
  'roll_safe': null,
  'hotwired': { name: 'VIRAL MOMENT', triggerChance: 0.1, triggerType: 'random', visibility: 'driver_and_target', needsTarget: true, description: 'must re-enact a meme!', timing: 'end' },
  'panic_bot': null,
  'primate': { name: 'FRESH CUT', triggerChance: 0.1, triggerType: 'random', visibility: 'all', needsTarget: true, description: 'must compliment everyone!', timing: 'end' },
  'pain_hider': null,
};

const BIO_ABILITY_CONFIG: Record<string, RealityAbilityConfig | null> = {
  'prom_king': { name: 'CORONATION', triggerChance: 0.1, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Initiate Group Toast!', timing: 'end' },
  'idol_core': { name: 'DEBUT', triggerChance: 0.2, triggerType: 'random', visibility: 'driver_only', needsTarget: false, description: 'Take a drink to reveal a secret!', timing: 'end' },
  'tank': null,
  'danger_zone': null,
  'guardian_h': { name: 'LIQUID AUTHORIZATION', triggerChance: 1.0, triggerType: 'always', visibility: 'all', needsTarget: false, description: 'Cannot release button until guardian finishes sip', timing: 'end' },
  'click_click': { name: 'MOUTH POP', triggerChance: 0.1, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Pop mouth! Everyone sips!', timing: 'end' },
  'frostbyte': { name: 'BRAIN FREEZE', triggerChance: 0.1, triggerType: 'once_per_game', visibility: 'driver_and_target', needsTarget: true, description: 'must Win round or Drink!', timing: 'end' },
  'sadman': { name: 'DRINKING PARTNER', triggerChance: 1.0, triggerType: 'always', visibility: 'driver_only', needsTarget: false, description: 'You can change your drinking partner', timing: 'end' },
  'rainbow_dash': { name: 'RAINBOW SHOT', triggerChance: 0.1, triggerType: 'random', visibility: 'driver_and_target', needsTarget: true, description: 'mixes two drinks!', timing: 'end' },
  'accuser': { name: 'SPILL HAZARD', triggerChance: 0.25, triggerType: 'random', visibility: 'driver_only', needsTarget: false, description: 'Accuse someone of spilling — they drink!', timing: 'end' },
  'low_flame': { name: 'ON FIRE', triggerChance: 1.0, triggerType: 'on_win', visibility: 'all', needsTarget: false, description: 'Everyone else drinks!', timing: 'end' },
  'wandering_eye': { name: 'THE EX', triggerChance: 0.1, triggerType: 'random', visibility: 'target_only', needsTarget: true, description: 'Toast to an ex!', timing: 'end' },
  'the_rind': { name: 'SCAVENGE', triggerChance: 0.05, triggerType: 'random', visibility: 'target_only', needsTarget: true, description: "Finish someone else's drink!", timing: 'end' },
  'anointed': { name: 'ROYAL CUP', triggerChance: 0.05, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Make a rule for the game!', timing: 'end' },
  'executive_p': { name: 'REASSIGNED', triggerChance: 0.25, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Choose 1 player to drink!', timing: 'end' },
  'alpha_prime': { name: 'PACE SETTER', triggerChance: 1.0, triggerType: 'every_3_rounds', visibility: 'all', needsTarget: false, description: 'Start a Waterfall!', timing: 'end' },
  'roll_safe': { name: 'BIG BRAIN', triggerChance: 0.05, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Pass drink to the left?', timing: 'end' },
  'hotwired': { name: 'SPICY', triggerChance: 0.2, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Everyone drinks!', timing: 'end' },
  'panic_bot': { name: 'EMERGENCY MEETING', triggerChance: 0.25, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Gang up on someone!', timing: 'end' },
  'primate': { name: 'GREEDY GRAB', triggerChance: 0.05, triggerType: 'random', visibility: 'all', needsTarget: false, description: 'Winner burns 40s or drinks!', timing: 'end' },
  'pain_hider': null,
};

// Track once-per-game abilities per lobby
const usedOnceAbilities = new Map<string, Set<string>>();

function processRealityModeAbilities(game: GameState, winnerId: string | null, timing: 'start' | 'end') {
  const variant = game.settings.variant;
  if (variant === 'STANDARD') return;
  
  const config = variant === 'SOCIAL_OVERDRIVE' ? SOCIAL_ABILITY_CONFIG : BIO_ABILITY_CONFIG;
  const abilityType = variant === 'SOCIAL_OVERDRIVE' ? 'social' : 'bio';
  
  game.players.forEach(player => {
    if (player.isEliminated || player.isBot) return;
    
    if (!player.selectedDriver) return;
    const ability = config[player.selectedDriver];
    if (!ability || ability.timing !== timing) return;
    
    let triggered = false;
    switch (ability.triggerType) {
      case 'random':
        triggered = Math.random() < ability.triggerChance;
        break;
      case 'always':
        triggered = true;
        break;
      case 'on_win':
        triggered = player.id === winnerId;
        break;
      case 'every_3_rounds':
        triggered = game.round % 3 === 0;
        break;
      case 'once_per_game':
        const key = `${game.lobbyCode}_${player.id}`;
        if (!usedOnceAbilities.has(game.lobbyCode)) usedOnceAbilities.set(game.lobbyCode, new Set());
        const used = usedOnceAbilities.get(game.lobbyCode)!;
        if (!used.has(player.id) && Math.random() < ability.triggerChance) {
          triggered = true;
          used.add(player.id);
        }
        break;
    }
    
    if (!triggered) return;
    
    let targetId: string | null = null;
    let targetName: string | null = null;
    if (ability.needsTarget) {
      const targets = game.players.filter(p => p.id !== player.id && !p.isEliminated && !p.isBot);
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        targetId = target.id;
        targetName = target.name;
      } else if (ability.visibility === 'target_only' || ability.visibility === 'driver_and_target') {
        return;
      }
    }
    
    const descWithTarget = targetName 
      ? `${targetName} ${ability.description}`
      : ability.description;
    
    const eventData = {
      driverName: player.name,
      driverId: player.id,
      abilityName: ability.name,
      description: descWithTarget,
      type: abilityType,
      targetId,
      targetName,
      visibility: ability.visibility,
    };
    
    switch (ability.visibility) {
      case 'driver_only':
        if (emitToPlayer && player.socketId) emitToPlayer(player.socketId, 'reality_mode_ability', eventData);
        break;
      case 'target_only':
        if (emitToPlayer && targetId) {
          const target = game.players.find(p => p.id === targetId);
          if (target?.socketId) emitToPlayer(target.socketId, 'reality_mode_ability', eventData);
        }
        break;
      case 'driver_and_target':
        if (emitToPlayer && player.socketId) emitToPlayer(player.socketId, 'reality_mode_ability', eventData);
        if (emitToPlayer && targetId) {
          const target = game.players.find(p => p.id === targetId);
          if (target?.socketId && target.socketId !== player.socketId) {
            emitToPlayer(target.socketId, 'reality_mode_ability', eventData);
          }
        }
        break;
      case 'all':
        if (emitToLobby) emitToLobby(game.lobbyCode, 'reality_mode_ability', eventData);
        break;
    }
    
    log(`Reality mode ability: ${player.name} triggered ${ability.name} (${ability.visibility}) in lobby ${game.lobbyCode}`, "game");
  });
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
    roundImpacts: [],
    netImpact: 0,
    abilityUsed: false,
    momentFlagsEarned: [],
    protocolWinsEarned: [],
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
      roundImpacts: [],
      netImpact: 0,
      abilityUsed: false,
      momentFlagsEarned: [],
      protocolWinsEarned: [],
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
    gameId: createGameId(),
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
    privateChannelPlayerIds: null,
    allHumansHoldingStartTime: null,
    isMultiplayer: true,
    botTargetBids: {},
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
  
  game.players.forEach(p => {
    if (!p.isEliminated) {
      if (p.isBot) {
        p.isHolding = true;
      }
      p.currentBid = 0;
    }
  });
  
  game.botTargetBids = calculateBotTargetBids(game);
  
  broadcastGameState(lobbyCode);
  
  // Process start-of-round reality mode abilities (VIBE GUARD, COLD SHOULDER, DISTRACTION)
  processRealityModeAbilities(game, null, 'start');
  
  log(`Round ${game.round} bidding started for lobby ${lobbyCode}`, "game");
  
  // Bidding tick interval (100ms for smooth updates)
  const interval = setInterval(() => {
    const g = activeGames.get(lobbyCode);
    if (!g || g.phase !== 'bidding') {
      clearInterval(interval);
      return;
    }
    
    const rawElapsed = (Date.now() - (g.roundStartTime || Date.now())) / 1000;
    const panicMultiplier = g.activeProtocol === 'PANIC_ROOM' ? 2 : 1;
    const elapsed = rawElapsed * panicMultiplier;
    
    // Update bids for holding players (include min bid offset)
    const minBid = getMinBidPenalty(g.gameDuration);
    g.players.forEach(p => {
      if (p.isHolding && !p.isEliminated) {
        const playerHasFireWall = p.selectedDriver === 'low_flame' && g.settings.abilitiesEnabled;
        const playerElapsed = (playerHasFireWall && g.activeProtocol === 'PANIC_ROOM') ? rawElapsed : elapsed;
        p.currentBid = playerElapsed + minBid; // Bid starts at min bid value
        
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

function calculateBotTargetBids(game: GameState): Record<string, number> {
  const bids: Record<string, number> = {};
  const isPanicRoom = game.activeProtocol === 'PANIC_ROOM';
  const isNoLook = game.activeProtocol === 'NO_LOOK';
  const isMute = game.activeProtocol === 'MUTE_PROTOCOL';
  const isMole = game.activeProtocol === 'THE_MOLE';
  const isLastRound = game.round >= game.totalRounds;
  const minBidTime = getMinBidPenalty(game.gameDuration);

  game.players.forEach(p => {
    if (!p.isBot || p.isEliminated) return;

    const lowTime = p.remainingTime <= 8;
    const midTime = p.remainingTime > 8 && p.remainingTime <= 20;

    const riskDown =
      (isPanicRoom ? 0.35 : 0) +
      (isNoLook ? 0.1 : 0) +
      (isMute ? 0.1 : 0) +
      (isLastRound ? 0.2 : 0) +
      (lowTime ? 0.35 : midTime ? 0.15 : 0);

    const maxBid = Math.max(minBidTime, p.remainingTime);
    let bid = minBidTime;

    switch (p.personality) {
      case 'aggressive': {
        const base = 18 + Math.random() * 28;
        const cautious = 6 + Math.random() * 10;
        const chooseHigh = Math.random() > (0.25 + riskDown);
        bid = chooseHigh ? base : cautious;
        break;
      }
      case 'conservative': {
        const base = 1.5 + Math.random() * 10;
        bid = base;
        if (isLastRound || isPanicRoom || lowTime) bid = 1.0 + Math.random() * 6;
        break;
      }
      case 'random':
      default: {
        const base = 1 + Math.random() * 40;
        bid = base * (1 - Math.min(0.55, riskDown));
        break;
      }
    }

    if (isMole) {
      bid = bid * 0.85;
    }

    bid += Math.random() * 0.8;
    bid = Math.min(maxBid, Math.max(minBidTime, bid));
    bids[p.id] = parseFloat(bid.toFixed(1));
  });

  return bids;
}

function processBotBids(game: GameState) {
  const rawElapsed = (Date.now() - (game.roundStartTime || Date.now())) / 1000;
  const panicMultiplier = game.activeProtocol === 'PANIC_ROOM' ? 2 : 1;
  const elapsed = rawElapsed * panicMultiplier;
  const minBid = getMinBidPenalty(game.gameDuration);
  
  game.players.forEach(p => {
    if (p.isBot && p.isHolding && !p.isEliminated) {
      const targetBid = game.botTargetBids[p.id];
      if (targetBid !== undefined && (elapsed + minBid) >= targetBid) {
        p.isHolding = false;
        p.currentBid = elapsed + minBid;
        log(`Bot ${p.name} released at ${p.currentBid.toFixed(1)}s (target ${targetBid}s) in lobby ${game.lobbyCode}`, "game");
      }
    }
  });
}

// Process driver abilities at end of round
function processAbilities(game: GameState, winnerId: string | null) {
  if (!game.settings.abilitiesEnabled) return;
  
  const abilityImpacts: Array<{ playerId: string; targetId?: string; ability: string; effect: string; value: number }> = [];
  
  // Find the "Thinker" player who is immune to abilities
  const thinkerPlayer = game.players.find(p => p.selectedDriver === 'roll_safe' && !p.isEliminated);
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
          if (player.selectedDriver === 'guardian_h' && game.round !== 1) break;
          triggered = true;
        }
        break;
        
      case 'LOSE':
        if (!isWinner && winnerId) {
          // HIDE PAIN (harold): only triggers if lost by >15s margin
          if (player.selectedDriver === 'pain_hider') {
            const winnerPlayer = game.players.find(p => p.id === winnerId);
            const winnerBidVal = winnerPlayer?.currentBid || 0;
            if (winnerBidVal - playerBid > 15) {
              triggered = true;
            }
          } else {
            triggered = true;
            targetId = winnerId;
          }
        }
        break;
        
      case 'ALWAYS':
        triggered = true;
        break;
        
      case 'CONDITIONAL':
        // Handle specific conditional abilities with correct driver IDs
        if (player.selectedDriver === 'rainbow_dash' && playerBid > 40) {
          // Rainbow Run: +3.5s if bid > 40s
          triggered = true;
        } else if (player.selectedDriver === 'anointed' && Math.abs(playerBid - 20) <= 0.5) {
          // Royal Decree: +4s if bid near 20s
          triggered = true;
        } else if (player.selectedDriver === 'panic_bot') {
          // Panic Mash: 50% chance +3s or -3s
          triggered = true;
          refundAmount = Math.random() < 0.5 ? 3 : -3;
        } else if (player.selectedDriver === 'click_click' && isWinner && sortedByBid.length >= 2 && winMargin <= 1.1 && winMargin > 0) {
          // Hyper Click: +1 token if win within 1.1s of 2nd place (requires valid 2nd place)
          triggered = true;
        } else if (player.selectedDriver === 'primate' && isWinner) {
          // Chef's Special: +4s if win by >10s margin over 2nd place
          if (sortedByBid.length >= 2 && winMargin > 10) {
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
          player.roundImpacts.push({ type: 'REFUND', value: refundAmount, source: ability.name });
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
          basic: true,
        });
        break;
        
      case 'DISRUPT':
        if (refundAmount !== 0) {
          // Find target based on ability type
          let target: GamePlayer | undefined;
          
          if (player.selectedDriver === 'the_rind' && targetId) {
            // Cheese Tax: target the winner
            target = game.players.find(p => p.id === targetId);
          } else if (player.selectedDriver === 'executive_p') {
            // Axe Swing: target player with most time
            const nonEliminated = game.players.filter(p => p.id !== player.id && !p.isEliminated && !immunePlayerIds.includes(p.id));
            target = nonEliminated.reduce((max, p) => p.remainingTime > (max?.remainingTime || 0) ? p : max, undefined as GamePlayer | undefined);
          } else if (player.selectedDriver === 'accuser' || player.selectedDriver === 'hotwired') {
            // Manager Call / Burn It: random opponents or all
            const targets = game.players.filter(p => p.id !== player.id && !p.isEliminated && !immunePlayerIds.includes(p.id));
            if (player.selectedDriver === 'hotwired') {
              // Burn It: affects all others
              targets.forEach(t => {
                t.remainingTime += refundAmount;
                t.netImpact += refundAmount; // Accumulate into total
                t.roundImpacts.push({ type: 'DISRUPT', value: refundAmount, source: ability.name });
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
            if (player.selectedDriver === 'the_rind') {
              player.remainingTime += Math.abs(refundAmount);
              player.netImpact += Math.abs(refundAmount); // Accumulate into total
              player.roundImpacts.push({ type: 'STEAL', value: Math.abs(refundAmount), source: ability.name });
              target.remainingTime -= Math.abs(refundAmount);
              target.netImpact -= Math.abs(refundAmount); // Accumulate into total
              target.roundImpacts.push({ type: 'STOLEN', value: -Math.abs(refundAmount), source: ability.name });
            } else {
              target.remainingTime += refundAmount; // negative value
              target.netImpact += refundAmount; // Accumulate into total (negative)
              target.roundImpacts.push({ type: 'DISRUPT', value: refundAmount, source: ability.name });
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
    
    // Award token(s) - double if DOUBLE_STAKES protocol is active (FIRE WALL immune)
    const winnerHasFireWall = winner.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled;
    const tokensAwarded = (game.isDoubleTokensRound && !winnerHasFireWall) ? 2 : 1;
    winner.tokens += tokensAwarded;
    
    addGameLogEntry(game, {
      type: 'win',
      playerId: winner.id,
      playerName: winner.name,
      message: `${winner.name} won round ${game.round} with ${winner.currentBid?.toFixed(1)}s bid${game.isDoubleTokensRound ? ' (2x tokens!)' : ''}`,
      value: winner.currentBid || 0,
      basic: true,
    });
    
    log(`Round ${game.round} winner: ${winner.name} with bid of ${winner.currentBid?.toFixed(1)}s${game.isDoubleTokensRound ? ' (DOUBLE STAKES)' : ''}`, "game");
  } else {
    addGameLogEntry(game, {
      type: 'win',
      message: `Round ${game.round} had no winner`,
      basic: true,
    });
  }
  
  // Handle SECRET PROTOCOLS (UNDERDOG_VICTORY, TIME_TAX) - revealed at round end
  if (game.activeProtocol === 'UNDERDOG_VICTORY') {
    // Find lowest bidder with valid bid (>= min bid) who is not eliminated (FIRE WALL players excluded)
    const minBid = getMinBidPenalty(game.settings.gameDuration);
    const eligible = game.players.filter(p => !p.isEliminated && p.currentBid !== null && p.currentBid >= minBid && !(p.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled));
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
        basic: true,
      });
      log(`UNDERDOG_VICTORY: ${underdog.name} awarded +1 token for lowest bid in lobby ${game.lobbyCode}`, "game");
    }
  }
  
  if (game.activeProtocol === 'TIME_TAX') {
    // Deduct 10s from all non-eliminated players (FIRE WALL players immune)
    game.players.forEach(p => {
      const hasFireWall = p.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled;
      if (!p.isEliminated && p.remainingTime > 0 && !hasFireWall) {
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
      basic: true,
    });
    log(`TIME_TAX: -10s to all survivors in lobby ${game.lobbyCode}`, "game");
  }
  
  // Emit secret protocol reveal overlays to clients (like SP)
  emitSecretProtocolReveal(game);
  
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
          basic: true,
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
      
      // THE_MOLE: Mole's bid is free (no time deduction)
      if (game.activeProtocol === 'THE_MOLE' && p.id === game.molePlayerId) {
        // Free bid - no time deduction, no netImpact change (matches singleplayer)
        addGameLogEntry(game, {
          type: 'protocol',
          playerId: p.id,
          playerName: p.name,
          message: `${p.name}'s bid was FREE (Mole)`,
          value: p.currentBid,
        });
      } else {
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
              basic: true,
            });
          }
        }
      }
    }
  });
  
  // Handle THE_MOLE protocol penalties (AFTER all deductions and ability effects)
  if (game.activeProtocol === 'THE_MOLE' && game.molePlayerId) {
    const molePlayer = game.players.find(p => p.id === game.molePlayerId);
    
    // Mole suicide check: if mole was eliminated this round (overbid/penalties), lose 1 token
    if (molePlayer && game.eliminatedThisRound.includes(game.molePlayerId)) {
      molePlayer.tokens = Math.max(0, molePlayer.tokens - 1);
      addGameLogEntry(game, {
        type: 'protocol',
        playerId: molePlayer.id,
        playerName: molePlayer.name,
        message: `MOLE REVEALED: ${molePlayer.name} held too long and LOST a token!`,
        value: -1,
        basic: true,
      });
      log(`THE_MOLE suicide: ${molePlayer.name} eliminated and lost 1 token in lobby ${lobbyCode}`, "game");
    }
    // Mole wins check: if mole won by more than 7s margin, penalty
    else if (winnerId === game.molePlayerId && molePlayer && participants.length > 1) {
      const sortedBids = [...participants]
        .filter(p => p.id !== winnerId)
        .map(p => p.currentBid || 0)
        .sort((a, b) => b - a);
      const secondPlaceBid = sortedBids[0] || 0;
      const margin = (molePlayer.currentBid || 0) - secondPlaceBid;
      
      if (margin > 7) {
        molePlayer.tokens = Math.max(0, molePlayer.tokens - 2);
        addGameLogEntry(game, {
          type: 'protocol',
          playerId: molePlayer.id,
          playerName: molePlayer.name,
          message: `MOLE REVEALED: ${molePlayer.name} won by ${margin.toFixed(1)}s and LOST 2 tokens!`,
          value: -2,
          basic: true,
        });
        log(`THE_MOLE penalty: ${molePlayer.name} won by ${margin.toFixed(1)}s (>7s) and lost 2 tokens in lobby ${lobbyCode}`, "game");
      } else {
        addGameLogEntry(game, {
          type: 'protocol',
          playerId: molePlayer.id,
          playerName: molePlayer.name,
          message: `MOLE REVEALED: ${molePlayer.name} was the mole but won safely (margin ${margin.toFixed(1)}s)`,
        });
        log(`THE_MOLE safe: ${molePlayer.name} won within 7s margin in lobby ${lobbyCode}`, "game");
      }
    }
  }
  
  // Snapshot flag counts before adding any this round (for PATCH_NOTES_PENDING detection)
  const flagsBeforeCount = new Map<string, number>();
  game.players.forEach(p => flagsBeforeCount.set(p.id, p.momentFlagsEarned.length));
  
  // Track protocol wins and moment flags for the round winner
  if (winnerId && game.activeProtocol) {
    const winnerPlayer = game.players.find(p => p.id === winnerId);
    if (winnerPlayer) {
      winnerPlayer.protocolWinsEarned.push(game.activeProtocol);
    }
  }
  
  // Calculate moment flags for the round winner (server-side, mirrors client logic)
  if (winnerId) {
    const winnerPlayer = game.players.find(p => p.id === winnerId);
    if (winnerPlayer) {
      const winnerBid = winnerPlayer.currentBid || 0;
      const sortedByBid = [...participants]
        .filter(p => p.currentBid !== null)
        .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
      const secondBid = sortedByBid.length > 1 ? sortedByBid[1].currentBid || 0 : 0;
      const margin = winnerBid - secondBid;
      
      if (game.round === 1) {
        winnerPlayer.momentFlagsEarned.push('SMUG_CONFIDENCE');
      }
      if (sortedByBid.length > 1 && margin >= 15) {
        winnerPlayer.momentFlagsEarned.push('FAKE_CALM');
      }
      if (sortedByBid.length > 1 && margin <= 5 && margin > 0) {
        winnerPlayer.momentFlagsEarned.push('GENIUS_MOVE');
      }
      if (winnerBid < 20) {
        winnerPlayer.momentFlagsEarned.push('EASY_W');
      }
      if (winnerBid > 60) {
        winnerPlayer.momentFlagsEarned.push('OVERKILL');
      }
      if (winnerPlayer.remainingTime < 10) {
        winnerPlayer.momentFlagsEarned.push('CLUTCH_PLAY');
      }
      if (winnerBid % 1 === 0 && winnerBid > 0) {
        winnerPlayer.momentFlagsEarned.push('PRECISION_STRIKE');
      }
      // Comeback Hope: winner was sole last-place before winning
      const isDoubleRound = game.activeProtocol === 'DOUBLE_STAKES' || game.activeProtocol === 'PANIC_ROOM';
      const tokensAwarded = isDoubleRound ? 2 : 1;
      const winnerTokensBefore = winnerPlayer.tokens - tokensAwarded;
      const allTokensBefore = game.players.filter(p => !p.isEliminated || p.id === winnerId).map(p => p.id === winnerId ? winnerTokensBefore : p.tokens);
      const minTokens = Math.min(...allTokensBefore);
      const playersAtMin = allTokensBefore.filter(t => t === minTokens);
      if (winnerTokensBefore === minTokens && playersAtMin.length === 1 && allTokensBefore.some(t => t > winnerTokensBefore)) {
        winnerPlayer.momentFlagsEarned.push('COMEBACK_HOPE');
      }
    }
  }
  
  // Track elimination moment flags for eliminated players
  game.eliminatedThisRound.forEach(elimId => {
    const elimPlayer = game.players.find(p => p.id === elimId);
    if (elimPlayer) {
      elimPlayer.momentFlagsEarned.push('ELIMINATED');
    }
  });
  
  // Track DEADLOCK_SYNC: tie for first place (no winner despite bids)
  if (!winnerId && participants.length >= 2) {
    const validBidders = [...participants]
      .filter(p => p.currentBid !== null && p.currentBid > 0)
      .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    if (validBidders.length >= 2) {
      const topBid = validBidders[0].currentBid || 0;
      const tiedPlayers = validBidders.filter(p => Math.abs((p.currentBid || 0) - topBid) < 0.05);
      if (tiedPlayers.length >= 2) {
        tiedPlayers.forEach(p => p.momentFlagsEarned.push('DEADLOCK_SYNC'));
        addGameLogEntry(game, {
          type: 'protocol',
          message: `DEADLOCK SYNC: ${tiedPlayers.map(p => p.name).join(' & ')} tied at ${topBid.toFixed(1)}s`,
        });
      }
    }
  }
  
  // Track AFK: no winner and no participants (nobody bid)
  if (!winnerId && participants.filter(p => p.currentBid && p.currentBid > 0).length === 0) {
    game.players.filter(p => !p.isEliminated).forEach(p => {
      p.momentFlagsEarned.push('AFK');
    });
  }
  
  // Track hidden flags on server: LATE_PANIC, LAST_ONE_STANDING
  if (winnerId) {
    const winnerPlayer = game.players.find(p => p.id === winnerId);
    if (winnerPlayer) {
      // LATE PANIC: winner started round with lowest time bank
      const winnerBidVal = winnerPlayer.currentBid || 0;
      const winnerStartApprox = winnerPlayer.remainingTime + winnerBidVal;
      const allStartApprox = game.players.filter(p => !p.isEliminated || p.id === winnerId)
        .map(p => p.remainingTime + (p.currentBid || 0));
      const minStartApprox = Math.min(...allStartApprox);
      if (winnerStartApprox <= minStartApprox + 0.0001) {
        winnerPlayer.momentFlagsEarned.push('LATE_PANIC');
      }
      
      // LAST ONE STANDING: won final round with eliminations
      if (game.round >= game.totalRounds && game.eliminatedThisRound.length > 0) {
        winnerPlayer.momentFlagsEarned.push('LAST_ONE_STANDING');
      }
    }
  }
  
  // Track PATCH_NOTES_PENDING: 3+ moment flags in this round for the winner
  // Count using the flagsBeforeCount snapshot taken before any flags were pushed
  if (winnerId) {
    const winnerPlayer = game.players.find(p => p.id === winnerId);
    if (winnerPlayer) {
      const flagsThisRound = winnerPlayer.momentFlagsEarned.length - (flagsBeforeCount.get(winnerId) || 0);
      if (flagsThisRound >= 3) {
        winnerPlayer.momentFlagsEarned.push('PATCH_NOTES_PENDING');
      }
    }
  }
  
  broadcastGameState(lobbyCode);
  
  // Process reality mode abilities (social/bio) at end of round
  processRealityModeAbilities(game, winnerId, 'end');
  
  // Mark all players as not acknowledged for round end
  game.players.forEach(p => {
    if (!p.isBot && !p.isEliminated) {
      (p as any).roundEndAcknowledged = false;
    } else {
      // Bots and eliminated players auto-acknowledge
      (p as any).roundEndAcknowledged = true;
    }
  });
  
  // Check for game over conditions
  const activePlayers = game.players.filter(p => !p.isEliminated);
  const activeHumans = activePlayers.filter(p => !p.isBot);
  
  if (activePlayers.length <= 1 || game.round >= game.totalRounds) {
    setTimeout(() => endGame(lobbyCode), 3000);
  } else if (activeHumans.length === 0 && game.isMultiplayer) {
    // All real players eliminated - fast-forward remaining rounds with random CPU trophies
    const activeBots = activePlayers.filter(p => p.isBot);
    const remainingRounds = game.totalRounds - game.round;
    
    log(`All human players eliminated in lobby ${lobbyCode}. Fast-forwarding ${remainingRounds} remaining rounds for ${activeBots.length} CPUs.`, "game");
    
    for (let r = 0; r < remainingRounds; r++) {
      if (activeBots.length > 0) {
        const randomWinner = activeBots[Math.floor(Math.random() * activeBots.length)];
        randomWinner.tokens += 1;
        
        addGameLogEntry(game, {
          type: 'win',
          playerId: randomWinner.id,
          playerName: randomWinner.name,
          message: `Fast-forward R${game.round + r + 1}: ${randomWinner.name} wins +1 token`,
          value: 1,
          basic: true,
        });
        
        log(`Fast-forward round ${game.round + r + 1}: ${randomWinner.name} wins 1 token`, "game");
      }
    }
    game.round = game.totalRounds;
    setTimeout(() => endGame(lobbyCode), 3000);
  }
  // Otherwise, wait for players to acknowledge round end (via player_ready_next event)
  
  // Record snapshot for this round
  recordGameSnapshot({
    gameId: game.gameId,
    snapshotType: game.eliminatedThisRound.length > 0 ? 'elimination' : 'round_end',
    roundNumber: game.round,
    winnerPlayerId: game.roundWinner?.id || null,
    winningHoldTime: game.roundWinner?.bid || null,
    minBidSeconds: getMinBidPenalty(game.settings.gameDuration),
    eliminatedPlayerIds: game.eliminatedThisRound,
    momentFlagsTriggered: winnerId ? (game.players.find(p => p.id === winnerId)?.momentFlagsEarned.filter(f => f !== 'ELIMINATED').slice(-10) || []) : [],
    protocolsTriggered: game.activeProtocol ? [game.activeProtocol] : [],
    limitBreaksTriggered: [],
    playerPositions: game.players.map(p => ({
      playerId: p.id,
      tokens: p.tokens,
      remainingTime: p.remainingTime,
      isEliminated: p.isEliminated,
    })),
    lobbyCode: game.lobbyCode,
    gameSettings: {
      difficulty: game.settings.difficulty,
      variant: game.settings.variant,
      gameDuration: game.settings.gameDuration,
      protocolsEnabled: game.settings.protocolsEnabled,
      abilitiesEnabled: game.settings.abilitiesEnabled,
    },
    isMultiplayer: 1,
  });
}

// Helper: pick random non-eliminated, non-bot players
function getRandomPlayer(game: GameState, excludeIds: string[] = []): GamePlayer | null {
  const pool = game.players.filter(p => !p.isEliminated && !p.isBot && !excludeIds.includes(p.id));
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function getTwoRandomPlayers(game: GameState): [GamePlayer | null, GamePlayer | null] {
  const pool = game.players.filter(p => !p.isEliminated && !p.isBot);
  if (pool.length < 2) return [pool[0] || null, null];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}

// Emit targeted protocol details to specific players (matching SP popup behavior)
function emitProtocolDetails(game: GameState, protocol: ProtocolType) {
  if (!protocol || !emitToPlayer || !emitToLobby) return;
  
  const fireWallExclude = (p: GamePlayer) => p.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled;
  
  switch (protocol) {
    case 'THE_MOLE': {
      if (game.molePlayerId) {
        const mole = game.players.find(p => p.id === game.molePlayerId);
        if (mole?.socketId) {
          emitToPlayer(mole.socketId, 'protocol_detail', {
            protocol: 'THE_MOLE',
            msg: 'THE MOLE',
            sub: "You are the Mole. Goal: push the time up, but try NOT to get 1st. If you DO win, you only lose a trophy if you win by MORE than 7.0s.",
            targetPlayerId: mole.id,
          });
        }
        game.players.filter(p => !p.isBot && !p.isEliminated && p.id !== game.molePlayerId).forEach(p => {
          if (p.socketId && emitToPlayer) {
            emitToPlayer(p.socketId, 'protocol_detail', {
              protocol: 'THE_MOLE',
              msg: 'SECRET PROTOCOL ACTIVE',
              sub: '',
              targetPlayerId: null,
            });
          }
        });
      }
      break;
    }
    case 'OPEN_HAND': {
      const target = getRandomPlayer(game, game.players.filter(fireWallExclude).map(p => p.id));
      if (target) {
        emitToLobby(game.lobbyCode, 'protocol_detail', {
          protocol: 'OPEN_HAND',
          msg: 'OPEN HAND',
          sub: `${target.name} must state they won't bid!`,
          targetPlayerId: target.id,
        });
      }
      break;
    }
    case 'LOCK_ON': {
      const [a, b] = getTwoRandomPlayers(game);
      if (a && b) {
        emitToLobby(game.lobbyCode, 'protocol_detail', {
          protocol: 'LOCK_ON',
          msg: 'LOCK ON',
          sub: `${a.name} & ${b.name} must maintain eye contact!`,
          targetPlayerId: a.id,
          targetPlayerId2: b.id,
        });
      }
      break;
    }
    case 'HUM_TUNE': {
      const target = getRandomPlayer(game);
      if (target) {
        emitToLobby(game.lobbyCode, 'protocol_detail', {
          protocol: 'HUM_TUNE',
          msg: 'AUDIO SYNC',
          sub: `${target.name} must hum a song (others guess)!`,
          targetPlayerId: target.id,
        });
      }
      break;
    }
    case 'PARTNER_DRINK': {
      const [b1, b2] = getTwoRandomPlayers(game);
      if (b1 && b2) {
        emitToLobby(game.lobbyCode, 'protocol_detail', {
          protocol: 'PARTNER_DRINK',
          msg: 'LINKED SYSTEMS',
          sub: `${b1.name} & ${b2.name} are drinking buddies this round!`,
          targetPlayerId: b1.id,
          targetPlayerId2: b2.id,
        });
      }
      break;
    }
    case 'PRIVATE_CHANNEL': {
      if (game.privateChannelPlayerIds) {
        const [idA, idB] = game.privateChannelPlayerIds;
        const pA = game.players.find(p => p.id === idA);
        const pB = game.players.find(p => p.id === idB);
        if (pA && pB) {
          if (pA.socketId) {
            emitToPlayer(pA.socketId, 'protocol_detail', {
              protocol: 'PRIVATE_CHANNEL',
              msg: 'PRIVATE CHANNEL',
              sub: `Secret link with ${pB.name}! Coordinate your strategy.`,
              targetPlayerId: pA.id,
              targetPlayerId2: pB.id,
            });
          }
          if (pB.socketId) {
            emitToPlayer(pB.socketId, 'protocol_detail', {
              protocol: 'PRIVATE_CHANNEL',
              msg: 'PRIVATE CHANNEL',
              sub: `Secret link with ${pA.name}! Coordinate your strategy.`,
              targetPlayerId: pB.id,
              targetPlayerId2: pA.id,
            });
          }
          game.players.filter(p => !p.isBot && !p.isEliminated && p.id !== idA && p.id !== idB).forEach(p => {
            if (p.socketId && emitToPlayer) {
              emitToPlayer(p.socketId, 'protocol_detail', {
                protocol: 'PRIVATE_CHANNEL',
                msg: 'SECRET PROTOCOL ACTIVE',
                sub: '',
                targetPlayerId: null,
              });
            }
          });
        }
      }
      break;
    }
    case 'NOISE_CANCEL': {
      emitToLobby(game.lobbyCode, 'protocol_detail', {
        protocol: 'NOISE_CANCEL',
        msg: 'NOISE CANCEL',
        sub: 'No reacting to others! Stay in your own zone.',
        targetPlayerId: null,
      });
      break;
    }
  }
}

// Emit secret protocol reveal overlays at end of round (matching SP behavior)
function emitSecretProtocolReveal(game: GameState) {
  if (!emitToLobby) return;
  
  if (game.activeProtocol === 'UNDERDOG_VICTORY') {
    const minBid = getMinBidPenalty(game.settings.gameDuration);
    const eligible = game.players.filter(p => !p.isEliminated && p.currentBid !== null && p.currentBid >= minBid && !(p.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled));
    eligible.sort((a, b) => (a.currentBid || 0) - (b.currentBid || 0));
    
    if (eligible.length > 0) {
      emitToLobby(game.lobbyCode, 'protocol_reveal', {
        protocol: 'UNDERDOG_VICTORY',
        msg: 'SECRET REVEALED',
        sub: `UNDERDOG VICTORY: ${eligible[0].name} (+1 Token)`,
      });
    } else {
      emitToLobby(game.lobbyCode, 'protocol_reveal', {
        protocol: 'UNDERDOG_VICTORY',
        msg: 'SECRET REVEALED',
        sub: 'UNDERDOG VICTORY (No eligible winner)',
      });
    }
  }
  
  if (game.activeProtocol === 'TIME_TAX') {
    emitToLobby(game.lobbyCode, 'protocol_reveal', {
      protocol: 'TIME_TAX',
      msg: 'SECRET REVEALED',
      sub: 'TIME TAX: Everyone loses 10s!',
    });
  }
  
  if (game.activeProtocol === 'PRIVATE_CHANNEL' && game.privateChannelPlayerIds) {
    const pA = game.players.find(p => p.id === game.privateChannelPlayerIds![0]);
    const pB = game.players.find(p => p.id === game.privateChannelPlayerIds![1]);
    emitToLobby(game.lobbyCode, 'protocol_reveal', {
      protocol: 'PRIVATE_CHANNEL',
      msg: 'SECRET REVEALED',
      sub: `PRIVATE CHANNEL: ${pA?.name || '?'} & ${pB?.name || '?'} were secretly linked!`,
    });
  }
}

// Select a random protocol for the round based on variant and settings
function selectProtocolForRound(game: GameState): ProtocolType {
  if (!game.settings.protocolsEnabled) return null;
  
  // Trigger chance based on game pace (matches SP):
  // SPEED (short): 50% | STANDARD (medium): 40% | MARATHON (long): 30%
  const triggerChance = game.settings.gameDuration === 'short' ? 0.5 
    : game.settings.gameDuration === 'long' ? 0.3 
    : 0.4;
  if (Math.random() >= triggerChance) return null;
  
  let protocolPool: ProtocolType[] = [];
  
  // Standard protocols always available; reality mode adds its own pool (matches SP)
  protocolPool = [...STANDARD_PROTOCOLS];
  switch (game.settings.variant) {
    case 'SOCIAL_OVERDRIVE':
      protocolPool = [...protocolPool, ...SOCIAL_PROTOCOLS];
      break;
    case 'BIO_FUEL':
      protocolPool = [...protocolPool, ...BIO_PROTOCOLS];
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
      const activePlayers = game.players.filter(p => !p.isEliminated && !p.isBot && !(p.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled));
      if (activePlayers.length > 0) {
        game.molePlayerId = activePlayers[Math.floor(Math.random() * activePlayers.length)].id;
      }
    } else {
      game.molePlayerId = null;
    }
    if (protocol === 'PRIVATE_CHANNEL') {
      const [pcA, pcB] = getTwoRandomPlayers(game);
      if (pcA && pcB) {
        game.privateChannelPlayerIds = [pcA.id, pcB.id];
      } else {
        game.privateChannelPlayerIds = null;
      }
    } else {
      game.privateChannelPlayerIds = null;
    }
    
    log(`Protocol ${protocol} activated for round ${game.round} in lobby ${lobbyCode}`, "game");
    
    // Emit targeted protocol details to specific players (like SP)
    emitProtocolDetails(game, protocol);
  }
  
  // Reset all player holding/bid status and ability tracking for new round
  game.players.forEach(p => {
    if (!p.isEliminated) {
      p.isHolding = false;
      p.currentBid = null;
      p.roundImpacts = [];
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
  
  // Record game over snapshot
  recordGameSnapshot({
    gameId: game.gameId,
    snapshotType: 'game_over',
    roundNumber: game.round,
    winnerPlayerId: game.players[0]?.id || null,
    winningHoldTime: null,
    minBidSeconds: getMinBidPenalty(game.settings.gameDuration),
    eliminatedPlayerIds: game.players.filter(p => p.isEliminated).map(p => p.id),
    momentFlagsTriggered: [],
    protocolsTriggered: game.protocolHistory.filter(p => p !== null) as string[],
    limitBreaksTriggered: [],
    playerPositions: game.players.map(p => ({
      playerId: p.id,
      tokens: p.tokens,
      remainingTime: p.remainingTime,
      isEliminated: p.isEliminated,
    })),
    lobbyCode: game.lobbyCode,
    gameSettings: {
      difficulty: game.settings.difficulty,
      variant: game.settings.variant,
      gameDuration: game.settings.gameDuration,
      protocolsEnabled: game.settings.protocolsEnabled,
      abilitiesEnabled: game.settings.abilitiesEnabled,
    },
    isMultiplayer: 1,
  });
  
  recordGameSummary({
    gameId: game.gameId,
    lobbyCode: game.lobbyCode,
    isMultiplayer: 1,
    totalRounds: game.round,
    gameSettings: {
      difficulty: game.settings.difficulty,
      variant: game.settings.variant,
      gameDuration: game.settings.gameDuration,
      protocolsEnabled: game.settings.protocolsEnabled,
      abilitiesEnabled: game.settings.abilitiesEnabled,
    },
    playerResults: game.players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      driverId: p.selectedDriver || null,
      finalRank: i + 1,
      tokens: p.tokens,
      remainingTime: p.remainingTime,
      totalTimeBid: p.totalTimeBid,
      netImpact: p.netImpact,
      isEliminated: p.isEliminated,
      isBot: p.isBot,
      momentFlags: p.momentFlagsEarned.length,
      protocolWins: p.protocolWinsEarned.length,
      totalDrinks: 0,
      socialDares: 0,
    })),
    winnerId: game.players[0]?.id || null,
    winnerName: game.players[0]?.name || null,
  });
  
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
    
    // JAWLINE (gigachad): No penalty during countdown
    const ability = player.selectedDriver ? DRIVER_ABILITIES[player.selectedDriver] : null;
    if (ability?.name === 'JAWLINE' && game.settings.abilitiesEnabled) {
      player.penaltyAppliedThisRound = true;
      player.currentBid = 0;
      addGameLogEntry(game, {
        type: 'ability',
        playerId: player.id,
        playerName: player.name,
        message: `${player.name} used JAWLINE: no countdown penalty!`,
        value: 0,
      });
      log(`${player.name} used JAWLINE in lobby ${lobbyCode}, no penalty`, "game");
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
        basic: true,
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
      
      const activePlayers = game.players.filter((p: GamePlayer) => !p.isEliminated && !p.isBot);
      if (activePlayers.length === 0) {
        log(`All human players left game ${lobbyCode}, ending game`, "game");
        endGame(lobbyCode);
      }
    }
  });
}

export function disconnectPlayerFromGame(lobbyCode: string, socketId: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;
  
  const player = game.players.find((p: GamePlayer) => p.socketId === socketId);
  if (!player) return;
  
  player.isHolding = false;
  player.socketId = null;
  log(`${player.name} disconnected from game ${lobbyCode} (preserving state)`, "game");
  broadcastGameState(lobbyCode);
  
  const connectedHumans = game.players.filter((p: GamePlayer) => !p.isEliminated && !p.isBot && p.socketId !== null);
  if (connectedHumans.length === 0) {
    log(`All human players disconnected from game ${lobbyCode}, ending game`, "game");
    endGame(lobbyCode);
  }
}

export function reconnectPlayerToGame(lobbyCode: string, playerId: string, newSocketId: string): boolean {
  const game = activeGames.get(lobbyCode);
  if (!game) return false;
  
  const player = game.players.find((p: GamePlayer) => p.id === playerId);
  if (!player) return false;
  
  player.socketId = newSocketId;
  log(`${player.name} reconnected to game ${lobbyCode} with socket ${newSocketId}`, "game");
  broadcastGameState(lobbyCode);
  return true;
}

export function cleanupGame(lobbyCode: string) {
  clearGameIntervals(lobbyCode);
  activeGames.delete(lobbyCode);
  usedOnceAbilities.delete(lobbyCode);
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
  const panicMultiplier = game.activeProtocol === 'PANIC_ROOM' ? 2 : 1;
  const rawElapsed = game.roundStartTime && game.phase === 'bidding' 
    ? ((Date.now() - game.roundStartTime) / 1000) * panicMultiplier
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
      roundImpacts: p.roundImpacts,
      netImpact: p.netImpact,
      abilityUsed: p.abilityUsed,
      momentFlagsEarned: p.momentFlagsEarned,
      protocolWinsEarned: p.protocolWinsEarned,
    })),
    roundWinner: game.roundWinner,
    eliminatedThisRound: game.eliminatedThisRound,
    gameLog: game.gameLog,
    activeProtocol: game.activeProtocol,
    molePlayerId: null, // Mole identity sent via targeted protocol_detail event only
    settings: game.settings,
    allHumansHoldingStartTime: game.allHumansHoldingStartTime,
    gameDuration: game.gameDuration,
    minBid: minBid,
  };
  
  emitToLobby(lobbyCode, 'game_state', stateForClients);
}
