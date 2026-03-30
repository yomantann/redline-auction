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
const BOT_PERSONALITIES = ['aggressive', 'conservative', 'random', 'balanced', 'adaptive', 'psychological'] as const;

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
export type GameVariant = 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL' | 'HAUNTED';
export type ProtocolType = 
  | 'DATA_BLACKOUT' | 'DOUBLE_STAKES' | 'SYSTEM_FAILURE' 
  | 'OPEN_HAND' | 'MUTE_PROTOCOL' 
  | 'NO_LOOK' | 'LOCK_ON' 
  | 'THE_MOLE' | 'PANIC_ROOM' 
  | 'UNDERDOG_VICTORY' | 'TIME_TAX' | 'PRIVATE_CHANNEL'
  | 'TRUTH_DARE' | 'SWITCH_SEATS' | 'HUM_TUNE' | 'NOISE_CANCEL'
  | 'HYDRATE' | 'BOTTOMS_UP' | 'PARTNER_DRINK' | 'WATER_ROUND'
  | 'OVERCLOCK' | 'CALIBRATION'
  | null;

// Protocol pools by variant
const STANDARD_PROTOCOLS: ProtocolType[] = [
  'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
  'OPEN_HAND', 'MUTE_PROTOCOL', 
  'NO_LOOK', 'THE_MOLE', 'PANIC_ROOM',
  'UNDERDOG_VICTORY', 'TIME_TAX', 'PRIVATE_CHANNEL',
  'OVERCLOCK', 'CALIBRATION'
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
  'anointed': { name: 'ROYAL DECREE', effect: 'TIME_REFUND', triggerCondition: 'CONDITIONAL', refundAmount: 20, description: '+20s if bid near 20s' },
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
  isGhost?: boolean;              // Haunted mode: true when player runs out of time (can come back to life)
  selectedItem?: string;          // Haunted mode: name of selected haunted relic
  ghostImage?: string;            // Haunted mode: assigned ghost image key (e.g. 'hnt_ghost_3')
  ghostAbility?: 'reaper' | 'curse' | 'vendetta' | 'bargain' | 'possession' | 'purgatory' | null; // Ghost ability type
  ghostAbilityUsed?: boolean;     // Has this ghost's ability already been used?
  possessionTargetId?: string;    // POSSESSION: which player is being tracked
  possessionRoundsLeft?: number;  // POSSESSION: rounds remaining before auto-revive
  ghostRoundsAlive?: number;      // Fallback revive: rounds spent as ghost (all ghosts auto-revive after 3 via fallback)
  ghostCurseActive?: boolean;     // CURSE: true = tripled driver abilities globally (stored on game state as well)
  ghostReason?: 'natural' | 'forced';
  ghostTimeAtDeath?: number;
  relicConsumed?: boolean;
  bidHistory?: number[];
  pendingLastWill?: { targetId: string; curseType: 'time' | 'trophy' };
  markedBy?: string;
  echoForcedBid?: number;
  corruptRoundsLeft?: number;
  patternLockMinBid?: number;
  deathWishActive?: boolean;
  bloodPactActive?: boolean;
  cursedDiceActive?: boolean;
  finalWritActive?: boolean;      // Final Writ relic: this player auto-wins the final round
  tribunalTimePenalty?: number;   // Tribunal option A: lose 30s at start of next round
  tribunalForfeit?: boolean;      // Tribunal option B: forced to forfeit (skip) next round's bidding
  currentBid: number | null;
  isHolding: boolean;
  // Round statistics
  totalTimeBid: number;
  roundImpacts: { type: string; value: number; source: string }[];
  pendingRoundImpacts?: { type: string; value: number; source: string }[]; // ADD THIS LINE
  netImpact: number; // Cumulative time impact from abilities/protocols (not bids)
  abilityUsed: boolean;
  penaltyAppliedThisRound?: boolean; // Track if penalty was already applied this round
  // Game-level accumulators for game over screen
  momentFlagsEarned: string[];
  protocolWinsEarned: string[];
  // Bonus trophy tracking
  shortestWinBidTime?: number;   // Shortest bid time used to win any round (for Market Sniper criterion)
  lostTrophyLastRound?: boolean; // True if this player's tokens decreased in the most recent round
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
  bonusTrophiesEnabled: boolean;
  abilitiesEnabled: boolean;
  variant: GameVariant;
  gameDuration: GameDuration;
  allowedProtocols?: ProtocolType[];
}

export interface PendingRelicVote {
  relicId: string;
  activatorId: string;
  targetId?: string;
  options: { id: string; label: string }[];
  votes: Record<string, string>;  // playerId → optionId
  deadline: number;
  resolved?: boolean;
}

export interface GameState {
  gameId: string; // Unique identifier for database snapshots
  lobbyCode: string;
  players: GamePlayer[];
  round: number;
  totalRounds: number;
  phase: 'driver_selection' | 'waiting_for_ready' | 'countdown' | 'bidding' | 'overclock' | 'round_end' | 'game_over';
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
  firstEliminatedIds: string[];  // IDs of first player(s) eliminated in the game (Flash Crash criterion)
  ghostCurseActive: boolean;     // Haunted CURSE ability: true = driver abilities tripled for alive players
  // Relic game-state fields
  forcedProtocolNextRound?: ProtocolType | null; // Protocol Forcer: override next round's protocol
  pendingVote?: PendingRelicVote | null;          // Active vote relic (Tribunal / Conclave)
  voteQueue?: PendingRelicVote[];                  // Queued votes waiting for current vote to resolve
  protocolsAlwaysOn?: boolean;                    // Conclave C: 100% protocol trigger rest of game
  skipNextRound?: boolean;                        // Conclave B: skip next round as tie
  overclockClickCounts: Record<string, number>; // Click counts per player during OVERCLOCK protocol
  calibrationTargetSeconds: number | null; // Target hold time for CALIBRATION protocol (11-40s)
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
  const shuffledPersonalities = [...BOT_PERSONALITIES].sort(() => Math.random() - 0.5);
  while (gamePlayers.length < MIN_PLAYERS) {
    const personality = shuffledPersonalities[botIndex % shuffledPersonalities.length];
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
    bonusTrophiesEnabled: lobbySettings?.bonusTrophiesEnabled ?? true,
    abilitiesEnabled: lobbySettings?.abilitiesEnabled || false,
    variant: lobbySettings?.variant || 'STANDARD',
    gameDuration: mappedDuration,
    allowedProtocols: lobbySettings?.allowedProtocols,
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
    firstEliminatedIds: [],
    ghostCurseActive: false,
    forcedProtocolNextRound: null,
    pendingVote: null,
    voteQueue: [],
    protocolsAlwaysOn: false,
    skipNextRound: false,
    overclockClickCounts: {},
    calibrationTargetSeconds: null,
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
      if (g.activeProtocol === 'OVERCLOCK') {
        startOverclock(lobbyCode);
      } else {
        startBidding(lobbyCode);
      }
    } else {
      broadcastGameState(lobbyCode);
    }
  }, 1000);
  
  gameIntervals.set(`${lobbyCode}_countdown`, interval);
}

function startBidding(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;

  // --- CONCLAVE B: Skip this round as a tie ---
  if (game.skipNextRound) {
    game.skipNextRound = false;
    game.phase = 'round_end';
    game.roundWinner = null;
    addGameLogEntry(game, {
      type: 'win',
      message: `Round ${game.round} SKIPPED (Conclave vote) — no winner, no bids.`,
      basic: true,
    });
    broadcastGameState(lobbyCode);
    // Use same post-round logic as endRound but minimal — just advance
    game.players.forEach(p => {
      if (!p.isBot && !p.isEliminated && !p.isGhost) (p as any).roundEndAcknowledged = false;
      else (p as any).roundEndAcknowledged = true;
    });
    setTimeout(() => {
      const g = activeGames.get(lobbyCode);
      if (!g) return;
      g.round += 1;
      if (g.round > g.totalRounds) {
        endGame(lobbyCode);
      } else {
        startWaitingForReady(lobbyCode);
      }
    }, 3000);
    return;
  }

  game.phase = 'bidding';
  game.roundStartTime = Date.now();
  
  game.players.forEach(p => {
    if (!p.isEliminated) {
      if (p.isBot) {
        p.isHolding = true;
      }
      p.currentBid = 0;
    } else {
      p.currentBid = null;
      p.isHolding = false;
    }
  });

  // --- TRIBUNAL B: FORFEIT — forced players release immediately at round start ---
  if (game.settings.variant === 'HAUNTED') {
    const minBid = getMinBidPenalty(game.gameDuration);
    game.players.forEach(p => {
      if (p.tribunalForfeit && !p.isEliminated && !p.isGhost) {
        p.tribunalForfeit = false;
        p.isHolding = false;
        p.currentBid = minBid;
        addGameLogEntry(game, { type: 'impact', playerId: p.id, playerName: p.name, message: `${p.name} TRIBUNAL B: forfeited bidding (auto-released)`, basic: true });
      }
    });
  }

  game.botTargetBids = calculateBotTargetBids(game);

  // --- ECHO / PATTERN LOCK: override bot target bids ---
  if (game.settings.variant === 'HAUNTED') {
    const minBid = getMinBidPenalty(game.gameDuration);
    game.players.forEach(p => {
      if (!p.isBot || p.isEliminated || p.isGhost) return;
      if (p.echoForcedBid !== undefined) {
        // Bot targets max(echoForcedBid, patternLockMinBid) so both constraints are satisfied
        const effectiveForcedBid = Math.max(p.echoForcedBid, p.patternLockMinBid ?? 0);
        const holdTarget = Math.max(0, effectiveForcedBid - minBid);
        game.botTargetBids[p.id] = holdTarget;
        log(`Echo override: bot ${p.name} target hold = ${holdTarget.toFixed(1)}s in lobby ${lobbyCode}`, "game");
      } else if (p.patternLockMinBid !== undefined) {
        // Bot cannot release before patternLockMinBid; if current target is below it, raise it
        const holdMin = Math.max(0, p.patternLockMinBid - minBid);
        if ((game.botTargetBids[p.id] ?? 0) < holdMin) {
          game.botTargetBids[p.id] = holdMin;
          log(`PatternLock override: bot ${p.name} min hold = ${holdMin.toFixed(1)}s in lobby ${lobbyCode}`, "game");
        }
      }
    });
  }
  
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
    const isHaunted = g.settings.variant === 'HAUNTED';
    g.players.forEach(p => {
      // Ghosts can't hold in Haunted mode (they're in ghost state)
      if (p.isGhost) { p.isHolding = false; return; }
      if (p.isHolding && !p.isEliminated) {
        const playerHasFireWall = p.selectedDriver === 'low_flame' && g.settings.abilitiesEnabled;
        const playerElapsed = (playerHasFireWall && g.activeProtocol === 'PANIC_ROOM') ? rawElapsed : elapsed;
        p.currentBid = playerElapsed + minBid; // Bid starts at min bid value
        
        // ECHO: if a non-bot player has echoForcedBid, auto-release at max(echoForcedBid, patternLockMinBid)
        if (!p.isBot && p.echoForcedBid !== undefined) {
          const effectiveForcedBid = Math.max(p.echoForcedBid, p.patternLockMinBid ?? 0);
          if (p.currentBid >= effectiveForcedBid) {
            p.isHolding = false;
            p.currentBid = Math.round(effectiveForcedBid * 10) / 10;
            log(`Echo: ${p.name} auto-released at ${p.currentBid.toFixed(1)}s in lobby ${lobbyCode}`, "game");
            return;
          }
        }

        // Auto-ghostify (Haunted) or eliminate (other modes) if bid exceeds remaining time
        if (p.currentBid >= p.remainingTime) {
          p.isHolding = false;
          p.currentBid = p.remainingTime;
          if (isHaunted) {
            // Haunted: become a ghost, NOT eliminated
            p.isGhost = true;
            p.ghostReason = 'natural';
            p.ghostImage = `hnt_ghost_${Math.floor(Math.random() * 6) + 1}`;
            log(`${p.name} became a ghost (ran out of time) in lobby ${lobbyCode}`, "game");
          } else {
            p.isEliminated = true;
            g.eliminatedThisRound.push(p.id);
            log(`${p.name} eliminated (ran out of time) in lobby ${lobbyCode}`, "game");
          }
        }
      }
    });
    
    // Bot AI: decide when to release
    processBotBids(g);
    
    // Check if round should end (all non-ghost, non-eliminated players have released)
    const holdingPlayers = g.players.filter(p => p.isHolding && !p.isEliminated && !p.isGhost);
    
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

function startOverclock(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;

  game.phase = 'overclock';
  game.roundWinner = null;
  game.eliminatedThisRound = [];

  // Reset click counts and bids for all active players
  game.overclockClickCounts = {};
  game.players.forEach(p => {
    if (!p.isEliminated) {
      game.overclockClickCounts[p.id] = 0;
      p.currentBid = 0;
      p.isHolding = false;
    } else {
      p.currentBid = null;
    }
  });

  // Assign random click counts to bots (85-120 clicks)
  game.players.forEach(p => {
    if (p.isBot && !p.isEliminated) {
      game.overclockClickCounts[p.id] = Math.floor(Math.random() * 36) + 85; // 85-120
    }
  });

  broadcastGameState(lobbyCode);
  log(`OVERCLOCK phase started for round ${game.round} in lobby ${lobbyCode}`, "game");

  const startTime = Date.now();

  // Broadcast every 500ms so clients see updated click counts
  const interval = setInterval(() => {
    const g = activeGames.get(lobbyCode);
    if (!g || g.phase !== 'overclock') {
      clearInterval(interval);
      return;
    }
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= 15) {
      clearInterval(interval);
      endRound(lobbyCode);
      return;
    }
    broadcastGameState(lobbyCode);
  }, 500);

  gameIntervals.set(`${lobbyCode}_overclock`, interval);
}

export function playerOverclockClick(lobbyCode: string, socketId: string) {
  const game = activeGames.get(lobbyCode);
  if (!game || game.phase !== 'overclock') return;

  const player = game.players.find(p => p.socketId === socketId);
  if (!player || player.isEliminated || player.isBot) return;

  game.overclockClickCounts[player.id] = (game.overclockClickCounts[player.id] || 0) + 1;
  // No individual broadcast - state is synced every 500ms in the overclock interval
}

