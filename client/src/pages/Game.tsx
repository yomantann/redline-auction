import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast"; // Added toast hook
import { useSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/use-auth";
import { GameLayout } from "@/components/game/GameLayout";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { AuctionButton } from "@/components/game/AuctionButton";
import { PlayerStats } from "@/components/game/PlayerStats";
import { MusicPlayer } from "@/components/game/MusicPlayer";
import { Mail, Heart } from 'lucide-react';
import type { PlayerProfile, EquippedCosmetics } from "@shared/schema";
import { getLogoUrl, getCardStyles, getDriverSkinUrl, getBorderImageUrl } from "@/lib/cosmeticsStyles";
import { PlayerProfileWidget } from "@/components/game/PlayerProfileWidget";
import { GuestBanner } from "@/components/game/GuestBanner";

import { GameOverlay, OverlayType } from "@/components/game/GameOverlay";

// Define OverlayItem interface locally to match GameOverlay
interface OverlayItem {
  id: string;
  type: OverlayType;
  message?: string;
  subMessage?: string;
  duration?: number;
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Add Input for multiplayer
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Trophy, AlertTriangle, RefreshCw, LogOut, SkipForward, Clock, Settings, Eye, EyeOff,
  Shield, MousePointer2, Snowflake, Rocket, Brain, Zap, Megaphone, Flame, TrendingUp, User,
  Users, Globe, Lock, BookOpen, CircleHelp, Martini, PartyPopper, Skull, Info, Share2, Shuffle, ChevronDown, X
} from "lucide-react";

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

// Import Generated Images
import charGuardian from '@assets/generated_images/guardian.png';
import charClick from '@assets/generated_images/click.png';
import charFrost from '@assets/generated_images/frost.png';
import charSadman from '@assets/generated_images/sadman.png';
import charDash from '@assets/generated_images/dash.png';
import charAccuser from '@assets/generated_images/accuser.png';
import charLowflame from '@assets/generated_images/lowflame.png';
import charWandering from '@assets/generated_images/wandering.png';
import charRind from '@assets/generated_images/rind.png';
import charAnointed from '@assets/generated_images/anointed.png';
import charExecutive from '@assets/generated_images/executive.png';
import charAlpha from '@assets/generated_images/alpha.png';
import charRoll from '@assets/generated_images/roll.png';
import charHotwired from '@assets/generated_images/hotwired.png';
import charPanic from '@assets/generated_images/panic.png';
import charPain from '@assets/generated_images/pain.png';
import charPrimate from '@assets/generated_images/primate.png';


// Social Mode Images
import socialSadman from "../assets/generated_images/SOCIAL/social_sadman_option3.png";
import socialDash from "../assets/generated_images/SOCIAL/social_rainbow_dash_option1.png";
import socialGuardian from "../assets/generated_images/SOCIAL/social_guardian_h_option1.png";
import socialFrost from "../assets/generated_images/SOCIAL/social_frostybyte_option1.png";
import socialExecutive from "../assets/generated_images/SOCIAL/social_executive_p_detailed_v4.png";
import socialPain from "../assets/generated_images/SOCIAL/social_pain_hider_life_support_v6.png";
import socialPanic from "../assets/generated_images/SOCIAL/social_panic_bot_toy_v2.png";
import socialAccuser from "../assets/generated_images/SOCIAL/social_accuser_pointing_v4.png";
import socialClick from '../assets/generated_images/SOCIAL/social_click.png';
import socialLowflame from '../assets/generated_images/SOCIAL/social_lowflame.png';
import socialWandering from '../assets/generated_images/SOCIAL/social_wandering.png';
import socialRind from '../assets/generated_images/SOCIAL/social_rind.png';
import socialAnointed from '../assets/generated_images/SOCIAL/social_anointed.png';
import socialAlpha from '../assets/generated_images/SOCIAL/social_alpha.png';
import socialRoll from '../assets/generated_images/SOCIAL/social_roll.png';
import socialHotwired from '../assets/generated_images/SOCIAL/social_hotwired.png';
import socialPrimate from '../assets/generated_images/SOCIAL/social_primate.png';

import charIdolCore from '../assets/generated_images/SOCIAL/social_idol.png';
import charPromKing from '../assets/generated_images/SOCIAL/social_prom.png';
import socialTank from '../assets/generated_images/SOCIAL/social_tank.png';
import socialDangerZone from '../assets/generated_images/SOCIAL/social_danger_zone.png';

// Bio Mode Images
import bioPanic from "../assets/generated_images/BIO/bio_panic_bot_option3.png";
import bioAccuser from "../assets/generated_images/BIO/bio_accuser_girl_pointing_v5.png";
import bioGuardian from '../assets/generated_images/BIO/bio_guardian_h_gorilla_pushups_v4.png';
import bioClick from '../assets/generated_images/BIO/bio_click.png';
import bioFrost from '../assets/generated_images/BIO/bio_frostbyte_v4.png';
import bioSadman from '../assets/generated_images/BIO/bio_sadman.png';
import bioDash from '../assets/generated_images/BIO/bio_dash.png';
import bioLowflame from '../assets/generated_images/BIO/bio_low_flame_no_text_v3.png';
import bioWandering from '../assets/generated_images/BIO/bio_wandering.png';
import bioRind from '../assets/generated_images/BIO/bio_rind_mouse_sniper_v4.png';
import bioAnointed from '../assets/generated_images/BIO/bio_anointed.png';
import bioExecutive from '../assets/generated_images/BIO/bio_executive_p_axe_v5.png';
import bioAlpha from '../assets/generated_images/BIO/bio_alpha.png';
import bioRoll from '../assets/generated_images/BIO/bio_roll.png';
import bioHotwired from '../assets/generated_images/BIO/bio_hotwired_bar_on_fire_v6.png';
import bioPrimate from '../assets/generated_images/BIO/bio_primate.png';
import bioPain from '../assets/generated_images/BIO/bio_pain.png';

import bioPromKing from '../assets/generated_images/BIO/bio_prom.png';
import bioIdolCore from '../assets/generated_images/BIO/bio_idol_core.png';
import charRockShush from '../assets/generated_images/BIO/bio_tank.png';
import charDangerZone from '../assets/generated_images/BIO/bio_danger.png';

// Haunted Mode: per-driver images (first image per driver)
import hntGuardian from '../assets/generated_images/Haunted/hnt_guardian_1.png';
import hntClick from '../assets/generated_images/Haunted/hnt_click_1.png';
import hntFrost from '../assets/generated_images/Haunted/hnt_frost_1.png';
import hntSadman from '../assets/generated_images/Haunted/hnt_sadman_3.png';
import hntDash from '../assets/generated_images/Haunted/hnt_dash_4.png';
import hntAccuser from '../assets/generated_images/Haunted/hnt_accuser_3.png';
import hntLowflame from '../assets/generated_images/Haunted/hnt_lowflame_1.png';
import hntWander from '../assets/generated_images/Haunted/hnt_wander_1.png';
import hntRind from '../assets/generated_images/Haunted/hnt_rind_1.png';
import hntAnnointed from '../assets/generated_images/Haunted/hnt_annointed_1.png';
import hntExec from '../assets/generated_images/Haunted/hnt_exec_3.png';
import hntAlpha from '../assets/generated_images/Haunted/hnt_alpha_1.png';
import hntRoll from '../assets/generated_images/Haunted/hnt_roll_2.png';
import hntHotwired from '../assets/generated_images/Haunted/hnt_hotwired_1.png';
import hntPanic from '../assets/generated_images/Haunted/hnt_panic_3.png';
import hntPrimate from '../assets/generated_images/Haunted/hnt_primate_1.png';
import hntPain from '../assets/generated_images/Haunted/hnt_pain_1.png';

// Haunted Mode: ghost images (used when player becomes a ghost)
import hntGhost1 from '../assets/generated_images/Haunted/hnt_ghost_reaper.png';
import hntGhost2 from '../assets/generated_images/Haunted/hnt_ghost_curse.png';
import hntGhost3 from '../assets/generated_images/Haunted/hnt_ghost_vendetta.png';
import hntGhost4 from '../assets/generated_images/Haunted/hnt_ghost_bargain.png';
import hntGhost5 from '../assets/generated_images/Haunted/hnt_ghost_possession.png';
import hntGhost6 from '../assets/generated_images/Haunted/hnt_ghost_purgatory.png';

// Pool of ghost images for random assignment on ghosting (6 ghost visuals)
const GHOST_IMAGES = [hntGhost1, hntGhost2, hntGhost3, hntGhost4, hntGhost5, hntGhost6];

// Ghost ability type — simplified to only reaper (25%) or purgatory (75%)
type GhostAbilityType = 'reaper' | 'purgatory' | null;

const GHOST_ABILITY_NAMES: Record<NonNullable<GhostAbilityType>, string> = {
  reaper:     '💀 REAPER',
  purgatory:  '🌑 PURGATORY',
};

const GHOST_ABILITY_DESCS: Record<NonNullable<GhostAbilityType>, string> = {
  reaper:     'Another alive player is immediately ghosted. You will return in 2 rounds.',
  purgatory:  'After 2 rounds, you return with at least 45s or the lowest alive player\'s time bank.',
};

// Map driver ID -> haunted image
const HAUNTED_DRIVER_IMAGES: Record<string, string> = {
  guardian_h: hntGuardian,
  click_click: hntClick,
  frostbyte: hntFrost,
  sadman: hntSadman,
  rainbow_dash: hntDash,
  accuser: hntAccuser,
  low_flame: hntLowflame,
  wandering_eye: hntWander,
  the_rind: hntRind,
  anointed: hntAnnointed,
  executive_p: hntExec,
  alpha_prime: hntAlpha,
  roll_safe: hntRoll,
  hotwired: hntHotwired,
  panic_bot: hntPanic,
  primate: hntPrimate,
  pain_hider: hntPain,
};


import { AbilityAnimation, AnimationType } from "@/components/game/AbilityAnimation";
import logoFuturistic from '@assets/generated_images/redline_auction_futuristic_logo_red_neon.png';

// Game Constants
const STANDARD_TOTAL_ROUNDS = 9; 
const STANDARD_INITIAL_TIME = 300.0;
const LONG_TOTAL_ROUNDS = 18;
const LONG_INITIAL_TIME = 600.0;
const SHORT_TOTAL_ROUNDS = 9; // Changed from 5 to 9
const SHORT_INITIAL_TIME = 150.0;

const COUNTDOWN_SECONDS = 3; 
const READY_HOLD_DURATION = 3.0; 

type GamePhase = 'intro' | 'multiplayer_lobby' | 'character_select' | 'haunted_item_select' | 'mp_driver_select' | 'ready' | 'countdown' | 'bidding' | 'overclock' | 'round_end' | 'game_end';
type BotPersonality = 'balanced' | 'aggressive' | 'conservative' | 'random' | 'adaptive' | 'psychological';
type GameDuration = 'standard' | 'long' | 'short';
// NEW PROTOCOL TYPES
    type SocialProtocol = 'TRUTH_DARE' | 'SWITCH_SEATS' | 'HUM_TUNE' | 'LOCK_ON' | 'NOISE_CANCEL';
type BioProtocol = 'HYDRATE' | 'BOTTOMS_UP' | 'PARTNER_DRINK' | 'WATER_ROUND';

// Extended Protocol Type
type ProtocolType = 
  | 'DATA_BLACKOUT' | 'DOUBLE_STAKES' | 'SYSTEM_FAILURE' 
  | 'OPEN_HAND' | 'MUTE_PROTOCOL' 
  | 'NO_LOOK' | 'LOCK_ON' 
  | 'THE_MOLE' | 'PANIC_ROOM' 
  | 'UNDERDOG_VICTORY' | 'TIME_TAX' | 'PRIVATE_CHANNEL'
  | 'OVERCLOCK' | 'CALIBRATION'
  | SocialProtocol
  | BioProtocol
  | null;

// ... (Existing Characters)

// NEW CHARACTERS (SOCIAL MODE)
const SOCIAL_CHARACTERS: Character[] = [
  { 
    id: 'prom_king', name: 'Prom King', title: 'The Crowned', image: charPromKing, imageSocial: charPromKing, imageBio: bioPromKing, description: 'Royalty of the moment.', color: 'text-purple-500',
    ability: { name: 'SPOTLIGHT', description: 'If you win, everyone else cheers (no effect, just vibes).', effect: 'TOKEN_BOOST' },
    socialAbility: { name: 'PROM COURT', description: 'Chance you may make a rule for remainder of game.' },
    bioAbility: { name: 'CORONATION', description: 'Initiate a group toast. Everyone drinks.' }
  },
  {
    id: 'idol_core', name: 'Idol Core', title: 'The Star', image: charIdolCore, imageSocial: charIdolCore, imageBio: bioIdolCore, description: 'Stage presence and perfect timing.', color: 'text-pink-500',
    ability: { name: 'COUNT IT IN', description: 'When you say "count it in", next person to talk must say "5678" or drop their button.', effect: 'PEEK' },
    socialAbility: { name: 'FANCAM', description: 'Chance 1 random player shows hidden talent or drops button.' },
    bioAbility: { name: 'DEBUT', description: 'Take a drink to reveal a "secret" (see an opponent\'s bid).' }
  }
];

// NEW CHARACTERS (BIO-FUEL MODE)
const BIO_CHARACTERS: Character[] = [
  { 
    id: 'tank', name: 'The Tank', title: 'Iron Liver', image: charRockShush, imageSocial: socialTank, imageBio: charRockShush, description: 'Solid as a rock. Literally.', color: 'text-green-600',
    ability: { name: 'IRON STOMACH', description: 'Immune to "Drink" penalties (Lore only).', effect: 'TIME_REFUND' },
    socialAbility: { name: 'PEOPLE\'S ELBOW', description: 'Challenge someone to a thumb war.' },
    bioAbility: { name: 'ABSORB', description: 'Take a big sip to cancel out any drinking prompt.' }
  },
  {
    id: 'danger_zone', name: 'Danger Zone', title: 'Club Queen', image: charDangerZone, imageSocial: socialDangerZone, imageBio: charDangerZone, description: 'Poles & Souls', color: 'text-pink-600',
    ability: { name: 'OVERPOUR', description: 'Decide before the game starts how big 1 sip really is.', effect: 'DISRUPT' },
    socialAbility: { name: 'PRIVATE DANCE', description: 'Give a command.' },
    bioAbility: { name: 'CHAIN REACTION', description: 'If you finish your drink, person to your left must also finish theirs.' }
  }
];

// ... (Game Component)

interface Player {
  id: string;
  name: string;
  isBot: boolean;
  tokens: number;
  remainingTime: number;
  isEliminated: boolean;
  currentBid: number | null; // null means still holding or hasn't bid
  isHolding: boolean;
  personality?: BotPersonality;
  characterIcon?: string | React.ReactNode; // Can be image URL or icon
  roundImpact?: string; // Legacy string for backward compatibility
  impactLogs?: { value: string; reason: string; type: 'loss' | 'gain' | 'neutral' | 'trophy' | 'forced' }[]; // NEW: Structured logs
  // Multiplayer driver info
  selectedDriver?: string; // Driver ID for multiplayer
  driverName?: string; // Driver/character name
  driverAbility?: string; // Driver ability description
  roundEndAcknowledged?: boolean; // For next round acknowledgment
  // Stats
  totalTimeBid: number;
  netImpact: number; // Net of all positive and negative impacts throughout the game
  specialEvents: string[];
  eventDatabasePopups: string[]; // NEW: Track Event DB Popups
  protocolsTriggered: string[];
  protocolWins: string[]; // NEW: Track protocols won specifically
  totalDrinks: number;
  socialDares: number;
  // Bonus trophy tracking
  isFirstEliminated?: boolean;    // True if this player was among the first eliminated (Flash Crash criterion)
  shortestWinBidTime?: number;    // Shortest bid time used to win a round (Market Sniper criterion)
  // Haunted mode fields
  selectedItem?: string;          // Haunted mode: name of selected haunted item
  isGhost?: boolean;              // Haunted mode: true when player is converted to ghost on elimination
  ghostAbility?: 'reaper' | 'purgatory' | null; // Ghost ability (25% reaper, 75% purgatory)
  ghostAbilityUsed?: boolean;     // Has this ghost's ability already been used?
  possessionRoundsLeft?: number;  // Purgatory countdown rounds remaining before revive
  // Ghost reason / revival
  ghostReason?: 'natural' | 'forced';   // 'natural' = ran out of time; 'forced' = externally ghosted with time remaining
  ghostTimeAtDeath?: number;             // Time bank frozen at moment of forced ghosting
  ghostImage?: string;                   // ghost image key e.g. 'hnt_ghost_3'
  // Relic state
  relicConsumed?: boolean;               // Whether this player's relic has been used/consumed
  bidHistory?: number[];                 // All historical bids (for Echo + Pattern Lock relics)
  pendingLastWill?: { targetId: string; curseType: 'time' | 'trophy' }; // Last Will deferred curse
  markedBy?: string;                     // Marked relic: ID of player who marked this player
  corruptRoundsLeft?: number;            // Corrupt relic: rounds remaining with 'aggressive' override
  patternLockMinBid?: number;            // Pattern Lock: forced minimum bid next round
  deathWishActive?: boolean;             // Death Wish: active this round (win=+2 trophies, lose=-15s extra)
  bloodPactActive?: boolean;             // Blood Pact: active player (all losers also pay winner's bid)
  cursedDiceActive?: boolean;            // Cursed Dice: active (±30s after round end)
  finalWritActive?: boolean;             // Final Writ: this player auto-wins the final round
}

interface Character {
  id: string;
  name: string;
  title: string;
  image: string; // Changed from icon to image
  imageSocial?: string; // New: Social Mode Image
  imageBio?: string;    // New: Bio-Fuel Mode Image
  imageHaunted?: string; // New: Haunted Mode Image
  description: string;
  color: string;
  ability?: {
    name: string;
    description: string;
    effect: 'TIME_REFUND' | 'TOKEN_BOOST' | 'DISRUPT' | 'PEEK';
  };
  socialAbility?: {
    name: string;
    description: string;
  };
  bioAbility?: {
    name: string;
    description: string;
  };
}

const CHARACTERS: Character[] = [
  { 
    id: 'guardian_h', name: 'Guardian H', title: 'The Eternal Watcher', image: charGuardian, imageSocial: socialGuardian, imageBio: bioGuardian, imageHaunted: hntGuardian, description: 'Stoic protection against bad bids.', color: 'text-zinc-400',
    ability: { name: 'SPIRIT SHIELD', description: '+11s if you win Round 1.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'VIBE GUARD', description: 'Designate a player immune to social dares each round.' },
    bioAbility: { name: 'LIQUID AUTHORIZATION', description: 'At round end: Others cannot release button until you finish a sip.' }
  },
  { 
    id: 'click_click', name: 'Click-Click', title: 'The Glitch', image: charClick, imageSocial: socialClick, imageBio: bioClick, imageHaunted: hntClick, description: 'Hyperactive timing precision.', color: 'text-pink-400',
    ability: { name: 'HYPER CLICK', description: 'Gain +1 token if you win within 1.1s of 2nd place.', effect: 'TOKEN_BOOST' },
    socialAbility: { name: 'MISCLICK', description: 'Chance 1 player must hold bid without using hands.' },
    bioAbility: { name: 'MOUTH POP', description: '1 round: Everyone sips when Click-Click opens and closes mouth IRL.' }
  },
  { 
    id: 'frostbyte', name: 'Frostbyte', title: 'The Disciplined', image: charFrost, imageSocial: socialFrost, imageBio: bioFrost, imageHaunted: hntFrost, description: 'Cold, calculated efficiency.', color: 'text-cyan-400',
    ability: { name: 'CYRO FREEZE', description: 'Refund 1.0s regardless of outcome.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'COLD SHOULDER', description: 'Chance you may ignore all social interactions.' },
    bioAbility: { name: 'BRAIN FREEZE', description: '1 round: 1 opponent forced to win or drink.' }
  },
  { 
    id: 'sadman', name: 'Sadman Logic', title: 'The Analyst', image: charSadman, imageSocial: socialSadman, imageBio: bioSadman, imageHaunted: hntSadman, description: 'Feels bad, plays smart.', color: 'text-green-500',
    ability: { name: 'SAD REVEAL', description: 'See 1 opponent holding per round. Your time bank is permanently scrambled.', effect: 'PEEK' },
    socialAbility: { name: 'SAD STORY', description: 'Chance 1 random player shares a sad story.' },
    bioAbility: { name: 'DRINKING PARTNER', description: 'Every round you can change your drinking buddy.' }
  },
  { 
    id: 'rainbow_dash', name: 'Rainbow Dash', title: 'The Speeder', image: charDash, imageSocial: socialDash, imageBio: bioDash, imageHaunted: hntDash, description: 'Neon trails and fast reactions.', color: 'text-purple-400',
    ability: { name: 'RAINBOW RUN', description: 'Get 3.5s refund if you bid > 40s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'SUGAR RUSH', description: 'Chance 1 random opponent must speak 2x speed.' },
    bioAbility: { name: 'RAINBOW SHOT', description: 'Chance 1 random player mixes two drinks.' }
  },
  { 
    id: 'accuser', name: 'The Accuser', title: 'The Aggressor', image: charAccuser, imageSocial: socialAccuser,
    imageBio: bioAccuser, imageHaunted: hntAccuser,
    description: 'Loud and disruptive tactics.', color: 'text-red-400',
    ability: { name: 'MANAGER CALL', description: 'Remove 2s from random opponent every round.', effect: 'DISRUPT' },
    socialAbility: { name: 'COMPLAINT', description: 'Chance everyone votes on winner\'s punishment.' },
    bioAbility: { name: 'SPILL HAZARD', description: 'Chance to accuse someone of spilling; they drink.' }
  },
  { 
    id: 'low_flame', name: 'Low Flame', title: 'The Survivor', image: charLowflame, imageSocial: socialLowflame, imageBio: bioLowflame, imageHaunted: hntLowflame, description: 'Perfectly chill in chaos.', color: 'text-orange-500',
    ability: { name: 'FIRE WALL', description: 'Immune to ALL protocols.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'HOT SEAT', description: 'Chance to choose a player to answer a truth.' },
    bioAbility: { name: 'ON FIRE', description: 'When you win, everyone else drinks.' }
  },
  { 
    id: 'wandering_eye', name: 'Wandering Eye', title: 'The Opportunist', image: charWandering, imageSocial: socialWandering, imageBio: bioWandering, imageHaunted: hntWander, description: 'Always looking for a better deal.', color: 'text-blue-400',
    ability: { name: 'SNEAK PEEK', description: 'See 1 random player holding. All other banks scrambled.', effect: 'PEEK' },
    socialAbility: { name: 'DISTRACTION', description: 'Chance to point at something; anyone who looks must drop buzzer.' },
    bioAbility: { name: 'THE EX', description: 'Chance 1 random player toasts to an ex.' }
  },
  { 
    id: 'the_rind', name: 'The Rind', title: 'The Time Thief', image: charRind, imageSocial: socialRind, imageBio: bioRind, imageHaunted: hntRind, description: 'Sneaky tactics and stolen seconds.', color: 'text-gray-500',
    ability: { name: 'CHEESE TAX', description: 'Steal 2s from winner if you lose.', effect: 'DISRUPT' },
    socialAbility: { name: 'SNITCH', description: 'Chance 1 random player must reveal someone\'s tell.' },
    bioAbility: { name: 'SCAVENGE', description: 'Chance 1 random player finishes someone else\'s drink.' }
  },
  { 
    id: 'anointed', name: 'The Anointed', title: 'The Royal', image: charAnointed, imageSocial: socialAnointed,
    imageBio: bioAnointed, imageHaunted: hntAnnointed,
    description: 'Silent authority and iron will.', color: 'text-blue-500',
    ability: { name: 'ROYAL DECREE', description: 'Get 20s refund if you bid within 0.4s of 20s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'COMMAND SILENCE', description: 'Chance everyone is commanded silent' },
    bioAbility: { name: 'ROYAL CUP', description: '1 random round: Make a rule for remainder of game.' }
  },
  { 
    id: 'executive_p', name: 'Executive P', title: 'The Psycho', image: charExecutive, imageSocial: socialExecutive, imageBio: bioExecutive, imageHaunted: hntExec, description: 'Impeccable taste, dangerous mind.', color: 'text-red-500',
    ability: { name: 'AXE SWING', description: 'Remove 2s from non-eliminated opponent with most time.', effect: 'DISRUPT' },
    socialAbility: { name: 'CC\'D', description: 'Chance 1 random player must copy your actions next round.' },
    bioAbility: { name: 'REASSIGNED', description: 'Chance to choose 1 player to take a drink.' }
  },
  { 
    id: 'alpha_prime', name: 'Alpha Prime', title: 'The Perfect', image: charAlpha, imageSocial: socialAlpha, imageBio: bioAlpha, imageHaunted: hntAlpha, description: 'Peak performance in every bid.', color: 'text-zinc-300',
    ability: { name: 'JAWLINE', description: 'Can drop during countdown without penalty.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'MOG', description: 'Chance 1 random player must do 10 pushups or ff next round.' },
    bioAbility: { name: 'PACE SETTER', description: 'Every 3 rounds, start a game of waterfall.' }
  },
  { 
    id: 'roll_safe', name: 'Roll Safe', title: 'The Consultant', image: charRoll, imageSocial: socialRoll, imageBio: bioRoll, imageHaunted: hntRoll, description: 'Modern solutions for modern bids.', color: 'text-indigo-400',
    ability: { name: 'CALCULATED', description: 'Cannot be impacted by Limit Break abilities.', effect: 'PEEK' },
    socialAbility: { name: 'TECHNICALLY', description: 'You are the decision maker for disputes and unclear rules.' },
    bioAbility: { name: 'BIG BRAIN', description: 'Chance option to have everyone pass drink to the left.' }
  },
  { 
    id: 'hotwired', name: 'Hotwired', title: 'The Anarchist', image: charHotwired, imageSocial: socialHotwired, imageBio: bioHotwired, imageHaunted: hntHotwired, description: 'Watches the market burn with a smile.', color: 'text-orange-600',
    ability: { name: 'BURN IT', description: 'Remove 1s from everyone else.', effect: 'DISRUPT' },
    socialAbility: { name: 'VIRAL MOMENT', description: '1 random round target must re-enact a meme.' },
    bioAbility: { name: 'SPICY', description: 'Chance everyone drinks.' }
  },
  { 
    id: 'panic_bot', name: 'Panic Bot', title: 'The Indecisive', image: charPanic, imageSocial: socialPanic,
    imageBio: bioPanic,  imageHaunted: hntPanic,
    description: 'Always sweating the big decisions.', color: 'text-red-400',
    ability: { name: 'PANIC MASH', description: '50% chance +3s refund, 50% -3s penalty.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'SWEATING', description: 'Wipe brow. If anyone mimics, they drop button.' },
    bioAbility: { name: 'EMERGENCY MEETING', description: 'Chance everyone must point at another to gang up on next round.' }
  },
  { 
    id: 'primate', name: 'Primate Prime', title: 'The Chef', image: charPrimate, imageSocial: socialPrimate, imageBio: bioPrimate, imageHaunted: hntPrimate, description: 'Trust the process, he\'s cooking.', color: 'text-amber-600',
    ability: { name: 'CHEF\'S SPECIAL', description: 'Get 4s refund on wins > 10s over second place.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'FRESH CUT', description: 'Chance 1 random player must compliment everyone.' },
    bioAbility: { name: 'GREEDY GRAB', description: 'Chance previous winner must burn 40s next round or finish drink.' }
  },
  { 
    id: 'pain_hider', name: 'Pain Hider', title: 'The Stoic', image: charPain, imageSocial: socialPain,
    imageBio: bioPain, imageHaunted: hntPain,
    description: 'Smiling through the bear market.', color: 'text-slate-400',
    ability: { name: 'HIDE PAIN', description: 'Get 3s refund if you lose by > 15s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'BOOMER', description: 'You forgot what your power was.' },
    bioAbility: { name: 'SUPPRESS', description: 'If anyone reacts to their drink, they drink again.' }
  },
];

// New Types for Refactored Game Modes
type GameDifficulty = 'COMPETITIVE' | 'CASUAL';
type GameVariant = 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL' | 'HAUNTED';

// Haunted Mode: 
interface HauntedItem {
  id: string;
  number: string;
  name: string;
  icon: string;
  category: 'Cursed' | 'Spooky' | 'Mystical' | 'Chaotic';
  target: 'Self' | 'Everyone' | 'Opponent';
  voteType?: 'vote';
  botOnly?: boolean;
  requiresGhosts?: number; // Minimum active ghosts required to use
  description: string;
  flavour: string;
  ghostNote?: string;
}

const HAUNTED_ITEMS: HauntedItem[] = [
  {
    id: 'ghost_touch',
    number: '01',
    name: 'Ghost Touch',
    icon: '👻',
    category: 'Cursed',
    target: 'Opponent',
    description: 'Target one opponent. 20% chance they are ghosted',
    flavour: 'You pull the trigger. The curse decides if it fires.',
    ghostNote: 'Target spectates until comeback condition met. Not a permanent elimination.',
  },
  {
    id: 'sacrificial_lamb',
    number: '02',
    name: 'Sacrificial Lamb',
    icon: '🐑',
    category: 'Spooky',
    target: 'Everyone',
    description: 'Randomly removes one trophy from one player.',
    flavour: 'The lamb is chosen. Not by you.',
    ghostNote: 'Available in second half of the game.',
  },
  {
    id: 'wild_card',
    number: '03',
    name: 'Wild Card',
    icon: '🌀',
    category: 'Mystical',
    target: 'Everyone',
    description: "All players' time banks are randomly redistributed.",
    flavour: "Nobody knows what they're holding.",
  },
  {
    id: 'death_wish',
    number: '04',
    name: 'Death Wish',
    icon: '💀',
    category: 'Cursed',
    target: 'Self',
    description: 'If you win next round gain +2 tokens instead of 1. If you lose, lose an extra 15s.',
    flavour: 'The curse always takes something.',
  },
  {
    id: 'blood_pact',
    number: '05',
    name: 'Blood Pact',
    icon: '🩸',
    category: 'Cursed',
    target: 'Everyone',
    description: "Next round, all non-winning players lose the winners bid + their own bid.",
    flavour: 'If someone bids big, everyone bleeds.',
  },
  {
    id: 'cursed_dice',
    number: '06',
    name: 'Cursed Dice',
    icon: '🎲',
    category: 'Cursed',
    target: 'Self',
    description: 'Randomly gain +30s or lose −30s after the next round.',
    flavour: 'The curse decides. Not you.',
  },
  {
    id: 'seance',
    number: '07',
    name: 'Séance',
    icon: '🕯️',
    category: 'Mystical',
    target: 'Everyone',
    requiresGhosts: 2,
    description: 'All ghosts are revived. Each ghost returns with 45s or their frozen time bank',
    flavour: 'The veil thins.',
    ghostNote: 'Requires at least 2 active ghosts. You receive +1 trophy.',
  },
  {
    id: 'protocol_forcer',
    number: '08',
    name: 'Protocol Forcer',
    icon: '⛓️',
    category: 'Spooky',
    target: 'Everyone',
    description: 'Force a random haunted protocol from a curated dark subset.',
    flavour: 'The house picks the rules.',
  },
  {
    id: 'tribunal',
    number: '11',
    name: 'The Tribunal',
    icon: '⚖️',
    category: 'Mystical',
    target: 'Opponent',
    voteType: 'vote',
    description: "Players vote on targets fate. A: -30s | B: Their relic is consumed without effect.",
    flavour: 'The table decides your fate.',
    ghostNote: "Ties go to A.",
  },
  {
    id: 'jackpot',
    number: '09',
    name: 'Jackpot',
    icon: '🎰',
    category: 'Chaotic',
    target: 'Self',
    description: 'Random Effect: +40s | +2 trophies | lose 30s | immediately ghosted',
    flavour: "The wheel doesn't care who you are.",
  },
  {
    id: 'last_will',
    number: '10',
    name: 'Last Will',
    icon: '⚰️',
    category: 'Cursed',
    target: 'Opponent',
    description: 'If you are ghosted this round, a random opponent loses 1 trophy.',
    flavour: 'You will not go quietly.',
    ghostNote: 'Cannot be activated on the final round. If you survive the round, nothing happens — relic still consumed.',
  },
  {
    id: 'echo',
    number: '13',
    name: 'Echo',
    icon: '🔁',
    category: 'Spooky',
    target: 'Opponent',
    description: "Your chosen opponents previous round bid is deducted from their bank",
    flavour: 'The past has a way of repeating.',
  },
  {
    id: 'marked',
    number: '14',
    name: 'Marked',
    icon: '👁️',
    category: 'Cursed',
    target: 'Opponent',
    description: "Choose one opponent. The next time they win a round, they are ghosted.",
    flavour: 'Victory is their curse.',
     ghostNote: 'Available in second half of the game.',
  },
  {
    id: 'corrupt',
    number: '15',
    name: 'Corrupt',
    icon: '🦠',
    category: 'Cursed',
    target: 'Opponent',
    botOnly: true,
    description: "Choose one bot player. Their personality is overridden to 'aggressive' for 3 rounds",
    flavour: 'Pull the strings. Watch them burn.',
  },
  {
    id: 'final_writ',
    number: '12',
    name: 'Final Writ',
    icon: '✒️',
    category: 'Cursed',
    target: 'Self',
    description: "The final round is automatically skipped with you as winner.",
    flavour: 'The last page was already written.',
  },
  {
    id: 'conclave',
    number: '17',
    name: 'The Conclave',
    icon: '🗳️',
    category: 'Chaotic',
    target: 'Everyone',
    voteType: 'vote',
    description: 'Players vote on a global effect:\nA: Cut time bank\nB: Skip round\nC: 100% protocols\nD: Overclock',
    flavour: 'Democracy is just organized chaos.',
     ghostNote: 'Overclock — bottom 2 players by trophies each lose 1.',
  },
];



// ... (Existing types)

import { Volume2, VolumeX } from "lucide-react";

// ... (Existing Imports)

// Sound Assets
const MUSIC_TRACKS = [
    '/assets/music/track1.mp3',
    '/assets/music/track2.mp3',
    '/assets/music/track3.mp3'
];
const SFX_POOL = [
  '/assets/sfx/aa-with-reverb-meme-381632.mp3',
  '/assets/sfx/among-us-sound-157106.mp3',
  '/assets/sfx/bonus-143026.mp3',
  '/assets/sfx/fart-4-228244.mp3',
  '/assets/sfx/funny-cat-meow-246012.mp3',
  '/assets/sfx/game-bonus-144751.mp3',
  '/assets/sfx/game-challenge-scene-music-326385.mp3',
  '/assets/sfx/game-over-retro-video-game-1-422479.mp3',
  '/assets/sfx/goodresult-82807.mp3',
  '/assets/sfx/goofy-ahh-car-horn-200870.mp3',
  '/assets/sfx/i-got-this-467997.mp3',
  '/assets/sfx/kaze-no-kioku-30-sec-edit-439955.mp3',
  '/assets/sfx/level-up-191997.mp3',
  '/assets/sfx/losing-horn-313723.mp3',
  '/assets/sfx/mechanical-fantasium-335369.mp3',
  '/assets/sfx/moment_flag2.mp3',
  '/assets/sfx/moment_flag.mp3',
  '/assets/sfx/quirky-detective-comedy-music-ending-15-sec-409287.mp3',
  '/assets/sfx/rakuen-no-tsubasa-30-sec-edit-439976.mp3',
  '/assets/sfx/sound-effect-twinklesparkle-115095.mp3',
  '/assets/sfx/success-resolution-video-game-sound-effect-strings-99782.mp3',
  '/assets/sfx/sus-meme-sound-181271.mp3',
  '/assets/sfx/thud-sound-effect-405470.mp3',
  '/assets/sfx/western-stand-off-474218.mp3',
  '/assets/sfx/wowowowowowowow-103214.mp3'
];

const LOBBY_TRACKS = [
  '/assets/lobby/competition-briefing-i-game-lobby-435660.mp3',
  '/assets/lobby/cyberpunk-futuristic-background-349787.mp3',
  '/assets/lobby/futuristic-179493.mp3',
  '/assets/lobby/futuristic-motivation-synthwave-431078.mp3',
  '/assets/lobby/hope-in-the-darkness-226465.mp3',
  '/assets/lobby/luxury-lounge-jazz-groove-hotel-lobby-ambience-342592.mp3',
  '/assets/lobby/night-detective-226857.mp3',
  '/assets/lobby/ready-to-win-multiverse-fugitives-competitive-ost-269606.mp3',
  '/assets/lobby/mixkit-cyberpunk-city-2-141.mp3',
  '/assets/lobby/mixkit-delirium-605.mp3',
  '/assets/lobby/mixkit-mada-608.mp3',
  '/assets/lobby/mixkit-see-line-funk-105.mp3',
  '/assets/lobby/mixkit-vastness-184.mp3'
];

// Calculate bonus trophies for singleplayer mode (mirrors server-side logic)
// Returns up to 2 criteria results, each with 1 trophy per winner
interface SpBonusTrophyResult {
  criterion: string;
  criterionName: string;
  criterionDesc: string;
  winnerIds: string[];
  winnerNames: string[];
  trophiesPerWinner: number;
}

function calculateSpBonusTrophies(players: Player[]): SpBonusTrophyResult[] {
  interface CriterionDef {
    id: string;
    name: string;
    desc: string;
    getCandidates: () => { id: string; name: string }[];
  }

  //Bonus trophies Trophy (sometimes referenced as criteria):
  const criteria: CriterionDef[] = [
    {
      id: 'MOMENT_MAGNET',
      name: 'Moment Magnet',
      desc: 'Most moment flags earned',
      getCandidates: () => {
        const max = Math.max(...players.map(p => p.eventDatabasePopups?.length || 0));
        if (max === 0) return [];
        return players.filter(p => (p.eventDatabasePopups?.length || 0) === max).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'PROTOCOL_KINGPIN',
      name: 'Protocol Kingpin',
      desc: 'Most protocol round wins',
      getCandidates: () => {
        const max = Math.max(...players.map(p => p.protocolWins?.length || 0));
        if (max === 0) return [];
        return players.filter(p => (p.protocolWins?.length || 0) === max).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'CLOCK_HOARDER',
      name: 'Clock Hoarder',
      desc: 'Most remaining time',
      getCandidates: () => {
        const max = Math.max(...players.map(p => p.remainingTime));
        if (max <= 0) return [];
        return players.filter(p => p.remainingTime === max).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'FLASH_CRASH',
      name: 'Flash Crash',
      desc: 'Earliest round eliminated',
      getCandidates: () => {
        return players.filter(p => p.isFirstEliminated).map(p => ({ id: p.id, name: p.name }));
      },
    },
    {
      id: 'MARKET_SNIPER',
      name: 'Market Sniper',
      desc: 'Shortest winning bid time',
      getCandidates: () => {
        const withWins = players.filter(p => p.shortestWinBidTime !== undefined && p.shortestWinBidTime > 0);
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
        // Award to one random non-eliminated bot
        const activeBots = players.filter(p => p.isBot && !p.isEliminated);
        if (activeBots.length > 0) {
          const chosen = activeBots[Math.floor(Math.random() * activeBots.length)];
          return [{ id: chosen.id, name: chosen.name }];
        }
        // Fall back to panic_bot driver players if no bots present
        const panicBotPlayers = players.filter(p => !p.isBot && !p.isEliminated && p.selectedDriver === 'panic_bot');
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

  return chosen.map(c => {
    const winners = c.getCandidates();
    return {
      criterion: c.id,
      criterionName: c.name,
      criterionDesc: c.desc,
      winnerIds: winners.map(w => w.id),
      winnerNames: winners.map(w => w.name),
      trophiesPerWinner: 1,
    };
  });
}

// Last Will picker sub-component (inline inside Game.tsx for closure access to cn)
function LastWillPickerInline({
  opponents,
  onConfirm,
  onCancel,
}: {
  opponents: { id: string; name: string; remainingTime: number; tokens: number }[];
  onConfirm: (targetId: string, curseType: 'time' | 'trophy') => void;
  onCancel: () => void;
}) {
  const [pickedTarget, setPickedTarget] = React.useState<string | null>(null);
  const [pickedCurse, setPickedCurse] = React.useState<'time' | 'trophy' | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-zinc-500 text-xs text-center">Choose target:</p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {opponents.map(opp => (
          <button
            key={opp.id}
            onClick={() => setPickedTarget(opp.id)}
            className={cn(
              'w-full py-1.5 px-3 rounded text-sm flex justify-between transition-colors',
              pickedTarget === opp.id
                ? 'bg-teal-900 text-teal-100 border border-teal-500/50'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
          >
            <span>{opp.name}</span>
            <span className="text-zinc-500 text-xs">{opp.remainingTime.toFixed(1)}s · {opp.tokens}🏆</span>
          </button>
        ))}
      </div>
      {pickedTarget && (
        <>
          <p className="text-zinc-500 text-xs text-center">Choose curse:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPickedCurse('time')}
              className={cn(
                'flex-1 py-2 rounded text-xs transition-colors',
                pickedCurse === 'time'
                  ? 'bg-red-900 text-red-200 border border-red-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              )}
            >
              💀 Lose 20s
            </button>
            <button
              onClick={() => setPickedCurse('trophy')}
              className={cn(
                'flex-1 py-2 rounded text-xs transition-colors',
                pickedCurse === 'trophy'
                  ? 'bg-yellow-900 text-yellow-200 border border-yellow-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              )}
            >
              🏆 Lose 1 Trophy
            </button>
          </div>
        </>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => pickedTarget && pickedCurse && onConfirm(pickedTarget, pickedCurse)}
          disabled={!pickedTarget || !pickedCurse}
          className="flex-1 py-2 rounded bg-teal-900 text-teal-100 text-sm font-bold hover:bg-teal-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Curse
        </button>
        <button onClick={onCancel} className="flex-1 py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Game() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // ── Player Profile / Cosmetics ──
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);

  // Load profile once on mount for authenticated users (non-blocking)
  useEffect(() => {
    if (!authUser) return;
    fetch('/api/player/profile', { credentials: 'include' })
      .then((r) => {
        if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return null;
        return r.json();
      })
      .then((d) => { if (d?.success) setPlayerProfile(d.profile); })
      .catch(() => {}); // silent – cosmetics are cosmetic-only
  }, [authUser?.id]);

  // Shortcut to the equipped cosmetics for the local player
  const myCosmetics: EquippedCosmetics | undefined = playerProfile?.equippedCosmetics;

  // ── Game State ──
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('CASUAL');
  const [variant, setVariant] = useState<GameVariant>('STANDARD');
  
  // Sound State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxLastPlayedAtRef = useRef<number>(0);
  const sfxBlockUntilRef = useRef<number>(0);
  const sfxInFlightRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.03; 
    
    // SFX is created per trigger so it can replay reliably

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  // Derived state for backward compatibility or simple logic
  const showDetails = difficulty === 'CASUAL';

  const [round, setRound] = useState(1);
  const [gameDuration, setGameDuration] = useState<GameDuration>('standard');
  const [currentTime, setCurrentTime] = useState(0.0); // The central auction clock
  const [singleplayerGameId, setSingleplayerGameId] = useState<string | null>(null);
  const singleplayerGameIdRef = useRef<string | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [protocolsEnabled, setProtocolsEnabled] = useState(true);
  const [bonusTrophiesEnabled, setBonusTrophiesEnabled] = useState(true);
  const [activeProtocol, setActiveProtocol] = useState<ProtocolType>(null);
  const [readyHoldTime, setReadyHoldTime] = useState(0);
  const [moleTarget, setMoleTarget] = useState<string | null>(null);
  const [peekTargetId, setPeekTargetId] = useState<string | null>(null); // New state for Sadman peek
  const [scrambledPlayers, setScrambledPlayers] = useState<string[]>([]); // New state for Wandering Eye scramble
  const [frostbyteAbilityUsed, setFrostbyteAbilityUsed] = useState(false); // Track Frostbyte single use
  const [showProtocolGuide, setShowProtocolGuide] = useState(false);
  const [showProtocolSelect, setShowProtocolSelect] = useState(false);

  // OVERCLOCK protocol state (singleplayer)
  const [overclockActive, setOverclockActive] = useState(false);
  const [overclockTimeLeft, setOverclockTimeLeft] = useState(10);
  const [overclockClickCounts, setOverclockClickCounts] = useState<Record<string, number>>({});

  // CALIBRATION protocol state (singleplayer)
  const [calibrationTarget, setCalibrationTarget] = useState<number | null>(null);

  const [expandedDriverCategoryId, setExpandedDriverCategoryId] = useState<string | null>(null);
  const [allowedProtocols, setAllowedProtocols] = useState<ProtocolType[]>([
        'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
        'OPEN_HAND', 'MUTE_PROTOCOL', 
        'NO_LOOK', 
        'THE_MOLE', 'PANIC_ROOM',
        'UNDERDOG_VICTORY', 'TIME_TAX', 'PRIVATE_CHANNEL',
        'OVERCLOCK', 'CALIBRATION'
  ]);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [abilitiesEnabled, setAbilitiesEnabled] = useState(false);
  const [playerAbilityUsed, setPlayerAbilityUsed] = useState(false);
  const [showPopupLibrary, setShowPopupLibrary] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [activeAbilities, setActiveAbilities] = useState<{ player: string, playerId: string, ability: string, effect: string, targetName?: string, targetId?: string, impactValue?: string, visibility?: string }[]>([]);
  
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<Player | null>(null);
  const [expandedDialogPortrait, setExpandedDialogPortrait] = useState<{ url: string; skin?: string | null } | null>(null);

  // Ghost ability state (Haunted mode)
  const [relicModalOpen, setRelicModalOpen] = useState(false);             // Relic activation modal open
  const [relicTargetPickRelicId, setRelicTargetPickRelicId] = useState<string | null>(null); // unused direct state, kept for clarity

  // Vote relic state (SP + MP)
  const [voteRelicState, setVoteRelicState] = useState<{
    relicId: string;
    activatorName: string;
    targetName?: string;
    options: { id: string; label: string }[];
    votes: Record<string, string>;   // playerId → optionId
    myVote?: string;
    timeLeft: number;
    resolved?: boolean;
    winnerLabel?: string;
    targetId?: string;
  } | null>(null);
  const voteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spVoteQueueRef = useRef<Array<{
    relicId: string;
    activatorName: string;
    targetName?: string;
    targetId?: string;
    options: { id: string; label: string }[];
    votes: Record<string, string>;
    timeLeft: number;
  }>>([]);
  // Ref to track when a bot in SP activates a vote relic (tribunal/conclave)
  // Bot tribunal/conclave now apply immediate random effects — no vote ref needed

  // Singleplayer snapshot recording - write-only to database
  const recordSingleplayerSnapshot = async (
    snapshotType: 'round_end' | 'elimination' | 'game_over',
    currentPlayers: Player[],
    roundNumber: number,
    winnerId?: string | null,
    winningBid?: number | null,
    eliminatedIds?: string[],
    triggeredProtocol?: string | null
  ) => {
    const gameId = singleplayerGameIdRef.current;
    if (!gameId || isMultiplayer) return;
    
    try {
      await fetch('/api/game/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          snapshotType,
          roundNumber,
          winnerPlayerId: winnerId || null,
          winningHoldTime: winningBid || null,
          minBidSeconds: gameDuration === 'short' ? 1.0 : gameDuration === 'long' ? 4.0 : 2.0,
          eliminatedPlayerIds: eliminatedIds || [],
          momentFlagsTriggered: [],
          protocolsTriggered: triggeredProtocol ? [triggeredProtocol] : [],
          limitBreaksTriggered: [],
          playerPositions: currentPlayers.map(p => ({
            playerId: p.id,
            tokens: p.tokens,
            remainingTime: p.remainingTime,
            isEliminated: p.isEliminated,
          })),
          lobbyCode: null,
          gameSettings: {
            difficulty,
            variant,
            gameDuration,
            protocolsEnabled,
            abilitiesEnabled,
          },
        }),
      });
    } catch (error) {
      console.error('[Snapshot] Failed to record singleplayer snapshot:', error);
    }
  };

  /**
   * Convert end-game trophies and moment flags to credits (server-side, idempotent).
   * Only call at game_end for the human player.
   */
  const convertGameCredits = useCallback(async (
    gameId: string,
    trophies: number,
    momentFlags: number,
    isWinner: boolean,
    gameVariant: string,
    isMP: boolean,
    momentFlagTypes?: string[],
    isCompetitive?: boolean,
  ) => {
    try {
      const variantMap: Record<string, string> = {
        STANDARD: 'STANDARD',
        SOCIAL_OVERDRIVE: 'SOCIAL_OVERDRIVE',
        BIO_FUEL: 'BIO_FUEL',
        HAUNTED: 'HAUNTED',
      };
      const mappedVariant = variantMap[gameVariant] || 'STANDARD';

      const res = await fetch('/api/player/convert-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameId,
          trophies,
          momentFlags,
          momentFlagTypes,
          isWinner,
          variant: mappedVariant,
          isMultiplayer: isMP,
          isCompetitive: isCompetitive ?? false,
        }),
      });
      const data = await res.json();
      if (data.success && !data.alreadyConverted) {
        setPlayerProfile(data.profile);
        if (data.creditsEarned > 0) {
          toast({
            title: `+${data.creditsEarned} Credits Earned!`,
            description: `${trophies} trophies × 100 + ${momentFlags} flags × 25`,
            duration: 5000,
          });
        }
        if (data.milestoneUnlocked?.length > 0) {
          toast({
            title: '🏆 Milestone Unlocked!',
            description: `New cosmetic(s) unlocked: ${data.milestoneUnlocked.join(', ')}`,
            duration: 7000,
          });
        }
      }
    } catch (_e) {
      // Silent – currency is cosmetic and shouldn't block UI
    }
  }, [toast]);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  
  // Helper to add overlay
  const addOverlay = (type: OverlayType, message: string, subMessage?: string, duration: number = 0) => {
      let createdId: string | null = null;

      // De-dupe identical overlays (prevents duplicate elimination popups across multiple code paths)
      setOverlays(prev => {
          const already = prev.some(o => o.type === type && (o.message || "") === (message || "") && (o.subMessage || "") === (subMessage || ""));
          if (already) return prev;

          const id = Math.random().toString(36).substring(7);
          createdId = id;
          return [...prev, { id, type, message, subMessage, duration }];
      });
      
      const MOMENT_FLAG_TYPES: OverlayType[] = [
          'fake_calm', 'genius_move', 'easy_w', 'time_out', 'deadlock_sync', 'last_one_standing',
          'comeback_hope', 'smug_confidence', 'zero_bid',
          'precision_strike', 'overkill', 'clutch_play', 'late_panic', 'mirror_match',
          'hidden_67', 'hidden_redline_reversal', 'hidden_deja_bid', 'hidden_patch_notes', 'hidden_redemption',
          'hidden_nail_in_the_coffin',
      ];
        if (soundEnabled && MOMENT_FLAG_TYPES.includes(type) && type !== 'hidden_patch_notes') {
          const now = Date.now();
          if (now >= sfxBlockUntilRef.current) {
              const pick = SFX_POOL[Math.floor(Math.random() * SFX_POOL.length)];

              const sound = new Audio(pick + `?t=${now}`);
              sound.volume = 0.02;
              sfxInFlightRef.current = sound;
              sound.play().catch(() => {});

              sfxLastPlayedAtRef.current = now;
              sfxBlockUntilRef.current = now + 4000;
          }
      }
      
      // Auto dismiss if desired (0 = manual dismiss)
      if (duration > 0) {
          setTimeout(() => {
              if (!createdId) return;
              setOverlays(prev => prev.filter(o => o.id !== createdId));
          }, duration);
      }
  };

  const removeOverlay = (id: string) => {
      setOverlays(prev => {
          const next = prev.filter(o => o.id !== id);

          // If the player is eliminated and they just dismissed the elimination overlay,
          // allow the game over screen to show.
          const p1 = players.find(p => p.id === 'p1');
        const dismissedWasElim = prev.find(o => o.id === id)?.type === 'time_out';
        const stillHasElimOverlay = next.some(o => o.type === 'time_out');

          if (p1?.isEliminated && dismissedWasElim && !stillHasElimOverlay) {
              setPhase('game_end');
          }

          return next;
      });
  };
  
  // Compatibility shim for existing code that uses setOverlay({ ... })
  // We'll replace usages of setOverlay with addOverlay or clearOverlays
  const setOverlay = (data: { type: OverlayType, message?: string, subMessage?: string } | null) => {
      if (data === null) {
          setOverlays([]); // Clear all
      } else {
          addOverlay(data.type, data.message || "", data.subMessage);
      }
  };

  // Animation State
  const [animations, setAnimations] = useState<{ id: string; playerId: string; type: AnimationType; value?: string }[]>([]);

  const triggerAnimation = (playerId: string, type: AnimationType, value?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAnimations(prev => [...prev, { id, playerId, type, value }]);
  };

  const removeAnimation = (id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  };

  // Sync Protocols with Variant - add mode-specific protocols when variant changes
  useEffect(() => {
    if (variant === 'SOCIAL_OVERDRIVE') {
        setProtocolsEnabled(true);
        setAllowedProtocols(prev => {
            const socialProtocols: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'];
            const bioProtocols: ProtocolType[] = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
            const withoutBio = prev.filter(p => !bioProtocols.includes(p));
            const toAdd = socialProtocols.filter(p => !withoutBio.includes(p));
            return [...withoutBio, ...toAdd];
        });
    } else if (variant === 'BIO_FUEL') {
        setProtocolsEnabled(true);
        setAllowedProtocols(prev => {
            const socialProtocols: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'];
            const bioProtocols: ProtocolType[] = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
            const withoutSocial = prev.filter(p => !socialProtocols.includes(p));
            const toAdd = bioProtocols.filter(p => !withoutSocial.includes(p));
            return [...withoutSocial, ...toAdd];
        });
    } else {
        setAllowedProtocols(prev => {
            const modeSpecific: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL', 'HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
            return prev.filter(p => !modeSpecific.includes(p));
        });
    }
  }, [variant]);


  const toggleDifficulty = () => {
      setDifficulty(prev => prev === 'COMPETITIVE' ? 'CASUAL' : 'COMPETITIVE');
  };

  const toggleVariant = () => {
    setVariant(prev => {
      if (prev === 'STANDARD') return 'SOCIAL_OVERDRIVE';
      if (prev === 'SOCIAL_OVERDRIVE') return 'BIO_FUEL';
      if (prev === 'BIO_FUEL') return 'HAUNTED';
      return 'STANDARD';
    });
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'STANDARD': return <Shield size={12} />;
      case 'SOCIAL_OVERDRIVE': return <PartyPopper size={12} />;
      case 'BIO_FUEL': return <Martini size={12} />;
      case 'HAUNTED': return <Skull size={12} />;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'STANDARD': return "text-zinc-400";
      case 'SOCIAL_OVERDRIVE': return "text-purple-400";
      case 'BIO_FUEL': return "text-orange-400";
      case 'HAUNTED': return "text-teal-400";
    }
  };
  
  // ... (Rest of component)

  // Derived Constants based on Duration
  const getTotalRounds = () => {
     if (gameDuration === 'long') return LONG_TOTAL_ROUNDS;
     if (gameDuration === 'short') return SHORT_TOTAL_ROUNDS;
     return STANDARD_TOTAL_ROUNDS;
  };

  const getInitialTime = () => {
     if (gameDuration === 'long') return LONG_INITIAL_TIME;
     if (gameDuration === 'short') return SHORT_INITIAL_TIME;
     return STANDARD_INITIAL_TIME;
  };

  const totalRounds = getTotalRounds();
  const initialTime = getInitialTime();
  
  // Check if double tokens active for UI
  const isDoubleTokens = activeProtocol === 'DOUBLE_STAKES' || activeProtocol === 'PANIC_ROOM';

  // Overlay State
  // REMOVED: Replaced by overlays array above
  
  const ALL_PERSONALITIES: BotPersonality[] = ['aggressive', 'conservative', 'random', 'balanced', 'adaptive', 'psychological'];
  const BOT_NAMES_SP = ['Alpha', 'Beta', 'Gamma'];
  const PERSONALITY_LABELS: Record<BotPersonality, string> = {
    aggressive: 'Aggr', conservative: 'Cons', random: 'Rand',
    balanced: 'Bal', adaptive: 'Adpt', psychological: 'Psych'
  };
  
  const createRandomBots = (time: number): Player[] => {
    const shuffled = [...ALL_PERSONALITIES].sort(() => Math.random() - 0.5);
    return BOT_NAMES_SP.map((name, i) => ({
      id: `b${i + 1}`, name: `${name} (${PERSONALITY_LABELS[shuffled[i]]})`, isBot: true, tokens: 0,
      remainingTime: time, isEliminated: false, currentBid: null, isHolding: false,
      personality: shuffled[i] as BotPersonality,
      totalTimeBid: 0, netImpact: 0, specialEvents: [], eventDatabasePopups: [],
      protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
    }));
  };

  // Players State
  const [players, setPlayers] = useState<Player[]>([
    { 
        id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false,
        totalTimeBid: 0, netImpact: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0 
    },
    ...createRandomBots(STANDARD_INITIAL_TIME),
  ]);

  // Update players when duration changes (only during intro)
  useEffect(() => {
    if (phase === 'intro') {
       const newInitialTime = getInitialTime();
       setPlayers(prev => prev.map(p => ({ ...p, remainingTime: newInitialTime })));
    }
  }, [gameDuration, phase]);

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const [roundWinner, setRoundWinner] = useState<{ name: string; time: number } | null>(null);
  const [roundLog, setRoundLog] = useState<string[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false); // For game log filtering

  // Refs for loop management
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const readyStartTimeRef = useRef<number | null>(null);
  const overLimitToastShownRef = useRef(false);

  // Multiplayer State
  const [lobbyCode, setLobbyCode] = useState("");
  const [playerName, setPlayerName] = useState("Player");
  const [currentLobby, setCurrentLobby] = useState<{
    code: string;
    players: Array<{
      id: string;
      socketId: string;
      name: string;
      isHost: boolean;
      isReady: boolean;
      selectedDriver?: string;
    }>;
    hostSocketId: string;
    status: 'waiting' | 'starting' | 'in_game';
    settings?: {
      difficulty: 'CASUAL' | 'COMPETITIVE';
      protocolsEnabled: boolean;
      bonusTrophiesEnabled: boolean;
      abilitiesEnabled: boolean;
      variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';
      gameDuration: 'sprint' | 'standard' | 'long' | 'short';
    };
    maxPlayers: number;
    isPublic?: boolean;
  } | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [isPublicLobby, setIsPublicLobby] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerGameState, setMultiplayerGameState] = useState<{
    round: number;
    totalRounds: number;
    phase: 'driver_selection' | 'waiting_for_ready' | 'countdown' | 'bidding' | 'overclock' | 'round_end' | 'game_over';
    countdownRemaining: number;
    elapsedTime: number;
    gameId?: string;
    players: Array<{
      id: string;
      socketId: string | null;
      name: string;
      selectedDriver?: string;
      driverConfirmed?: boolean;
      isBot: boolean;
      tokens: number;
      remainingTime: number;
      isEliminated: boolean;
      isGhost?: boolean;
      ghostImage?: string;
      ghostAbility?: string;
      selectedItem?: string;
      relicConsumed?: boolean;
      patternLockMinBid?: number | null;
      markedBy?: string | null;
      deathWishActive?: boolean;
      bloodPactActive?: boolean;
      cursedDiceActive?: boolean;
      pendingLastWill?: { targetId: string; curseType: 'time' | 'trophy' } | null;
      corruptRoundsLeft?: number | null;
      finalWritActive?: boolean;
      ghostTimeAtDeath?: number | null;
      currentBid: number | null;
      isHolding: boolean;
      totalTimeBid: number;
      abilityUsed: boolean;
      momentFlagsEarned?: string[];
      roundImpact?: { type: string; value: number; source: string };
    }>;
    roundWinner: { id: string; name: string; bid: number } | null;
    eliminatedThisRound: string[];
    settings: {
      difficulty: 'CASUAL' | 'COMPETITIVE';
      protocolsEnabled: boolean;
      bonusTrophiesEnabled: boolean;
      abilitiesEnabled: boolean;
      variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';
      gameDuration?: 'sprint' | 'standard' | 'long' | 'short';
    };
    activeProtocol: string | null;
    protocolHistory: string[];
    gameLog: Array<{
      round: number;
      type: string;
      playerId?: string;
      playerName?: string;
      message: string;
      value?: number;
      timestamp: number;
      basic?: boolean;
    }>;
    isDoubleTokensRound: boolean;
    molePlayerId: string | null;
    allHumansHoldingStartTime: number | null;
    gameDuration: 'short' | 'standard' | 'long';
    minBid: number;
    pendingVote?: {
      relicId: string;
      activatorId: string;
      targetId?: string;
      options: { id: string; label: string }[];
      votes: Record<string, string>;
      deadline: number;
      resolved?: boolean;
    } | null;
    protocolsAlwaysOn?: boolean;
    overclockClickCounts?: Record<string, number>;
    calibrationTargetSeconds?: number | null;
  } | null>(null);
  
  // Socket connection
  const { socket, isConnected } = useSocket();
  const autoJoinAttemptedRef = useRef(false);

  // Auto-join from URL ?join= parameter
  useEffect(() => {
    if (autoJoinAttemptedRef.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (!joinCode) return;
    
    autoJoinAttemptedRef.current = true;
    
    const url = new URL(window.location.href);
    url.searchParams.delete('join');
    window.history.replaceState({}, '', url.pathname);
    
    const upperCode = joinCode.toUpperCase();
    setLobbyCode(upperCode);
    setPhase('multiplayer_lobby');
    
    const storedIdentity = localStorage.getItem(`redline_player_${upperCode}`);
    if (storedIdentity) {
      try {
        const parsed = JSON.parse(storedIdentity);
        if (parsed.playerName && parsed.playerName !== 'Player') {
          setPlayerName(parsed.playerName);
        }
      } catch {}
    }
  }, []);

  // Helper for formatting time
  const formatTime = (seconds: number) => {
    const rounded = Math.round(seconds * 10) / 10;
    const m = Math.floor(rounded / 60);
    const s = Math.floor(rounded % 60);
    const ms = Math.round((rounded % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Auto-rejoin on socket reconnect
  useEffect(() => {
    if (!socket) return;
    
    const handleReconnect = () => {
      if (!lobbyCode) return;
      const storedIdentity = localStorage.getItem(`redline_player_${lobbyCode.toUpperCase()}`);
      if (!storedIdentity) return;
      
      try {
        const parsed = JSON.parse(storedIdentity);
        const storedName = parsed.playerName;
        if (!storedName) return;
        
        console.log('[Socket.IO] Attempting auto-rejoin after reconnect:', lobbyCode, storedName);
        
        socket.emit("rejoin_game", { code: lobbyCode, playerName: storedName }, (response: { success: boolean; lobby?: typeof currentLobby; error?: string }) => {
          if (response.success && response.lobby) {
            console.log('[Socket.IO] Auto-rejoin successful');
            setCurrentLobby(response.lobby);
            setIsMultiplayer(true);
          } else {
            socket.emit("join_lobby", { code: lobbyCode, playerName: storedName }, (joinResponse: { success: boolean; lobby?: typeof currentLobby; error?: string }) => {
              if (joinResponse.success && joinResponse.lobby) {
                console.log('[Socket.IO] Re-joined lobby after reconnect');
                setCurrentLobby(joinResponse.lobby);
              }
            });
          }
        });
      } catch {}
    };
    
    window.addEventListener('socket_reconnected', handleReconnect);
    return () => window.removeEventListener('socket_reconnected', handleReconnect);
  }, [socket, lobbyCode]);
  
  // Socket event listeners for lobby and game
  useEffect(() => {
    if (!socket) return;

    const handleLobbyUpdate = (lobbyData: typeof currentLobby) => {
      console.log('[Lobby] Update received:', lobbyData);
      setCurrentLobby(lobbyData);
    };

    const handleGameStarted = (data: { lobbyCode: string; players: any[]; totalRounds: number; initialTime: number }) => {
      console.log('[Game] Started:', data);
      setIsMultiplayer(true);
      eliminationPopupShownRef.current = false; // Reset elimination popup tracking for new games
      lastRoundEndProcessedRef.current = 0; // Reset round processing for new games
      redemptionShownCountRef.current = 0; // Reset redemption counter for new games
      nailInCoffinShownCountRef.current = 0; // Reset nail in coffin counter for new games
      bonusTrophiesAwardedRef.current = false; // Reset bonus trophy tracking for new games
      // Don't set phase here - let the server game_state dictate the phase
      // The server starts in 'waiting_for_ready' phase
    };

    const handleGameState = (state: typeof multiplayerGameState) => {
      console.log('[Game] State update:', state?.phase, 'Round:', state?.round);

      // MP revival detection: notify p1 if they just transitioned from ghost → alive
      if (state && socket) {
        const prev = prevMpPlayersRef.current;
        const myPlayer = state.players.find((p: any) => p.socketId === socket.id);
        if (myPlayer) {
          const prevMe = prev.find((p: any) => p.id === myPlayer.id);
          if (prevMe && prevMe.isGhost && !(myPlayer as any).isGhost && !(myPlayer as any).isEliminated) {
            const reviveTime = ((myPlayer as any).remainingTime ?? 0).toFixed(1);
            addOverlay('ability_trigger', '🔄 REVIVED', `You have been revived with ${reviveTime}s!`, 0);
          }
        }
        prevMpPlayersRef.current = state.players as any[];
      }

      setMultiplayerGameState(state);
      
      // Sync phase with server state for multiplayer
      if (state) {
        // Sync settings from server
        if (state.settings) {
          setVariant(state.settings.variant);
          setDifficulty(state.settings.difficulty);
          setProtocolsEnabled(state.settings.protocolsEnabled);
          setBonusTrophiesEnabled(state.settings.bonusTrophiesEnabled ?? true);
          setAbilitiesEnabled(state.settings.abilitiesEnabled);
        }
        
        // Sync active protocol from server
        if (state.activeProtocol) {
          setActiveProtocol(state.activeProtocol as ProtocolType);
        } else {
          setActiveProtocol(null);
        }
        
        // Sync mole assignment from server
        if (state.molePlayerId) {
          setMoleTarget(state.molePlayerId);
        } else {
          setMoleTarget(null);
        }
        
        // Sync selectedCharacter from MP state (needed for peek abilities, fire wall, etc.)
        if (socket) {
          const myPlayer = state.players.find(p => p.socketId === socket.id);
          const myDriverId = (myPlayer as any)?.selectedDriver;
          if (myDriverId && (!selectedCharacter || selectedCharacter.id !== myDriverId)) {
            const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
            const char = allChars.find(c => c.id === myDriverId);
            if (char) setSelectedCharacter(char);
          }
        }

        // Sync MP pendingVote — show vote UI to all players
        if ((state as any).pendingVote && !(state as any).pendingVote.resolved) {
          const pv = (state as any).pendingVote;
          const activatorPlayer = state.players.find((p: any) => p.id === pv.activatorId);
          const targetPlayer = pv.targetId ? state.players.find((p: any) => p.id === pv.targetId) : undefined;
          const currentTimeLeft = Math.max(0, Math.floor((pv.deadline - Date.now()) / 1000));
          setVoteRelicState(prev => {
            // Update votes and timeLeft; preserve myVote if already cast for this same vote
            if (prev && !prev.resolved && prev.relicId === pv.relicId) return { ...prev, votes: pv.votes, timeLeft: currentTimeLeft };
            return {
              relicId: pv.relicId,
              activatorName: activatorPlayer?.name ?? 'Player',
              targetName: targetPlayer?.name,
              options: pv.options,
              votes: pv.votes,
              timeLeft: currentTimeLeft,
            };
          });
        } else if ((state as any).pendingVote?.resolved) {
          // Resolved — let vote_relic_resolved handler show result
        }
        
        if (state.phase === 'driver_selection') {
          setPhase('mp_driver_select');
        } else if (state.phase === 'waiting_for_ready') {
          // In Haunted mode, check if player's item was already selected; if not, go to item select
          const myMpPlayer = socket ? state.players.find((p: any) => p.socketId === socket.id) : null;
          if (variant === 'HAUNTED' && myMpPlayer && !(myMpPlayer as any).selectedItem) {
            // Only show item select if we haven't done it yet
            if (phase !== 'haunted_item_select' && phase !== 'ready') {
              setPhase('ready'); // Just go to ready for now; item select was done after driver confirm
            } else {
              setPhase('ready');
            }
          } else {
            setPhase('ready');
          }
        } else if (state.phase === 'countdown') {
          setPhase('countdown');
          setCountdown(state.countdownRemaining);
        } else if (state.phase === 'bidding') {
          setPhase('bidding');
        } else if (state.phase === 'overclock') {
          setPhase('overclock');
        } else if (state.phase === 'round_end') {
          setPhase('round_end');
          if (state.roundWinner) {
            setRoundWinner({ name: state.roundWinner.name, time: state.roundWinner.bid });
          }
        } else if (state.phase === 'game_over') {
          setPhase('game_end');
          // ── MP end-game credit conversion ──
          // state.players contains final standings; find the local player's socket id
          const mySocketId = socket?.id;
          const myFinalPlayer = state.players?.find((mp: any) => mp.socketId === mySocketId);
          if (myFinalPlayer && state.gameId) {
            const winner = [...(state.players || [])].sort((a: any, b: any) =>
              b.tokens !== a.tokens ? b.tokens - a.tokens : b.remainingTime - a.remainingTime
            )[0];
            const isWinner = winner?.socketId === mySocketId;
            convertGameCredits(
              state.gameId,
              myFinalPlayer?.tokens || 0,
              myFinalPlayer?.momentFlagsEarned?.length || 0,
              isWinner,
              state.settings?.variant || 'STANDARD',
              true,
              myFinalPlayer?.momentFlagsEarned || [],
              state.settings?.difficulty === 'COMPETITIVE',
            );
          }
        }
        setRound(state.round);
      }
    };

    const handleRealityModeAbility = (data: {
      driverName: string;
      driverId: string;
      abilityName: string;
      description: string;
      type: 'social' | 'bio';
      targetId: string | null;
      targetName: string | null;
      visibility: string;
    }) => {
      const overlayType: OverlayType = data.type === 'bio' ? 'bio_event' : 'social_event';
      const title = `${data.driverName}: ${data.abilityName}`;
      addOverlay(overlayType, title, data.description, 0);
    };

    const handleProtocolDetail = (data: {
      protocol: string;
      msg: string;
      sub: string;
      targetPlayerId: string | null;
      targetPlayerId2?: string | null;
    }) => {
      const SOCIAL_SET = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON'];
      const BIO_SET = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
      
      if (data.protocol === 'THE_MOLE' && data.targetPlayerId) {
        setMoleTarget(data.targetPlayerId);
      }
      
      if (!data.msg || data.msg === '') return;
      
      if (SOCIAL_SET.includes(data.protocol)) {
        addOverlay("social_event", data.msg, data.sub);
      } else if (BIO_SET.includes(data.protocol)) {
        addOverlay("bio_event", data.msg, data.sub);
      } else {
        addOverlay("protocol_alert", data.msg, data.sub);
      }
    };

    const handleProtocolReveal = (data: {
      protocol: string;
      msg: string;
      sub: string;
    }) => {
      setTimeout(() => {
        const SOCIAL_PROTOCOL_SET = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'];
        const overlayType = SOCIAL_PROTOCOL_SET.includes(data.protocol) ? "social_event" : "protocol_alert";
        addOverlay(overlayType, data.msg, data.sub);
      }, 1500);
    };

    const handleBonusTrophyAward = (data: {
      results: {
        criterion: string;
        criterionName: string;
        criterionDesc: string;
        winners: { id: string; name: string }[];
        trophiesPerWinner: number;
      }[];
    }) => {
      if (bonusTrophiesAwardedRef.current) return;
      bonusTrophiesAwardedRef.current = true;
      data.results.forEach(bonusResult => {
        const winnerNames = bonusResult.winners.map(w => w.name).join(' & ');
        const subMsg = `${winnerNames} +${bonusResult.trophiesPerWinner} 🏆\n${bonusResult.criterionDesc}`;
        addOverlay("bonus_trophy", bonusResult.criterionName, subMsg, 0);
      });
    };

    const handleVoteRelicResolved = (data: { relicId: string; winnerId: string; winnerLabel: string; tally: Record<string, number> }) => {
      // Show the vote result overlay
      setVoteRelicState(prev => prev ? { ...prev, resolved: true, winnerLabel: data.winnerLabel } : {
        relicId: data.relicId,
        activatorName: '',
        options: [],
        votes: {},
        timeLeft: 0,
        resolved: true,
        winnerLabel: data.winnerLabel,
      });
      // Also show an overlay notification for the vote result
      const label = data.relicId === 'tribunal' ? '⚖️ TRIBUNAL RESOLVED' : '🗳️ CONCLAVE RESOLVED';
      addOverlay('ability_trigger', label, `Vote result: ${data.winnerLabel}`, 0);
    };

    const handleRelicBroadcast = (data: { title: string; message: string; victimId?: string }) => {
      // Show a broadcast overlay for relic activations visible to all players
      addOverlay('ability_trigger', data.title, data.message, 0);
    };

    const handleRelicPrivate = (data: { socketId: string; title: string; message: string }) => {
      // Show a private overlay only to the intended recipient (matched by socket ID)
      if (data.socketId === socket.id) {
        addOverlay('haunted_relic', data.title, data.message, 0);
      }
    };

    socket.on('lobby_update', handleLobbyUpdate);
    socket.on('game_started', handleGameStarted);
    socket.on('game_state', handleGameState);
    socket.on('reality_mode_ability', handleRealityModeAbility);
    socket.on('protocol_detail', handleProtocolDetail);
    socket.on('protocol_reveal', handleProtocolReveal);
    socket.on('bonus_trophy_award', handleBonusTrophyAward);
    socket.on('vote_relic_resolved', handleVoteRelicResolved);
    socket.on('relic_broadcast', handleRelicBroadcast);
    socket.on('relic_private', handleRelicPrivate);

    return () => {
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('game_started', handleGameStarted);
      socket.off('game_state', handleGameState);
      socket.off('reality_mode_ability', handleRealityModeAbility);
      socket.off('protocol_detail', handleProtocolDetail);
      socket.off('protocol_reveal', handleProtocolReveal);
      socket.off('bonus_trophy_award', handleBonusTrophyAward);
      socket.off('vote_relic_resolved', handleVoteRelicResolved);
      socket.off('relic_broadcast', handleRelicBroadcast);
      socket.off('relic_private', handleRelicPrivate);
    };
  }, [socket]);

  // Handle Music Playback based on Phase
  useEffect(() => {
    if (!audioRef.current) return;

    if (!soundEnabled) {
      audioRef.current.pause();
      audioRef.current.muted = true;
      return;
    }

    audioRef.current.muted = false;

    // Lobby loop music (random pick)
    if (phase === 'multiplayer_lobby') {
      const track = LOBBY_TRACKS.length > 0
        ? LOBBY_TRACKS[Math.floor(Math.random() * LOBBY_TRACKS.length)]
        : null;

      if (track) {
        if (audioRef.current.src !== window.location.origin + track) {
          audioRef.current.src = track;
        }
        audioRef.current.loop = true;
        audioRef.current.volume = 0.05; 
        audioRef.current.play().catch(() => console.log('Audio play blocked'));
      } else {
        audioRef.current.pause();
      }
      return;
    }

    // Character select loop music (single player or multiplayer driver selection)
    // Must stop lobby music and switch to character select music
    if (phase === 'character_select' || (isMultiplayer && multiplayerGameState?.phase === 'driver_selection')) {
      const currentSrc = audioRef.current.src;
      const isPlayingLobbyMusic = LOBBY_TRACKS.some(t => currentSrc.includes(t));
      const isPlayingCharSelectMusic = MUSIC_TRACKS.some(t => currentSrc.includes(t));
      
      // Switch from lobby music OR start fresh if paused
      if (isPlayingLobbyMusic || audioRef.current.paused || !isPlayingCharSelectMusic) {
        const track = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];
        audioRef.current.src = track;
        audioRef.current.loop = true;
        audioRef.current.volume = 0.05; 
        audioRef.current.play().catch(() => console.log('Audio play blocked'));
      }
      return;
    }

    audioRef.current.pause();
  }, [phase, soundEnabled, isMultiplayer, multiplayerGameState?.phase]);

  // (Protocol popup handled by single useEffect below in countdown phase)

  // Multiplayer Moment Flags - trigger when round ends
  const lastRoundEndProcessedRef = useRef<number>(0);
  const eliminationPopupShownRef = useRef<boolean>(false); // Track if elimination popup already shown
  const dejaBidShownRef = useRef<boolean>(false); // DEJA BID only fires once per game session
  const p1PrevRoundStartTokensRef = useRef<number | null>(null); // SP: track p1 tokens at start of previous round
  const redemptionShownCountRef = useRef<number>(0); // MP: track how many times HIDDEN_REDEMPTION has been shown
  const nailInCoffinShownCountRef = useRef<number>(0); // MP: track how many times HIDDEN_NAIL_IN_THE_COFFIN has been shown
  const bonusTrophiesAwardedRef = useRef<boolean>(false); // MP: prevent bonus trophy overlays from showing more than once per game
  const prevMpPlayersRef = useRef<any[]>([]); // MP: track previous player states for revival detection
  useEffect(() => {
    if (!isMultiplayer || !multiplayerGameState || !socket) return;
    
    // Only trigger on round_end phase
    if (multiplayerGameState.phase !== 'round_end') return;
    
    // Prevent duplicate triggers for same round - only update ref after processing
    if (lastRoundEndProcessedRef.current === multiplayerGameState.round) return;
    
    // Find current player
    const currentPlayer = multiplayerGameState.players.find(p => p.socketId === socket.id);
    const currentPlayerId = currentPlayer?.id;
    
    // Check if current player was eliminated this round - show eliminated flag ONLY ONCE
    // Don't show if elimination popup was already shown (player was eliminated in a previous round)
    if (currentPlayerId && multiplayerGameState.eliminatedThisRound?.includes(currentPlayerId) && !eliminationPopupShownRef.current) {
      // Mark as shown first to prevent duplicates
      eliminationPopupShownRef.current = true;
      
      // Show eliminated moment flag for this player
      const mpVariant = multiplayerGameState.settings?.variant;
      if (mpVariant === 'BIO_FUEL') {
        addOverlay("bio_event", "ELIMINATED! CONSUME BIO-FUEL.", "Out of time!");
      } else {
        addOverlay("time_out", "PLAYER ELIMINATED", "Out of time!");
      }
      // ELIMINATED counts as 1 moment flag (server tracks it in momentFlagsEarned).
      // Win-based moment flags are not applicable when eliminated.
      // Mark as processed and return.
      lastRoundEndProcessedRef.current = multiplayerGameState.round;
      return;
    }
    
    // If player is already eliminated, just mark as processed and skip moment flags
    if (currentPlayer?.isEliminated) {
      lastRoundEndProcessedRef.current = multiplayerGameState.round;
      return;
    }
    
    const winner = multiplayerGameState.roundWinner;
    
    // Check if current player won
    const isCurrentPlayerWinner = winner?.id === currentPlayerId;
    const players = multiplayerGameState.players;

    // DEADLOCK_SYNC and AFK - fire for all players when there is no winner
    if (!winner && multiplayerGameState.phase === 'round_end') {
      const validBidders = [...players]
        .filter(p => !p.isEliminated && p.currentBid !== null && p.currentBid > 0)
        .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));

      if (validBidders.length >= 2) {
        const topBid = validBidders[0].currentBid || 0;
        const tied = validBidders.filter(p => Math.round((p.currentBid || 0) * 10) / 10 === Math.round(topBid * 10) / 10);
        if (tied.length >= 2 && tied.some(p => p.id === currentPlayerId)) {
          sfxBlockUntilRef.current = 0; // Reset SFX blocking timer so deadlock sound plays immediately
          addOverlay("deadlock_sync", "DEADLOCK SYNC", "Exact time match! No winner.");
        }
      } else if (validBidders.length === 0) {
        addOverlay("zero_bid", "AFK", "No one dared to bid!");
      }
    }

    // MIRROR_MATCH: 2+ non-eliminated players end the round with time banks within 0.1s.
    // This is intentionally placed before the `!winner` early return so it fires on deadlock
    // rounds too. DEADLOCK_SYNC (same bid → no winner) and MIRROR_MATCH (same post-round bank)
    // are distinct flags and correctly co-fire — e.g. Round 1 deadlock or back-to-back deadlocks.
    // Stats for all involved players are tracked server-side; the overlay fires for everyone here.
    {
      const survivors = players.filter(p => !p.isEliminated && p.remainingTime > 0);
      let mirrorMatchFound = false;
      for (let i = 0; i < survivors.length && !mirrorMatchFound; i++) {
        for (let j = i + 1; j < survivors.length && !mirrorMatchFound; j++) {
          if (Math.abs(survivors[i].remainingTime - survivors[j].remainingTime) <= 0.1) {
            mirrorMatchFound = true;
          }
        }
      }
      if (mirrorMatchFound) {
        setTimeout(() => addOverlay('mirror_match', 'MIRROR MATCH', 'Two players ended with matching time banks!'), 1500);
      }
    }
    
    lastRoundEndProcessedRef.current = multiplayerGameState.round;
    if (!winner) return;

    
    // Hidden 67: check BEFORE early return so non-winners can trigger it
    players.forEach(p => {
      const bid = (p.currentBid || 0);
        if (bid >= 67.0 && bid < 68.0) {
        if (p.id === currentPlayerId) {
          setTimeout(() => addOverlay('hidden_67', '67', `You hit 67.`, 0), 1000);
        }
      }
    });

    // Trigger moment flags for current player
    let momentCount = 0;
    const winnerBid = winner.bid;

    
    
    // Get player data
    const winnerPlayer = players.find(p => p.id === winner.id);
    
    // Find second place bid
    const sortedByBid = [...players]
      .filter(p => !p.isEliminated && p.currentBid !== null)
      .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    const secondBid = sortedByBid.length > 1 ? sortedByBid[1].currentBid || 0 : 0;
    const margin = winnerBid - secondBid;
    
    // 1. Smug Confidence (Round 1 Win)
    if (multiplayerGameState.round === 1 && isCurrentPlayerWinner) {
      addOverlay("smug_confidence", "SMUG CONFIDENCE", `${winner.name} starts strong!`);
      momentCount++;
    }
    
    // 2. Fake Calm (Margin >= 15s)
    if (sortedByBid.length > 1 && margin >= 15 && isCurrentPlayerWinner) {
      setTimeout(() => addOverlay("fake_calm", "FAKE CALM", `Won by ${margin.toFixed(1)}s!`), 500);
      momentCount++;
    }
    
    // 3. Genius Move (Margin <= 5s)
      if (sortedByBid.length > 1 && margin <= 5 && margin > 0 && isCurrentPlayerWinner) {
      setTimeout(() => addOverlay("genius_move", "GENIUS MOVE", `Won by just ${margin.toFixed(1)}s`), 500);
      momentCount++;
    }
    
    // 4. Easy W (Bid < 20s)
      if (winnerBid < 20 && isCurrentPlayerWinner) {
      setTimeout(() => addOverlay("easy_w", "EASY W", `Won with only ${winnerBid.toFixed(1)}s`), 1000);
      momentCount++;
    }
    
    // 5. Overkill (Bid > 60s)
      if (winnerBid > 60 && isCurrentPlayerWinner) {
      setTimeout(() => addOverlay("overkill", "OVERKILL", "Massive bid!"), 1500);
      momentCount++;
    }
    
    // 6. Clutch Play (Low remaining time)
      if (winnerPlayer && winnerPlayer.remainingTime < 10 && isCurrentPlayerWinner) {
      setTimeout(() => addOverlay("clutch_play", "CLUTCH PLAY", "Almost out of time!"), 1500);
      momentCount++;
    }
    
        // Client MP Precision Strike (Exact second bid)
              if (winnerBid > 0 && isCurrentPlayerWinner) {
                const adjustedBid = winnerBid;
                const isExactSecond = (Math.round(adjustedBid * 10) / 10) % 1 === 0;
              if (isExactSecond) {
            setTimeout(() => addOverlay("precision_strike", "PRECISION STRIKE", "Exact second bid!"), 1500);
            momentCount++;
          }
        }
    
    // 8. Comeback Hope - match SP logic: must be sole minimum token holder BEFORE winning
    const winnerStats = players.find(p => p.id === winner.id);
    if (winnerStats) {
      // Server already awarded tokens, so subtract to get pre-win count
      const isDoubleRound = multiplayerGameState.activeProtocol === 'DOUBLE_STAKES' || multiplayerGameState.activeProtocol === 'PANIC_ROOM';
      const tokensAwarded = isDoubleRound ? 2 : 1;
      const winnerTokensBefore = winnerStats.tokens - tokensAwarded;
      const allTokensBefore = players.map(p => p.id === winner.id ? winnerTokensBefore : p.tokens);
      const minTokens = Math.min(...allTokensBefore);
      const playersAtMin = allTokensBefore.filter(t => t === minTokens);
      const someoneHadMore = allTokensBefore.some(t => t > winnerTokensBefore);
      
        if (winnerTokensBefore === minTokens && playersAtMin.length === 1 && someoneHadMore && isCurrentPlayerWinner && winnerTokensBefore >= 0) {
        setTimeout(() => addOverlay("comeback_hope", "COMEBACK HOPE", `${winner.name} stays in the fight!`), 1000);
        momentCount++;
      }
    }
    
    // 9. Last One Standing (Won final round with eliminations)
    const mpDuration = multiplayerGameState.settings?.gameDuration;
    const totalRoundsForMp = (mpDuration === 'short' || mpDuration === 'sprint') ? 9 
      : mpDuration === 'long' ? 18 : 9;
      if (multiplayerGameState.round === totalRoundsForMp && multiplayerGameState.eliminatedThisRound?.length > 0 && isCurrentPlayerWinner) {
      setTimeout(() => addOverlay("last_one_standing", "LAST ONE STANDING", `Survivor Victory!`), 2000);
      momentCount++;
    }

    //MP Redline Reversal: only applies when current player is the winner
      if (multiplayerGameState.round === totalRoundsForMp && isCurrentPlayerWinner) {
        const isDoubleRound = multiplayerGameState.activeProtocol === 'DOUBLE_STAKES' || multiplayerGameState.activeProtocol === 'PANIC_ROOM';
        let tokensAwarded = isDoubleRound ? 2 : 1;

        // Account for CLICK_CLICK ability bonus (limit break)
        const currentPlayerData = players.find(p => p.id === currentPlayerId);
        if (currentPlayerData?.selectedDriver === 'click_click') {
          const sortedForAbility = [...players]
            .filter(p => p.currentBid !== null && !p.isEliminated)
            .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
          const topBid = sortedForAbility[0]?.currentBid || 0;
          const secondBid = sortedForAbility[1]?.currentBid || 0;
          const margin = topBid - secondBid;
          if (sortedForAbility.length >= 2 && margin <= 1.1 && margin > 0) {
            tokensAwarded += 1;
          }
        }
        const playersBeforeTokens = players.map(p => ({
            ...p,
            tokens: p.id === currentPlayerId ? p.tokens - tokensAwarded : p.tokens
        }));
        const sortedBefore = [...playersBeforeTokens].sort((a, b) => {
            if (b.tokens !== a.tokens) return b.tokens - a.tokens;
            return b.remainingTime - a.remainingTime;
        });
        const rankBefore = sortedBefore.findIndex(p => p.id === currentPlayerId);
        const firstTokens = sortedBefore[0]?.tokens;
        const secondTokens = sortedBefore[1]?.tokens;
        const wasInSecond = rankBefore === 1 && firstTokens !== secondTokens;

        const sortedAfter = [...players].sort((a, b) => {
            if (b.tokens !== a.tokens) return b.tokens - a.tokens;
            return b.remainingTime - a.remainingTime;
        });
        const isNowFirst = sortedAfter[0]?.id === currentPlayerId;

        if (wasInSecond && isNowFirst) {
            console.log(`[REDLINE REVERSAL] MP: ${winner.name} came from 2nd to 1st on round ${multiplayerGameState.round} (tokensAwarded=${tokensAwarded})`);
            setTimeout(() => addOverlay('hidden_redline_reversal', 'REDLINE REVERSAL', 'Came from 2nd to claim the win on the final round!'), 2000);
            momentCount++;
        }
    }

    // Hidden Deja Bid: prev player win was within ±1 bid (use server momentFlagsEarned)
    // Only fires once per game session - guard with ref so cumulative array doesn't re-trigger it
    const winnerMpPlayer = players.find(p => p.id === winner.id);
    const mpFlagsEarned = (winnerMpPlayer as any)?.momentFlagsEarned || [];
    if (mpFlagsEarned.includes('HIDDEN_DEJA_BID') && isCurrentPlayerWinner && !dejaBidShownRef.current) {
      dejaBidShownRef.current = true;
      setTimeout(() => addOverlay('hidden_deja_bid', 'DEJA BID', 'Previous win was with a nearly identical bid.', 0), 500);
      momentCount++;
    }

    // LATE_PANIC - only rounds > 1, use server tracking
    if (mpFlagsEarned.includes('LATE_PANIC') && isCurrentPlayerWinner && multiplayerGameState.round > 1) {
      setTimeout(() => addOverlay('late_panic', 'LATE PANIC', 'Won starting the round with the lowest time bank.', 0), 800);
      momentCount += 1;
    }

    // HIDDEN_REDEMPTION: winner won after losing a trophy in a previous round (server tracked)
    // Use count-based guard to support multiple occurrences per game
    if (isCurrentPlayerWinner) {
      const redemptionCount = mpFlagsEarned.filter((f: string) => f === 'HIDDEN_REDEMPTION').length;
      if (redemptionCount > redemptionShownCountRef.current) {
        redemptionShownCountRef.current = redemptionCount;
        setTimeout(() => addOverlay('hidden_redemption', 'REDEMPTION', 'Won after a trophy was taken in a previous round.', 0), 1500);
        momentCount++;
      }
    }

    // HIDDEN_NAIL_IN_THE_COFFIN: current player's ability eliminated an opponent (server tracked)
    const currentPlayerMpObj = players.find(p => p.socketId === socket?.id);
    if (currentPlayerMpObj) {
      const nailCount = (currentPlayerMpObj as any).momentFlagsEarned?.filter((f: string) => f === 'HIDDEN_NAIL_IN_THE_COFFIN').length || 0;
      if (nailCount > nailInCoffinShownCountRef.current) {
        nailInCoffinShownCountRef.current = nailCount;
        setTimeout(() => addOverlay('hidden_nail_in_the_coffin', 'NAIL IN THE COFFIN', 'Your ability eliminated an opponent!', 0), 1800);
        momentCount++;
      }
    }
    
    // Patch Notes Pending: 3+ moment flags in same round
    if (momentCount >= 3) {
      console.log(`[PATCH NOTES PENDING] MP: ${winner.name} triggered ${momentCount} moment flags in round ${multiplayerGameState.round}`);
      setTimeout(() => addOverlay("hidden_patch_notes", "PATCH NOTES PENDING", "Triggered 3+ moment flags in one round."), 2500);
    }
    
    // Mark this round as processed to prevent duplicate triggers
    lastRoundEndProcessedRef.current = multiplayerGameState.round;
  }, [isMultiplayer, multiplayerGameState, socket, addOverlay]);

  // Multiplayer Protocol Announcement - trigger when a new protocol is active
  const lastMpProtocolRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isMultiplayer || !multiplayerGameState) return;
    
    const mpProtocol = multiplayerGameState.activeProtocol;
    const mpVariant = multiplayerGameState.settings?.variant || 'STANDARD';
    
    // Only announce when protocol changes and we're in countdown phase
    if (mpProtocol && mpProtocol !== lastMpProtocolRef.current && multiplayerGameState.phase === 'countdown') {
      lastMpProtocolRef.current = mpProtocol;
      
      // Determine message based on protocol
      let msg = "PROTOCOL ACTIVE";
      let sub = "";
      let showPopup = true;
      
      // Protocols handled by targeted protocol_detail event (skip generic popup)
      const detailHandled = ['THE_MOLE', 'OPEN_HAND', 'LOCK_ON', 'HUM_TUNE', 'PARTNER_DRINK', 'PRIVATE_CHANNEL', 'NOISE_CANCEL'];
      if (detailHandled.includes(mpProtocol)) {
        showPopup = false;
      }
      
      switch(mpProtocol) {
        case 'DATA_BLACKOUT': msg = "DATA BLACKOUT"; sub = "Timers Hidden"; break;
        case 'DOUBLE_STAKES': msg = "HIGH STAKES"; sub = "Double Tokens for Winner"; break;
        case 'SYSTEM_FAILURE': msg = "SYSTEM FAILURE"; sub = "HUD Glitches & Timer Scramble"; break;
        case 'MUTE_PROTOCOL': msg = "MUTE PROTOCOL"; sub = "All players must remain silent!"; break;
        case 'NO_LOOK': msg = "BLIND BIDDING"; sub = "Do not look at screens until drop!"; break;
        case 'PANIC_ROOM': msg = "PANIC ROOM"; sub = "Time 2x Speed | Double Win Tokens"; break;
        case 'UNDERDOG_VICTORY': showPopup = false; break;
        case 'TIME_TAX': showPopup = false; break;
        case 'PRIVATE_CHANNEL': showPopup = false; break;
        case 'TRUTH_DARE': msg = "TRUTH OR DARE"; sub = "Winner Asks, Loser Does"; break;
        case 'SWITCH_SEATS': msg = "SWITCH SEATS"; sub = "Change Positions Now!"; break;
        case 'HYDRATE': msg = "HYDRATION CHECK"; sub = "Everyone Take a Sip!"; break;
        case 'BOTTOMS_UP': msg = "BOTTOMS UP"; sub = "Loser Finishes Drink!"; break;
        case 'WATER_ROUND': msg = "COOLANT FLUSH"; sub = "Water Only This Round!"; break;
        case 'OVERCLOCK': msg = "OVERCLOCK"; sub = "After prepare to bid: click as fast as you can for 15 seconds! Most clicks wins, least loses 35s."; break;
        case 'CALIBRATION': {
          const calSecs = multiplayerGameState?.calibrationTargetSeconds;
          msg = "CALIBRATION"; sub = calSecs ? `Hold as close to ${calSecs}s as possible! Closest bid wins.` : "Hold as close to target as possible! Closest bid wins.";
          break;
        }
        default: if (!detailHandled.includes(mpProtocol)) { msg = "PROTOCOL ACTIVE"; sub = mpProtocol; } break;
      }
      
      const SOCIAL_SET = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'];
      const BIO_SET = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
      
      if (showPopup) {
        if (SOCIAL_SET.includes(mpProtocol)) {
          addOverlay("social_event", msg, sub);
        } else if (BIO_SET.includes(mpProtocol)) {
          addOverlay("bio_event", msg, sub);
        } else {
          addOverlay("protocol_alert", msg, sub);
        }
      } else {
        if (mpProtocol === 'UNDERDOG_VICTORY' || mpProtocol === 'TIME_TAX') {
          addOverlay("protocol_alert", "SECRET PROTOCOL", "A hidden protocol is active...");
        }
      }
    }
    
    // Reset when no active protocol
    if (!mpProtocol) {
      lastMpProtocolRef.current = null;
    }
  }, [isMultiplayer, multiplayerGameState, addOverlay]);

  // --- Game Loop Logic ---

  // Ready Phase Logic (3s Hold)
  useEffect(() => {
    if (phase === 'ready') {
      const allReady = players.filter(p => !p.isEliminated && !p.isGhost).every(p => p.isHolding);
      
      // Auto-advance if all non-eliminated players are ghosts (no one can press ready)
      const aliveNonGhosts = players.filter(p => !p.isEliminated && !p.isGhost);
      if (variant === 'HAUNTED' && aliveNonGhosts.length === 0 && !isMultiplayer) {
        setTimeout(() => startCountdown(), 500);
        return;
      }
      
      if (allReady) {
        const animateReady = (time: number) => {
          if (readyStartTimeRef.current === null) readyStartTimeRef.current = time;
          const delta = (time - readyStartTimeRef.current) / 1000;
          
          setReadyHoldTime(delta);

          if (delta >= READY_HOLD_DURATION) {
             startCountdown();
             return;
          }

          requestRef.current = requestAnimationFrame(animateReady);
        };
        requestRef.current = requestAnimationFrame(animateReady);
      } else {
        // Reset if anyone releases
        if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        readyStartTimeRef.current = null;
        setReadyHoldTime(0);
      }
    }
    
    return () => {
      if (phase === 'ready' && requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [phase, players]);

  // Computed: true when player is a ghost (haunted SP) and all active non-ghost players are bots
  // Used to speed up bot-only rounds (faster ready delays, shorter countdown, auto-advance round_end)
  // NOTE: Must be declared before any useEffect that references it in a dependency array.
  const isBotOnlyRound = useMemo(() => {
    if (isMultiplayer || variant !== 'HAUNTED') return false;
    const p1IsGhost = players.find(p => p.id === 'p1')?.isGhost ?? false;
    if (!p1IsGhost) return false;
    const nonGhostActive = players.filter(p => !p.isGhost && !p.isEliminated);
    return nonGhostActive.length > 0 && nonGhostActive.every(p => p.isBot);
  }, [players, isMultiplayer, variant]);

  // Simulate Bots Getting Ready
  useEffect(() => {
    if (phase === 'ready') {
      // When player is a ghost and only bots remain, use much shorter delays to speed up the round
      const timeoutIds: NodeJS.Timeout[] = [];
      
      players.forEach(p => {
        // Ghost bots do not participate in bidding — skip them so they never start
        // holding with no botBids entry, which would prevent the round from ending.
        if (p.isBot && !p.isHolding && !p.isGhost) {
          const delay = isBotOnlyRound
            ? Math.random() * 200 + 50   // 50–250ms when bot-only (speedup)
            : Math.random() * 2000 + 500; // 0.5s to 2.5s normally
          const id = setTimeout(() => {
             setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, isHolding: true } : pl));
          }, delay);
          timeoutIds.push(id);
        }
      });

      return () => timeoutIds.forEach(clearTimeout);
    }
  }, [phase, isBotOnlyRound]);

  // Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'countdown') {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Check if OVERCLOCK protocol is active - start click phase instead of bidding
            if (activeProtocol === 'OVERCLOCK') {
              setPhase('overclock');
            } else {
              setPhase('bidding');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, activeProtocol]);

  // OVERCLOCK Phase Logic - Singleplayer only
  const overclockCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (phase === 'overclock' && !isMultiplayer) {
      // Initialize click counts for all players
      const initialCounts: Record<string, number> = {};
      players.forEach(p => {
        if (!p.isEliminated) {
          // Bots get random 85-120 clicks immediately
          initialCounts[p.id] = p.isBot ? Math.floor(Math.random() * 36) + 85 : 0;
        }
      });
      overclockCountsRef.current = initialCounts;
      setOverclockClickCounts(initialCounts);
      setOverclockActive(true);
      setOverclockTimeLeft(15);

      // 15-second countdown timer
      const interval = setInterval(() => {
        setOverclockTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setOverclockActive(false);
            // Use ref to get latest counts (state may be stale in closure)
            endOverclockRound(overclockCountsRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, isMultiplayer]);

  // Main Bidding Timer (Precision) - Singleplayer only
  useEffect(() => {
    if (phase === 'bidding' && !isMultiplayer) {
      const animate = (time: number) => {
        if (startTimeRef.current === null) startTimeRef.current = time;
        
        // Calculate deltaTime based on speed (Panic Room = 2x)
        // Panic Room doubles timer drain speed (FIRE WALL immune)
        const rawDelta = (time - startTimeRef.current) / 1000;
        const isFireWallImmune = selectedCharacter?.id === 'low_flame' && abilitiesEnabled;
        const multiplier = (activeProtocol === 'PANIC_ROOM' && !isFireWallImmune) ? 2 : 1;
        
        // FIX: Start at minimum bid time (penalty)
        const startOffset = getTimerStart(); 
        const deltaTime = (rawDelta * multiplier) + startOffset;
        
        setCurrentTime(deltaTime);

        // Check if any bots should release
        handleBotLogic(deltaTime);

        // Auto-Eliminate if Player Over-Bets during holding
        // (If player holds longer than they have time for)
        const currentPlayer = players.find(p => p.id === 'p1');
        if (currentPlayer && currentPlayer.isHolding && !currentPlayer.isEliminated) {
            if (deltaTime > currentPlayer.remainingTime) {
                // Force Eliminate (or ghostify in Haunted mode)
                 setPlayers(prev => prev.map(p => {
                     if (p.id === 'p1') {
                         if (!overLimitToastShownRef.current) {
                              overLimitToastShownRef.current = true;
                         }
                         const ghostData = variant === 'HAUNTED' ? assignGhostImage() : null;
                         return { 
                             ...p, 
                             isHolding: false, 
                             currentBid: 0, 
                             remainingTime: 0, 
                             // In Haunted mode: become ghost, NOT eliminated
                             isEliminated: variant === 'HAUNTED' ? p.isEliminated : true,
                             isGhost: variant === 'HAUNTED' ? true : p.isGhost,
                             ghostAbility: ghostData?.ghostAbility ?? p.ghostAbility,
                             characterIcon: ghostData?.characterIcon ?? p.characterIcon,
                         };
                     }
                     return p;
                 }));
            }
        }
        
        if (overLimitToastShownRef.current) {
            if (variant === 'HAUNTED') {
              toast({
                title: "👻 GHOSTED",
                description: "You held too long and became a ghost!",
                className: "bg-teal-950 border-teal-500 text-teal-100",
                duration: 4000
              });
            } else {
              toast({
                 title: "OVER-LIMIT ELIMINATION",
                 description: "You held longer than your remaining time! Eliminated.",
                 className: "bg-cyan-950 border-cyan-500 text-cyan-100",
                 duration: 4000
             });
            }
            overLimitToastShownRef.current = false; 
        }

        // Check if everyone released
        // Ghosts cannot hold — exclude them so a stale isHolding on a ghost player
        // (or a ghost bot that slipped through) can never prevent the round from ending.
        const activePlayers = players.filter(p => !p.isEliminated && !p.isGhost);
        const holdingPlayers = activePlayers.filter(p => p.isHolding);
        
        if (holdingPlayers.length === 0) {
          endRound(deltaTime);
          return; // Stop loop
        }
        
        requestRef.current = requestAnimationFrame(animate);
      };
      
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current !== null && phase !== 'ready') cancelAnimationFrame(requestRef.current);
      startTimeRef.current = null;
    }
    
    return () => {
      if (requestRef.current !== null && phase !== 'ready') cancelAnimationFrame(requestRef.current);
    };
  }, [phase, players, isMultiplayer]); 

  // Bot Logic
  const handleBotLogic = (time: number) => {
    // Logic handled via pre-calculated bids below
  };

  // Pre-calculate bot bids when round starts
  const [botBids, setBotBids] = useState<Record<string, number>>({});
  const [pendingPenalties, setPendingPenalties] = useState<Record<string, number>>({}); // For Casual/Easy Mode deferred penalties

  // Initialize Bots with Random Unique Characters on Mount
  // Removed this useEffect as it only runs once and causes bots to be blank on restart.
  // Moved logic to assignBotCharacters function called during character selection.

  const assignBotCharacters = (playerChar: Character) => {
      // Build Character Pool based on Variant
      let pool = [...CHARACTERS];
      if (variant === 'SOCIAL_OVERDRIVE') pool = [...pool, ...SOCIAL_CHARACTERS];
      if (variant === 'BIO_FUEL') pool = [...pool, ...BIO_CHARACTERS];

      const shuffledChars = pool
        .filter(c => c.id !== playerChar.id) // Exclude player's character
        .sort(() => 0.5 - Math.random());
      
      let charIndex = 0;

      const pickIcon = (c: Character) => {
        if (variant === 'HAUNTED' && c.imageHaunted) return c.imageHaunted;
        if (variant === 'SOCIAL_OVERDRIVE' && c.imageSocial) return c.imageSocial;
        if (variant === 'BIO_FUEL' && c.imageBio) return c.imageBio;
        return c.image;
      };

      setPlayers(prev => prev.map(p => {
        if (p.isBot) {
          const char = shuffledChars[charIndex % shuffledChars.length];
          charIndex++;
          
          return { 
            ...p, 
            name: char.name, 
            characterIcon: pickIcon(char),
            selectedDriver: char.id,
          };
        }
        return p;
      }));
  };

  useEffect(() => {
    if (phase === 'ready' || phase === 'countdown') {
      const newBotBids: Record<string, number> = {};

      const minBidTime = getTimerStart();
      const isLastRound = round >= totalRounds;
      const isPanicRoom = activeProtocol === 'PANIC_ROOM';
      const isNoLook = activeProtocol === 'NO_LOOK';
      const isMute = activeProtocol === 'MUTE_PROTOCOL';
      const isMole = activeProtocol === 'THE_MOLE';
      const roundsLeft = totalRounds - round + 1;
      const isEarlyGame = round <= 3;
      const isMidGame = round > 3 && round <= 6;
      const isLateGame = round > 6;

      const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
      const activePlayers = players.filter(p => !p.isEliminated && !p.isGhost);
      const maxTokens = Math.max(...activePlayers.map(p => p.tokens));

      const getBotDriverId = (bot: Player): string | undefined => {
        if (bot.selectedDriver) return bot.selectedDriver;
        const char = allChars.find(c => c.name === bot.name);
        return char?.id;
      };

      const getDriverBidAdjust = (driverId: string | undefined, holdTime: number, bot: Player): number => {
        if (!driverId || !abilitiesEnabled) return holdTime;
        switch (driverId) {
          case 'rainbow_dash':
            if (bot.remainingTime > 45 && holdTime < 38) return 38 + Math.random() * 6;
            break;
          case 'anointed':
            if (bot.remainingTime > 25 && Math.random() > 0.4) {
              const target = 20 - minBidTime;
              return target + (Math.random() * 2 - 1);
            }
            break;
          case 'primate':
            if (bot.remainingTime > 20 && holdTime < 12) return holdTime * 1.3;
            break;
          case 'frostbyte': return holdTime * 1.08;
          case 'the_rind': return holdTime * 0.8;
          case 'pain_hider': return holdTime * 0.85;
          case 'guardian_h':
            if (round === 1 && Math.random() > 0.3) return holdTime * 1.4;
            break;
          case 'low_flame':
            if (isPanicRoom) return holdTime * 1.3;
            break;
          case 'panic_bot':
            return Math.random() > 0.5 ? holdTime * 1.15 : holdTime * 0.75;
          case 'hotwired': return holdTime * 0.9;
          case 'click_click': {
            const otherBids = Object.values(newBotBids);
            if (otherBids.length > 0 && holdTime > 5) {
              const avgBid = otherBids.reduce((a, b) => a + b, 0) / otherBids.length;
              return avgBid + 0.5 + Math.random() * 1.0;
            }
            break;
          }
        }
        return holdTime;
      };

      players.forEach(p => {
        if (p.isBot && !p.isEliminated && !p.isGhost) {
          const maxHoldTime = Math.max(0.5, p.remainingTime - minBidTime);
          const timePerRound = p.remainingTime / Math.max(1, roundsLeft);
          let bid = 0.5;

          const lowTime = p.remainingTime <= 8;
          const midTime = p.remainingTime > 8 && p.remainingTime <= 20;
          const tokenDeficit = maxTokens - p.tokens;
          const isBehind = tokenDeficit >= 2;
          const isAhead = p.tokens >= maxTokens && p.tokens > 0;

          const riskDown = (isPanicRoom ? 0.35 : 0) + (isNoLook ? 0.1 : 0) + (isMute ? 0.1 : 0) + (isLastRound ? 0.2 : 0) + (lowTime ? 0.35 : midTime ? 0.15 : 0);

          const clamp = (v: number) => Math.min(maxHoldTime, Math.max(0.5, v));

          switch (p.personality) {
            case 'aggressive': {
              const base = 18 + Math.random() * 28;
              const cautious = 6 + Math.random() * 10;
              const chooseHigh = Math.random() > (0.25 + riskDown);
              bid = chooseHigh ? base : cautious;
              if (isLateGame && isBehind) bid *= 1.2;
              if (isLateGame && isAhead) bid *= 0.7;
              break;
            }

            case 'conservative': {
              const base = 1.5 + Math.random() * 10;
              bid = base;
              if (isLastRound || isPanicRoom || lowTime) bid = 1.0 + Math.random() * 6;
              if (isLateGame && isBehind && Math.random() > 0.5) {
                bid = 8 + Math.random() * 12;
              }
              break;
            }

            case 'balanced': {
              const budgetBid = timePerRound * (0.7 + Math.random() * 0.5);
              bid = budgetBid;
              if (isEarlyGame) bid *= 0.85;
              if (isLateGame) bid *= 1.1;
              if (isBehind) bid *= 1.15;
              if (isAhead) bid *= 0.85;
              break;
            }

            case 'adaptive': {
              if (isEarlyGame) {
                bid = 3 + Math.random() * 8;
              } else if (isMidGame) {
                const bidPattern = /bid of (\d+\.?\d*)/;
                const recentWinBids = roundLog
                  .filter(e => e.includes('won Round') || e.includes('wins Round'))
                  .slice(-3)
                  .map(e => { const m = e.match(bidPattern); return m ? parseFloat(m[1]) : null; })
                  .filter((v): v is number => v !== null);
                const avgWinBid = recentWinBids.length > 0 
                  ? recentWinBids.reduce((a, b) => a + b, 0) / recentWinBids.length 
                  : 15;
                bid = (avgWinBid - minBidTime) * (0.9 + Math.random() * 0.3);
              } else {
                if (isBehind) {
                  bid = timePerRound * (1.2 + Math.random() * 0.5);
                } else {
                  bid = timePerRound * (0.5 + Math.random() * 0.3);
                }
              }
              break;
            }

            case 'psychological': {
              const unpredictable = Math.random();
              if (unpredictable < 0.2) {
                bid = 1.0 + Math.random() * 3;
              } else if (unpredictable < 0.5) {
                bid = 15 + Math.random() * 20;
              } else {
                bid = 8 + Math.random() * 15;
              }
              if (isLateGame && isBehind) {
                bid = Math.max(bid, 20 + Math.random() * 15);
              }
              if (isAhead && Math.random() > 0.6) {
                bid = 1.5 + Math.random() * 4;
              }
              break;
            }

            case 'random':
            default: {
              const base = 1 + Math.random() * 40;
              bid = base * (1 - Math.min(0.55, riskDown));
              if (isLateGame && Math.random() > 0.6) {
                bid = p.remainingTime * (0.4 + Math.random() * 0.5);
              }
              break;
            }
          }

          if (isMole) {
            bid = bid * 0.85;
          }

          const driverId = getBotDriverId(p);
          bid = getDriverBidAdjust(driverId, bid, p);

          bid += Math.random() * 0.8;
          bid = clamp(bid);

          // PATTERN LOCK: if this bot has patternLockMinBid, enforce minimum
          if (p.patternLockMinBid !== undefined) {
            const minHold = Math.max(0, p.patternLockMinBid - minBidTime);
            newBotBids[p.id] = parseFloat(Math.max(bid, minHold).toFixed(1));
          } else {
            newBotBids[p.id] = parseFloat(bid.toFixed(1));
          }
          // CALIBRATION: Override bid last so bot always stays within ±7s of target
          if (activeProtocol === 'CALIBRATION' && calibrationTarget !== null) {
            const baseHold = Math.max(0.5, calibrationTarget - minBidTime);
            // Bots bid within 0.2–7.0 seconds of the target (random offset in either direction)
            const offsetMagnitude = 0.2 + Math.random() * 6.8; // 0.2 to 7.0
            const offsetSign = Math.random() < 0.5 ? -1 : 1;
            bid = baseHold + offsetSign * offsetMagnitude;
            // Avoid elimination: cap hold time so currentBid won't exceed remainingTime
            const safeMaxHold = Math.max(0.5, p.remainingTime - minBidTime - 0.5);
            bid = Math.min(safeMaxHold, Math.max(0.5, bid));
          }

          newBotBids[p.id] = parseFloat(bid.toFixed(1));
        }
      });

      setBotBids(newBotBids);
    }
  }, [phase, round, totalRounds, activeProtocol, gameDuration, variant, calibrationTarget]);

  // Check bot bids during bidding phase
  // Also check for PEEK abilities (Sadman Logic)
  useEffect(() => {
    if (phase === 'bidding') {
      // Release bots
      const minBidOffset = getTimerStart();
      const botsToRelease = players.filter(p => 
        p.isBot && 
        !p.isGhost &&
        p.isHolding && 
        botBids[p.id] + minBidOffset <= currentTime
      );

      if (botsToRelease.length > 0) {
        setPlayers(prev => prev.map(p => {
          if (botsToRelease.find(b => b.id === p.id)) {
            return { ...p, isHolding: false, currentBid: Math.round((botBids[p.id] + minBidOffset) * 10) / 10 };
          }
          return p;
        }));
      }
      
      // PEEK Logic: If I am Sadman Logic, I can see if others are holding
      // Or Wandering Eye (Sneak Peek)
      // Check if player has this ability
      const playerChar = selectedCharacter; // Or find player p1 char
      if (playerChar?.ability?.effect === 'PEEK') {
          // If 'SAD REVEAL' -> See if opponents are holding (Badges appear on their cards)
          // This is handled in PlayerStats UI if we pass a prop or state
          // We can set a state here to "reveal" holding status
          // Let's assume we want to trigger it randomly or always?
          // Description: "See if opponents are holding."
          // User asked: "Do you randomly in some rounds get to see if others are holding?"
          // Let's implement a random chance per round for this "insight" to be active.
          // We can use a state `peekActive` set at round start.
      }
    }
  }, [currentTime, phase, botBids]);

  // Round Start Logic extension for PEEK (handles both SP and MP)
  const [peekActive, setPeekActive] = useState(false);
  const lastPeekRoundRef = useRef<number>(0);
  
  useEffect(() => {
      if (phase === 'countdown') {
          // Determine the round number for dedup
          const currentRound = isMultiplayer ? (multiplayerGameState?.round || 0) : round;
          if (lastPeekRoundRef.current === currentRound) return;
          lastPeekRoundRef.current = currentRound;
          
                // Activate PEEK ability every round if player has one
                if (selectedCharacter?.ability?.effect === 'PEEK') {
                  const activated = abilitiesEnabled;
                  setPeekActive(activated);
                  if (activated) {
                    // Only show toast for actual PEEK abilities (not Roll Safe, Idol Core)
                    if (selectedCharacter.id === 'sadman' || selectedCharacter.id === 'wandering_eye') {
                      toast({
                        title: "INSIGHT ACTIVATED",
                        description: `${selectedCharacter.ability.name}: You can see an opponents' HOLD status!`,
                        className: "bg-green-950 border-green-500 text-green-100",
                        duration: 4000
                      });
                    }
                  
                  // Set peek targets for MP (SP targets are set in prepareToBid)
                  if (isMultiplayer && multiplayerGameState && socket) {
                    const currentPlayerId = multiplayerGameState.players.find(p => p.socketId === socket.id)?.id;
                    if (currentPlayerId) {
                      // Exclude roll_safe from peek pool — opponents is only consumed below when abilitiesEnabled
                      const opponents = multiplayerGameState.players.filter(p => p.id !== currentPlayerId && !p.isEliminated && (p as any).selectedDriver !== 'roll_safe');
                      
                        if (selectedCharacter.id === 'sadman' && opponents.length > 0 && abilitiesEnabled) {
                            const target = opponents[Math.floor(Math.random() * opponents.length)];
                            setPeekTargetId(target.id);

                            // Scramble self (sadman's own card)
                            const currentPlayerId = multiplayerGameState?.players.find(p => p.socketId === socket?.id)?.id;
                            if (currentPlayerId) {
                                setScrambledPlayers([currentPlayerId]);
                            }
                      } else if (selectedCharacter.id === 'wandering_eye' && opponents.length > 0 && abilitiesEnabled) {
                          const target = opponents[Math.floor(Math.random() * opponents.length)];
                          setPeekTargetId(target.id);

                          // Scramble all opponents EXCEPT peek target (self not scrambled)
                          const scrambled = opponents.map(o => o.id);
                          setScrambledPlayers(scrambled);
                      }
                    }
                  }
                } else {
                    // Not activated this round - clear targets
                    setPeekTargetId(null);
                    setScrambledPlayers([]);
              }
          } else {
              setPeekActive(false);
          }
      }
  }, [phase, round, multiplayerGameState?.round]);

  // Low Flame Immunity Popup Check
  useEffect(() => {
    if (activeProtocol && selectedCharacter?.id === 'low_flame' && abilitiesEnabled) {
        addOverlay("ability_trigger", "FIRE WALL ACTIVE", "Immune to ALL protocol effects!", 0);
    }
  }, [activeProtocol, selectedCharacter?.id]);

  // Helper: assign a ghost image + ability to a player being ghostified
  // Ability is 25% reaper, 75% purgatory (independent of image)
  const assignGhostImage = (existingGhostImage?: string): { ghostImage: string; ghostAbility: GhostAbilityType; characterIcon: string } => {
    const idx = Math.floor(Math.random() * 6) + 1; // 1-6 for visual variety
    const ability: GhostAbilityType = Math.random() < 0.25 ? 'reaper' : 'purgatory';
    return {
      ghostImage: existingGhostImage ?? `hnt_ghost_${idx}`,
      ghostAbility: ability,
      characterIcon: GHOST_IMAGES[idx - 1],
    };
  };

  // Helper: build a ghost ability message for popups
  const buildGhostAbilityMsg = (prefix: string, ghostAbility: GhostAbilityType): string => {
    const abilityName = ghostAbility ? GHOST_ABILITY_NAMES[ghostAbility] : null;
    const abilityDesc = ghostAbility ? GHOST_ABILITY_DESCS[ghostAbility] : null;
    return abilityName ? `${prefix} Your ghost ability: ${abilityName} — ${abilityDesc}` : prefix;
  };

  // Helper: restore a player's driver characterIcon after ghost revival
  const getDriverCharIcon = (p: { selectedDriver?: string; name: string; isBot?: boolean }): string | undefined => {
    const allChars: any[] = [
      ...CHARACTERS,
      ...(typeof SOCIAL_CHARACTERS !== 'undefined' ? SOCIAL_CHARACTERS as any[] : []),
      ...(typeof BIO_CHARACTERS !== 'undefined' ? BIO_CHARACTERS as any[] : []),
    ];
    const char = p.isBot
      ? allChars.find(c => p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name)
      : selectedCharacter as any;
    if (!char) return undefined;
    if (variant === 'HAUNTED' && char.imageHaunted) return char.imageHaunted;
    if (variant === 'SOCIAL_OVERDRIVE' && char.imageSocial) return char.imageSocial;
    if (variant === 'BIO_FUEL' && char.imageBio) return char.imageBio;
    return char.image;
  };

  // Helper: immediately fire a relic effect for the given player (SP only)
  const fireRelicEffect = (relicId: string, activatorId: string, targetId?: string, curseType?: 'time' | 'trophy') => {
    setPlayers(prev => {
      const next = prev.map(p => ({ ...p }));
      const activator = next.find(p => p.id === activatorId);
      if (!activator) return prev;
      activator.relicConsumed = true;

      switch (relicId) {
        case 'jackpot': {
          const roll = Math.random();
          if (roll < 0.25) {
            activator.remainingTime = Math.min(activator.remainingTime + 40, 9999);
            setTimeout(() => addOverlay('haunted_relic', '🎰 JACKPOT: 🎯 LUCKY!', '+40s added to your time bank!', 0), 200);
          } else if (roll < 0.5) {
            activator.tokens += 2;
            setTimeout(() => addOverlay('haunted_relic', '🎰 JACKPOT: 🏆 JACKPOT!', '+2 trophies awarded!', 0), 200);
          } else if (roll < 0.75) {
            activator.remainingTime = Math.max(0, activator.remainingTime - 30);
            setTimeout(() => addOverlay('haunted_relic', '🎰 JACKPOT: 💀 CURSED!', '-30s removed from your time bank!', 0), 200);
          } else {
            const ghostData = assignGhostImage();
            const savedTime = activator.remainingTime;
            activator.isGhost = true;
            activator.ghostReason = 'forced';
            activator.ghostTimeAtDeath = savedTime;
            activator.ghostAbility = ghostData.ghostAbility;
            activator.characterIcon = ghostData.characterIcon;
            activator.ghostImage = ghostData.ghostImage;
            activator.remainingTime = 0;
            const jackpotGhostMsg = buildGhostAbilityMsg('The wheel chose the worst outcome. You are now a ghost.', ghostData.ghostAbility);
            setTimeout(() => addOverlay('haunted_relic', '🎰 JACKPOT: 👻 GHOSTED!', jackpotGhostMsg, 0), 200);
          }
          break;
        }
        case 'ghost_touch': {
          const target = next.find(p => p.id === targetId);
          if (target && !target.isGhost && !target.isEliminated) {
            if (Math.random() < 0.20) {
              const ghostData = assignGhostImage();
              const savedTime = target.remainingTime;
              target.isGhost = true;
              target.ghostReason = 'forced';
              target.ghostTimeAtDeath = savedTime;
              target.ghostAbility = ghostData.ghostAbility;
              target.characterIcon = ghostData.characterIcon;
              target.ghostImage = ghostData.ghostImage;
              target.remainingTime = 0;
              // Activator overlay
              setTimeout(() => addOverlay('haunted_relic', '👻 GHOST TOUCH FIRED', `${target.name} was consumed by the curse!`, 0), 200);
            } else {
              // Only activator sees the miss
              setTimeout(() => addOverlay('haunted_relic', '👻 GHOST TOUCH: MISSED', `The curse didn't take. ${target.name} survives — this time.`, 0), 200);
            }
          }
          break;
        }
        case 'sacrificial_lamb': {
          // Only available in second half of game
          if (round <= Math.floor(totalRounds / 2)) {
            activator.relicConsumed = false;
            setTimeout(() => addOverlay('haunted_relic', '❌ RELIC BLOCKED', 'Sacrificial Lamb can only be used in the second half of the game.', 3000), 200);
            return prev;
          }
          const victims = next.filter(p => !p.isGhost && !p.isEliminated && p.tokens > 0);
          if (victims.length > 0) {
            const victim = victims[Math.floor(Math.random() * victims.length)];
            victim.tokens = Math.max(0, victim.tokens - 1);
            if (victim.id === 'p1') {
              setTimeout(() => addOverlay('haunted_relic', '🐑 SACRIFICIAL LAMB', `You are the chosen lamb — you lose 1 trophy!`, 0), 200);
            } else {
              setTimeout(() => addOverlay('haunted_relic', '🐑 SACRIFICIAL LAMB', `${victim.name} loses 1 trophy. The lamb is chosen. Not by you.`, 0), 200);
            }
          }
          break;
        }
        case 'wild_card': {
          const alive = next.filter(p => !p.isGhost && !p.isEliminated);
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
            setTimeout(() => addOverlay('haunted_relic', '🌀 WILD CARD', "All time banks redistributed!", 0), 200);
          }
          break;
        }
        case 'echo': {
          const target = next.find(p => p.id === targetId);
          if (target) {
            const lastBid = target.bidHistory?.length ? target.bidHistory[target.bidHistory.length - 1] : null;
            if (lastBid != null) {
              target.remainingTime = Math.max(0, target.remainingTime - lastBid);
              setTimeout(() => addOverlay('haunted_relic', '🔁 ECHO', `${target.name} lost ${lastBid.toFixed(1)}s from their time bank!`, 0), 200);
            } else {
              setTimeout(() => addOverlay('haunted_relic', '🔁 ECHO: NO HISTORY', `${target.name} has no bid history yet. Echo had no effect.`, 0), 200);
            }
          }
          break;
        }
        case 'marked': {
          // Only available in second half of game
          if (round <= Math.floor(totalRounds / 2)) {
            activator.relicConsumed = false;
            setTimeout(() => addOverlay('haunted_relic', '❌ RELIC BLOCKED', 'Marked can only be used in the second half of the game.', 3000), 200);
            return prev;
          }
          const target = next.find(p => p.id === targetId);
          if (target) {
            target.markedBy = activatorId;
            setTimeout(() => addOverlay('haunted_relic', '👁️ MARKED', `${target.name} is marked. The next time they win a round, they will be ghosted.`, 0), 200);
          }
          break;
        }
        case 'corrupt': {
          const target = next.find(p => p.id === targetId && p.isBot);
          if (target) {
            target.corruptRoundsLeft = 3;
            target.personality = 'aggressive';
            setTimeout(() => addOverlay('haunted_relic', '🦠 CORRUPT', `${target.name}'s personality is now AGGRESSIVE for 3 rounds!`, 0), 200);
          } else {
            // No valid bot targets — refund and notify
            activator.relicConsumed = false;
            setTimeout(() => addOverlay('haunted_relic', '🦠 CORRUPT: NO TARGETS', 'No eligible bot targets available to corrupt.', 0), 200);
          }
          break;
        }
        case 'last_will': {
          // Cannot be activated on the final round
          if (round >= totalRounds) {
            activator.relicConsumed = false;
            setTimeout(() => addOverlay('haunted_relic', '❌ RELIC BLOCKED', 'Last Will cannot be activated on the final round.', 3000), 200);
            return prev;
          }
          // Set a deferred flag — at end of round, if ghosted, a random opponent loses 1 trophy
          activator.pendingLastWill = { targetId: '', curseType: 'trophy' };
          setTimeout(() => addOverlay('haunted_relic', '⚰️ LAST WILL SET', 'If you are ghosted this round, a random opponent loses 1 trophy.', 0), 200);
          break;
        }
        case 'death_wish': {
          activator.deathWishActive = true;
          setTimeout(() => addOverlay('haunted_relic', '💀 DEATH WISH', 'Win this round for +2 trophies instead of 1. Lose and forfeit an extra 15s.', 0), 200);
          break;
        }
        case 'blood_pact': {
          activator.bloodPactActive = true;
          setTimeout(() => addOverlay('haunted_relic', '🩸 BLOOD PACT', "If anyone wins this round, all non-winners also lose the winner's bid time.", 0), 200);
          break;
        }
        case 'cursed_dice': {
          activator.cursedDiceActive = true;
          setTimeout(() => addOverlay('ability_trigger', '🎲 CURSED DICE ARMED', 'After this round: 50/50 chance of +30s or −30s.', 0), 200);
          break;
        }
        case 'seance': {
          const ghosts = next.filter(p => p.isGhost && !p.isEliminated);
          if (ghosts.length < 2) {
            // Not enough ghosts — do not consume
            activator.relicConsumed = false;
            setTimeout(() => addOverlay('haunted_relic', '🕯️ SÉANCE: FAILED', 'Requires at least 2 active ghosts!', 3000), 200);
            return prev; // no change
          }
          const aliveForSeance = next.filter(p => !p.isGhost && !p.isEliminated);
          const minAliveSeance = aliveForSeance.length > 0 ? Math.min(...aliveForSeance.map(p => p.remainingTime)) : 0;
          const seanceReviveTime = Math.max(45, minAliveSeance);
          ghosts.forEach(ghost => {
            ghost.isGhost = false;
            ghost.remainingTime = seanceReviveTime;
            ghost.ghostImage = undefined;
            ghost.characterIcon = getDriverCharIcon(ghost);
            ghost.ghostAbility = null;
            ghost.ghostAbilityUsed = false;
            ghost.possessionRoundsLeft = undefined;
          });
          activator.tokens += 1;
          setTimeout(() => addOverlay('haunted_relic', '🕯️ SÉANCE', `${ghosts.length} ghost(s) revived with ${seanceReviveTime.toFixed(1)}s! You gain +1 trophy.`, 0), 200);
          break;
        }
        case 'final_writ': {
          activator.finalWritActive = true;
          setTimeout(() => addOverlay('haunted_relic', '✒️ FINAL WRIT', 'You will automatically win the final round\'s trophy. The last page is written.', 0), 200);
          break;
        }
        case 'protocol_forcer': {
          // Store on the activator so startCountdown picks it up
          (activator as any).forcedProtocolNextRound = true;
          const darkPool = ['DATA_BLACKOUT', 'SYSTEM_FAILURE', 'PANIC_ROOM', 'TIME_TAX', 'THE_MOLE', 'UNDERDOG_VICTORY'];
          const picked = darkPool[Math.floor(Math.random() * darkPool.length)] as any;
          (activator as any).forcedProtocolValue = picked;
          setTimeout(() => addOverlay('haunted_relic', '⛓️ PROTOCOL FORCER', `This round will be forced to run protocol: ${picked}`, 0), 200);
          break;
        }
        // tribunal and conclave are handled below (outside setPlayers) for SP
        default:
          break;
      }

      return next;
    });

    // SP vote relics: show vote screen immediately (bots already pre-voted)
    if (!isMultiplayer && (relicId === 'tribunal' || relicId === 'conclave')) {
      const allPlayers = players;
      const activatorPlayer = allPlayers.find(p => p.id === activatorId);
      const targetPlayer = targetId ? allPlayers.find(p => p.id === targetId) : undefined;
      let opts: { id: string; label: string }[] = [];
      if (relicId === 'tribunal' && targetPlayer) {
        opts = [
          { id: 'A', label: `${targetPlayer.name} loses 30s from time bank immediately` },
          { id: 'B', label: `${targetPlayer.name}'s relic is consumed without effect` },
        ];
      } else if (relicId === 'conclave') {
        opts = [
          { id: 'A', label: 'Cut every time bank in half' },
          { id: 'B', label: 'Skip the next round as a tie' },
          { id: 'C', label: '100% protocols for the rest of the game' },
          { id: 'D', label: 'Overclock — bottom 2 players lose 1 trophy' },
        ];
      }
      // Bots auto-vote randomly
      const botVotes: Record<string, string> = {};
      allPlayers.filter(p => p.isBot && !p.isEliminated).forEach(p => {
        botVotes[p.id] = opts[Math.floor(Math.random() * opts.length)]?.id ?? opts[0].id;
      });
      const newVoteState = {
        relicId,
        activatorName: activatorPlayer?.name ?? 'Player',
        targetName: targetPlayer?.name,
        targetId,
        options: opts,
        votes: botVotes,
        timeLeft: 20,
      };
      // If a vote is already active, queue this one
      const currentVote = voteRelicState;
      if (currentVote && !currentVote.resolved) {
        spVoteQueueRef.current.push(newVoteState);
        return;
      }
      setVoteRelicState(newVoteState);
      // Start vote countdown
      if (voteTimerRef.current) clearInterval(voteTimerRef.current);
      voteTimerRef.current = setInterval(() => {
        setVoteRelicState(vs => {
          if (!vs || vs.resolved) { clearInterval(voteTimerRef.current!); return vs; }
          const next = vs.timeLeft - 1;
          if (next <= 0) {
            clearInterval(voteTimerRef.current!);
            // Auto-resolve without player vote: bots decide
            resolveVoteRelicSP({ ...vs, timeLeft: 0 });
            return { ...vs, timeLeft: 0, resolved: true };
          }
          return { ...vs, timeLeft: next };
        });
      }, 1000);
    }
  };

  // SP-only: resolve a vote relic after the timer or early when player votes
  const resolveVoteRelicSP = (vs: NonNullable<typeof voteRelicState>) => {
    // Count votes
    const tally: Record<string, number> = {};
    vs.options.forEach(o => { tally[o.id] = 0; });
    Object.values(vs.votes).forEach(v => { tally[v] = (tally[v] ?? 0) + 1; });
    const sorted = [...vs.options].sort((a, b) => {
      const diff = (tally[b.id] ?? 0) - (tally[a.id] ?? 0);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
    const winner = sorted[0];
    setVoteRelicState(prev => prev ? { ...prev, resolved: true, winnerLabel: winner.label } : prev);

    if (vs.relicId === 'tribunal') {
      setPlayers(prev => prev.map(p => {
        if (p.id !== vs.targetId) return p;
        if (winner.id === 'A') return { ...p, remainingTime: Math.max(0, p.remainingTime - 30) };
        if (winner.id === 'B') return { ...p, relicConsumed: true };
        return p;
      }));
      setTimeout(() => addOverlay('haunted_relic', '⚖️ TRIBUNAL', winner.id === 'A' ? `${vs.targetName} loses 30s from their time bank immediately!` : `${vs.targetName}'s relic has been consumed without effect!`, 0), 200);
    } else if (vs.relicId === 'conclave') {
      if (winner.id === 'A') {
        setPlayers(prev => prev.map(p => (!p.isEliminated && !p.isGhost) ? { ...p, remainingTime: Math.floor(p.remainingTime / 2 * 10) / 10 } : p));
        setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE A', 'All time banks halved!', 0), 200);
      } else if (winner.id === 'B') {
        // Mark skip-next-round on local state; handled in startCountdown
        (window as any).__conclaveSkipNextRound = true;
        setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE B', 'Next round will be skipped as a tie!', 0), 200);
      } else if (winner.id === 'C') {
        (window as any).__conclaveProtocolsAlwaysOn = true;
        setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE C', '100% protocols for the rest of the game!', 0), 200);
      } else if (winner.id === 'D') {
        setPlayers(prev => {
          const alive = prev.filter(p => !p.isEliminated && !p.isGhost);
          if (alive.length < 2) return prev;
          const sorted2 = [...alive].sort((a, b) => a.tokens - b.tokens);
          const minTok = sorted2[0].tokens;
          const bottom2Ids = new Set(sorted2.filter(p => p.tokens === minTok).slice(0, 2).map(p => p.id));
          if (bottom2Ids.size < 2) bottom2Ids.add(sorted2[1].id);
          return prev.map(p => bottom2Ids.has(p.id) ? { ...p, tokens: p.tokens - 1 } : p);
        });
        setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE D', 'Bottom 2 players each lose 1 trophy!', 0), 200);
      }
    }

    // After a 2s delay (so player can read result), start next queued vote if any
    setTimeout(() => {
      const next = spVoteQueueRef.current.shift();
      if (next) {
        setVoteRelicState(next);
        if (voteTimerRef.current) clearInterval(voteTimerRef.current);
        voteTimerRef.current = setInterval(() => {
          setVoteRelicState(vs2 => {
            if (!vs2 || vs2.resolved) { clearInterval(voteTimerRef.current!); return vs2; }
            const nxt = vs2.timeLeft - 1;
            if (nxt <= 0) {
              clearInterval(voteTimerRef.current!);
              resolveVoteRelicSP({ ...vs2, timeLeft: 0 });
              return { ...vs2, timeLeft: 0, resolved: true };
            }
            return { ...vs2, timeLeft: nxt };
          });
        }, 1000);
      }
    }, 2000);
  };

  const handlePress = () => {
    // Ghosts cannot hold the button in Haunted mode
    const p1 = players.find(p => p.id === 'p1');
    if (p1?.isGhost) return;

    if (isMultiplayer && socket) {
      // Multiplayer: emit button press to server
      const currentPhase = multiplayerGameState?.phase || phase;
      
      if (currentPhase === 'waiting_for_ready') {
        // During waiting phase, press to indicate ready
        socket.emit("player_press");
        console.log('[Game] Emitted player_press (waiting - ready)');
      } else if (currentPhase === 'countdown') {
        // During countdown, clicking while holding means RELEASE (PC toggle behavior)
        if (currentPlayerIsHolding) {
          socket.emit("player_release");
          console.log('[Game] Emitted player_release (countdown - click to release)');
          
          // Show penalty toast (server applies penalty)
          const penalty = multiplayerGameState?.minBid || 2.0;
          toast({
            title: "EARLY RELEASE",
            description: `Released before start! -${penalty.toFixed(1)}s penalty applied.`,
            variant: "destructive",
            duration: 3000
          });
        } else {
          // Not holding, start holding
          socket.emit("player_press");
          console.log('[Game] Emitted player_press (countdown - start holding)');
        }
      } else if (currentPhase === 'bidding') {
        // During bidding, clicking while holding means RELEASE/lock in bid (PC toggle behavior)
        if (currentPlayerIsHolding) {
          socket.emit("player_release");
          console.log('[Game] Emitted player_release (bidding - click to lock in)');
        } else {
          console.log('[Game] Button down during bidding - already released');
        }
      } else if (currentPhase === 'overclock') {
        // OVERCLOCK: send click to server
        socket.emit("overclock_click");
      }
      return;
    }
    
    // Single-player logic
    if (phase === 'ready') {
       setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: true } : p));
    } else if (phase === 'overclock') {
       // OVERCLOCK: each press counts as a click
       setOverclockClickCounts(prev => {
         const updated = { ...prev, p1: (prev['p1'] || 0) + 1 };
         overclockCountsRef.current = updated;
         return updated;
       });
    } else if (phase === 'bidding' || phase === 'countdown') {
        // CLICK TO STOP / SUBMIT
        const p1 = players.find(p => p.id === 'p1');
        if (p1 && p1.isHolding) {
          handleStopBidding();
        }
    }
  };

  const handleStopBidding = () => {
    if (phase === 'bidding') {
      // In multiplayer mode, just emit release to server
      if (isMultiplayer && socket) {
        socket.emit("player_release");
        console.log('[Game] Emitted player_release to server');
        return;
      }
      
      // Single-player logic
      const bidTime = parseFloat(currentTime.toFixed(1));
      const p1 = players.find(p => p.id === 'p1');

      // PATTERN LOCK: block SP release if below forced minimum
      const effectiveMinBid = p1?.patternLockMinBid ?? 0;
      if (p1?.patternLockMinBid !== undefined && bidTime < effectiveMinBid) {
        toast({
          title: '🔒 PATTERN LOCK',
          description: `You cannot release before ${effectiveMinBid.toFixed(1)}s (Pattern Lock active)!`,
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }
      
      setPlayers(prev => prev.map(p => {
        if (p.id === 'p1') {
            // Check Minimum Bid
            if (bidTime < MIN_BID) {
                toast({
                    title: "BID TOO LOW",
                    description: `Minimum bid is ${MIN_BID}s.`,
                    variant: "destructive",
                    duration: 3000
                });
                return { ...p, isHolding: false, currentBid: 0 }; // Zero bid logic
            }

            // OVER-BET CHECK
            if (bidTime > p.remainingTime) {
                // In Haunted mode: ghostify. In other modes: eliminate.
                const newTime = 0; // Depleted to zero
                const ghostData = variant === 'HAUNTED' ? assignGhostImage() : null;
                
                // Add log
                setRoundLog(prev => [`>> OVER-LIMIT: ${p.name} bet more than available! Time Depleted.`, ...prev]);

                if (variant === 'HAUNTED') {
                  toast({ title: "👻 GHOSTED", description: `You bid ${bidTime}s but only had ${p.remainingTime.toFixed(1)}s! You became a ghost.`, className: "bg-teal-950 border-teal-500 text-teal-100", duration: 4000 });
                } else {
                  toast({ title: "OVER-LIMIT", description: `You bid ${bidTime}s but only had ${p.remainingTime.toFixed(1)}s! Time Depleted.`, variant: "destructive", duration: 4000 });
                }
                return { 
                    ...p, 
                    isHolding: false, 
                    currentBid: bidTime, 
                    remainingTime: newTime,
                    // In Haunted mode: become ghost, NOT eliminated
                    isEliminated: variant === 'HAUNTED' ? p.isEliminated : true,
                    isGhost: variant === 'HAUNTED' ? true : p.isGhost,
                    ghostAbility: ghostData?.ghostAbility ?? p.ghostAbility,
                    characterIcon: ghostData?.characterIcon ?? p.characterIcon,
                };
            }
            
            return { ...p, isHolding: false, currentBid: bidTime, totalTimeBid: p.totalTimeBid + bidTime };
        }
        return p;
      }));

    } else if (phase === 'countdown') {
         // SINGLEPLAYER ONLY: If stopping during countdown, store penalty to apply at round end
         if (!isMultiplayer) {
           const p1 = players.find(p => p.id === 'p1');
           if (!p1?.isHolding) {
             return;
           }
           let penalty = getPenalty();

           // ALPHA PRIME EXCEPTION: "JAWLINE" - only when abilities (limit breaks) are ON
           if (selectedCharacter?.ability?.name === 'JAWLINE' && abilitiesEnabled) {
             penalty = 0;
             toast({
               title: "JAWLINE ACTIVATED",
               description: "No penalty for early drop!",
               className: "bg-zinc-800 border-zinc-500 text-zinc-100",
               duration: 2000
             });
           } else {
             toast({
               title: "EARLY RELEASE",
               description: `Released before start! -${penalty}s penalty will apply at round end.`,
               variant: "destructive",
               duration: 3000
             });
           }

           // DEFERRED PENALTY - Store for round end, do NOT deduct immediately
           if (penalty > 0) {
             setPendingPenalties(prev => ({ ...prev, 'p1': (prev['p1'] || 0) + penalty }));
           }

           setPlayers(prev => prev.map(p => p.id === 'p1' ? { 
             ...p, 
             isHolding: false, 
             currentBid: 0
           } : p));
         }
    }
  }

  // Constants for Penalty
  const getPenalty = () => {
     if (gameDuration === 'short') return 1.0;
     if (gameDuration === 'long') return 4.0;
     return 2.0; // standard
  };

  const MIN_BID = 0.1;

  // New Helper for Timer Start
  const getTimerStart = () => {
      // Per requirements: "The round timer must start at the minimum bid second, not zero."
      // This refers to the PENALTY value (1s/2s/4s)
      return getPenalty();
  };

  // User Interactions - Button Up
  const handleRelease = () => {
    if (isMultiplayer && socket) {
      const currentPhase = multiplayerGameState?.phase || phase;
      
      if (currentPhase === 'waiting_for_ready') {
        // During waiting phase, releasing means not ready
        if (currentPlayerIsHolding) {
          socket.emit("player_release");
          console.log('[Game] Emitted player_release (waiting - not ready)');
        }
      } else if (currentPhase === 'countdown' || currentPhase === 'bidding') {
        // PC behavior: During countdown/bidding, mouse-up does NOT release
        // Player must CLICK (handlePress) to release/lock in bid
        // This prevents accidental releases when lifting mouse button
        console.log(`[Game] Mouse up during ${currentPhase} - ignoring (use click to release)`);
      }
      return;
    }
    
    // Single-player: release during ready phase
    if (phase === 'ready') {
      setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: false } : p));
    } 
    // In single-player bidding: DROPPING DOES NOT STOP TIMER
    // Use click (handlePress) to stop.
  };

  // Start Round Logic
  const startCountdown = () => {
    // SP: FINAL WRIT — if player has it active and this IS the final round, skip it
    if (variant === 'HAUNTED' && round >= totalRounds) {
      const p1 = players.find(p => p.id === 'p1');
      const finalWritHolder = players.find(p => p.finalWritActive && !p.isEliminated && !p.isGhost);
      if (finalWritHolder) {
        setPlayers(prev => prev.map(p =>
          p.id === finalWritHolder.id ? { ...p, tokens: p.tokens + 1, finalWritActive: false, relicConsumed: true } : p
        ));
        setTimeout(() => addOverlay('haunted_relic', '✒️ FINAL WRIT ACTIVATED', `${finalWritHolder.name} skips the final round and claims the trophy!`, 5000), 200);
        // Go straight to round_end via endRound with no bids
        setPhase('round_end');
        return;
      }
    }

    // SP: CONCLAVE B — skip this round as a tie
    if (variant === 'HAUNTED' && (window as any).__conclaveSkipNextRound) {
      (window as any).__conclaveSkipNextRound = false;
      setTimeout(() => addOverlay('protocol_alert', '🗳️ CONCLAVE B', 'This round is skipped as a tie — no bids!', 4000), 200);
      setPhase('round_end');
      return;
    }

    // Check for Protocol Trigger (pace-dependent)
    // SPEED (short): 50% | STANDARD (medium): 40% | MARATHON (long): 30%
    const protocolTriggerChance = gameDuration === 'short' ? 0.5 : gameDuration === 'long' ? 0.3 : 0.4;
    const conclaveCAlwaysOn = !!(window as any).__conclaveProtocolsAlwaysOn;

    // Protocol Forcer: use forced protocol if set
    const forcedProtocolHolder = variant === 'HAUNTED' ? players.find(p => (p as any).forcedProtocolNextRound && !p.isEliminated) : null;
    const forcedProtocolValue = (forcedProtocolHolder as any)?.forcedProtocolValue as ProtocolType | undefined;

    if (forcedProtocolValue) {
      // Consume the forced protocol flag from the player
      setPlayers(prev => prev.map(p =>
        p.id === forcedProtocolHolder!.id ? { ...p, forcedProtocolNextRound: undefined, forcedProtocolValue: undefined } as any : p
      ));
    }

    if ((protocolsEnabled || conclaveCAlwaysOn) && (forcedProtocolValue || conclaveCAlwaysOn || Math.random() < protocolTriggerChance)) {
      
      // Build Protocol Pool
      // Standard protocols and Reality Mode protocols are configured separately.
      // Goal: any enabled options should trigger uniformly.
      const STANDARD_SET = ['DATA_BLACKOUT','DOUBLE_STAKES','SYSTEM_FAILURE','OPEN_HAND','MUTE_PROTOCOL','NO_LOOK','THE_MOLE','PANIC_ROOM','UNDERDOG_VICTORY','TIME_TAX','PRIVATE_CHANNEL','OVERCLOCK','CALIBRATION'];
      const SOCIAL_SET = ['TRUTH_DARE','SWITCH_SEATS','HUM_TUNE','LOCK_ON','NOISE_CANCEL'];
      const BIO_SET = ['HYDRATE','BOTTOMS_UP','PARTNER_DRINK','WATER_ROUND'];

      const pick = (pool: ProtocolType[]) => pool[Math.floor(Math.random() * pool.length)];

      const standardPool: ProtocolType[] = (allowedProtocols || []).filter(p => STANDARD_SET.includes(p as any));
      const modePool: ProtocolType[] = (variant === 'SOCIAL_OVERDRIVE')
        ? (allowedProtocols || []).filter(p => SOCIAL_SET.includes(p as any))
        : (variant === 'BIO_FUEL')
          ? (allowedProtocols || []).filter(p => BIO_SET.includes(p as any))
          : [];

      const combinedPool: ProtocolType[] = [...standardPool, ...modePool];
      if (combinedPool.length === 0 && !forcedProtocolValue) return;

      // Use forced protocol if available, otherwise pick from pool
      const newProtocol: ProtocolType = forcedProtocolValue ?? pick(combinedPool);
      setActiveProtocol(newProtocol);

      // CALIBRATION: Set the target time immediately when protocol is selected
      let newCalibrationTarget: number | null = null;
      if (newProtocol === 'CALIBRATION') {
        newCalibrationTarget = Math.floor(Math.random() * 26) + 15; // 15-40s
        setCalibrationTarget(newCalibrationTarget);
      } else {
        setCalibrationTarget(null);
      }
      
      let msg = "PROTOCOL INITIATED";
      let sub = "Unknown Effect";
      let showPopup = true;
      let localMoleTargetId: string | null = null; // Track mole assignment without relying on stale state
      
      // Helper to get random player name(s) - FIRE WALL players excluded from protocol targeting
      const fireWallExclude = selectedCharacter?.id === 'low_flame' && abilitiesEnabled;
      const getRandomPlayer = () => {
        const pool = fireWallExclude ? players.filter(p => p.id !== 'p1') : players;
        if (pool.length === 0) return players[Math.floor(Math.random() * players.length)].name;
        return pool[Math.floor(Math.random() * pool.length)].name;
      };
      const getTwoRandomPlayers = () => {
        const pool = fireWallExclude ? players.filter(p => p.id !== 'p1') : players;
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        if (shuffled.length < 2) {
          const allShuffled = [...players].sort(() => 0.5 - Math.random());
          return [allShuffled[0].name, allShuffled[1].name];
        }
        return [shuffled[0].name, shuffled[1].name];
      };
      
      switch(newProtocol) {

        // ... STANDARD PROTOCOLS ...
        case 'DATA_BLACKOUT': msg = "DATA BLACKOUT"; sub = "Timers Hidden"; break;
        case 'DOUBLE_STAKES': msg = "HIGH STAKES"; sub = "Double Tokens for Winner"; break;
        case 'SYSTEM_FAILURE': msg = "SYSTEM FAILURE"; sub = "HUD Glitches & Timer Scramble"; break;
        case 'OPEN_HAND': msg = "OPEN HAND"; sub = `${getRandomPlayer()} must state they won't bid!`; break;
        case 'MUTE_PROTOCOL': msg = "MUTE PROTOCOL"; sub = "All players must remain silent!"; break;
        case 'NO_LOOK': msg = "BLIND BIDDING"; sub = "Do not look at screens until drop!"; break;
        case 'THE_MOLE':
          // FIRE WALL: fine driver can never be the mole
          const fireWallActive = selectedCharacter?.id === 'low_flame' && abilitiesEnabled;
          const target = fireWallActive ? getRandomPlayer() : (Math.random() > 0.5 ? 'YOU' : getRandomPlayer());
          const targetId = target === 'YOU' ? 'p1' : players.find(p => p.name === target)?.id || null;
          setMoleTarget(targetId);
          localMoleTargetId = targetId; // Store locally to avoid stale state check below
          msg = target === 'YOU' ? "THE MOLE" : "SECRET PROTOCOL ACTIVE";
          sub = target === 'YOU'
            ? "You are the Mole. Your bid does not impact your time bank. Do NOT win the round by more than 7.0s."
            : "";
          if (target !== 'YOU') showPopup = false; // Bot is mole; SECRET PROTOCOL fallback shown by later logic
          break;
        case 'PANIC_ROOM': msg = "PANIC ROOM"; sub = "Time 2x Speed | Double Win Tokens"; break;
        case 'UNDERDOG_VICTORY': showPopup = false; break; // Secret
        case 'TIME_TAX': showPopup = false; break; // Secret
        case 'PRIVATE_CHANNEL': {
          const fireWallActivePC = selectedCharacter?.id === 'low_flame' && abilitiesEnabled;
          const pcTarget = fireWallActivePC ? getRandomPlayer() : (Math.random() > 0.5 ? 'YOU' : getRandomPlayer());
          const pcPartner = getRandomPlayer();
          if (pcTarget === 'YOU') {
            msg = "PRIVATE CHANNEL"; sub = `YOU are secretly linked with ${pcPartner}! Coordinate your strategy.`;
          } else {
            showPopup = false;
          }
          break;
        }
        
        // ... SOCIAL PROTOCOLS ...
        case 'TRUTH_DARE': msg = "TRUTH OR DARE"; sub = "Winner Asks, Loser Does"; break;
        case 'SWITCH_SEATS': msg = "SWITCH SEATS"; sub = "Change Positions Now!"; break;
        case 'HUM_TUNE': msg = "AUDIO SYNC"; sub = `${getRandomPlayer()} must hum a song (others guess)!`; break;
        case 'LOCK_ON': {
            const [lockA, lockB] = getTwoRandomPlayers();
            msg = "LOCK ON";
            sub = `${lockA} & ${lockB} must maintain eye contact!`;
            break;
        }
        case 'NOISE_CANCEL': msg = "NOISE CANCEL"; sub = "No reacting to others! Stay in your own zone."; break;
        
        // ... BIO PROTOCOLS ...
        case 'HYDRATE': msg = "HYDRATION CHECK"; sub = "Everyone Take a Sip!"; break;
        case 'BOTTOMS_UP': msg = "BOTTOMS UP"; sub = "Loser Finishes Drink!"; break;
        case 'PARTNER_DRINK': 
            const [b1, b2] = getTwoRandomPlayers();
            msg = "LINKED SYSTEMS"; sub = `${b1} & ${b2} are drinking buddies this round!`; 
            break;
        case 'WATER_ROUND': msg = "COOLANT FLUSH"; sub = "Water only this round!"; break;
        case 'OVERCLOCK': msg = "OVERCLOCK"; sub = "After prepare to bid: click as many times as you can in 15 seconds! Most clicks wins — least loses 35s."; break;
        case 'CALIBRATION': {
          msg = "CALIBRATION"; sub = `Hold as close to ${newCalibrationTarget}s as possible! Closest bid wins.`; break;
        }
      }
      
      // Filter out popups that shouldn't be seen by the player (targeted/secret protocols only)
      // Public social directives (OPEN_HAND, LOCK_ON, HUM_TUNE, PARTNER_DRINK) are always shown so p1 knows who is targeted
      const targetProtocols = ['THE_MOLE', 'UNDERDOG_VICTORY', 'TIME_TAX', 'PRIVATE_CHANNEL'];

      // LOW FLAME IMMUNITY CHECK (Fire Wall)
      const isLowFlame = selectedCharacter?.id === 'low_flame';
      const isImmune = isLowFlame && abilitiesEnabled; // FIRE WALL: Immune to ALL protocol effects

      if (newProtocol && targetProtocols.includes(newProtocol)) {
         if (newProtocol === 'THE_MOLE') {
             // Use localMoleTargetId to avoid stale moleTarget state
             if (localMoleTargetId !== 'p1') showPopup = false;
         } else if (newProtocol === 'PRIVATE_CHANNEL') {
             // showPopup already set correctly in switch case (false when p1 not in pair)
             // sub.includes('YOU') check for PRIVATE_CHANNEL when p1 IS in pair
             if (!sub.includes('YOU') && !sub.includes(players.find(p => p.id === 'p1')?.name || '')) {
                 showPopup = false;
             }
         } else {
             // UNDERDOG_VICTORY and TIME_TAX are always hidden (showPopup already false from switch)
         }
      }

      if (showPopup) {
         if (isImmune) {
             // Show Immunity Overlay INSTEAD of Protocol
             setTimeout(() => {
                 addOverlay("protocol_alert", "IMMUNE", "Fire Wall blocked protocol!");
             }, 500);
         } else {
             if (['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'].includes(newProtocol || '')) {
                 addOverlay("social_event", msg, sub);
             } else if (['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'].includes(newProtocol || '')) {
                 addOverlay("bio_event", msg, sub);
             } else {
                 addOverlay("protocol_alert", msg, sub);
             }
         }
      } else {
         if (newProtocol && targetProtocols.includes(newProtocol)) {
             addOverlay("protocol_alert", "SECRET PROTOCOL", "A hidden protocol is active...");
         }
      }
    } else {
      setActiveProtocol(null);
      setCalibrationTarget(null);
    }

    // --- ABILITY TRIGGERS: PREPARE_TO_BID ---
    // Handle triggers that happen right before countdown starts
    const selectedChar = selectedCharacter;
    if (selectedChar) {
        // GUARDIAN H: VIBE GUARD (Social)
        if (selectedChar.id === 'guardian_h' && variant === 'SOCIAL_OVERDRIVE') {
             // Stack event instead of override
             setTimeout(() => {
                 addOverlay("social_event", "VIBE GUARD ACTIVE", "Designate a player immune to social dares this round.", 0);
             }, 100); 
        }
        
        // WINTER: COLD SHOULDER (Social) - 50% chance, driver only, start of round
        if (selectedChar.id === 'frostbyte' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.50) {
             setTimeout(() => {
                 addOverlay("social_event", "COLD SHOULDER", "Ignore all social interactions this round.", 0);
             }, 200);
        }

        // WANDERING EYE: DISTRACTION (Social)
        if (selectedChar.id === 'wandering_eye' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.35) {
             setTimeout(() => {
                 addOverlay("social_event", "DISTRACTION", "Point at something! Anyone who looks must drop buzzer.", 0);
             }, 300);
        }

        // IDOL CORE: FANCAM (Social) - 10% chance, start of round
        if (selectedChar.id === 'idol_core' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.10) {
             const opponents = players.filter(p => p.id !== 'p1' && !p.isEliminated);
             const t = opponents.length > 0 ? opponents[Math.floor(Math.random() * opponents.length)] : null;
             setTimeout(() => {
                 addOverlay("social_event", `${selectedChar.name}: FANCAM`, t ? `${t.name} shows hidden talent or drops button!` : "Shows hidden talent or drops button!", 0);
             }, 400);
        }

        // RAINBOW DASH: SUGAR RUSH (Social) - 15% chance, start of round
        if (selectedChar.id === 'rainbow_dash' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.15) {
             const opponents = players.filter(p => p.id !== 'p1' && !p.isEliminated);
             const t = opponents.length > 0 ? opponents[Math.floor(Math.random() * opponents.length)] : null;
             setTimeout(() => {
                 addOverlay("social_event", `${selectedChar.name}: SUGAR RUSH`, t ? `${t.name} must speak 2x speed this round!` : "Speak 2x speed this round!", 0);
             }, 400);
        }

        // ANOINTED: COMMAND SILENCE (Social) - 50% chance, start of round
        if (selectedChar.id === 'anointed' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.50) {
             setTimeout(() => {
                 addOverlay("social_event", `${selectedChar.name}: COMMAND SILENCE`, "Your silence is commanded!", 0);
             }, 400);
        }
        // SADMAN: SAD REVEAL (Passive - PEEK Selection)
      if (selectedChar.id === 'sadman' && abilitiesEnabled) {
         // Exclude roll_safe from peek targets — safe here since this block only runs when abilitiesEnabled
         const opponents = players.filter(p => p.id !== 'p1' && !p.isEliminated && p.selectedDriver !== 'roll_safe');
         if (opponents.length > 0) {
             const target = opponents[Math.floor(Math.random() * opponents.length)];
             setPeekTargetId(target.id);
             setScrambledPlayers(['p1']);  // ← ADD THIS
         }
      } else {
         setPeekTargetId(null);
         setScrambledPlayers([]);  // ← ADD THIS
      }
      
      // WANDERING EYE: SNEAK PEEK (Passive - See 1 holding, scramble everyone else)
      if (selectedChar.id === 'wandering_eye' && abilitiesEnabled) {
        // Exclude roll_safe from peek targets — safe here since this block only runs when abilitiesEnabled
        const opponents = players.filter(p => p.id !== 'p1' && !p.isEliminated && p.selectedDriver !== 'roll_safe');
        if (opponents.length > 0) {
          // Show ONE person is holding (but DON'T reveal their time bank)
          const target = opponents[Math.floor(Math.random() * opponents.length)];
          setPeekTargetId(target.id); 

          // SCRAMBLE EVERYONE INCLUDING THE TARGET (all opponents' time banks are scrambled)
          const allOpponentIds = opponents.map(o => o.id);
          setScrambledPlayers(allOpponentIds);
        }
        } else {
          // Clear scrambling when abilities disabled
          setScrambledPlayers([]);
        }
    }

    // --- SP: BOT RELIC ACTIVATION ---
    // Bots with unconsumed relics get a chance to use them at the start of each round.
    // They fire relics with increasing urgency as the game progresses (later rounds = higher chance).
    if (variant === 'HAUNTED') {
      const isLateGameRound = round >= Math.ceil(totalRounds * 0.6);
      const isFinalRounds = round >= totalRounds - 1;
      const botActivationChance = isFinalRounds ? 0.9 : isLateGameRound ? 0.6 : 0.3;

      setPlayers(prev => {
        const next = prev.map(p => ({ ...p }));

        // Determine who is available to target
        const alivePlayers = next.filter(p => !p.isGhost && !p.isEliminated);
        const aliveOpponents = alivePlayers.filter(p => p.id !== 'p1');
        const botOpponents = aliveOpponents.filter(p => p.isBot);

        next.forEach(bot => {
          if (!bot.isBot || bot.isGhost || bot.isEliminated) return;
          if (!bot.selectedItem || bot.relicConsumed) return;
          if (Math.random() > botActivationChance) return; // probabilistic activation

          const relic = bot.selectedItem;
          const alive = next.filter(p => !p.isGhost && !p.isEliminated);
          const opponents = alive.filter(p => p.id !== bot.id);
          const pickRandom = <T,>(arr: T[]): T | undefined => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

          bot.relicConsumed = true;

          switch (relic) {
            case 'jackpot': {
              const roll = Math.random();
              if (roll < 0.25) {
                bot.remainingTime = Math.min(bot.remainingTime + 40, 9999);
              } else if (roll < 0.5) {
                bot.tokens += 2;
              } else if (roll < 0.75) {
                bot.remainingTime = Math.max(0, bot.remainingTime - 30);
              } else {
                const ghostData = assignGhostImage();
                const saved = bot.remainingTime;
                bot.isGhost = true;
                bot.ghostReason = 'forced';
                bot.ghostTimeAtDeath = saved;
                bot.ghostAbility = ghostData.ghostAbility;
                bot.characterIcon = ghostData.characterIcon;
                bot.ghostImage = ghostData.ghostImage;
                bot.remainingTime = 0;
              }
              break;
            }
            case 'ghost_touch': {
              const target = pickRandom(opponents);
              if (target && Math.random() < 0.20) {
                const ghostData = assignGhostImage();
                const saved = target.remainingTime;
                target.isGhost = true;
                target.ghostReason = 'forced';
                target.ghostTimeAtDeath = saved;
                target.ghostAbility = ghostData.ghostAbility;
                target.characterIcon = ghostData.characterIcon;
                target.ghostImage = ghostData.ghostImage;
                target.remainingTime = 0;
                if (target.id === 'p1') {
                  const ghostMsg = buildGhostAbilityMsg(`${bot.name}'s Ghost Touch claimed you — you are now a ghost.`, ghostData.ghostAbility);
                  setTimeout(() => addOverlay('time_out', '👻 GHOST TOUCH', ghostMsg, 0), 400);
                }
              } else if (target && target.id === 'p1') {
                // p1 was the target but the curse missed — inform only p1
                setTimeout(() => addOverlay('haunted_relic', '👻 GHOST TOUCH: MISSED', `${bot.name} used Ghost Touch on you — the curse didn't take.`, 0), 400);
              }
              break;
            }
            case 'sacrificial_lamb': {
              // Only available in second half of game
              if (round <= Math.floor(totalRounds / 2)) {
                bot.relicConsumed = false;
                break;
              }
              const victims = alive.filter(p => p.tokens > 0);
              const victim = pickRandom(victims);
              if (victim) {
                victim.tokens = Math.max(0, victim.tokens - 1);
                if (victim.id === 'p1') {
                  setTimeout(() => addOverlay('haunted_relic', '🐑 SACRIFICIAL LAMB', `You are the chosen lamb — you lose 1 trophy!`, 0), 200);
                }
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
                setTimeout(() => addOverlay('haunted_relic', '🌀 WILD CARD', `${bot.name} used Wild Card — all time banks redistributed!`, 0), 200);
              }
              break;
            }
            case 'death_wish': {
              bot.deathWishActive = true;
              setTimeout(() => addOverlay('haunted_relic', '💀 DEATH WISH', `${bot.name} activated Death Wish — If they win they are awarded +2 trophies, lose and they forfeit an extra 15s!`, 0), 200);
              break;
            }
            case 'blood_pact': {
              bot.bloodPactActive = true;
              setTimeout(() => addOverlay('haunted_relic', '🩸 BLOOD PACT', `${bot.name} activated Blood Pact — all non-winners pay the winner's bid time this round!`, 0), 200);
              break;
            }
            case 'cursed_dice': {
              bot.cursedDiceActive = true;
              setTimeout(() => addOverlay('ability_trigger', '🎲 CURSED DICE', `${bot.name} armed Cursed Dice — 50/50 chance of ±30s after this round!`, 0), 200);
              break;
            }
            case 'seance': {
              const ghosts = next.filter(p => p.isGhost && !p.isEliminated);
              if (ghosts.length >= 2) {
                const p1WasGhost = ghosts.some(g => g.id === 'p1');
                let p1ReviveTime = 0;
                ghosts.forEach(ghost => {
                  const reviveTime = Math.max(45, ghost.ghostTimeAtDeath ?? 0);
                  ghost.isGhost = false;
                  ghost.remainingTime = reviveTime;
                  ghost.ghostImage = undefined;
                  ghost.characterIcon = getDriverCharIcon(ghost);
                  ghost.ghostAbility = null;
                  ghost.ghostAbilityUsed = false;
                  ghost.possessionRoundsLeft = undefined;
                  if (ghost.id === 'p1') p1ReviveTime = reviveTime;
                });
                bot.tokens += 1;
                if (p1WasGhost) {
                  setTimeout(() => addOverlay('haunted_relic', '🕯️ SÉANCE REVIVAL', `A bot used Séance — you've been revived with ${p1ReviveTime.toFixed(1)}s!`, 0), 400);
                } else {
                  setTimeout(() => addOverlay('haunted_relic', '🕯️ SÉANCE', `${bot.name} performed a Séance — ${ghosts.length} ghost(s) revived!`, 0), 400);
                }
              } else {
                // Not enough ghosts — return relic
                bot.relicConsumed = false;
              }
              break;
            }
            case 'protocol_forcer': {
              // Bot queues a random dark protocol (same pool as the item description)
              const DARK_POOL: ProtocolType[] = ['PANIC_ROOM', 'TIME_TAX', 'THE_MOLE', 'UNDERDOG_VICTORY'];
              const picked = DARK_POOL[Math.floor(Math.random() * DARK_POOL.length)];
              (bot as any).forcedProtocolNextRound = true;
              (bot as any).forcedProtocolValue = picked;
              setTimeout(() => addOverlay('haunted_relic', '⛓️ PROTOCOL FORCER', `${bot.name} used Protocol Forcer — this round will run: ${picked}!`, 0), 200);
              break;
            }
            case 'last_will': {
              // Bot: set pending last will (random opponent, trophy only) — not on final round
              if (round >= totalRounds) {
                bot.relicConsumed = false;
                break;
              }
              bot.pendingLastWill = { targetId: '', curseType: 'trophy' };
              setTimeout(() => addOverlay('haunted_relic', '⚰️ LAST WILL SET', `${bot.name} set Last Will — if ghosted, a random opponent loses 1 trophy!`, 0), 200);
              break;
            }
            case 'echo': {
              const target = pickRandom(opponents.filter(p => (p.bidHistory?.length ?? 0) > 0));
              if (target && (target.bidHistory?.length ?? 0) > 0) {
                const lastBid = target.bidHistory![target.bidHistory!.length - 1];
                target.remainingTime = Math.max(0, target.remainingTime - lastBid);
                setTimeout(() => addOverlay('haunted_relic', '🔁 ECHO', `${bot.name} used Echo — ${target.name} lost ${lastBid.toFixed(1)}s from their time bank!`, 0), 200);
                if (target.id === 'p1') {
                  setTimeout(() => addOverlay('haunted_relic', '🔁 ECHO: TIME DEDUCTED', `${bot.name} used Echo — you lost ${lastBid.toFixed(1)}s from your time bank!`, 0), 400);
                }
              }
              break;
            }
            case 'marked': {
              // Only available in second half of game
              if (round <= Math.floor(totalRounds / 2)) {
                bot.relicConsumed = false;
                break;
              }
              const target = pickRandom(opponents);
              if (target) {
                target.markedBy = bot.id;
                setTimeout(() => addOverlay('haunted_relic', '👁️ MARKED', `${bot.name} marked ${target.name} — they will be ghosted on their next win!`, 0), 200);
              }
              break;
            }
            case 'corrupt': {
              const botTarget = pickRandom(botOpponents.filter(p => p.id !== bot.id));
              if (botTarget) {
                botTarget.corruptRoundsLeft = 3;
                botTarget.personality = 'aggressive';
                setTimeout(() => addOverlay('haunted_relic', '🦠 CORRUPT', `${bot.name} corrupted ${botTarget.name} — they go AGGRESSIVE for 3 rounds!`, 0), 200);
              } else {
                bot.relicConsumed = false; // no valid bot target
              }
              break;
            }
            case 'pattern_lock':
              // Removed relic — should not be in game anymore
              bot.relicConsumed = false;
              break;
            case 'final_writ': {
              bot.finalWritActive = true;
              setTimeout(() => addOverlay('haunted_relic', '✒️ FINAL WRIT', `${bot.name} activated Final Writ — they will auto-win the final round!`, 0), 200);
              break;
            }
            case 'tribunal': {
              // Bots apply immediate random effect — no vote triggered
              const target = pickRandom(opponents);
              if (target) {
                const choice = Math.random() < 0.5 ? 'A' : 'B';
                if (choice === 'A') {
                  target.remainingTime = Math.max(0, target.remainingTime - 30);
                  setTimeout(() => addOverlay('haunted_relic', '⚖️ TRIBUNAL', `${bot.name} sentenced ${target.name} — ${target.name} loses 30s immediately!`, 0), 200);
                } else {
                  target.relicConsumed = true;
                  setTimeout(() => addOverlay('haunted_relic', '⚖️ TRIBUNAL', `${bot.name} sentenced ${target.name} — ${target.name}'s relic was consumed!`, 0), 200);
                }
              } else {
                bot.relicConsumed = false;
              }
              break;
            }
            case 'conclave': {
              // Bots apply immediate random effect — no vote triggered
              const conclaveChoice = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
              if (conclaveChoice === 'A') {
                next.forEach((p: any) => { if (!p.isEliminated && !p.isGhost) p.remainingTime = Math.floor(p.remainingTime / 2 * 10) / 10; });
                setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE', `${bot.name} invoked the Conclave — all time banks halved!`, 0), 200);
              } else if (conclaveChoice === 'B') {
                (window as any).__conclaveSkipNextRound = true;
                setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE', `${bot.name} invoked the Conclave — next round will be skipped!`, 0), 200);
              } else if (conclaveChoice === 'C') {
                (window as any).__conclaveProtocolsAlwaysOn = true;
                setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE', `${bot.name} invoked the Conclave — protocols trigger every round!`, 0), 200);
              } else {
                const alive = next.filter((p: any) => !p.isEliminated && !p.isGhost);
                if (alive.length >= 2) {
                  const conclaveSorted = [...alive].sort((a: any, b: any) => a.tokens - b.tokens);
                  const minTok = conclaveSorted[0].tokens;
                  const penIds = new Set(conclaveSorted.filter((p: any) => p.tokens === minTok).slice(0, 2).map((p: any) => p.id));
                  if (penIds.size < 2) penIds.add(conclaveSorted[1].id);
                  next.forEach((p: any) => { if (penIds.has(p.id)) p.tokens = Math.max(0, p.tokens - 1); });
                }
                setTimeout(() => addOverlay('haunted_relic', '🗳️ CONCLAVE', `${bot.name} invoked the Conclave — bottom 2 players lose a trophy!`, 0), 200);
              }
              break;
            }
            default:
              break;
          }
        });

        return next;
      });

      // After bot setPlayers: bots now apply tribunal/conclave effects immediately (no vote UI).
    }

    // Start timer at minimum bid time (penalty value)
    const minBidTime = getTimerStart();
    setCurrentTime(minBidTime);
    // When only bots remain active (ghost spectator mode), use a shorter countdown
    setCountdown(isBotOnlyRound ? 3 : COUNTDOWN_SECONDS);
    setPhase('countdown');
    overLimitToastShownRef.current = false; // Reset over-limit flag
  };

  // End Overclock Round Logic (singleplayer) - processes click count results
  const endOverclockRound = (counts: Record<string, number>) => {
    setPhase('round_end');

    const activePlayers = players.filter(p => !p.isEliminated);
    if (activePlayers.length === 0) return;

    const maxClicks = Math.max(...activePlayers.map(p => counts[p.id] || 0));
    const minClicks = Math.min(...activePlayers.map(p => counts[p.id] || 0));

    const topClickers = activePlayers.filter(p => (counts[p.id] || 0) === maxClicks);
    const topWinner = topClickers[Math.floor(Math.random() * topClickers.length)];
    let winnerId: string | null = topWinner.id;
    let winnerName: string = topWinner.name;

    // Award token to winner
    setPlayers(prev => prev.map(p => {
      if (p.id === topWinner.id) {
        return { ...p, tokens: p.tokens + 1, protocolWins: [...(p.protocolWins || []), 'OVERCLOCK'] };
      }
      return p;
    }));

    // Loser: least clicks → -35s (only if different from winner)
    let loserName: string | null = null;
    if (minClicks < maxClicks) {
      const bottomClickers = activePlayers.filter(p => (counts[p.id] || 0) === minClicks);
      const loser = bottomClickers[Math.floor(Math.random() * bottomClickers.length)];
      loserName = loser.name;
      setPlayers(prev => prev.map(p => {
        if (p.id === loser.id) {
          const newTime = Math.max(0, p.remainingTime - 35);
          const isElim = newTime <= 0;
          return { ...p, remainingTime: newTime, isEliminated: isElim || p.isEliminated };
        }
        return p;
      }));
    }

    // Show results overlay
    addOverlay("protocol_alert", "OVERCLOCK RESULTS",
      `${winnerName} clicked the most (${maxClicks})!${loserName ? ` ${loserName} had fewest — loses 35s.` : ''}`
    );

    // Process abilities for OVERCLOCK round (ALWAYS, WIN, and LOSE triggers)
    if (abilitiesEnabled) {
      const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];

      // Pre-compute ability data from current players state so animations match state updates
      const rollSafeId = players.find(p => {
        const char = p.isBot ? allChars.find(c => p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name) : selectedCharacter;
        return char?.id === 'roll_safe';
      })?.id;

      const disruptEffects: { targetId: string; amount: number }[] = [];
      players.forEach(p => {
        if (p.isEliminated) return;
        const char = p.isBot ? allChars.find(c => p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name) : selectedCharacter;
        const ab = char?.ability;
        if (!ab) return;
        if (ab.name === 'MANAGER CALL') {
          const validTargets = players.filter(pl => pl.id !== p.id && !pl.isEliminated && pl.id !== rollSafeId);
          if (validTargets.length > 0) {
            const target = validTargets[Math.floor(Math.random() * validTargets.length)];
            disruptEffects.push({ targetId: target.id, amount: 2.0 });
          }
        } else if (ab.name === 'BURN IT') {
          players.filter(pl => pl.id !== p.id && !pl.isEliminated && pl.id !== rollSafeId)
            .forEach(target => disruptEffects.push({ targetId: target.id, amount: 1.0 }));
        } else if (ab.name === 'AXE SWING') {
          const eligible = players.filter(pl => pl.id !== p.id && !pl.isEliminated && pl.id !== rollSafeId);
          if (eligible.length > 0) {
            const richest = eligible.reduce((a, b) => a.remainingTime > b.remainingTime ? a : b);
            disruptEffects.push({ targetId: richest.id, amount: 2.0 });
          }
        }
      });

      const cheeseTaxCount = players.filter(p => {
        if (p.isEliminated || p.id === topWinner.id || topWinner.id === rollSafeId) return false;
        const char = p.isBot ? allChars.find(c => p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name) : selectedCharacter;
        return char?.ability?.name === 'CHEESE TAX';
      }).length;

      // Pre-compute PANIC MASH random outcomes so state update and animation use the same value
      const panicMashOutcomes: Record<string, number> = {};
      players.filter(p => !p.isEliminated).forEach(p => {
        const char = p.isBot ? allChars.find(c => p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name) : selectedCharacter;
        if (char?.ability?.name === 'PANIC MASH') {
          panicMashOutcomes[p.id] = Math.random() > 0.5 ? 3.0 : -3.0;
        }
      });

      // Apply all ability effects
      setPlayers(prev => prev.map(p => {
        if (p.isEliminated) return p;
        const char = p.isBot
          ? allChars.find(c =>
              p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name)
          : selectedCharacter;
        const ab = char?.ability;
        const isClickWinner = p.id === topWinner.id;

        let newTime = p.remainingTime;

        // ALWAYS TIME_REFUND abilities
        if (ab?.effect === 'TIME_REFUND') {
          if (ab.name === 'CYRO FREEZE') newTime += 1.0;
          if (ab.name === 'PANIC MASH') newTime += panicMashOutcomes[p.id] ?? (Math.random() > 0.5 ? 3.0 : -3.0);
        }
        // WIN TIME_REFUND: Spirit Shield (+11s for click winner on round 1)
        if (isClickWinner && ab?.name === 'SPIRIT SHIELD' && round === 1) newTime += 11.0;

        // LOSE DISRUPT: Cheese Tax (non-winner steals 2s from click winner)
        if (!isClickWinner && ab?.name === 'CHEESE TAX' && topWinner.id !== rollSafeId) newTime += 2.0;

        // Apply incoming DISRUPT effects (if not Roll Safe immune)
        if (p.id !== rollSafeId) {
          disruptEffects.filter(d => d.targetId === p.id).forEach(d => { newTime -= d.amount; });
        }

        // Apply Cheese Tax damage received by the winner
        if (isClickWinner) newTime -= cheeseTaxCount * 2.0;

        const isElim = newTime <= 0 || p.isEliminated;
        return { ...p, remainingTime: Math.max(0, newTime), isEliminated: isElim };
      }));

      // Trigger ability animations
      players.filter(p => !p.isEliminated).forEach(p => {
        const char = p.isBot ? allChars.find(c => p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name) : selectedCharacter;
        const ab = char?.ability;
        if (!ab) return;
        const isClickWinner = p.id === topWinner.id;

        if (ab.effect === 'TIME_REFUND') {
          if (ab.name === 'CYRO FREEZE') triggerAnimation(p.id, 'TIME_REFUND', '+1s');
          if (ab.name === 'PANIC MASH') {
            const refund = panicMashOutcomes[p.id];
            if (refund !== undefined) triggerAnimation(p.id, 'TIME_REFUND', `${refund > 0 ? '+' : ''}${refund}s`);
          }
        }
        if (isClickWinner && ab.name === 'SPIRIT SHIELD' && round === 1) {
          triggerAnimation(p.id, 'TIME_REFUND', '+11s');
        }
        if (!isClickWinner && ab.name === 'CHEESE TAX' && topWinner.id !== rollSafeId) {
          triggerAnimation(p.id, 'TIME_REFUND', '+2s');
        }
      });
      // Damage animations for disrupt targets
      disruptEffects.forEach(d => triggerAnimation(d.targetId, 'DAMAGE', `-${d.amount}s`));
      // Damage animation on winner from cheese tax
      if (cheeseTaxCount > 0 && topWinner.id !== rollSafeId) {
        triggerAnimation(topWinner.id, 'DAMAGE', `-${cheeseTaxCount * 2}s`);
      }
    }

    setRoundWinner({ name: topWinner.name, time: maxClicks });

    // Record snapshot
    recordSingleplayerSnapshot('round_end', players, round, winnerId, maxClicks, [], 'OVERCLOCK');

    // Check if game over
    const activePls = players.filter(p => !p.isEliminated);
    const overclockGameOver = variant === 'HAUNTED'
      ? (activePls.length === 0 || round >= totalRounds)
      : (activePls.length <= 1 || round >= totalRounds);
    if (overclockGameOver) {
      setTimeout(() => setPhase('game_end'), 3000);
    }
  };

  // End Round Logic
  const endRound = (finalTime: number) => {
    setPhase('round_end');
    
    // Capture p1 token count before this round's processing (= end of previous round)
    // Used to detect if p1 lost a trophy last round (for hidden_redemption flag)
    const p1TokensBeforeThisRound = players.find(p => p.id === 'p1')?.tokens ?? 0;
    const p1PrevTokens = p1PrevRoundStartTokensRef.current;
    const p1LostTrophyPrevRound = p1PrevTokens !== null && p1TokensBeforeThisRound < p1PrevTokens;
    p1PrevRoundStartTokensRef.current = p1TokensBeforeThisRound;

    // 1. IDENTIFY PARTICIPANTS (Those who held past countdown)
    const participants = players.filter(p => p.currentBid !== null && p.currentBid > 0);

    // Make sure the elimination moment flag shows up for the player if they got eliminated.
    // (Do NOT auto-dismiss; this must persist until the player clicks it.)
    // De-dupe: if another part of the round resolution also adds this, don't stack duplicates.
    // In Haunted mode p1 becomes a ghost — no elimination popup.
    const p1AtRoundEnd = players.find(p => p.id === 'p1');
    if (p1AtRoundEnd?.isEliminated && variant !== 'HAUNTED') {
      const alreadyHasElimFlag = overlays.some(o => o.type === "time_out" && o.message === "PLAYER ELIMINATED");
      if (!alreadyHasElimFlag) {
        addOverlay("time_out", "PLAYER ELIMINATED", "Out of time!", 0);
      }
    }
    
    // 2. CALCULATE PRELIMINARY TIME & ELIMINATION (Pre-Winner)
    
    // First, identify Roll Safe if present - immune to all abilities.
    // Only resolve this when abilities are enabled; when abilities are off, roll_safe
    // is treated as a normal player and should not receive any special immunity.
    const rollSafeId = abilitiesEnabled
      ? players.find(p => p.name === 'Roll Safe' || p.name === 'The Consultant' || (p.isBot && [...CHARACTERS].find(c => c.name === p.name)?.id === 'roll_safe') || (!p.isBot && selectedCharacter?.id === 'roll_safe'))?.id
      : undefined;

    const disruptEffects: { targetId: string, amount: number, source: string, sourceId: string, ability: string }[] = [];
    let playersOut: string[] = [];
    
    if (abilitiesEnabled) {
        players.forEach(sourcePlayer => {
            // Abilities should trigger even if the player didn't participate this round.
            // Only fully eliminated players (out of time) are blocked.
            // Ghosts cannot use driver abilities.
            if (sourcePlayer.isEliminated || sourcePlayer.isGhost || sourcePlayer.remainingTime <= 0) return;
            
            const character = sourcePlayer.isBot 
                ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => 
                    sourcePlayer.selectedDriver ? c.id === sourcePlayer.selectedDriver : c.name === sourcePlayer.name
                  ) 
                : selectedCharacter;
            
            if (character?.ability?.effect === 'DISRUPT') {
                const ab = character.ability;
                
                // DRIVER LOGIC: Must trigger consistently regardless of bidding/dropping
                const isDriver = !sourcePlayer.isBot;
                
                // Executive P & Hotwired & Manager Call should trigger every round
                // Bots usually have random chance, but for these specific powerful drivers, we might want consistency 
                // or at least higher chance. User said: "Hotwired ... is not triggering at all".
                // Let's force trigger for specific abilities if source is bot, or always if player.
                
                let shouldTrigger = false;
                if (isDriver) shouldTrigger = true; // Player always triggers passive/active automatically
                else {
                    // Bot Logic
                    if (ab.name === 'AXE SWING' || ab.name === 'BURN IT' || ab.name === 'MANAGER CALL') {
                        shouldTrigger = true; // ALWAYS trigger for these powerful passives
                    } else {
                        shouldTrigger = Math.random() > 0.3; // 70% chance for others
                    }
                }

                if (!shouldTrigger) return;

                 if (ab.name === 'MANAGER CALL') {
                     // Hit 1 RANDOM opponent (except Roll Safe)
                     const validTargets = players.filter(pl => pl.id !== sourcePlayer.id && !pl.isEliminated && pl.id !== rollSafeId);
                     if (validTargets.length > 0) {
                         const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                         disruptEffects.push({ targetId: target.id, amount: 2.0, source: sourcePlayer.name, sourceId: sourcePlayer.id, ability: ab.name });
                     }
                 } else if (ab.name === 'BURN IT') {
                     // Hit EVERYONE (except Roll Safe)
                     players.filter(pl => pl.id !== sourcePlayer.id && !pl.isEliminated && pl.id !== rollSafeId).forEach(target => {
                         disruptEffects.push({ targetId: target.id, amount: 1.0, source: sourcePlayer.name, sourceId: sourcePlayer.id, ability: ab.name });
                     });
                 }
                 // EXECUTIVE P (AXE SWING) is handled LATER after calculation
                 // CHEESE TAX is handled AFTER winner is determined
            }
        });
    }

    // A. CALCULATE INTERMEDIATE TIMES (Bids + Penalties + Standard Disruptions)
    let tempPlayersState = players.map(p => {
        // EVEN ELIMINATED PLAYERS should be processed if needed for history, but typically we return them as is.
        if (p.isEliminated) return { ...p, roundImpact: "", impactLogs: undefined, roundNetImpactNum: 0 };

        let newTime = p.remainingTime;
        let roundImpact = "";
        let impactLogs: { value: string, reason: string, type: 'loss' | 'gain' | 'neutral' | 'trophy' | 'forced' }[] = [];
        let roundNetImpactNum = 0; // Track numeric impact from abilities/protocols (not bids)

        // Bid Deduction (Only if bid exists) - NOT tracked in netImpact (player choice)
        if (p.currentBid !== null && p.currentBid > 0) {
             const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c =>
                    p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name
                  ) : selectedCharacter;
             const hasFireWall = playerChar?.ability?.name === 'FIRE WALL';
             
             // MOLE Exception
             if (activeProtocol === 'THE_MOLE' && p.id === moleTarget) {
                 // Free
             } else {
                 newTime -= p.currentBid;
             }
        }

      // SINGLEPLAYER ONLY: Pending Penalties (Applied regardless of bid) - tracked in netImpact
      if (!isMultiplayer) {
        const pending = pendingPenalties[p.id] || 0;
        if (pending > 0) {
          newTime -= pending;
          roundNetImpactNum -= pending;
          roundImpact += ` -${pending}s (Penalty)`;
          impactLogs.push({ value: `-${pending.toFixed(1)}s`, reason: "Penalty", type: 'loss' });
        }
      }

        // Apply Standard Disruptions (Manager Call, Burn It) - tracked in netImpact
        // Fire Wall BLOCKS PROTOCOLS but NOT DISRUPTIONS (Abilities) per user request.
        // Roll Safe BLOCKS ALL — but only when abilitiesEnabled (rollSafeId is undefined otherwise).
        
        if (p.id !== rollSafeId) { 
             const myDisrupts = disruptEffects.filter(d => d.targetId === p.id);
             myDisrupts.forEach(d => {
                const dmg = d.amount;
                newTime -= dmg;
                roundNetImpactNum -= dmg;
                roundImpact += ` -${dmg.toFixed(1)}s (${d.ability})`;
                impactLogs.push({ value: `-${dmg.toFixed(1)}s`, reason: `${d.ability}`, type: 'loss' });
            });
        }

        return { ...p, remainingTime: newTime, roundImpact, impactLogs, roundNetImpactNum };
    });

    // B. EXECUTIVE P (AXE SWING) LOGIC - After standard calcs
    // "Remove 2s from non-eliminated opponent with most time."
    // Consistent check: Roll Safe is immune. Low Flame (Fire Wall) is immune if disruption.
    // User said: "Hotwired (Burn It) needs to remove 1s from everyone... Low Flame is NOT exception (Low Flame only blocks Protocols)."
    // Re-reading User: "Please review low flame to make sure they are not stopping any abilities only protocols for themself."
    // OKAY: Fire Wall should NOT block Character Abilities (Disruptions), only Protocols.
    
    // CORRECTION FOR STEP A (Hotwired/Manager Call):
    // Fire Wall should NOT block these if they are character abilities.
    // But existing code checked `!hasFireWall` for disruptions. Removing that check.
    
    // Let's re-run the logic for STEP A with this correction.
    
    tempPlayersState = players.map(p => {
        if (p.isEliminated) return { ...p, tempTime: 0, roundImpact: "", impactLogs: [] as { value: string, reason: string, type: 'loss' | 'gain' | 'neutral' | 'trophy' | 'forced' }[], roundNetImpactNum: 0 };

        let newTime = p.remainingTime;
        let roundImpact = "";
        let roundNetImpactNum = 0;
        let impactLogs: { value: string, reason: string, type: 'loss' | 'gain' | 'neutral' | 'trophy' | 'forced' }[] = [];

        // Bid Deduction
        if (p.currentBid !== null && p.currentBid > 0) {
             if (activeProtocol === 'THE_MOLE' && p.id === moleTarget) {
                 // Free
             } else {
                 newTime -= p.currentBid;
             }
        }

      // SINGLEPLAYER ONLY: Pending Penalties (Applied regardless of bid) - tracked in netImpact
      if (!isMultiplayer) {
        const pending = pendingPenalties[p.id] || 0;
        if (pending > 0) {
          newTime -= pending;
          roundNetImpactNum -= pending;
          roundImpact += ` -${pending}s (Penalty)`;
          impactLogs.push({ value: `-${pending.toFixed(1)}s`, reason: "Penalty", type: 'loss' });
        }
      }

        // Apply Standard Disruptions (Manager Call, Burn It)
        // Fire Wall does NOT block character abilities per user request.
        // Roll Safe IS immune — but only when abilitiesEnabled (rollSafeId is undefined otherwise).
        if (p.id !== rollSafeId) { 
             const myDisrupts = disruptEffects.filter(d => d.targetId === p.id);
             myDisrupts.forEach(d => {
                const dmg = d.amount;
                newTime -= dmg;
                roundNetImpactNum -= dmg;
                roundImpact += ` -${dmg.toFixed(1)}s (${d.ability})`;
                impactLogs.push({ value: `-${dmg.toFixed(1)}s`, reason: `${d.ability}`, type: 'loss' });
            });
        }

        return { ...p, remainingTime: newTime, roundImpact, impactLogs, roundNetImpactNum };
    });

    if (abilitiesEnabled) {
         players.forEach(sourcePlayer => {
            if (sourcePlayer.isEliminated) return;
            const character = sourcePlayer.isBot 
                ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => 
                    sourcePlayer.selectedDriver ? c.id === sourcePlayer.selectedDriver : c.name === sourcePlayer.name
                  ) 
                : selectedCharacter;
            
            if (character?.ability?.name === 'AXE SWING') {
                 // Removed random check for bots to ensure consistency as requested
                 
                 // Find non-eliminated opponent with MOST time (using temp times, post-bid deduction)
                 const validTargets = tempPlayersState.filter(pl => pl.id !== sourcePlayer.id && !pl.isEliminated && pl.remainingTime > 0 && pl.id !== rollSafeId);
                 if (validTargets.length > 0) {
                    // Sort descending by remainingTime to ensure we get the absolute max
                    validTargets.sort((a, b) => b.remainingTime - a.remainingTime);
                    const target = validTargets[0];
                    
                    // Apply directly to tempPlayersState
                    const targetIdx = tempPlayersState.findIndex(t => t.id === target.id);
                    if (targetIdx >= 0) {
                        tempPlayersState[targetIdx].remainingTime -= 2.0;
                        tempPlayersState[targetIdx].roundNetImpactNum = (tempPlayersState[targetIdx].roundNetImpactNum || 0) - 2.0;
                        tempPlayersState[targetIdx].roundImpact += " -2.0s (Axe Swing)";
                        if (tempPlayersState[targetIdx].impactLogs) {
                             tempPlayersState[targetIdx].impactLogs!.push({ value: "-2.0s", reason: "Axe Swing", type: 'loss' });
                        }
                        
                        // Add to disruptEffects for animation later
                        disruptEffects.push({ targetId: target.id, amount: 2.0, source: sourcePlayer.name, sourceId: sourcePlayer.id, ability: 'AXE SWING' });
                    }
                 }
            }
         });
    }

    // C. FINAL PASS: Refunds + Elimination Check
    // Collect always-trigger TIME_REFUND ability animations to merge into newAbilities later
    const alwaysAbilityAnimations: { playerId: string; ability: string; effect: string; impactValue: string }[] = [];
    let playersState = tempPlayersState.map(p => {
        if (p.isEliminated) return p;

        let newTime = p.remainingTime;
        let roundImpact = p.roundImpact || ""; // Ensure string
        let impactLogs = [...(p.impactLogs || [])];
        let roundNetImpactNum = p.roundNetImpactNum || 0; // Carry forward from previous steps
        let selfGain = 0;
        
        const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c =>
                    p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name
                  ) : selectedCharacter;

        // Refunds
        if (abilitiesEnabled && playerChar?.ability?.effect === 'TIME_REFUND') {
            const ab = playerChar.ability;
            let refund = 0;
            if (ab.name === 'CYRO FREEZE') refund = 1.0;
            if (ab.name === 'PANIC MASH') refund = (Math.random() > 0.5 ? 3.0 : -3.0);
            
            if (p.currentBid !== null && p.currentBid > 0) {
                 if (ab.name === 'RAINBOW RUN' && p.currentBid > 40) refund = 3.5;
                 if (ab.name === 'ROYAL DECREE' && Math.abs(p.currentBid - 20) <= 0.4) refund = 20.0;
            }
            
            if (refund !== 0) {
                newTime += refund;
                roundNetImpactNum += refund;
                roundImpact += ` ${refund > 0 ? '+' : ''}${refund.toFixed(1)}s (${ab.name})`;
                impactLogs.push({ value: `${refund > 0 ? '+' : ''}${refund.toFixed(1)}s`, reason: ab.name, type: refund > 0 ? 'gain' : 'loss' });
                selfGain += refund;
                alwaysAbilityAnimations.push({ playerId: p.id, ability: ab.name, effect: 'TIME_REFUND', impactValue: `${refund > 0 ? '+' : ''}${refund}s` });
            }
        }

        const isEliminatedNow = newTime <= 0;
        // In Haunted mode, newly-eliminated players become ghosts instead of being removed.
        // They are NOT set as isEliminated — they remain in the game as ghosts.
        const isNewlyGhosted = isEliminatedNow && !p.isEliminated && !p.isGhost && variant === 'HAUNTED';
        const isNewlyEliminated = isEliminatedNow && !p.isEliminated && variant !== 'HAUNTED';
        if (isNewlyEliminated || isNewlyGhosted) {
             playersOut.push(p.name);
        }

        // Haunted mode: assign ghost image + ability when converted
        const ghostData = isNewlyGhosted ? assignGhostImage() : null;

        return {
            ...p,
            remainingTime: Math.max(0, newTime),
            // In Haunted mode: don't set isEliminated — set isGhost instead
            isEliminated: variant === 'HAUNTED' ? p.isEliminated : isEliminatedNow,
            isGhost: isNewlyGhosted ? true : p.isGhost,
            ghostReason: isNewlyGhosted ? 'natural' : p.ghostReason,
            ghostAbility: isNewlyGhosted ? (ghostData?.ghostAbility ?? null) : p.ghostAbility,
            ghostImage: isNewlyGhosted ? (ghostData?.ghostImage ?? p.ghostImage) : p.ghostImage,
            characterIcon: ghostData?.characterIcon ?? p.characterIcon,
            ghostRoundsAlive: undefined,
            roundImpact: roundImpact,
            impactLogs: impactLogs,
            selfGain: selfGain,
            roundNetImpactNum: roundNetImpactNum
        };
    });

    // Track bid history for Echo / Pattern Lock relics
    playersState.forEach(p => {
      if (p.currentBid !== null && p.currentBid > 0) {
        p.bidHistory = [...(p.bidHistory ?? []), p.currentBid];
      }
    });

    // 3. DETERMINE WINNER
    const validParticipants = playersState.filter(p => 
        participants.some(orig => orig.id === p.id) && 
        !p.isEliminated &&
        !p.isGhost
    );

    // CALIBRATION: sort by closest to target instead of highest bid
    if (activeProtocol === 'CALIBRATION' && calibrationTarget !== null) {
      const target = calibrationTarget;
      validParticipants.sort((a, b) => {
        const aDiff = Math.abs((a.currentBid || 0) - target);
        const bDiff = Math.abs((b.currentBid || 0) - target);
        return aDiff - bDiff;
      });
    } else {
      validParticipants.sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    }

    let winnerId: string | null = null;
    let winnerName: string | null = null;
    let winnerTime = 0;

    if (validParticipants.length > 0) {
        const potentialWinner = validParticipants[0];
        // Tie check: for CALIBRATION, tie = same distance from target
        const isTie = activeProtocol === 'CALIBRATION' && calibrationTarget !== null
          ? validParticipants.some(p => p.id !== potentialWinner.id && 
              Math.abs((p.currentBid || 0) - calibrationTarget) === Math.abs((potentialWinner.currentBid || 0) - calibrationTarget))
          : validParticipants.some(p => p.id !== potentialWinner.id && Math.round((p.currentBid || 0) * 10) / 10 === Math.round((potentialWinner.currentBid || 0) * 10) / 10);
        
        if (!isTie) {
            winnerId = potentialWinner.id;
            winnerName = potentialWinner.name;
            winnerTime = potentialWinner.currentBid || 0;
        } else {
          sfxBlockUntilRef.current = 0; // Reset SFX blocking timer so deadlock sound plays immediately
          addOverlay("deadlock_sync", "DEADLOCK SYNC", "Exact Time Match! No Winner.");
          setRoundLog(prev => [`>> DEADLOCK SYNC: Tie detected! No tokens awarded.`, ...prev]);
        }
    } else {
        const allPlayersEliminated = playersState.every(p => p.isEliminated);
        if (allPlayersEliminated) {
             addOverlay("protocol_alert", "TOTAL WIPEOUT", "All players eliminated.");
        }
    }

    // 4. MOLE PROTOCOL EXCEPTION
    if (activeProtocol === 'THE_MOLE' && participants.length > 0) {
        const rawSorted = [...participants].sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
        const rawWinner = rawSorted[0];
        const rawWinnerState = playersState.find(p => p.id === rawWinner.id);
        
        if (rawWinnerState?.isEliminated && rawWinner.id === moleTarget) {
            const moleIdx = playersState.findIndex(p => p.id === rawWinner.id);
            if (moleIdx >= 0) {
                playersState[moleIdx].tokens -= 1;
                playersState[moleIdx].roundImpact = (playersState[moleIdx].roundImpact || "") + " -1 Token (Mole Suicide)";
                playersState[moleIdx].impactLogs!.push({ value: "-1 Token", reason: "Mole Suicide", type: 'trophy' });
                setRoundLog(prev => [`>> MOLE FAILURE: ${rawWinner.name} held too long and LOST a trophy!`, ...prev]);
                setTimeout(() => addOverlay("protocol_alert", "MOLE REVEALED", `${rawWinner.name} was the Mole and got eliminated! -1 trophy.`), 1500);
            }
        }
    }

    // 5. APPLY WINNER REWARDS & CONDITIONAL ABILITIES
    const extraLogs: string[] = [];
    const newAbilities: any[] = []; 

    // Include always-trigger TIME_REFUND animations (CYRO FREEZE, PANIC MASH, RAINBOW RUN, ROYAL DECREE)
    newAbilities.push(...alwaysAbilityAnimations);

    // Handle Post-Round Triggers for Social/Bio Modes - REMOVED DUPLICATE BLOCK


    disruptEffects.forEach(d => {
        newAbilities.push({ playerId: d.source, ability: d.ability, effect: 'DISRUPT', targetId: d.targetId, impactValue: `-${d.amount}s` });
    });

    const finalPlayers = playersState.map(p => {
        if (p.isEliminated && p.remainingTime <= 0) return p; 

        let newTokens = p.tokens;
        let newTime = p.remainingTime;
        let impact = p.roundImpact || "";
        let impactLogs = [...(p.impactLogs || [])];
        let roundNetImpactNum = p.roundNetImpactNum || 0; // Carry forward from earlier processing

        if (p.id === winnerId) {
             let tokensToAdd = 1;
             // Fire Wall immunity applies to both the human player and any bot with low_flame
             const winnerIsFireWall = abilitiesEnabled && (
                 (!p.isBot && selectedCharacter?.id === 'low_flame') ||
                 (p.isBot && p.selectedDriver === 'low_flame')
             );
             if ((activeProtocol === 'DOUBLE_STAKES' || activeProtocol === 'PANIC_ROOM') && !winnerIsFireWall) {
                tokensToAdd = 2;
                extraLogs.push(`>> HIGH STAKES: ${p.name} won ${tokensToAdd} trophies!`);
             }
             newTokens += tokensToAdd;

             if (abilitiesEnabled) {
                const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c =>
                    p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name
                  ) : selectedCharacter;
                const ab = playerChar?.ability;
                
                if (ab) {
                    let refund = 0;
                    if (ab.name === 'SPIRIT SHIELD' && round === 1) refund = 11.0;
                    // RAINBOW RUN & ROYAL DECREE handled in refund pass
                    if (ab.name === 'CHEF\'S SPECIAL') {
                         const sortedBids = validParticipants.filter(vp => vp.id !== winnerId).map(vp => vp.currentBid || 0);
                         const secondPlace = sortedBids[0] || 0;
                         if (winnerTime - secondPlace > 10) refund = 4.0;
                    }

                    if (refund > 0) {
                        newTime += refund;
                        roundNetImpactNum += refund;
                        impact += ` +${refund.toFixed(1)}s (${ab.name})`;
                        impactLogs.push({ value: `+${refund.toFixed(1)}s`, reason: ab.name, type: 'gain' });
                        newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TIME_REFUND', impactValue: `+${refund.toFixed(1)}s` });
                    }
                    
                    if (ab.effect === 'TOKEN_BOOST') {
                         if (ab.name === 'HYPER CLICK') {
                             const sortedBids = validParticipants.map(vp => vp.currentBid || 0);
                             const secondPlace = sortedBids.length > 1 ? sortedBids[1] : 0;
                             if ((p.currentBid || 0) - secondPlace <= 1.1) {
                                 newTokens += 1;
                                 impact += " +1 Token (Hyper Click)";
                                 impactLogs.push({ value: "+1 Token", reason: "Hyper Click", type: 'trophy' });
                                 newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TOKEN_BOOST', impactValue: "+1 Token" });
                             }
                         }
                         if (ab.name === 'TO THE MOON' && (p.currentBid || 0) > 30) {
                             newTokens += 1;
                             impact += " +1 Token (Moon)";
                             impactLogs.push({ value: "+1 Token", reason: "To The Moon", type: 'trophy' });
                             newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TOKEN_BOOST', impactValue: "+1 Token" });
                         }
                         if (ab.name === 'DIVIDEND' && round % 3 === 0) {
                             newTokens += 1;
                             impact += " +1 Token (Dividend)";
                             impactLogs.push({ value: "+1 Token", reason: "Dividend", type: 'trophy' });
                             newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TOKEN_BOOST', impactValue: "+1 Token" });
                         }
                    }
                }
             }
        }
        
        if (activeProtocol === 'THE_MOLE' && p.id === moleTarget && p.id === winnerId) {
             const sortedBids = validParticipants
               .filter(vp => vp.id !== winnerId)
               .map(vp => vp.currentBid || 0)
               .sort((a, b) => b - a);

             const secondPlaceTime = sortedBids[0] || 0;
             const margin = winnerTime - secondPlaceTime;

             // Incentive: push time up, but avoid winning by too much.
             // Only lose a trophy if you win by MORE THAN 7 seconds.
             if (margin > 7) {
               newTokens -= 2;
               impact += " -2 Tokens (Mole Win > 7s)";
               impactLogs.push({ value: "-2 Tokens", reason: "Mole Win > 7s", type: 'trophy' });
             } else {
               impact += " +0 (Mole Win Safe)";
               impactLogs.push({ value: "+0", reason: "Mole Win (<=7s)", type: 'neutral' });
             }
        }
        
        if (abilitiesEnabled && p.id !== winnerId && winnerId && !p.isEliminated) {
             const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c =>
                    p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name
                  ) : selectedCharacter;
             if (playerChar?.ability?.name === 'CHEESE TAX') {
                 // Cheese Tax does NOT trigger if the winner is roll_safe (immune to abilities).
                 // rollSafeId is only non-undefined when abilitiesEnabled (see definition above).
                 if (winnerId !== rollSafeId) {
                     const taxAmt = 2.0;
                     newTime += taxAmt;
                     roundNetImpactNum += taxAmt;
                     impact += ` +${taxAmt.toFixed(1)}s (Cheese Tax)`;
                     impactLogs.push({ value: `+${taxAmt.toFixed(1)}s`, reason: `Cheese Tax`, type: 'gain' });
                     newAbilities.push({ playerId: p.id, ability: 'CHEESE TAX', effect: 'DISRUPT', targetId: winnerId, impactValue: `Steal ${taxAmt.toFixed(1)}s` });
                 }
             }
             if (playerChar?.ability?.name === 'HIDE PAIN') {
                 const winnerBidVal = validParticipants.find(vp => vp.id === winnerId)?.currentBid || 0;
                 const myBidVal = p.currentBid || 0;
                 if (winnerBidVal - myBidVal > 15) {
                     newTime += 3.0;
                     roundNetImpactNum += 3.0;
                     impact += ' +3.0s (Hide Pain)';
                     impactLogs.push({ value: '+3.0s', reason: 'Hide Pain', type: 'gain' });
                     newAbilities.push({ playerId: p.id, ability: 'HIDE PAIN', effect: 'TIME_REFUND', impactValue: '+3.0s' });
                 }
             }
        }
        
        return { ...p, tokens: newTokens, remainingTime: newTime, roundImpact: impact, impactLogs: impactLogs, netImpact: (p.netImpact || 0) + roundNetImpactNum,
            // Track shortest win bid time for Market Sniper bonus trophy
            shortestWinBidTime: p.id === winnerId && winnerTime > 0
                ? (p.shortestWinBidTime === undefined || winnerTime < p.shortestWinBidTime ? winnerTime : p.shortestWinBidTime)
                : p.shortestWinBidTime
        };
    });

    // 6. APPLY CHEESE TAX DAMAGE TO WINNER (Post-Processing)
    if (winnerId && abilitiesEnabled) {
        finalPlayers.forEach(p => {
             if (p.id !== winnerId && !p.isEliminated) {
                 const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c =>
                    p.selectedDriver ? c.id === p.selectedDriver : c.name === p.name
                  ) : selectedCharacter;
                 if (playerChar?.ability?.name === 'CHEESE TAX') {
                     const w = finalPlayers.find(fp => fp.id === winnerId);
                     // Roll Safe Immunity: rollSafeId is only non-undefined when abilitiesEnabled
                     if (w && w.id !== rollSafeId) {
                         const curseDmg = 2.0;
                         w.remainingTime = Math.max(0, w.remainingTime - curseDmg);
                         w.netImpact = (w.netImpact || 0) - curseDmg;
                         w.roundImpact = (w.roundImpact || "") + ` -${curseDmg.toFixed(1)}s (Cheese Tax)`;
                         if (w.impactLogs) w.impactLogs.push({ value: `-${curseDmg.toFixed(1)}s`, reason: `Cheese Tax`, type: 'loss' });
                         
                         if (w.remainingTime <= 0) {
                             w.isEliminated = true;
                             extraLogs.push(`>> ${w.name} eliminated by Cheese Tax!`);
                         }
                     }
                 }
             }
        });
    }

    setPendingPenalties({}); 

    // Mark first-eliminated players for Flash Crash bonus trophy criterion.
    // Only mark once: if no player in the current state has isFirstEliminated yet,
    // tag all players who became eliminated this round.
    const alreadyHasFirstEliminated = players.some(p => p.isFirstEliminated);
    if (!alreadyHasFirstEliminated) {
      const newlyEliminated = finalPlayers.filter(p => p.isEliminated && !players.find(op => op.id === p.id)?.isEliminated);
      if (newlyEliminated.length > 0) {
        newlyEliminated.forEach(p => { p.isFirstEliminated = true; });
      }
    }

    setPlayers(finalPlayers);
    const updatedPlayers = finalPlayers;
    setRoundWinner(winnerId ? { name: winnerName!, time: winnerTime } : null);
    
    // Haunted mode: notify p1 they became a ghost this round
    const p1WasAlreadyGhost = players.find(p => p.id === 'p1')?.isGhost;
    const p1IsGhostNow = finalPlayers.find(p => p.id === 'p1')?.isGhost;
    if (variant === 'HAUNTED' && !p1WasAlreadyGhost && p1IsGhostNow) {
      const p1Ghost = finalPlayers.find(p => p.id === 'p1');
      const ghostMsg = buildGhostAbilityMsg(
        'You ran out of time and became a ghost. You can no longer win — but the haunting continues.',
        p1Ghost?.ghostAbility ?? null
      );
      setTimeout(() => addOverlay('time_out', '👻 GHOSTED', ghostMsg, 0), 800);
    }

    // --- GHOST ABILITY PROCESSING (Haunted mode, SP) ---
    if (variant === 'HAUNTED') {
      // Find ghosts that have an unused ability assigned this round
      const newlyGhosted = finalPlayers.filter(p =>
        p.isGhost && !p.ghostAbilityUsed && p.ghostAbility
      );

      for (const ghost of newlyGhosted) {
        if (ghost.ghostAbility === 'reaper') {
          // REAPER: auto-ghost a random alive non-ghost player
          const aliveTargets = finalPlayers.filter(fp => !fp.isGhost && !fp.isEliminated && fp.id !== ghost.id);
          if (aliveTargets.length > 0) {
            const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
            const ghostData = assignGhostImage();
            const savedTime = target.remainingTime;
            target.isGhost = true;
            target.ghostAbility = ghostData.ghostAbility;
            target.ghostAbilityUsed = false;
            target.characterIcon = ghostData.characterIcon;
            target.remainingTime = 0;
            target.ghostReason = 'forced';
            target.ghostTimeAtDeath = savedTime;
            const reaperMsg = ghost.id === 'p1'
              ? `💀 REAPER: Your ghost ability dragged ${target.name} into the spirit world!`
              : `💀 REAPER: ${ghost.name}'s ghost ability ghosted ${target.name}!`;
            setTimeout(() => addOverlay('protocol_alert', '💀 REAPER STRIKES', reaperMsg, 0), 1200);
          }
          // After reaper fires, ghost enters purgatory-style countdown
          ghost.ghostAbilityUsed = true;
          ghost.possessionRoundsLeft = 2;

        } else if (ghost.ghostAbility === 'purgatory') {
          // PURGATORY: countdown
          ghost.possessionRoundsLeft = 2;
          ghost.ghostAbilityUsed = true;
          const purgatoryMsg = ghost.id === 'p1'
            ? '🌑 PURGATORY: You drift into purgatory. You will return in 2 rounds.'
            : `🌑 PURGATORY: ${ghost.name} enters purgatory — returns in 2 rounds.`;
          setTimeout(() => addOverlay('ability_trigger', '🌑 PURGATORY', purgatoryMsg, 0), 1200);
        } else {
          // Unknown or null ability — give purgatory countdown as default
          ghost.ghostAbilityUsed = true;
          ghost.possessionRoundsLeft = 2;
        }
      }

      // Purgatory countdown revive for all ghosts
      const isFinalRound = round >= totalRounds;
      const alivePlayers = finalPlayers.filter(fp => !fp.isGhost && !fp.isEliminated);
      const minAliveTime = alivePlayers.length > 0 ? Math.min(...alivePlayers.map(fp => fp.remainingTime)) : 0;
      const reviveTimeCalc = Math.max(45, minAliveTime);

      finalPlayers.forEach(ghost => {
        if (!ghost.isGhost) return;
        if (ghost.possessionRoundsLeft === undefined) {
          // Safety: every ghost should have a countdown
          ghost.possessionRoundsLeft = 2;
          return;
        }
        const roundsLeft = ghost.possessionRoundsLeft - 1;
        if (roundsLeft <= 0) {
          if (isFinalRound) {
            ghost.possessionRoundsLeft = undefined;
          } else {
            ghost.isGhost = false;
            ghost.remainingTime = reviveTimeCalc;
            ghost.ghostImage = undefined;
            ghost.characterIcon = getDriverCharIcon(ghost);
            ghost.possessionRoundsLeft = undefined;
            ghost.ghostAbility = null;
            if (ghost.id === 'p1') {
              setTimeout(() => addOverlay('ability_trigger', '🌑 PURGATORY RETURN', `You return with ${reviveTimeCalc.toFixed(1)}s!`, 0), 600);
            }
          }
        } else {
          ghost.possessionRoundsLeft = roundsLeft;
        }
      });
    }

    // Deferred relic effects (Haunted mode, SP)
    if (variant === 'HAUNTED') {
      finalPlayers.forEach(p => {
        // Last Will: if player is a ghost (ghosted this round cycle), apply the curse
        if (p.pendingLastWill) {
          const isGhostNow = !!p.isGhost;
          if (isGhostNow) {
            // Pick a random alive opponent (not the ghost themselves)
            const eligible = finalPlayers.filter(fp => fp.id !== p.id && !fp.isGhost && !fp.isEliminated && fp.tokens > 0);
            const willTarget = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : null;
            if (willTarget) {
              willTarget.tokens = Math.max(0, willTarget.tokens - 1);
              setTimeout(() => addOverlay('haunted_relic', '⚰️ LAST WILL TRIGGERED', `${p.name} left a curse — ${willTarget.name} loses 1 trophy.`, 0), 1000);
            }
          }
          p.pendingLastWill = undefined;
        }

        // Death Wish: check if this player won or not
        if (p.deathWishActive) {
          if (p.id === winnerId) {
            p.tokens += 1; // +2 total (normal +1 already applied), so add 1 more
            setTimeout(() => addOverlay('haunted_relic', '💀 DEATH WISH: WIN!', '+1 bonus trophy (total +2 this round)!', 0), 800);
          } else if (!p.isGhost && !p.isEliminated) {
            p.remainingTime = Math.max(0, p.remainingTime - 15);
            if (p.id === 'p1') setTimeout(() => addOverlay('haunted_relic', '💀 DEATH WISH: CURSED', '-15s extra penalty for not winning.', 0), 800);
          }
          p.deathWishActive = false;
        }

        // Blood Pact: all non-winners also lose the winner's bid amount
        if (p.bloodPactActive && winnerId && winnerTime > 0) {
          finalPlayers.forEach(fp => {
            if (fp.id !== winnerId && !fp.isGhost && !fp.isEliminated) {
              fp.remainingTime = Math.max(0, fp.remainingTime - winnerTime);
            }
          });
          setTimeout(() => addOverlay('haunted_relic', '🩸 BLOOD PACT TRIGGERED', `Everyone who didn't win loses an extra ${winnerTime.toFixed(1)}s!`, 0), 800);
          p.bloodPactActive = false;
        }

        // Cursed Dice: ±20s random
        if (p.cursedDiceActive) {
          const gain = Math.random() > 0.5;
          if (gain) {

            p.remainingTime += 30;
            if (p.id === 'p1') setTimeout(() => addOverlay('ability_trigger', '🎲 CURSED DICE: LUCKY!', '+30s added to your bank!', 0), 800);
          } else {
            p.remainingTime = Math.max(0, p.remainingTime - 30);
            if (p.id === 'p1') setTimeout(() => addOverlay('ability_trigger', '🎲 CURSED DICE: CURSED!', '-30s removed from your bank!', 0), 800);
          }
          p.cursedDiceActive = false;
        }

        // Marked: check if this player just won — if so, ghost them
        if (p.markedBy && p.id === winnerId) {
          const markerId = p.markedBy;
          const marker = finalPlayers.find(fp => fp.id === markerId);
          const savedTime = p.remainingTime;
          const ghostData = assignGhostImage();
          p.isGhost = true;
          p.ghostReason = 'forced';
          p.ghostTimeAtDeath = savedTime;
          p.ghostAbility = ghostData.ghostAbility;
          p.characterIcon = ghostData.characterIcon;
          p.ghostImage = ghostData.ghostImage;
          p.remainingTime = 0;
          p.markedBy = undefined;
          setTimeout(() => addOverlay('protocol_alert', '👁️ MARK TRIGGERED', `${p.name} won — and was immediately ghosted by the mark!`, 0), 800);
          // Notify p1 of their new ghost ability when ghosted by mark
          if (p.id === 'p1') {
            const ghostMsg = buildGhostAbilityMsg('You won but the Mark ghosted you into the spirit world.', p.ghostAbility ?? null);
            setTimeout(() => addOverlay('time_out', '👻 GHOSTED', ghostMsg, 0), 1400);
          }
          // 50% chance the marker is also ghosted
          if (marker && !marker.isGhost && !marker.isEliminated && Math.random() < 0.5) {
            const markerGhost = assignGhostImage();
            const markerSaved = marker.remainingTime;
            marker.isGhost = true;
            marker.ghostReason = 'forced';
            marker.ghostTimeAtDeath = markerSaved;
            marker.ghostAbility = markerGhost.ghostAbility;
            marker.characterIcon = markerGhost.characterIcon;
            marker.ghostImage = markerGhost.ghostImage;
            marker.remainingTime = 0;
            setTimeout(() => addOverlay('protocol_alert', '👁️ MARK BACKLASH', `The mark also claimed ${marker.name}!`, 0), 1400);
            // Notify p1 if the backlash ghosted them (p1 was the marker)
            if (marker.id === 'p1') {
              const mGhostMsg = buildGhostAbilityMsg('The Mark backlash claimed you — you are now a ghost.', markerGhost.ghostAbility);
              setTimeout(() => addOverlay('time_out', '👻 MARK BACKLASH', mGhostMsg, 0), 2000);
            }
          }
        }

        // Corrupt: decrement rounds counter; restore personality when expired
        if ((p.corruptRoundsLeft ?? 0) > 0) {
          p.corruptRoundsLeft = (p.corruptRoundsLeft ?? 1) - 1;
          if (p.corruptRoundsLeft <= 0) {
            p.corruptRoundsLeft = undefined;
            if (p.isBot) p.personality = (['balanced','aggressive','conservative','random','adaptive','psychological'] as const)[Math.floor(Math.random() * 6)];
          }
        }

        // Pattern Lock: clear flags after round end
        p.patternLockMinBid = undefined;
      });

    }

    // Trigger Animations
    newAbilities.forEach(ab => {
         triggerAnimation(ab.playerId, ab.effect === 'TIME_REFUND' ? 'TIME_REFUND' : 'TOKEN_BOOST', ab.impactValue);
         if (ab.targetId) triggerAnimation(ab.targetId, 'DAMAGE', ab.impactValue);
    });

    // SINGLE PLAYER ELIMINATION CHECK
    // "If the main player is eliminated... Immediately resolve the game"
    // SIMULATE REMAINING ROUNDS so bots get trophies
    // Exception: In Haunted mode, p1 becomes a ghost and the game continues.
    const p1 = finalPlayers.find(p => p.id === 'p1');


    if (p1?.isEliminated && variant !== 'HAUNTED') {
         // Add ELIMINATED to all newly eliminated players' moment flags (including p1)
         // so it counts toward moment flag stats and MOMENT_MAGNET bonus criterion.
         // This must happen before calculateSpBonusTrophies and before the early return.
         finalPlayers.forEach(fp => {
           // Use flag presence check instead of wasEliminated check so over-limit eliminations
           // (where players.isEliminated is already true before endRound is called) are handled too.
           const alreadyHasFlag = (fp.eventDatabasePopups || []).includes('ELIMINATED');
           if (fp.isEliminated && !alreadyHasFlag) {
             fp.eventDatabasePopups = [...(fp.eventDatabasePopups || []), 'ELIMINATED'];
           }
         });

         let currentR = round + 1;
         const remainingBots = finalPlayers.filter(p => !p.isEliminated && p.id !== 'p1');
         
         if (remainingBots.length > 0) {
             // Simulate remaining rounds simply by awarding tokens
             while (currentR <= totalRounds) {
                 const randomWinner = remainingBots[Math.floor(Math.random() * remainingBots.length)];
                 randomWinner.tokens += 1;
                 currentR++;
             }
         }

         // Award SP Bonus Trophies if protocols are enabled (before final placement)
         if (!isMultiplayer && protocolsEnabled && bonusTrophiesEnabled) {
           const bonusResults = calculateSpBonusTrophies(finalPlayers);
           bonusResults.forEach(bonusResult => {
             bonusResult.winnerIds.forEach(wId => {
               const bp = finalPlayers.find(fp => fp.id === wId);
               if (bp) bp.tokens += bonusResult.trophiesPerWinner;
             });
             const subMsg = `${bonusResult.winnerNames.join(' & ')} +${bonusResult.trophiesPerWinner} 🏆\n${bonusResult.criterionDesc}`;
             addOverlay("bonus_trophy", bonusResult.criterionName, subMsg, 0);
           });
         }

         // Show only the moment-flag style elimination notice (this should persist into game over).
         // (Avoid stacking multiple elimination popups; the moment flag is the single source of truth.)
         const alreadyHasElimFlag = overlays.some(o => o.type === "time_out" && o.message === "PLAYER ELIMINATED");
         if (!alreadyHasElimFlag) {
           addOverlay("time_out", "PLAYER ELIMINATED", "Out of time!", 0);
         }

         // Keep the elimination overlays visible; do NOT auto-transition to game over.
         // Player must dismiss the elimination overlay(s), then can proceed.
         setPlayers([...finalPlayers]); // persist ELIMINATED flag in eventDatabasePopups
         setPhase('game_end');

          // Save game summary to database for early elimination (mirrors normal game end save).
          if (!isMultiplayer) {
            const sortedForEarlyElim = [...finalPlayers].sort((a, b) => {
              if (b.tokens !== a.tokens) return b.tokens - a.tokens;
              return b.remainingTime - a.remainingTime;
            });
            const gameId = singleplayerGameIdRef.current;
            if (gameId) {
              fetch('/api/game/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gameId,
                  lobbyCode: null,
                  totalRounds: round,
                  gameSettings: { difficulty, variant, gameDuration, protocolsEnabled, bonusTrophiesEnabled, abilitiesEnabled },
                  playerResults: sortedForEarlyElim.map((p, i) => ({
                    playerId: p.id,
                    playerName: p.name,
                    driverId: p.selectedDriver || selectedCharacter?.id || null,
                    finalRank: i + 1,
                    tokens: p.tokens,
                    remainingTime: p.remainingTime,
                    totalTimeBid: p.totalTimeBid,
                    netImpact: p.netImpact,
                    isEliminated: p.isEliminated,
                    isBot: p.id !== 'p1',
                    momentFlags: p.eventDatabasePopups?.length || 0,
                    protocolWins: p.protocolWins?.length || 0,
                    totalDrinks: p.totalDrinks || 0,
                    socialDares: p.socialDares || 0,
                  })),
                  bonusTrophyResults: [],
                  winnerId: sortedForEarlyElim[0]?.id || null,
                  winnerName: sortedForEarlyElim[0]?.name || null,
                }),
              }).catch(() => {});

              // ── End-game credit conversion for early elimination ──
              const humanPlayerEarly = sortedForEarlyElim.find((p: any) => p.id === 'p1');
              if (humanPlayerEarly) {
                const isHumanWinnerEarly = sortedForEarlyElim[0]?.id === 'p1';
                convertGameCredits(
                  gameId,
                  humanPlayerEarly.tokens || 0,
                  humanPlayerEarly.eventDatabasePopups?.length || 0,
                  isHumanWinnerEarly,
                  variant,
                  false,
                  humanPlayerEarly.eventDatabasePopups || [],
                  difficulty === 'COMPETITIVE',
                );
              }
            }
          }

         return; // Stop here
    }

    // --- BIO/SOCIAL ABILITY TRIGGERS (End of Round) ---
    
    finalPlayers.forEach(p => {
        if (p.isEliminated || p.isGhost) return;
        
        // Find Character Definition - Search ALL pools to be safe
        const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
        const char = p.isBot 
            ? allChars.find(c => c.name === p.name) 
            : selectedCharacter;
            
        if (!char) return;

        let triggered = false;
        let abilityName = "";
        let abilityDesc = "";
        let specificTargetId: string | undefined = undefined;
        let visibility: 'driver_only' | 'target_only' | 'driver_and_target' | 'all' = 'all';

        // BIO-FUEL LOGIC
        if (variant === 'BIO_FUEL' && char.bioAbility) {
            const bName = char.bioAbility.name;
            const roll = Math.random();
            const pickTarget = () => {
                const targets = finalPlayers.filter(fp => fp.id !== p.id && !fp.isEliminated);
                if (targets.length > 0) { const t = targets[Math.floor(Math.random() * targets.length)]; specificTargetId = t.id; return t; }
                return null;
            };

            if (bName === 'DRINKING PARTNER') {
                triggered = true; abilityName = bName; abilityDesc = "You can change your drinking partner";
                visibility = 'driver_only';
            }
            else if (bName === 'DEBUT' && roll < 0.2) {
                triggered = true; abilityName = bName; abilityDesc = "Take a drink to reveal a secret!";
                visibility = 'driver_only';
            }
            else if (bName === 'CORONATION' && roll < 0.1) {
                triggered = true; abilityName = bName; abilityDesc = "Initiate Group Toast!";
                visibility = 'all';
            }
            else if (bName === 'LIQUID AUTHORIZATION') {
                triggered = true; abilityName = bName; abilityDesc = "You cannot release your button next round until Guardian H finishes their sip";
                visibility = 'all';
            }
            else if (bName === 'MOUTH POP' && roll < 0.1) {
                triggered = true; abilityName = bName; abilityDesc = "Pop mouth! Everyone sips!";
                visibility = 'all';
            }
            else if (bName === 'BRAIN FREEZE') {
                if (!frostbyteAbilityUsed && roll < 0.1) {
                    setFrostbyteAbilityUsed(true);
                    const t = pickTarget();
                    if (t) {

                        triggered = true; abilityName = bName; abilityDesc = `${t.name} must Win round or Drink!`;
                        visibility = 'driver_and_target';
                    }
                }
            }
            else if (bName === 'RAINBOW SHOT' && roll < 0.1) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = bName; abilityDesc = `${t.name} mixes two drinks!`;
                    visibility = 'driver_and_target';
                }
            }
            else if (bName === 'SPILL HAZARD' && roll < 0.25) {
                triggered = true; abilityName = bName; abilityDesc = "Accuse someone of spilling — they drink!";
                visibility = 'driver_only';
            }
            else if (bName === 'ON FIRE' && p.id === winnerId) {
                triggered = true; abilityName = bName; abilityDesc = "Everyone except Low Flame drinks!";
                visibility = 'all';
            }
            else if (bName === 'THE EX' && roll < 0.05) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = bName; abilityDesc = "Toast to an ex!";
                    visibility = 'target_only';
                }
            }
            else if (bName === 'SCAVENGE' && roll < 0.02) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = bName; abilityDesc = "You must finish someone else's drink!";
                    visibility = 'target_only';
                }
            }
            else if (bName === 'ROYAL CUP' && roll < 0.05) {
                triggered = true; abilityName = bName; abilityDesc = "The Anointed may make a rule for the game!";
                visibility = 'all';
            }
            else if (bName === 'REASSIGNED' && roll < 0.25) {
                triggered = true; abilityName = bName; abilityDesc = "Executive P may choose 1 player to drink!";
                visibility = 'all';
            }
            else if (bName === 'PACE SETTER' && round % 3 === 0) {
                triggered = true; abilityName = bName; abilityDesc = "Alpha Prime starts a Waterfall!";
                visibility = 'all';
            }
            else if (bName === 'BIG BRAIN' && roll < 0.05) {
                triggered = true; abilityName = bName; abilityDesc = "Pass drink to the left?";
                visibility = 'all';
            }
            else if (bName === 'SPICY' && roll < 0.2) {
                triggered = true; abilityName = bName; abilityDesc = "Everyone drinks!";
                visibility = 'all';
            }
            else if (bName === 'EMERGENCY MEETING' && roll < 0.25) {
                triggered = true; abilityName = bName; abilityDesc = "Gang up on someone!";
                visibility = 'all';
            }
            else if (bName === 'GREEDY GRAB' && roll < 0.05) {
                triggered = true; abilityName = bName; abilityDesc = "Winner burns 40s or drinks!";
                visibility = 'all';
            }
        }
        
        // SOCIAL OVERDRIVE LOGIC
        else if (variant === 'SOCIAL_OVERDRIVE' && char.socialAbility) {
            const sName = char.socialAbility.name;
            const roll = Math.random();
            const pickTarget = () => {
                const targets = finalPlayers.filter(fp => fp.id !== p.id && !fp.isEliminated);
                if (targets.length > 0) { const t = targets[Math.floor(Math.random() * targets.length)]; specificTargetId = t.id; return t; }
                return null;
            };

            if (sName === 'PROM COURT' && roll < 0.1) {
                triggered = true; abilityName = sName; abilityDesc = "Prom King may make a rule for the game!";
                visibility = 'all';
            }
            else if (sName === 'FANCAM') {
                // Handled at start of round
            }
            else if (sName === 'PEOPLE\'S ELBOW' && roll < 0.3) {
                triggered = true; abilityName = sName; abilityDesc = "Challenge to thumb war!";
                visibility = 'all';
            }
            else if (sName === 'PRIVATE DANCE' && roll < 0.3) {
                triggered = true; abilityName = sName; abilityDesc = "Give a command!";
                visibility = 'all';
            }
            else if (sName === 'MISCLICK' && roll < 0.25) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = sName; abilityDesc = `${t.name} must hold bid without using hands!`;
                    visibility = 'driver_and_target';
                }
            }
            else if (sName === 'SAD STORY' && roll < 0.05) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = sName; abilityDesc = "Share a sad story.";
                    visibility = 'target_only';
                }
            }
            else if (sName === 'SUGAR RUSH') {
                // Handled at start of round
            }
            else if (sName === 'COMPLAINT' && roll < 0.15) {
                triggered = true; abilityName = sName; abilityDesc = "Vote on winner's punishment!";
                visibility = 'all';
            }
            else if (sName === 'HOT SEAT' && roll < 0.15) {
                triggered = true; abilityName = sName; abilityDesc = "Choose a player to answer a truth!";
                visibility = 'driver_only';
            }
            else if (sName === 'SNITCH' && roll < 0.05) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = sName; abilityDesc = "Reveal someone's tell!";
                    visibility = 'target_only';
                }
            }
            else if (sName === 'COMMAND SILENCE') {
                // Handled at start of round
            }
            else if (sName === 'CC\'D' && roll < 0.2) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = sName; abilityDesc = `${t.name} must copy your actions next round!`;
                    visibility = 'driver_and_target';
                }
            }
            else if (sName === 'MOG' && roll < 0.1) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = sName; abilityDesc = `${t.name}: 10 pushups or ff next round!`;
                    visibility = 'driver_and_target';
                }
            }
            else if (sName === 'VIRAL MOMENT' && roll < 0.1) {
                const t = pickTarget();
                if (t) {
                    triggered = true; abilityName = sName; abilityDesc = `${t.name} must re-enact a meme!`;
                    visibility = 'driver_and_target';
                }
            }
            else if (sName === 'FRESH CUT' && roll < 0.1) {
                const t = pickTarget();
                triggered = true; abilityName = sName; abilityDesc = t ? `${t.name} must compliment everyone!` : "Compliment everyone!";
                visibility = 'all';
            }
        }

        if (triggered) {
            newAbilities.push({
                player: p.name, playerId: p.id, ability: abilityName, effect: variant === 'BIO_FUEL' ? 'BIO_TRIGGER' : 'SOCIAL_TRIGGER', 
                impactValue: abilityDesc,
                targetId: specificTargetId,
                visibility: visibility
            });
        }
    });

    setActiveAbilities(newAbilities); // Update state for other components

    // --- DETERMINE OVERLAY TYPE ---
    let momentCount = 0; // Track moment flags for triple play
    const roundMomentFlags: string[] = [];

    if (playersOut.length > 0) {
      // Track elimination moment flags for all eliminated players
      setPlayers(prev => prev.map(p => {
        if (playersOut.includes(p.name)) {
          return { ...p, eventDatabasePopups: [...(p.eventDatabasePopups || []), 'ELIMINATED'] };
        }
        return p;
      }));
    } else if (winnerId) { 
       const winnerPlayer = validParticipants[0]; // sorted by bid descending, winner is first
       const secondPlayer = validParticipants.length > 1 ? validParticipants[1] : null;
       const winnerBid = winnerPlayer.currentBid || 0;
       const secondBid = secondPlayer?.currentBid || 0;
       // For CALIBRATION: use absolute bid difference so margin is always non-negative
       const isCalibration = activeProtocol === 'CALIBRATION' && calibrationTarget !== null;
       const margin = isCalibration ? Math.abs(winnerBid - secondBid) : winnerBid - secondBid;

       // 1. Smug Confidence (Round 1 Win)
       if (round === 1 && winnerId === 'p1') {
         addOverlay("smug_confidence", "SMUG CONFIDENCE", `${winnerName} starts strong!`);
         momentCount++;
         roundMomentFlags.push('SMUG_CONFIDENCE');
       }
       
       // 2. Fake Calm (Margin >= 15s)
       if (secondPlayer && margin >= 15 && winnerId === 'p1') {
         setTimeout(() => addOverlay("fake_calm", "FAKE CALM", `Won by ${margin.toFixed(1)}s!`), 500);
         momentCount++;
         roundMomentFlags.push('FAKE_CALM');
       }
       
       // 3. Genius Move (Margin <= 5s)
       if (secondPlayer && margin <= 5 && margin > 0 && winnerId === 'p1') {
         setTimeout(() => addOverlay("genius_move", "GENIUS MOVE", `Won by just ${margin.toFixed(1)}s`), 500);
         momentCount++;
         roundMomentFlags.push('GENIUS_MOVE');
       }
       
       // 4. Easy W (Bid < 20s)
       if (winnerBid < 20 && winnerId === 'p1') {
         setTimeout(() => addOverlay("easy_w", "EASY W", `Won with only ${winnerBid.toFixed(1)}s`), 1000);
         momentCount++;
         roundMomentFlags.push('EASY_W');
       }
       
       // 5. Comeback Hope & Others
       if (winnerId === 'p1') {
           const winnerTokensBefore = players.find(p => p.id === winnerId)?.tokens || 0;
           const minTokens = Math.min(...players.map(p => p.tokens));
           
           // COMEBACK HOPE: only if you started the round as the *sole* last-place player
           // (not tied for last)
           const playersAtMin = players.filter(p => p.tokens === minTokens);
           if (winnerTokensBefore === minTokens && playersAtMin.length === 1 && players.some(p => p.tokens > winnerTokensBefore) && winnerTokensBefore >= 0) {
               setTimeout(() => addOverlay("comeback_hope", "COMEBACK HOPE", `${winnerName} stays in the fight!`), 1000);
               momentCount++;
               roundMomentFlags.push('COMEBACK_HOPE');
           }
           
         // Client SP precision strike (exact second bid)
         if (winnerId === 'p1' && winnerBid > 0) {
           // Use the ORIGINAL bid value from the winner, not the rounded display value
           const winnerParticipant = participants.find(p => p.id === winnerId);
           const originalBid = winnerParticipant?.currentBid || 0;
           const isExactSecond = originalBid > 0 && (Math.round(originalBid * 10) / 10) % 1 === 0;
           if (isExactSecond) {
             setTimeout(() => addOverlay("precision_strike", "PRECISION STRIKE", "Exact second bid!"), 1500);
             momentCount++;
             roundMomentFlags.push('PRECISION_STRIKE');
           }
         }
           
           // Overkill
           if (winnerBid > 60) {
               setTimeout(() => addOverlay("overkill", "OVERKILL", "Massive bid!"), 1500);
               momentCount++;
               roundMomentFlags.push('OVERKILL');
           }
           
           // Clutch
           if (winnerPlayer.remainingTime < 10) {
               setTimeout(() => addOverlay("clutch_play", "CLUTCH PLAY", "Almost out of time!"), 1500);
               momentCount++;
               roundMomentFlags.push('CLUTCH_PLAY');
           }
       }
       // Note: PATCH_NOTES_PENDING and all remaining hidden flags are computed below
       // after all flags have been collected, then stats are tracked in one setPlayers call.       
       // Track protocol wins for the winner (UNDERDOG_VICTORY goes to underdog separately)
       if (winnerId && activeProtocol && activeProtocol !== 'UNDERDOG_VICTORY') {
         setPlayers(prev => prev.map(p => {
           if (p.id === winnerId) {
             return { ...p, protocolWins: [...(p.protocolWins || []), activeProtocol] };
           }
           return p;
         }));
       }

    } else {
       
       // Track DEADLOCK_SYNC for all tied first-place players.
       // On a deadlock round, bids are still deducted, so if the tying players also had
       // equal time banks going in, MIRROR_MATCH will fire too (handled separately below).
       if (participants.length >= 2) {
         const validBidders = [...participants]
           .filter(p => p.currentBid !== null && p.currentBid > 0)
           .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
         if (validBidders.length >= 2) {
           const topBid = validBidders[0].currentBid || 0;
           const tiedIds = validBidders.filter(p => Math.round((p.currentBid || 0) * 10) / 10 === Math.round(topBid * 10) / 10).map(p => p.id);
           if (tiedIds.length >= 2) {
             setPlayers(prev => prev.map(p => {
               if (tiedIds.includes(p.id)) {
                 return { ...p, eventDatabasePopups: [...(p.eventDatabasePopups || []), 'DEADLOCK_SYNC'] };
               }
               return p;
             }));
           }
         }
       }
    }

    if (!winnerId && participants.filter(p => p.currentBid && p.currentBid > 0).length === 0) {
       // Everyone zero bid / abandoned?
       addOverlay("zero_bid", "AFK", "No one dared to bid!");
       // Track AFK flag for all non-eliminated players
       setPlayers(prev => prev.map(p => {
         if (!p.isEliminated) {
           return { ...p, eventDatabasePopups: [...(p.eventDatabasePopups || []), 'AFK'] };
         }
         return p;
       }));
    }

    // SECRET PROTOCOL REVEALS (Underdog / Time Tax)
    if (activeProtocol === 'UNDERDOG_VICTORY') {
        // Find lowest bidder > min bid and not eliminated (FIRE WALL players excluded for both human and bots)
        const minBid = MIN_BID;
        const eligible = finalPlayers.filter(p => {
            const pIsFireWall = abilitiesEnabled && (
                (!p.isBot && selectedCharacter?.id === 'low_flame') ||
                (p.isBot && p.selectedDriver === 'low_flame')
            );
            return !p.isEliminated && (p.currentBid || 0) >= minBid && !pIsFireWall;
        });
        eligible.sort((a, b) => (a.currentBid || 0) - (b.currentBid || 0)); // Ascending
        
        if (eligible.length > 0) {
            const underdog = eligible[0];
            // Award Token
            const idx = finalPlayers.findIndex(p => p.id === underdog.id);
            if (idx !== -1) {
                finalPlayers[idx].tokens += 1;
                finalPlayers[idx].roundImpact = (finalPlayers[idx].roundImpact || "") + " +1 Token (Underdog)";
                if (finalPlayers[idx].impactLogs) finalPlayers[idx].impactLogs!.push({ value: "+1 Token", reason: "Underdog Victory", type: 'gain' });
                
                // Protocol win goes to the underdog player
                const underdogId = underdog.id;
                setPlayers(prev => prev.map(p => {
                  if (p.id === underdogId) {
                    return { ...p, protocolWins: [...(p.protocolWins || []), 'UNDERDOG_VICTORY'] };
                  }
                  return p;
                }));

                extraLogs.push(`>> SECRET REVEALED: UNDERDOG VICTORY! ${underdog.name} wins a trophy for lowest bid!`);
                
                // Show Overlay
                setTimeout(() => {
                    addOverlay("protocol_alert", "SECRET REVEALED", `UNDERDOG VICTORY: ${underdog.name} (+1 Token)`);
                }, 1500); // Delay slightly so main winner shows first
            }
        } else {
             extraLogs.push(`>> SECRET REVEALED: UNDERDOG VICTORY (No eligible winner)`);
             setTimeout(() => {
                addOverlay("protocol_alert", "SECRET REVEALED", "UNDERDOG VICTORY: No eligible winner.");
            }, 1500);
        }
    }

    if (activeProtocol === 'TIME_TAX') {
        // Deduct 10s from everyone not eliminated (FIRE WALL immune — human player and bots)
        let hitList: string[] = [];
        finalPlayers.forEach(p => {
            const isFireWallImmune = abilitiesEnabled && (
                (!p.isBot && selectedCharacter?.id === 'low_flame') ||
                (p.isBot && p.selectedDriver === 'low_flame')
            );
            if (!p.isEliminated && p.remainingTime > 0 && !isFireWallImmune) {
                p.remainingTime = Math.max(0, p.remainingTime - 10.0);
                p.roundImpact = (p.roundImpact || "") + " -10.0s (Time Tax)";
                if (p.impactLogs) p.impactLogs.push({ value: "-10.0s", reason: "Time Tax", type: 'loss' });
                hitList.push(p.name);
                
                // Check if eliminated by tax
                if (p.remainingTime <= 0) {
                    p.isEliminated = true;
                    extraLogs.push(`>> ${p.name} eliminated by Time Tax!`);
                }
            }
        });
        
        extraLogs.push(`>> SECRET REVEALED: TIME TAX! -10s to all survivors.`);
        setTimeout(() => {
            addOverlay("protocol_alert", "SECRET REVEALED", "TIME TAX: -10s to all survivors!");
        }, 1500);
    }

    if (activeProtocol === 'PRIVATE_CHANNEL') {
        const pcPool = [...finalPlayers].filter(p => !p.isEliminated);
        if (pcPool.length >= 2) {
            const pcShuffled = pcPool.sort(() => 0.5 - Math.random());
            const pcA = pcShuffled[0].name;
            const pcB = pcShuffled[1].name;
            extraLogs.push(`>> SECRET REVEALED: PRIVATE CHANNEL! ${pcA} & ${pcB} were secretly linked!`);
            setTimeout(() => {
                addOverlay("protocol_alert", "SECRET REVEALED", `PRIVATE CHANNEL: ${pcA} & ${pcB} were secretly linked!`);
            }, 1500);
        } else {
            extraLogs.push(`>> SECRET REVEALED: PRIVATE CHANNEL (not enough players for link)`);
            setTimeout(() => {
                addOverlay("protocol_alert", "SECRET REVEALED", "PRIVATE CHANNEL: No eligible link this round.");
            }, 1500);
        }
    }

    // TRUTH_DARE: show end-of-round reminder with winner/loser info
    if (activeProtocol === 'TRUTH_DARE') {
        const loserNames = finalPlayers
            .filter(p => !p.isEliminated && p.id !== winnerId)
            .map(p => p.name);
        const sub = winnerId && winnerName
            ? `${winnerName} chooses — ${loserNames.length > 0 ? loserNames.join(', ') : 'others'} who must answer or abide!`
            : 'No winner this round!';
        setTimeout(() => addOverlay("social_event", "TRUTH OR DARE", sub), 2000);
    }

    // CALIBRATION reveal: show results at round end
    if (activeProtocol === 'CALIBRATION' && calibrationTarget !== null) {
      const revealSub = winnerId && winnerName
        ? `${winnerName} was closest to ${calibrationTarget}s with ${winnerTime.toFixed(1)}s!`
        : `Target was ${calibrationTarget}s — no winner this round.`;
      setTimeout(() => addOverlay("protocol_alert", "CALIBRATION RESULTS", revealSub), 1500);
    }

    // LAST ONE STANDING: win final round with at least one elimination this round
    if (winnerId === 'p1' && round === totalRounds) {
      // eliminatedThisRound uses IDs; playersOut uses names - use finalPlayers to check
      const eliminatedThisRound = finalPlayers.filter(p => 
        p.isEliminated && !players.find(op => op.id === p.id)?.isEliminated
      );
      if (eliminatedThisRound.length > 0) {
        setTimeout(() => addOverlay("last_one_standing", "LAST ONE STANDING", "Survivor Victory!"), 2000);
        momentCount++;
        roundMomentFlags.push('LAST_ONE_STANDING');
      }
    }

    // BIO-FUEL Logic: Add drink prompt if applicable
    const finalP1 = finalPlayers.find(p => p.id === 'p1');
    const currentP1 = players.find(p => p.id === 'p1');
    if (variant === 'BIO_FUEL' && finalP1?.isEliminated && !currentP1?.isEliminated) {
         // Stack Bio Event for time out
         setTimeout(() => addOverlay("bio_event", "ELIMINATED! CONSUME BIO-FUEL.", "", 0), 1000);
    }

    // Note: We are now adding overlays directly via addOverlay() above, not setting overlayType variable.
    // So we need to increment momentCount where we call addOverlay() for moment types.

    // LATE PANIC: winner had lowest time bank at round START (reconstruct pre-bid time)
    // SP only - MP uses server-tracked momentFlagsEarned instead
    if (!isMultiplayer && winnerId && participants.length > 0 && round > 1) {
      // Include players eliminated this round, exclude previously eliminated
      const enteredThisRound = players.filter(p =>
        !p.isEliminated || playersOut.includes(p.name)
      );

      const startApproximations = enteredThisRound.map(p => ({
        id: p.id,
        startTime: p.remainingTime + (p.currentBid || 0)
      }));

      const minStartApprox = Math.min(...startApproximations.map(s => s.startTime));
      const playersAtMin = startApproximations.filter(s =>
        Math.abs(s.startTime - minStartApprox) < 0.0001
      );

      const winnerEntry = startApproximations.find(s => s.id === winnerId);
      const winnerIsMin = winnerEntry && winnerEntry.startTime < minStartApprox + 0.0001;
      const winnerIsSoleMin = winnerIsMin && playersAtMin.length === 1;

      if (winnerIsSoleMin) {
        if (winnerId === 'p1') {
          setTimeout(() => {
            addOverlay('late_panic', 'LATE PANIC', 'Won starting the round with the lowest time bank.', 0);
          }, 800);
          momentCount += 1;
        }
        roundMomentFlags.push('LATE_PANIC');
      }
    }

    // Hidden 67: ANY driver who bids within +1.0 of 67s (does not need to win) (should be sp and mp to work with server and overlay)
    const hidden67Players: string[] = [];
    const currentPlayerId = isMultiplayer 
      ? multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id 
      : 'p1';

    // Use participants (original bids) instead of finalPlayers (processed bids)
    participants.forEach(p => {
          const bid = (p.currentBid || 0); // currentBid already includes minBid offset
          if (bid >= 67.0 && bid < 68.0) {
          console.log(`[Hidden 67] ${p.name} bid ${bid}, distance from 67: ${Math.abs(bid - 67)}`); // DEBUG
        // Only show overlay if it's the current player
        if (p.id === currentPlayerId) {
          console.log(`[Hidden 67] Triggering overlay for current player`); // DEBUG
          setTimeout(() => addOverlay('hidden_67', '67', `You hit 67.`, 0), 1000);
          momentCount += 1;
        }
        hidden67Players.push(p.id);
      }
    });

    // Track the flag for all players who hit it (for stats) - SP only
    if (!isMultiplayer && hidden67Players.length > 0) {
      setPlayers(prev => prev.map(p => {
        if (hidden67Players.includes(p.id)) {
          return { ...p, eventDatabasePopups: [...(p.eventDatabasePopups || []), 'HIDDEN_67'] };
        }
        return p;
      }));
    }

    // Hidden Deja Bid: winner bid within ±1.0 of previous win
    // roundLog is read BEFORE new entry added, so previous WIN BID entry is still top
    const prevWinBidEntry = roundLog.find(l => l.startsWith(`>> P1_WIN_BID_R${round - 1}: `));
    const prevWinBid = prevWinBidEntry ? parseFloat(prevWinBidEntry.split(`>> P1_WIN_BID_R${round - 1}: `)[1]) : NaN;
    if (winnerId === 'p1' && !Number.isNaN(prevWinBid) && winnerTime > 0) {
      const dejaBidAlreadyEarned = players.find(p => p.id === 'p1')?.eventDatabasePopups?.includes('HIDDEN_DEJA_BID');
      if (Math.abs(winnerTime - prevWinBid) <= 1.0 && !dejaBidAlreadyEarned) {
        addOverlay('hidden_deja_bid', 'DEJA BID', 'Previous win was with a nearly identical bid.', 0);
        momentCount += 1;
        roundMomentFlags.push('HIDDEN_DEJA_BID');
      }
    }

    // Redline Reversal
    if (winnerId === 'p1' && round === totalRounds) {
        const sortedBefore = [...players].sort((a, b) => {
            if (b.tokens !== a.tokens) return b.tokens - a.tokens;
            return b.remainingTime - a.remainingTime;
        });
        const playerRankBefore = sortedBefore.findIndex(p => p.id === 'p1');
        const firstPlaceTokens = sortedBefore[0]?.tokens;
        const secondPlaceTokens = sortedBefore[1]?.tokens;
        const wasInSecond = playerRankBefore === 1 && firstPlaceTokens !== secondPlaceTokens;

        const sortedAfter = [...finalPlayers].sort((a, b) => {
            if (b.tokens !== a.tokens) return b.tokens - a.tokens;
            return b.remainingTime - a.remainingTime;
        });
        const isNowFirst = sortedAfter[0]?.id === 'p1';

        if (wasInSecond && isNowFirst) {
            console.log(`[REDLINE REVERSAL] SP: p1 came from 2nd (${firstPlaceTokens} vs ${secondPlaceTokens} tokens before) to 1st on round ${round}`);
            addOverlay('hidden_redline_reversal', 'REDLINE REVERSAL', 'Came from 2nd to claim the win on the final round!', 0);
            momentCount++;
            roundMomentFlags.push('HIDDEN_REDLINE_REVERSAL');
        }
    }

    // HIDDEN_REDEMPTION: p1 wins after losing a trophy in a previous round
    if (winnerId === 'p1' && p1LostTrophyPrevRound) {
      console.log(`[HIDDEN REDEMPTION] SP: p1 won after losing a trophy (prev=${p1PrevTokens}, now=${p1TokensBeforeThisRound})`);
      addOverlay('hidden_redemption', 'REDEMPTION', 'Won after a trophy was taken in a previous round.', 0);
      momentCount++;
      roundMomentFlags.push('HIDDEN_REDEMPTION');
    }

    // HIDDEN_NAIL_IN_THE_COFFIN: p1's DISRUPT ability eliminated an opponent this round
    if (!isMultiplayer && abilitiesEnabled) {
      const p1WasEliminated = players.find(p => p.id === 'p1')?.isEliminated || false;
      if (!p1WasEliminated) {
        // Check standard disrupt effects from p1
        const p1DisruptTargets = disruptEffects.filter(d => d.sourceId === 'p1').map(d => d.targetId);
        const newlyEliminatedByDisrupt = finalPlayers.filter(fp => {
          const wasEliminated = players.find(p => p.id === fp.id)?.isEliminated || false;
          return !wasEliminated && fp.isEliminated && p1DisruptTargets.includes(fp.id);
        });
        // Check Cheese Tax: p1 used cheese tax and the winner was eliminated by it
        const p1IsCheeseTax = selectedCharacter?.id === 'the_rind';
        const cheeseTaxEliminated = winnerId && p1IsCheeseTax
          ? finalPlayers.filter(fp => {
              const wasEliminated = players.find(p => p.id === fp.id)?.isEliminated || false;
              return fp.id === winnerId && !wasEliminated && fp.isEliminated;
            })
          : [];
        const nailVictims = [...newlyEliminatedByDisrupt, ...cheeseTaxEliminated];
        if (nailVictims.length > 0) {
          const victimNames = nailVictims.map(p => p.name).join(' & ');
          setTimeout(() => addOverlay('hidden_nail_in_the_coffin', 'NAIL IN THE COFFIN', `Your ability eliminated ${victimNames}!`, 0), 1800);
          momentCount++;
          roundMomentFlags.push('HIDDEN_NAIL_IN_THE_COFFIN');
        }
      }
    }

    // MIRROR_MATCH: 2+ non-eliminated players end the round with time banks within 0.1s.
    // Note: DEADLOCK_SYNC (same bid → no winner) and MIRROR_MATCH (same post-round bank) are
    // distinct flags and both fire correctly in co-occurrence cases — e.g. Round 1 deadlock where
    // all players start with equal banks, or back-to-back deadlocks that keep banks aligned.
    // Stats are tracked directly here for ALL matching players (not via roundMomentFlags),
    // so the flag is recorded even on rounds with no winner (like deadlocks).
    {
      const survivors = finalPlayers.filter(p => !p.isEliminated && p.remainingTime > 0);
      const mirrorMatchIds = new Set<string>();
      for (let i = 0; i < survivors.length; i++) {
        for (let j = i + 1; j < survivors.length; j++) {
          if (Math.abs(survivors[i].remainingTime - survivors[j].remainingTime) <= 0.1) {
            mirrorMatchIds.add(survivors[i].id);
            mirrorMatchIds.add(survivors[j].id);
          }
        }
      }
      // mirrorMatchIds.size >= 2 is always true when non-empty (each pair adds 2 distinct IDs),
      // but explicit >= 2 makes the intent clear.
      if (mirrorMatchIds.size >= 2) {
        setTimeout(() => addOverlay('mirror_match', 'MIRROR MATCH', 'Two players ended with matching time banks!'), 2000);
        momentCount++;
        // Track for ALL involved players regardless of winner status (mirrors server-side logic).
        // Intentionally separate from roundMomentFlags to avoid only tracking the winner.
        if (!isMultiplayer) {
          setPlayers(prev => prev.map(p => {
            if (mirrorMatchIds.has(p.id)) {
              return { ...p, eventDatabasePopups: [...(p.eventDatabasePopups || []), 'MIRROR_MATCH'] };
            }
            return p;
          }));
        }
      }
    }
    
    // PATCH_NOTES_PENDING: 3+ moment flags in same round (tracked as a flag itself)
    if (momentCount >= 3 && winnerId) {
      console.log(`[PATCH NOTES PENDING] SP: p1 triggered ${momentCount} moment flags in round ${round}`);
      setTimeout(() => addOverlay('hidden_patch_notes', 'PATCH NOTES PENDING', 'Triggered 3+ moment flags in one round.', 0), 2500);
      roundMomentFlags.push('PATCH_NOTES_PENDING');
    }

    // Track all moment flags for winner and tied players in eventDatabasePopups (stats)
    if (winnerId && roundMomentFlags.length > 0) {
      setPlayers(prev => prev.map(p => {
        if (p.id === winnerId) {
          return { ...p, eventDatabasePopups: [...(p.eventDatabasePopups || []), ...roundMomentFlags] };
        }
        return p;
      }));
    }


    // Notify all activated abilities
    // Use newAbilities (local) for immediate trigger, update activeAbilities state above
    if (newAbilities.length > 0) {
        setTimeout(() => {
            newAbilities.forEach((ability) => {
               let show = false;
               let title = `${ability.player}: LIMIT BREAK`;
               let desc = `${ability.ability} ACTIVATED`;
               let variant: "default" | "destructive" | null = "default"; // blue/normal
               let className = "text-xl py-6 px-8 border-2 shadow-xl"; // Default larger styles

               // REALITY MODE ABILITIES: Use visibility-based filtering
               if (ability.effect === 'BIO_TRIGGER' || ability.effect === 'SOCIAL_TRIGGER') {
                   const vis = ability.visibility || 'all';
                   if (vis === 'all') show = true;
                   else if (vis === 'driver_only' && ability.playerId === 'p1') show = true;
                   else if (vis === 'target_only' && ability.targetId === 'p1') show = true;
                   else if (vis === 'driver_and_target' && (ability.playerId === 'p1' || ability.targetId === 'p1')) show = true;

                   if (show) {
                       title = `${ability.player}: ${ability.ability}`;
                       desc = `"${ability.impactValue}"`;
                       if (ability.effect === 'BIO_TRIGGER') {
                           className += " bg-orange-950 border-orange-500 text-orange-100";
                       } else {
                           className += " bg-purple-950 border-purple-500 text-purple-100";
                       }
                   }
               }
               // STANDARD ABILITIES: I cast it
               else if (ability.playerId === 'p1') {
                   show = true;
                   if (ability.targetName) {
                       desc += ` on ${ability.targetName}`;
                   }
                   if (ability.effect === 'TIME_REFUND') {
                        desc += " (+TIME)";
                        className += " bg-emerald-950 border-emerald-500 text-emerald-100";
                   } else if (ability.effect === 'TOKEN_BOOST') {
                        desc += " (+TOKENS)";
                        className += " bg-yellow-950 border-yellow-500 text-yellow-100";
                   } else {
                        className += " bg-blue-950 border-blue-500 text-blue-100";
                   }
               } 
               // STANDARD: I was hit
               else if (ability.targetId === 'p1') {
                   show = true;
                   title = `⚠️ WARNING: ${ability.player}`;
                   desc = `${ability.ability} HIT YOU! (-TIME)`;
                   className += " bg-blue-950 border-blue-500 text-blue-100";
               } 
               // STANDARD: Global effect hitting everyone
               else if (ability.targetName === 'ALL OPPONENTS') {
                   show = true;
                   title = `⚠️ GLOBAL THREAT: ${ability.player}`;
                   desc = `${ability.ability} HIT EVERYONE!`;
                   variant = "destructive";
                   className += " bg-orange-950 border-orange-500 text-orange-100";
               }
               // STANDARD: HYPER CLICK special
               else if (ability.ability === 'HYPER CLICK' && ability.effect === 'TOKEN_BOOST' && newAbilities.some(a => a.playerId === 'p1')) {
                   show = true;
                   title = `${ability.player} BONUS!`;
                   desc = "HYPER CLICK AWARDED +1 TOKEN!";
                   className += " bg-purple-950 border-purple-500 text-purple-100";
               }

               if (show) {
                   // Stack Ability Popup - Logic Revised for Clarity & Reduced Clutter
                   
                   let popupType: OverlayType = "ability_trigger";
                   if (ability.effect === 'BIO_TRIGGER') popupType = "bio_event";
                   else if (ability.effect === 'SOCIAL_TRIGGER') popupType = "social_event";
                   
                   // CRITICAL CHANGE: Reverted to original simpler logic as requested
                   // Only show LARGE overlay for:
                   // 1. Reality Mode Events (Bio/Social)
                   // 2. Global Threats (hitting everyone)
                   // 3. "Major" abilities (like The Mole, or special win conditions if desired)
                   // STANDARD PASSIVES (Time Refunds / Token Boosts / Single Target Disrupts) DO NOT get a large overlay.
                   
                   const isMajorEvent = 
                       popupType === 'bio_event' || 
                       popupType === 'social_event' || 
                       ability.targetName === 'ALL OPPONENTS' || 
                       ability.ability === 'HYPER CLICK' || // Optional exception
                       ability.ability === 'MOLE WIN';

                   if (isMajorEvent) {
                       addOverlay(popupType, title, desc, 0);
                   }
                   
                   // Toast shows for EVERYTHING (History & Context)
                   // EXCEPTION: Don't show toast for events that already got a huge popup? 
                   // User said: "Lets get rid of the bottom right toast popup all together"
                   
                   // TOAST REMOVED AS REQUESTED
               }
            });
        }, 500); 
    }
    
    // Add to log
    const logMsg = winnerId 
      ? `Round ${round}: ${winnerName} won (${formatTime(winnerTime)})` 
      : `Round ${round}: No winner`;

    // Add extra logs for special events
    // Log array already initialized at start of function
    
    // Mole Penalty Log (only source - not duplicated in player map)
    if (activeProtocol === 'THE_MOLE' && winnerId === moleTarget) {
        const rawSorted = [...participants].sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
        const rawWinner = rawSorted[0];
        const rawSecond = rawSorted[1];
        const rawWinnerTime = rawWinner?.currentBid || 0;
        const rawSecondTime = rawSecond?.currentBid || 0;
        const margin = rawWinnerTime - rawSecondTime;

        if (margin > 7) {
          extraLogs.push(`>> MOLE FAILURE: ${winnerName} won by ${margin.toFixed(1)}s and LOST 2 trophies!`);
          setTimeout(() => addOverlay("protocol_alert", "MOLE REVEALED", `${winnerName} won by ${margin.toFixed(1)}s and LOST 2 trophies!`), 1500);
        } else {
          extraLogs.push(`>> MOLE SAFE WIN: ${winnerName} won by ${margin.toFixed(1)}s (<= 7.0s). Trophy awarded as normal.`);
          setTimeout(() => addOverlay("protocol_alert", "MOLE REVEALED", `${winnerName} was the Mole and won safely (${margin.toFixed(1)}s margin).`), 1500);
        }
    }

    // Ability Token Boost Log (Click-Click etc)
    // We can check if any ability result was a token boost
    newAbilities.forEach(ab => {
        if (ab.effect === 'TOKEN_BOOST') {
             extraLogs.push(`>> ${ab.player} GAINED TOKENS!`);
        }
    });

    const winBidEntry = (winnerId === 'p1' && winnerTime > 0) ? [`>> WIN BID: ${winnerTime.toFixed(1)}`] : [];
    const dejaBidTracker = (winnerId === 'p1' && winnerTime > 0) ? [`>> P1_WIN_BID_R${round}: ${winnerTime.toFixed(1)}`] : [];
    setRoundLog(prev => [...extraLogs, ...winBidEntry, ...dejaBidTracker, logMsg, ...prev]);

    // Check game end conditions
    const remainingActivePlayers = updatedPlayers.filter(p => !p.isEliminated && p.remainingTime > 0);
    const eliminatedThisRound = updatedPlayers.filter(p => p.isEliminated && !players.find(op => op.id === p.id)?.isEliminated).map(p => p.id);
    
    // Record singleplayer snapshot
    if (!isMultiplayer) {
      const snapshotType = eliminatedThisRound.length > 0 ? 'elimination' : 'round_end';
      recordSingleplayerSnapshot(
        snapshotType as 'round_end' | 'elimination',
        updatedPlayers,
        round,
        winnerId,
        winnerTime,
        eliminatedThisRound,
        activeProtocol
      );
    }
    
    if (round >= totalRounds || (variant !== 'HAUNTED' && remainingActivePlayers.length <= 1)) {
       // Game End condition

       // Award SP Bonus Trophies if protocols are enabled (before final placement sort)
       let playersForSummary = updatedPlayers;
       let spBonusResults: SpBonusTrophyResult[] = [];
       if (!isMultiplayer && protocolsEnabled && bonusTrophiesEnabled) {
         spBonusResults = calculateSpBonusTrophies(updatedPlayers);
         if (spBonusResults.length > 0) {
           playersForSummary = updatedPlayers.map(p => {
             const totalBonus = spBonusResults.reduce((sum, br) =>
               br.winnerIds.includes(p.id) ? sum + br.trophiesPerWinner : sum, 0);
             return totalBonus > 0 ? { ...p, tokens: p.tokens + totalBonus } : p;
           });
           setPlayers(playersForSummary);
           spBonusResults.forEach(bonusResult => {
             const subMsg = `${bonusResult.winnerNames.join(' & ')} +${bonusResult.trophiesPerWinner} 🏆\n${bonusResult.criterionDesc}`;
             addOverlay("bonus_trophy", bonusResult.criterionName, subMsg, 0);
           });
         }
       }

       setTimeout(() => {
        // Keep any end-of-round overlays (moment flags / protocol notices) visible into game over.
        // We only switch phase; overlays are dismissed by the player.
        setPhase('game_end');
        
        // Record game over snapshot and summary
        if (!isMultiplayer) {
          recordSingleplayerSnapshot('game_over', playersForSummary, round, winnerId, winnerTime, eliminatedThisRound, activeProtocol);
          
          const sorted = [...playersForSummary].sort((a, b) => {
            if (b.tokens !== a.tokens) return b.tokens - a.tokens;
            return b.remainingTime - a.remainingTime;
          });
          const gameId = singleplayerGameIdRef.current;
          if (gameId) {
            fetch('/api/game/summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId,
                lobbyCode: null,
                totalRounds: round,
                gameSettings: { difficulty, variant, gameDuration, protocolsEnabled, bonusTrophiesEnabled, abilitiesEnabled },
                playerResults: sorted.map((p, i) => ({
                  playerId: p.id,
                  playerName: p.name,
                  driverId: p.selectedDriver || selectedCharacter?.id || null,
                  finalRank: i + 1,
                  tokens: p.tokens,
                  remainingTime: p.remainingTime,
                  totalTimeBid: p.totalTimeBid,
                  netImpact: p.netImpact,
                  isEliminated: p.isEliminated,
                  isBot: p.id !== 'p1',
                  momentFlags: p.eventDatabasePopups?.length || 0,
                  protocolWins: p.protocolWins?.length || 0,
                  totalDrinks: p.totalDrinks || 0,
                  socialDares: p.socialDares || 0,
                })),
                bonusTrophyResults: spBonusResults.map(r => ({
                  criterion: r.criterion,
                  criterionName: r.criterionName,
                  winnerIds: r.winnerIds,
                  winnerNames: r.winnerNames,
                  trophiesAwarded: r.trophiesPerWinner,
                })),
                winnerId: sorted[0]?.id || null,
                winnerName: sorted[0]?.name || null,
              }),
            }).catch(() => {});

            // ── End-game credit conversion (server-side, idempotent) ──
            // Only convert for the human player (p1).
            const humanPlayer = sorted.find((p: any) => p.id === 'p1');
            if (humanPlayer) {
              const isHumanWinner = sorted[0]?.id === 'p1';
              const humanTrophies = humanPlayer.tokens || 0;
              const humanFlags = humanPlayer.eventDatabasePopups?.length || 0;
              const humanFlagTypes = humanPlayer.eventDatabasePopups || [];
              convertGameCredits(gameId, humanTrophies, humanFlags, isHumanWinner, variant, false, humanFlagTypes, difficulty === 'COMPETITIVE');
            }
          }
        }
      }, 3000);
    }
  };

  const nextRound = () => {
    // Check if all players are eliminated
    // In Haunted mode: ghosts are still in-game (can revive), so count them as active
    const activePlayers = variant === 'HAUNTED'
      ? players.filter(p => !p.isEliminated)          // alive + ghosts (ghosts may revive)
      : players.filter(p => !p.isEliminated && p.remainingTime > 0);

    // Haunted mode: only end the game at the round limit, or if truly nobody can play (all eliminated)
    const gameOver = variant === 'HAUNTED'
      ? (activePlayers.length === 0 || round >= totalRounds)
      : (activePlayers.length <= 1 || round >= totalRounds);

    if (gameOver) {
      // End game
      setPhase('game_end');
      return;
    }
    
    if (round < totalRounds) {
      // STRICT LIFECYCLE: Clear only timed overlays; preserve manual-dismiss (duration=0) ones
      // so important notifications (death wish result, ghost touch miss, etc.) can be read.
      setActiveProtocol(null); // Reset protocol so ready phase isn't affected by last round's protocol
      setOverlays(prev => prev.filter(o => (o.duration ?? 0) === 0));
      setAnimations([]);
      
      setRound(prev => prev + 1);
      setPhase('ready');
      setPlayers(prev => prev.map(p => ({ 
          ...p, 
          isHolding: false, 
          currentBid: null, 
          roundImpact: undefined,
          impactLogs: undefined // Clear logs for next round
      }))); 
      setReadyHoldTime(0);
      setPlayerAbilityUsed(false); // Reset ability usage
      setPeekTargetId(null); // Clear PEEK target
      setScrambledPlayers([]); // Clear Scrambled players
    }
  };

  // Auto-advance round_end when only bots remain active (ghost spectator mode in haunted)
  useEffect(() => {
    if (phase !== 'round_end' || !isBotOnlyRound) return;
    const timer = setTimeout(() => nextRound(), 1500);
    return () => clearTimeout(timer);
  }, [phase, isBotOnlyRound]);

  // Auto-advance round_end when ALL players are ghosts (all-ghost tie round in haunted SP)
  useEffect(() => {
    if (phase !== 'round_end' || isMultiplayer || variant !== 'HAUNTED') return;
    const allGhosted = players.filter(p => !p.isEliminated).length > 0 &&
      players.filter(p => !p.isEliminated).every(p => p.isGhost);
    if (!allGhosted) return;
    const timer = setTimeout(() => nextRound(), 2000);
    return () => clearTimeout(timer);
  }, [phase, players, isMultiplayer, variant]);

  const selectRandomCharacter = () => {
      // Pool based on variant
      let pool = [...CHARACTERS];
      if (variant === 'SOCIAL_OVERDRIVE') pool = [...pool, ...SOCIAL_CHARACTERS];
      if (variant === 'BIO_FUEL') pool = [...pool, ...BIO_CHARACTERS];
      
      const randomChar = pool[Math.floor(Math.random() * pool.length)];
      selectCharacter(randomChar);
  };

  const selectCharacter = (char: Character) => {
    setSelectedCharacter(char);
    // Assign random characters to bots now that player has chosen
    assignBotCharacters(char);

    const pickIcon = (c: Character) => {
      if (variant === 'HAUNTED' && c.imageHaunted) return c.imageHaunted;
      if (variant === 'SOCIAL_OVERDRIVE' && c.imageSocial) return c.imageSocial;
      if (variant === 'BIO_FUEL' && c.imageBio) return c.imageBio;
      return c.image;
    };
    
    setPlayers(prev => prev.map(p => {
      if (p.id === 'p1') {
        return { ...p, name: char.name, characterIcon: pickIcon(char), selectedDriver: char.id };
      }
      return p;
    }));
    
    // Generate new singleplayer gameId when starting a game
    if (!isMultiplayer) {
      const newGameId = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setSingleplayerGameId(newGameId);
      singleplayerGameIdRef.current = newGameId;
    }
    
    // In Haunted mode, go to item selection screen instead of ready
    if (variant === 'HAUNTED') {
      setPhase('haunted_item_select');
    } else {
      setPhase('ready');
    }
  };

  // Computed players list for display - uses multiplayer state when available
  const displayPlayers = isMultiplayer && multiplayerGameState?.players
    ? multiplayerGameState.players.map(mp => ({
        id: mp.id,
        name: mp.name,
        isBot: mp.isBot,
        tokens: mp.tokens,
        remainingTime: mp.remainingTime,
        isEliminated: mp.isEliminated,
        isGhost: (mp as any).isGhost || false,
        ghostImage: (mp as any).ghostImage || undefined,
        ghostReason: (mp as any).ghostReason || undefined,
        selectedItem: (mp as any).selectedItem || undefined,
        relicConsumed: (mp as any).relicConsumed || false,
        ghostAbility: (mp as any).ghostAbility || null,
        ghostAbilityUsed: (mp as any).ghostAbilityUsed || false,
        possessionRoundsLeft: (mp as any).possessionRoundsLeft ?? undefined,
      currentBid: mp.currentBid,
        isHolding: mp.isHolding,
        totalTimeBid: (mp as any).totalTimeBid || 0,
        netImpact: (mp as any).netImpact || 0,
      roundImpact: (mp as any).roundImpacts?.length > 0 
      ? (mp as any).roundImpacts
          .filter((ri: any) => {
            // Don't show PENALTY impacts on player cards until round_end
            if (ri.type === 'PENALTY' && 
                multiplayerGameState?.phase !== 'round_end' && 
                multiplayerGameState?.phase !== 'game_over') {
              return false;
            }
            return true;
          })
          .map((ri: any) => `${ri.value > 0 ? '+' : ''}${ri.value.toFixed(1)}s (${ri.source})`).join(', ') || undefined
      : undefined,
      impactLogs: (mp as any).roundImpacts
      ?.filter((ri: any) => {
        if (ri.type === 'PENALTY' && 
            multiplayerGameState?.phase !== 'round_end' && 
            multiplayerGameState?.phase !== 'game_over') {
          return false;
        }
        return true;
      })
      .map((ri: any) => ({
        value: `${ri.value > 0 ? '+' : ''}${ri.value.toFixed(1)}s`,
        reason: ri.source,
        type: ri.value > 0 ? 'gain' as const : 'loss' as const,
      })) || [],
        specialEvents: [],
        eventDatabasePopups: (mp as any).momentFlagsEarned || [],
        protocolsTriggered: [],
        protocolWins: (mp as any).protocolWinsEarned || [],
        totalDrinks: 0,
        socialDares: 0,
        selectedDriver: (mp as any).selectedDriver,
        abilityUsed: (mp as any).abilityUsed || false,
        characterIcon: (() => {
          // In Haunted mode, ghosts get a random ghost image from the ghostImage key
          if ((mp as any).isGhost && variant === 'HAUNTED') {
            const ghostKey = (mp as any).ghostImage as string | undefined;
            if (ghostKey) {
              const idx = parseInt(ghostKey.replace('hnt_ghost_', ''), 10) - 1;
              if (!isNaN(idx) && idx >= 0 && idx < GHOST_IMAGES.length) return GHOST_IMAGES[idx];
            }
            return GHOST_IMAGES[Math.floor(Math.random() * GHOST_IMAGES.length)];
          }
          const driverId = (mp as any).selectedDriver;
          if (!driverId) return undefined;
          const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
          const char = allChars.find(c => c.id === driverId);
          if (!char) return undefined;
          // Use variant-specific image based on game settings
          if (variant === 'HAUNTED' && char.imageHaunted) return char.imageHaunted;
          if (variant === 'SOCIAL_OVERDRIVE' && char.imageSocial) return char.imageSocial;
          if (variant === 'BIO_FUEL' && char.imageBio) return char.imageBio;
          return char.image;
        })(),
        driverName: (() => {
          const driverId = (mp as any).selectedDriver;
          if (!driverId) return undefined;
          const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
          const char = allChars.find(c => c.id === driverId);
          return char?.name;
        })(),
        driverAbility: (() => {
          const driverId = (mp as any).selectedDriver;
          if (!driverId) return undefined;
          const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
          const char = allChars.find(c => c.id === driverId);
          if (!char) return undefined;
          // Use variant-specific ability
          if (variant === 'SOCIAL_OVERDRIVE' && char.socialAbility) return char.socialAbility.description;
          if (variant === 'BIO_FUEL' && char.bioAbility) return char.bioAbility.description;
          return char.ability?.description;
        })(),
        roundEndAcknowledged: (mp as any).roundEndAcknowledged || false,
      } as Player))
    : players;

  // Get current player's bid/holding status for multiplayer (match by socketId)
  const myMultiplayerPlayer = isMultiplayer && multiplayerGameState?.players && socket
    ? multiplayerGameState.players.find(p => p.socketId === socket.id)
    : null;

  // Computed values for bidding phase that work in both modes
  const currentPlayerIsHolding = isMultiplayer 
    ? (myMultiplayerPlayer?.isHolding ?? false)
    : (players.find(p => p.id === 'p1')?.isHolding ?? false);
    
  // For multiplayer: use currentBid if released, or elapsedTime if still holding
  const currentPlayerBid = isMultiplayer
  ? (myMultiplayerPlayer?.isHolding 
      ? (multiplayerGameState?.elapsedTime ?? 0) 
      : (myMultiplayerPlayer?.currentBid ?? 0))
  : currentTime;
    
  const currentPlayerEliminated = isMultiplayer
    ? (myMultiplayerPlayer?.isEliminated ?? false)
    : (players.find(p => p.id === 'p1')?.isEliminated ?? false);

  const currentPlayerIsGhost = isMultiplayer
    ? (myMultiplayerPlayer?.isGhost ?? false)
    : (players.find(p => p.id === 'p1')?.isGhost ?? false);

  // MP ghost ability auto-activation: for purgatory, emit resolve_ghost_ability automatically
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isMultiplayer || !socket || variant !== 'HAUNTED') return;
    const ghostPlayer = myMultiplayerPlayer;
    if (!ghostPlayer || !(ghostPlayer as any).isGhost || (ghostPlayer as any).ghostAbilityUsed) return;
    const ability = (ghostPlayer as any).ghostAbility as GhostAbilityType;
    if (!ability) return;
    if (ability === 'purgatory') {
      socket.emit('resolve_ghost_ability', { ability }, (res: any) => {
        if (res?.success) {
          addOverlay('ability_trigger', '🌑 PURGATORY', 'You enter purgatory — you will return in 2 rounds with at least 45s or the lowest alive player\'s time bank.', 0);
        }
      });
    }
    // reaper is handled by the UI panel (player picks target)
  // intentional: run whenever ghost ability/used state changes
  }, [isMultiplayer, socket, variant,
    (myMultiplayerPlayer as any)?.ghostAbility,
    (myMultiplayerPlayer as any)?.ghostAbilityUsed,
    (myMultiplayerPlayer as any)?.isGhost,
  ]);

  // Now define playerIsReady and playerBid AFTER currentPlayerIsHolding is defined
  const playerIsReady = isMultiplayer 
    ? currentPlayerIsHolding 
    : (players.find(p => p.id === 'p1')?.isHolding ?? false);
  const playerBid = isMultiplayer
    ? (myMultiplayerPlayer?.currentBid ?? null)
    : (players.find(p => p.id === 'p1')?.currentBid ?? null);
  const allPlayersReady = players.filter(p => !p.isEliminated && !p.isGhost).every(p => p.isHolding);

  // New logic for 'waiting' state
  const isWaiting = phase === 'bidding' && playerBid !== null && playerBid > 0;

  // Multiplayer handlers
  const handleCreateRoom = useCallback(() => {
    if (!socket || !isConnected) {
      setLobbyError("Not connected to server");
      return;
    }
    
    setLobbyError(null);
    
    // Send current game settings to the lobby
    // Map local gameDuration ('short') to server format ('sprint')
    const serverDuration = gameDuration === 'short' ? 'sprint' : gameDuration;
    const settings = {
      difficulty,
      protocolsEnabled,
      bonusTrophiesEnabled,
      abilitiesEnabled,
      variant,
      gameDuration: serverDuration,
      allowedProtocols
    };
    
    socket.emit("create_lobby", { playerName, settings, isPublic: isPublicLobby }, (response: { success: boolean; code?: string; lobby?: typeof currentLobby; error?: string }) => {
      if (response.success && response.lobby) {
        console.log('[Lobby] Created:', response.code);
        setCurrentLobby(response.lobby);
        setLobbyCode(response.code || '');
        if (response.code) {
          localStorage.setItem(`redline_player_${response.code.toUpperCase()}`, JSON.stringify({ playerName }));
        }
      } else {
        setLobbyError(response.error || "Failed to create lobby");
      }
    });
  }, [socket, isConnected, playerName, difficulty, protocolsEnabled, bonusTrophiesEnabled, abilitiesEnabled, variant, gameDuration, isPublicLobby]);
  
  const handleJoinRoom = useCallback(() => {
    if (!socket || !isConnected) {
      setLobbyError("Not connected to server");
      return;
    }
    
    if (lobbyCode.length < 4) {
      setLobbyError("Please enter a valid 4-character code");
      return;
    }
    
    setLobbyError(null);
    socket.emit("join_lobby", { code: lobbyCode, playerName }, (response: { success: boolean; lobby?: typeof currentLobby; error?: string }) => {
      if (response.success && response.lobby) {
        console.log('[Lobby] Joined:', response.lobby.code);
        setCurrentLobby(response.lobby);
        localStorage.setItem(`redline_player_${lobbyCode.toUpperCase()}`, JSON.stringify({ playerName }));
      } else if (response.error === "Game already in progress") {
        socket.emit("rejoin_game", { code: lobbyCode, playerName }, (rejoinResponse: { success: boolean; lobby?: typeof currentLobby; error?: string }) => {
          if (rejoinResponse.success && rejoinResponse.lobby) {
            console.log('[Lobby] Rejoined active game:', rejoinResponse.lobby.code);
            setCurrentLobby(rejoinResponse.lobby);
            setIsMultiplayer(true);
            localStorage.setItem(`redline_player_${lobbyCode.toUpperCase()}`, JSON.stringify({ playerName }));
          } else {
            setLobbyError("Game in progress. Make sure you're using the same name you joined with.");
          }
        });
      } else {
        setLobbyError(response.error || "Failed to join lobby");
      }
    });
  }, [socket, isConnected, lobbyCode, playerName]);

  const handleJoinRandomRoom = useCallback(() => {
    if (!socket || !isConnected) {
      setLobbyError("Not connected to server");
      return;
    }
    
    setLobbyError(null);
    socket.emit("join_random_lobby", { playerName }, (response: { success: boolean; lobby?: typeof currentLobby; error?: string }) => {
      if (response.success && response.lobby) {
        console.log('[Lobby] Joined random:', response.lobby.code);
        setCurrentLobby(response.lobby);
        setLobbyCode(response.lobby.code);
        localStorage.setItem(`redline_player_${response.lobby.code.toUpperCase()}`, JSON.stringify({ playerName }));
      } else {
        setLobbyError(response.error || "No public lobbies available");
      }
    });
  }, [socket, isConnected, playerName]);

  const handleLeaveLobby = useCallback(() => {
    if (!socket) return;
    
    socket.emit("leave_lobby", () => {
      setCurrentLobby(null);
      setLobbyCode("");
      setLobbyError(null);
    });
  }, [socket]);

  const handleToggleReady = useCallback(() => {
    if (!socket) return;
    
    socket.emit("toggle_ready", (response: { success: boolean; isReady?: boolean }) => {
      console.log('[Lobby] Ready toggled:', response.isReady);
    });
  }, [socket]);

  const handleSelectDriver = useCallback((driverId: string) => {
    if (!socket) return;
    
    socket.emit("select_driver", { driverId }, (response: { success: boolean; driverId?: string }) => {
      console.log('[Lobby] Driver selected:', response.driverId);
    });
  }, [socket]);

  // Track if we're the host (use ref to avoid triggering effect when lobby updates)
  const isHostRef = useRef(false);
  useEffect(() => {
    isHostRef.current = !!(socket && currentLobby && socket.id === currentLobby.hostSocketId);
  }, [socket, currentLobby]);

  // Sync lobby settings when host changes them (only when actual settings change)
  const prevSettingsRef = useRef<string>('');
  useEffect(() => {
    if (!socket || !isHostRef.current) return;
    
    // Map local gameDuration to server format
    const serverDuration = gameDuration === 'short' ? 'sprint' : gameDuration;
    
    // Build settings string to detect actual changes
    const settingsKey = JSON.stringify({ difficulty, protocolsEnabled, bonusTrophiesEnabled, abilitiesEnabled, variant, gameDuration: serverDuration, allowedProtocols });
    if (settingsKey === prevSettingsRef.current) return;
    prevSettingsRef.current = settingsKey;
    
    socket.emit("update_lobby_settings", { 
      settings: {
        difficulty,
        protocolsEnabled,
        bonusTrophiesEnabled,
        abilitiesEnabled,
        variant,
        gameDuration: serverDuration,
        allowedProtocols
      }
    });
    console.log('[Lobby] Settings updated:', { difficulty, protocolsEnabled, bonusTrophiesEnabled, abilitiesEnabled, variant, gameDuration: serverDuration });
  }, [socket, difficulty, protocolsEnabled, bonusTrophiesEnabled, abilitiesEnabled, variant, gameDuration, allowedProtocols]);

  const handleStartMultiplayerGame = useCallback(() => {
    if (!socket) return;
    
    socket.emit("start_game", { duration: gameDuration }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setLobbyError(response.error || "Failed to start game");
      } else {
        console.log('[Game] Starting multiplayer game...');
      }
    });
  }, [socket, gameDuration]);

  const handleMultiplayerBidRelease = useCallback(() => {
    if (!socket || !isMultiplayer) return;
    
    socket.emit("player_release", () => {
      console.log('[Game] Released bid');
    });
  }, [socket, isMultiplayer]);

  const quitGame = () => {
     // Reset multiplayer state
     if (isMultiplayer && socket) {
       socket.emit("leave_lobby");
     }
     setIsMultiplayer(false);
     setMultiplayerGameState(null);
     setCurrentLobby(null);
     setLobbyCode("");
     eliminationPopupShownRef.current = false; // Reset elimination popup tracking for new games
     p1PrevRoundStartTokensRef.current = null; // Reset trophy-loss tracking for new games
     bonusTrophiesAwardedRef.current = false; // Reset bonus trophy tracking for new games
     
     setPhase('intro');
     setRound(1);
     setOverlay(null);
     setRoundLog([]);
     const time = getInitialTime();
     setPlayers([
        { 
            id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: time, isEliminated: false, currentBid: null, isHolding: false,
            totalTimeBid: 0, netImpact: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
        },
        ...createRandomBots(time),
     ]);
  };

  // Render Helpers
  const renderPhaseContent = () => {
    // In multiplayer, use server phase if available
    const effectivePhase = isMultiplayer && multiplayerGameState?.phase 
      ? multiplayerGameState.phase 
      : phase;
    
    // Handle multiplayer waiting_for_ready phase - uses same UI as singleplayer ready phase
    if (effectivePhase === 'waiting_for_ready' && isMultiplayer) {
      const activeHumanPlayers = displayPlayers.filter(p => !p.isBot && !p.isEliminated);
      const readyPlayers = activeHumanPlayers.filter(p => p.isHolding);
      const allHumansReady = activeHumanPlayers.length > 0 && readyPlayers.length === activeHumanPlayers.length;
      const currentPlayerEliminated = myMultiplayerPlayer?.isEliminated;
      
      return (
        <div className="flex flex-col items-center justify-center h-[450px]">
          <div className="h-[100px] flex flex-col items-center justify-center space-y-2">
            <h2 className="text-3xl font-display">ROUND {multiplayerGameState?.round || 1} / {multiplayerGameState?.totalRounds || totalRounds}</h2>
            <div className="h-6 flex items-center justify-center">
              {currentPlayerEliminated ? (
                <p className="text-zinc-500 text-sm">Spectating - waiting for other players</p>
              ) : allHumansReady && multiplayerGameState?.allHumansHoldingStartTime ? (
                <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </div>
              ) : allHumansReady ? (
                <p className="text-yellow-400 text-sm">Hold for 3 seconds to start...</p>
              ) : (
                <p className="text-muted-foreground text-sm">All players must hold button to start</p>
              )}
            </div>
          </div>
          
          <div className="h-[280px] flex items-center justify-center">
            {currentPlayerEliminated ? (
              <div className="text-zinc-600 text-lg uppercase tracking-widest">ELIMINATED</div>
            ) : currentPlayerIsGhost && variant === 'HAUNTED' ? (
              <div className="text-center space-y-2">
                <div className="text-3xl">👻</div>
                <p className="text-teal-300 text-sm font-bold">YOU ARE A GHOST</p>
                <p className="text-zinc-500 text-xs">Waiting for the round to begin…</p>
              </div>
            ) : (
              <AuctionButton 
                onPress={handlePress} 
                onRelease={handleRelease} 
                isPressed={currentPlayerIsHolding}
                showPulse={!currentPlayerIsHolding}
              />
            )}
          </div>
          
          <div className="h-[50px] flex flex-col items-center justify-start gap-2">
            <div className="flex gap-2">
              {activeHumanPlayers.map(p => (
                <div 
                  key={p.id} 
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors duration-300",
                    p.isHolding ? "bg-primary shadow-[0_0_10px_var(--color-primary)]" : "bg-zinc-800"
                  )} 
                  title={p.name} 
                />
              ))}
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              {readyPlayers.length} / {activeHumanPlayers.length} READY
            </p>
          </div>
        </div>
      );
    }
    
    // Map multiplayer phases to local phases for rendering
    const renderPhase = isMultiplayer 
      ? (effectivePhase === 'driver_selection' ? 'mp_driver_select' 
        : effectivePhase === 'round_end' ? 'round_end' 
        : effectivePhase === 'game_over' ? 'game_end'
        : effectivePhase)
      : phase;

    // Handle OVERCLOCK phase (both singleplayer and multiplayer)
    if (renderPhase === 'overclock') {
      const mpClickCounts = isMultiplayer ? (multiplayerGameState?.overclockClickCounts || {}) : overclockClickCounts;
      const myId = isMultiplayer ? myMultiplayerPlayer?.id : 'p1';
      const myClicks = myId ? (mpClickCounts[myId] || 0) : 0;
      const myEliminated = isMultiplayer ? myMultiplayerPlayer?.isEliminated : players.find(p => p.id === 'p1')?.isEliminated;
      const timeDisplay = isMultiplayer ? '...' : overclockTimeLeft;
      const sortedForDisplay = displayPlayers.filter(p => !p.isEliminated).map(p => ({
        ...p,
        clicks: mpClickCounts[p.id] || 0,
      })).sort((a, b) => b.clicks - a.clicks);

      return (
        <div className="flex flex-col items-center justify-center h-[450px] space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display text-yellow-400 tracking-widest">⚡ OVERCLOCK</h2>
            <p className="text-zinc-400 text-sm mt-1">Click the button as many times as you can!</p>
            <div className="mt-2 text-4xl font-mono text-white font-bold">
              {isMultiplayer ? '15s' : `${timeDisplay}s`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-yellow-300">{myClicks}</div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Your Clicks</p>
          </div>
          <div>
            {myEliminated ? (
              <div className="text-zinc-600 text-lg uppercase tracking-widest">ELIMINATED</div>
            ) : (
              <AuctionButton
                onPress={handlePress}
                onRelease={() => {}}
                isPressed={false}
                showPulse={overclockActive || (isMultiplayer && effectivePhase === 'overclock')}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            {sortedForDisplay.map(p => (
              <div key={p.id} className="flex flex-col items-center bg-zinc-900 rounded px-3 py-1 border border-zinc-700">
                <span className="text-xs text-zinc-400">{p.name}</span>
                <span className="text-lg font-mono font-bold text-yellow-300">{p.clicks}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    switch (renderPhase) {
      case 'intro':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-4 sm:space-y-8 text-center max-w-2xl mx-auto mt-8 sm:mt-20 px-2"
          >
            {/* Protocol Selection Dialog */}
            <Dialog open={showProtocolSelect} onOpenChange={setShowProtocolSelect}>
                <DialogContent className="bg-zinc-950 border-white/10 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-zinc-100 font-display tracking-widest">PROTOCOL CONFIGURATION</DialogTitle>
                        <DialogDescription>
                            Select allowed protocols for this session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {/* STANDARD */}
                        <details className="rounded-lg border border-red-500/20 bg-red-950/15 overflow-hidden" data-testid="section-protocol-config-standard">
                          <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={14} className="text-red-400" />
                              <div className="text-sm font-bold text-red-200 tracking-widest">STANDARD PROTOCOLS</div>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-red-300/70">{allowedProtocols.filter(p => !['TRUTH_DARE','SWITCH_SEATS','HUM_TUNE','LOCK_ON','NOISE_CANCEL','HYDRATE','BOTTOMS_UP','PARTNER_DRINK','WATER_ROUND'].includes(p as any)).length} selected</div>
                          </summary>

                          <div className="px-4 pb-4 space-y-3">
                            {/* Standard sub-categories */}
                            {[
                              {
                                id: 'standard_hud',
                                title: 'HUD & MECHANICS',
                                subtitle: 'Visibility & Interaction ',
                                items: [
                                  { id: 'DATA_BLACKOUT', label: 'DATA BLACKOUT', desc: 'Hides all timers' },
                                  { id: 'SYSTEM_FAILURE', label: 'SYSTEM FAILURE', desc: 'HUD glitches & scramble' },
                                  { id: 'OVERCLOCK', label: 'OVERCLOCK', desc: 'Click race: most clicks wins, least loses 35s' },
                                  { id: 'CALIBRATION', label: 'CALIBRATION', desc: 'Hold closest to a random target time to win' },
                                ]
                              },
                              {
                                id: 'standard_stakes',
                                title: 'STAKES & PAYOUTS',
                                subtitle: 'Economy modifiers',
                                items: [
                                  { id: 'DOUBLE_STAKES', label: 'HIGH STAKES', desc: 'Double tokens for winner' },
                                  { id: 'PANIC_ROOM', label: 'PANIC ROOM', desc: '2x Speed (also doubles win tokens)' },
                                ]
                              },
                              {
                                id: 'standard_social',
                                title: 'TABLE RULES',
                                subtitle: 'Social & physical constraints',
                                items: [
                                  { id: 'OPEN_HAND', label: 'OPEN HAND', desc: 'Player forced to reveal plan' },
                                  { id: 'MUTE_PROTOCOL', label: 'MUTE PROTOCOL', desc: 'Silence required' },
                                  { id: 'NO_LOOK', label: 'BLIND BIDDING', desc: 'Cannot look at screen' },
                                ]
                              },
                              {
                                id: 'standard_secret',
                                title: 'SECRET PROTOCOLS',
                                subtitle: 'Secret for some players',
                                items: [
                                  { id: 'THE_MOLE', label: 'THE MOLE', desc: 'Secret traitor assignment' },
                                  { id: 'UNDERDOG_VICTORY', label: 'UNDERDOG VICTORY', desc: 'Lowest valid bid wins token (secret until end)' },
                                  { id: 'TIME_TAX', label: 'TIME TAX', desc: '-10s to everyone (can be secret until end)' },
                                  { id: 'PRIVATE_CHANNEL', label: 'PRIVATE CHANNEL', desc: '2 players secretly linked (revealed at end)' },
                                ]
                              }
                            ].map((cat) => (
                              <details key={cat.id} className="rounded-lg border border-red-500/15 bg-black/30" data-testid={`section-protocol-config-${cat.id}`}> 
                                <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between">
                                  <div>
                                    <div className="text-xs font-bold text-red-100 tracking-widest">{cat.title}</div>
                                    <div className="text-[11px] text-zinc-500">{cat.subtitle}</div>
                                  </div>
                                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">{cat.items.filter(i => allowedProtocols.includes(i.id as ProtocolType)).length}/{cat.items.length}</div>
                                </summary>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 pt-0">
                                  {cat.items.map((p) => (
                                    <div key={p.id} className="flex items-start space-x-3 p-3 rounded bg-red-950/15 border border-red-500/10" data-testid={`row-protocol-config-${p.id}`}> 
                                      <Switch 
                                        checked={allowedProtocols.includes(p.id as ProtocolType)}
                                        onCheckedChange={(checked) => {
                                          setAllowedProtocols(prev => checked ? [...prev, p.id as ProtocolType] : prev.filter(id => id !== p.id));
                                        }}
                                        data-testid={`switch-protocol-${p.id}`}
                                      />
                                      <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-red-100" data-testid={`text-protocol-name-${p.id}`}>{p.label}</h4>
                                        <p className="text-xs text-red-300/70" data-testid={`text-protocol-desc-${p.id}`}>{p.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ))}
                          </div>
                        </details>

                        {/* SOCIAL */}
                        <details className="rounded-lg border border-purple-500/20 bg-purple-950/15 overflow-hidden" data-testid="section-protocol-config-social">
                          <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PartyPopper size={14} className="text-purple-400" />
                              <div className="text-sm font-bold text-purple-200 tracking-widest">SOCIAL OVERDRIVE</div>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-purple-400/70">{allowedProtocols.filter(p => ['TRUTH_DARE','SWITCH_SEATS','HUM_TUNE','LOCK_ON','NOISE_CANCEL'].includes(p as any)).length} selected</div>
                          </summary>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
                            {[
                              { id: 'LOCK_ON', label: 'LOCK ON', desc: 'Eye contact required', type: 'social' },
                              { id: 'TRUTH_DARE', label: 'TRUTH OR DARE', desc: 'Truth or Dare', type: 'social' },
                              { id: 'SWITCH_SEATS', label: 'SWITCH SEATS', desc: 'Seat swap before next round', type: 'social' },
                              { id: 'HUM_TUNE', label: 'HUM A TUNE', desc: 'Hum while bidding', type: 'social' },
                              { id: 'NOISE_CANCEL', label: 'NOISE CANCEL', desc: 'No reacting to others', type: 'social' },
                            ].map((p) => (
                              <div key={p.id} className="flex items-start space-x-3 p-3 rounded bg-purple-950/20 border border-purple-500/10" data-testid={`row-protocol-config-${p.id}`}> 
                                <Switch 
                                  checked={allowedProtocols.includes(p.id as ProtocolType)}
                                  disabled={variant !== 'SOCIAL_OVERDRIVE'}
                                  onCheckedChange={(checked) => {
                                    if (checked) setAllowedProtocols(prev => [...prev, p.id as ProtocolType]);
                                    else setAllowedProtocols(prev => prev.filter(id => id !== p.id));
                                  }}
                                  data-testid={`switch-protocol-${p.id}`}
                                />
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-purple-200" data-testid={`text-protocol-name-${p.id}`}>{p.label}</h4>
                                  <p className="text-xs text-purple-400" data-testid={`text-protocol-desc-${p.id}`}>{p.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>

                        {/* BIO-FUEL */}
                        <details className="rounded-lg border border-orange-500/20 bg-orange-950/15 overflow-hidden" data-testid="section-protocol-config-bio">
                          <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Martini size={14} className="text-orange-400" />
                              <div className="text-sm font-bold text-orange-200 tracking-widest">BIO-FUEL</div>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-orange-400/70">{allowedProtocols.filter(p => ['HYDRATE','BOTTOMS_UP','PARTNER_DRINK','WATER_ROUND'].includes(p as any)).length} selected</div>
                          </summary>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
                            {[
                              { id: 'HYDRATE', label: 'HYDRATE', desc: 'Everyone takes a sip', type: 'bio' },
                              { id: 'BOTTOMS_UP', label: 'BOTTOMS UP', desc: 'Winner finishes their drink', type: 'bio' },
                              { id: 'PARTNER_DRINK', label: 'LINKED SYSTEMS', desc: 'Pick a partner: when you drink, they drink', type: 'bio' },
                              { id: 'WATER_ROUND', label: 'WATER_ROUND', desc: 'Winner gives a glass of water', type: 'bio' },
                            ].map((p) => (
                              <div key={p.id} className="flex items-start space-x-3 p-3 rounded bg-orange-950/20 border border-orange-500/10" data-testid={`row-protocol-config-${p.id}`}> 
                                <Switch 
                                  checked={allowedProtocols.includes(p.id as ProtocolType)}
                                  disabled={variant !== 'BIO_FUEL'}
                                  onCheckedChange={(checked) => {
                                    if (checked) setAllowedProtocols(prev => [...prev, p.id as ProtocolType]);
                                    else setAllowedProtocols(prev => prev.filter(id => id !== p.id));
                                  }}
                                  data-testid={`switch-protocol-${p.id}`}
                                />
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-orange-200" data-testid={`text-protocol-name-${p.id}`}>{p.label}</h4>
                                  <p className="text-xs text-orange-400" data-testid={`text-protocol-desc-${p.id}`}>{p.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>

                        {/* BONUS TROPHIES */}
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-950/15 px-4 py-3 flex items-center justify-between" data-testid="section-protocol-config-bonus-trophies">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">🏆</span>
                            <div>
                              <div className="text-sm font-bold text-yellow-200 tracking-widest">BONUS TROPHIES</div>
                              <div className="text-[11px] text-yellow-300/60">Award bonus trophies at game over</div>
                            </div>
                          </div>
                          <Switch
                            checked={bonusTrophiesEnabled}
                            onCheckedChange={setBonusTrophiesEnabled}
                            className="data-[state=checked]:bg-yellow-500"
                            data-testid="switch-bonus-trophies"
                          />
                        </div>
                    </div>
                    <DialogFooter>
                        <div className="text-xs text-zinc-500 w-full text-left pt-2">
                            {allowedProtocols.length} selected
                        </div>
                        <Button variant="outline" onClick={() => setShowProtocolSelect(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <h1 className="text-4xl sm:text-6xl font-display text-primary text-glow font-bold">REDLINE AUCTION</h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              Bid time from your time bank to win trophies.<br/>
              <span className="text-xs sm:text-sm font-mono opacity-70">
                {gameDuration === 'short' && "SPRINT: 2.5 Minutes | 9 Rounds"}
                {gameDuration === 'standard' && "TEMPO: 5 Minutes | 9 Rounds"}
                {gameDuration === 'long' && "MARATHON: 10 Minutes | 18 Rounds"}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-left bg-card/50 p-3 sm:p-6 rounded border border-white/5">
               <div className="space-y-1 sm:space-y-2">
                <h3 className="text-primary font-bold text-xs sm:text-base">Rules</h3>
                <ul className="list-disc list-inside text-[10px] sm:text-sm text-zinc-400 space-y-0.5 sm:space-y-1">
                  <li>Hold button to start.</li>
                  <li>Release to bid time.</li>
                  <li>Longest time wins trophy</li>
                  <li>Min Bid: {gameDuration === 'short' ? '1.0s' : gameDuration === 'long' ? '4.0s' : '2.0s'}</li>
                  <li>Max Bid: Remaining Bank.</li>
                </ul>
              </div>
              <div className="space-y-1 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-destructive font-bold text-xs sm:text-base">Winning</h3>
                  <ul className="list-disc list-inside text-[10px] sm:text-sm text-zinc-400 space-y-0.5 sm:space-y-1">
                    <li>Most trophies wins game.</li>
                    <li>Tiebreaker: Remaining Time.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 bg-black/40 p-4 rounded-xl border border-white/10 w-full max-w-lg">
              {/* Row 1: Core Toggles (Difficulty / Protocols / Limit Breaks) */}
              <div className="flex flex-wrap items-center justify-start sm:justify-center gap-4">
                {/* GAME DIFFICULTY (same behavior as top banner) */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleDifficulty}
                    disabled={!!currentLobby}
                    className={cn("h-8 px-3 text-xs font-mono hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5", currentLobby && "opacity-50 cursor-not-allowed")}
                    title={currentLobby ? 'Settings locked - set by lobby host' : difficulty === 'CASUAL' ? 'CASUAL: Everyone can see time banks.' : 'COMPETITIVE: Time banks are hidden until the end.'}
                    data-testid="button-intro-toggle-difficulty"
                  >
                    {difficulty === 'CASUAL' ? <Eye size={12} className="text-emerald-400"/> : <EyeOff size={12} className="text-zinc-400"/>}
                    <span className={difficulty === 'CASUAL' ? "text-emerald-400" : "text-zinc-400"}>
                      {difficulty}
                    </span>
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-6 bg-white/10" />

                {/* PROTOCOLS TOGGLE (same row as difficulty & Limit Breaks) */}
                <div className="flex items-center gap-2" title={currentLobby ? 'Settings locked - set by lobby host' : variant === 'BIO_FUEL' ? "Protocols: Drinking prompts + 21+ party rules that trigger between rounds." : variant === 'SOCIAL_OVERDRIVE' ? "Protocols: Party-game prompts and social rules that trigger between rounds." : "Protocols: Round modifiers that can change visibility, scramble info, or add secret twists."} data-testid="group-intro-protocols">
                  <div className={cn("flex items-center space-x-2", currentLobby && "opacity-50 pointer-events-none")}>
                    <Switch 
                        id="protocols-intro" 
                        checked={protocolsEnabled} 
                        onCheckedChange={setProtocolsEnabled}
                        disabled={!!currentLobby}
                        className={cn(
                          "data-[state=checked]:bg-red-500",
                          variant === 'SOCIAL_OVERDRIVE' && "data-[state=checked]:bg-purple-500",
                          variant === 'BIO_FUEL' && "data-[state=checked]:bg-orange-500"
                        )}
                        data-testid="switch-intro-protocols"
                    />
                    <Label htmlFor="protocols-intro" className="text-sm cursor-pointer text-zinc-400 flex items-center gap-1" data-testid="label-intro-protocols">
                        {variant === 'SOCIAL_OVERDRIVE' ? (
                          <PartyPopper size={14} className={protocolsEnabled ? "text-purple-400" : "text-muted-foreground"} />
                        ) : variant === 'BIO_FUEL' ? (
                          <Martini size={14} className={protocolsEnabled ? "text-orange-400" : "text-muted-foreground"} />
                        ) : (
                          <AlertTriangle size={14} className={protocolsEnabled ? "text-zinc-200" : "text-muted-foreground"} />
                        )}
                        <span className={cn(
                          "transition-colors",
                          protocolsEnabled ? "text-zinc-100" : "text-zinc-400",
                          variant === 'SOCIAL_OVERDRIVE' && protocolsEnabled && "text-purple-200",
                          variant === 'BIO_FUEL' && protocolsEnabled && "text-orange-200"
                        )}>Protocols</span>
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    disabled={!protocolsEnabled}
                    onClick={() => setShowProtocolSelect(true)}
                    title="Configure allowed protocols"
                    data-testid="button-intro-protocol-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6 bg-white/10" />

                {/* LIMIT BREAKS TOGGLE */}
                <div className={cn("flex items-center gap-2", currentLobby && "opacity-50 pointer-events-none")} title={currentLobby ? 'Settings locked - set by lobby host' : "Limit Breaks: Driver-specific passive powers that can trigger mid-round or post-round."} data-testid="group-intro-limit-breaks">
                  <Switch 
                    id="abilities-intro" 
                    checked={abilitiesEnabled} 
                    onCheckedChange={setAbilitiesEnabled}
                    disabled={!!currentLobby}
                    className="data-[state=checked]:bg-blue-500"
                    data-testid="switch-intro-limit-breaks"
                  />
                  <Label htmlFor="abilities-intro" className="text-sm cursor-pointer text-zinc-400 flex items-center gap-1" data-testid="label-intro-limit-breaks">
                    <Zap size={14} className={abilitiesEnabled ? "text-blue-400" : "text-muted-foreground"}/>
                    LIMIT BREAKS
                  </Label>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Row 2: Reality Modes */}
              <div className={cn("flex flex-col items-center gap-2", currentLobby && "opacity-50 pointer-events-none")}>
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">REALITY MODES</h3>
                 <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                    <button
                      onClick={() => setVariant('STANDARD')}
                      disabled={!!currentLobby}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'STANDARD'
                          ? 'bg-zinc-700/60 border-zinc-300 text-zinc-50'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300',
                        currentLobby && 'cursor-not-allowed'
                      )}
                      title={currentLobby ? 'Settings locked - set by lobby host' : "STANDARD: Pure auction, no social or 21+ modifiers."}
                      data-testid="button-intro-variant-standard"
                    >
                      STANDARD
                    </button>
                    <button
                      onClick={() => setVariant('SOCIAL_OVERDRIVE')}
                      disabled={!!currentLobby}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'SOCIAL_OVERDRIVE'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300',
                        currentLobby && 'cursor-not-allowed'
                      )}
                      title={currentLobby ? 'Settings locked - set by lobby host' : "SOCIAL OVERDRIVE: Party-game protocols + social driver abilities."}
                      data-testid="button-intro-variant-social"
                    >
                      SOCIAL OVERDRIVE
                    </button>
                    <button
                      onClick={() => setVariant('BIO_FUEL')}
                      disabled={!!currentLobby}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'BIO_FUEL'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300',
                        currentLobby && 'cursor-not-allowed'
                      )}
                      title={currentLobby ? 'Settings locked - set by lobby host' : "BIO-FUEL (21+): Drinking-game prompts, toasts, and chaos. Orange = heat + hydration."} 
                      data-testid="button-intro-variant-bio"
                    >
                      BIO-FUEL
                    </button>
                    <button
                      onClick={() => setVariant('HAUNTED')}
                      disabled={!!currentLobby}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'HAUNTED'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300',
                        currentLobby && 'cursor-not-allowed'
                      )}
                      title={currentLobby ? 'Settings locked - set by lobby host' : "HAUNTED: Ghost mechanics, haunted relics, and spectral bidding."}
                      data-testid="button-intro-variant-haunted"
                    >
                      HAUNTED
                    </button>
                 </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Row 3: Game Pace */}
              <div className={cn("flex flex-col items-center gap-2", currentLobby && "opacity-50 pointer-events-none")}>
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">GAME PACE</h3>
                 <div className="flex items-center justify-center gap-2">
                     <button 
                       onClick={() => setGameDuration('short')}
                       disabled={!!currentLobby}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'short' 
                           ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300",
                         currentLobby && 'cursor-not-allowed'
                       )}
                       title={currentLobby ? 'Settings locked - set by lobby host' : undefined}
                     >
                       SPRINT (2.5m)
                     </button>
                     <button 
                       onClick={() => setGameDuration('standard')}
                       disabled={!!currentLobby}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'standard' 
                           ? "bg-orange-400/20 border-orange-400 text-orange-400" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300",
                         currentLobby && 'cursor-not-allowed'
                       )}
                       title={currentLobby ? 'Settings locked - set by lobby host' : undefined}
                     >
                       TEMPO (5m)
                     </button>
                     <button 
                       onClick={() => setGameDuration('long')}
                       disabled={!!currentLobby}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'long' 
                           ? "bg-orange-600/20 border-orange-600 text-orange-600" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300",
                         currentLobby && 'cursor-not-allowed'
                       )}
                       title={currentLobby ? 'Settings locked - set by lobby host' : undefined}
                     >
                       MARATHON (10m)
                     </button>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setPhase('character_select')}
                className="text-xl px-12 py-6 border-primary/50 text-primary hover:bg-primary/20 flex-1 max-w-xs"
                title="SINGLE PLAYER: Play against bots. Your time bank is your life."
                data-testid="button-banner-single-player"
              >
                 SINGLE PLAYER
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setPhase('multiplayer_lobby')}
                className="text-xl px-12 py-6 border-red-500/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex-1 max-w-xs transition-colors"
                title="MULTIPLAYER: Create or join a lobby to play with friends."
                data-testid="button-banner-multiplayer"
              >
                 MULTIPLAYER
              </Button>
            </div>

            {/* Profile / Wallet shortcut */}
            <Link href="/profile">
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-6 border-orange-400/50 text-orange-400 hover:bg-orange-400/20 flex items-center gap-2"
                data-testid="button-open-profile"
              >
                <User size={20} /> PROFILE &amp; SHOP
              </Button>
            </Link>

          </motion.div>
        );

      case 'multiplayer_lobby':
        // If we're in a lobby, show the waiting room
        if (currentLobby) {
          const isHost = socket?.id === currentLobby.hostSocketId;
          const myPlayer = currentLobby.players.find(p => p.socketId === socket?.id);
          const allReady = currentLobby.players.length >= 2 && currentLobby.players.every(p => p.isReady);
          
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-start pt-8 max-w-lg mx-auto w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <Users className="w-12 h-12 text-primary mx-auto mb-2" />
                <h2 className="text-2xl font-display font-bold">LOBBY</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-zinc-400">Room Code:</span>
                  <span className="font-mono text-2xl font-bold tracking-widest text-primary" data-testid="text-lobby-code">
                    {currentLobby.code}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {currentLobby.isPublic ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 font-medium flex items-center gap-1" data-testid="badge-lobby-public">
                      <Globe size={10} /> PUBLIC
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-primary font-medium flex items-center gap-1" data-testid="badge-lobby-private">
                      <Lock size={10} /> PRIVATE
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {currentLobby.isPublic ? "Anyone can find this lobby" : "Share this code with friends to join"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?join=${currentLobby.code}`;
                    if (navigator.share) {
                      navigator.share({ title: 'Join my Redline Auction game!', url });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="mt-2 text-xs border-primary/30 hover:bg-primary/10"
                  data-testid="button-send-link"
                >
                  <Share2 size={14} className="mr-2" />
                  Send Link
                </Button>
              </div>

              {/* Game Settings */}
              {currentLobby.settings && (
                <div className="w-full bg-card/30 rounded-lg border border-white/10 p-3">
                  <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Game Settings</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded border",
                      currentLobby.settings.difficulty === 'COMPETITIVE' 
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-400" 
                        : "bg-green-500/10 border-green-500/30 text-green-400"
                    )}>
                      {currentLobby.settings.difficulty}
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded border",
                      currentLobby.settings.variant === 'SOCIAL_OVERDRIVE' 
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        : currentLobby.settings.variant === 'BIO_FUEL'
                          ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                          : "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"
                    )}>
                      {currentLobby.settings.variant.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 rounded border bg-zinc-500/10 border-zinc-500/30 text-zinc-400">
                      {currentLobby.settings.gameDuration === 'short' || currentLobby.settings.gameDuration === 'sprint' ? '2.5m' : currentLobby.settings.gameDuration === 'long' ? '10m' : '5m'}
                    </span>
                    {currentLobby.settings.protocolsEnabled && (
                      <span className="px-2 py-1 rounded border bg-red-500/10 border-red-500/30 text-red-400">
                        Protocols
                      </span>
                    )}
                    {currentLobby.settings.protocolsEnabled && currentLobby.settings.bonusTrophiesEnabled && (
                      <span className="px-2 py-1 rounded border bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                        Bonus Trophies
                      </span>
                    )}
                    {currentLobby.settings.abilitiesEnabled && (
                      <span className="px-2 py-1 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">
                        Limit Breaks
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Name Change Input - Only shown before game starts */}
              {currentLobby.status === 'waiting' && (
                <div className="w-full bg-card/30 rounded-lg border border-white/10 p-4">
                  <Label className="text-xs text-zinc-500 mb-2 block">Your Display Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter your name" 
                      className="bg-black/50 border-white/20"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={20}
                      data-testid="input-player-name-lobby"
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (!socket || !playerName.trim()) return;
                        socket.emit("update_player_name", { newName: playerName }, (response: { success: boolean; error?: string }) => {
                          if (response.success) {
                            // Update local storage
                            if (currentLobby?.code) {
                              localStorage.setItem(`redline_player_${currentLobby.code.toUpperCase()}`, JSON.stringify({ playerName }));
                            }
                            toast({
                              title: "Name Updated",
                              description: `Your name has been changed to ${playerName}`,
                              duration: 2000
                            });
                          } else {
                            toast({
                              title: "Error",
                              description: response.error || "Failed to update name",
                              variant: "destructive"
                            });
                          }
                        });
                      }}
                      disabled={!playerName.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">You can change your name until the game starts</p>
                </div>
              )}
              
              {/* Players List */}
              <div className="w-full bg-card/30 rounded-lg border border-white/10 p-4 space-y-3">
                <div className="flex justify-between items-center text-sm text-zinc-400">
                  <span>Players ({currentLobby.players.length}/{currentLobby.maxPlayers})</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    currentLobby.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  )}>
                    {currentLobby.status === 'waiting' ? 'Waiting' : 'Starting'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {currentLobby.players.map((player, idx) => (
                    <div 
                      key={player.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        player.socketId === socket?.id 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-black/30 border-white/5"
                      )}
                      data-testid={`player-row-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar: driver image or initial; logo overlays when equipped for current player */}
                        <div className="relative w-8 h-8 flex-shrink-0">
                          {player.selectedDriver ? (
                            <img 
                              src={CHARACTERS.find(c => c.id === player.selectedDriver)?.image} 
                              alt={player.selectedDriver}
                              className="w-8 h-8 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {player.socketId === socket?.id && getLogoUrl(myCosmetics) && (
                            <img
                              src={getLogoUrl(myCosmetics)!}
                              alt="Logo"
                              className="absolute inset-0 w-full h-full object-contain rounded-full bg-black/40"
                              title="Your equipped logo"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.isHost && (
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">Host</Badge>
                            )}
                            {player.socketId === socket?.id && (
                              <span className="text-xs text-zinc-500">(You)</span>
                            )}
                          </div>
                          {player.selectedDriver && (
                            <div className="text-[10px] text-zinc-500">
                              {CHARACTERS.find(c => c.id === player.selectedDriver)?.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          player.isReady 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-zinc-800 text-zinc-500"
                        )}>
                          {player.isReady ? "Ready" : "Not Ready"}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={handleToggleReady}
                  variant={myPlayer?.isReady ? "outline" : "default"}
                  className="w-full"
                  data-testid="button-toggle-ready"
                >
                  {myPlayer?.isReady ? "Cancel Ready" : "Ready Up"}
                </Button>
                
                {isHost && (
                  <Button 
                    onClick={handleStartMultiplayerGame}
                    disabled={!allReady}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-start-game"
                  >
                    {allReady ? "Start Game" : `Waiting for players (${currentLobby.players.filter(p => p.isReady).length}/${currentLobby.players.length})`}
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  onClick={handleLeaveLobby}
                  className="text-zinc-500 hover:text-red-400"
                  data-testid="button-leave-lobby"
                >
                  Leave Lobby
                </Button>
              </div>
            </motion.div>
          );
        }

        // Show create/join UI if not in a lobby
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-start pt-8 min-h-[450px] max-w-md mx-auto w-full space-y-8"
          >
             <div className="text-center space-y-2">
               <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
               <h2 className="text-3xl font-display font-bold">MULTIPLAYER LOBBY</h2>
               <p className="text-muted-foreground">Join the global network.</p>
               {!isConnected && (
                 <p className="text-yellow-400 text-sm">Connecting to server...</p>
               )}
             </div>

             {/* Player Name Input */}
             <div className="w-full">
               <Label className="text-xs text-zinc-500">Your Name</Label>
               <Input 
                 placeholder="Enter your name" 
                 className="bg-black/50 border-white/20 text-center"
                 value={playerName}
                 onChange={(e) => setPlayerName(e.target.value)}
                 maxLength={20}
                 data-testid="input-player-name"
               />
             </div>

             {lobbyError && (
               <div className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded border border-red-500/20">
                 {lobbyError}
               </div>
             )}

             <div className="grid grid-cols-1 gap-6 w-full">
                {/* Create Room */}
                <div className="bg-card/30 p-6 rounded-lg border border-white/10 hover:border-primary/50 transition-colors text-center space-y-4">
                   <h3 className="font-bold text-lg flex items-center justify-center gap-2"><Users size={20}/> Create Room</h3>
                   <div className="flex items-center justify-center gap-3">
                     <button
                       onClick={() => setIsPublicLobby(false)}
                       className={cn(
                         "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all",
                         !isPublicLobby 
                           ? "bg-primary/20 border border-primary text-primary" 
                           : "bg-black/30 border border-white/10 text-zinc-400 hover:text-white"
                       )}
                       data-testid="button-private-lobby"
                     >
                       <Lock size={14} /> Private
                     </button>
                     <button
                       onClick={() => setIsPublicLobby(true)}
                       className={cn(
                         "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all",
                         isPublicLobby 
                           ? "bg-green-500/20 border border-green-500 text-green-400" 
                           : "bg-black/30 border border-white/10 text-zinc-400 hover:text-white"
                       )}
                       data-testid="button-public-lobby"
                     >
                       <Globe size={14} /> Public
                     </button>
                   </div>
                   <p className="text-xs text-zinc-500">
                     {isPublicLobby 
                       ? "Anyone can find and join your lobby." 
                       : "Only players with the room code can join."}
                   </p>
                   <Button 
                     onClick={handleCreateRoom} 
                     className="w-full" 
                     disabled={!isConnected || !playerName.trim()}
                     data-testid="button-create-lobby"
                   >
                     Create {isPublicLobby ? 'Public' : 'Private'} Lobby
                   </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-zinc-500">Or join existing</span>
                  </div>
                </div>

                {/* Join Room */}
                <div className="bg-card/30 p-6 rounded-lg border border-white/10 hover:border-primary/50 transition-colors text-center space-y-4">
                   <h3 className="font-bold text-lg flex items-center justify-center gap-2"><Lock size={20}/> Join Room</h3>
                   <div className="flex gap-2">
                     <Input 
                       placeholder="Enter Code" 
                       className="bg-black/50 border-white/20 font-mono uppercase text-center tracking-widest"
                       value={lobbyCode}
                       onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                       maxLength={6}
                       data-testid="input-lobby-code"
                     />
                     <Button 
                       onClick={handleJoinRoom} 
                       variant="secondary" 
                       disabled={lobbyCode.length < 4 || !isConnected || !playerName.trim()}
                       data-testid="button-join-lobby"
                     >
                       Join
                     </Button>
                   </div>
                   <div className="border-t border-white/5 pt-3">
                     <Button
                       onClick={handleJoinRandomRoom}
                       variant="outline"
                       className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                       disabled={!isConnected || !playerName.trim()}
                       data-testid="button-join-random"
                     >
                       <Shuffle size={16} className="mr-2" /> Join Random Room
                     </Button>
                   </div>
                </div>
             </div>

             <Button variant="ghost" onClick={() => setPhase('intro')} className="text-zinc-500 hover:text-white">
               Back to Menu
             </Button>
          </motion.div>
        );

      case 'character_select':
        return (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full max-w-5xl mx-auto space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-white mb-2">CHOOSE YOUR DRIVER</h2>
              <p className="text-muted-foreground">Select your persona for the auction.</p>
              {variant !== 'STANDARD' && (
                  <Badge variant="outline" className={cn("mt-2 border-white/10", getVariantColor())}>
                      {getVariantIcon()} {variant.replace('_', ' ')} MODE ACTIVE
                  </Badge>
              )}
            </div>

            {(() => {
              const allDrivers = [...CHARACTERS, ...(variant === 'SOCIAL_OVERDRIVE' ? SOCIAL_CHARACTERS : []), ...(variant === 'BIO_FUEL' ? BIO_CHARACTERS : [])];

              const categories = [
                {
                  id: 'diamond_hands',
                  title: 'DIAMOND HANDS',
                  subtitle: 'Timing & refunds',
                  className: 'border-emerald-500/20 hover:border-emerald-500/50',
                  headerText: 'text-emerald-300',
                  filter: (c: Character) => (c.ability?.effect === 'TIME_REFUND' || c.ability?.name === 'JAWLINE') && !['RAINBOW RUN','CHEF\'S SPECIAL'].includes(c.ability?.name || '') && c.id !== 'low_flame'
                },
                {
                  id: 'degens',
                  title: 'DEGENS',
                  subtitle: 'High variance, high reward',
                  className: 'border-yellow-500/20 hover:border-yellow-500/50',
                  headerText: 'text-yellow-300',
                  filter: (c: Character) => (c.ability?.effect === 'TOKEN_BOOST') || ['RAINBOW RUN','CHEF\'S SPECIAL'].includes(c.ability?.name || '')
                },
                {
                  id: 'saboteurs',
                  title: 'SABOTEURS',
                  subtitle: 'Disrupt & steal',
                  className: 'border-red-500/20 hover:border-red-500/50',
                  headerText: 'text-red-300',
                  filter: (c: Character) => c.ability?.effect === 'DISRUPT'
                },
                {
                  id: 'mind_games',
                  title: 'MIND GAMES',
                  subtitle: 'Intel, immunity & misdirection',
                  className: 'border-sky-500/20 hover:border-sky-500/50',
                  headerText: 'text-sky-300',
                  filter: (c: Character) => c.ability?.effect === 'PEEK' || c.ability?.name === 'FIRE WALL' || c.ability?.name === 'CALCULATED' || c.id === 'prom_king'
                },
              ];

              const renderDriverCard = (char: Character) => {
                  const getCharImage = (c: Character) => {
                    if (variant === 'HAUNTED' && c.imageHaunted) return c.imageHaunted;
                    if (variant === 'SOCIAL_OVERDRIVE' && c.imageSocial) return c.imageSocial;
                    if (variant === 'BIO_FUEL' && c.imageBio) return c.imageBio;
                    return c.image;
                  };

                  return (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectCharacter(char)}
                  data-testid={`card-driver-${char.id}`}
                  className="flex flex-col items-center p-3 sm:p-4 rounded-xl border border-white/10 bg-black/40 hover:border-primary/50 transition-colors group text-center overflow-hidden min-w-0"
                >
                  <div className={cn("w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full mb-2 sm:mb-3 group-hover:scale-110 transition-transform overflow-hidden border-2 border-white/10 flex-shrink-0", char.color)}>
                     <img src={getCharImage(char)} alt={char.name} className={cn("w-full h-full object-cover", variant === 'HAUNTED' && char.imageHaunted && "[object-position:50%_20%]")} />
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg md:text-xl text-white mb-0.5 sm:mb-1 w-full leading-tight" data-testid={`text-driver-name-${char.id}`}>{char.name}</h3>
                  <p className="text-[10px] sm:text-sm text-primary/80 uppercase tracking-wider mb-1 sm:mb-2 font-display w-full leading-tight" data-testid={`text-driver-title-${char.id}`}>{char.title}</p>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-tight line-clamp-2 w-full" data-testid={`text-driver-desc-${char.id}`}>{char.description}</p>
                  
                  {abilitiesEnabled && char.ability && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 w-full min-w-0">
                       <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                          <Zap size={10} fill="currentColor" className="flex-shrink-0" /> {char.ability.name}
                       </div>
                       <p className="text-[9px] sm:text-[10px] text-zinc-400 leading-tight">{char.ability.description}</p>
                    </div>
                  )}

                  {variant === 'SOCIAL_OVERDRIVE' && char.socialAbility && (
                    <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-purple-500/20 w-full bg-purple-500/5 rounded p-1 min-w-0">
                       <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                          <PartyPopper size={10} className="flex-shrink-0" /> {char.socialAbility.name}
                       </div>
                       <p className="text-[9px] sm:text-[10px] text-purple-300/70 leading-tight">{char.socialAbility.description}</p>
                    </div>
                  )}

                  {variant === 'BIO_FUEL' && char.bioAbility && (
                    <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-orange-500/20 w-full bg-orange-500/5 rounded p-1 min-w-0">
                       <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
                          <Martini size={10} className="flex-shrink-0" /> {char.bioAbility.name}
                       </div>
                       <p className="text-[9px] sm:text-[10px] text-orange-300/70 leading-tight">{char.bioAbility.description}</p>
                    </div>
                  )}
                </motion.button>
              );
            };


              const pools = (() => {
                const picked = new Set<string>();
                const assignOnce = (predicate: (c: Character) => boolean) =>
                  allDrivers.filter((c) => {
                    if (picked.has(c.id)) return false;
                    if (!predicate(c)) return false;
                    picked.add(c.id);
                    return true;
                  });

                return categories.map((cat) => ({
                  cat,
                  drivers: assignOnce(cat.filter)
                }));
              })();

              const active = pools.find((p) => p.cat.id === expandedDriverCategoryId) || null;

              return (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* RANDOM BUTTON */}
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={selectRandomCharacter}
                    data-testid="button-random-driver"
                    className="flex flex-col items-center p-4 rounded-xl border border-dashed border-white/20 bg-white/5 hover:border-primary/50 transition-colors group text-center justify-center min-h-[200px]"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/10 mb-3 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                       <CircleHelp size={32} className="text-zinc-500 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-primary transition-colors">RANDOM</h3>
                    <p className="text-xs text-zinc-500 mt-1">Roll the dice</p>
                  </motion.button>

                  {/* CATEGORY TILES */}
                  {pools.map(({ cat, drivers }) => {
                    const isOpen = expandedDriverCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setExpandedDriverCategoryId((prev) => (prev === cat.id ? null : cat.id))}
                        className={cn(
                          `col-span-1 flex flex-col rounded-xl border ${cat.className} bg-black/40 overflow-hidden text-left`,
                          isOpen ? 'ring-1 ring-white/10' : ''
                        )}
                        data-testid={`tile-driver-category-${cat.id}`}
                      >
                        <div className="p-4 flex flex-col gap-1">
                          <div className={cn('text-sm font-bold tracking-widest', cat.headerText)} data-testid={`text-driver-category-title-${cat.id}`}>{cat.title}</div>
                          <div className="text-xs text-zinc-500" data-testid={`text-driver-category-subtitle-${cat.id}`}>{cat.subtitle} • {drivers.length} drivers</div>
                          <div className="mt-2 text-[10px] text-zinc-600" data-testid={`text-driver-category-hint-${cat.id}`}>{isOpen ? 'Tap to collapse' : 'Tap to expand'}</div>
                        </div>
                      </button>
                    );
                  })}

                  {/* EXPANDED GRID ROW (below tiles) */}
                  <div className="col-span-2 md:col-span-5" data-testid="row-driver-expanded">
                    {active && (
                      <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                        <div className="flex items-center justify-between px-1 pb-2">
                          <div className={cn('text-xs font-bold tracking-widest uppercase', active.cat.headerText)} data-testid="text-driver-expanded-title">
                            {active.cat.title}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500" data-testid="text-driver-expanded-count">{active.drivers.length} drivers</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" data-testid="grid-driver-expanded">
                          {active.drivers.map(renderDriverCard)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        );

      case 'haunted_item_select': {
        const CATEGORY_COLORS: Record<string, string> = {
          Cursed: 'bg-red-900/40 text-red-300 border-red-500/30',
          Spooky: 'bg-zinc-800/60 text-zinc-300 border-zinc-500/30',
          Mystical: 'bg-violet-900/40 text-violet-300 border-violet-500/30',
          Chaotic: 'bg-orange-900/40 text-orange-300 border-orange-500/30',
        };
        const TARGET_COLORS: Record<string, string> = {
          Self: 'text-cyan-400/80',
          Everyone: 'text-yellow-400/80',
          Opponent: 'text-red-400/80',
        };
        const TARGET_GROUP_STYLES: Record<string, string> = {
          Everyone: 'bg-yellow-950/20 border border-yellow-500/20 rounded-xl p-3',
          Self: 'bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3',
          Opponent: 'bg-red-950/20 border border-red-500/20 rounded-xl p-3',
        };
        const TARGET_GROUP_LABELS: Record<string, string> = {
          Everyone: '🌐 Affects Everyone',
          Self: '🧠 Affects Self',
          Opponent: '⚔️ Affects Opponent',
        };
        const handleRelicSelect = (item: HauntedItem) => {
          if (isMultiplayer && socket) {
            socket.emit('select_haunted_item', { itemId: item.id, itemName: item.name });
            setPhase('ready');
          } else {
            setPlayers(prev => {
              const takenItems = new Set<string>([item.id]);
              return prev.map(p => {
                if (p.id === 'p1') return { ...p, selectedItem: item.id };
                if (p.isBot) {
                  const available = HAUNTED_ITEMS.filter(i => !takenItems.has(i.id));
                  const pick = available[Math.floor(Math.random() * available.length)] || HAUNTED_ITEMS[0];
                  takenItems.add(pick.id);
                  return { ...p, selectedItem: pick.id };
                }
                return p;
              });
            });
            setPhase('ready');
          }
        };
        const handleRandomRelicSelect = () => {
          const pick = HAUNTED_ITEMS[Math.floor(Math.random() * HAUNTED_ITEMS.length)];
          handleRelicSelect(pick);
        };

        const relicGroups: Array<{ target: string; items: HauntedItem[] }> = [
          { target: 'Everyone', items: HAUNTED_ITEMS.filter(i => i.target === 'Everyone') },
          { target: 'Self', items: HAUNTED_ITEMS.filter(i => i.target === 'Self') },
          { target: 'Opponent', items: HAUNTED_ITEMS.filter(i => i.target === 'Opponent') },
        ];

        const renderRelicCard = (item: HauntedItem) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRelicSelect(item)}
            className="flex gap-4 p-4 rounded-xl border border-teal-500/20 bg-black/50 hover:border-teal-400/50 hover:bg-teal-950/20 transition-all text-left"
            data-testid={`card-haunted-item-${item.id}`}
          >
            {/* Icon + number */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1 w-12">
              <span className="text-3xl leading-none">{item.icon}</span>
              <span className="text-[9px] text-zinc-600 font-mono">{item.number}</span>
            </div>

            {/* Card body */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-teal-100 leading-tight">{item.name}</span>
                {item.voteType && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-900/20 text-yellow-400">⬆ VOTE</span>
                )}
                {item.botOnly && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-600/60 bg-zinc-800/60 text-zinc-400">🤖 BOT TARGET</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[item.category]}`}>{item.category}</span>
                <span className={`text-[9px] font-medium ${TARGET_COLORS[item.target]}`}>→ {item.target}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2">{item.description}</p>
              <p className="text-[10px] text-zinc-600 italic leading-tight">{item.flavour}</p>
              {item.ghostNote && (
                <p className="text-[10px] text-teal-500/60 leading-tight">👻 {item.ghostNote}</p>
              )}
            </div>
          </motion.button>
        );

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto space-y-6"
            data-testid="screen-haunted-item-select"
          >
            <div className="text-center mb-4">
              <h2 className="text-4xl font-display font-bold text-teal-300 mb-1 flex items-center justify-center gap-3">
                <Skull size={32} className="text-teal-400" /> RELIC SELECTION
              </h2>
              <p className="text-zinc-400 text-sm">Choose one relic to carry into the auction. Its curse travels with you.</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRandomRelicSelect}
                className="mt-3 px-5 py-2 rounded-lg border border-teal-500/40 bg-teal-950/30 text-teal-300 text-sm font-bold hover:bg-teal-900/50 hover:border-teal-400/60 transition-all"
              >
                🎲 Random Relic
              </motion.button>
            </div>

            <div className="space-y-5">
              {relicGroups.map(group => group.items.length > 0 && (
                <div key={group.target} className={TARGET_GROUP_STYLES[group.target]}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${TARGET_COLORS[group.target]}`}>
                    {TARGET_GROUP_LABELS[group.target]}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map(item => renderRelicCard(item))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                onClick={() => setPhase('character_select')}
                className="text-zinc-500 hover:text-white"
                data-testid="button-haunted-item-back"
              >
                ← Back to Driver Select
              </Button>
            </div>
          </motion.div>
        );
      }

      case 'mp_driver_select':
        // Multiplayer driver selection - similar to single player but with player status
        const mpPlayers = multiplayerGameState?.players || [];
        const myMpPlayer = mpPlayers.find(p => p.socketId === socket?.id);
        const mySelectedDriver = myMpPlayer?.selectedDriver;
        const myDriverConfirmed = myMpPlayer?.driverConfirmed;
        
        const handleMpSelectDriver = (driverId: string) => {
          if (!socket || myDriverConfirmed) return;
          socket.emit('select_driver_in_game', { driverId }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
              console.log('[Game] Driver selection failed:', response.error);
            }
          });
        };
        
        const handleMpConfirmDriver = () => {
          if (!socket || !mySelectedDriver || myDriverConfirmed) return;
          socket.emit('confirm_driver', (response: { success: boolean; error?: string }) => {
            if (!response.success) {
              console.log('[Game] Driver confirmation failed:', response.error);
            } else if (variant === 'HAUNTED') {
              // In Haunted mode, go to item selection before waiting_for_ready
              setPhase('haunted_item_select');
            }
          });
        };
        
        const mpAllDrivers = [...CHARACTERS, ...(variant === 'SOCIAL_OVERDRIVE' ? SOCIAL_CHARACTERS : []), ...(variant === 'BIO_FUEL' ? BIO_CHARACTERS : [])];
        
        // Get variant-specific image for a character
        const getDriverImage = (char: typeof CHARACTERS[0]) => {
          if (variant === 'HAUNTED' && char.imageHaunted) return char.imageHaunted;
          if (variant === 'SOCIAL_OVERDRIVE' && char.imageSocial) return char.imageSocial;
          if (variant === 'BIO_FUEL' && char.imageBio) return char.imageBio;
          return char.image;
        };
        
        // Get variant-specific ability for a character
        const getDriverAbility = (char: typeof CHARACTERS[0]) => {
          if (variant === 'SOCIAL_OVERDRIVE' && char.socialAbility) return char.socialAbility;
          if (variant === 'BIO_FUEL' && char.bioAbility) return char.bioAbility;
          return char.ability;
        };
        
        // Handle random driver selection
        const handleRandomDriver = () => {
          if (myDriverConfirmed) return;
          const takenDrivers = mpPlayers
            .filter(p => p.socketId !== socket?.id && p.selectedDriver)
            .map(p => p.selectedDriver);
          const availableDrivers = mpAllDrivers.filter(c => !takenDrivers.includes(c.id));
          if (availableDrivers.length > 0) {
            const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
            handleMpSelectDriver(randomDriver.id);
          }
        };
        
        return (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full max-w-5xl mx-auto space-y-6"
          >
            <div className="text-center mb-4">
              <h2 className="text-4xl font-display font-bold text-white mb-2">CHOOSE YOUR DRIVER</h2>
              <p className="text-muted-foreground">Select your persona for the auction.</p>
              {abilitiesEnabled && (
                <p className="text-xs text-blue-400 mt-1">LIMIT BREAK ENABLED - Driver abilities active</p>
              )}
            </div>
            
            {/* Random Select Button */}
            {!myDriverConfirmed && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleRandomDriver}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                  data-testid="button-random-driver"
                >
                  <Shuffle size={16} className="mr-2" />
                  RANDOM
                </Button>
              </div>
            )}

            {/* Player Status Row */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              {mpPlayers.filter(p => !p.isBot).map(p => {
                const pDriver = mpAllDrivers.find(c => c.id === p.selectedDriver);
                const pDriverImage = pDriver ? getDriverImage(pDriver) : null;
                return (
                  <div 
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border",
                      p.socketId === socket?.id ? "bg-primary/10 border-primary/30" : "bg-black/30 border-white/10",
                      p.driverConfirmed && "border-green-500/50"
                    )}
                    data-testid={`mp-player-status-${p.id}`}
                  >
                    {pDriver && pDriverImage ? (
                      <img src={pDriverImage} alt={pDriver.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <CircleHelp size={16} className="text-zinc-500" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className={cn("text-xs", p.driverConfirmed ? "text-green-400" : "text-zinc-500")}>
                        {p.driverConfirmed ? "LOCKED IN" : pDriver ? pDriver.name : "Selecting..."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Driver Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mpAllDrivers.map(char => {
                const takenBy = mpPlayers.find(p => p.selectedDriver === char.id && p.socketId !== socket?.id);
                const isSelected = mySelectedDriver === char.id;
                const isTaken = !!takenBy;
                
                return (
                  <div key={char.id} className="relative flex flex-col">
                    <motion.button
                      whileHover={!isTaken && !myDriverConfirmed ? { scale: 1.03 } : {}}
                      whileTap={!isTaken && !myDriverConfirmed ? { scale: 0.97 } : {}}
                      onClick={() => !isTaken && !myDriverConfirmed && handleMpSelectDriver(char.id)}
                      disabled={isTaken || myDriverConfirmed}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl border transition-colors text-center w-full",
                        isSelected ? "bg-primary/20 border-primary" : "bg-black/40 border-white/10",
                        isTaken ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50",
                        myDriverConfirmed && !isSelected && "opacity-30"
                      )}
                      data-testid={`mp-driver-${char.id}`}
                    >
                      <div className={cn("w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-2 overflow-hidden border-2", 
                        isSelected ? "border-primary" : "border-white/10",
                        char.color
                      )}>
                        <img src={getDriverImage(char)} alt={char.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-white mb-0.5">{char.name}</h3>
                      <p className="text-sm sm:text-base text-primary/80 uppercase tracking-wider">{char.title}</p>
                      
                      {isTaken && (
                        <span className="text-[10px] text-red-400 mt-1">Taken by {takenBy?.name}</span>
                      )}
                    </motion.button>
                    
                    {/* Ability details shown directly below selected driver */}
                    {isSelected && !myDriverConfirmed && (abilitiesEnabled || variant !== 'STANDARD') && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-1 text-left"
                      >
                        {/* Standard Limit Break */}
                        {abilitiesEnabled && char.ability && (
                          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">
                              <Zap size={10} fill="currentColor" /> {char.ability.name}
                            </div>
                            <p className="text-[10px] text-zinc-300 leading-tight">{char.ability.description}</p>
                          </div>
                        )}
                        
                        {/* Social Overdrive */}
                        {variant === 'SOCIAL_OVERDRIVE' && char.socialAbility && (
                          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-0.5">
                              <PartyPopper size={10} /> {char.socialAbility.name}
                            </div>
                            <p className="text-[10px] text-purple-200 leading-tight">{char.socialAbility.description}</p>
                          </div>
                        )}
                        
                        {/* Bio Fuel */}
                        {variant === 'BIO_FUEL' && char.bioAbility && (
                          <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">
                              <Martini size={10} /> {char.bioAbility.name}
                            </div>
                            <p className="text-[10px] text-orange-200 leading-tight">{char.bioAbility.description}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                    
                    {/* LOCK IN overlay on selected driver */}
                    {isSelected && !myDriverConfirmed && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMpConfirmDriver(); }}
                        className="mt-2 w-full bg-primary hover:bg-primary/90 text-black font-bold text-xs py-1 shadow-lg"
                        data-testid="button-confirm-driver-inline"
                      >
                        LOCK IN
                      </Button>
                    )}
                    {isSelected && myDriverConfirmed && (
                      <div className="mt-2 w-full text-center bg-green-600 text-white font-bold text-xs py-1 rounded shadow-lg">
                        LOCKED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status message at bottom */}
            <div className="flex justify-center pt-4">
              <p className={cn(
                "text-sm",
                myDriverConfirmed ? "text-green-400" : mySelectedDriver ? "text-primary" : "text-muted-foreground"
              )}>
                {myDriverConfirmed ? "LOCKED IN - WAITING FOR OTHERS" : mySelectedDriver ? "Click LOCK IN on your selected driver" : "SELECT A DRIVER"}
              </p>
            </div>
          </motion.div>
        );

      case 'ready': {
        // Ghost spectator view
        if (variant === 'HAUNTED' && currentPlayerIsGhost) {
          const ghostPlayer = (isMultiplayer ? displayPlayers : players).find(p => 
            isMultiplayer ? p.id === myMultiplayerPlayer?.id : p.id === 'p1'
          );
          const ghostImg = ghostPlayer?.ghostImage
            ? GHOST_IMAGES[parseInt(ghostPlayer.ghostImage.replace('hnt_ghost_', ''), 10) - 1]
            : null;
          const abilityName = ghostPlayer?.ghostAbility ? GHOST_ABILITY_NAMES[ghostPlayer.ghostAbility] : null;
          const abilityDesc = ghostPlayer?.ghostAbility ? GHOST_ABILITY_DESCS[ghostPlayer.ghostAbility] : null;
          const purgatoryLeft = ghostPlayer?.possessionRoundsLeft;
          return (
            <div className="flex flex-col items-center justify-center h-[450px] gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">👻</div>
                <h2 className="text-2xl font-display text-teal-300">YOU ARE A GHOST</h2>
                <p className="text-zinc-500 text-sm mt-1">Spectating Round {round} / {totalRounds}</p>
              </div>
              {ghostImg && (
                <img src={ghostImg} alt="ghost" className="w-20 h-20 object-contain rounded-full border-2 border-teal-500/40 bg-zinc-900" />
              )}
              {abilityName && (
                <div className="bg-teal-950/30 border border-teal-500/20 rounded-lg p-3 text-center max-w-xs">
                  <div className="text-teal-300 font-bold text-sm">{abilityName}</div>
                  <div className="text-zinc-400 text-xs mt-1">{abilityDesc}</div>
                  {purgatoryLeft !== undefined && (
                    <div className="text-zinc-500 text-xs mt-1">
                      ⌛ Returns in {purgatoryLeft} round{purgatoryLeft !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              <div className="text-zinc-600 text-xs mt-4">Watch the auction unfold below ↓</div>
            </div>
          );
        }
        
        return (<>
          <div className="flex flex-col items-center justify-center h-[450px]">
            <div className="h-[100px] flex flex-col items-center justify-center space-y-2">
              <h2 className="text-3xl font-display">ROUND {round} / {totalRounds}</h2>
              {/* Ready Progress Bar Container */}
              <div className="h-6 flex items-center justify-center">
                 {allPlayersReady ? (
                    <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                         className="h-full bg-primary"
                         style={{ width: `${(readyHoldTime / READY_HOLD_DURATION) * 100}%` }}
                      />
                    </div>
                 ) : (
                    <p className="text-muted-foreground text-sm">All players must hold button to start</p>
                 )}
              </div>
            </div>
            
            <div className="h-[280px] flex items-center justify-center">
              <AuctionButton 
                onPress={handlePress} 
                onRelease={handleRelease} 
                isPressed={playerIsReady}
              />
            </div>
            
            <div className="h-[50px] flex flex-col items-center justify-start gap-2">
                <div className="flex gap-2">
                  {displayPlayers.map(p => {
                    let isVisible = true;
                    const myId = isMultiplayer 
                      ? multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id 
                      : 'p1';
                    if (p.id !== myId) {
                         if (scrambledPlayers.includes(p.id)) isVisible = false;
                         const amIHolding = displayPlayers.find(me => me.id === myId)?.isHolding;
                         if (!amIHolding) isVisible = false;
                    }

                    const isPeekTarget = peekTargetId === p.id;
                    if (isPeekTarget) isVisible = true;

                    if (isPeekTarget) {
                        return (
                             <div key={p.id} className="h-3 flex items-center justify-center">
                                 {p.isHolding ? (
                                     <span className="text-[10px] font-bold text-emerald-400 animate-pulse tracking-wider">HOLDING</span>
                                 ) : (
                                     <span className="text-[10px] font-bold text-zinc-600 tracking-wider">WAITING</span>
                                 )}
                             </div>
                        );
                    }

                    return (
                    <div key={p.id} className={cn(
                      "w-3 h-3 rounded-full transition-colors duration-300",
                      (p.isHolding && isVisible) ? "bg-primary shadow-[0_0_10px_var(--color-primary)]" : "bg-zinc-800"
                    )} title={p.name} />
                  )})}
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">
                  {displayPlayers.filter(p => p.isHolding && !p.isGhost).length} / {displayPlayers.filter(p => !p.isEliminated && !p.isGhost).length} READY
                </p>
            </div>

          </div>{/* end outer ready div */}

          {/* USE RELIC button — Haunted mode only, only if player has an unconsumed relic */}
          {variant === 'HAUNTED' && !currentPlayerIsGhost && (() => {
              const myPl = isMultiplayer
                ? displayPlayers.find(p => p.id === myMultiplayerPlayer?.id)
                : players.find(p => p.id === 'p1');
              const relicId = myPl?.selectedItem;
              if (!relicId || myPl?.relicConsumed) return null;
              const relicDef = HAUNTED_ITEMS.find(r => r.id === relicId);
              if (!relicDef) return null;

              // Séance: check if 2+ ghosts are present
              const activeGhosts = displayPlayers.filter(p => p.isGhost && !p.isEliminated);
              const seanceBlocked = relicDef.requiresGhosts !== undefined && activeGhosts.length < relicDef.requiresGhosts;
              // Sacrificial Lamb / Marked: only available in second half
              const currentRound = isMultiplayer ? (multiplayerGameState?.round ?? round) : round;
              const currentTotalRounds = isMultiplayer ? (multiplayerGameState?.totalRounds ?? totalRounds) : totalRounds;
              const secondHalfBlocked = (relicDef.id === 'sacrificial_lamb' || relicDef.id === 'marked') && currentRound <= Math.floor(currentTotalRounds / 2);
              // Last Will: blocked on final round
              const lastWillBlocked = relicDef.id === 'last_will' && currentRound >= currentTotalRounds;
              const isBlocked = seanceBlocked || secondHalfBlocked || lastWillBlocked;

              return (
                <div className="mt-3 flex flex-col items-center">
                  <button
                    onClick={() => !isBlocked && setRelicModalOpen(true)}
                    disabled={isBlocked}
                    className={cn(
                      "px-5 py-2 rounded-lg border text-sm font-bold transition-all active:scale-95",
                      isBlocked
                        ? "border-zinc-700/40 bg-zinc-900/30 text-zinc-600 cursor-not-allowed"
                        : "border-teal-500/40 bg-teal-950/30 text-teal-300 hover:bg-teal-900/50 hover:border-teal-400/60"
                    )}
                  >
                    {relicDef.icon} USE RELIC — {relicDef.name}
                  </button>
                  {seanceBlocked && (
                    <p className="text-zinc-600 text-[10px] mt-1">Requires {relicDef.requiresGhosts}+ active ghosts ({activeGhosts.length} present)</p>
                  )}
                  {secondHalfBlocked && (
                    <p className="text-zinc-600 text-[10px] mt-1">Only available in the second half (after round {Math.floor(currentTotalRounds / 2)})</p>
                  )}
                  {lastWillBlocked && (
                    <p className="text-zinc-600 text-[10px] mt-1">Cannot be used on the final round</p>
                  )}
                  {!isBlocked && <p className="text-zinc-600 text-[10px] mt-1">{relicDef.category} · → {relicDef.target}</p>}
                </div>
              );
            })()}

            {/* Relic activation modal */}
            {relicModalOpen && (() => {
              const myPl = isMultiplayer
                ? displayPlayers.find(p => p.id === myMultiplayerPlayer?.id)
                : players.find(p => p.id === 'p1');
              const relicId = myPl?.selectedItem;
              const relicDef = relicId ? HAUNTED_ITEMS.find(r => r.id === relicId) : null;
              if (!relicDef) return null;

              const myId = isMultiplayer ? (myMultiplayerPlayer?.id ?? 'p1') : 'p1';
              const opponents = (isMultiplayer ? displayPlayers : players).filter(p =>
                !p.isGhost && !p.isEliminated && p.id !== myId
              );
              const botOpponents = opponents.filter((p: any) => p.isBot);

              // Helper: fire relic in MP (emit to server) or SP (local)
              const fireRelic = (targetId?: string, curseType?: 'time' | 'trophy') => {
                if (isMultiplayer && socket) {
                  socket.emit('activate_relic', { relicId: relicDef.id, targetId, curseType }, (res: any) => {
                    if (!res?.success) {
                      toast({ title: 'RELIC FAILED', description: res?.error ?? 'Unknown error', variant: 'destructive', duration: 3000 });
                    }
                  });
                } else {
                  fireRelicEffect(relicDef.id, myId, targetId, curseType);
                }
                setRelicModalOpen(false);
              };

              if (relicDef.voteType === 'vote') {
                // Vote relics: For SP, show target selector then vote screen
                // For MP, emit to server which starts the vote
                if (relicDef.id === 'tribunal') {
                  return (
                    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
                      <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-lg font-bold text-teal-300 text-center">{relicDef.icon} {relicDef.name}</h3>
                        <p className="text-zinc-400 text-sm text-center leading-snug">{relicDef.description}</p>
                        <p className="text-zinc-500 text-xs text-center">Choose who to put on trial:</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {opponents.length === 0 && <p className="text-zinc-600 text-xs text-center">No valid targets.</p>}
                          {opponents.map((opp: any) => (
                            <button key={opp.id}
                              onClick={() => fireRelic(opp.id)}
                              className="w-full py-2 px-3 rounded bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700 transition-colors flex items-center justify-between">
                              <span>{opp.name}{opp.isBot ? ' 🤖' : ''}</span>
                              <span className="text-zinc-500 text-xs">{opp.remainingTime?.toFixed(1)}s · {opp.tokens}🏆</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setRelicModalOpen(false)} className="w-full py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
                      </div>
                    </div>
                  );
                }
                // Conclave (no target needed)
                return (
                  <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6 max-w-sm w-full space-y-4">
                      <h3 className="text-lg font-bold text-teal-300 text-center">{relicDef.icon} {relicDef.name}</h3>
                      <p className="text-zinc-400 text-sm text-center leading-snug">{relicDef.description}</p>
                      <p className="text-zinc-500 text-xs text-center">All players will vote on one of these effects:</p>
                      <div className="space-y-1 text-xs text-zinc-400 bg-zinc-800/50 rounded p-3">
                        <p>🔪 <span className="text-zinc-300">A</span> — Cut everyone's time bank in half</p>
                        <p>⏭️ <span className="text-zinc-300">B</span> — Skip next round as a tie</p>
                        <p>🔁 <span className="text-zinc-300">C</span> — 100% protocols rest of game</p>
                        <p>💥 <span className="text-zinc-300">D</span> — Bottom 2 players lose a trophy</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => fireRelic()} className="flex-1 py-2 rounded bg-teal-900 text-teal-100 text-sm font-bold hover:bg-teal-800 transition-colors">Start Vote</button>
                        <button onClick={() => setRelicModalOpen(false)} className="flex-1 py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
                      </div>
                    </div>
                  </div>
                );
              }

              const isLastWill = relicDef.id === 'last_will';
              const needsOpponentTarget = relicDef.target === 'Opponent' && !isLastWill;
              const targetList = relicDef.botOnly ? botOpponents : opponents;

              return (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6 max-w-sm w-full space-y-4">
                    <h3 className="text-lg font-bold text-teal-300 text-center">{relicDef.icon} {relicDef.name}</h3>
                    <p className="text-zinc-400 text-sm text-center leading-snug">{relicDef.description}</p>
                    <p className="text-zinc-600 text-xs text-center italic">{relicDef.flavour}</p>

                    {/* Self, Everyone, or Last Will relics — activate immediately */}
                    {(relicDef.target === 'Self' || relicDef.target === 'Everyone' || isLastWill) && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => fireRelic()}
                          className="flex-1 py-2 rounded bg-teal-900 text-teal-100 text-sm font-bold hover:bg-teal-800 transition-colors"
                        >
                          ✓ Activate
                        </button>
                        <button onClick={() => setRelicModalOpen(false)} className="flex-1 py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
                      </div>
                    )}

                    {/* Opponent-targeted relics */}
                    {needsOpponentTarget && (
                      <>
                        <p className="text-zinc-500 text-xs text-center">Choose target:</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {targetList.length === 0 && (
                            <p className="text-zinc-600 text-xs text-center">No valid targets available.</p>
                          )}
                          {targetList.map((opp: any) => (
                            <button
                              key={opp.id}
                              onClick={() => fireRelic(opp.id)}
                              className="w-full py-2 px-3 rounded bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700 transition-colors flex items-center justify-between"
                            >
                              <span>{opp.name}{opp.isBot ? ' 🤖' : ''}</span>
                              <span className="text-zinc-500 text-xs">{opp.remainingTime.toFixed(1)}s · {opp.tokens}🏆</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setRelicModalOpen(false)} className="w-full py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
                      </>
                    )}
                  </div>
                </div>
              );
          })()}

          {/* Vote Relic overlay (SP + MP) */}
          {voteRelicState && !voteRelicState.resolved && (
            <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-lg font-bold text-teal-300 text-center">
                  {voteRelicState.relicId === 'tribunal' ? '⚖️ TRIBUNAL' : '🗳️ THE CONCLAVE'}
                </h3>
                <p className="text-zinc-400 text-sm text-center">
                  {voteRelicState.activatorName} called a vote{voteRelicState.targetName ? ` targeting ${voteRelicState.targetName}` : ''}!
                </p>
                <div className="text-center text-teal-300 font-bold tabular-nums">{voteRelicState.timeLeft}s</div>
                <div className="space-y-2">
                  {voteRelicState.options.map(opt => {
                    const count = Object.values(voteRelicState.votes).filter(v => v === opt.id).length;
                    const hasVoted = voteRelicState.myVote === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (voteRelicState.myVote) return; // already voted
                          if (isMultiplayer && socket) {
                            socket.emit('cast_relic_vote', { optionId: opt.id });
                            setVoteRelicState(prev => prev ? { ...prev, myVote: opt.id } : prev);
                          } else {
                            const updated = { ...voteRelicState, votes: { ...voteRelicState.votes, p1: opt.id }, myVote: opt.id };
                            setVoteRelicState(updated);
                            resolveVoteRelicSP(updated);
                          }
                        }}
                        className={cn(
                          "w-full py-2 px-3 rounded text-sm text-left flex justify-between transition-colors",
                          hasVoted ? "bg-teal-900 border border-teal-500/50 text-teal-200" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
                          voteRelicState.myVote && !hasVoted ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <span><span className="font-bold text-teal-400">{opt.id}.</span> {opt.label}</span>
                        <span className="text-zinc-500 text-xs ml-2">{count} vote{count !== 1 ? 's' : ''}</span>
                      </button>
                    );
                  })}
                </div>
                {!voteRelicState.myVote && <p className="text-zinc-600 text-xs text-center">Vote before time runs out!</p>}
                {voteRelicState.myVote && <p className="text-zinc-600 text-xs text-center">Vote cast! Waiting for others…</p>}
              </div>
            </div>
          )}

          {/* Vote Relic result overlay */}
          {voteRelicState?.resolved && voteRelicState.winnerLabel && (
            <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6 max-w-sm w-full text-center space-y-3">
                <h3 className="text-lg font-bold text-teal-300">VOTE RESULT</h3>
                <p className="text-zinc-200 text-sm font-semibold">{voteRelicState.winnerLabel}</p>
                <p className="text-zinc-500 text-xs">Effect applied!</p>
                <button onClick={() => setVoteRelicState(null)} className="mt-2 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors">Dismiss</button>
              </div>
            </div>
          )}
        </>
        );
      }

      case 'countdown': {
        // Ghost spectator view
        if (variant === 'HAUNTED' && currentPlayerIsGhost) {
          const ghostPlayer = (isMultiplayer ? displayPlayers : players).find(p => 
            isMultiplayer ? p.id === myMultiplayerPlayer?.id : p.id === 'p1'
          );
          const ghostImg = ghostPlayer?.ghostImage
            ? GHOST_IMAGES[parseInt(ghostPlayer.ghostImage.replace('hnt_ghost_', ''), 10) - 1]
            : null;
          const abilityName = ghostPlayer?.ghostAbility ? GHOST_ABILITY_NAMES[ghostPlayer.ghostAbility] : null;
          const abilityDesc = ghostPlayer?.ghostAbility ? GHOST_ABILITY_DESCS[ghostPlayer.ghostAbility] : null;
          const purgatoryLeft = ghostPlayer?.possessionRoundsLeft;
          return (
            <div className="flex flex-col items-center justify-center h-[450px] gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">👻</div>
                <h2 className="text-2xl font-display text-teal-300">YOU ARE A GHOST</h2>
                <p className="text-zinc-500 text-sm mt-1">Spectating Round {round} / {totalRounds}</p>
              </div>
              {ghostImg && (
                <img src={ghostImg} alt="ghost" className="w-20 h-20 object-contain rounded-full border-2 border-teal-500/40 bg-zinc-900" />
              )}
              {abilityName && (
                <div className="bg-teal-950/30 border border-teal-500/20 rounded-lg p-3 text-center max-w-xs">
                  <div className="text-teal-300 font-bold text-sm">{abilityName}</div>
                  <div className="text-zinc-400 text-xs mt-1">{abilityDesc}</div>
                  {purgatoryLeft !== undefined && (
                    <div className="text-zinc-500 text-xs mt-1">
                      ⌛ Returns in {purgatoryLeft} round{purgatoryLeft !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              <div className="text-zinc-600 text-xs mt-4">Watch the auction unfold below ↓</div>
            </div>
          );
        }
        
        return (
          <div className="flex flex-col items-center justify-center h-[450px]"> 
             <div className="h-[100px] flex flex-col items-center justify-center space-y-2"> 
              <h2 className="text-3xl font-display text-destructive">PREPARE TO BID</h2>
               <p className="text-muted-foreground">
                 {`Release now to abandon auction (-${Math.max(0, isMultiplayer ? (multiplayerGameState?.minBid ?? 2) : getTimerStart()).toFixed(1)}s)`}
               </p>
            </div>
            
            <div className="h-[280px] flex items-center justify-center relative"> 
               <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
               </div>
               
               <div className="z-20 text-9xl font-display font-black text-destructive animate-ping absolute pointer-events-none">
                  {isMultiplayer ? Math.max(0, multiplayerGameState?.countdownRemaining ?? 0) : Math.max(0, countdown)}
               </div>

               <div className="z-10 relative">
                 <AuctionButton 
                    onPress={handlePress} 
                    onRelease={handleRelease} 
                    isPressed={isMultiplayer ? currentPlayerIsHolding : (players.find(p => p.id === 'p1')?.isHolding ?? false)}
                    disabled={isMultiplayer ? currentPlayerEliminated : !(players.find(p => p.id === 'p1')?.isHolding ?? false)} 
                  />
                  {/* Inline Overlay for Countdown Phase */}
                  <GameOverlay 
                    overlays={overlays}
                    onDismiss={removeOverlay}
                    inline={true}
                  />
               </div>
            </div>
            
            <div className="h-[50px]"></div> 
          </div>
        );
      }

      case 'bidding': {
        // Ghost spectator view
        if (variant === 'HAUNTED' && currentPlayerIsGhost) {
          const ghostPlayer = (isMultiplayer ? displayPlayers : players).find(p => 
            isMultiplayer ? p.id === myMultiplayerPlayer?.id : p.id === 'p1'
          );
          const ghostImg = ghostPlayer?.ghostImage
            ? GHOST_IMAGES[parseInt(ghostPlayer.ghostImage.replace('hnt_ghost_', ''), 10) - 1]
            : null;
          const abilityName = ghostPlayer?.ghostAbility ? GHOST_ABILITY_NAMES[ghostPlayer.ghostAbility] : null;
          const abilityDesc = ghostPlayer?.ghostAbility ? GHOST_ABILITY_DESCS[ghostPlayer.ghostAbility] : null;
          const purgatoryLeft = ghostPlayer?.possessionRoundsLeft;
          return (
            <div className="flex flex-col items-center justify-center h-[450px] gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">👻</div>
                <h2 className="text-2xl font-display text-teal-300">AUCTION IN PROGRESS</h2>
                <p className="text-zinc-500 text-sm mt-1">Spectating Round {round} / {totalRounds}</p>
              </div>
              {ghostImg && (
                <img src={ghostImg} alt="ghost" className="w-20 h-20 object-contain rounded-full border-2 border-teal-500/40 bg-zinc-900" />
              )}
              {abilityName && (
                <div className="bg-teal-950/30 border border-teal-500/20 rounded-lg p-3 text-center max-w-xs">
                  <div className="text-teal-300 font-bold text-sm">{abilityName}</div>
                  <div className="text-zinc-400 text-xs mt-1">{abilityDesc}</div>
                  {purgatoryLeft !== undefined && (
                    <div className="text-zinc-500 text-xs mt-1">
                      ⌛ Returns in {purgatoryLeft} round{purgatoryLeft !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              <div className="text-zinc-600 text-xs mt-4">Watch the auction unfold below ↓</div>
            </div>
          );
        }
        
        const fireWallHudImmune = selectedCharacter?.id === 'low_flame' && abilitiesEnabled;
        const isBlackout = (activeProtocol === 'DATA_BLACKOUT' || activeProtocol === 'SYSTEM_FAILURE') && !fireWallHudImmune;
        const displayTime = isMultiplayer ? currentPlayerBid : currentTime;
        const calTarget = isMultiplayer ? (multiplayerGameState?.calibrationTargetSeconds ?? null) : calibrationTarget;
        
        return (
          <div className="flex flex-col items-center justify-center h-[450px]">
            {/* CALIBRATION Target Banner */}
            {activeProtocol === 'CALIBRATION' && calTarget !== null && (
              <div className="mb-2 px-4 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-center">
                <span className="text-xs text-yellow-400 uppercase tracking-widest font-bold">⚙ CALIBRATION TARGET: </span>
                <span className="text-xl font-mono font-bold text-yellow-300">{calTarget}s</span>
                <span className="text-xs text-yellow-400/60 ml-2">— closest bid wins</span>
              </div>
            )}
                        {/* Timer Area */}
                         <div className="h-[120px] flex items-center justify-center mb-0">
                            {isMultiplayer ? (
                              // Multiplayer: Match singleplayer - show time for first 10 seconds, then ??
                              displayTime <= 10 && !isBlackout ? (
                                <div className="scale-75">
                                <TimerDisplay time={displayTime} isRunning={true} />
                                  </div>
                              ) : (
                                <div className={cn("flex flex-col items-center justify-center p-4 rounded-lg glass-panel border-accent/20 bg-black/40 w-[320px]", isBlackout && "border-destructive/20")}>
                                  <span className={cn("text-muted-foreground text-xs tracking-[0.2em] font-display mb-1", isBlackout && "text-destructive")}>
                                    {isBlackout ? "SYSTEM ERROR" : "AUCTION TIME"}
                                  </span>
                                  <div className={cn("text-4xl font-mono text-zinc-700", isBlackout ? "text-destructive/50" : "")}>
                                    {isBlackout ? "ERROR" : "??:??.?"}
                                  </div>
                                  {!currentPlayerIsHolding && !isBlackout && (
                                    <span className="text-xs text-green-400 mt-1">BID LOCKED</span>
                                  )}
                                </div>
                              )
                            ) : showDetails && !isBlackout && currentTime <= 10 ? (
            <div className="scale-75">
                              <TimerDisplay time={currentTime} isRunning={true} />
              </div>
                            ) : (
                              <div className={cn("flex flex-col items-center justify-center p-4 rounded-lg glass-panel border-accent/20 bg-black/40 w-[320px]", isBlackout && "border-destructive/20")}>
                                 <span className={cn("text-muted-foreground text-xs tracking-[0.2em] font-display mb-1", isBlackout && "text-destructive")}>
                                   {isBlackout ? "SYSTEM ERROR" : "AUCTION TIME"}
                                 </span>
                     <div className={cn("text-4xl font-mono text-zinc-700", isBlackout ? "text-destructive/50" : "")}>
                       {activeProtocol === 'SYSTEM_FAILURE' && !fireWallHudImmune
                          // System failure: mostly scrambled, 25% chance of real time (increased from 5%)
                          ? (Math.random() > 0.75 ? currentTime.toFixed(1) : `${Math.floor(Math.random()*99)}:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*9)}`) 
                          : isBlackout ? "ERROR" : "??:??.?"}
                     </div>
                  </div>
                )}
             </div>
            
            <div className="h-[280px] flex items-center justify-center relative">
               <div className="relative">
                  <AuctionButton 
                    onPress={handlePress} 
                    onRelease={handleRelease} 
                    isPressed={currentPlayerIsHolding}
                    disabled={!currentPlayerIsHolding || currentPlayerEliminated}
                    isWaiting={false} // No waiting in bidding phase visually
                    showPulse={false}
                  />
                                    {/* Inline Overlay for Bidding Phase */}
                  <GameOverlay 
                    overlays={overlays}
                    onDismiss={removeOverlay}
                    inline={true}
                  />
              </div>
            </div>
            
             <div className="h-[50px] flex flex-col items-center justify-start">
               {/* Removed text below button as requested */}
             </div>
          </div>
        );
      }

      case 'round_end':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 mt-10 max-w-md mx-auto h-[450px] relative"
          >
            {/* Inline Overlay for Round End Phase - Positioned centrally/top or relative to content? 
                User said "below Next Round button". But typically popups are alerts.
                If I put it relative to the container, it might overlap.
                Let's put it below the button. */}
                
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display text-muted-foreground">ROUND {round} RESULTS</h2>
              {roundWinner ? (
                <div className="py-6 space-y-4 flex flex-col items-center">
                  <div className="relative">
                    <Trophy size={64} className="mx-auto text-primary relative z-10" />
                    {/* Winner Image Behind Trophy or Next to it */}
                     {displayPlayers.find(p => p.name === roundWinner.name)?.characterIcon && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden border-4 border-primary/50 shadow-[0_0_20px_var(--color-primary)] z-0 opacity-80">
                           {typeof displayPlayers.find(p => p.name === roundWinner.name)?.characterIcon === 'string' ? (
                             <img src={displayPlayers.find(p => p.name === roundWinner.name)?.characterIcon as string} alt="Winner" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full bg-zinc-800" />
                           )}
                        </div>
                     )}
                  </div>
                  
                  {/* Clean layout for image + text */}
                   <div className="flex items-center justify-center gap-4 mt-4">
                     {displayPlayers.find(p => p.name === roundWinner.name)?.characterIcon && typeof displayPlayers.find(p => p.name === roundWinner.name)?.characterIcon === 'string' && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-lg">
                           <img src={displayPlayers.find(p => p.name === roundWinner.name)?.characterIcon as string} alt="Winner" className="w-full h-full object-cover" />
                        </div>
                     )}
                     <div className="text-left">
                        <h1 className="text-4xl font-bold text-white mb-1 leading-none">{roundWinner.name} WINS ROUND</h1>
                        <p className="text-xl font-mono text-primary">{formatTime(roundWinner.time)}</p>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="py-6 space-y-4">
                  <AlertTriangle size={64} className="mx-auto text-muted-foreground" />
                  <div>
                    <h1 className="text-4xl font-bold text-muted-foreground mb-2">NO WINNER</h1>
                    <p className="text-zinc-500">Tie or No Bids</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full bg-card/50 p-4 rounded border border-white/5 space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Bid History</h4>
              {displayPlayers
                .filter(p => p.currentBid !== null && p.currentBid !== 0)
                .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0))
                .filter(p => {
                  if (showDetails) return true; 
                  if (!roundWinner) return true; 
                  return p.name === roundWinner.name; 
                })
                .map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className={p.name === roundWinner?.name ? "text-primary font-bold" : (p.currentBid || 0) < 0 ? "text-red-400" : "text-zinc-300"}>
                    {p.name}
                  </span>
                  <span className={cn("font-mono", (p.currentBid || 0) < 0 && "text-red-400")}>
                    {(p.currentBid || 0) < 0 ? `${p.currentBid?.toFixed(1)}s (PENALTY)` : formatTime(p.currentBid || 0)}
                  </span>
                </div>
              ))}
              {!showDetails && displayPlayers.filter(p => p.currentBid !== null && p.currentBid !== 0).length > (roundWinner ? 1 : 0) && (
                 <div className="text-center text-xs text-zinc-600 italic mt-2">
                   + {displayPlayers.filter(p => p.currentBid !== null && p.currentBid !== 0).length - (roundWinner ? 1 : 0)} other hidden bids
                 </div>
              )}
            </div>

            {isMultiplayer ? (() => {
              const mpHumanPlayers = displayPlayers.filter(p => !p.isBot && !p.isEliminated);
              const isCurrentPlayerEliminated = myMultiplayerPlayer?.isEliminated;
              const myAck = mpHumanPlayers.find(p => p.id === myMultiplayerPlayer?.id);
              const hasAcknowledged = (myAck as any)?.roundEndAcknowledged;
              const readyCount = mpHumanPlayers.filter(p => (p as any).roundEndAcknowledged).length;
              
              // Eliminated players just spectate - no button needed
              if (isCurrentPlayerEliminated) {
                return (
                  <div className="space-y-2 text-center">
                    <div className="text-zinc-400 text-sm italic">Spectating...</div>
                    <div className="flex justify-center gap-2">
                      {mpHumanPlayers.map(p => (
                        <div 
                          key={p.id} 
                          className={cn(
                            "w-3 h-3 rounded-full transition-colors duration-300",
                            (p as any).roundEndAcknowledged 
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
                              : "bg-zinc-700"
                          )} 
                          title={`${p.name}: ${(p as any).roundEndAcknowledged ? 'Ready' : 'Waiting'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Waiting for {mpHumanPlayers.length - readyCount} player(s)
                    </p>
                  </div>
                );
              }

              // Ghost ability action panel for MP human ghosts
              const mpGhostAbilityUsed = (myMultiplayerPlayer as any)?.ghostAbilityUsed;
              const mpGhostAbility = (myMultiplayerPlayer as any)?.ghostAbility as GhostAbilityType | null;
              const aliveForGhost = displayPlayers.filter(p => !p.isGhost && !p.isEliminated);
              const ghostAbilityPanel = currentPlayerIsGhost && mpGhostAbility && !mpGhostAbilityUsed && socket ? (
                <div className="bg-teal-950/40 border border-teal-500/40 rounded-xl p-4 mb-3 text-center space-y-3">
                  <div className="text-teal-300 font-bold text-sm">{GHOST_ABILITY_NAMES[mpGhostAbility] ?? mpGhostAbility.toUpperCase()}</div>
                  <div className="text-zinc-400 text-xs">{GHOST_ABILITY_DESCS[mpGhostAbility] ?? ''}</div>
                  {mpGhostAbility === 'purgatory' && (
                    <div className="text-zinc-500 text-xs italic">Auto-activating…</div>
                  )}
                  {mpGhostAbility === 'reaper' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-400">Select a player to ghost:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {aliveForGhost.map(t => (
                          <button key={t.id}
                            onClick={() => {
                              socket.emit('resolve_ghost_ability', { ability: 'reaper', targetId: t.id }, (res: any) => {
                                if (res?.success) addOverlay('ability_trigger', '💀 REAPER', `You ghosted ${t.name}! You will return in 2 rounds.`, 0);
                              });
                            }}
                            className="flex flex-col items-center p-2 rounded-lg border border-red-500/30 bg-black/40 hover:border-red-400 text-xs text-zinc-300 transition-colors">
                            {typeof t.characterIcon === 'string' && <img src={t.characterIcon} alt={t.name} className="w-8 h-8 rounded-full mb-1 object-cover" />}
                            <span className="font-bold text-red-300">{t.name}</span>
                            <span className="text-zinc-500">{t.remainingTime.toFixed(1)}s</span>
                          </button>
                        ))}
                      </div>
                      {aliveForGhost.length === 0 && (
                        <p className="text-zinc-500 text-xs">No alive players to target.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null;
              
              return (
                <div className="space-y-2">
                  {ghostAbilityPanel}
                  <div className="relative">
                    <Button 
                      onClick={() => {
                        if (socket && !hasAcknowledged) {
                          socket.emit("player_ready_next");
                          console.log('[Game] Emitted player_ready_next');
                        }
                      }} 
                      size="lg" 
                      className={cn(
                        "w-full",
                        hasAcknowledged 
                          ? "bg-green-600 hover:bg-green-600 text-white" 
                          : "bg-white text-black hover:bg-zinc-200"
                      )}
                      disabled={hasAcknowledged}
                    >
                      {hasAcknowledged ? "WAITING FOR OTHERS..." : "NEXT ROUND"}
                    </Button>
                    {/* Inline Overlay anchored directly below the Next Round button */}
                    <GameOverlay
                      overlays={overlays}
                      onDismiss={removeOverlay}
                      inline={true}
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    {mpHumanPlayers.map(p => (
                      <div 
                        key={p.id} 
                        className={cn(
                          "w-3 h-3 rounded-full transition-colors duration-300",
                          (p as any).roundEndAcknowledged 
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
                            : "bg-zinc-700"
                        )} 
                        title={`${p.name}: ${(p as any).roundEndAcknowledged ? 'Ready' : 'Waiting'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-zinc-500">
                    {readyCount} / {mpHumanPlayers.length} ready
                  </p>
                </div>
              );
            })() : (
              <div className="relative">
                <Button onClick={nextRound} size="lg" className="w-full bg-white text-black hover:bg-zinc-200">
                  NEXT ROUND
                </Button>
                {/* Inline Overlay anchored directly below the Next Round button */}
                <GameOverlay
                  overlays={overlays}
                  onDismiss={removeOverlay}
                  inline={true}
                />
              </div>
            )}
          </motion.div>
        );

    case 'game_end':

        // Sort players by tokens (desc), then time (desc) - use displayPlayers for MP data
        const sortedPlayers = [...displayPlayers].sort((a, b) => {
          if (b.tokens !== a.tokens) return b.tokens - a.tokens;
          return b.remainingTime - a.remainingTime;
        });
        const winner = sortedPlayers[0];
        const loser = sortedPlayers[sortedPlayers.length - 1];
        const topThree = sortedPlayers.slice(0, 3);

        // Determine if Prom King won in Social mode (for special game over text)
        const isPromKingWin = variant === 'SOCIAL_OVERDRIVE' && abilitiesEnabled && (
          winner?.selectedDriver === 'prom_king' ||
          (!isMultiplayer && selectedCharacter?.id === 'prom_king' && winner?.id === 'p1')
        );

        // Helper to get the correct character image based on variant
        const getCharacterImage = (selectedDriver: string | undefined) => {
          if (!selectedDriver) return null;

          // Search in all possible character arrays (base + variant-specific)
          let char = CHARACTERS.find((c: any) => c.id === selectedDriver);

          // If not found in base CHARACTERS, check variant-specific arrays if they exist
          if (!char && typeof SOCIAL_CHARACTERS !== 'undefined') {
            char = (SOCIAL_CHARACTERS as any[]).find((c: any) => c.id === selectedDriver);
          }
          if (!char && typeof BIO_CHARACTERS !== 'undefined') {
            char = (BIO_CHARACTERS as any[]).find((c: any) => c.id === selectedDriver);
          }

          if (!char) return null;

          // Return the correct image based on current variant
          if (variant === 'HAUNTED' && char.imageHaunted) {
            return char.imageHaunted;
          } else if (variant === 'SOCIAL_OVERDRIVE' && char.imageSocial) {
            return char.imageSocial;
          } else if (variant === 'BIO_FUEL' && char.imageBio) {
            return char.imageBio;
          }

          // Fallback to standard image
          return char.image;
        };

        // Helper to get character name
        const getCharacterName = (selectedDriver: string | undefined) => {
          if (!selectedDriver) return 'No Driver';

          let char = CHARACTERS.find((c: any) => c.id === selectedDriver);
          if (!char && typeof SOCIAL_CHARACTERS !== 'undefined') {
            char = (SOCIAL_CHARACTERS as any[]).find((c: any) => c.id === selectedDriver);
          }
          if (!char && typeof BIO_CHARACTERS !== 'undefined') {
            char = (BIO_CHARACTERS as any[]).find((c: any) => c.id === selectedDriver);
          }

          return char?.name || 'Unknown';
        };

        // Helper to render full player stat card
        const renderPlayerCard = (p: any, i: number) => {
          // Show logo on winner card only (human player's equipped logo)
          const isWinnerCard = p.id === winner.id;
          const isHumanCard = !isMultiplayer ? p.id === 'p1' : p.socketId === socket?.id;
          const cardLogoUrl = isWinnerCard && isHumanCard ? getLogoUrl(myCosmetics) : null;
          // Apply cosmetics (border + background) to the human player's card
          const cardStyle = isHumanCard ? getCardStyles(myCosmetics) : {};
          const cardBorderImgUrl = isHumanCard ? getBorderImageUrl(myCosmetics) : null;

          return (
          <div key={p.id} className={cn(
            "p-4 rounded border bg-card/50 flex flex-col gap-2 relative isolate",
            p.id === winner.id && "border-primary/50 bg-primary/10",
            p.id === loser.id && !p.isGhost ? "border-destructive/50 bg-destructive/10" : "border-white/10"
          )} style={cardStyle}>
            {/* Image-based border overlay: PNG has transparent background so only the decorative ring shows */}
            {cardBorderImgUrl && (
              <img
                src={cardBorderImgUrl}
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none z-20 rounded"
                style={{ top: '-8px', right: '-8px', bottom: '-8px', left: '-8px',
                         width: 'calc(100% + 16px)', height: 'calc(100% + 16px)',
                         objectFit: 'fill' }}
                loading="eager"
                decoding="async"
              />
            )}
            {p.id === winner.id && <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-0.5">WINNER</div>}
            {p.id === loser.id && !p.isGhost && <div className="absolute top-0 right-0 bg-destructive text-white text-[10px] font-bold px-2 py-0.5">ELIMINATED</div>}
            {p.isGhost && p.id !== winner.id && <div className="absolute top-0 right-0 bg-teal-800/80 text-teal-200 text-[10px] font-bold px-2 py-0.5">👻 GHOST</div>}

            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-xl text-zinc-500">#{i + 1}</span>
              <span className="font-bold text-lg">{p.name}</span>
              {/* Winner logo badge */}
              {cardLogoUrl && (
                <img
                  src={cardLogoUrl}
                  alt="logo"
                  className="w-6 h-6 object-contain rounded ml-1 opacity-90"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/20 p-2 rounded">
                <div className="text-zinc-500">Time Left</div>
                <div className="font-mono text-white">{formatTime(p.remainingTime)}</div>
              </div>
              <div className={cn(
                "p-2 rounded border",
                (p.netImpact ?? 0) >= 0 
                  ? "bg-emerald-950/30 border-emerald-500/20" 
                  : "bg-red-950/30 border-red-500/20"
              )}>
                <div className={(p.netImpact ?? 0) >= 0 ? "text-emerald-400/70" : "text-red-400/70"}>Net Impact</div>
                <div className={cn("font-mono", (p.netImpact ?? 0) >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {(p.netImpact ?? 0) >= 0 ? '+' : ''}{(p.netImpact ?? 0).toFixed(1)}s
                </div>
              </div>
            </div>

          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <div 
              className="bg-purple-950/30 p-2 rounded border border-purple-500/20 cursor-pointer hover:bg-purple-950/50 transition-colors active:scale-95" 
              onClick={() => {
                const flags = p.eventDatabasePopups?.length > 0 ? p.eventDatabasePopups.join(', ') : 'None';
                toast({
                  title: `${p.name}: Moment Flags`,
                  description: flags,
                  duration: 5000,
                });
              }}
            >
              <div className="text-purple-400/70">Moment Flags</div>
              <div className="font-mono text-purple-300">{p.eventDatabasePopups?.length || 0}</div>
            </div>
            <div 
              className="bg-destructive/10 p-2 rounded border border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors active:scale-95" 
              onClick={() => {
                const protocols = p.protocolWins?.length > 0 ? p.protocolWins.join(', ') : 'None';
                toast({
                  title: `${p.name}: Protocol Wins`,
                  description: protocols,
                  duration: 5000,
                });
              }}
            >
              <div className="text-destructive/70">Protocol Wins</div>
              <div className="font-mono text-destructive">{p.protocolWins?.length || 0}</div>
            </div>
            <div className="bg-yellow-950/30 p-2 rounded border border-yellow-500/20">
              <div className="text-yellow-400/70">Trophies</div>
              <div className="font-mono text-yellow-300">{p.tokens}</div>
            </div>
          </div>
            </div>
        );
        };

          return (
            <div className="flex flex-col h-[800px]">
              {/* FIXED HEADER SECTION - Game Over + Podium + Play Again */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4 pb-6 bg-gradient-to-b from-black/90 via-black/70 to-transparent">
                <GameOverlay overlays={overlays} onDismiss={removeOverlay} />

                {/* Prom King wins in Social mode: special game over text */}
                {isPromKingWin ? (
                  <h1 className="text-4xl sm:text-5xl font-display font-bold text-purple-300 text-center pt-8">Clap for the King! 👑</h1>
                ) : (
                  <h1 className="text-4xl sm:text-5xl font-display font-bold text-white text-center pt-8">GAME OVER</h1>
                )}

                {/* Compact Podium - Top 3 with driver images */}
                <div className="w-full max-w-3xl px-4">
                  <div className="flex items-end justify-center gap-2 sm:gap-4">
                    {/* 2nd Place - Left, lower */}
                    {topThree[1] && (
                      <div className="flex flex-col items-center gap-1 flex-1" style={{ marginTop: '30px' }}>
                        <div className="text-2xl sm:text-3xl font-bold text-zinc-400">2nd</div>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-zinc-400 overflow-hidden bg-zinc-800">
                          {(() => {
                            const p = topThree[1];
                            const imgSrc = (variant === 'HAUNTED' && (p as any).isGhost && (p as any).ghostImage)
                              ? GHOST_IMAGES[parseInt((p as any).ghostImage.replace('hnt_ghost_', ''), 10) - 1]
                              : getCharacterImage(p.selectedDriver);
                            return imgSrc ? (
                              <img src={imgSrc} alt={getCharacterName(p.selectedDriver)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-600">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white text-center">{topThree[1].name}{(topThree[1] as any).isGhost ? ' 👻' : ''}</div>
                        <div className="text-[10px] sm:text-xs text-zinc-400 text-center">
                          {getCharacterName(topThree[1].selectedDriver)}
                        </div>
                      </div>
                    )}

                    {/* 1st Place - Center, highest */}
                    {topThree[0] && (
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-3xl sm:text-5xl font-bold text-primary">1st</div>
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-primary overflow-hidden bg-primary/10 shadow-lg shadow-primary/50">
                          {(() => {
                            const p = topThree[0];
                            const imgSrc = (variant === 'HAUNTED' && (p as any).isGhost && (p as any).ghostImage)
                              ? GHOST_IMAGES[parseInt((p as any).ghostImage.replace('hnt_ghost_', ''), 10) - 1]
                              : getCharacterImage(p.selectedDriver);
                            return imgSrc ? (
                              <img src={imgSrc} alt={getCharacterName(p.selectedDriver)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/50">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-sm sm:text-base font-bold text-white text-center">{topThree[0].name}{(topThree[0] as any).isGhost ? ' 👻' : ''}</div>
                        <div className="text-xs sm:text-sm text-primary text-center">
                          {getCharacterName(topThree[0].selectedDriver)}
                        </div>
                      </div>
                    )}

                    {/* 3rd Place - Right, lower */}
                    {topThree[2] && (
                      <div className="flex flex-col items-center gap-1 flex-1" style={{ marginTop: '50px' }}>
                        <div className="text-xl sm:text-2xl font-bold text-amber-700">3rd</div>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-700 overflow-hidden bg-amber-900/30">
                          {(() => {
                            const p = topThree[2];
                            const imgSrc = (variant === 'HAUNTED' && (p as any).isGhost && (p as any).ghostImage)
                              ? GHOST_IMAGES[parseInt((p as any).ghostImage.replace('hnt_ghost_', ''), 10) - 1]
                              : getCharacterImage(p.selectedDriver);
                            return imgSrc ? (
                              <img src={imgSrc} alt={getCharacterName(p.selectedDriver)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-amber-700/50">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white text-center">{topThree[2].name}{(topThree[2] as any).isGhost ? ' 👻' : ''}</div>
                        <div className="text-[10px] sm:text-xs text-zinc-400 text-center">
                          {getCharacterName(topThree[2].selectedDriver)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Play Again Button */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 items-center">
                <Button 
                  onClick={() => {
                    if (isMultiplayer && socket) {
                      socket.emit("leave_lobby");
                      setMultiplayerGameState(null);
                      setCurrentLobby(null);
                      setLobbyCode("");
                      eliminationPopupShownRef.current = false;
                      setPhase('multiplayer_lobby');
                      setRound(1);
                      setOverlays([]);
                      setRoundLog([]);
                      const time = getInitialTime();
                      setPlayers([
                        { 
                          id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: time, isEliminated: false, currentBid: null, isHolding: false,
                          totalTimeBid: 0, netImpact: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
                        },
                        ...createRandomBots(time),
                      ]);
                    } else {
                      quitGame();
                    }
                  }} 
                  variant="outline" 
                  size="lg" 
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Play Again
                </Button>
                <Link href="/profile">
                  <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10">
                    <User className="mr-2 h-4 w-4" /> Profile &amp; Shop
                  </Button>
                </Link>
                </div>
                  </div>

              {/* SCROLLABLE RESULTS SECTION */}
              <div className="flex-1 overflow-y-auto px-4 pb-10" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(239, 68, 68, 0.5) rgba(0, 0, 0, 0.3)'
              }}>
                <style>{`
                  .flex-1::-webkit-scrollbar {
                    width: 8px;
                  }
                  .flex-1::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                  }
                  .flex-1::-webkit-scrollbar-thumb {
                    background: rgba(239, 68, 68, 0.5);
                    border-radius: 4px;
                  }
                  .flex-1::-webkit-scrollbar-thumb:hover {
                    background: rgba(239, 68, 68, 0.7);
                  }
                `}</style>

                <div className="w-full max-w-3xl mx-auto">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-400 mb-4 text-center">Full Results</h2>
                  <div className="flex flex-col gap-3">
                    {sortedPlayers.map((p, i) => renderPlayerCard(p, i))}
                  </div>
                </div>
              </div>
            </div>
             );
             }
             };
  
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;

      // Immediately stop any in-flight SFX when muting
      if (!next) {
        if (sfxInFlightRef.current) {
          try {
            sfxInFlightRef.current.pause();
            sfxInFlightRef.current.currentTime = 0;
          } catch {}
          sfxInFlightRef.current = null;
        }
      }

      return next;
    });
  };

  return (
    <GameLayout variant={variant}>
      <MusicPlayer soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      {/* Header Info - Minimizable Banner */}
      <div className={cn(
        "mb-8 border-b border-white/5 pb-4 transition-all duration-300 overflow-hidden",
        bannerExpanded ? "max-h-[500px]" : "max-h-[80px] sm:max-h-[50px]"
      )}>
        <div className="flex flex-col items-center gap-4">
          {/* Always visible top row: Quit + Title + Chevron + Lobby Code + Round + 21+ Badge */}
          <div className="flex items-center gap-3 justify-center w-full">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {phase !== 'intro' && (
                <Button variant="ghost" size="icon" onClick={quitGame} className="text-white hover:text-white hover:bg-white/10" title="Quit to Menu" data-testid="button-quit-to-menu">
                  <LogOut size={20} />
                </Button>
              )}

              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors py-2 px-3 rounded"
                onClick={() => setBannerExpanded(!bannerExpanded)}
              >
                {/* <img src={logoFuturistic} alt="Logo" className="h-6 sm:h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> */}
                <h1 className="font-display font-bold text-sm sm:text-xl tracking-wider whitespace-nowrap">REDLINE AUCTION</h1>
                <ChevronDown className={cn("w-4 h-4 text-white transition-transform duration-300", bannerExpanded && "rotate-180")} />
              </div>

              {isMultiplayer && currentLobby && phase !== 'multiplayer_lobby' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs">
                  <Users size={12} className="text-primary" />
                  <span className="text-zinc-400">Room:</span>
                  <span className="font-mono font-bold text-primary tracking-wider" data-testid="text-game-lobby-code">{currentLobby.code}</span>
                </div>
              )}

              {/* Round Badge - Always Visible */}
              <Badge variant="outline" className="font-mono text-sm sm:text-lg px-3 sm:px-4 py-1 border-white/10 bg-white/5" data-testid="badge-round">
                ROUND {round} / {totalRounds}
              </Badge>

              {/* 21+ Badge - Always Visible when BIO_FUEL */}
              {variant === 'BIO_FUEL' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-950/40 border border-orange-500/30 rounded text-xs text-orange-300">
                  <AlertTriangle size={12} className="text-orange-500" />
                  <span className="font-bold tracking-widest">21+ ONLY</span>
                </div>
              )}

              {/* Player Profile / Guest indicator */}
              <PlayerProfileWidget
                equippedLogoUrl={getLogoUrl(myCosmetics)}
                showNavLinks
              />
            </div>
          </div>

          {/* Expandable content - all the settings */}
          {bannerExpanded && (
            <div className="w-full flex items-center justify-center">
              <div className="max-w-full px-2">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6">
                  {/* CASUAL / COMPETITIVE (Difficulty) */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleDifficulty}
                      className="h-6 px-2 text-xs font-mono hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                      title={difficulty === 'CASUAL' ? 'CASUAL: Everyone can see time banks.' : 'COMPETITIVE: Time banks are hidden until the end.'}
                      data-testid="button-toggle-difficulty"
                    >
                      {difficulty === 'CASUAL' ? <Eye size={12} className="text-emerald-400"/> : <EyeOff size={12} className="text-zinc-400"/>}
                      <span className={difficulty === 'CASUAL' ? "text-emerald-400" : "text-zinc-400"}>
                        {difficulty}
                      </span>
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-4 bg-white/10" />

                  {/* PROTOCOLS */}
                  <div className="flex items-center gap-2" title="Protocols: Round modifiers that add party/drinking prompts (in Reality Modes).">
                    <Switch 
                      id="protocols" 
                      checked={protocolsEnabled} 
                      onCheckedChange={setProtocolsEnabled} 
                      className={cn(
                        "scale-75 origin-right",
                        "data-[state=checked]:bg-red-500",
                        variant === 'SOCIAL_OVERDRIVE' && "data-[state=checked]:bg-purple-500",
                        variant === 'BIO_FUEL' && "data-[state=checked]:bg-orange-500"
                      )}
                      data-testid="switch-protocols"
                    />
                    <Label
                      htmlFor="protocols"
                      className={cn(
                        "text-sm cursor-pointer flex items-center gap-1",
                        protocolsEnabled ? "text-zinc-100" : "text-zinc-400",
                        variant === 'SOCIAL_OVERDRIVE' && protocolsEnabled && "text-purple-200",
                        variant === 'BIO_FUEL' && protocolsEnabled && "text-orange-200"
                      )}
                      data-testid="label-protocols"
                    >
                      {variant === 'SOCIAL_OVERDRIVE' ? (
                        <PartyPopper size={12} className={protocolsEnabled ? "text-purple-400" : "text-zinc-500"} />
                      ) : variant === 'BIO_FUEL' ? (
                        <Martini size={12} className={protocolsEnabled ? "text-orange-400" : "text-zinc-500"} />
                      ) : (
                        <AlertTriangle size={12} className={protocolsEnabled ? "text-zinc-200" : "text-zinc-500"} />
                      )}
                      Protocols
                    </Label>
                    <button onClick={() => setShowProtocolGuide(true)} className="text-zinc-500 hover:text-white transition-colors ml-1" title="Protocol Database" data-testid="button-protocol-database">
                      <BookOpen size={14} />
                    </button>
                  </div>

                  <Separator orientation="vertical" className="h-4 bg-white/10" />

                  {/* LIMIT BREAKS */}
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="abilities" 
                      checked={abilitiesEnabled} 
                      onCheckedChange={setAbilitiesEnabled} 
                      className="data-[state=checked]:bg-blue-500 scale-75 origin-right"
                      data-testid="switch-limit-breaks"
                    />
                    <Label htmlFor="abilities" className={cn("text-sm cursor-pointer flex items-center gap-1", abilitiesEnabled ? "text-blue-400" : "text-zinc-400")} title="Limit Breaks: Driver-specific passive powers." data-testid="label-limit-breaks">
                      <Zap size={12}/>
                      LIMIT BREAKS
                    </Label>
                  </div>

                  <Separator orientation="vertical" className="h-4 bg-white/10" />

                  {/* REALITY MODES VARIANT */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleVariant}
                      className="h-6 px-2 text-xs font-mono hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                      title={
                        variant === 'STANDARD'
                          ? 'STANDARD: Pure auction, no social or drinking modifiers.'
                          : variant === 'SOCIAL_OVERDRIVE'
                            ? 'SOCIAL OVERDRIVE: Adds social dares and group prompts.'
                            : variant === 'BIO_FUEL'
                              ? 'BIO-FUEL: Adds drinking prompts and 21+ content.'
                              : 'HAUNTED: Ghost mechanics and spectral bidding.'
                      }
                      data-testid="button-toggle-variant"
                    >
                      <span className={getVariantColor()}>{getVariantIcon()}</span>
                      <span className={cn("tracking-widest", getVariantColor())}>
                        {variant.replace('_', ' ')}
                      </span>
                    </Button>
                  </div>

                  {/* MOMENT FLAGS BUTTON */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white ml-2"
                    onClick={() => setShowPopupLibrary(true)}
                    title="Moment Flags"
                    data-testid="button-moment-flags"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest save-progress banner */}
      <GuestBanner />

      {/* POPUP LIBRARY DIALOG */}
      <Dialog open={showPopupLibrary} onOpenChange={setShowPopupLibrary}>
        <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <div className="flex flex-col gap-3">
              <div>
                <DialogTitle className="font-display tracking-widest text-2xl mb-4 text-primary flex items-center gap-2">
                  <CircleHelp /> MOMENT FLAGS
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Moment Flags are special in-game achievements.
                </DialogDescription>
              </div>

              {/* Patch Notes & CONTACT BUTTON - Stacked */}
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPatchNotes(true)}
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 flex items-center justify-center gap-2 w-full"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  Patch Notes
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContact(true)}
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center justify-center gap-2 w-full"
                >
                  <Mail size={12} />
                  Contact
                </Button>

                <a
                  href="https://donate.stripe.com/8x2dRbdxf9jA0AUbTx1oI00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-400/60 transition-colors"
                >
                  <Heart size={12} className="fill-emerald-400" />
                  Donate
                </a>
              </div>
            </div>
          </DialogHeader>

            <div className="space-y-4 mt-4">


              {/* Game State Flags */}
              <details className="bg-black/40 rounded border border-purple-500/20">
                <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-purple-300">
                  Game State Flags
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Elims & Edge Cases</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pt-3">
                  {[ 
                    { title: "SMUG CONFIDENCE", desc: "Win Round 1.", color: "text-purple-400 border-purple-500/20" },
                    { title: "COMEBACK HOPE", desc: "Win while having the least tokens.", color: "text-teal-600 border-teal-600/20" },
                    { title: "PLAYER ELIMINATED", desc: "Player runs out of time.", color: "text-red-800 border-red-800/20" },
                    { title: "AFK", desc: "No one bids or everyone abandons.", color: "text-amber-600 border-amber-600/20" },
                  ].map((p, i) => (
                    <div key={i} className={`bg-black/40 p-3 rounded border ${p.color} transition-colors`}>
                      <h4 className={`font-bold text-sm mb-1 ${p.color.split(' ')[0]}`}>{p.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </details>
      
              {/* Skill-based Flags - MOVED INSIDE */}
              <details className="bg-black/40 rounded border border-blue-500/20">
                <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-blue-300">
                  High-Skill Flags
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Consistency & Precision</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pt-3">
                  {[ 
                    { title: "GENIUS MOVE", desc: "Win by margin < 5s.", color: "text-cyan-400 border-cyan-500/20" },
                    { title: "PRECISION STRIKE", desc: "Win with an exact integer bid (e.g. 20.0s).", color: "text-blue-600 border-blue-600/20" },
                    { title: "CLUTCH PLAY", desc: "Win with < 10s remaining in bank.", color: "text-lime-500 border-lime-500/20" },
                    { title: "EASY W", desc: "Win with a bid under 20s.", color: "text-teal-400 border-teal-400/20" },
                  ].map((p, i) => (
                    <div key={i} className={`bg-black/40 p-3 rounded border ${p.color} transition-colors`}>
                      <h4 className={`font-bold text-sm mb-1 ${p.color.split(' ')[0]}`}>{p.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </details>


              {/* Chaos & Drama Flags */}
              <details className="bg-black/40 rounded border border-orange-500/20">
                <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-orange-300">
                  Chaos & Drama Flags
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Swingy, Loud Moments</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pt-3">
                  {[ 
                    { title: "FAKE CALM", desc: "Win by margin > 15s.", color: "text-amber-400 border-amber-500/20" },
                    { title: "OVERKILL", desc: "Win with a bid over 60s.", color: "text-red-400 border-red-500/20" },
                    { title: "LAST ONE STANDING", desc: "Win the final round while at least one player was eliminated.", color: "text-pink-600 border-pink-600/20" },
                    { title: "LATE PANIC", desc: "Win starting the round with the lowest time bank.", color: "text-orange-500 border-orange-500/20" },
                    { title: "DEADLOCK SYNC", desc: "Exact tie for first place. No winner.", color: "text-zinc-400 border-zinc-400/20" },
                    { title: "MIRROR MATCH", desc: "Two or more players end the round with the same time bank (within 0.1s).", color: "text-[#d2b48c] border-[#d2b48c]/20" },
                  ].map((p, i) => (
                    <div key={i} className={`bg-black/40 p-3 rounded border ${p.color} transition-colors`}>
                      <h4 className={`font-bold text-sm mb-1 ${p.color.split(' ')[0]}`}>{p.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </details>


              {/* Hidden Flags Placeholder */}
              <details className="bg-black/40 rounded border border-zinc-700/60">
                <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-zinc-200">
                  Hidden Moment Flags
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Easter Eggs</span>
                </summary>
                <div className="p-4 pt-3 space-y-3">
                  <p className="text-xs text-zinc-500 italic">Easter egg moments. Unlock by playing.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[0,1,2,3,4,5].map((i) => (
                      <div key={i} className="h-14 rounded border border-white/10 bg-white/5 flex items-center justify-between px-3">
                        <div className="h-2 w-24 rounded bg-white/10" />
                        <div className="h-2 w-10 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => setShowPopupLibrary(false)} variant="secondary" className="w-full">
                CLOSE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PATCH NOTES DIALOG - SEPARATE DIALOG */}
        <Dialog open={showPatchNotes} onOpenChange={setShowPatchNotes}>
          <DialogContent className="max-w-md bg-black/90 border-yellow-500/30 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-display tracking-widest text-xl text-yellow-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                PATCH NOTES
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Thanks for your support! The auction continues to evolve...
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-4">
                <div className="space-y-2 text-sm text-yellow-200/90">
                  <div className="flex gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>New popups for click & lowflame</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>Bonus trophies added when playing with Protocols</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>2 new standard protocols added</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => setShowPatchNotes(false)} variant="secondary" className="w-full">
                CLOSE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* CONTACT DIALOG - SEPARATE, MOVE YOUR ENTIRE CONTACT DIALOG HERE */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-md bg-black/90 border-blue-500/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-xl text-blue-400 flex items-center gap-2">
              <Mail size={16} />
              CONTACT
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send us your feedback, bug reports, or suggestions
            </DialogDescription>
          </DialogHeader>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                const res = await fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message')
                  })
                });
                const data = await res.json();
                if (data.success) {
                  toast({ title: "Message Sent", description: "Thank you for your feedback!", duration: 3000 });
                  setShowContact(false);
                } else {
                  toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
                }
              } catch {
                toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
              }
            }} className="space-y-4 mt-4">

               <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Name</Label>
                  <Input
                    placeholder="Your name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-black/50 border-blue-500/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-black/50 border-blue-500/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Message</Label>
                  <textarea
                    placeholder="Tell us what's on your mind..."
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-blue-500/20 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowContact(false)}>
                    CANCEL
                  </Button>
                  <Button 
                    type="button" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/contact', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: contactName,
                            email: contactEmail,
                            message: contactMessage
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast({ title: "Message Sent", description: "Thank you for your feedback!", duration: 3000 });
                          setContactName('');
                          setContactEmail('');
                          setContactMessage('');
                          setShowContact(false);
                        } else {
                          toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
                      }
                    }}
                  >
                    SEND MESSAGE
                  </Button>
                </DialogFooter>
              </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showProtocolGuide} onOpenChange={setShowProtocolGuide}>
        <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-2xl mb-4 text-zinc-100 flex items-center gap-2">
              {variant === 'SOCIAL_OVERDRIVE' ? (
                <PartyPopper className="text-purple-400" />
              ) : variant === 'BIO_FUEL' ? (
                <Martini className="text-orange-400" />
              ) : (
                <AlertTriangle className="text-zinc-300" />
              )}
              PROTOCOL DATABASE
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              When PROTOCOLS are enabled, random events may trigger & bonus trophies will be assesed at game over.
              <span className="block mt-2 text-xs text-zinc-500" data-testid="text-protocol-db-trigger-rates">
                Trigger rates by game pace: SPEED 50% • STANDARD 40% • MARATHON 30% (per round, when Protocols are enabled).
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {variant === 'BIO_FUEL' && (
              <div className="rounded-lg border border-orange-500/30 bg-orange-950/30 p-3 flex items-center gap-3 text-orange-200 text-sm" data-testid="callout-bio-disclaimer">
                <Martini className="shrink-0 text-orange-500" size={18} />
                <p><strong>DISCLAIMER:</strong> Bio-Fuel mode is intended for adults (21+). Please play responsibly.</p>
              </div>
            )}

            <details className="rounded-lg border border-red-500/20 bg-red-950/15 overflow-hidden" data-testid="section-protocol-db-standard">
              <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <div className="text-sm font-bold text-red-200 tracking-widest">STANDARD PROTOCOLS</div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-red-300/70">13 protocols</div>
              </summary>

              <div className="px-4 pb-4 space-y-3">
                {[ 
                  {
                    id: 'db_standard_hud',
                    title: 'HUD & MECHANICS',
                    subtitle: 'Visibility & Interaction',
                    items: [
                      { name: "DATA BLACKOUT", desc: "All timers and clocks are hidden from the HUD.", type: "Visual" },
                      { name: "SYSTEM FAILURE", desc: "HUD glitches and timers display random scrambled numbers.", type: "Visual" },
                      { name: "OVERCLOCK", desc: "After prepare to bid: click the button as many times as you can in 15 seconds. Most clicks wins the round token. Least clicks loses 35s.", type: "Interactive" },
                      { name: "CALIBRATION", desc: "A random target hold time (15-40s) is assigned. Players hold as close to the target as possible.", type: "Precision" },
                    ]
                  },
                  {
                    id: 'db_standard_stakes',
                    title: 'STAKES & PAYOUTS',
                    subtitle: 'Economy modifiers',
                    items: [
                      { name: "HIGH STAKES", desc: "Winner receives DOUBLE tokens for this round.", type: "Economy" },
                      { name: "PANIC ROOM", desc: "Game speed 2x (also doubles win tokens).", type: "Game State" },
                    ]
                  },
                  {
                    id: 'db_standard_rules',
                    title: 'TABLE RULES',
                    subtitle: 'Social & physical constraints',
                    items: [
                      { name: "OPEN HAND", desc: "One player must publicly state they will not bid (Bluffing allowed).", type: "Social" },
                      { name: "MUTE PROTOCOL", desc: "Complete silence enforced. Speaking is shunned.", type: "Social" },
                      { name: "NO LOOK", desc: "Players cannot look at screens until they release button.", type: "Physical" },
                    ]
                  },
                  {
                    id: 'db_standard_secret',
                    title: 'SECRET PROTOCOLS',
                    subtitle: 'Secret for some players',
                    items: [
                      { name: "THE MOLE", desc: "A hidden role is assigned. The Mole's bid does not impact their time bank. If the Mole wins by MORE than 7.0s, they LOSE an additional trophy.", type: "Hidden Role" },
                      { name: "PRIVATE CHANNEL", desc: "Two players are selected to privately coordinate strategy.", type: "Team" },
                      { name: "UNDERDOG VICTORY", desc: "Lowest valid bid wins token (kept secret until reveal).", type: "Secret" },
                      { name: "TIME TAX", desc: "-10s for everyone.", type: "Secret" },
                    ]
                  }
                ].map((cat) => (
                  <details key={cat.id} className="rounded-lg border border-red-500/15 bg-black/30" data-testid={`section-protocol-db-${cat.id}`}>
                    <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-red-100 tracking-widest">{cat.title}</div>
                        <div className="text-[11px] text-zinc-500">{cat.subtitle}</div>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600">{cat.items.length}</div>
                    </summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 pt-0">
                      {cat.items.map((p, i) => (
                        <div key={i} className="bg-red-950/15 p-4 rounded border border-red-500/10 hover:border-red-500/25 transition-colors" data-testid={`card-protocol-db-${cat.id}-${i}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-red-100 text-sm">{p.name}</h4>
                            <Badge variant="outline" className="text-[10px] py-0 h-5 border-red-500/20 text-red-300/70">{p.type}</Badge>
                          </div>
                          <p className="text-xs text-red-200/70 leading-relaxed">{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>

            <details className="rounded-lg border border-purple-500/20 bg-purple-950/15 overflow-hidden" data-testid="section-protocol-db-social">
              <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PartyPopper size={14} className="text-purple-400" />
                  <div className="text-sm font-bold text-purple-200 tracking-widest">SOCIAL OVERDRIVE</div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-purple-400/70">5 protocols</div>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
                {[
                  { name: "TRUTH DARE", desc: "Winner asks a Truth, Loser does a Dare.", type: "Social" },
                  { name: "SWITCH SEATS", desc: "Players must physically swap seats before next round.", type: "Physical" },
                  { name: "HUM TUNE", desc: "You must hum a song while bidding. If you stop, you forfeit.", type: "Social" },
                  { name: "LOCK ON", desc: "Maintain eye contact while bidding.", type: "Social" },
                  { name: "NOISE CANCEL", desc: "One player must make noise for 15s.", type: "Social" },
                ].map((p, i) => (
                  <div key={`social-${i}`} className="bg-purple-500/5 p-4 rounded border border-purple-500/20 hover:border-purple-500/50 transition-colors" data-testid={`card-protocol-db-social-${i}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-purple-200 text-sm">{p.name}</h4>
                      <Badge variant="outline" className="text-[10px] py-0 h-5 border-purple-500/20 text-purple-400">{p.type}</Badge>
                    </div>
                    <p className="text-xs text-purple-300/70 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="rounded-lg border border-orange-500/20 bg-orange-950/15 overflow-hidden" data-testid="section-protocol-db-bio">
              <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Martini size={14} className="text-orange-400" />
                  <div className="text-sm font-bold text-orange-200 tracking-widest">BIO-FUEL</div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-orange-400/70">4 protocols</div>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
                {[
                  { name: "HYDRATE", desc: "Everyone takes a sip.", type: "Bio" },
                  { name: "BOTTOMS UP", desc: "Winner must finish their drink.", type: "Bio" },
                  { name: "LINKED SYSTEMS", desc: "Pick a partner. When you drink, they drink.", type: "Bio" },
                  { name: "WATER ROUND", desc: "Winner gives a glass of water to someone.", type: "Bio" },
                ].map((p, i) => (
                  <div key={`bio-${i}`} className="bg-orange-500/5 p-4 rounded border border-orange-500/20 hover:border-orange-500/50 transition-colors" data-testid={`card-protocol-db-bio-${i}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-orange-200 text-sm">{p.name}</h4>
                      <Badge variant="outline" className="text-[10px] py-0 h-5 border-orange-500/20 text-orange-400">{p.type}</Badge>
                    </div>
                    <p className="text-xs text-orange-300/70 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowProtocolGuide(false)} variant="secondary" className="w-full">
              ACKNOWLEDGE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PLAYER DETAILS DIALOG */}
      <Dialog open={!!selectedPlayerStats} onOpenChange={(o) => !o && setSelectedPlayerStats(null)}>
        <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
                {(() => {
                  const dialogPlayerId = isMultiplayer ? multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id : 'p1';
                  const isDialogCurrentPlayer = selectedPlayerStats?.id === dialogPlayerId;
                  const dialogDriverId = isDialogCurrentPlayer
                    ? (isMultiplayer
                        ? ((multiplayerGameState?.players.find(mp => mp.socketId === socket?.id) as any)?.selectedDriver ?? selectedCharacter?.id)
                        : selectedCharacter?.id)
                    : undefined;
                  const dialogSkinUrl = isDialogCurrentPlayer && myCosmetics ? getDriverSkinUrl(myCosmetics, dialogDriverId) : null;
                  return (
                    <div
                      className="w-14 h-14 rounded-lg overflow-hidden border border-white/20 relative flex-shrink-0 cursor-zoom-in"
                      title={typeof selectedPlayerStats?.characterIcon === 'string' ? 'Click to expand portrait' : undefined}
                      onClick={() => {
                        if (typeof selectedPlayerStats?.characterIcon === 'string') {
                          setExpandedDialogPortrait({ url: selectedPlayerStats.characterIcon, skin: dialogSkinUrl });
                        }
                      }}
                    >
                        {typeof selectedPlayerStats?.characterIcon === 'string' ? (
                            <img src={selectedPlayerStats.characterIcon} alt={selectedPlayerStats?.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800"><User /></div>
                        )}
                        {dialogSkinUrl && (
                          <img src={dialogSkinUrl} alt="skin" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                    </div>
                  );
                })()}
                <div className="flex flex-col">
                  <span className="font-display tracking-widest uppercase text-xl">{selectedPlayerStats?.name}</span>
                  {selectedPlayerStats?.driverName && (
                    <span className="text-xs text-primary/70">{selectedPlayerStats.driverName}</span>
                  )}
                </div>
                {selectedPlayerStats?.isBot && <Badge variant="secondary" className="ml-2 text-[10px]">BOT</Badge>}
            </DialogTitle>
            <DialogDescription>
                {selectedPlayerStats?.driverAbility ? selectedPlayerStats.driverAbility : 'Detailed player statistics and abilities.'}
            </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
                {/* Ability Section */}
                <div className="bg-white/5 p-4 rounded border border-white/10">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Zap size={14} className="text-blue-400"/> ABILITIES</h4>
                    {/* Show abilities based on current mode */}
                    {(() => {
                        // Find character definition to get ability details
                        // For multiplayer: use selectedDriver ID, for singleplayer: match by name
                        const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
                        const char = selectedPlayerStats?.selectedDriver 
                          ? allChars.find(c => c.id === selectedPlayerStats.selectedDriver)
                          : allChars.find(c => c.name === selectedPlayerStats?.name);
                        if (!char) return <p className="text-zinc-500 text-xs">No driver abilities available.</p>;
                        
                        return (
                            <div className="space-y-3">
                                <div className="text-xs">
                                    <span className="text-blue-300 font-bold block">{char.ability?.name}</span>
                                    <span className="text-zinc-400">{char.ability?.description}</span>
                                </div>
                                
                                {variant === 'SOCIAL_OVERDRIVE' && char.socialAbility && (
                                    <div className="text-xs pt-2 border-t border-white/5">
                                        <span className="text-purple-300 font-bold block flex items-center gap-1"><PartyPopper size={10}/> {char.socialAbility.name}</span>
                                        <span className="text-zinc-400">{char.socialAbility.description}</span>
                                    </div>
                                )}
                                
                                {variant === 'BIO_FUEL' && char.bioAbility && (
                                    <div className="text-xs pt-2 border-t border-white/5">
                                        <span className="text-orange-300 font-bold block flex items-center gap-1"><Martini size={10}/> {char.bioAbility.name}</span>
                                        <span className="text-zinc-400">{char.bioAbility.description}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Stats Grid - Hidden if masked (time = -1) */}
                {selectedPlayerStats?.remainingTime !== -1 && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/30 p-3 rounded">
                            <div className="text-[10px] text-zinc-500 uppercase">Tokens</div>
                            <div className="text-xl font-mono text-primary">{selectedPlayerStats?.tokens}</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded">
                            <div className="text-[10px] text-zinc-500 uppercase">Time Left</div>
                            <div className={cn("text-xl font-mono text-white", difficulty === 'COMPETITIVE' && phase !== 'game_end' && !selectedPlayerStats?.isBot && selectedPlayerStats?.id !== (isMultiplayer ? multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id : 'p1') && "blur-sm select-none")}>
                                {(() => {
                      const currentPlayerId = isMultiplayer ? multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id : 'p1';
                      const isSelfSadman = selectedPlayerStats?.id === currentPlayerId && selectedCharacter?.id === 'sadman' && abilitiesEnabled;
                      const isScrambledOpponent = selectedCharacter?.id === 'wandering_eye' && selectedPlayerStats?.id !== currentPlayerId && abilitiesEnabled;  
                                    if (isSelfSadman || isScrambledOpponent) {
                                        return `${Math.floor(Math.random()*99)}:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*9)}`;
                                    }
                                    return selectedPlayerStats?.remainingTime ? formatTime(selectedPlayerStats.remainingTime) : "00:00.0";
                                })()}
                            </div>
                        </div>
                        <div className={cn(
                          "p-3 rounded",
                          (selectedPlayerStats?.netImpact ?? 0) >= 0 
                            ? "bg-emerald-950/30 border border-emerald-500/20" 
                            : "bg-red-950/30 border border-red-500/20"
                        )}>
                            <div className="text-[10px] text-zinc-500 uppercase">Net Impact</div>
                            <div className={cn("text-sm font-mono", (selectedPlayerStats?.netImpact ?? 0) >= 0 ? "text-emerald-300" : "text-red-300")}>
                              {(selectedPlayerStats?.netImpact ?? 0) >= 0 ? '+' : ''}{(selectedPlayerStats?.netImpact ?? 0).toFixed(1)}s
                            </div>
                        </div>
                    </div>
                )}
                 {selectedPlayerStats?.remainingTime === -1 && (
                    <div className="bg-black/30 p-3 rounded flex items-center justify-center text-zinc-500 text-xs italic">
                        STATS HIDDEN IN COMPETITIVE MODE
                    </div>
                 )}

                 {/* Haunted Mode: Show held relic info */}
                 {variant === 'HAUNTED' && selectedPlayerStats?.selectedItem && (() => {
                   const relicDef = HAUNTED_ITEMS.find(r => r.id === selectedPlayerStats.selectedItem);
                   if (!relicDef) return null;
                   return (
                     <div className="bg-teal-950/30 p-3 rounded border border-teal-500/20">
                       <h4 className="text-xs font-bold text-teal-300 mb-1 flex items-center gap-1">
                         <span>{relicDef.icon}</span> RELIC — {relicDef.name}
                         {selectedPlayerStats.relicConsumed && (
                           <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded border border-zinc-600/50 bg-zinc-800/50 text-zinc-500">CONSUMED</span>
                         )}
                       </h4>
                       <p className="text-[10px] text-zinc-400 leading-snug">{relicDef.description}</p>
                       {relicDef.flavour && <p className="text-[10px] text-zinc-600 italic mt-1">{relicDef.flavour}</p>}
                     </div>
                   );
                 })()}
            </div>
        </DialogContent>
      </Dialog>

      {/* Expanded portrait overlay */}
      {expandedDialogPortrait && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[300] cursor-zoom-out"
          onClick={() => setExpandedDialogPortrait(null)}
        >
          <div
            className="relative inline-block overflow-hidden rounded-lg shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-2 right-2 z-10 text-white/70 hover:text-white bg-black/40 rounded-full p-1"
              onClick={() => setExpandedDialogPortrait(null)}
            >
              <X size={18} />
            </button>
            <img
              src={expandedDialogPortrait.url}
              alt="Driver Portrait"
              className="block max-h-[80vh] max-w-[80vw] object-contain rounded-lg"
            />
            {expandedDialogPortrait.skin && (
              <img
                src={expandedDialogPortrait.skin}
                alt="skin"
                className="absolute inset-0 w-full h-full object-contain rounded-lg pointer-events-none"
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[600px]">
        {/* Main Game Area */}
        <div className="lg:col-span-3 relative bg-black/20 rounded-2xl border border-white/5 p-8 flex flex-col items-center min-h-[500px]">
          {/* Background Grid Decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          
          <div className="relative z-10 w-full">
            {renderPhaseContent()}
          </div>
        </div>

        {/* Sidebar / Stats */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-display text-muted-foreground text-sm tracking-widest mb-4">
            PLAYERS {isMultiplayer && <span className="text-primary text-xs">(LIVE)</span>}
          </h3>
          <div className="space-y-3">
            {displayPlayers.map((p, idx) => {
              const myPlayerId = isMultiplayer ? multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id : 'p1';
              const isCurrentPlayerCard = myPlayerId === p.id;
              const isPeekCharacter = selectedCharacter?.id === 'sadman' || selectedCharacter?.id === 'wandering_eye';
              const isFireWallActive = selectedCharacter?.id === 'low_flame' && abilitiesEnabled;
              // Peek target: a non-roll_safe opponent the peek ability is currently focused on
              const isPeekTarget = isPeekCharacter && peekTargetId === p.id && (p as any).selectedDriver !== 'roll_safe' && abilitiesEnabled;
              // DATA_BLACKOUT and SYSTEM_FAILURE must not apply their visual effects to the peek target —
              // abilities take priority over protocols. LOWFLAME (Fire Wall) is always immune.
              const systemFailureApplies = activeProtocol === 'SYSTEM_FAILURE' && !isFireWallActive && !isPeekTarget;
              const cardSystemFailure = systemFailureApplies || (p.id === 'p1' && selectedCharacter?.id === 'sadman' && abilitiesEnabled);
              // HYPER CLICK indicator: shown when click-click's limit break triggers this round
              const isHyperClickActive = abilitiesEnabled && (
                isMultiplayer
                  ? ((p as any).abilityUsed === true && (p as any).selectedDriver === 'click_click')
                  : activeAbilities.some(a => a.playerId === p.id && a.ability === 'HYPER CLICK' && a.effect === 'TOKEN_BOOST')
              );
              // Determine current driver ID for skin gating:
              // SP: use selectedCharacter.id; MP: use the player's selectedDriver field
              const myCurrentDriverId = isCurrentPlayerCard
                ? (isMultiplayer
                    ? ((multiplayerGameState?.players.find(mp => mp.socketId === socket?.id) as any)?.selectedDriver ?? selectedCharacter?.id)
                    : selectedCharacter?.id)
                : undefined;
              return (
              <PlayerStats 
                key={p.id} 
                player={p} 
                isCurrentPlayer={isCurrentPlayerCard} 
                showTime={showDetails || phase === 'game_end' || p.isEliminated} 
                // Show time if: Casual Mode OR Game Over OR Player Eliminated
                remainingTime={p.remainingTime}
                formatTime={formatTime}
                peekActive={isPeekTarget}
                isDoubleTokens={isDoubleTokens}
                isSystemFailure={cardSystemFailure}
                isHyperClickActive={isHyperClickActive}
                hideEliminated={variant === 'HAUNTED'}
                isScrambled={(((isMultiplayer ? (p.id !== myPlayerId) : (p.id !== 'p1')) && selectedCharacter?.id === 'wandering_eye' && p.id !== peekTargetId) || scrambledPlayers.includes(p.id)) && abilitiesEnabled}
                equippedCosmetics={isCurrentPlayerCard ? myCosmetics : undefined}
                currentDriverId={myCurrentDriverId}
                // Hide details if competitive mode (ALWAYS, unless game end)
                onClick={() => {
                    if (difficulty === 'COMPETITIVE' && phase !== 'game_end') {
                         setSelectedPlayerStats({...p, remainingTime: -1, tokens: -1, netImpact: 0}); 
                    } else {
                         setSelectedPlayerStats(p);
                    }
                }}
              >
                 {animations.filter(a => a.playerId === p.id).map(a => (
                    <AbilityAnimation 
                        key={a.id} 
                        type={a.type} 
                        value={a.value} 
                        onComplete={() => removeAnimation(a.id)} 
                    />
                 ))}
              </PlayerStats>
              );
            })}
          </div>

          <Separator className="bg-white/10 my-6" />

          {showDetails ? (
          <div className="bg-card/30 rounded p-4 border border-white/5 h-[300px] flex flex-col">
            <h3 className="font-display text-muted-foreground text-xs tracking-widest mb-2 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2"><SkipForward size={12} /> GAME LOG</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-4 text-[10px] px-1 ${showAllLogs ? 'text-emerald-400' : 'text-zinc-500'}`}
                onClick={() => setShowAllLogs(!showAllLogs)}
              >
                {showAllLogs ? 'ALL' : 'BASIC'}
              </Button>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-zinc-500 custom-scrollbar">
              {(() => {
                const mpLogs = isMultiplayer && multiplayerGameState?.gameLog 
                  ? multiplayerGameState.gameLog : [];
                const spLogs = !isMultiplayer ? roundLog : [];
                
                let logs: string[] = [];
                if (isMultiplayer && mpLogs.length > 0) {
                  const filtered = showAllLogs ? mpLogs : mpLogs.filter(log => log.basic === true);
                  logs = filtered.map(l => l.message);
                } else {
                  logs = showAllLogs ? spLogs : spLogs.filter(log => {
                    const upper = log.toUpperCase();
                    return upper.includes('ROUND') || upper.includes('WON') || 
                           upper.includes('WINNER') || upper.includes('ELIMINATED') || 
                           upper.includes('TOKEN') || upper.includes('TROPHY') ||
                           upper.includes('MOLE FAILURE') || upper.includes('HIGH STAKES') ||
                           upper.includes('UNDERDOG VICTORY') || upper.includes('TIME TAX');
                  });
                }
                if (logs.length === 0) return <p className="italic opacity-50">Game started...</p>;
                return logs.map((log, i) => (
                  <div key={i} className="border-b border-white/5 pb-1 mb-1 last:border-0">{log}</div>
                ));
              })()}
            </div>
          </div>
          ) : (
          <div className="bg-card/30 rounded p-4 border border-white/5 h-[300px] flex flex-col items-center justify-center">
            <h3 className="font-display text-muted-foreground text-xs tracking-widest mb-2">GAME LOG</h3>
            <p className="text-zinc-600 text-xs italic">Hidden in Competitive Mode</p>
          </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