function getDriverBidAdjustment(driverId: string | undefined, holdTime: number, game: GameState, player: GamePlayer): { holdTime: number; reason?: string } {
  if (!driverId || !game.settings.abilitiesEnabled) return { holdTime };
  const ability = DRIVER_ABILITIES[driverId];
  if (!ability) return { holdTime };

  switch (driverId) {
    case 'rainbow_dash':
      if (player.remainingTime > 45 && holdTime < 38) {
        return { holdTime: 38 + Math.random() * 6, reason: 'RAINBOW_RUN_push_40' };
      }
      break;
    case 'anointed':
      if (player.remainingTime > 25) {
        const minBid = getMinBidPenalty(game.gameDuration);
        const target = 20 - minBid;
        if (Math.random() > 0.4) {
          return { holdTime: target + (Math.random() * 2 - 1), reason: 'ROYAL_DECREE_near_20' };
        }
      }
      break;
    case 'primate':
      if (player.remainingTime > 20 && holdTime < 12) {
        return { holdTime: holdTime * 1.3, reason: 'CHEFS_SPECIAL_push_margin' };
      }
      break;
    case 'frostbyte':
      return { holdTime: holdTime * 1.08, reason: 'CRYO_FREEZE_extra_aggro' };
    case 'the_rind':
      return { holdTime: holdTime * 0.8, reason: 'CHEESE_TAX_play_safe' };
    case 'pain_hider':
      return { holdTime: holdTime * 0.85, reason: 'HIDE_PAIN_lose_ok' };
    case 'guardian_h':
      if (game.round === 1 && Math.random() > 0.3) {
        return { holdTime: holdTime * 1.4, reason: 'SPIRIT_SHIELD_R1_push' };
      }
      break;
    case 'low_flame':
      if (game.activeProtocol === 'PANIC_ROOM') {
        return { holdTime: holdTime * 1.3, reason: 'FIRE_WALL_immune_panic' };
      }
      break;
    case 'panic_bot':
      if (Math.random() > 0.5) {
        return { holdTime: holdTime * 1.15, reason: 'PANIC_MASH_gamble' };
      } else {
        return { holdTime: holdTime * 0.75, reason: 'PANIC_MASH_cautious' };
      }
    case 'hotwired':
      return { holdTime: holdTime * 0.9, reason: 'BURN_IT_moderate' };
    case 'click_click':
      if (holdTime > 5) {
        const otherBids = Object.values(game.botTargetBids);
        if (otherBids.length > 0) {
          const avgBid = otherBids.reduce((a, b) => a + b, 0) / otherBids.length;
          return { holdTime: avgBid + 0.5 + Math.random() * 1.0, reason: 'HYPER_CLICK_close_win' };
        }
      }
      break;
  }
  return { holdTime };
}

function calculateBotTargetBids(game: GameState): Record<string, number> {
  const bids: Record<string, number> = {};
  const isPanicRoom = game.activeProtocol === 'PANIC_ROOM';
  const isNoLook = game.activeProtocol === 'NO_LOOK';
  const isMute = game.activeProtocol === 'MUTE_PROTOCOL';
  const isMole = game.activeProtocol === 'THE_MOLE';
  const isLastRound = game.round >= game.totalRounds;
  const minBidTime = getMinBidPenalty(game.gameDuration);
  const roundsLeft = game.totalRounds - game.round + 1;
  const roundFraction = game.round / game.totalRounds;
  const isEarlyGame = game.round <= 3;
  const isMidGame = game.round > 3 && game.round <= 6;
  const isLateGame = game.round > 6;

  const avgTokens = game.players.filter(p => !p.isEliminated).reduce((sum, p) => sum + p.tokens, 0) / Math.max(1, game.players.filter(p => !p.isEliminated).length);
  const maxTokens = Math.max(...game.players.filter(p => !p.isEliminated).map(p => p.tokens));

  game.players.forEach(p => {
    if (!p.isBot || p.isEliminated) return;

    const timePerRound = p.remainingTime / Math.max(1, roundsLeft);
    const lowTime = p.remainingTime <= 8;
    const midTime = p.remainingTime > 8 && p.remainingTime <= 20;
    const tokenDeficit = maxTokens - p.tokens;
    const isBehind = tokenDeficit >= 2;
    const isAhead = p.tokens >= maxTokens && p.tokens > 0;

    const riskDown =
      (isPanicRoom ? 0.35 : 0) +
      (isNoLook ? 0.1 : 0) +
      (isMute ? 0.1 : 0) +
      (isLastRound ? 0.2 : 0) +
      (lowTime ? 0.35 : midTime ? 0.15 : 0);

    const maxHoldTime = Math.max(0.5, p.remainingTime - minBidTime);
    let holdTime = 0.5;

    switch (p.personality) {
      case 'aggressive': {
        const baseLow = 18 + Math.random() * 28;
        const cautious = 6 + Math.random() * 10;
        const chooseHigh = Math.random() > (0.25 + riskDown);
        holdTime = chooseHigh ? baseLow : cautious;
        if (isLateGame && isBehind) holdTime *= 1.2;
        if (isLateGame && isAhead) holdTime *= 0.7;
        break;
      }

      case 'conservative': {
        const base = 1.5 + Math.random() * 10;
        holdTime = base;
        if (isLastRound || isPanicRoom || lowTime) holdTime = 1.0 + Math.random() * 6;
        if (isLateGame && isBehind && Math.random() > 0.5) {
          holdTime = 8 + Math.random() * 12;
        }
        break;
      }

      case 'balanced': {
        const budgetBid = timePerRound * (0.7 + Math.random() * 0.5);
        holdTime = budgetBid;
        if (isEarlyGame) holdTime *= 0.85;
        if (isLateGame) holdTime *= 1.1;
        if (isBehind) holdTime *= 1.15;
        if (isAhead) holdTime *= 0.85;
        break;
      }

      case 'adaptive': {
        if (isEarlyGame) {
          holdTime = 3 + Math.random() * 8;
        } else if (isMidGame) {
          const recentWins = game.gameLog
            .filter(e => e.type === 'win' && e.round >= game.round - 3)
            .map(e => e.value || 0);
          const avgWinBid = recentWins.length > 0 
            ? recentWins.reduce((a, b) => a + b, 0) / recentWins.length 
            : 15;
          holdTime = (avgWinBid - minBidTime) * (0.9 + Math.random() * 0.3);
        } else {
          if (isBehind) {
            holdTime = timePerRound * (1.2 + Math.random() * 0.5);
          } else {
            holdTime = timePerRound * (0.5 + Math.random() * 0.3);
          }
        }
        break;
      }

      case 'psychological': {
        const unpredictable = Math.random();
        if (unpredictable < 0.2) {
          holdTime = 1.0 + Math.random() * 3;
        } else if (unpredictable < 0.5) {
          holdTime = 15 + Math.random() * 20;
        } else {
          holdTime = 8 + Math.random() * 15;
        }
        if (isLateGame && isBehind) {
          holdTime = Math.max(holdTime, 20 + Math.random() * 15);
        }
        if (isAhead && Math.random() > 0.6) {
          holdTime = 1.5 + Math.random() * 4;
        }
        break;
      }

      case 'random':
      default: {
        const base = 1 + Math.random() * 40;
        holdTime = base * (1 - Math.min(0.55, riskDown));
        if (isLateGame && Math.random() > 0.6) {
          holdTime = p.remainingTime * (0.4 + Math.random() * 0.5);
        }
        break;
      }
    }

    if (isMole) {
      holdTime = holdTime * 0.85;
    }

    const driverAdj = getDriverBidAdjustment(p.selectedDriver, holdTime, game, p);
    holdTime = driverAdj.holdTime;

    holdTime += Math.random() * 0.8;
    holdTime = Math.min(maxHoldTime, Math.max(0.5, holdTime));

    // CALIBRATION: Override hold time last so bot always stays within ±7s of target
    if (game.activeProtocol === 'CALIBRATION' && game.calibrationTargetSeconds !== null) {
      const target = game.calibrationTargetSeconds;
      // Bots bid within 0.2–7.0 seconds of the target (random offset in either direction)
      // Hold time = target - minBid (since currentBid = elapsed + minBid)
      const offsetMagnitude = 0.2 + Math.random() * 6.8; // 0.2 to 7.0
      const offsetSign = Math.random() < 0.5 ? -1 : 1;
      const baseHold = Math.max(0.5, target - minBidTime);
      holdTime = baseHold + offsetSign * offsetMagnitude;
      // Avoid elimination: cap hold time so currentBid (holdTime + minBidTime) won't exceed remainingTime
      const safeMaxHold = Math.max(0.5, p.remainingTime - minBidTime - 0.5);
      holdTime = Math.min(safeMaxHold, Math.max(0.5, holdTime));
    }

    bids[p.id] = parseFloat(holdTime.toFixed(1));
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
      const targetHoldTime = game.botTargetBids[p.id];
      if (targetHoldTime !== undefined && elapsed >= targetHoldTime) {
        p.isHolding = false;
        p.currentBid = Math.round((elapsed + minBid) * 10) / 10;
        log(`Bot ${p.name} released at ${p.currentBid.toFixed(1)}s (hold target ${targetHoldTime}s + ${minBid}s minBid) in lobby ${game.lobbyCode}`, "game");
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
    if (player.isEliminated || player.isGhost || !player.selectedDriver) return;
    
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
          // Special case for Spirit Shield - only Round 1
          if (player.selectedDriver === 'guardian_h' && game.round !== 1) break;
          triggered = true;
        }
        break;
        
      case 'LOSE':
        if (!isWinner && winnerId) {
          // HIDE PAIN (Pain Hider): only triggers if lost by >15s margin
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
          } else if (player.selectedDriver === 'anointed') {
            if (Math.abs(playerBid - 20) <= 0.4) {
              triggered = true
          }
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
            // Axe Swing: target the player with the most time REMAINING after bid deduction.
            // Bids are deducted before processAbilities runs, so remainingTime is already post-bid.
            const nonEliminated = game.players.filter(p => 
              p.id !== player.id && 
              !p.isEliminated && 
              !game.eliminatedThisRound.includes(p.id) && 
              !immunePlayerIds.includes(p.id)
            );
            if (nonEliminated.length > 0) {
              // Sort by post-bid remaining time descending; take the first (richest) player
              const sorted = [...nonEliminated].sort((a, b) => b.remainingTime - a.remainingTime);
              target = sorted[0];
            }
          } else if (player.selectedDriver === 'accuser' || player.selectedDriver === 'hotwired') {
            // Manager Call / Burn It: random opponents or all
            const targets = game.players.filter(p => p.id !== player.id && !p.isEliminated && !immunePlayerIds.includes(p.id));
            if (player.selectedDriver === 'hotwired') {
              // Burn It: affects all others
              const curseM = game.ghostCurseActive && game.settings.variant === 'HAUNTED' ? 3 : 1;
              const cursedRefund = refundAmount * curseM;
              targets.forEach(t => {
                t.remainingTime += cursedRefund;
                t.netImpact += cursedRefund;
                t.roundImpacts.push({ type: 'DISRUPT', value: cursedRefund, source: ability.name });
                abilityImpacts.push({
                  playerId: player.id,
                  targetId: t.id,
                  ability: ability.name,
                  effect: 'DISRUPT',
                  value: cursedRefund,
                });
              });
              if (targets.length > 0) {
                addGameLogEntry(game, {
                  type: 'ability',
                  playerId: player.id,
                  playerName: player.name,
                  message: `${player.name} triggered ${ability.name}: ${cursedRefund}s to all opponents${curseM > 1 ? ' (×3 CURSE)' : ''}`,
                  value: cursedRefund,
                });
              }
              return; // Already handled all targets
            } else {
              target = targets[Math.floor(Math.random() * targets.length)];
            }
          }
          
          if (target && !immunePlayerIds.includes(target.id)) {
            const curseM = game.ghostCurseActive && game.settings.variant === 'HAUNTED' ? 3 : 1;
            // For Cheese Tax (LOSE trigger), we ADD to self and REMOVE from target
            if (player.selectedDriver === 'the_rind') {
              const taxAmt = Math.abs(refundAmount) * curseM;
              player.remainingTime += taxAmt;
              player.netImpact += taxAmt;
              player.roundImpacts.push({ type: 'STEAL', value: taxAmt, source: ability.name });
              target.remainingTime -= taxAmt;
              target.netImpact -= taxAmt;
              target.roundImpacts.push({ type: 'STOLEN', value: -taxAmt, source: ability.name });
            } else {
              const cursedRefund = refundAmount * curseM; // refundAmount is negative for DISRUPT
              target.remainingTime += cursedRefund;
              target.netImpact += cursedRefund;
              target.roundImpacts.push({ type: 'DISRUPT', value: cursedRefund, source: ability.name });
            }
            
            abilityImpacts.push({
              playerId: player.id,
              targetId: target.id,
              ability: ability.name,
              effect: 'DISRUPT',
              value: player.selectedDriver === 'the_rind' ? Math.abs(refundAmount) * curseM : refundAmount * curseM,
            });
            addGameLogEntry(game, {
              type: 'ability',
              playerId: player.id,
              playerName: player.name,
              message: `${player.name} triggered ${ability.name}: ${player.selectedDriver === 'the_rind' ? Math.abs(refundAmount) * curseM : Math.abs(refundAmount * curseM)}s to ${target.name}${curseM > 1 ? ' (×3 CURSE)' : ''}`,
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

  // Snapshot tokens before any modifications this round (for lostTrophyLastRound detection)
  const tokensSnapshot = new Map<string, number>();
  game.players.forEach(p => tokensSnapshot.set(p.id, p.tokens));

  // Snapshot time banks before any deductions (for LATE_PANIC check)
  const startingTimeBanks = new Map<string, number>();
  game.players.forEach(p => {
    const bid = p.currentBid || 0;
    startingTimeBanks.set(p.id, p.remainingTime + bid);
  });

  // Snapshot ghost state at round start (for Last Will deferred trigger detection)
  const wasGhostAtRoundStart = new Map<string, boolean>();
  game.players.forEach(p => wasGhostAtRoundStart.set(p.id, !!p.isGhost));
  

  // --- OVERCLOCK PROTOCOL: Click-count based winner/loser determination ---
  if (game.activeProtocol === 'OVERCLOCK') {
    const overclockActivePlayers = game.players.filter(p => !p.isEliminated);
    if (overclockActivePlayers.length > 0) {
      const clickCounts = game.overclockClickCounts;
      const maxClicks = Math.max(...overclockActivePlayers.map(p => clickCounts[p.id] || 0));
      const minClicks = Math.min(...overclockActivePlayers.map(p => clickCounts[p.id] || 0));

      // Winner: most clicks → gets a token
      const topClickers = overclockActivePlayers.filter(p => (clickCounts[p.id] || 0) === maxClicks);
      const topWinner = topClickers[Math.floor(Math.random() * topClickers.length)];
      topWinner.tokens += 1;
      game.roundWinner = { id: topWinner.id, name: topWinner.name, bid: maxClicks };
      topWinner.protocolWinsEarned.push('OVERCLOCK');

      addGameLogEntry(game, {
        type: 'win',
        playerId: topWinner.id,
        playerName: topWinner.name,
        message: `OVERCLOCK: ${topWinner.name} wins with ${maxClicks} clicks!`,
        basic: true,
      });
      log(`OVERCLOCK winner: ${topWinner.name} with ${maxClicks} clicks in lobby ${lobbyCode}`, "game");

      // Loser: least clicks → -35s timebank (only if different click count from winner)
      if (minClicks < maxClicks) {
        const bottomClickers = overclockActivePlayers.filter(p => (clickCounts[p.id] || 0) === minClicks);
        const loser = bottomClickers[Math.floor(Math.random() * bottomClickers.length)];
        const penalty = 35;
        loser.remainingTime = Math.max(0, loser.remainingTime - penalty);
        loser.netImpact -= penalty;
        loser.roundImpacts.push({ type: 'OVERCLOCK_PENALTY', value: -penalty, source: 'OVERCLOCK' });
        if (loser.remainingTime === 0 && !loser.isEliminated) {
          loser.isEliminated = true;
          if (!game.eliminatedThisRound.includes(loser.id)) {
            game.eliminatedThisRound.push(loser.id);
          }
        }
        addGameLogEntry(game, {
          type: 'protocol',
          playerId: loser.id,
          playerName: loser.name,
          message: `OVERCLOCK: ${loser.name} had fewest clicks (${minClicks}) — loses 35s!`,
          value: -penalty,
          basic: true,
        });
        log(`OVERCLOCK loser: ${loser.name} with ${minClicks} clicks, -35s in lobby ${lobbyCode}`, "game");
      }
    }

    // Skip normal bid-based winner determination; jump to post-winner processing
    const winnerId = game.roundWinner?.id || null;

    // Emit overclock result reveal
    if (emitToLobby) {
      emitToLobby(lobbyCode, 'protocol_reveal', {
        protocol: 'OVERCLOCK',
        msg: 'OVERCLOCK RESULTS',
        sub: game.roundWinner ? `${game.roundWinner.name} clicked the most (${game.roundWinner.bid})!` : 'No winner',
      });
    }

    // Process pending impacts, abilities, and finalize round
    game.players.forEach(p => {
      if (p.pendingRoundImpacts && p.pendingRoundImpacts.length > 0) {
        p.roundImpacts.push(...p.pendingRoundImpacts);
        p.pendingRoundImpacts = [];
      }
    });
    processAbilities(game, winnerId);
    game.players.forEach(p => {
      if (p.remainingTime < 0) p.remainingTime = 0;
      if (p.remainingTime === 0 && !p.isEliminated) {
        p.isEliminated = true;
        if (!game.eliminatedThisRound.includes(p.id)) {
          game.eliminatedThisRound.push(p.id);
        }
      }
    });

    broadcastGameState(lobbyCode);
    processRealityModeAbilities(game, winnerId, 'end');

    game.players.forEach(p => {
      if (!p.isBot && !p.isEliminated) {
        (p as any).roundEndAcknowledged = false;
      } else {
        (p as any).roundEndAcknowledged = true;
      }
    });

    if (game.eliminatedThisRound.length > 0 && game.firstEliminatedIds.length === 0) {
      game.firstEliminatedIds = [...game.eliminatedThisRound];
    }

    const activePlayers = game.players.filter(p => !p.isEliminated);
    const activeHumans = activePlayers.filter(p => !p.isBot);
    if (activePlayers.length <= 1 || game.round >= game.totalRounds) {
      setTimeout(() => endGame(lobbyCode), 3000);
    } else if (activeHumans.length === 0 && game.isMultiplayer) {
      game.round = game.totalRounds;
      setTimeout(() => endGame(lobbyCode), 3000);
    }

    recordGameSnapshot({
      gameId: game.gameId,
      snapshotType: game.eliminatedThisRound.length > 0 ? 'elimination' : 'round_end',
      roundNumber: game.round,
      winnerPlayerId: game.roundWinner?.id || null,
      winningHoldTime: null,
      minBidSeconds: getMinBidPenalty(game.settings.gameDuration),
      eliminatedPlayerIds: game.eliminatedThisRound,
      momentFlagsTriggered: [],
      protocolsTriggered: ['OVERCLOCK'],
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
    return;
  }

  // Deduct bid time first so overbidding eliminations are reflected in winner determination
  game.players.forEach(p => {
    if (p.currentBid && p.currentBid > 0) {
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
  
  // Find winner (highest bid among non-eliminated, non-ghost)
  const participants = game.players.filter(p => !p.isEliminated && !p.isGhost && p.currentBid !== null && p.currentBid > 0 && !game.eliminatedThisRound.includes(p.id));
  
  let winnerId: string | null = null;
  
  if (participants.length > 0) {
    // CALIBRATION: winner = closest bid to calibrationTargetSeconds
    let sorted: typeof participants;
    if (game.activeProtocol === 'CALIBRATION' && game.calibrationTargetSeconds !== null) {
      const target = game.calibrationTargetSeconds;
      sorted = [...participants].sort((a, b) => {
        const aDiff = Math.abs((a.currentBid || 0) - target);
        const bDiff = Math.abs((b.currentBid || 0) - target);
        return aDiff - bDiff;
      });
    } else {
      sorted = [...participants].sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    }

    const topBid = sorted[0].currentBid || 0;
    const secondBid = sorted[1]?.currentBid || 0;
    // Detect a tie: top two bids round to the same displayed value (1 decimal place)
    const roundTo1 = (n: number) => Math.round(n * 10) / 10;
    const isTie = sorted.length >= 2 && (
      game.activeProtocol === 'CALIBRATION' && game.calibrationTargetSeconds !== null
        ? Math.abs(roundTo1(topBid) - game.calibrationTargetSeconds) === Math.abs(roundTo1(secondBid) - game.calibrationTargetSeconds)
        : roundTo1(topBid) === roundTo1(secondBid)
    );

    if (!isTie) {
      const winner = sorted[0];
      winnerId = winner.id;
      game.roundWinner = { id: winner.id, name: winner.name, bid: winner.currentBid || 0 };

      // Award token(s) - double if DOUBLE_STAKES protocol is active (FIRE WALL immune)
      const winnerHasFireWall = winner.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled;
      const tokensAwarded = (game.isDoubleTokensRound && !winnerHasFireWall) ? 2 : 1;
      winner.tokens += tokensAwarded;

      // Track shortest win bid time (for Market Sniper bonus trophy)
      const winnerBidTime = winner.currentBid || 0;
      if (winnerBidTime > 0 && (winner.shortestWinBidTime === undefined || winnerBidTime < winner.shortestWinBidTime)) {
        winner.shortestWinBidTime = winnerBidTime;
      }

      const winMsg = game.activeProtocol === 'CALIBRATION' && game.calibrationTargetSeconds !== null
        ? `${winner.name} won round ${game.round} with closest bid (${winner.currentBid?.toFixed(1)}s, target ${game.calibrationTargetSeconds}s)`
        : `${winner.name} won round ${game.round} with ${winner.currentBid?.toFixed(1)}s bid${game.isDoubleTokensRound ? ' (2x tokens!)' : ''}`;

      addGameLogEntry(game, {
        type: 'win',
        playerId: winner.id,
        playerName: winner.name,
        message: winMsg,
        value: winner.currentBid || 0,
        basic: true,
      });

      log(`Round ${game.round} winner: ${winner.name} with bid of ${winner.currentBid?.toFixed(1)}s${game.isDoubleTokensRound ? ' (DOUBLE STAKES)' : ''}`, "game");
    } else {
      // Tie: no winner this round
      game.roundWinner = null;
      addGameLogEntry(game, {
        type: 'win',
        message: `Round ${game.round} DEADLOCK: ${sorted[0].name} & ${sorted[1].name} tied at ${topBid.toFixed(1)}s`,
        basic: true,
      });
      log(`Round ${game.round} DEADLOCK SYNC: tie at ${topBid.toFixed(1)}s in lobby ${lobbyCode}`, "game");
    }
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
      underdog.protocolWinsEarned.push('UNDERDOG_VICTORY'); // Protocol win goes to the underdog
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

  // Move pending impacts to roundImpacts (so they show on cards at round end)
  game.players.forEach(p => {
    if (p.pendingRoundImpacts && p.pendingRoundImpacts.length > 0) {
      p.roundImpacts.push(...p.pendingRoundImpacts);
      p.pendingRoundImpacts = [];
    }
  });
  
  // Snapshot eliminated IDs before abilities run (for NAIL IN THE COFFIN detection)
  const eliminatedBeforeAbilities = new Set(game.eliminatedThisRound);

  // Process abilities before time deduction (allows for refunds)
  const abilityImpacts = processAbilities(game, winnerId) || [];

  // Process roundImpacts (penalties from early release during countdown)
  game.players.forEach(p => {
    if (p.roundImpacts && p.roundImpacts.length > 0) {
      p.roundImpacts.forEach(impact => {
        if (impact.type === 'PENALTY') {
          p.remainingTime += impact.value; // value is already negative (e.g., -5)
          p.netImpact += impact.value; // Track for stats

          addGameLogEntry(game, {
            type: 'impact',
            playerId: p.id,
            playerName: p.name,
            message: `${p.name} received ${impact.value.toFixed(1)}s penalty (${impact.source})`,
            value: impact.value,
          });
          // Check for elimination from penalty
          if (p.remainingTime <= 0 && !p.isEliminated) {
            p.remainingTime = 0;
            p.isEliminated = true;
            if (!game.eliminatedThisRound.includes(p.id)) {
              game.eliminatedThisRound.push(p.id);
              addGameLogEntry(game, {
                type: 'elimination',
                playerId: p.id,
                playerName: p.name,
                message: `${p.name} was eliminated (early release penalty)`,
                basic: true,
      });
                }
              }
            }
          });
        }
      });
  
  // Check for eliminations from ability effects (clamp and eliminate/ghostify players with <= 0 time)
  game.players.forEach(p => {
    if (p.remainingTime < 0) {
      p.remainingTime = 0;
    }
    if (p.remainingTime === 0 && !p.isEliminated && !p.isGhost) {
      if (game.settings.variant === 'HAUNTED') {
        p.isGhost = true;
        p.ghostReason = 'natural';
        if (!p.ghostImage) p.ghostImage = `hnt_ghost_${Math.floor(Math.random() * 6) + 1}`;
        addGameLogEntry(game, {
          type: 'elimination',
          playerId: p.id,
          playerName: p.name,
          message: `${p.name} became a ghost (ability effect)`,
          basic: true,
        });
      } else {
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
    }
  });

  // HAUNTED: Assign ghostAbility to newly ghosted players (if not already set)
  if (game.settings.variant === 'HAUNTED') {
    const GHOST_ABILITY_SERVER_MAP: Record<number, 'reaper' | 'curse' | 'vendetta' | 'bargain' | 'possession' | 'purgatory' | null> = {
      1: 'reaper', 2: 'curse', 3: 'vendetta', 4: 'bargain', 5: 'possession', 6: 'purgatory',
    };
    game.players.forEach(p => {
      if (p.isGhost && !p.ghostAbility && !p.ghostAbilityUsed) {
        const idx = p.ghostImage ? parseInt(p.ghostImage.replace('hnt_ghost_', ''), 10) : Math.floor(Math.random() * 6) + 1;
        p.ghostAbility = GHOST_ABILITY_SERVER_MAP[idx] ?? null;
      }
    });

    // Process ghost abilities for BOT ghosts (human ghost abilities are handled client-side)
    game.players.forEach(ghost => {
      if (!ghost.isGhost || ghost.ghostAbilityUsed || !ghost.ghostAbility || !ghost.isBot) return;

      const aliveTargets = game.players.filter(p => !p.isGhost && !p.isEliminated && p.id !== ghost.id);

      if (ghost.ghostAbility === 'reaper' && aliveTargets.length > 0) {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        const idx = Math.floor(Math.random() * 6) + 1;
        const GMAP: Record<number, 'reaper' | 'curse' | 'vendetta' | 'bargain' | 'possession' | 'purgatory' | null> = {
          1: 'reaper', 2: 'curse', 3: 'vendetta', 4: 'bargain', 5: 'possession', 6: 'purgatory',
        };
        const savedTime = target.remainingTime;
        target.isGhost = true;
        target.remainingTime = 0;
        target.ghostImage = `hnt_ghost_${idx}`;
        target.ghostAbility = GMAP[idx] ?? null;
        target.ghostReason = 'forced';
        target.ghostTimeAtDeath = savedTime;
        ghost.ghostAbilityUsed = true;
        addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} REAPER: ${target.name} becomes a ghost!`, basic: true });

      } else if (ghost.ghostAbility === 'curse') {
        game.ghostCurseActive = true;
        ghost.ghostAbilityUsed = true;
        addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} CURSE: All driver abilities tripled!`, basic: true });

      } else if (ghost.ghostAbility === 'possession' && aliveTargets.length > 0) {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        ghost.possessionTargetId = target.id;
        ghost.possessionRoundsLeft = 3;
        ghost.ghostAbilityUsed = true;
        addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} POSSESSION: latched onto ${target.name}`, basic: true });

      } else if (ghost.ghostAbility === 'vendetta' && aliveTargets.length > 0) {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        const ghostHold = 5 + Math.random() * 20;
        const aliveHold = 5 + Math.random() * 20;
        if (ghostHold > aliveHold) {
          ghost.isGhost = false;
          ghost.remainingTime = 30;
          ghost.ghostRoundsAlive = 0;
          addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} VENDETTA: won! Revived with 30s`, basic: true });
        } else {
          target.remainingTime = Math.max(0, target.remainingTime * 0.75);
          addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} VENDETTA: lost. ${target.name} -25% time`, basic: true });
        }
        ghost.ghostAbilityUsed = true;

      } else if (ghost.ghostAbility === 'bargain' && aliveTargets.length > 0) {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        const offer = Math.min(ghost.tokens, Math.max(1, Math.floor(Math.random() * 3) + 1));
        if (offer > 0 && Math.random() > 0.4) {
          const timeAmt = offer * 40;
          ghost.tokens -= offer;
          target.tokens += offer;
          ghost.remainingTime += timeAmt;
          addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} BARGAIN: traded ${offer} trophies for ${timeAmt}s`, basic: true });
        }
        ghost.ghostAbilityUsed = true;

      } else if (ghost.ghostAbility === 'purgatory') {
        // PURGATORY: init at 2 to account for same-round decrement → 1 full round wait → revive on round 2 (2 rounds including ghost round)
        ghost.possessionRoundsLeft = 2;
        ghost.ghostAbilityUsed = true;
        addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} PURGATORY: counting down 2 rounds...`, basic: true });
      } else {
        // No alive targets for target-based abilities, or unknown ability — mark as used so fallback revive can take over
        ghost.ghostAbilityUsed = true;
      }
    });

    // Check POSSESSION and PURGATORY revive conditions
    const isFinalRound = game.round >= game.totalRounds;
    game.players.forEach(ghost => {
      if (!ghost.isGhost || ghost.possessionRoundsLeft === undefined) return;
      const hasPossessionTarget = !!ghost.possessionTargetId;
      const isPurgatory = ghost.ghostAbility === 'purgatory' && !hasPossessionTarget;

      if (hasPossessionTarget) {
        // POSSESSION
        const target = game.players.find(p => p.id === ghost.possessionTargetId);
        const targetIsGhostNow = target?.isGhost;
        const targetEliminated = target?.isEliminated;
        const roundsExpired = ghost.possessionRoundsLeft <= 1;
        if (targetIsGhostNow || targetEliminated || roundsExpired) {
          if (!isFinalRound) {
            ghost.isGhost = false;
            ghost.remainingTime = 45;
            ghost.ghostImage = undefined;
            addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} POSSESSION: revived with 45s!`, basic: true });
          }
          ghost.possessionTargetId = undefined;
          ghost.possessionRoundsLeft = undefined;
        } else {
          ghost.possessionRoundsLeft = (ghost.possessionRoundsLeft ?? 3) - 1;
        }
      } else if (isPurgatory) {
        const roundsLeft = ghost.possessionRoundsLeft - 1;
        if (roundsLeft <= 0) {
          if (!isFinalRound) {
            let reviveTime: number;
            if (ghost.ghostReason === 'forced' && ghost.ghostTimeAtDeath !== undefined && ghost.ghostTimeAtDeath > 0) {
              reviveTime = ghost.ghostTimeAtDeath;
            } else {
              const alivePlayers = game.players.filter(p => !p.isGhost && !p.isEliminated);
              reviveTime = alivePlayers.length > 0 ? Math.min(...alivePlayers.map(p => p.remainingTime)) : 20;
            }
            ghost.isGhost = false;
            ghost.remainingTime = Math.max(10, reviveTime);
            ghost.ghostImage = undefined;
            addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} PURGATORY: revived with ${ghost.remainingTime.toFixed(1)}s!`, basic: true });
          }
          ghost.possessionRoundsLeft = undefined;
        } else {
          ghost.possessionRoundsLeft = roundsLeft;
        }
      }
    });

    // --- GHOST FALLBACK REVIVE ---
    // All ghosts that haven't been revived by their own ability after 3 rounds
    // automatically return with max(ghostTimeAtDeath ?? 0, 30s).
    // This ensures any ghost whose specific ability never triggered always have a way back.
    if (!isFinalRound) {
      game.players.forEach(ghost => {
        if (!ghost.isGhost) return; // already revived above or was alive
        // Increment rounds spent as ghost
        ghost.ghostRoundsAlive = (ghost.ghostRoundsAlive ?? 0) + 1;
        if (ghost.ghostRoundsAlive >= 3) {
          const reviveTime = Math.max(30, ghost.ghostTimeAtDeath ?? 0);
          ghost.isGhost = false;
          ghost.remainingTime = reviveTime;
          ghost.ghostImage = undefined;
          ghost.ghostRoundsAlive = 0;
          // Clear stale ghost state
          ghost.ghostAbility = null;
          ghost.ghostAbilityUsed = true;
          ghost.possessionTargetId = undefined;
          ghost.possessionRoundsLeft = undefined;
          addGameLogEntry(game, {
            type: 'ability',
            playerId: ghost.id,
            playerName: ghost.name,
            message: `${ghost.name} FALLBACK REVIVE: returned after 3 rounds with ${reviveTime.toFixed(1)}s`,
            basic: true,
          });
          log(`Fallback revive: ${ghost.name} returned after 3 ghost rounds in lobby ${lobbyCode}`, "game");
        }
      });
    }
  }

  // HIDDEN_NAIL_IN_THE_COFFIN: award to player whose DISRUPT ability caused an opponent's elimination
  if (game.settings.abilitiesEnabled && abilityImpacts.length > 0) {
    game.eliminatedThisRound.forEach(eliminatedId => {
      if (eliminatedBeforeAbilities.has(eliminatedId)) return; // was already eliminated before abilities ran
      abilityImpacts.forEach(impact => {
        if (impact.targetId === eliminatedId && impact.effect === 'DISRUPT') {
          const sourcePlayer = game.players.find(p => p.id === impact.playerId && !p.isEliminated);
          if (sourcePlayer) {
            sourcePlayer.momentFlagsEarned.push('HIDDEN_NAIL_IN_THE_COFFIN');
            log(`[NAIL IN THE COFFIN] ${sourcePlayer.name} eliminated ${eliminatedId} via ${impact.ability} in lobby ${lobbyCode}`, "game");
          }
        }
      });
    });
  }
  
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
        molePlayer.tokens -= 2; // Allow tokens to go negative (e.g., -1 trophy on round 1)
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

  // Track protocol wins for the round winner (UNDERDOG_VICTORY goes to underdog separately, not regular winner)
  if (winnerId && game.activeProtocol && game.activeProtocol !== 'UNDERDOG_VICTORY') {
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
      const isCalibration = game.activeProtocol === 'CALIBRATION' && game.calibrationTargetSeconds !== null;
      const sortedByBid = [...participants]
        .filter(p => p.currentBid !== null)
        .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
      const secondBid = sortedByBid.length > 1 ? sortedByBid[1].currentBid || 0 : 0;
      // For CALIBRATION: use absolute bid difference so margin is always non-negative
      const margin = isCalibration ? Math.abs(winnerBid - secondBid) : winnerBid - secondBid;
      
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
      if (winnerBid > 0 && (Math.round(winnerBid * 10) / 10) % 1 === 0) {
        winnerPlayer.momentFlagsEarned.push('PRECISION_STRIKE');
      }
      // Comeback Hope: winner was sole last-place before winning
      const isDoubleRound = game.activeProtocol === 'DOUBLE_STAKES' || game.activeProtocol === 'PANIC_ROOM';
      const tokensAwarded = isDoubleRound ? 2 : 1;
      const winnerTokensBefore = winnerPlayer.tokens - tokensAwarded;
      const allTokensBefore = game.players.filter(p => !p.isEliminated || p.id === winnerId).map(p => p.id === winnerId ? winnerTokensBefore : p.tokens);
      const minTokens = Math.min(...allTokensBefore);
      const playersAtMin = allTokensBefore.filter(t => t === minTokens);
      if (winnerTokensBefore === minTokens && playersAtMin.length === 1 && allTokensBefore.some(t => t > winnerTokensBefore) && winnerTokensBefore >= 0) {
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
      const tiedPlayers = validBidders.filter(p => Math.round((p.currentBid || 0) * 10) / 10 === Math.round(topBid * 10) / 10);
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
      if (winnerId && game.round > 1) {
        const winnerPlayer = game.players.find(p => p.id === winnerId);
        if (winnerPlayer) {
          const enteredThisRound = game.players.filter(p =>
            !p.isEliminated || game.eliminatedThisRound.includes(p.id)
          );

          const startApproximations = enteredThisRound.map(p => ({
            id: p.id,
            startTime: startingTimeBanks.get(p.id) ?? (p.remainingTime + (p.currentBid || 0))
          }));

          const minStartApprox = Math.min(...startApproximations.map(s => s.startTime));
          const playersAtMin = startApproximations.filter(s =>
            Math.abs(s.startTime - minStartApprox) < 0.0001
          );

          const winnerEntry = startApproximations.find(s => s.id === winnerId);
          const winnerIsMin = winnerEntry && winnerEntry.startTime < minStartApprox + 0.0001;
          const winnerIsSoleMin = winnerIsMin && playersAtMin.length === 1;

          if (winnerIsSoleMin) {
            winnerPlayer.momentFlagsEarned.push('LATE_PANIC');
          }
        }
      }
      
      // LAST ONE STANDING: won final round with eliminations
      if (game.round >= game.totalRounds && game.eliminatedThisRound.length > 0) {
        winnerPlayer.momentFlagsEarned.push('LAST_ONE_STANDING');
      }

      // HIDDEN_DEJA_BID: winner bids within ±1.0 of their previous winning bid
      if (winnerId) {
        const winnerForDeja = game.players.find(p => p.id === winnerId);
        if (winnerForDeja) {
          // Find previous WIN BID log entry from a previous round
          const prevWinEntry = [...game.gameLog]
            .reverse()
          .find(l => l.type === 'win' && l.playerId === winnerId && l.round === game.round - 1 && l.value && l.value > 0);
          if (prevWinEntry && prevWinEntry.value) {
            const currentBid = winnerForDeja.currentBid || 0;
            if (Math.abs(currentBid - prevWinEntry.value) <= 1.0 && !winnerForDeja.momentFlagsEarned.includes('HIDDEN_DEJA_BID')) {
              winnerForDeja.momentFlagsEarned.push('HIDDEN_DEJA_BID');
              log(`[DEJA BID] ${winnerForDeja.name} bid ${currentBid.toFixed(1)}s vs prev ${prevWinEntry.value.toFixed(1)}s (diff ${Math.abs(currentBid - prevWinEntry.value).toFixed(2)}s) in lobby ${lobbyCode}`, "game");
            }
          }
        }
      }
    }
  }

  // HIDDEN_67: any player (not just winner) who bids within 67-67.9
  game.players.forEach(p => {
    const bid = p.currentBid || 0;
    if (bid >= 67.0 && bid < 68.0) {
      p.momentFlagsEarned.push('HIDDEN_67');
    }
  });
  
  //MP Server matching client for Redline Reversal:
  if (winnerId && game.round >= game.totalRounds) {
      const winnerPlayer = game.players.find(p => p.id === winnerId);
      if (winnerPlayer) {
          const isDoubleRound = game.activeProtocol === 'DOUBLE_STAKES' || game.activeProtocol === 'PANIC_ROOM';
        let tokensAwarded = isDoubleRound ? 2 : 1;

        // Account for CLICK_CLICK ability bonus (only if abilities are enabled)
        if (winnerPlayer.selectedDriver === 'click_click' && game.settings.abilitiesEnabled) {
          const sortedForAbility = [...game.players]
            .filter(p => p.currentBid !== null && !p.isEliminated)
            .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
          const topBid = sortedForAbility[0]?.currentBid || 0;
          const secondBid = sortedForAbility[1]?.currentBid || 0;
          const margin = topBid - secondBid;
          if (sortedForAbility.length >= 2 && margin <= 1.1 && margin > 0) {
            tokensAwarded += 1;
          }
        }
          const sortedBefore = [...game.players].sort((a, b) => {
              const aTokens = a.id === winnerId ? a.tokens - tokensAwarded : a.tokens;
              const bTokens = b.id === winnerId ? b.tokens - tokensAwarded : b.tokens;
              if (bTokens !== aTokens) return bTokens - aTokens;
              return b.remainingTime - a.remainingTime;
          });
          const rankBefore = sortedBefore.findIndex(p => p.id === winnerId);
        // Read pre-token values consistently by re-applying the adjustment
        const firstPlacePreTokens = sortedBefore[0]?.id === winnerId 
          ? sortedBefore[0].tokens - tokensAwarded 
          : sortedBefore[0]?.tokens;
        const secondPlacePreTokens = sortedBefore[1]?.id === winnerId 
          ? sortedBefore[1].tokens - tokensAwarded 
          : sortedBefore[1]?.tokens;
        const wasInSecond = rankBefore === 1 && firstPlacePreTokens !== secondPlacePreTokens;

          const sortedAfter = [...game.players].sort((a, b) => {
              if (b.tokens !== a.tokens) return b.tokens - a.tokens;
              return b.remainingTime - a.remainingTime;
          });
          const isNowFirst = sortedAfter[0]?.id === winnerId;

          if (wasInSecond && isNowFirst) {
              winnerPlayer.momentFlagsEarned.push('HIDDEN_REDLINE_REVERSAL');
              log(`[REDLINE REVERSAL] ${winnerPlayer.name} came from 2nd to 1st on final round in lobby ${lobbyCode}`, "game");
          }
      }
  }
  
  // Track PATCH_NOTES_PENDING: 3+ moment flags in this round for the winner
  // Count using the flagsBeforeCount snapshot taken before any flags were pushed
  if (winnerId) {
    const winnerPlayer = game.players.find(p => p.id === winnerId);
    if (winnerPlayer) {
      // HIDDEN_REDEMPTION: winner had lostTrophyLastRound set from the previous round
      if (winnerPlayer.lostTrophyLastRound) {
        winnerPlayer.momentFlagsEarned.push('HIDDEN_REDEMPTION');
        log(`[HIDDEN REDEMPTION] ${winnerPlayer.name} won after losing a trophy in lobby ${lobbyCode}`, "game");
      }

      const flagsThisRound = winnerPlayer.momentFlagsEarned.length - (flagsBeforeCount.get(winnerId) || 0);
      if (flagsThisRound >= 3) {
        winnerPlayer.momentFlagsEarned.push('PATCH_NOTES_PENDING');
        log(`[PATCH NOTES PENDING] ${winnerPlayer.name} triggered ${flagsThisRound} moment flags this round in lobby ${lobbyCode}`, "game");
      }
    }
  }

  // MIRROR_MATCH: 2+ non-eliminated players end the round with time banks within 0.1s (stats tracking)
  // Note: transitive matching is handled via a Set - if A≈B and B≈C, all three are flagged.
  {
    const survivors = game.players.filter(p => !p.isEliminated && p.remainingTime > 0);
    const mirrorMatchIds = new Set<string>();
    for (let i = 0; i < survivors.length; i++) {
      for (let j = i + 1; j < survivors.length; j++) {
        if (Math.abs(survivors[i].remainingTime - survivors[j].remainingTime) <= 0.1) {
          mirrorMatchIds.add(survivors[i].id);
          mirrorMatchIds.add(survivors[j].id);
        }
      }
    }
    mirrorMatchIds.forEach(id => {
      const p = game.players.find(pl => pl.id === id);
      if (p) {
        p.momentFlagsEarned.push('MIRROR_MATCH');
      }
    });
    if (mirrorMatchIds.size > 0) {
      log(`[MIRROR MATCH] ${mirrorMatchIds.size} players share time bank in lobby ${lobbyCode}`, "game");
    }
  }

  // Update lostTrophyLastRound for all players based on token changes this round
  game.players.forEach(p => {
    const tokensBefore = tokensSnapshot.get(p.id) ?? p.tokens;
    p.lostTrophyLastRound = p.tokens < tokensBefore;
  });

  // --- HAUNTED: Deferred relic effects ---
  // These relics set flags earlier and now resolve their effects at round end.
  if (game.settings.variant === 'HAUNTED') {
    // Winner time for Blood Pact
    const winnerTimeBid = winnerId ? (game.players.find(p => p.id === winnerId)?.currentBid ?? 0) : 0;

    game.players.forEach(p => {
      // Last Will: if the activator was ghosted THIS round, apply curse to a random alive opponent
      if (p.pendingLastWill) {
        const wasGhostBefore = wasGhostAtRoundStart.get(p.id) ?? false;
        const isGhostNow = !!p.isGhost;
        if (!wasGhostBefore && isGhostNow) {
          const eligible = game.players.filter(tp => tp.id !== p.id && !tp.isGhost && !tp.isEliminated && tp.tokens > 0);
          const willTarget = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : null;
          if (willTarget) {
            willTarget.tokens = willTarget.tokens - 1;
            addGameLogEntry(game, { type: 'impact', playerId: willTarget.id, playerName: willTarget.name, message: `${p.name} LAST WILL: ${willTarget.name} loses 1 trophy`, value: -1, basic: true });
            if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '⚰️ LAST WILL TRIGGERED', message: `${p.name} left a curse — ${willTarget.name} loses 1 trophy!`, victimId: willTarget.id });
          }
        }
        p.pendingLastWill = undefined;
      }

      // Death Wish: win = +1 bonus trophy (total +2); lose = -15s extra
      if (p.deathWishActive) {
        if (p.id === winnerId) {
          p.tokens += 1;
          addGameLogEntry(game, { type: 'ability', playerId: p.id, playerName: p.name, message: `${p.name} DEATH WISH WIN: +1 bonus trophy`, value: 1, basic: true });
          if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '💀 DEATH WISH: WIN!', message: `${p.name} activated Death Wish and WON — +1 bonus trophy (total +2 this round)!` });
        } else if (!p.isGhost && !p.isEliminated) {
          p.remainingTime = Math.max(0, p.remainingTime - 15);
          addGameLogEntry(game, { type: 'impact', playerId: p.id, playerName: p.name, message: `${p.name} DEATH WISH LOSS: -15s extra penalty`, value: -15, basic: true });
          if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '💀 DEATH WISH: CURSED', message: `${p.name} activated Death Wish and LOST — -15s extra penalty this round!` });
        }
        p.deathWishActive = false;
      }

      // Blood Pact: all non-winners also lose the winner's bid amount
      if (p.bloodPactActive) {
        if (winnerId && winnerTimeBid > 0) {
          game.players.forEach(fp => {
            if (fp.id !== winnerId && !fp.isGhost && !fp.isEliminated) {
              fp.remainingTime = Math.max(0, fp.remainingTime - winnerTimeBid);
            }
          });
          addGameLogEntry(game, { type: 'ability', playerId: p.id, playerName: p.name, message: `${p.name} BLOOD PACT: all non-winners lost extra ${winnerTimeBid.toFixed(1)}s`, value: -winnerTimeBid, basic: true });
        }
        p.bloodPactActive = false;
      }

      // Cursed Dice: ±30s random
      if (p.cursedDiceActive) {
        const gain = Math.random() > 0.5;
        if (gain) {
          p.remainingTime += 30;
          addGameLogEntry(game, { type: 'ability', playerId: p.id, playerName: p.name, message: `${p.name} CURSED DICE: +30s`, value: 30, basic: true });
        } else {
          p.remainingTime = Math.max(0, p.remainingTime - 30);
          addGameLogEntry(game, { type: 'ability', playerId: p.id, playerName: p.name, message: `${p.name} CURSED DICE: -30s`, value: -30, basic: true });
        }
        p.cursedDiceActive = false;
      }

      // Marked: if this player just won, ghost them (50% backfire on the marker)
      if (p.markedBy && p.id === winnerId) {
        const markerId = p.markedBy;
        const marker = game.players.find(mp => mp.id === markerId);
        const GMAP: Record<number, 'reaper' | 'curse' | 'vendetta' | 'bargain' | 'possession' | 'purgatory' | null> = {
          1: 'reaper', 2: 'curse', 3: 'vendetta', 4: 'bargain', 5: 'possession', 6: 'purgatory',
        };
        const savedTime = p.remainingTime;
        const idx = Math.floor(Math.random() * 6) + 1;
        p.isGhost = true;
        p.ghostReason = 'forced';
        p.ghostTimeAtDeath = savedTime;
        p.remainingTime = 0;
        p.ghostImage = `hnt_ghost_${idx}`;
        p.ghostAbility = GMAP[idx] ?? null;
        addGameLogEntry(game, { type: 'ability', playerId: p.id, playerName: p.name, message: `${p.name} MARK TRIGGERED: won and was immediately ghosted!`, basic: true });
        // 50% chance the marker is also ghosted
        if (marker && !marker.isGhost && !marker.isEliminated && Math.random() < 0.5) {
          const mIdx = Math.floor(Math.random() * 6) + 1;
          const mSaved = marker.remainingTime;
          marker.isGhost = true;
          marker.ghostReason = 'forced';
          marker.ghostTimeAtDeath = mSaved;
          marker.remainingTime = 0;
          marker.ghostImage = `hnt_ghost_${mIdx}`;
          marker.ghostAbility = GMAP[mIdx] ?? null;
          addGameLogEntry(game, { type: 'ability', playerId: marker.id, playerName: marker.name, message: `${marker.name} MARK BACKLASH: mark claimed the marker too!`, basic: true });
        }
        p.markedBy = undefined;
      }

      // Corrupt: decrement rounds counter; restore normal personality when expired
      if ((p.corruptRoundsLeft ?? 0) > 0) {
        p.corruptRoundsLeft = (p.corruptRoundsLeft ?? 1) - 1;
        if (p.corruptRoundsLeft <= 0) {
          p.corruptRoundsLeft = undefined;
          if (p.isBot) {
            const personalities: GamePlayer['personality'][] = ['balanced', 'aggressive', 'conservative', 'random', 'adaptive', 'psychological'];
            p.personality = personalities[Math.floor(Math.random() * personalities.length)];
            addGameLogEntry(game, { type: 'ability', playerId: p.id, playerName: p.name, message: `${p.name} CORRUPT expired: personality restored`, basic: true });
          }
        }
      }
    });
  }

  // --- HAUNTED: Clear per-round relic flags ---
  if (game.settings.variant === 'HAUNTED') {
    game.players.forEach(p => {
      p.echoForcedBid = undefined;
      p.patternLockMinBid = undefined;
      // Note: tribunalTimePenalty and tribunalForfeit are applied at next round start, cleared there
    });
    // Clear resolved vote state; dequeue next if any
    if (game.pendingVote?.resolved) {
      if (game.voteQueue && game.voteQueue.length > 0) {
        const nextVote = game.voteQueue.shift()!;
        nextVote.deadline = Date.now() + 30000;
        nextVote.resolved = false;
        game.pendingVote = nextVote;
        setTimeout(() => resolveVoteRelic(lobbyCode), 31000);
      } else {
        game.pendingVote = null;
      }
    }
  }
  
  broadcastGameState(lobbyCode);
  
  // Process reality mode abilities (social/bio) at end of round
  processRealityModeAbilities(game, winnerId, 'end');
  
  // Mark all players as not acknowledged for round end
  game.players.forEach(p => {
    if (!p.isBot && !p.isEliminated && !p.isGhost) {
      (p as any).roundEndAcknowledged = false;
    } else {
      // Bots, eliminated players, and ghosts auto-acknowledge
      (p as any).roundEndAcknowledged = true;
    }
  });
  
  // Track first eliminated player(s) for Flash Crash bonus trophy criterion
  if (game.eliminatedThisRound.length > 0 && game.firstEliminatedIds.length === 0) {
    game.firstEliminatedIds = [...game.eliminatedThisRound];
  }

  // Check for game over conditions
  const isHauntedMode = game.settings.variant === 'HAUNTED';
  // In Haunted mode: active = not a ghost. In other modes: active = not eliminated.
  const activePlayers = isHauntedMode
    ? game.players.filter(p => !p.isGhost && !p.isEliminated)
    : game.players.filter(p => !p.isEliminated);
  const activeHumans = activePlayers.filter(p => !p.isBot);
  
  if (!isHauntedMode && activeHumans.length === 0 && game.isMultiplayer && activePlayers.filter(p => p.isBot).length > 0 && game.round < game.totalRounds) {
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
  } else if (game.round >= game.totalRounds) {
    // Round limit reached — game over
    setTimeout(() => endGame(lobbyCode), 3000);
  } else if (!isHauntedMode && (activePlayers.length === 0 || activePlayers.length <= 1)) {
    // Non-Haunted mode: not enough active players → game over
    setTimeout(() => endGame(lobbyCode), 3000);
  } else if (isHauntedMode) {
    // Haunted mode: end only when all players are truly eliminated (no ghosts can revive)
    const anyoneCanPlay = game.players.some(p => !p.isEliminated);
    if (!anyoneCanPlay) {
      setTimeout(() => endGame(lobbyCode), 3000);
    }
    // If all alive players are ghosts but some can revive → let rounds continue
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

function getTwoRandomPlayers(game: GameState, excludeIds: string[] = []): [GamePlayer | null, GamePlayer | null] {
  const pool = game.players.filter(p => !p.isEliminated && !p.isBot && !excludeIds.includes(p.id));
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
            sub: "You are the Mole. Your bid does not impact your time bank. If you win by more than 7.0s, you lose 2 trophies.",
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
      const [a, b] = getTwoRandomPlayers(game, game.players.filter(fireWallExclude).map(p => p.id));
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
      const target = getRandomPlayer(game, game.players.filter(fireWallExclude).map(p => p.id));
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
      const [b1, b2] = getTwoRandomPlayers(game, game.players.filter(fireWallExclude).map(p => p.id));
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
    case 'OVERCLOCK': {
      emitToLobby(game.lobbyCode, 'protocol_detail', {
        protocol: 'OVERCLOCK',
        msg: 'OVERCLOCK',
        sub: 'After prepare to bid: click the button as many times as you can in 15 seconds! Most clicks wins — least clicks loses 10s.',
        targetPlayerId: null,
      });
      break;
    }
    case 'CALIBRATION': {
      const target = game.calibrationTargetSeconds;
      emitToLobby(game.lobbyCode, 'protocol_detail', {
        protocol: 'CALIBRATION',
        msg: 'CALIBRATION',
        sub: `Hold as close to ${target}s as possible! Closest bid wins. Farthest loses nothing extra — but elimination still applies.`,
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
  
  if (game.activeProtocol === 'THE_MOLE' && game.molePlayerId) {
    const molePlayer = game.players.find(p => p.id === game.molePlayerId);
    if (molePlayer) {
      if (game.eliminatedThisRound.includes(game.molePlayerId)) {
        emitToLobby(game.lobbyCode, 'protocol_reveal', {
          protocol: 'THE_MOLE',
          msg: 'MOLE REVEALED',
          sub: `${molePlayer.name} was the Mole and got eliminated! -1 trophy.`,
        });
      } else if (game.roundWinner && game.roundWinner.id === game.molePlayerId) {
        const participants = game.players.filter(p => !p.isEliminated && p.currentBid !== null && p.currentBid > 0 && !game.eliminatedThisRound.includes(p.id));
        const sortedBids = participants
          .filter(p => p.id !== game.molePlayerId)
          .map(p => p.currentBid || 0)
          .sort((a, b) => b - a);
        const secondPlaceBid = sortedBids[0] || 0;
        const margin = (molePlayer.currentBid || 0) - secondPlaceBid;
        
        if (margin > 7) {
          emitToLobby(game.lobbyCode, 'protocol_reveal', {
            protocol: 'THE_MOLE',
            msg: 'MOLE REVEALED',
            sub: `${molePlayer.name} won by ${margin.toFixed(1)}s and LOST 2 trophies!`,
          });
        } else {
          emitToLobby(game.lobbyCode, 'protocol_reveal', {
            protocol: 'THE_MOLE',
            msg: 'MOLE REVEALED',
            sub: `${molePlayer.name} was the Mole and won safely (${margin.toFixed(1)}s margin).`,
          });
        }
      }
    }
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

  // TRUTH_DARE: remind all players who won and must ask a truth or dare at round end
  if (game.activeProtocol === 'TRUTH_DARE') {
    const winner = game.roundWinner;
    emitToLobby(game.lobbyCode, 'protocol_reveal', {
      protocol: 'TRUTH_DARE',
      msg: 'TRUTH OR DARE',
      sub: winner
        ? `${winner.name} may ask or dare!`
        : 'No winner this round!',
    });
  }
}

// Select a random protocol for the round based on variant and settings
function selectProtocolForRound(game: GameState): ProtocolType {
  if (!game.settings.protocolsEnabled && !game.protocolsAlwaysOn) return null;

  // Protocol Forcer relic: use the forced protocol for this round
  if (game.forcedProtocolNextRound) {
    const forced = game.forcedProtocolNextRound;
    game.forcedProtocolNextRound = null;
    return forced;
  }
  
  // Conclave C: protocols always trigger (100% chance)
  if (!game.protocolsAlwaysOn) {
    // Trigger chance based on game pace (matches SP):
    // SPEED (short): 50% | STANDARD (medium): 40% | MARATHON (long): 30%
    const triggerChance = game.settings.gameDuration === 'short' ? 0.5 
      : game.settings.gameDuration === 'long' ? 0.3 
      : 0.4;
    if (Math.random() >= triggerChance) return null;
  }
  
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
  
  // Filter by allowedProtocols if configured (per-protocol toggle buttons)
  if (game.settings.allowedProtocols && game.settings.allowedProtocols.length > 0) {
    protocolPool = protocolPool.filter(p => game.settings.allowedProtocols!.includes(p));
    if (protocolPool.length === 0) return null;
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

  // --- FINAL WRIT CHECK ---
  // If any player activated Final Writ and this is the final round, skip bidding entirely
  if (game.settings.variant === 'HAUNTED' && game.round >= game.totalRounds) {
    const finalWritPlayer = game.players.find(p => p.finalWritActive && !p.isEliminated && !p.isGhost);
    if (finalWritPlayer) {
      finalWritPlayer.tokens += 1;
      finalWritPlayer.finalWritActive = false;
      addGameLogEntry(game, {
        type: 'win',
        playerId: finalWritPlayer.id,
        playerName: finalWritPlayer.name,
        message: `${finalWritPlayer.name} FINAL WRIT: Final round skipped — trophy claimed automatically!`,
        value: 1,
        basic: true,
      });
      log(`FINAL WRIT: ${finalWritPlayer.name} skips final round and wins trophy in lobby ${lobbyCode}`, "game");
      game.roundWinner = { id: finalWritPlayer.id, name: finalWritPlayer.name, bid: 0 };
      game.phase = 'round_end';
      broadcastGameState(lobbyCode);
      setTimeout(() => endGame(lobbyCode), 3000);
      return;
    }
  }

  game.phase = 'waiting_for_ready';
  game.roundWinner = null;
  game.eliminatedThisRound = [];
  game.isDoubleTokensRound = false;

  // --- TRIBUNAL DEFERRED EFFECTS: apply time penalty at start of round ---
  if (game.settings.variant === 'HAUNTED') {
    game.players.forEach(p => {
      if (p.tribunalTimePenalty && p.tribunalTimePenalty > 0 && !p.isEliminated && !p.isGhost) {
        const penalty = p.tribunalTimePenalty;
        p.remainingTime = Math.max(0, p.remainingTime - penalty);
        p.tribunalTimePenalty = undefined;
        addGameLogEntry(game, {
          type: 'impact',
          playerId: p.id,
          playerName: p.name,
          message: `${p.name} TRIBUNAL A: -${penalty}s time penalty from last round's vote`,
          value: -penalty,
          basic: true,
        });
      }
      // Tribunal B: forced forfeit — auto-submit zero bid this round
      if (p.tribunalForfeit && !p.isEliminated && !p.isGhost) {
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '⚖️ TRIBUNAL: FORFEIT', message: `${p.name} is forced to forfeit bidding this round!`, victimId: p.id });
        addGameLogEntry(game, { type: 'impact', playerId: p.id, playerName: p.name, message: `${p.name} TRIBUNAL B: forced forfeit this round`, basic: true });
        p.tribunalForfeit = false;
      }
    });
  }
  
  game.overclockClickCounts = {};
  
  // --- MP: BOT RELIC ACTIVATION ---
  // Bots with unconsumed relics activate them at the start of each round (before players go ready).
  // Activation chance increases toward the end of the game.
  if (game.settings.variant === 'HAUNTED') {
    const isLateGame = game.round >= Math.ceil(game.totalRounds * 0.6);
    const isFinalRounds = game.round >= game.totalRounds - 1;
    const botActivationChance = isFinalRounds ? 0.9 : isLateGame ? 0.6 : 0.3;

    const GMAP_BOT: Record<number, 'reaper' | 'curse' | 'vendetta' | 'bargain' | 'possession' | 'purgatory' | null> = {
      1: 'reaper', 2: 'curse', 3: 'vendetta', 4: 'bargain', 5: 'possession', 6: 'purgatory',
    };
    const DARK_POOL_BOT: ProtocolType[] = ['PANIC_ROOM', 'TIME_TAX', 'THE_MOLE', 'UNDERDOG_VICTORY'];

    game.players.forEach(bot => {
      if (!bot.isBot || bot.isGhost || bot.isEliminated) return;
      if (!bot.selectedItem || bot.relicConsumed) return;
      if (Math.random() > botActivationChance) return;

      const relic = bot.selectedItem;
      const alive = game.players.filter(p => !p.isGhost && !p.isEliminated);
      const opponents = alive.filter(p => p.id !== bot.id);
      const botOpps = opponents.filter(p => p.isBot);
      const pickRandom = <T,>(arr: T[]): T | undefined => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

      bot.relicConsumed = true;

      switch (relic) {
        case 'jackpot': {
          const roll = Math.random();
          if (roll < 0.25) {
            bot.remainingTime = Math.min(bot.remainingTime + 40, 9999);
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} JACKPOT (bot): +40s`, value: 40, basic: true });
          } else if (roll < 0.5) {
            bot.tokens += 2;
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} JACKPOT (bot): +2 trophies`, value: 2, basic: true });
          } else if (roll < 0.75) {
            bot.remainingTime = Math.max(0, bot.remainingTime - 30);
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} JACKPOT (bot): -30s`, value: -30, basic: true });
          } else {
            const idx = Math.floor(Math.random() * 6) + 1;
            const saved = bot.remainingTime;
            bot.isGhost = true;
            bot.ghostReason = 'forced';
            bot.ghostTimeAtDeath = saved;
            bot.remainingTime = 0;
            bot.ghostImage = `hnt_ghost_${idx}`;
            bot.ghostAbility = GMAP_BOT[idx] ?? null;
            bot.ghostAbilityUsed = false;
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} JACKPOT (bot): ghosted`, basic: true });
          }
          break;
        }
        case 'ghost_touch': {
          const target = pickRandom(opponents);
          if (target) {
            if (Math.random() < 0.20) {
              const idx = Math.floor(Math.random() * 6) + 1;
              const saved = target.remainingTime;
              target.isGhost = true;
              target.ghostReason = 'forced';
              target.ghostTimeAtDeath = saved;
              target.remainingTime = 0;
              target.ghostImage = `hnt_ghost_${idx}`;
              target.ghostAbility = GMAP_BOT[idx] ?? null;
              addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} GHOST TOUCH (bot): ${target.name} ghosted!`, basic: true });
            } else {
              addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} GHOST TOUCH (bot): missed`, basic: true });
            }
          }
          break;
        }
        case 'sacrificial_lamb': {
          // Only available in second half of game
          if (game.round <= Math.floor(game.totalRounds / 2)) {
            bot.relicConsumed = false;
            break;
          }
          const victims = alive.filter(p => p.tokens > 0);
          const victim = pickRandom(victims);
          if (victim) {
            victim.tokens = Math.max(0, victim.tokens - 1);
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} SACRIFICIAL LAMB (bot): ${victim.name} -1 trophy`, value: -1, basic: true });
          }
          break;
        }
        case 'wild_card': {
          if (alive.length > 1) {
            const times = alive.map(p => p.remainingTime);
            let shuffled = [...times];
            let attempts = 0;
            do {
              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
              }
              attempts++;
            } while (shuffled.some((t, i) => t === times[i]) && attempts < 20);
            alive.forEach((p, i) => { p.remainingTime = shuffled[i]; });
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} WILD CARD (bot): time banks redistributed`, basic: true });
          }
          break;
        }
        case 'death_wish': {
          bot.deathWishActive = true;
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} DEATH WISH (bot): win=+2, lose=-15s`, basic: true });
          break;
        }
        case 'blood_pact': {
          bot.bloodPactActive = true;
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} BLOOD PACT (bot): all losers share winner's bid cost`, basic: true });
          break;
        }
        case 'cursed_dice': {
          bot.cursedDiceActive = true;
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} CURSED DICE (bot): ±30s after round end`, basic: true });
          break;
        }
        case 'seance': {
          const ghosts = game.players.filter(p => p.isGhost && !p.isEliminated);
          if (ghosts.length >= 2) {
            ghosts.forEach(ghost => {
              const reviveTime = Math.max(45, ghost.ghostTimeAtDeath ?? 0);
              ghost.isGhost = false;
              ghost.remainingTime = reviveTime;
              ghost.ghostImage = undefined;
              ghost.ghostAbility = null;
              ghost.ghostAbilityUsed = false;
              ghost.possessionTargetId = undefined;
              ghost.possessionRoundsLeft = undefined;
              addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} revived by bot Séance with ${reviveTime.toFixed(1)}s!`, basic: true });
            });
            bot.tokens += 1;
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} SÉANCE (bot): ${ghosts.length} ghost(s) revived, +1 trophy`, value: 1, basic: true });
          } else {
            bot.relicConsumed = false; // not enough ghosts, don't waste it
          }
          break;
        }
        case 'protocol_forcer': {
          const picked = DARK_POOL_BOT[Math.floor(Math.random() * DARK_POOL_BOT.length)];
          game.forcedProtocolNextRound = picked;
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} PROTOCOL FORCER (bot): next round will be ${picked}`, basic: true });
          break;
        }
        case 'last_will': {
          // Not available on final round; trophy-only, random opponent
          if (game.round >= game.totalRounds) {
            bot.relicConsumed = false;
            break;
          }
          bot.pendingLastWill = { targetId: '', curseType: 'trophy' };
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} LAST WILL (bot): if ghosted, a random opponent loses 1 trophy`, basic: true });
          break;
        }
        case 'echo': {
          const echoTarget = pickRandom(opponents.filter(p => (p.bidHistory?.length ?? 0) > 0));
          if (echoTarget && echoTarget.bidHistory && echoTarget.bidHistory.length > 0) {
            const lastBid = echoTarget.bidHistory[echoTarget.bidHistory.length - 1];
            echoTarget.echoForcedBid = lastBid;
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} ECHO (bot): ${echoTarget.name} forced to replay ${lastBid.toFixed(1)}s`, basic: true });
          } else {
            bot.relicConsumed = false; // no valid history target
          }
          break;
        }
        case 'marked': {
          // Only available in second half of game
          if (game.round <= Math.floor(game.totalRounds / 2)) {
            bot.relicConsumed = false;
            break;
          }
          const target = pickRandom(opponents);
          if (target) {
            target.markedBy = bot.id;
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} MARKED (bot): ${target.name} is marked — ghosted on next win`, basic: true });
          }
          break;
        }
        case 'corrupt': {
          const botTarget = pickRandom(botOpps);
          if (botTarget) {
            botTarget.corruptRoundsLeft = 3;
            botTarget.personality = 'aggressive';
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} CORRUPT (bot): ${botTarget.name} is now AGGRESSIVE for 3 rounds`, basic: true });
          } else {
            bot.relicConsumed = false;
          }
          break;
        }
        case 'pattern_lock':
          // Removed relic — refund if still encountered
          bot.relicConsumed = false;
          break;
        case 'final_writ': {
          bot.finalWritActive = true;
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} FINAL WRIT (bot): will auto-win the final round`, basic: true });
          break;
        }
        case 'tribunal': {
          // Bot triggers a proper vote so human players can participate
          const target = pickRandom(opponents);
          if (target) {
            const botVotes: Record<string, string> = {};
            game.players.filter(p => p.isBot && !p.isEliminated && p.id !== bot.id).forEach(b => {
              botVotes[b.id] = Math.random() < 0.5 ? 'A' : 'B';
            });
            // Also have the activating bot vote
            botVotes[bot.id] = Math.random() < 0.5 ? 'A' : 'B';
            const newVote: PendingRelicVote = {
              relicId: 'tribunal',
              activatorId: bot.id,
              targetId: target.id,
              options: [
                { id: 'A', label: `${target.name} loses 30s next round` },
                { id: 'B', label: `${target.name} is forced to forfeit bidding next round` },
              ],
              votes: botVotes,
              deadline: Date.now() + 30000,
            };
            addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} TRIBUNAL (bot): vote started targeting ${target.name}`, basic: true });
            if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '⚖️ TRIBUNAL VOTE STARTED', message: `${bot.name} called a Tribunal against ${target.name}! Vote now.`, victimId: target.id });
            if (game.pendingVote && !game.pendingVote.resolved) {
              if (!game.voteQueue) game.voteQueue = [];
              game.voteQueue.push(newVote);
            } else {
              game.pendingVote = newVote;
              setTimeout(() => resolveVoteRelic(lobbyCode), 31000);
            }
          } else {
            bot.relicConsumed = false;
          }
          break;
        }
        case 'conclave': {
          // Bot triggers a proper vote so human players can participate
          const botVotes: Record<string, string> = {};
          const voteOptions = ['A', 'B', 'C', 'D'];
          game.players.filter(p => p.isBot && !p.isEliminated).forEach(b => {
            botVotes[b.id] = voteOptions[Math.floor(Math.random() * voteOptions.length)];
          });
          const newVote: PendingRelicVote = {
            relicId: 'conclave',
            activatorId: bot.id,
            options: [
              { id: 'A', label: "Cut everyone's time bank in half" },
              { id: 'B', label: 'Skip next round as a tie (no bids)' },
              { id: 'C', label: '100% protocols for the rest of the game' },
              { id: 'D', label: 'Overclock — bottom 2 players lose a trophy' },
            ],
            votes: botVotes,
            deadline: Date.now() + 30000,
          };
          addGameLogEntry(game, { type: 'ability', playerId: bot.id, playerName: bot.name, message: `${bot.name} CONCLAVE (bot): vote started!`, basic: true });
          if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🗳️ CONCLAVE VOTE STARTED', message: `${bot.name} called a Conclave! Vote now.` });
          if (game.pendingVote && !game.pendingVote.resolved) {
            if (!game.voteQueue) game.voteQueue = [];
            game.voteQueue.push(newVote);
          } else {
            game.pendingVote = newVote;
            setTimeout(() => resolveVoteRelic(lobbyCode), 31000);
          }
          break;
        }
        default:
          break;
      }
    });
  }

  // Select protocol for this round
  const protocol = selectProtocolForRound(game);
  game.activeProtocol = protocol;
  if (!protocol) {
    game.calibrationTargetSeconds = null;
  }
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
    if (protocol === 'CALIBRATION') {
      // Generate random target time between 11 and 40 seconds
      game.calibrationTargetSeconds = Math.floor(Math.random() * 30) + 11;
    } else {
      game.calibrationTargetSeconds = null;
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
      const fireWallIds = game.players.filter(p => p.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled).map(p => p.id);
      const [pcA, pcB] = getTwoRandomPlayers(game, fireWallIds);
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
    
    // Check if all non-eliminated, non-ghost human players are holding
    const humanPlayers = g.players.filter(p => !p.isBot && !p.isEliminated && !p.isGhost);
    const allHumansHolding = humanPlayers.every(p => p.isHolding);
    
    // In Haunted mode: if all humans are ghosts, auto-advance after a short delay
    if (g.settings.variant === 'HAUNTED' && humanPlayers.length === 0) {
      if (g.allHumansHoldingStartTime === null) {
        g.allHumansHoldingStartTime = Date.now();
        broadcastGameState(lobbyCode);
      }
      const holdDuration = (Date.now() - g.allHumansHoldingStartTime) / 1000;
      if (holdDuration >= 1) {
        clearInterval(readyCheckInterval);
        g.allHumansHoldingStartTime = null;
        log(`All human players are ghosts, auto-advancing round ${g.round} in lobby ${lobbyCode}`, "game");
        startCountdown(lobbyCode);
      }
      return;
    }

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

// Bonus trophy criteria result
interface BonusTrophyResult {
  criterion: string;
  criterionName: string;
  criterionDesc: string;
  winners: { id: string; name: string }[];
  trophiesPerWinner: number;
}

function calculateBonusTrophies(game: GameState): BonusTrophyResult[] {
  const allPlayers = game.players;

  interface CriterionDef {
    id: string;
    name: string;
    desc: string;
    getCandidates: () => { id: string; name: string }[];
  }

  const criteria: CriterionDef[] = [
    {
      id: 'MOMENT_MAGNET',
      name: 'Moment Magnet',
      desc: 'Most moment flags earned',
      getCandidates: () => {
        const max = Math.max(...allPlayers.map(p => p.momentFlagsEarned.length));
        if (max === 0) return [];
        return allPlayers.filter(p => p.momentFlagsEarned.length === max).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'PROTOCOL_KINGPIN',
      name: 'Protocol Kingpin',
      desc: 'Most protocol round wins',
      getCandidates: () => {
        const max = Math.max(...allPlayers.map(p => p.protocolWinsEarned.length));
        if (max === 0) return [];
        return allPlayers.filter(p => p.protocolWinsEarned.length === max).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'CLOCK_HOARDER',
      name: 'Clock Hoarder',
      desc: 'Most remaining time',
      getCandidates: () => {
        const max = Math.max(...allPlayers.map(p => p.remainingTime));
        if (max <= 0) return [];
        return allPlayers.filter(p => p.remainingTime === max).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'FLASH_CRASH',
      name: 'Flash Crash',
      desc: 'First player eliminated',
      getCandidates: () => {
        if (game.firstEliminatedIds.length === 0) return [];
        return game.firstEliminatedIds
          .map(id => allPlayers.find(p => p.id === id))
          .filter((p): p is GamePlayer => p !== undefined)
          .map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'MARKET_SNIPER',
      name: 'Market Sniper',
      desc: 'Shortest winning bid time',
      getCandidates: () => {
        const withWins = allPlayers.filter(p => p.shortestWinBidTime !== undefined && p.shortestWinBidTime > 0);
        if (withWins.length === 0) return [];
        const min = Math.min(...withWins.map(p => p.shortestWinBidTime!));
        return withWins.filter(p => p.shortestWinBidTime === min).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'BOT_BID',
      name: 'Bot Bid',
      desc: 'Random CPU (bot) award',
      getCandidates: () => {
        // Award to one random non-eliminated bot, or one random panic_bot driver player if no bots present
        const activeBots = allPlayers.filter(p => p.isBot && !p.isEliminated);
        if (activeBots.length > 0) {
          const chosen = activeBots[Math.floor(Math.random() * activeBots.length)];
          return [{ id: chosen.id, name: chosen.name }];
        }
        // Fall back to panic_bot driver players if no bots available
        const panicBotPlayers = allPlayers.filter(p => !p.isBot && !p.isEliminated && p.selectedDriver === 'panic_bot');
        if (panicBotPlayers.length > 0) {
          const chosen = panicBotPlayers[Math.floor(Math.random() * panicBotPlayers.length)];
          return [{ id: chosen.id, name: chosen.name }];
        }
        return [];
      },
    },
  ];

  // Pick 2 unique criteria at random from valid ones (Fisher-Yates shuffle)
  const validCriteria = criteria.filter(c => c.getCandidates().length > 0);
  if (validCriteria.length === 0) return [];

  const shuffled = [...validCriteria];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const chosen = shuffled.slice(0, 2);

  return chosen.map(c => ({
    criterion: c.id,
    criterionName: c.name,
    criterionDesc: c.desc,
    winners: c.getCandidates(),
    trophiesPerWinner: 1,
  }));
}

function endGame(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game) return;

  // Guard against running endGame twice (e.g. triggered by a player leaving during the 3-second
  // post-round delay, while a setTimeout for endGame is also pending from endRound, or when
  // playerAcknowledgeRoundEnd fires before the scheduled setTimeout).
  if (game.phase === 'game_over') return;

  // Award Bonus Trophies if protocols are enabled and bonus trophies are enabled (before final placement sort)
  // Pick 2 criteria, award 1 trophy per winner per criterion
  let bonusResults: BonusTrophyResult[] = [];
  if (game.settings.protocolsEnabled && game.settings.bonusTrophiesEnabled) {
    bonusResults = calculateBonusTrophies(game);
    if (bonusResults.length > 0) {
      // Apply 1 trophy per winner for each criterion
      bonusResults.forEach(bonusResult => {
        bonusResult.winners.forEach(w => {
          const player = game.players.find(p => p.id === w.id);
          if (player) player.tokens += bonusResult.trophiesPerWinner;
        });
        log(`Bonus Trophy (${bonusResult.criterionName}): ${bonusResult.winners.map(w => w.name).join(', ')} each +${bonusResult.trophiesPerWinner} trophy`, "game");
      });

      // Emit all bonus trophy results to all players before game_over phase transition
      if (emitToLobby) {
        emitToLobby(lobbyCode, 'bonus_trophy_award', { results: bonusResults });
      }
    }
  }

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
    bonusTrophyResults: bonusResults.map(r => ({
      criterion: r.criterion,
      criterionName: r.criterionName,
      winnerIds: r.winners.map(w => w.id),
      winnerNames: r.winners.map(w => w.name),
      trophiesAwarded: r.trophiesPerWinner,
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

    // JAWLINE (AlphaPrime): No penalty during countdown
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
    player.penaltyAppliedThisRound = true;

    // Store penalty in temporary field (will be moved to roundImpacts at round end)
    if (!player.pendingRoundImpacts) {
      player.pendingRoundImpacts = [];
    }
    player.pendingRoundImpacts.push({ 
      type: 'PENALTY', 
      value: -penalty, 
      source: 'Early Release' 
    });

    // DON'T deduct time yet - that happens at round end

    addGameLogEntry(game, {
      type: 'impact',
      playerId: player.id,
      playerName: player.name,
      message: `${player.name} will receive -${penalty.toFixed(1)}s penalty at round end`,
      value: -penalty,
    });

    log(`${player.name} released during countdown in lobby ${lobbyCode}, penalty queued: -${penalty}s`, "game");

    broadcastGameState(lobbyCode);
    return;
  }
  
  // During bidding: lock in the bid
  if (game.phase === 'bidding' && player.isHolding) {
    // PATTERN LOCK: block release if player hasn't reached their forced minimum bid yet
    // Also accounts for echoForcedBid — effective minimum is max(patternLockMinBid, echoForcedBid)
    if (game.settings.variant === 'HAUNTED' && player.patternLockMinBid !== undefined) {
      const effectiveMinBid = Math.max(player.patternLockMinBid, player.echoForcedBid ?? 0);
      const currentBidValue = player.currentBid ?? 0;
      if (currentBidValue < effectiveMinBid) {
        // Reject the release — player must keep holding
        log(`${player.name} release blocked by Pattern Lock (need ${effectiveMinBid.toFixed(1)}s, at ${currentBidValue.toFixed(1)}s) in lobby ${lobbyCode}`, "game");
        broadcastGameState(lobbyCode);
        return;
      }
    }

    const rawElapsed = (Date.now() - (game.roundStartTime || Date.now())) / 1000;
    const panicMultiplier = game.activeProtocol === 'PANIC_ROOM' ? 2 : 1;
    const playerHasFireWall = player.selectedDriver === 'low_flame' && game.settings.abilitiesEnabled;
    const playerElapsed = (playerHasFireWall && game.activeProtocol === 'PANIC_ROOM') ? rawElapsed : rawElapsed * panicMultiplier;
    const minBid = getMinBidPenalty(game.gameDuration);
    player.isHolding = false;
    // Lock in the bid using the value already tracked by the 100ms tick, which is exactly
    // what was broadcast and displayed to the player. Re-computing from Date.now() here can
    // be up to 100ms later than the last tick, enough to push the bid across a 0.1s rounding
    // boundary and give a different value than what the player saw — breaking deadlock
    // detection when two players both release on the same displayed second.
    // Fall back to the fresh computation only if the tick hasn't updated the bid yet
    // (player released within the very first 100ms of the bidding phase).
    player.currentBid = (player.currentBid ?? 0) > 0
      ? Math.round((player.currentBid ?? 0) * 10) / 10
      : Math.round((playerElapsed + minBid) * 10) / 10;
    
    log(`${player.name} released at ${(player.currentBid as number).toFixed(1)}s (${playerElapsed.toFixed(1)}s hold + ${minBid}s minBid) in lobby ${lobbyCode}`, "game");
    
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

export function broadcastGameState(lobbyCode: string) {
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
      isGhost: p.isGhost || false,
      ghostImage: p.ghostImage || null,
      ghostAbility: p.ghostAbility || null,
      ghostAbilityUsed: p.ghostAbilityUsed || false,
      possessionTargetId: p.possessionTargetId || null,
      possessionRoundsLeft: p.possessionRoundsLeft ?? null,
      selectedItem: p.selectedItem || null,
      relicConsumed: p.relicConsumed || false,
      ghostReason: p.ghostReason || null,
      ghostTimeAtDeath: p.ghostTimeAtDeath ?? null,
      currentBid: p.currentBid,
      isHolding: p.isHolding,
      roundEndAcknowledged: (p as any).roundEndAcknowledged || false,
      roundImpacts: p.roundImpacts,
      netImpact: p.netImpact,
      abilityUsed: p.abilityUsed,
      momentFlagsEarned: p.momentFlagsEarned,
      protocolWinsEarned: p.protocolWinsEarned,
      // Relic state fields
      markedBy: p.markedBy || null,
      echoForcedBid: p.echoForcedBid ?? null,
      patternLockMinBid: p.patternLockMinBid ?? null,
      deathWishActive: p.deathWishActive || false,
      bloodPactActive: p.bloodPactActive || false,
      cursedDiceActive: p.cursedDiceActive || false,
      corruptRoundsLeft: p.corruptRoundsLeft ?? null,
      pendingLastWill: p.pendingLastWill || null,
      finalWritActive: p.finalWritActive || false,
      tribunalTimePenalty: p.tribunalTimePenalty ?? null,
      tribunalForfeit: p.tribunalForfeit ?? false,
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
    ghostCurseActive: game.ghostCurseActive,
    // Relic game-state fields
    pendingVote: game.pendingVote || null,
    protocolsAlwaysOn: game.protocolsAlwaysOn || false,
    
    overclockClickCounts: game.overclockClickCounts,
    calibrationTargetSeconds: game.calibrationTargetSeconds,
  };
  
  emitToLobby(lobbyCode, 'game_state', stateForClients);
}

// Dark protocol subset for Protocol Forcer relic
const DARK_PROTOCOLS: ProtocolType[] = [
  'DATA_BLACKOUT', 'SYSTEM_FAILURE', 'PANIC_ROOM', 'TIME_TAX', 'THE_MOLE', 'UNDERDOG_VICTORY'
];

// ─── MP Relic Activation ──────────────────────────────────────────────────────

export function activateRelicMP(
  lobbyCode: string,
  socketId: string,
  relicId: string,
  targetId?: string,
  curseType?: 'time' | 'trophy',
): { success: boolean; error?: string } {
  const game = activeGames.get(lobbyCode);
  if (!game) return { success: false, error: 'No game' };
  const activator = game.players.find(p => p.socketId === socketId);
  if (!activator) return { success: false, error: 'Player not found' };
  if (activator.relicConsumed) return { success: false, error: 'Relic already consumed' };
  if (game.settings.variant !== 'HAUNTED') return { success: false, error: 'Not haunted mode' };

  activator.relicConsumed = true;

  const GHOST_ABILITY_SERVER_MAP: Record<number, 'reaper' | 'curse' | 'vendetta' | 'bargain' | 'possession' | 'purgatory' | null> = {
    1: 'reaper', 2: 'curse', 3: 'vendetta', 4: 'bargain', 5: 'possession', 6: 'purgatory',
  };

  switch (relicId) {
    case 'jackpot': {
      const roll = Math.random();
      if (roll < 0.25) {
        activator.remainingTime = Math.min(activator.remainingTime + 40, 9999);
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} JACKPOT: +40s`, value: 40, basic: true });
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🎰 JACKPOT: 🎯 LUCKY!', message: `${activator.name} hit Jackpot — +40s added!` });
      } else if (roll < 0.5) {
        activator.tokens += 2;
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} JACKPOT: +2 trophies`, value: 2, basic: true });
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🎰 JACKPOT: 🏆 JACKPOT!', message: `${activator.name} hit Jackpot — +2 trophies awarded!` });
      } else if (roll < 0.75) {
        activator.remainingTime = Math.max(0, activator.remainingTime - 30);
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} JACKPOT: -30s`, value: -30, basic: true });
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🎰 JACKPOT: 💀 CURSED!', message: `${activator.name} hit Jackpot — −30s removed!` });
      } else {
        const idx = Math.floor(Math.random() * 6) + 1;
        const savedTime = activator.remainingTime;
        activator.isGhost = true;
        activator.ghostReason = 'forced';
        activator.ghostTimeAtDeath = savedTime;
        activator.remainingTime = 0;
        activator.ghostImage = `hnt_ghost_${idx}`;
        activator.ghostAbility = GHOST_ABILITY_SERVER_MAP[idx] ?? null;
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} JACKPOT: GHOSTED`, basic: true });
        if (emitToLobby) {
          emitToLobby(lobbyCode, 'relic_broadcast', { title: '🎰 JACKPOT: 👻 GHOSTED!', message: `${activator.name} hit Jackpot — they've been ghosted!` });
          // Private notification to the activator with their ghost ability
          const abilityName = activator.ghostAbility ? activator.ghostAbility.toUpperCase() : 'UNKNOWN';
          emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '🎰 JACKPOT: YOU ARE A GHOST', message: `The wheel turned against you. You've been ghosted! Your ghost ability: ${abilityName}` });
        }
      }
      break;
    }
    case 'ghost_touch': {
      const target = game.players.find(p => p.id === targetId);
      if (target && !target.isGhost && !target.isEliminated) {
        if (Math.random() < 0.20) {
          const idx = Math.floor(Math.random() * 6) + 1;
          const savedTime = target.remainingTime;
          target.isGhost = true;
          target.ghostReason = 'forced';
          target.ghostTimeAtDeath = savedTime;
          target.remainingTime = 0;
          target.ghostImage = `hnt_ghost_${idx}`;
          target.ghostAbility = GHOST_ABILITY_SERVER_MAP[idx] ?? null;
          addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} GHOST TOUCH: ${target.name} ghosted!`, basic: true });
          if (emitToLobby) {
            emitToLobby(lobbyCode, 'relic_broadcast', { title: '👻 GHOST TOUCH', message: `${activator.name} used Ghost Touch — ${target.name} has been ghosted!`, victimId: target.id });
            // Private notification to the activator about the hit
            emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '👻 GHOST TOUCH FIRED', message: `${target.name} was consumed by the curse!` });
          }
        } else {
          addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} GHOST TOUCH: missed (20% chance failed)`, basic: true });
          // Only the activator sees the miss
          if (emitToLobby) emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '👻 GHOST TOUCH: MISSED', message: `The curse didn't take. ${target.name} survives — this time.` });
        }
      }
      break;
    }
    case 'sacrificial_lamb': {
      // Only available in second half of game
      if (game.round <= Math.floor(game.totalRounds / 2)) {
        activator.relicConsumed = false;
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '❌ RELIC BLOCKED', message: 'Sacrificial Lamb can only be used in the second half of the game.' });
        return { success: false, error: 'Only available in second half' };
      }
      const alive = game.players.filter(p => !p.isGhost && !p.isEliminated && p.tokens > 0);
      if (alive.length > 0) {
        const victim = alive[Math.floor(Math.random() * alive.length)];
        victim.tokens = Math.max(0, victim.tokens - 1);
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} SACRIFICIAL LAMB: ${victim.name} loses 1 trophy`, value: -1, basic: true });
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🐑 SACRIFICIAL LAMB', message: `${activator.name} used Sacrificial Lamb — ${victim.name} loses 1 trophy!`, victimId: victim.id });
      }
      break;
    }
    case 'wild_card': {
      const alive = game.players.filter(p => !p.isGhost && !p.isEliminated);
      if (alive.length > 1) {
        const times = alive.map(p => p.remainingTime);
        let shuffled = [...times];
        let attempts = 0;
        do {
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          attempts++;
        } while (shuffled.some((t, i) => t === times[i]) && attempts < 20);
        alive.forEach((p, i) => { p.remainingTime = shuffled[i]; });
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} WILD CARD: all time banks redistributed!`, basic: true });
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🌀 WILD CARD', message: `${activator.name} used Wild Card — all time banks redistributed!` });
      }
      break;
    }
    case 'echo': {
      const target = game.players.find(p => p.id === targetId);
      if (target) {
        const lastBid = target.bidHistory?.length ? target.bidHistory[target.bidHistory.length - 1] : null;
        if (lastBid != null) {
          target.echoForcedBid = lastBid;
          addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} ECHO: ${target.name} forced to replay ${lastBid.toFixed(1)}s next round`, basic: true });
          if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🔁 ECHO', message: `${activator.name} used Echo — ${target.name} must replay their last bid (${lastBid.toFixed(1)}s) next round!`, victimId: target.id });
        } else {
          addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} ECHO: ${target.name} has no bid history — no effect`, basic: true });
          if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🔁 ECHO: NO HISTORY', message: `${activator.name} used Echo on ${target.name} — no bid history, no effect.` });
        }
      }
      break;
    }
    case 'marked': {
      // Only available in second half of game
      if (game.round <= Math.floor(game.totalRounds / 2)) {
        activator.relicConsumed = false;
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '❌ RELIC BLOCKED', message: 'Marked can only be used in the second half of the game.' });
        return { success: false, error: 'Only available in second half' };
      }
      const target = game.players.find(p => p.id === targetId);
      if (target) {
        target.markedBy = activator.id;
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} MARKED: ${target.name} is marked — ghosted on next win`, basic: true });
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '👁️ MARKED', message: `${activator.name} marked ${target.name} — they will be ghosted on their next win!`, victimId: target.id });
      }
      break;
    }
    case 'corrupt': {
      const target = game.players.find(p => p.id === targetId && p.isBot);
      if (target) {
        target.corruptRoundsLeft = 3;
        target.personality = 'aggressive';
        addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} CORRUPT: ${target.name} is now AGGRESSIVE for 3 rounds!`, basic: true });
        if (emitToLobby) {
          emitToLobby(lobbyCode, 'relic_broadcast', { title: '🦠 CORRUPT', message: `${activator.name} corrupted ${target.name} — they go AGGRESSIVE for 3 rounds!`, victimId: target.id });
          // Private confirmation to the activator
          emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '🦠 CORRUPT APPLIED', message: `${target.name} is now AGGRESSIVE for 3 rounds!` });
        }
      } else {
        // No valid bot targets — refund and notify activator privately
        activator.relicConsumed = false;
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '🦠 CORRUPT: NO TARGETS', message: 'No eligible bot targets available to corrupt. Relic refunded.' });
        return { success: false, error: 'No valid bot targets' };
      }
      break;
    }
    case 'last_will': {
      // Blocked on final round
      if (game.round >= game.totalRounds) {
        activator.relicConsumed = false;
        if (emitToLobby) emitToLobby(lobbyCode, 'relic_private', { socketId: activator.socketId, title: '❌ RELIC BLOCKED', message: 'Last Will cannot be activated on the final round.' });
        return { success: false, error: 'Cannot activate on final round' };
      }
      // Trophy-only, random opponent — targetId/curseType no longer needed
      activator.pendingLastWill = { targetId: '', curseType: 'trophy' };
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} LAST WILL: if ghosted this round, a random opponent loses 1 trophy`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '⚰️ LAST WILL SET', message: `${activator.name} set their Last Will — if ghosted, a random opponent loses 1 trophy!` });
      break;
    }
    case 'death_wish': {
      activator.deathWishActive = true;
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} DEATH WISH: win=+2 trophies | lose=-15s extra`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '💀 DEATH WISH', message: `${activator.name} activated Death Wish — win for +2 trophies, lose and forfeit extra 15s!` });
      break;
    }
    case 'blood_pact': {
      activator.bloodPactActive = true;
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} BLOOD PACT: all losers also pay the winner's bid time`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🩸 BLOOD PACT', message: `${activator.name} activated Blood Pact — all non-winners will pay the winner's bid time this round!` });
      break;
    }
    case 'cursed_dice': {
      activator.cursedDiceActive = true;
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} CURSED DICE: ±30s after round end (50/50)`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🎲 CURSED DICE', message: `${activator.name} armed Cursed Dice — 50/50 chance of ±30s after this round!` });
      break;
    }
    case 'final_writ': {
      activator.finalWritActive = true;
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} FINAL WRIT: will auto-win the final round`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '✒️ FINAL WRIT', message: `${activator.name} activated Final Writ — they will automatically win the final round!` });
      break;
    }
    case 'seance': {
      const ghosts = game.players.filter(p => p.isGhost && !p.isEliminated);
      if (ghosts.length < 2) {
        // Not enough ghosts — refund the relic
        activator.relicConsumed = false;
        return { success: false, error: 'Not enough ghosts (need 2+)' };
      }
      ghosts.forEach(ghost => {
        const reviveTime = Math.max(45, ghost.ghostTimeAtDeath ?? 0);
        ghost.isGhost = false;
        ghost.remainingTime = reviveTime;
        ghost.ghostImage = undefined;
        ghost.ghostAbility = null;
        ghost.ghostAbilityUsed = false;
        ghost.possessionTargetId = undefined;
        ghost.possessionRoundsLeft = undefined;
        addGameLogEntry(game, { type: 'ability', playerId: ghost.id, playerName: ghost.name, message: `${ghost.name} revived by Séance with ${reviveTime.toFixed(1)}s!`, basic: true });
      });
      activator.tokens += 1;
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} SÉANCE: ${ghosts.length} ghost(s) revived! +1 trophy`, value: 1, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🕯️ SÉANCE', message: `${activator.name} performed a Séance — ${ghosts.length} ghost(s) revived!` });
      break;
    }
    case 'protocol_forcer': {
      const darkPool = DARK_PROTOCOLS;
      const picked = darkPool[Math.floor(Math.random() * darkPool.length)];
      game.forcedProtocolNextRound = picked;
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} PROTOCOL FORCER: next round will be ${picked}`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '⛓️ PROTOCOL FORCER', message: `${activator.name} used Protocol Forcer — next round will run: ${picked}!` });
      break;
    }
    case 'tribunal': {
      // Start a vote (or queue it if a vote is already in progress)
      const target = game.players.find(p => p.id === targetId);
      if (!target) { activator.relicConsumed = false; return { success: false, error: 'Invalid target' }; }
      const allVoters = game.players.filter(p => !p.isEliminated);
      const votes: Record<string, string> = {};
      // Bots auto-vote randomly
      allVoters.filter(p => p.isBot).forEach(b => {
        votes[b.id] = Math.random() < 0.5 ? 'A' : 'B';
      });
      const newVote: PendingRelicVote = {
        relicId: 'tribunal',
        activatorId: activator.id,
        targetId: target.id,
        options: [
          { id: 'A', label: `${target.name} loses 30s next round` },
          { id: 'B', label: `${target.name} is forced to forfeit bidding next round` },
        ],
        votes,
        deadline: Date.now() + 30000,
      };
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} TRIBUNAL: vote started targeting ${target.name}`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '⚖️ TRIBUNAL VOTE STARTED', message: `${activator.name} called a Tribunal against ${target.name}! Vote now.`, victimId: target.id });
      if (game.pendingVote && !game.pendingVote.resolved) {
        // Another vote is active — queue this one
        if (!game.voteQueue) game.voteQueue = [];
        game.voteQueue.push(newVote);
        addGameLogEntry(game, { type: 'ability', message: `TRIBUNAL vote queued (another vote is in progress)`, basic: true });
      } else {
        game.pendingVote = newVote;
        // Schedule auto-resolve
        setTimeout(() => resolveVoteRelic(lobbyCode), 31000);
      }
      break;
    }
    case 'conclave': {
      const allVoters = game.players.filter(p => !p.isEliminated);
      const votes: Record<string, string> = {};
      const options = ['A', 'B', 'C', 'D'];
      allVoters.filter(p => p.isBot).forEach(b => {
        votes[b.id] = options[Math.floor(Math.random() * options.length)];
      });
      const newVote: PendingRelicVote = {
        relicId: 'conclave',
        activatorId: activator.id,
        options: [
          { id: 'A', label: 'Cut everyone\'s time bank in half' },
          { id: 'B', label: 'Skip next round as a tie (no bids)' },
          { id: 'C', label: '100% protocols for the rest of the game' },
          { id: 'D', label: 'Overclock — bottom 2 players lose a trophy' },
        ],
        votes,
        deadline: Date.now() + 30000,
      };
      addGameLogEntry(game, { type: 'ability', playerId: activator.id, playerName: activator.name, message: `${activator.name} CONCLAVE: vote started!`, basic: true });
      if (emitToLobby) emitToLobby(lobbyCode, 'relic_broadcast', { title: '🗳️ CONCLAVE VOTE STARTED', message: `${activator.name} called a Conclave! Vote now.` });
      if (game.pendingVote && !game.pendingVote.resolved) {
        // Another vote is active — queue this one
        if (!game.voteQueue) game.voteQueue = [];
        game.voteQueue.push(newVote);
        addGameLogEntry(game, { type: 'ability', message: `CONCLAVE vote queued (another vote is in progress)`, basic: true });
      } else {
        game.pendingVote = newVote;
        setTimeout(() => resolveVoteRelic(lobbyCode), 31000);
      }
      break;
    }
    default:
      break;
  }

  broadcastGameState(lobbyCode);
  return { success: true };
}

// ─── Vote Relic: Cast ─────────────────────────────────────────────────────────

export function castVoteRelic(
  lobbyCode: string,
  socketId: string,
  optionId: string,
): { success: boolean; error?: string } {
  const game = activeGames.get(lobbyCode);
  if (!game || !game.pendingVote || game.pendingVote.resolved) return { success: false, error: 'No active vote' };
  const player = game.players.find(p => p.socketId === socketId);
  if (!player || player.isEliminated) return { success: false, error: 'Invalid player' };
  const valid = game.pendingVote.options.find(o => o.id === optionId);
  if (!valid) return { success: false, error: 'Invalid option' };

  game.pendingVote.votes[player.id] = optionId;

  // Check if all human non-eliminated players have voted → resolve early
  const humanVoters = game.players.filter(p => !p.isBot && !p.isEliminated);
  const allHumansVoted = humanVoters.every(p => game.pendingVote!.votes[p.id]);
  broadcastGameState(lobbyCode);
  if (allHumansVoted) {
    resolveVoteRelic(lobbyCode);
  }
  return { success: true };
}

// ─── Vote Relic: Resolve ──────────────────────────────────────────────────────

function resolveVoteRelic(lobbyCode: string) {
  const game = activeGames.get(lobbyCode);
  if (!game || !game.pendingVote || game.pendingVote.resolved) return;
  const vote = game.pendingVote;
  vote.resolved = true;

  // Count votes
  const tally: Record<string, number> = {};
  vote.options.forEach(o => { tally[o.id] = 0; });
  Object.values(vote.votes).forEach(v => { tally[v] = (tally[v] ?? 0) + 1; });

  // Pick winner (ties: alphabetical order of option id)
  const sorted = [...vote.options].sort((a, b) => {
    const diff = (tally[b.id] ?? 0) - (tally[a.id] ?? 0);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
  const winner = sorted[0];

  addGameLogEntry(game, {
    type: 'ability',
    message: `VOTE RESOLVED: ${winner.label} (${tally[winner.id]} vote${tally[winner.id] !== 1 ? 's' : ''})`,
    basic: true,
  });

  if (vote.relicId === 'tribunal') {
    const target = game.players.find(p => p.id === vote.targetId);
    if (target) {
      if (winner.id === 'A') {
        target.tribunalTimePenalty = (target.tribunalTimePenalty ?? 0) + 30;
        addGameLogEntry(game, { type: 'impact', playerId: target.id, playerName: target.name, message: `${target.name} TRIBUNAL A: -30s at start of next round`, value: -30, basic: true });
      } else {
        target.tribunalForfeit = true;
        addGameLogEntry(game, { type: 'impact', playerId: target.id, playerName: target.name, message: `${target.name} TRIBUNAL B: forced to forfeit next round's bid`, basic: true });
      }
    }
  } else if (vote.relicId === 'conclave') {
    switch (winner.id) {
      case 'A': {
        game.players.forEach(p => {
          if (!p.isEliminated && !p.isGhost) {
            p.remainingTime = Math.floor(p.remainingTime / 2 * 10) / 10;
          }
        });
        addGameLogEntry(game, { type: 'ability', message: 'CONCLAVE A: All time banks halved!', basic: true });
        break;
      }
      case 'B': {
        game.skipNextRound = true;
        addGameLogEntry(game, { type: 'ability', message: 'CONCLAVE B: Next round will be skipped as a tie!', basic: true });
        break;
      }
      case 'C': {
        game.protocolsAlwaysOn = true;
        addGameLogEntry(game, { type: 'ability', message: 'CONCLAVE C: Protocols will trigger every round for the rest of the game!', basic: true });
        break;
      }
      case 'D': {
        const alive = game.players.filter(p => !p.isEliminated && !p.isGhost);
        if (alive.length >= 2) {
          const sorted2 = [...alive].sort((a, b) => a.tokens - b.tokens);
          const minTokens = sorted2[0].tokens;
          const bottom2 = sorted2.filter(p => p.tokens === minTokens).slice(0, 2);
          if (bottom2.length < 2) bottom2.push(sorted2[1]);
          const targetSet = new Set(bottom2.slice(0, 2).map(p => p.id));
          game.players.filter(p => targetSet.has(p.id)).forEach(p => {
            p.tokens = p.tokens - 1;
            addGameLogEntry(game, { type: 'impact', playerId: p.id, playerName: p.name, message: `${p.name} CONCLAVE D: -1 trophy (bottom 2)`, value: -1, basic: true });
          });
        }
        addGameLogEntry(game, { type: 'ability', message: 'CONCLAVE D: Bottom 2 players lost a trophy!', basic: true });
        break;
      }
    }
  }

  // Emit a targeted event so clients know the vote resolved
  if (emitToLobby) {
    emitToLobby(lobbyCode, 'vote_relic_resolved', {
      relicId: vote.relicId,
      winnerId: winner.id,
      winnerLabel: winner.label,
      tally,
    });
  }

  // Dequeue next vote if one is waiting
  if (game.voteQueue && game.voteQueue.length > 0) {
    const nextVote = game.voteQueue.shift()!;
    // Refresh deadline and reset resolved flag
    nextVote.deadline = Date.now() + 30000;
    nextVote.resolved = false;
    game.pendingVote = nextVote;
    addGameLogEntry(game, { type: 'ability', message: `Next queued vote starting: ${nextVote.relicId}`, basic: true });
    setTimeout(() => resolveVoteRelic(lobbyCode), 31000);
  } else {
    game.pendingVote = null;
  }

  broadcastGameState(lobbyCode);
}
