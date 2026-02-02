import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast"; // Added toast hook
import { useSocket } from "@/lib/socket";
import { GameLayout } from "@/components/game/GameLayout";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { AuctionButton } from "@/components/game/AuctionButton";
import { PlayerStats } from "@/components/game/PlayerStats";
import { MusicPlayer } from "@/components/game/MusicPlayer";

import bioAccuserOption1 from "../assets/generated_images/bio_accuser_girl_pointing_v5.png";
import bioPanicBotOption3 from "../assets/generated_images/bio_panic_bot_option3.png";

import socialSadmanOption3 from "../assets/generated_images/social_sadman_option3.png";
import socialRainbowDashOption1 from "../assets/generated_images/social_rainbow_dash_option1.png";
import socialGuardianHOption1 from "../assets/generated_images/social_guardian_h_option1.png";
import socialFrostybyteOption1 from "../assets/generated_images/social_frostybyte_option1.png";
import socialExecutivePOption1 from "../assets/generated_images/social_executive_p_detailed_v4.png";

import socialPainHiderOption1 from "../assets/generated_images/social_pain_hider_life_support_v6.png";
import socialPanicBotOption1 from "../assets/generated_images/social_panic_bot_toy_v2.png";
import socialAccuserOption1 from "../assets/generated_images/social_accuser_pointing_v4.png";
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
  Users, Globe, Lock, BookOpen, CircleHelp, Martini, PartyPopper, Skull, Info, Share2, Shuffle
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

// Import Generated Images
import charHarambe from '@assets/generated_images/cyberpunk_gorilla_guardian.png';
import charPopcat from '@assets/generated_images/cyberpunk_popcat.png';
import charWinter from '@assets/generated_images/cyberpunk_winter_soldier.png';
import charDoge from '@assets/generated_images/cyberpunk_shiba_inu_astronaut.png';
import charPepe from '@assets/generated_images/cyberpunk_sad_green_alien_analyst.png';
import charNyan from '@assets/generated_images/fast_cyberpunk_rainbow_rabbit_character.png';
import charKaren from '@assets/generated_images/cyberpunk_yelling_commander.png';
import charFine from '@assets/generated_images/cyberpunk_burning_pilot.png';
import charBf from '@assets/generated_images/cyberpunk_distracted_pilot.png';
import charStonks from '@assets/generated_images/cyberpunk_stonks_man.png';
import charFloyd from '@assets/generated_images/cyberpunk_boxer_money.png';
import charRat from '@assets/generated_images/cyberpunk_rat_sniper_rooftop.png';
import charBaldwin from '@assets/generated_images/cyberpunk_anointed_royal_masked_figure.png';
import charSigma from '@assets/generated_images/cyberpunk_sigma_executive.png';
import charGigachad from '@assets/generated_images/cyberpunk_gigachad.png';
import charThinker from '@assets/generated_images/roll_safe_medium_shot.png';
import charDisaster from '@assets/generated_images/cyberpunk_disaster_girl.png';
import charButtons from '@assets/generated_images/cyberpunk_two_buttons.png';
import charPepeSilvia from '@assets/generated_images/cyberpunk_pepe_silvia.png';
import charHarold from '@assets/generated_images/cyberpunk_hide_pain_harold.png';

import charDangerZone from '@assets/generated_images/edgy_cyberpunk_femme_fatale.png';
import charMonkeyHaircut from '@assets/generated_images/cool_monkey_haircut_chef_background.png';
import charIdolCore from '@assets/generated_images/glamorous_kpop_idol_star.png';
import charPromKing from '@assets/generated_images/cool_cyberpunk_prom_king.png';
import charRockShush from '@assets/generated_images/cute_rock_with_shush_gesture.png';
import charRollSafe from '@assets/generated_images/roll_safe_black_character.png';

// Social Mode Images
import socialHarambe from '../assets/generated_images/social_harambe.png';
import socialPopcat from '../assets/generated_images/social_popcat.png';
import socialWinter from '../assets/generated_images/social_winter.png';
import socialPepe from '../assets/generated_images/social_pepe.png';
import socialNyan from '../assets/generated_images/social_nyan.png';
import socialKaren from '../assets/generated_images/social_karen.png';
import socialFine from '../assets/generated_images/social_fine.png';
import socialBf from '../assets/generated_images/social_bf.png';
import socialRat from '../assets/generated_images/social_rat.png';
import socialBaldwin from '../assets/generated_images/social_baldwin.png';
import socialSigma from '../assets/generated_images/social_sigma.png';
import socialGigachad from '../assets/generated_images/social_gigachad.png';
import socialThinker from '../assets/generated_images/social_thinker.png';
import socialDisaster from '../assets/generated_images/social_disaster.png';
import socialButtons from '../assets/generated_images/social_buttons.png';
import socialPrimate from '../assets/generated_images/social_primate.png';
import socialHarold from '../assets/generated_images/social_harold.png';
import socialPromKing from '../assets/generated_images/social_prom_king.png';
import socialIdolCore from '../assets/generated_images/social_idol_core.png';
import socialTank from '../assets/generated_images/social_tank.png';
import socialDangerZone from '../assets/generated_images/social_danger_zone.png';

// Bio Mode Images
import bioHarambe from '../assets/generated_images/bio_guardian_h_gorilla_pushups_v4.png';
import bioPopcat from '../assets/generated_images/bio_popcat.png';
import bioWinter from '../assets/generated_images/bio_frostbyte_v4.png';
import bioPepe from '../assets/generated_images/bio_pepe.png';
import bioNyan from '../assets/generated_images/bio_nyan.png';
import bioKaren from '../assets/generated_images/bio_karen.png';
import bioFine from '../assets/generated_images/bio_low_flame_no_text_v3.png';
import bioBf from '../assets/generated_images/bio_bf.png';
import bioRat from '../assets/generated_images/bio_rind_mouse_sniper_v4.png';
import bioBaldwin from '../assets/generated_images/bio_baldwin.png';
import bioSigma from '../assets/generated_images/bio_executive_p_axe_v5.png';
import bioGigachad from '../assets/generated_images/bio_gigachad.png';
import bioThinker from '../assets/generated_images/bio_thinker.png';
import bioDisaster from '../assets/generated_images/bio_hotwired_bar_on_fire_v6.png';
import bioButtons from '../assets/generated_images/bio_buttons.png';
import bioPrimate from '../assets/generated_images/bio_primate.png';
import bioHarold from '../assets/generated_images/bio_harold.png';
import bioPromKing from '../assets/generated_images/bio_prom_king.png';
import bioIdolCore from '../assets/generated_images/bio_idol_core.png';
import bioTank from '../assets/generated_images/bio_tank.png';
import bioDangerZone from '../assets/generated_images/bio_danger_zone.png';


import { AbilityAnimation, AnimationType } from "@/components/game/AbilityAnimation";
import logoFuturistic from '@assets/generated_images/redline_auction_futuristic_logo_red_neon.png';

// Game Constants
const STANDARD_TOTAL_ROUNDS = 9; 
const STANDARD_INITIAL_TIME = 300.0;
const LONG_TOTAL_ROUNDS = 18;
const LONG_INITIAL_TIME = 600.0;
const SHORT_TOTAL_ROUNDS = 9; // Changed from 5 to 9 as requested
const SHORT_INITIAL_TIME = 150.0;

const COUNTDOWN_SECONDS = 3; 
const READY_HOLD_DURATION = 3.0; 

type GamePhase = 'intro' | 'multiplayer_lobby' | 'character_select' | 'mp_driver_select' | 'ready' | 'countdown' | 'bidding' | 'round_end' | 'game_end';
type BotPersonality = 'balanced' | 'aggressive' | 'conservative' | 'random';
type GameDuration = 'standard' | 'long' | 'short';
// NEW PROTOCOL TYPES
    type SocialProtocol = 'TRUTH_DARE' | 'SWITCH_SEATS' | 'HUM_TUNE' | 'LOCK_ON' | 'NOISE_CANCEL';
type BioProtocol = 'HYDRATE' | 'BOTTOMS_UP' | 'PARTNER_DRINK' | 'WATER_ROUND';

// Extended Protocol Type
type ProtocolType = 
  | 'DATA_BLACKOUT' | 'DOUBLE_STAKES' | 'SYSTEM_FAILURE' 
  | 'OPEN_HAND' | 'MUTE_PROTOCOL' 
  | 'PRIVATE_CHANNEL' | 'NO_LOOK' | 'LOCK_ON' 
  | 'THE_MOLE' | 'PANIC_ROOM' 
  | 'UNDERDOG_VICTORY' | 'TIME_TAX'
  | SocialProtocol
  | BioProtocol
  | null;

// ... (Existing Characters)

// NEW CHARACTERS (SOCIAL MODE)
const SOCIAL_CHARACTERS: Character[] = [
  { 
    id: 'prom_king', name: 'Prom King', title: 'The Crowned', image: charPromKing, imageSocial: charPromKing, imageBio: bioPromKing, description: 'Royalty of the moment.', color: 'text-purple-500',
    ability: { name: 'SPOTLIGHT', description: 'If you win, everyone else cheers (no effect, just vibes).', effect: 'TOKEN_BOOST' },
    socialAbility: { name: 'PROM COURT', description: '1 random round: Make a rule for remainder of game.' },
    bioAbility: { name: 'CORONATION', description: 'Initiate a group toast. Everyone drinks.' }
  },
  {
    id: 'idol_core', name: 'Idol Core', title: 'The Star', image: charIdolCore, imageSocial: charIdolCore, imageBio: bioIdolCore, description: 'Stage presence and perfect timing.', color: 'text-pink-500',
    ability: { name: 'COUNT IT IN', description: 'When you say "count it in", next person to talk must say "5678" or drop their button.', effect: 'PEEK' },
    socialAbility: { name: 'FANCAM', description: '10% chance: 1 random player shows hidden talent at start of round or drops button.' },
    bioAbility: { name: 'DEBUT', description: 'Take a drink to reveal a "secret" (see an opponent\'s bid).' }
  }
];

// NEW CHARACTERS (BIO-FUEL MODE)
const BIO_CHARACTERS: Character[] = [
  { 
    id: 'tank', name: 'The Tank', title: 'Iron Liver', image: charRockShush, imageSocial: socialTank, imageBio: charRockShush, description: 'Solid as a rock. Literally.', color: 'text-green-600',
    ability: { name: 'IRON STOMACH', description: 'Immune to "Drink" penalties (Lore only).', effect: 'TIME_REFUND' },
    socialAbility: { name: 'PEOPLE\'S ELBOW', description: 'Challenge someone to a thumb war for 0.5s.' },
    bioAbility: { name: 'ABSORB', description: 'Take a big sip to cancel out any drinking prompt.' }
  },
  {
    id: 'danger_zone', name: 'Danger Zone', title: 'Club Queen', image: charDangerZone, imageSocial: socialDangerZone, imageBio: charDangerZone, description: 'Works the pole, takes your soul.', color: 'text-pink-600',
    ability: { name: 'OVERPOUR', description: 'Decide before the game starts how big 1 sip really is.', effect: 'DISRUPT' },
    socialAbility: { name: 'PRIVATE DANCE', description: 'Give a command. First to obey gets +0.5s.' },
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
  impactLogs?: { value: string; reason: string; type: 'loss' | 'gain' | 'neutral' }[]; // NEW: Structured logs
  // Multiplayer driver info
  selectedDriver?: string; // Driver ID for multiplayer
  driverName?: string; // Driver/character name
  driverAbility?: string; // Driver ability description
  roundEndAcknowledged?: boolean; // For next round acknowledgment
  // Stats
  totalTimeBid: number;
  totalImpactGiven: number;
  totalImpactReceived: number; // NEW: Track damage taken from enemy abilities
  specialEvents: string[];
  eventDatabasePopups: string[]; // NEW: Track Event DB Popups
  protocolsTriggered: string[];
  protocolWins: string[]; // NEW: Track protocols won specifically
  totalDrinks: number;
  socialDares: number;
}

interface Character {
  id: string;
  name: string;
  title: string;
  image: string; // Changed from icon to image
  imageSocial?: string; // New: Social Mode Image
  imageBio?: string;    // New: Bio-Fuel Mode Image
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
    id: 'harambe', name: 'Guardian H', title: 'The Eternal Watcher', image: charHarambe, imageSocial: socialGuardianHOption1, imageBio: bioHarambe, description: 'Stoic protection against bad bids.', color: 'text-zinc-400',
    ability: { name: 'SPIRIT SHIELD', description: 'Limit Break: +11s if you win Round 1.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'VIBE GUARD', description: 'Shown at prepare-to-bid: Designate a player immune to social dares this round.' },
    bioAbility: { name: 'LIQUID AUTHORIZATION', description: 'At round end: Tell others they cannot release button until you finish a sip.' }
  },
  { 
    id: 'popcat', name: 'Click-Click', title: 'The Glitch', image: charPopcat, imageSocial: socialPopcat, imageBio: bioPopcat, description: 'Hyperactive timing precision.', color: 'text-pink-400',
    ability: { name: 'HYPER CLICK', description: 'Gain +1 token if you win within 1.1s of 2nd place.', effect: 'TOKEN_BOOST' },
    socialAbility: { name: 'MISCLICK', description: '25% chance: 1 player must hold bid without using hands (only they and you are notified).' },
    bioAbility: { name: 'MOUTH POP', description: '1 random round: Everyone sips when Click-Click opens and closes mouth IRL.' }
  },
  { 
    id: 'winter', name: 'Frostbyte', title: 'The Disciplined', image: charWinter, imageSocial: socialFrostybyteOption1, imageBio: bioWinter, description: 'Cold, calculated efficiency.', color: 'text-cyan-400',
    ability: { name: 'CYRO FREEZE', description: 'Refund 1.0s regardless of outcome.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'COLD SHOULDER', description: '25% chance: Ignore all social interactions (only you see this at prepare-to-bid).' },
    bioAbility: { name: 'BRAIN FREEZE', description: '1 random round: Force opponent to win or drink (only you and target notified).' }
  },
  { 
    id: 'pepe', name: 'Sadman Logic', title: 'The Analyst', image: charPepe, imageSocial: socialSadmanOption3, imageBio: bioPepe, description: 'Feels bad, plays smart.', color: 'text-green-500',
    ability: { name: 'SAD REVEAL', description: 'See 1 opponent holding per round. Your time bank is permanently scrambled.', effect: 'PEEK' },
    socialAbility: { name: 'SAD STORY', description: '5% chance after round: 1 random player shares a sad story (shown to that player only).' },
    bioAbility: { name: 'DRINKING PARTNER', description: 'Every round you are notified you can change your drinking buddy.' }
  },
  { 
    id: 'nyan', name: 'Rainbow Dash', title: 'The Speeder', image: charNyan, imageSocial: socialRainbowDashOption1, imageBio: bioNyan, description: 'Neon trails and fast reactions.', color: 'text-purple-400',
    ability: { name: 'RAINBOW RUN', description: 'Get 3.5s refund if you bid > 40s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'SUGAR RUSH', description: '15% chance: 1 random opponent must speak 2x speed (shown at start of round).' },
    bioAbility: { name: 'RAINBOW SHOT', description: '10% chance: 1 random player mixes two drinks (shown at end of round).' }
  },
  { 
    id: 'karen', name: 'The Accuser', title: 'The Aggressor', image: charKaren, imageSocial: socialAccuserOption1,
    imageBio: bioAccuserOption1,
    description: 'Loud and disruptive tactics.', color: 'text-red-400',
    ability: { name: 'MANAGER CALL', description: 'Remove 2s from random opponent every round.', effect: 'DISRUPT' },
    socialAbility: { name: 'COMPLAINT', description: '15% chance: Everyone votes on winner\'s punishment (shown to all at end of round).' },
    bioAbility: { name: 'SPILL HAZARD', description: '25% chance: Accuse someone of spilling; they drink (shown to driver post-round).' }
  },
  { 
    id: 'fine', name: 'Low Flame', title: 'The Survivor', image: charFine, imageSocial: socialFine, imageBio: bioFine, description: 'Perfectly chill in chaos.', color: 'text-orange-500',
    ability: { name: 'FIRE WALL', description: 'Immune to ALL protocols.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'HOT SEAT', description: '25% chance: Choose a player to answer a truth (shown to driver after round).' },
    bioAbility: { name: 'ON FIRE', description: 'When you win, everyone else drinks (shown to all after your winning round).' }
  },
  { 
    id: 'bf', name: 'Wandering Eye', title: 'The Opportunist', image: charBf, imageSocial: socialBf, imageBio: bioBf, description: 'Always looking for a better deal.', color: 'text-blue-400',
    ability: { name: 'SNEAK PEEK', description: 'See 1 random player holding. All other banks scrambled.', effect: 'PEEK' },
    socialAbility: { name: 'DISTRACTION', description: '35% chance at start: Point at something; anyone who looks must drop buzzer (shown to driver).' },
    bioAbility: { name: 'THE EX', description: '10% chance: 1 random player toasts to an ex (shown to them at end of round).' }
  },
  { 
    id: 'rat', name: 'The Rind', title: 'The Time Thief', image: charRat, imageSocial: socialRat, imageBio: bioRat, description: 'Sneaky tactics and stolen seconds.', color: 'text-gray-500',
    ability: { name: 'CHEESE TAX', description: 'Steal 2s from winner if you lose.', effect: 'DISRUPT' },
    socialAbility: { name: 'SNITCH', description: '5% chance: 1 random player must reveal someone\'s tell (shown to them after round).' },
    bioAbility: { name: 'SCAVENGE', description: '5% chance: 1 random player finishes someone else\'s drink (shown to them after round).' }
  },
  { 
    id: 'baldwin', name: 'The Anointed', title: 'The Royal', image: charBaldwin, imageSocial: socialBaldwin,
    imageBio: bioBaldwin,
    description: 'Silent authority and iron will.', color: 'text-blue-500',
    ability: { name: 'ROYAL DECREE', description: 'Get 4s refund if you bid within 0.1s of exactly 20s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'COMMAND SILENCE', description: '50% chance: Everyone is commanded silence at start of round.' },
    bioAbility: { name: 'ROYAL CUP', description: '1 random round at end: Make a rule for remainder of game.' }
  },
  { 
    id: 'sigma', name: 'Executive P', title: 'The Psycho', image: charSigma, imageSocial: socialExecutivePOption1, imageBio: bioSigma, description: 'Impeccable taste, dangerous mind.', color: 'text-red-500',
    ability: { name: 'AXE SWING', description: 'Remove 2s from non-eliminated opponent with most time.', effect: 'DISRUPT' },
    socialAbility: { name: 'CC\'D', description: '20% chance: 1 random player must copy your actions next round (both notified at end).' },
    bioAbility: { name: 'REASSIGNED', description: '50% chance: Choose 1 player to take a drink (shown to driver at end of round).' }
  },
  { 
    id: 'gigachad', name: 'Alpha Prime', title: 'The Perfect', image: charGigachad, imageSocial: socialGigachad, imageBio: bioGigachad, description: 'Peak performance in every bid.', color: 'text-zinc-300',
    ability: { name: 'JAWLINE', description: 'Can drop during countdown without penalty.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'MOG', description: '20% chance: 1 random player must drop if they lose stare challenge (both notified at start).' },
    bioAbility: { name: 'PACE SETTER', description: 'Every 3 rounds, start a game of waterfall (shown post-round).' }
  },
  { 
    id: 'thinker', name: 'Roll Safe', title: 'The Consultant', image: charThinker, imageSocial: socialThinker, imageBio: bioThinker, description: 'Modern solutions for modern bids.', color: 'text-indigo-400',
    ability: { name: 'CALCULATED', description: 'Cannot be impacted by Limit Break abilities.', effect: 'PEEK' },
    socialAbility: { name: 'TECHNICALLY', description: 'You are the decision maker for disputes and unclear rules all game.' },
    bioAbility: { name: 'BIG BRAIN', description: '15% chance at end of round: Option to have everyone pass drink to the left.' }
  },
  { 
    id: 'disaster', name: 'Hotwired', title: 'The Anarchist', image: charDisaster, imageSocial: socialDisaster, imageBio: bioDisaster, description: 'Watches the market burn with a smile.', color: 'text-orange-600',
    ability: { name: 'BURN IT', description: 'Remove 1s from everyone else.', effect: 'DISRUPT' },
    socialAbility: { name: 'VIRAL MOMENT', description: '1 random round: Re-enact a meme. Best performance wins.' },
    bioAbility: { name: 'SPICY', description: '20% chance post-round: Everyone drinks (all notified).' }
  },
  { 
    id: 'buttons', name: 'Panic Bot', title: 'The Indecisive', image: charButtons, imageSocial: socialPanicBotOption1,
    imageBio: bioPanicBotOption3,
    description: 'Always sweating the big decisions.', color: 'text-red-400',
    ability: { name: 'PANIC MASH', description: '50% chance +3s refund, 50% -3s penalty.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'SWEATING', description: 'Wipe brow. If anyone mimics, they drop button.' },
    bioAbility: { name: 'EMERGENCY MEETING', description: '25% chance: Everyone points at person to gang up on next round for drinking.' }
  },
  { 
    id: 'primate', name: 'Primate Prime', title: 'The Chef', image: charMonkeyHaircut, imageSocial: socialPrimate, imageBio: bioPrimate, description: 'Trust the process. He\'s cooking.', color: 'text-amber-600',
    ability: { name: 'CHEF\'S SPECIAL', description: 'Get 4s refund on wins > 10s over second place.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'FRESH CUT', description: '10% chance post-round: 1 random player must compliment everyone.' },
    bioAbility: { name: 'GREEDY GRAB', description: '5% chance post-round: Previous winner must burn 40s next round or finish drink.' }
  },
  { 
    id: 'harold', name: 'Pain Hider', title: 'The Stoic', image: charHarold, imageSocial: socialPainHiderOption1,
    imageBio: bioHarold,
    description: 'Smiling through the bear market.', color: 'text-slate-400',
    ability: { name: 'HIDE PAIN', description: 'Get 3s refund if you lose by > 15s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'BOOMER', description: 'You forgot what your power was (never triggers).' },
    bioAbility: { name: 'SUPPRESS', description: 'If anyone reacts to their drink, they drink again.' }
  },
];

// New Types for Refactored Game Modes
type GameDifficulty = 'COMPETITIVE' | 'CASUAL';
type GameVariant = 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';

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
  '/assets/lobby/ready-to-win-multiverse-fugitives-competitive-ost-269606.mp3'
];

export default function Game() {
  const { toast } = useToast();
  
  // Game State
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
    audioRef.current.volume = 0.4;
    
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
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [protocolsEnabled, setProtocolsEnabled] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<ProtocolType>(null);
  const [readyHoldTime, setReadyHoldTime] = useState(0);
  const [moleTarget, setMoleTarget] = useState<string | null>(null);
  const [peekTargetId, setPeekTargetId] = useState<string | null>(null); // New state for Sadman/Pepe peek
  const [scrambledPlayers, setScrambledPlayers] = useState<string[]>([]); // New state for Wandering Eye scramble
  const [frostbyteAbilityUsed, setFrostbyteAbilityUsed] = useState(false); // Track Frostbyte single use
  const [showProtocolGuide, setShowProtocolGuide] = useState(false);
  const [showProtocolSelect, setShowProtocolSelect] = useState(false);

  const [expandedDriverCategoryId, setExpandedDriverCategoryId] = useState<string | null>(null);
  const [allowedProtocols, setAllowedProtocols] = useState<ProtocolType[]>([
        'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
        'OPEN_HAND', 'MUTE_PROTOCOL', 
        'PRIVATE_CHANNEL', 'NO_LOOK', 
        'THE_MOLE', 'PANIC_ROOM',
        'UNDERDOG_VICTORY', 'TIME_TAX'
  ]);
  const [abilitiesEnabled, setAbilitiesEnabled] = useState(false);
  const [playerAbilityUsed, setPlayerAbilityUsed] = useState(false);
  const [showPopupLibrary, setShowPopupLibrary] = useState(false);
  const [activeAbilities, setActiveAbilities] = useState<{ player: string, playerId: string, ability: string, effect: string, targetName?: string, targetId?: string, impactValue?: string }[]>([]);
  
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<Player | null>(null);

  // New Overlays State (Array for stacking)
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
      
      // Play SFX (one per "burst" even if multiple overlays stack)
      // Do NOT interrupt an in-flight sound; just block new ones briefly.
      if (soundEnabled) {
          const now = Date.now();
          if (now >= sfxBlockUntilRef.current) {
              const pick = SFX_POOL[Math.floor(Math.random() * SFX_POOL.length)];

              const sound = new Audio(pick + `?t=${now}`);
              sound.volume = 0.6;
              sfxInFlightRef.current = sound;
              sound.play().catch(() => {});

              // Block further overlay SFX for a short window so stacked popups only play once
              sfxLastPlayedAtRef.current = now;
              sfxBlockUntilRef.current = now + 650;
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
          const dismissedWasElim = prev.find(o => o.id === id)?.type === 'eliminated' || prev.find(o => o.id === id)?.type === 'time_out';
          const stillHasElimOverlay = next.some(o => o.type === 'eliminated' || o.type === 'time_out');

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
        // Add social protocols if not already present (default ON)
        setAllowedProtocols(prev => {
            const socialProtocols: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'];
            const bioProtocols: ProtocolType[] = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
            // Remove bio protocols, add social protocols
            const withoutBio = prev.filter(p => !bioProtocols.includes(p));
            const toAdd = socialProtocols.filter(p => !withoutBio.includes(p));
            return [...withoutBio, ...toAdd];
        });
    } else if (variant === 'BIO_FUEL') {
        setProtocolsEnabled(true);
        // Add bio protocols if not already present (default ON)
        setAllowedProtocols(prev => {
            const socialProtocols: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON', 'NOISE_CANCEL'];
            const bioProtocols: ProtocolType[] = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
            // Remove social protocols, add bio protocols
            const withoutSocial = prev.filter(p => !socialProtocols.includes(p));
            const toAdd = bioProtocols.filter(p => !withoutSocial.includes(p));
            return [...withoutSocial, ...toAdd];
        });
    } else {
        // Standard mode - remove mode-specific protocols
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
      return 'STANDARD';
    });
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'STANDARD': return <Shield size={12} />;
      case 'SOCIAL_OVERDRIVE': return <PartyPopper size={12} />;
      case 'BIO_FUEL': return <Martini size={12} />;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'STANDARD': return "text-zinc-400";
      case 'SOCIAL_OVERDRIVE': return "text-purple-400";
      case 'BIO_FUEL': return "text-orange-400";
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
  
  // Players State
  const [players, setPlayers] = useState<Player[]>([
    { 
        id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false,
        totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0 
    },
    { 
        id: 'b1', name: 'Alpha (Aggr)', isBot: true, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'aggressive',
        totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
    },
    { 
        id: 'b2', name: 'Beta (Cons)', isBot: true, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'conservative',
        totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
    },
    { 
        id: 'b3', name: 'Gamma (Rand)', isBot: true, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'random',
        totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
    },
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
      abilitiesEnabled: boolean;
      variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';
      gameDuration: 'sprint' | 'standard' | 'long' | 'short';
    };
    maxPlayers: number;
  } | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerGameState, setMultiplayerGameState] = useState<{
    round: number;
    totalRounds: number;
    phase: 'driver_selection' | 'waiting_for_ready' | 'countdown' | 'bidding' | 'round_end' | 'game_over';
    countdownRemaining: number;
    elapsedTime: number;
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
      currentBid: number | null;
      isHolding: boolean;
      totalTimeBid: number;
      abilityUsed: boolean;
      roundImpact?: { type: string; value: number; source: string };
    }>;
    roundWinner: { id: string; name: string; bid: number } | null;
    eliminatedThisRound: string[];
    settings: {
      difficulty: 'CASUAL' | 'COMPETITIVE';
      protocolsEnabled: boolean;
      abilitiesEnabled: boolean;
      variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';
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
    }>;
    isDoubleTokensRound: boolean;
    molePlayerId: string | null;
    allHumansHoldingStartTime: number | null;
    gameDuration: 'short' | 'standard' | 'long';
    minBid: number;
  } | null>(null);
  
  // Socket connection
  const { socket, isConnected } = useSocket();

  // Helper for formatting time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

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
      // Don't set phase here - let the server game_state dictate the phase
      // The server starts in 'waiting_for_ready' phase
    };

    const handleGameState = (state: typeof multiplayerGameState) => {
      console.log('[Game] State update:', state?.phase, 'Round:', state?.round);
      setMultiplayerGameState(state);
      
      // Sync phase with server state for multiplayer
      if (state) {
        // Sync settings from server
        if (state.settings) {
          setVariant(state.settings.variant);
          setDifficulty(state.settings.difficulty);
          setProtocolsEnabled(state.settings.protocolsEnabled);
          setAbilitiesEnabled(state.settings.abilitiesEnabled);
        }
        
        // Sync active protocol from server
        if (state.activeProtocol) {
          setActiveProtocol(state.activeProtocol as ProtocolType);
        } else {
          setActiveProtocol(null);
        }
        
        // totalRounds is handled by multiplayer state directly
        
        if (state.phase === 'driver_selection') {
          setPhase('mp_driver_select');
        } else if (state.phase === 'waiting_for_ready') {
          setPhase('ready');
        } else if (state.phase === 'countdown') {
          setPhase('countdown');
          setCountdown(state.countdownRemaining);
        } else if (state.phase === 'bidding') {
          setPhase('bidding');
        } else if (state.phase === 'round_end') {
          setPhase('round_end');
          if (state.roundWinner) {
            setRoundWinner({ name: state.roundWinner.name, time: state.roundWinner.bid });
          }
        } else if (state.phase === 'game_over') {
          setPhase('game_end');
        }
        setRound(state.round);
      }
    };

    socket.on('lobby_update', handleLobbyUpdate);
    socket.on('game_started', handleGameStarted);
    socket.on('game_state', handleGameState);

    return () => {
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('game_started', handleGameStarted);
      socket.off('game_state', handleGameState);
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
        audioRef.current.volume = 0.4;
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
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(() => console.log('Audio play blocked'));
      }
      return;
    }

    audioRef.current.pause();
  }, [phase, soundEnabled, isMultiplayer, multiplayerGameState?.phase]);

  // Multiplayer Protocol Overlay - trigger when a new protocol is activated
  const lastProtocolRoundRef = useRef<number>(0);
  useEffect(() => {
    if (!isMultiplayer || !multiplayerGameState) return;
    
    // Only trigger when entering waiting_for_ready phase with a protocol
    if (multiplayerGameState.phase !== 'waiting_for_ready') return;
    if (!multiplayerGameState.activeProtocol) return;
    
    // Prevent duplicate triggers for same round
    if (lastProtocolRoundRef.current === multiplayerGameState.round) return;
    lastProtocolRoundRef.current = multiplayerGameState.round;
    
    // Trigger protocol overlay with simple mapping
    const protocol = multiplayerGameState.activeProtocol;
    const protocolNames: Record<string, { name: string; desc: string }> = {
      'DATA_BLACKOUT': { name: 'DATA BLACKOUT', desc: 'Timers Hidden' },
      'DOUBLE_STAKES': { name: 'DOUBLE STAKES', desc: 'Winner Gets 2 Tokens' },
      'SYSTEM_FAILURE': { name: 'SYSTEM FAILURE', desc: 'Timers Scrambled' },
      'OPEN_HAND': { name: 'OPEN HAND', desc: 'All Bids Visible' },
      'MUTE_PROTOCOL': { name: 'MUTE PROTOCOL', desc: 'No Talking Allowed' },
      'PRIVATE_CHANNEL': { name: 'PRIVATE CHANNEL', desc: 'Whisper to One Player' },
      'NO_LOOK': { name: 'NO LOOK', desc: 'Close Your Eyes' },
      'LOCK_ON': { name: 'LOCK ON', desc: 'Stare at Target Player' },
      'THE_MOLE': { name: 'THE MOLE', desc: 'Secret Saboteur' },
      'PANIC_ROOM': { name: 'PANIC ROOM', desc: '2x Timer Speed' },
      'UNDERDOG_VICTORY': { name: 'UNDERDOG VICTORY', desc: 'Revealed at Round End' },
      'TIME_TAX': { name: 'TIME TAX', desc: 'Revealed at Round End' },
      'TRUTH_DARE': { name: 'TRUTH OR DARE', desc: 'Winner Asks, Loser Does' },
      'SWITCH_SEATS': { name: 'SEAT SWAP', desc: 'Everyone Move Left' },
      'HUM_TUNE': { name: 'HUM A TUNE', desc: 'Loser Hums a Song' },
      'NOISE_CANCEL': { name: 'NOISE CANCEL', desc: 'Play in Silence' },
      'HYDRATE': { name: 'HYDRATE', desc: 'Loser Drinks Water' },
      'BOTTOMS_UP': { name: 'BOTTOMS UP', desc: 'Loser Finishes Drink' },
      'PARTNER_DRINK': { name: 'PARTNER DRINK', desc: 'Choose a Drink Buddy' },
      'WATER_ROUND': { name: 'WATER ROUND', desc: 'No Alcohol This Round' },
    };
    const protocolInfo = protocolNames[protocol];
    if (protocolInfo) {
      addOverlay("protocol_alert", protocolInfo.name, protocolInfo.desc);
    }
  }, [isMultiplayer, multiplayerGameState, addOverlay]);

  // Multiplayer Moment Flags - trigger when round ends
  const lastRoundEndProcessedRef = useRef<number>(0);
  useEffect(() => {
    if (!isMultiplayer || !multiplayerGameState || !socket) return;
    
    // Only trigger on round_end phase
    if (multiplayerGameState.phase !== 'round_end') return;
    
    // Prevent duplicate triggers for same round - only update ref after processing
    if (lastRoundEndProcessedRef.current === multiplayerGameState.round) return;
    
    const winner = multiplayerGameState.roundWinner;
    if (!winner) return;
    
    // Find current player and check if they won
    const currentPlayerId = multiplayerGameState.players.find(p => p.socketId === socket.id)?.id;
    const isCurrentPlayerWinner = winner.id === currentPlayerId;
    
    if (!isCurrentPlayerWinner) return;
    
    // Trigger moment flags for current player
    let momentCount = 0;
    const winnerBid = winner.bid;
    
    // Get player data
    const players = multiplayerGameState.players;
    const winnerPlayer = players.find(p => p.id === winner.id);
    
    // Find second place bid
    const sortedByBid = [...players]
      .filter(p => !p.isEliminated && p.currentBid !== null)
      .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    const secondBid = sortedByBid.length > 1 ? sortedByBid[1].currentBid || 0 : 0;
    const margin = winnerBid - secondBid;
    
    // 1. Smug Confidence (Round 1 Win)
    if (multiplayerGameState.round === 1) {
      addOverlay("smug_confidence", "SMUG CONFIDENCE", `${winner.name} starts strong!`);
      momentCount++;
    }
    
    // 2. Fake Calm (Margin >= 15s)
    if (sortedByBid.length > 1 && margin >= 15) {
      setTimeout(() => addOverlay("fake_calm", "FAKE CALM", `Won by ${margin.toFixed(1)}s!`), 500);
      momentCount++;
    }
    
    // 3. Genius Move (Margin <= 5s)
    if (sortedByBid.length > 1 && margin <= 5 && margin > 0) {
      setTimeout(() => addOverlay("genius_move", "GENIUS MOVE", `Won by just ${margin.toFixed(1)}s`), 500);
      momentCount++;
    }
    
    // 4. Easy W (Bid < 20s)
    if (winnerBid < 20) {
      setTimeout(() => addOverlay("easy_w", "EASY W", `Won with only ${winnerBid.toFixed(1)}s`), 1000);
      momentCount++;
    }
    
    // 5. Overkill (Bid > 60s)
    if (winnerBid > 60) {
      setTimeout(() => addOverlay("overkill", "OVERKILL", "Massive bid!"), 1500);
      momentCount++;
    }
    
    // 6. Clutch Play (Low remaining time)
    if (winnerPlayer && winnerPlayer.remainingTime < 10) {
      setTimeout(() => addOverlay("clutch_play", "CLUTCH PLAY", "Almost out of time!"), 1500);
      momentCount++;
    }
    
    // 7. Precision Strike (Exact second bid)
    if (winnerBid % 1 === 0) {
      setTimeout(() => addOverlay("precision_strike", "PRECISION STRIKE", "Exact second bid!"), 1500);
      momentCount++;
    }
    
    // Patch Notes Pending: 3+ moment flags in same round
    if (momentCount >= 3) {
      setTimeout(() => addOverlay("hidden_patch_notes", "PATCH NOTES PENDING", "Triggered 3+ moment flags in one round."), 2500);
    }
    
    // Mark this round as processed to prevent duplicate triggers
    lastRoundEndProcessedRef.current = multiplayerGameState.round;
  }, [isMultiplayer, multiplayerGameState, socket, addOverlay]);

  // --- Game Loop Logic ---

  // Ready Phase Logic (3s Hold)
  useEffect(() => {
    if (phase === 'ready') {
      const allReady = players.every(p => p.isHolding);
      
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

  // Simulate Bots Getting Ready
  useEffect(() => {
    if (phase === 'ready') {
      // Bots "Ready Up" after random delays
      const timeoutIds: NodeJS.Timeout[] = [];
      
      players.forEach(p => {
        if (p.isBot && !p.isHolding) {
          const delay = Math.random() * 2000 + 500; // 0.5s to 2.5s
          const id = setTimeout(() => {
             setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, isHolding: true } : pl));
          }, delay);
          timeoutIds.push(id);
        }
      });

      return () => timeoutIds.forEach(clearTimeout);
    }
  }, [phase]);

  // Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'countdown') {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Start Auction
            // Trigger Overlay removed as requested
            // setOverlay({ type: "round_start", message: "AUCTION START" });
            setPhase('bidding');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Main Bidding Timer (Precision)
  useEffect(() => {
    if (phase === 'bidding') {
      const animate = (time: number) => {
        if (startTimeRef.current === null) startTimeRef.current = time;
        
        // Calculate deltaTime based on speed (Panic Room = 2x)
        // Panic Room doubles timer drain speed only (everyone).
        const rawDelta = (time - startTimeRef.current) / 1000;
        const multiplier = activeProtocol === 'PANIC_ROOM' ? 2 : 1;
        
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
                // Force Eliminate
                 setPlayers(prev => prev.map(p => {
                     if (p.id === 'p1') {
                         if (!overLimitToastShownRef.current) {
                              overLimitToastShownRef.current = true;
                         }
                         return { 
                             ...p, 
                             isHolding: false, 
                             currentBid: 0, 
                             // NO trophy loss on elimination (over-limit holding)
                             remainingTime: 0, 
                             isEliminated: true 
                         };
                     }
                     return p;
                 }));
            }
        }
        
        if (overLimitToastShownRef.current) {
             toast({
                title: "OVER-LIMIT ELIMINATION",
                description: "You held longer than your remaining time! Eliminated.",
                className: "bg-cyan-950 border-cyan-500 text-cyan-100",
                duration: 4000
            });
            overLimitToastShownRef.current = false; 
        }

        // Check if everyone released
        const activePlayers = players.filter(p => !p.isEliminated); 
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
  }, [phase, players]); 

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
            // Bots also get abilities if enabled, but we just store the icon/name for now
          };
        }
        return p;
      }));
  };

  useEffect(() => {
    if (phase === 'ready') {
      const newBotBids: Record<string, number> = {};

      const minBidTime = getTimerStart();
      const isLastRound = round >= totalRounds;
      const isPanicRoom = activeProtocol === 'PANIC_ROOM';
      const isNoLook = activeProtocol === 'NO_LOOK';
      const isMute = activeProtocol === 'MUTE_PROTOCOL';
      const isMole = activeProtocol === 'THE_MOLE';

      players.forEach(p => {
        if (p.isBot) {
          const maxBid = Math.max(minBidTime, p.remainingTime);
          let bid = minBidTime;

          const lowTime = p.remainingTime <= 8;
          const midTime = p.remainingTime > 8 && p.remainingTime <= 20;

          // Protocol-aware tuning:
          // - Panic Room: avoid huge holds (timer burns 2x)
          // - No Look / Mute: slightly more conservative (table friction)
          // - Late rounds: reduce risk
          // - Low remaining time: reduce risk
          const riskDown = (isPanicRoom ? 0.35 : 0) + (isNoLook ? 0.1 : 0) + (isMute ? 0.1 : 0) + (isLastRound ? 0.2 : 0) + (lowTime ? 0.35 : midTime ? 0.15 : 0);

          const clamp = (v: number) => Math.min(maxBid, Math.max(minBidTime, v));

          switch (p.personality) {
            case 'aggressive': {
              // Aggressive bots usually push higher, but back off under riskDown.
              const base = 18 + Math.random() * 28;
              const cautious = 6 + Math.random() * 10;
              const chooseHigh = Math.random() > (0.25 + riskDown);
              bid = chooseHigh ? base : cautious;
              break;
            }

            case 'conservative': {
              // Conservative bots stay low, especially late / low-time / panic room.
              const base = 1.5 + Math.random() * 10;
              bid = base;
              if (isLastRound || isPanicRoom || lowTime) bid = 1.0 + Math.random() * 6;
              break;
            }

            case 'random':
            default: {
              // Random bots still get bounded by riskDown.
              const base = 1 + Math.random() * 40;
              bid = base * (1 - Math.min(0.55, riskDown));
              break;
            }
          }

          // Mole protocol: bots should be a bit more "second-place" oriented.
          // Without revealing who is mole, we make bots generally avoid massive winning margins.
          if (isMole) {
            bid = bid * 0.85;
          }

          // Add small fuzz so they don't land on identical tenths too often.
          bid += Math.random() * 0.8;

          bid = clamp(bid);
          newBotBids[p.id] = parseFloat(bid.toFixed(1));
        }
      });

      setBotBids(newBotBids);
    }
  }, [phase, round, totalRounds, activeProtocol, gameDuration, variant]);

  // Check bot bids during bidding phase
  // Also check for PEEK abilities (Sadman Logic / Pepe)
  useEffect(() => {
    if (phase === 'bidding') {
      // Release bots
      const botsToRelease = players.filter(p => 
        p.isBot && 
        p.isHolding && 
        botBids[p.id] <= currentTime
      );

      if (botsToRelease.length > 0) {
        setPlayers(prev => prev.map(p => {
          if (botsToRelease.find(b => b.id === p.id)) {
            return { ...p, isHolding: false, currentBid: botBids[p.id] };
          }
          return p;
        }));
      }
      
      // PEEK Logic: If I am 'pepe' (Sadman Logic), I can see if others are holding
      // Or 'bf' (Sneak Peek)
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

  // Round Start Logic extension for PEEK
  const [peekActive, setPeekActive] = useState(false);
  
  useEffect(() => {
      if (phase === 'countdown') {
          // 30% chance to activate PEEK ability if player has one
          if (selectedCharacter?.ability?.effect === 'PEEK') {
              const chance = Math.random();
              setPeekActive(chance > 0.7); // 30% chance
              if (chance > 0.7) {
                  toast({
                      title: "INSIGHT ACTIVATED",
                      description: `${selectedCharacter.ability.name}: You can see opponent status this round!`,
                      className: "bg-green-950 border-green-500 text-green-100",
                      duration: 4000
                  });
              }
          } else {
              setPeekActive(false);
          }
      }
  }, [phase, round]);

  // Low Flame Immunity Popup Check
  useEffect(() => {
    if (activeProtocol && activeProtocol !== 'THE_MOLE' && selectedCharacter?.id === 'fine') {
        // Only show if not already showing a protocol alert
        // Actually, just show it as a unique "immune" badge or overlay
        addOverlay("ability_trigger", "FIRE WALL ACTIVE", "Immune to active protocol effects!", 3000);
    }
  }, [activeProtocol, selectedCharacter?.id]);


  // User Interactions - Button Down
  const handlePress = () => {
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
      }
      return;
    }
    
    // Single-player logic
    if (phase === 'ready') {
       setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: true } : p));
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
                // Eliminate but NO trophy loss
                const newTime = 0; // Depleted to zero
                
                // Add log
                setRoundLog(prev => [`>> OVER-LIMIT: ${p.name} bet more than available! Time Depleted & Eliminated.`, ...prev]);

                toast({
                    title: "OVER-LIMIT",
                    description: `You bid ${bidTime}s but only had ${p.remainingTime.toFixed(1)}s! Time Depleted.`,
                    variant: "destructive",
                    duration: 4000
                });
                return { 
                    ...p, 
                    isHolding: false, 
                    currentBid: bidTime, 
                    // NO tokens change - removed trophy penalty
                    remainingTime: newTime,
                    isEliminated: true // Stop playing
                };
            }
            
            return { ...p, isHolding: false, currentBid: bidTime, totalTimeBid: p.totalTimeBid + bidTime };
        }
        return p;
      }));

    } else if (phase === 'countdown') {
       // If stopping during countdown, store penalty to apply at round end
       // Only apply if the player actually held during countdown (i.e., they were "in" the countdown).
       const p1 = players.find(p => p.id === 'p1');
       if (!p1?.isHolding) {
         return;
       }

       let penalty = getPenalty();
       
       // ALPHA PRIME (Gigachad) EXCEPTION: "JAWLINE"
       // "Can drop during countdown without penalty"
       if (selectedCharacter?.ability?.name === 'JAWLINE') {
           penalty = 0;
           toast({
               title: "JAWLINE ACTIVATED",
               description: "No penalty for early drop!",
               className: "bg-zinc-800 border-zinc-500 text-zinc-100",
               duration: 2000
           });
       } else {
           // Normal Penalty Toast
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
            // NO remainingTime change here - will apply at round end
       } : p));
    }
  };

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
    // Check for Protocol Trigger (pace-dependent)
    // SPEED (short): 50% | STANDARD (medium): 40% | MARATHON (long): 30%
    const protocolTriggerChance = gameDuration === 'short' ? 0.5 : gameDuration === 'long' ? 0.3 : 0.4;
    if (protocolsEnabled && Math.random() < protocolTriggerChance) {
      
      // Build Protocol Pool
      // Standard protocols and Reality Mode protocols are configured separately.
      // Goal: any enabled options should trigger uniformly.
      const STANDARD_SET = ['DATA_BLACKOUT','DOUBLE_STAKES','SYSTEM_FAILURE','OPEN_HAND','MUTE_PROTOCOL','PRIVATE_CHANNEL','NO_LOOK','THE_MOLE','PANIC_ROOM','UNDERDOG_VICTORY','TIME_TAX'];
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
      if (combinedPool.length === 0) return;

      const newProtocol = pick(combinedPool);
      setActiveProtocol(newProtocol);
      
      let msg = "PROTOCOL INITIATED";
      let sub = "Unknown Effect";
      let showPopup = true;
      
      // Helper to get random player name(s)
      const getRandomPlayer = () => players[Math.floor(Math.random() * players.length)].name;
      const getTwoRandomPlayers = () => {
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        return [shuffled[0].name, shuffled[1].name];
      };
      
      switch(newProtocol) {

        // ... STANDARD PROTOCOLS ...
        case 'DATA_BLACKOUT': msg = "DATA BLACKOUT"; sub = "Timers Hidden"; break;
        case 'DOUBLE_STAKES': msg = "HIGH STAKES"; sub = "Double Tokens for Winner"; break;
        case 'SYSTEM_FAILURE': msg = "SYSTEM FAILURE"; sub = "HUD Glitches & Timer Scramble"; break;
        case 'OPEN_HAND': msg = "OPEN HAND"; sub = `${getRandomPlayer()} must state they won't bid!`; break;
        case 'MUTE_PROTOCOL': msg = "MUTE PROTOCOL"; sub = "All players must remain silent!"; break;
        case 'PRIVATE_CHANNEL': 
            const [p1, p2] = getTwoRandomPlayers();
            msg = "PRIVATE CHANNEL"; sub = `${p1} & ${p2} discuss strategy now!`; 
            break;
        case 'NO_LOOK': msg = "BLIND BIDDING"; sub = "Do not look at screens until drop!"; break;
        case 'THE_MOLE':
          const target = Math.random() > 0.5 ? 'YOU' : getRandomPlayer();
          const targetId = target === 'YOU' ? 'p1' : players.find(p => p.name === target)?.id || null;
          setMoleTarget(targetId);
          msg = target === 'YOU' ? "THE MOLE" : "SECRET PROTOCOL ACTIVE";
          sub = target === 'YOU'
            ? "You are the Mole. Goal: push the time up, but try NOT to get 1st. If you DO win, you only lose a trophy if you win by MORE than 7.0s."
            : "";
          break;
        case 'PANIC_ROOM': msg = "PANIC ROOM"; sub = "Time 2x Speed | Double Win Tokens"; break;
        case 'UNDERDOG_VICTORY': showPopup = false; break; // Secret
        case 'TIME_TAX': showPopup = false; break; // Secret
        
        // ... SOCIAL PROTOCOLS ...
        // Some show up at end of round - HIDDEN START OF ROUND per user request
        case 'TRUTH_DARE': showPopup = false; break;
        case 'SWITCH_SEATS': showPopup = false; break;
        case 'HUM_TUNE': msg = "AUDIO SYNC"; sub = `${getRandomPlayer()} must hum a song (others guess)!`; break;
        case 'LOCK_ON': {
            const [lockA, lockB] = getTwoRandomPlayers();
            msg = "LOCK ON";
            sub = `${lockA} & ${lockB} must maintain eye contact!`;
            break;
        }
        
        // ... BIO PROTOCOLS ...
        case 'HYDRATE': msg = "HYDRATION CHECK"; sub = "Everyone take a sip!"; break;
        case 'BOTTOMS_UP': msg = "BOTTOMS UP"; sub = "Loser of this round finishes drink!"; break;
        case 'PARTNER_DRINK': 
            const [b1, b2] = getTwoRandomPlayers();
            msg = "LINKED SYSTEMS"; sub = `${b1} & ${b2} are drinking buddies this round!`; 
            break;
        case 'WATER_ROUND': msg = "COOLANT FLUSH"; sub = "Water only this round!"; break;
      }
      
      // Filter out popups that shouldn't be seen by the player
      const targetProtocols = ['THE_MOLE', 'PRIVATE_CHANNEL', 'OPEN_HAND', 'LOCK_ON', 'PARTNER_DRINK', 'HUM_TUNE', 'UNDERDOG_VICTORY', 'TIME_TAX'];

      // LOW FLAME IMMUNITY CHECK (Fire Wall)
      const isLowFlame = selectedCharacter?.id === 'fine';
      const isImmune = isLowFlame && abilitiesEnabled && newProtocol !== 'THE_MOLE' && newProtocol !== 'UNDERDOG_VICTORY' && newProtocol !== 'TIME_TAX'; // Passive immunity (except secrets/role)

      if (newProtocol && targetProtocols.includes(newProtocol)) {
         showPopup = false;
         if (newProtocol === 'THE_MOLE') {
             if (moleTarget === 'p1') showPopup = true;
         } else if (sub.includes('YOU') || sub.includes(players.find(p => p.id === 'p1')?.name || 'YOU')) {
             showPopup = true;
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
         if (newProtocol === 'UNDERDOG_VICTORY' || newProtocol === 'TIME_TAX') {
             addOverlay("protocol_alert", "SECRET PROTOCOL", "A hidden protocol is active...");
         }
      }
    } else {
      setActiveProtocol(null);
    }

    // --- ABILITY TRIGGERS: PREPARE_TO_BID ---
    // Handle triggers that happen right before countdown starts
    const selectedChar = selectedCharacter;
    if (selectedChar) {
        // GUARDIAN H: VIBE GUARD (Social)
        if (selectedChar.id === 'harambe' && variant === 'SOCIAL_OVERDRIVE') {
             // Stack event instead of override
             setTimeout(() => {
                 addOverlay("social_event", "VIBE GUARD ACTIVE", "Designate a player immune to social dares this round.", 0);
             }, 100); 
        }
        
        // WINTER: COLD SHOULDER (Social)
        if (selectedChar.id === 'winter' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.25) {
             setTimeout(() => {
                 addOverlay("social_event", "COLD SHOULDER", "Ignore all social interactions this round.", 0);
             }, 200);
        }

        // WANDERING EYE: DISTRACTION (Social)
        if (selectedChar.id === 'bf' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.35) {
             setTimeout(() => {
                 addOverlay("social_event", "DISTRACTION OPPORTUNITY", "Point at something! Anyone who looks must drop buzzer.", 0);
             }, 300);
        }

        // GIGACHAD: MOG (Social)
        if (selectedChar.id === 'gigachad' && variant === 'SOCIAL_OVERDRIVE' && Math.random() < 0.20) {
             setTimeout(() => {
                 addOverlay("social_event", "MOG CHECK", "Stare challenge! Loser drops button.", 0);
             }, 400);
        }
        
        // SADMAN: SAD REVEAL (Passive - PEEK Selection)
        if (selectedChar.id === 'pepe') {
             const opponents = players.filter(p => p.id !== 'p1' && !p.isEliminated);
             if (opponents.length > 0) {
                 const target = opponents[Math.floor(Math.random() * opponents.length)];
                 setPeekTargetId(target.id);
             }
        } else {
             setPeekTargetId(null);
        }

        // WANDERING EYE: SNEAK PEEK (Passive - See 1 holding, scramble everyone else)
        if (selectedChar.id === 'bf') {
             const opponents = players.filter(p => p.id !== 'p1' && !p.isEliminated);
             if (opponents.length > 0) {
                 // Reveal ONE person randomly
                 const target = opponents[Math.floor(Math.random() * opponents.length)];
                 setPeekTargetId(target.id); 

                 // SCRAMBLE EVERYONE ELSE (Opponents time bank scrambled for viewer)
                 const others = opponents.filter(o => o.id !== target.id).map(o => o.id);
                 setScrambledPlayers(others);
             }
        } else {
             // For non-BF characters, ensure scrambled is empty unless system failure
             if (activeProtocol !== 'SYSTEM_FAILURE') {
                setScrambledPlayers([]);
             }
        }
    }

    // Start timer at minimum bid time (penalty value)
    const minBidTime = getTimerStart();
    setCurrentTime(minBidTime);
    setCountdown(COUNTDOWN_SECONDS);
    setPhase('countdown');
    overLimitToastShownRef.current = false; // Reset over-limit flag
  };

  // End Round Logic
  const endRound = (finalTime: number) => {
    setPhase('round_end');
    
    // 1. IDENTIFY PARTICIPANTS (Those who held past countdown)
    const participants = players.filter(p => p.currentBid !== null && p.currentBid > 0);

    // Make sure the elimination moment flag shows up for the player if they got eliminated.
    // (Do NOT auto-dismiss; this must persist until the player clicks it.)
    // De-dupe: if another part of the round resolution also adds this, don't stack duplicates.
    const p1AtRoundEnd = players.find(p => p.id === 'p1');
    if (p1AtRoundEnd?.isEliminated) {
      const alreadyHasElimFlag = overlays.some(o => o.type === "time_out" && o.message === "PLAYER ELIMINATED");
      if (!alreadyHasElimFlag) {
        addOverlay("time_out", "PLAYER ELIMINATED", "Out of time!", 0);
      }
    }
    
    // 2. CALCULATE PRELIMINARY TIME & ELIMINATION (Pre-Winner)
    
    // First, identify Roll Safe (Thinker) if present - immune to all abilities
    const rollSafeId = players.find(p => p.name === 'Roll Safe' || p.name === 'The Consultant' || (p.isBot && [...CHARACTERS].find(c => c.name === p.name)?.id === 'thinker') || (!p.isBot && selectedCharacter?.id === 'thinker'))?.id;

    const disruptEffects: { targetId: string, amount: number, source: string, ability: string }[] = [];
    let playersOut: string[] = [];
    
    if (abilitiesEnabled) {
        players.forEach(sourcePlayer => {
            // Abilities should trigger even if the player didn't participate this round.
            // Only fully eliminated players (out of time) are blocked.
            if (sourcePlayer.isEliminated || sourcePlayer.remainingTime <= 0) return;
            
            const character = sourcePlayer.isBot 
                ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === sourcePlayer.name) 
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
                         disruptEffects.push({ targetId: target.id, amount: 2.0, source: sourcePlayer.name, ability: ab.name });
                     }
                 } else if (ab.name === 'BURN IT') {
                     // Hit EVERYONE (except Roll Safe)
                     // Hotwired: Remove 1s from everyone else
                     // FORCE HIT: Ignore immunity unless explicitly Roll Safe
                     players.filter(pl => pl.id !== sourcePlayer.id && !pl.isEliminated && pl.id !== rollSafeId).forEach(target => {
                         disruptEffects.push({ targetId: target.id, amount: 1.0, source: sourcePlayer.name, ability: ab.name });
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
        if (p.isEliminated) return { ...p, roundImpact: "", impactLogs: undefined };

        let newTime = p.remainingTime;
        let roundImpact = "";
        let impactLogs: { value: string, reason: string, type: 'loss' | 'gain' | 'neutral' }[] = [];

        // Bid Deduction (Only if bid exists)
        if (p.currentBid !== null && p.currentBid > 0) {
             const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === p.name) : selectedCharacter;
             const hasFireWall = playerChar?.ability?.name === 'FIRE WALL';
             
             // MOLE Exception
             if (activeProtocol === 'THE_MOLE' && p.id === moleTarget) {
                 // Free
             } else {
                 newTime -= p.currentBid;
             }
        }

        // Pending Penalties (Applied regardless of bid)
        const pending = pendingPenalties[p.id] || 0;
        if (pending > 0) {
            newTime -= pending;
            roundImpact += ` -${pending}s (Penalty)`;
            impactLogs.push({ value: `-${pending.toFixed(1)}s`, reason: "Penalty", type: 'loss' });
        }

        // Apply Standard Disruptions (Manager Call, Burn It)
        // Fire Wall BLOCKS PROTOCOLS but NOT DISRUPTIONS (Abilities) per user request.
        // Roll Safe BLOCKS ALL.
        
        if (p.id !== rollSafeId) { 
             const myDisrupts = disruptEffects.filter(d => d.targetId === p.id);
             myDisrupts.forEach(d => {
                newTime -= d.amount;
                roundImpact += ` -${d.amount}s (${d.ability})`;
                impactLogs.push({ value: `-${d.amount.toFixed(1)}s`, reason: d.ability, type: 'loss' });
            });
        }

        return { ...p, remainingTime: newTime, roundImpact, impactLogs };
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
        if (p.isEliminated) return { ...p, tempTime: 0, roundImpact: "" };

        let newTime = p.remainingTime;
        let roundImpact = "";
        let impactLogs: { value: string, reason: string, type: 'loss' | 'gain' | 'neutral' }[] = [];

        // Bid Deduction
        if (p.currentBid !== null && p.currentBid > 0) {
             if (activeProtocol === 'THE_MOLE' && p.id === moleTarget) {
                 // Free
             } else {
                 newTime -= p.currentBid;
             }
        }

        // Pending Penalties
        const pending = pendingPenalties[p.id] || 0;
        if (pending > 0) {
            newTime -= pending;
            roundImpact += ` -${pending}s (Penalty)`;
        }

        // Apply Standard Disruptions (Manager Call, Burn It)
        // Fire Wall does NOT block character abilities per user request.
        // Roll Safe IS immune.
        if (p.id !== rollSafeId) { 
             const myDisrupts = disruptEffects.filter(d => d.targetId === p.id);
             myDisrupts.forEach(d => {
                newTime -= d.amount;
                // Add to round impact for display
                roundImpact += ` -${d.amount}s (${d.ability})`;
                // Add detailed log
                impactLogs.push({ value: `-${d.amount.toFixed(1)}s`, reason: d.ability, type: 'loss' });
            });
        }

        return { ...p, remainingTime: newTime, roundImpact };
    });

    if (abilitiesEnabled) {
         players.forEach(sourcePlayer => {
            if (sourcePlayer.isEliminated) return;
            const character = sourcePlayer.isBot 
                ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === sourcePlayer.name) 
                : selectedCharacter;
            
            if (character?.ability?.name === 'AXE SWING') {
                 // Removed random check for bots to ensure consistency as requested
                 
                 // Find non-eliminated opponent with MOST time (using temp times)
                 const validTargets = tempPlayersState.filter(pl => pl.id !== sourcePlayer.id && !pl.isEliminated && pl.remainingTime > 0 && pl.id !== rollSafeId);
                 if (validTargets.length > 0) {
                    // Sort descending by remainingTime to ensure we get the absolute max
                    validTargets.sort((a, b) => b.remainingTime - a.remainingTime);
                    const target = validTargets[0];
                    
                    // Apply directly to tempPlayersState
                    const targetIdx = tempPlayersState.findIndex(t => t.id === target.id);
                    if (targetIdx >= 0) {
                        tempPlayersState[targetIdx].remainingTime -= 2.0;
                        tempPlayersState[targetIdx].roundImpact += " -2.0s (Axe Swing)";
                        if (tempPlayersState[targetIdx].impactLogs) {
                             tempPlayersState[targetIdx].impactLogs!.push({ value: "-2.0s", reason: "Axe Swing", type: 'loss' });
                        }
                        
                        // Add to disruptEffects for animation later
                        disruptEffects.push({ targetId: target.id, amount: 2.0, source: sourcePlayer.name, ability: 'AXE SWING' });
                    }
                 }
            }
         });
    }

    // C. FINAL PASS: Refunds + Elimination Check
    let playersState = tempPlayersState.map(p => {
        if (p.isEliminated) return p;

        let newTime = p.remainingTime;
        let roundImpact = p.roundImpact || ""; // Ensure string
        let impactLogs = [...(p.impactLogs || [])];
        let selfGain = 0;
        
        const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === p.name) : selectedCharacter;

        // Refunds
        if (abilitiesEnabled && playerChar?.ability?.effect === 'TIME_REFUND') {
            const ab = playerChar.ability;
            let refund = 0;
            if (ab.name === 'CYRO FREEZE') refund = 1.0;
            if (ab.name === 'PANIC MASH') refund = (Math.random() > 0.5 ? 3.0 : -3.0);
            
            if (p.currentBid !== null && p.currentBid > 0) {
                 if (ab.name === 'RAINBOW RUN' && p.currentBid > 40) refund = 3.5;
                 if (ab.name === 'ROYAL DECREE' && Math.abs(p.currentBid - 20) <= 0.1) refund = 4.0;
            }
            
            if (refund !== 0) {
                newTime += refund;
                roundImpact += ` ${refund > 0 ? '+' : ''}${refund}s (${ab.name})`;
                impactLogs.push({ value: `${refund > 0 ? '+' : ''}${refund.toFixed(1)}s`, reason: ab.name, type: refund > 0 ? 'gain' : 'loss' });
                selfGain += refund;
            }
        }

        const isEliminatedNow = newTime <= 0;
        if (isEliminatedNow && !p.isEliminated) {
             playersOut.push(p.name);
        }

        return {
            ...p,
            remainingTime: Math.max(0, newTime),
            isEliminated: isEliminatedNow,
            roundImpact: roundImpact,
            impactLogs: impactLogs,
            selfGain: selfGain
        };
    });

    // 3. DETERMINE WINNER
    const validParticipants = playersState.filter(p => 
        participants.some(orig => orig.id === p.id) && 
        !p.isEliminated
    );

    validParticipants.sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));

    let winnerId: string | null = null;
    let winnerName: string | null = null;
    let winnerTime = 0;

    if (validParticipants.length > 0) {
        const potentialWinner = validParticipants[0];
        const isTie = validParticipants.some(p => p.id !== potentialWinner.id && Math.abs((p.currentBid || 0) - (potentialWinner.currentBid || 0)) < 0.05);
        
        if (!isTie) {
            winnerId = potentialWinner.id;
            winnerName = potentialWinner.name;
            winnerTime = potentialWinner.currentBid || 0;
        } else {
             setOverlay({ type: "protocol_alert", message: "DEADLOCK SYNC", subMessage: "Exact Time Match! No Winner." });
             setRoundLog(prev => [`>> DEADLOCK SYNC: Tie detected! No tokens awarded.`, ...prev]);
        }
    } else {
        if (participants.length > 0) {
             setOverlay({ type: "protocol_alert", message: "TOTAL WIPEOUT", subMessage: "All participants eliminated." });
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
                playersState[moleIdx].impactLogs!.push({ value: "-1 Token", reason: "Mole Suicide", type: 'loss' });
                setRoundLog(prev => [`>> MOLE FAILURE: ${rawWinner.name} held too long and LOST a trophy!`, ...prev]);
            }
        }
    }

    // 5. APPLY WINNER REWARDS & CONDITIONAL ABILITIES
    const extraLogs: string[] = [];
    const newAbilities: any[] = []; 

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

        if (p.id === winnerId) {
             let tokensToAdd = 1;
             if (activeProtocol === 'DOUBLE_STAKES' || activeProtocol === 'PANIC_ROOM') {
                tokensToAdd = 2;
                extraLogs.push(`>> HIGH STAKES: ${p.name} won ${tokensToAdd} trophies!`);
            }
            newTokens += tokensToAdd;

             if (abilitiesEnabled) {
                const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === p.name) : selectedCharacter;
                const ab = playerChar?.ability;
                
                if (ab) {
                    let refund = 0;
                    if (ab.name === 'SPIRIT SHIELD' && round === 1) refund = 11.0;
                    // RAINBOW RUN handled in refund pass
                    if (ab.name === 'PAY DAY') refund = 0.5;
                    if (ab.name === 'ROYAL DECREE' && Math.abs((p.currentBid || 0) - 20) <= 0.1) refund = 4.0;
                    if (ab.name === 'CHEF\'S SPECIAL') {
                         const sortedBids = validParticipants.filter(vp => vp.id !== winnerId).map(vp => vp.currentBid || 0);
                         const secondPlace = sortedBids[0] || 0;
                         if (winnerTime - secondPlace > 10) refund = 4.0;
                    }

                    if (refund > 0) {
                        newTime += refund;
                        impact += ` +${refund}s (${ab.name})`;
                        impactLogs.push({ value: `+${refund.toFixed(1)}s`, reason: ab.name, type: 'gain' });
                        newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TIME_REFUND', impactValue: `+${refund}s` });
                    }
                    
                    if (ab.effect === 'TOKEN_BOOST') {
                         if (ab.name === 'HYPER CLICK') {
                             const sortedBids = validParticipants.map(vp => vp.currentBid || 0);
                             const secondPlace = sortedBids.length > 1 ? sortedBids[1] : 0;
                             if ((p.currentBid || 0) - secondPlace <= 1.1) {
                                 newTokens += 1;
                                 impact += " +1 Token (Hyper Click)";
                                 impactLogs.push({ value: "+1 Token", reason: "Hyper Click", type: 'gain' });
                                 newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TOKEN_BOOST', impactValue: "+1 Token" });
                             }
                         }
                         if (ab.name === 'TO THE MOON' && (p.currentBid || 0) > 30) {
                             newTokens += 1;
                             impact += " +1 Token (Moon)";
                             impactLogs.push({ value: "+1 Token", reason: "To The Moon", type: 'gain' });
                             newAbilities.push({ playerId: p.id, ability: ab.name, effect: 'TOKEN_BOOST', impactValue: "+1 Token" });
                         }
                         if (ab.name === 'DIVIDEND' && round % 3 === 0) {
                             newTokens += 1;
                             impact += " +1 Token (Dividend)";
                             impactLogs.push({ value: "+1 Token", reason: "Dividend", type: 'gain' });
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
               impact += " -1 Token (Mole Win > 7s)";
               impactLogs.push({ value: "-1 Token", reason: "Mole Win > 7s", type: 'loss' });
               extraLogs.push(`>> MOLE FAILURE: ${p.name} won by ${margin.toFixed(1)}s and LOST a trophy!`);
             } else {
               impact += " +0 (Mole Win Safe)";
               impactLogs.push({ value: "+0", reason: "Mole Win (<=7s)", type: 'neutral' });
             }
        }
        
        if (abilitiesEnabled && p.id !== winnerId && winnerId && !p.isEliminated) {
             const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === p.name) : selectedCharacter;
             if (playerChar?.ability?.name === 'CHEESE TAX') {
                 newTime += 2.0;
                 impact += " +2.0s (Cheese Tax)";
                 impactLogs.push({ value: "+2.0s", reason: "Cheese Tax", type: 'gain' });
                 newAbilities.push({ playerId: p.id, ability: 'CHEESE TAX', effect: 'DISRUPT', targetId: winnerId, impactValue: "Steal 2s" });
             }
        }

        return { ...p, tokens: newTokens, remainingTime: newTime, roundImpact: impact, impactLogs: impactLogs };
    });

    // 6. APPLY CHEESE TAX DAMAGE TO WINNER (Post-Processing)
    if (winnerId && abilitiesEnabled) {
        finalPlayers.forEach(p => {
             if (p.id !== winnerId && !p.isEliminated) {
                 const playerChar = p.isBot ? [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === p.name) : selectedCharacter;
                 if (playerChar?.ability?.name === 'CHEESE TAX') {
                     const w = finalPlayers.find(fp => fp.id === winnerId);
                     // Roll Safe Immunity Check
                     const rollSafeId = finalPlayers.find(p => p.name === 'Roll Safe' || p.name === 'The Consultant' || (p.isBot && [...CHARACTERS].find(c => c.name === p.name)?.id === 'thinker') || (!p.isBot && selectedCharacter?.id === 'thinker'))?.id;
                     
                     if (w && w.id !== rollSafeId) {
                         w.remainingTime = Math.max(0, w.remainingTime - 2.0);
                         w.roundImpact = (w.roundImpact || "") + " -2.0s (Cheese Tax)";
                         if (w.impactLogs) w.impactLogs.push({ value: "-2.0s", reason: "Cheese Tax", type: 'loss' });
                         
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
    setPlayers(finalPlayers);
    const updatedPlayers = finalPlayers;
    setRoundWinner(winnerId ? { name: winnerName!, time: winnerTime } : null);
    
    // Trigger Animations
    newAbilities.forEach(ab => {
         triggerAnimation(ab.playerId, ab.effect === 'TIME_REFUND' ? 'TIME_REFUND' : 'TOKEN_BOOST', ab.impactValue);
         if (ab.targetId) triggerAnimation(ab.targetId, 'DAMAGE', ab.impactValue);
    });
    
    // SINGLE PLAYER ELIMINATION CHECK
    // "If the main player is eliminated... Immediately resolve the game"
    // SIMULATE REMAINING ROUNDS so bots get trophies
    const p1 = finalPlayers.find(p => p.id === 'p1');
    if (p1?.isEliminated) {
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
         
         // Show only the moment-flag style elimination notice (this should persist into game over).
         // (Avoid stacking multiple elimination popups; the moment flag is the single source of truth.)
         const alreadyHasElimFlag = overlays.some(o => o.type === "time_out" && o.message === "PLAYER ELIMINATED");
         if (!alreadyHasElimFlag) {
           addOverlay("time_out", "PLAYER ELIMINATED", "Out of time!", 0);
         }

         // Simulate remaining rounds simply by awarding tokens
         // (kept as-is; does not affect the overlay flow)

         // Keep the elimination overlays visible; do NOT auto-transition to game over.
         // Player must dismiss the elimination overlay(s), then can proceed.
         setPhase('game_end');

         return; // Stop here
    }

    // --- BIO/SOCIAL ABILITY TRIGGERS (End of Round) ---
    
    finalPlayers.forEach(p => {
        if (p.isEliminated) return;
        
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

        // BIO-FUEL LOGIC
        if (variant === 'BIO_FUEL' && char.bioAbility) {
            const bName = char.bioAbility.name;
            const bDesc = char.bioAbility.description;
            const roll = Math.random();

            // SADMAN LOGIC: "DRINKING PARTNER" (Every Round)
            if (bName === 'DRINKING PARTNER') {
                if (p.id === 'p1') {
                    triggered = true; abilityName = bName; abilityDesc = "Sadman Logic: Drinking Partner: \"You can change your drinking partner\"";
                }
            }
            // TANK: "ABSORB" (Passive/Reaction) - NO POPUP
            // DANGER ZONE: "CHAIN REACTION" (On Drink Finish) - NO POPUP
            
            // IDOL CORE: "DEBUT" (On Drink - 20% chance)
            else if (bName === 'DEBUT' && roll < 0.2) {
                triggered = true; abilityName = bName; abilityDesc = "Take a drink to reveal a secret!";
            }
            // PROM KING: "CORONATION" (Group Toast - 10% chance)
            else if (bName === 'CORONATION' && roll < 0.1) {
                triggered = true; abilityName = bName; abilityDesc = "Initiate Group Toast!";
            }
            // GUARDIAN H: "LIQUID AUTHORIZATION" (End of Round - Always Active)
            // Removed pop() here as it is handled by newAbilities + generic popup
            else if (bName === 'LIQUID AUTHORIZATION') {
                 triggered = true; abilityName = bName; abilityDesc = "Guardian H: Liquid Authorization: \"You cannot release your button next round until guardian finishes their sip\"";
            }
            // CLICK-CLICK: "MOUTH POP" (1 Random Round - 10%)
            else if (bName === 'MOUTH POP' && roll < 0.1) {
                 triggered = true; abilityName = bName; abilityDesc = "Pop mouth! Everyone sips!";
            }
            // FROSTBYTE: "BRAIN FREEZE" (1 Random Round - 10%)
            else if (bName === 'BRAIN FREEZE') {
                 // Logic: Only 1 round per game
                 if (!frostbyteAbilityUsed && roll < 0.1) {
                     setFrostbyteAbilityUsed(true);
                     // Show ONLY to Driver (p1) or if p1 is target (but here p1 is driver in this check)
                     if (p.id === 'p1') {
                         triggered = true; abilityName = bName; abilityDesc = "Force opponent to Win or Drink!";
                     }
                 }
            }
            // RAINBOW DASH: "RAINBOW SHOT" (10% chance)
            else if (bName === 'RAINBOW SHOT' && roll < 0.1) {
                 triggered = true; abilityName = bName; abilityDesc = "Mix two drinks!";
            }
            // THE ACCUSER: "SPILL HAZARD" (25% chance)
            else if (bName === 'SPILL HAZARD' && roll < 0.25) {
                 triggered = true; abilityName = bName; abilityDesc = "Accuse someone of spilling!";
            }
            // LOW FLAME: "ON FIRE" (When Winner)
            else if (bName === 'ON FIRE' && p.id === winnerId) {
                 triggered = true; abilityName = bName; abilityDesc = "Everyone else drinks!";
            }
            // WANDERING EYE: "THE EX" (10% chance)
            else if (bName === 'THE EX' && roll < 0.1) {
                 triggered = true; abilityName = bName; abilityDesc = "Toast to an ex!";
            }
            // THE RIND: "SCAVENGE" (5% chance)
            else if (bName === 'SCAVENGE' && roll < 0.05) {
                 const targets = finalPlayers.filter(fp => fp.id !== p.id && !fp.isEliminated);
                 if (targets.length > 0) {
                     const t = targets[Math.floor(Math.random() * targets.length)];
                     specificTargetId = t.id;
                     triggered = true; abilityName = bName; abilityDesc = "The Rind: Scavenge: \"You must finish someone elses drink\"";
                 }
            }
            // THE ANOINTED: "ROYAL CUP" (1 Random Round - 5% end)
            else if (bName === 'ROYAL CUP' && roll < 0.05) {
                 triggered = true; abilityName = bName; abilityDesc = "Make a rule for the game!";
            }
            // EXECUTIVE P: "REASSIGNED" (50% chance)
            else if (bName === 'REASSIGNED' && roll < 0.5) {
                 triggered = true; abilityName = bName; abilityDesc = "Choose 1 player to drink!";
            }
            // ALPHA PRIME: "PACE SETTER" (Every 3 rounds)
            else if (bName === 'PACE SETTER' && round % 3 === 0) {
                 triggered = true; abilityName = bName; abilityDesc = "Alpha Prime: Pace Setter: \"Start a Waterfall!\"";
            }
            // ROLL SAFE: "BIG BRAIN" (05% chance)
            else if (bName === 'BIG BRAIN' && roll < 0.05) {
                 triggered = true; abilityName = bName; abilityDesc = "Pass drink to the left?";
            }
            // HOTWIRED: "SPICY" (20% chance)
            else if (bName === 'SPICY' && roll < 0.2) {
                 triggered = true; abilityName = bName; abilityDesc = "Everyone drinks!";
            }
            // PANIC BOT: "EMERGENCY MEETING" (25% chance)
            else if (bName === 'EMERGENCY MEETING' && roll < 0.25) {
                 triggered = true; abilityName = bName; abilityDesc = "Gang up on someone!";
            }
            // PRIMATE PRIME: "GREEDY GRAB" (5% chance)
            else if (bName === 'GREEDY GRAB' && roll < 0.05) {
                 triggered = true; abilityName = bName; abilityDesc = "Winner burns 40s or drinks!";
            }
            // PAIN HIDER: "SUPPRESS" - NO POPUP
            // TANK: "IRON STOMACH" - NO POPUP
            // DANGER ZONE: "OVERPOUR" - NO POPUP
        }
        
        // SOCIAL OVERDRIVE LOGIC
        else if (variant === 'SOCIAL_OVERDRIVE' && char.socialAbility) {
            const sName = char.socialAbility.name;
            const roll = Math.random();

            // PROM KING: "PROM COURT" (1 Random Round - 10%)
            if (sName === 'PROM COURT' && roll < 0.1) {
                triggered = true; abilityName = sName; abilityDesc = "Make a rule for the game!";
            }
            // IDOL CORE: "FANCAM" (10% chance)
            else if (sName === 'FANCAM' && roll < 0.1) {
                triggered = true; abilityName = sName; abilityDesc = "Show talent or drop button!";
            }
            // TANK: "PEOPLE'S ELBOW" (Every round chance - 30%)
            else if (sName === 'PEOPLE\'S ELBOW' && roll < 0.3) {
                triggered = true; abilityName = sName; abilityDesc = "Challenge to thumb war!";
            }
            // DANGER ZONE: "PRIVATE DANCE" (Every round chance - 30%)
            else if (sName === 'PRIVATE DANCE' && roll < 0.3) {
                triggered = true; abilityName = sName; abilityDesc = "Give a command!";
            }
            // GUARDIAN H: "VIBE GUARD" (Start of round - maybe late trigger here for next)
            // CLICK-CLICK: "MISCLICK" (25% chance)
            else if (sName === 'MISCLICK' && roll < 0.25) {
                 triggered = true; abilityName = sName; abilityDesc = "Hold without hands!";
            }
            // FROSTBYTE: "COLD SHOULDER" (50% chance)
            else if (sName === 'COLD SHOULDER' && roll < 0.50) {
                 triggered = true; abilityName = sName; abilityDesc = "Ignore social interactions!";
            }
            // SADMAN LOGIC: "SAD STORY" (5% chance)
            else if (sName === 'SAD STORY' && roll < 0.05) {
                 triggered = true; abilityName = sName; abilityDesc = "Share a sad story.";
            }
            // RAINBOW DASH: "SUGAR RUSH" (15% chance)
            else if (sName === 'SUGAR RUSH' && roll < 0.15) {
                 triggered = true; abilityName = sName; abilityDesc = "Speak 2x speed!";
            }
            // THE ACCUSER: "COMPLAINT" (15% chance)
            else if (sName === 'COMPLAINT' && roll < 0.15) {
                 triggered = true; abilityName = sName; abilityDesc = "Vote on winner's punishment!";
            }
            // LOW FLAME: "HOT SEAT" (25% chance)
            else if (sName === 'HOT SEAT' && roll < 0.25) {
                 triggered = true; abilityName = sName; abilityDesc = "Choose player to answer Truth!";
            }
            // WANDERING EYE: "DISTRACTION" (Start of round - maybe late reminder)
            // THE RIND: "SNITCH" (5% chance)
            else if (sName === 'SNITCH' && roll < 0.05) {
                 triggered = true; abilityName = sName; abilityDesc = "Reveal someone's tell!";
            }
            // THE ANOINTED: "COMMAND SILENCE" (50% chance)
            else if (sName === 'COMMAND SILENCE' && roll < 0.5) {
                 triggered = true; abilityName = sName; abilityDesc = "Command silence!";
            }
            // EXECUTIVE P: "CC'D" (20% chance)
            else if (sName === 'CC\'D' && roll < 0.2) {
                 triggered = true; abilityName = sName; abilityDesc = "Player copies you next round!";
            }
            // ALPHA PRIME: "MOG" (10% chance)
            else if (sName === 'MOG' && roll < 0.1) {
                 triggered = true; abilityName = sName; abilityDesc = "10 pushups or ff next round";
            }
            // ROLL SAFE: "TECHNICALLY" - NO POPUP
            
            // HOTWIRED: "VIRAL MOMENT" (Random round - 10%)
            else if (sName === 'VIRAL MOMENT' && roll < 0.1) {
                 triggered = true; abilityName = sName; abilityDesc = "Re-enact a meme!";
            }
            // PANIC BOT: "SWEATING" - NO POPUP (Description updated, but silent trigger)
            // "For sweating on panic bot, please take out the they drink verbiage since this is social game type not drinking."
            // "For ... sweating ... no popup trigger is necessary at any point."
            
            // PRIMATE PRIME: "FRESH CUT" (10% chance)
            else if (sName === 'FRESH CUT' && roll < 0.1) {
                 triggered = true; abilityName = sName; abilityDesc = "Compliment everyone! You look great today.";
            }
        }

        if (triggered) {
            newAbilities.push({
                player: p.name, playerId: p.id, ability: abilityName, effect: variant === 'BIO_FUEL' ? 'BIO_TRIGGER' : 'SOCIAL_TRIGGER', 
                impactValue: abilityDesc,
                targetId: specificTargetId
            });
        }
    });

    setActiveAbilities(newAbilities); // Update state for other components

    // --- DETERMINE OVERLAY TYPE ---
    let momentCount = 0; // Track moment flags for triple play

    if (playersOut.length > 0) {
      // Elimination moment flag is handled elsewhere (single source of truth).
      // Keeping this block prevents other moment-flag logic from running when players are eliminated.
      // (Intentionally no overlay added here to avoid duplicates.)
    } else if (winnerId) { 
       const winnerPlayer = participants[0]; // winner is first
       const secondPlayer = participants.length > 1 ? participants[1] : null;
       const winnerBid = winnerPlayer.currentBid || 0;
       const secondBid = secondPlayer?.currentBid || 0;
       const margin = winnerBid - secondBid;

       // 1. Smug Confidence (Round 1 Win)
       if (round === 1 && winnerId === 'p1') {
         addOverlay("smug_confidence", "SMUG CONFIDENCE", `${winnerName} starts strong!`);
         momentCount++;
       }
       
       // 2. Fake Calm (Margin >= 15s)
       if (secondPlayer && margin >= 15 && winnerId === 'p1') {
         // Delay slightly if smug confidence also triggered
         setTimeout(() => addOverlay("fake_calm", "FAKE CALM", `Won by ${margin.toFixed(1)}s!`), 500);
         momentCount++;
       }
       
       // 3. Genius Move (Margin <= 5s)
       if (secondPlayer && margin <= 5 && winnerId === 'p1') {
         setTimeout(() => addOverlay("genius_move", "GENIUS MOVE", `Won by just ${margin.toFixed(1)}s`), 500);
         momentCount++;
       }
       
       // 4. Easy W (Bid < 20s)
       if (winnerBid < 20 && winnerId === 'p1') {
         setTimeout(() => addOverlay("easy_w", "EASY W", `Won with only ${winnerBid.toFixed(1)}s`), 1000);
         momentCount++;
       }
       
       // 5. Comeback Hope & Others
       if (winnerId === 'p1') {
           const winnerTokensBefore = players.find(p => p.id === winnerId)?.tokens || 0;
           const minTokens = Math.min(...players.map(p => p.tokens));
           
           // COMEBACK HOPE: only if you started the round as the *sole* last-place player
           // (not tied for last)
           const playersAtMin = players.filter(p => p.tokens === minTokens);
           if (winnerTokensBefore === minTokens && playersAtMin.length === 1 && players.some(p => p.tokens > winnerTokensBefore)) {
               setTimeout(() => addOverlay("comeback_hope", "COMEBACK HOPE", `${winnerName} stays in the fight!`), 1000);
               momentCount++;
           }
           
           // Precision
           if (winnerBid % 1 === 0) {
               setTimeout(() => addOverlay("precision_strike", "PRECISION STRIKE", "Exact second bid!"), 1500);
               momentCount++;
           }
           
           // Overkill
           if (winnerBid > 60) {
               setTimeout(() => addOverlay("overkill", "OVERKILL", "Massive bid!"), 1500);
               momentCount++;
           }
           
           // Clutch
           if (winnerPlayer.remainingTime < 10) {
               setTimeout(() => addOverlay("clutch_play", "CLUTCH PLAY", "Almost out of time!"), 1500);
               momentCount++;
           }
           
           // Patch Notes Pending: 3+ moment flags in same round (shows after the other flags)
           if (momentCount >= 3) {
               setTimeout(() => addOverlay("hidden_patch_notes", "PATCH NOTES PENDING", "Triggered 3+ moment flags in one round."), 2500);
           }
       }

    } else {
       // No winner
       addOverlay("round_draw", "NO WINNER", "Tie or No Bids");
    }

    if (!winnerId && participants.length === 0) {
       // Everyone zero bid / abandoned?
       addOverlay("zero_bid", "AFK", "No one dared to bid!");
    }

    // Protocol Post-Round Popups
    if (activeProtocol === 'TRUTH_DARE' || activeProtocol === 'SWITCH_SEATS') {
        // Override overlay to show protocol requirement
        let msg = "";
        let sub = "";
        if (activeProtocol === 'TRUTH_DARE') { msg = "TRUTH OR DARE"; sub = "Winner: Ask. Loser: Do."; }
        if (activeProtocol === 'SWITCH_SEATS') { msg = "SEAT SWAP"; sub = "Everyone move left!"; }
        
        // Priority over win popup
        setTimeout(() => addOverlay("social_event", msg, sub), 500);
    }

    // SECRET PROTOCOL REVEALS (Underdog / Time Tax)
    if (activeProtocol === 'UNDERDOG_VICTORY') {
        // Find lowest bidder > min bid and not eliminated
        const minBid = MIN_BID;
        const eligible = finalPlayers.filter(p => !p.isEliminated && (p.currentBid || 0) >= minBid);
        eligible.sort((a, b) => (a.currentBid || 0) - (b.currentBid || 0)); // Ascending
        
        if (eligible.length > 0) {
            const underdog = eligible[0];
            // Award Token
            const idx = finalPlayers.findIndex(p => p.id === underdog.id);
            if (idx !== -1) {
                finalPlayers[idx].tokens += 1;
                finalPlayers[idx].roundImpact = (finalPlayers[idx].roundImpact || "") + " +1 Token (Underdog)";
                if (finalPlayers[idx].impactLogs) finalPlayers[idx].impactLogs!.push({ value: "+1 Token", reason: "Underdog Victory", type: 'gain' });
                
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
        // Deduct 10s from everyone not eliminated
        let hitList: string[] = [];
        finalPlayers.forEach(p => {
            if (!p.isEliminated && p.remainingTime > 0) {
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

    // LAST ONE STANDING MOMENT CHECK
    // Win final round AND at least one player eliminated in that round
    if (winnerId === 'p1' && round === totalRounds) {
         if (playersOut.length > 0) {
             // LAST ONE STANDING
             setTimeout(() => addOverlay("genius_move", "LAST ONE STANDING", `Survivor Victory! (${playersOut.length} eliminated)`), 2000);
         }
    }

    // BIO-FUEL Logic: Add drink prompt if applicable
    if (variant === 'BIO_FUEL' && playersOut.some(id => id === 'p1')) {
         // Stack Bio Event for time out
         setTimeout(() => addOverlay("bio_event", "ELIMINATED! CONSUME BIO-FUEL.", "", 0), 1000);
    }

    // --- Moment Flags can stack (2+ in same round) ---
    // Removed duplicate momentCount declaration
    // Use the one declared at start of Overlay Logic

    const isMomentOverlay = (t: OverlayType) => {
      return t === 'time_out' || t === 'smug_confidence' || t === 'fake_calm' || t === 'genius_move' || t === 'easy_w' || t === 'comeback_hope' || t === 'precision_strike' || t === 'overkill' || t === 'clutch_play';
    };

    // Note: We are now adding overlays directly via addOverlay() above, not setting overlayType variable.
    // So we need to increment momentCount where we call addOverlay() for moment types.
    // I will refactor the above blocks to increment momentCount correctly.

    // LATE PANIC: if winner started the round with the lowest bank (approx)
    if (winnerId === 'p1' && participants.length > 0) {
      const winner = participants[0];
      const winnerBid = winner.currentBid || 0;
      const winnerStartApprox = winner.remainingTime + winnerBid;
      const minStartApprox = Math.min(...finalPlayers.map(p => (p.remainingTime + (p.currentBid || 0))));
      if (winnerStartApprox <= minStartApprox + 0.0001) {
        addOverlay('late_panic', 'LATE PANIC', 'Won starting the round with the lowest time bank.', 0);
        momentCount += 1;
      }
    }

    // Hidden 67: ANY driver who bids within ±0.1 of 67s (does not need to win)
    finalPlayers.forEach(p => {
      const bid = p.currentBid || 0;
      if (bid > 0 && Math.abs(bid - 67) <= 0.1) {
        addOverlay('hidden_67', '67', `${p.name} hit 67.0s (±0.1).`, 0);
        momentCount += 1;
      }
    });

    // Hidden Deja Bid: winner wins 2 rounds in a row with bid within ±0.2 of previous win
    const prevWinBid = roundLog.find(l => l.startsWith('>> WIN BID: '))?.split('>> WIN BID: ')[1];
    if (winnerId === 'p1' && prevWinBid && participants.length > 0) {
      const winnerBid = participants[0].currentBid || 0;
      const prev = parseFloat(prevWinBid);
      if (!Number.isNaN(prev) && Math.abs(winnerBid - prev) <= 0.2) {
        addOverlay('hidden_deja_bid', 'DEJA BID', 'Back-to-back wins with nearly identical bids.', 0);
        momentCount += 1;
      }
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

               // Case 1: I cast it OR I am the target (Consistent Popups)
               if (ability.playerId === 'p1') {
                   show = true;
                   if (ability.targetName) {
                       desc += ` on ${ability.targetName}`;
                   }
                   
                   // SELF-TRIGGER REALITY MODE FORMAT FIX
                   if (ability.effect === 'BIO_TRIGGER' || ability.effect === 'SOCIAL_TRIGGER') {
                        // For SELF, we want same format: "Driver: Ability Name" | "Description"
                        title = `${ability.player}: ${ability.ability}`;
                        desc = `"${ability.impactValue}"`; // Use the flavor text
                        
                        if (ability.effect === 'BIO_TRIGGER') {
                            className += " bg-orange-950 border-orange-500 text-orange-100";
                        } else {
                            className += " bg-purple-950 border-purple-500 text-purple-100";
                        }
                   } else if (ability.effect === 'TIME_REFUND') {
                        desc += " (+TIME)";
                        className += " bg-emerald-950 border-emerald-500 text-emerald-100";
                   } else if (ability.effect === 'TOKEN_BOOST') {
                        desc += " (+TOKENS)";
                        className += " bg-yellow-950 border-yellow-500 text-yellow-100";
                   } else {
                        className += " bg-blue-950 border-blue-500 text-blue-100";
                   }
               } 
               // Case 2: I was hit
               else if (ability.targetId === 'p1') {
                   show = true;
                   title = `⚠️ WARNING: ${ability.player}`;
                   desc = `${ability.ability} HIT YOU! (-TIME)`;
                   // variant = "destructive"; // User requested non-destructive style for "Reality Mode" (assumed to be this)
                   className += " bg-blue-950 border-blue-500 text-blue-100";
               } 
               // Case 3: Global effect hitting everyone (including me)
               else if (ability.targetName === 'ALL OPPONENTS') {
                   show = true;
                   title = `⚠️ GLOBAL THREAT: ${ability.player}`;
                   desc = `${ability.ability} HIT EVERYONE!`;
                   variant = "destructive";
                   className += " bg-orange-950 border-orange-500 text-orange-100";
               }
               // Case 4: Special Notification for Click-Click winning 2 tokens
               else if (ability.ability === 'HYPER CLICK' && ability.effect === 'TOKEN_BOOST' && newAbilities.some(a => a.playerId === 'p1')) {
                   show = true;
                   title = `${ability.player} BONUS!`;
                   desc = "HYPER CLICK AWARDED +1 TOKEN!";
                   className += " bg-purple-950 border-purple-500 text-purple-100";
               }
               // Case 5: BIO/SOCIAL Trigger for others (Visible Event)
               else if (ability.effect === 'BIO_TRIGGER' || ability.effect === 'SOCIAL_TRIGGER') {
                   show = true;
                   title = `${ability.player}: ${ability.ability}`; // Strict Format: Driver: Ability Name
                   // CRITICAL: Use the impactValue (description) as the main text
                   // Strict Format: "Description"
                   desc = `"${ability.impactValue}"`;
                   
                   // Specific coloring for visibility
                   if (ability.effect === 'BIO_TRIGGER') {
                       className += " bg-orange-950 border-orange-500 text-orange-100";
                   } else {
                       className += " bg-purple-950 border-purple-500 text-purple-100";
                   }
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
    
    // Mole Penalty Log
    if (activeProtocol === 'THE_MOLE' && winnerId === moleTarget) {
        const rawSorted = [...participants].sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
        const rawWinner = rawSorted[0];
        const rawSecond = rawSorted[1];
        const rawWinnerTime = rawWinner?.currentBid || 0;
        const rawSecondTime = rawSecond?.currentBid || 0;
        const margin = rawWinnerTime - rawSecondTime;

        if (margin > 7) {
          extraLogs.push(`>> MOLE FAILURE: ${winnerName} won by ${margin.toFixed(1)}s and LOST a trophy.`);
        } else {
          extraLogs.push(`>> MOLE SAFE WIN: ${winnerName} won by ${margin.toFixed(1)}s (<= 7.0s). Trophy awarded as normal.`);
        }
    }

    // Ability Token Boost Log (Click-Click etc)
    // We can check if any ability result was a token boost
    newAbilities.forEach(ab => {
        if (ab.effect === 'TOKEN_BOOST') {
             extraLogs.push(`>> ${ab.player} GAINED TOKENS!`);
        }
    });

    setRoundLog(prev => [...extraLogs, logMsg, ...prev]);

    // Check game end conditions
    const remainingActivePlayers = updatedPlayers.filter(p => !p.isEliminated && p.remainingTime > 0);
    
    if (round >= totalRounds || remainingActivePlayers.length <= 1) {
       // Game End condition
       setTimeout(() => {
        // Keep any end-of-round overlays (moment flags / protocol notices) visible into game over.
        // We only switch phase; overlays are dismissed by the player.
        setPhase('game_end');
      }, 3000);
    }
  };

  const nextRound = () => {
    // Check if all players are eliminated
    const activePlayers = players.filter(p => !p.isEliminated && p.remainingTime > 0);
    
    if (activePlayers.length <= 1 || round >= totalRounds) {
      // End game immediately if only 1 or 0 players remain
      // Keep existing overlays (moment flags / protocol notices) visible.
      setPhase('game_end');
      return;
    }
    
    if (round < totalRounds) {
      // STRICT LIFECYCLE: Clear ALL overlays and animations from previous round
      setOverlay(null);
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
      if (variant === 'SOCIAL_OVERDRIVE' && c.imageSocial) return c.imageSocial;
      if (variant === 'BIO_FUEL' && c.imageBio) return c.imageBio;
      return c.image;
    };
    
    setPlayers(prev => prev.map(p => {
      if (p.id === 'p1') {
        return { ...p, name: char.name, characterIcon: pickIcon(char) };
      }
      return p;
    }));
    setPhase('ready');
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
        currentBid: mp.currentBid,
        isHolding: mp.isHolding,
        totalTimeBid: (mp as any).totalTimeBid || 0,
        totalImpactGiven: mp.roundImpact?.value && mp.roundImpact.value > 0 ? mp.roundImpact.value : 0,
        totalImpactReceived: mp.roundImpact?.value && mp.roundImpact.value < 0 ? Math.abs(mp.roundImpact.value) : 0,
        roundImpact: mp.roundImpact ? `${mp.roundImpact.value > 0 ? '+' : ''}${mp.roundImpact.value.toFixed(1)}s (${mp.roundImpact.source})` : undefined,
        specialEvents: [],
        eventDatabasePopups: [],
        protocolsTriggered: [],
        protocolWins: [],
        totalDrinks: 0,
        socialDares: 0,
        selectedDriver: (mp as any).selectedDriver,
        abilityUsed: (mp as any).abilityUsed || false,
        characterIcon: (() => {
          const driverId = (mp as any).selectedDriver;
          if (!driverId) return undefined;
          const allChars = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS];
          const char = allChars.find(c => c.id === driverId);
          if (!char) return undefined;
          // Use variant-specific image based on game settings
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

  // Now define playerIsReady and playerBid AFTER currentPlayerIsHolding is defined
  const playerIsReady = isMultiplayer 
    ? currentPlayerIsHolding 
    : (players.find(p => p.id === 'p1')?.isHolding ?? false);
  const playerBid = isMultiplayer
    ? (myMultiplayerPlayer?.currentBid ?? null)
    : (players.find(p => p.id === 'p1')?.currentBid ?? null);
  const allPlayersReady = players.every(p => p.isHolding);

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
    const settings = {
      difficulty,
      protocolsEnabled,
      abilitiesEnabled,
      variant,
      gameDuration
    };
    
    socket.emit("create_lobby", { playerName, settings }, (response: { success: boolean; code?: string; lobby?: typeof currentLobby; error?: string }) => {
      if (response.success && response.lobby) {
        console.log('[Lobby] Created:', response.code);
        setCurrentLobby(response.lobby);
        setLobbyCode(response.code || '');
      } else {
        setLobbyError(response.error || "Failed to create lobby");
      }
    });
  }, [socket, isConnected, playerName, difficulty, protocolsEnabled, abilitiesEnabled, variant, gameDuration]);
  
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
      } else {
        setLobbyError(response.error || "Failed to join lobby");
      }
    });
  }, [socket, isConnected, lobbyCode, playerName]);

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
    const settingsKey = JSON.stringify({ difficulty, protocolsEnabled, abilitiesEnabled, variant, gameDuration: serverDuration });
    if (settingsKey === prevSettingsRef.current) return;
    prevSettingsRef.current = settingsKey;
    
    socket.emit("update_lobby_settings", { 
      settings: {
        difficulty,
        protocolsEnabled,
        abilitiesEnabled,
        variant,
        gameDuration: serverDuration
      }
    });
    console.log('[Lobby] Settings updated:', { difficulty, protocolsEnabled, abilitiesEnabled, variant, gameDuration: serverDuration });
  }, [socket, difficulty, protocolsEnabled, abilitiesEnabled, variant, gameDuration]);

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
     
     setPhase('intro');
     setRound(1);
     setOverlay(null);
     setRoundLog([]);
     const time = getInitialTime();
     setPlayers([
        { 
            id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: time, isEliminated: false, currentBid: null, isHolding: false,
            totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
        },
        { 
            id: 'b1', name: 'Alpha (Aggr)', isBot: true, tokens: 0, remainingTime: time, isEliminated: false, currentBid: null, isHolding: false, personality: 'aggressive',
            totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
        },
        { 
            id: 'b2', name: 'Beta (Cons)', isBot: true, tokens: 0, remainingTime: time, isEliminated: false, currentBid: null, isHolding: false, personality: 'conservative',
            totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
        },
        { 
            id: 'b3', name: 'Gamma (Rand)', isBot: true, tokens: 0, remainingTime: time, isEliminated: false, currentBid: null, isHolding: false, personality: 'random',
            totalTimeBid: 0, totalImpactGiven: 0, totalImpactReceived: 0, specialEvents: [], eventDatabasePopups: [], protocolsTriggered: [], protocolWins: [], totalDrinks: 0, socialDares: 0
        },
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
      const humanPlayers = displayPlayers.filter(p => !p.isBot);
      const readyPlayers = humanPlayers.filter(p => p.isHolding);
      const allHumansReady = humanPlayers.length > 0 && readyPlayers.length === humanPlayers.length;
      
      return (
        <div className="flex flex-col items-center justify-center h-[450px]">
          <div className="h-[100px] flex flex-col items-center justify-center space-y-2">
            <h2 className="text-3xl font-display">ROUND {multiplayerGameState?.round || 1} / {multiplayerGameState?.totalRounds || totalRounds}</h2>
            {/* Ready Progress Bar - shows when all humans are holding for 3 seconds */}
            <div className="h-6 flex items-center justify-center">
              {allHumansReady && multiplayerGameState?.allHumansHoldingStartTime ? (
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
            <AuctionButton 
              onPress={handlePress} 
              onRelease={handleRelease} 
              isPressed={currentPlayerIsHolding}
              showPulse={!currentPlayerIsHolding}
            />
          </div>
          
          <div className="h-[50px] flex flex-col items-center justify-start gap-2">
            <div className="flex gap-2">
              {humanPlayers.map(p => (
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
              {readyPlayers.length} / {humanPlayers.length} READY
            </p>
          </div>
        </div>
      );
    }
    
    // Map multiplayer phases to local phases for rendering
    const renderPhase = isMultiplayer 
      ? (effectivePhase === 'driver_selection' ? 'mp_driver_select' 
        : effectivePhase === 'round_end' ? 'round_end' 
        : effectivePhase)
      : phase;
    
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
                                title: 'HUD & SIGNAL',
                                subtitle: 'Visibility, noise, scramble',
                                items: [
                                  { id: 'DATA_BLACKOUT', label: 'DATA BLACKOUT', desc: 'Hides all timers' },
                                  { id: 'SYSTEM_FAILURE', label: 'SYSTEM FAILURE', desc: 'HUD glitches & scramble' },
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
                                  { id: 'PRIVATE_CHANNEL', label: 'PRIVATE CHANNEL', desc: 'Secret strategy chat' },
                                  { id: 'UNDERDOG_VICTORY', label: 'UNDERDOG VICTORY', desc: 'Lowest valid bid wins token (secret until end)' },
                                  { id: 'TIME_TAX', label: 'TIME TAX', desc: '-10s to everyone (can be secret until end)' },
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
                              { id: 'LOCK_ON', label: 'LOCK_ON', desc: 'Eye contact required', type: 'social' },
                              { id: 'TRUTH_DARE', label: 'TRUTH_DARE', desc: 'Truth or Dare', type: 'social' },
                              { id: 'SWITCH_SEATS', label: 'SWITCH_SEATS', desc: 'Seat swap before next round', type: 'social' },
                              { id: 'HUM_TUNE', label: 'HUM_TUNE', desc: 'Hum while bidding', type: 'social' },
                              { id: 'NOISE_CANCEL', label: 'NOISE CANCEL', desc: 'Make noise for 15s', type: 'social' },
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
              Bid time from your time bank to win tokens.<br/>
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
                  <li>Longest time wins token.</li>
                  <li>Min Bid: {gameDuration === 'short' ? '1.0s' : gameDuration === 'long' ? '4.0s' : '2.0s'}</li>
                  <li>Max Bid: Your Remaining Time.</li>
                </ul>
              </div>
              <div className="space-y-1 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-destructive font-bold text-xs sm:text-base">Winning</h3>
                  <ul className="list-disc list-inside text-[10px] sm:text-sm text-zinc-400 space-y-0.5 sm:space-y-1">
                    <li>Most tokens wins game.</li>
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
                    className="h-8 px-3 text-xs font-mono hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                    title={difficulty === 'CASUAL' ? 'CASUAL: Everyone can see time banks.' : 'COMPETITIVE: Time banks are hidden until the end.'}
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
                <div className="flex items-center gap-2" title={variant === 'BIO_FUEL' ? "Protocols: Drinking prompts + 21+ party rules that trigger between rounds." : variant === 'SOCIAL_OVERDRIVE' ? "Protocols: Party-game prompts and social rules that trigger between rounds." : "Protocols: Round modifiers that can change visibility, scramble info, or add secret twists."} data-testid="group-intro-protocols">
                  <div className="flex items-center space-x-2">
                    <Switch 
                        id="protocols-intro" 
                        checked={protocolsEnabled} 
                        onCheckedChange={setProtocolsEnabled} 
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
                <div className="flex items-center gap-2" title="Limit Breaks: Driver-specific passive powers that can trigger mid-round or post-round." data-testid="group-intro-limit-breaks">
                  <Switch 
                    id="abilities-intro" 
                    checked={abilitiesEnabled} 
                    onCheckedChange={setAbilitiesEnabled} 
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
              <div className="flex flex-col items-center gap-2">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">REALITY MODES</h3>
                 <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setVariant('STANDARD')}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'STANDARD'
                          ? 'bg-zinc-700/60 border-zinc-300 text-zinc-50'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300'
                      )}
                      title="STANDARD: Pure auction, no social or 21+ modifiers."
                      data-testid="button-intro-variant-standard"
                    >
                      STANDARD
                    </button>
                    <button
                      onClick={() => setVariant('SOCIAL_OVERDRIVE')}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'SOCIAL_OVERDRIVE'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300'
                      )}
                      title="SOCIAL OVERDRIVE: Party-game protocols + social driver abilities."
                      data-testid="button-intro-variant-social"
                    >
                      SOCIAL OVERDRIVE
                    </button>
                    <button
                      onClick={() => setVariant('BIO_FUEL')}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border',
                        variant === 'BIO_FUEL'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                          : 'bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300'
                      )}
                      title="BIO-FUEL (21+): Drinking-game prompts, toasts, and chaos. Orange = heat + hydration." 
                      data-testid="button-intro-variant-bio"
                    >
                      BIO-FUEL
                    </button>
                 </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Row 3: Game Pace */}
              <div className="flex flex-col items-center gap-2">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">GAME PACE</h3>
                 <div className="flex items-center justify-center gap-2">
                     <button 
                       onClick={() => setGameDuration('short')}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'short' 
                           ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       SPRINT (2.5m)
                     </button>
                     <button 
                       onClick={() => setGameDuration('standard')}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'standard' 
                           ? "bg-orange-400/20 border-orange-400 text-orange-400" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       TEMPO (5m)
                     </button>
                     <button 
                       onClick={() => setGameDuration('long')}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'long' 
                           ? "bg-orange-600/20 border-orange-600 text-orange-600" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       MARATHON (10m)
                     </button>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button
                size="lg"
                onClick={() => setPhase('character_select')}
                className="text-xl px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 max-w-xs"
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
                <p className="text-xs text-zinc-500">Share this code with friends to join</p>
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
                    {currentLobby.settings.abilitiesEnabled && (
                      <span className="px-2 py-1 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">
                        Limit Breaks
                      </span>
                    )}
                  </div>
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
                      <div className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        player.isReady 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-zinc-800 text-zinc-500"
                      )}>
                        {player.isReady ? "Ready" : "Not Ready"}
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
                   <p className="text-xs text-zinc-500">Host a private match for friends.</p>
                   <Button 
                     onClick={handleCreateRoom} 
                     className="w-full" 
                     disabled={!isConnected || !playerName.trim()}
                     data-testid="button-create-lobby"
                   >
                     Create New Lobby
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
                       placeholder="Enter Room Code" 
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
                  filter: (c: Character) => (c.ability?.effect === 'TIME_REFUND' || c.ability?.name === 'JAWLINE') && !['RAINBOW RUN','CHEF\'S SPECIAL'].includes(c.ability?.name || '') && c.id !== 'fine'
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
                  className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-black/40 hover:border-primary/50 transition-colors group text-center overflow-hidden"
                >
                  <div className={cn("w-24 h-24 rounded-full mb-3 group-hover:scale-110 transition-transform overflow-hidden border-2 border-white/10", char.color)}>
                     <img src={getCharImage(char)} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-white mb-1" data-testid={`text-driver-name-${char.id}`}>{char.name}</h3>
                  <p className="text-xs text-primary/80 uppercase tracking-wider mb-2 font-display" data-testid={`text-driver-title-${char.id}`}>{char.title}</p>
                  <p className="text-xs text-zinc-500 leading-tight line-clamp-2" data-testid={`text-driver-desc-${char.id}`}>{char.description}</p>
                  
                  {abilitiesEnabled && char.ability && (
                    <div className="mt-3 pt-3 border-t border-white/5 w-full">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                          <Zap size={10} fill="currentColor" /> {char.ability.name}
                       </div>
                       <p className="text-[10px] text-zinc-400 leading-tight">{char.ability.description}</p>
                    </div>
                  )}

                  {variant === 'SOCIAL_OVERDRIVE' && char.socialAbility && (
                    <div className="mt-2 pt-2 border-t border-purple-500/20 w-full bg-purple-500/5 rounded p-1">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                          <PartyPopper size={10} /> {char.socialAbility.name}
                       </div>
                       <p className="text-[10px] text-purple-300/70 leading-tight">{char.socialAbility.description}</p>
                    </div>
                  )}

                  {variant === 'BIO_FUEL' && char.bioAbility && (
                    <div className="mt-2 pt-2 border-t border-orange-500/20 w-full bg-orange-500/5 rounded p-1">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
                          <Martini size={10} /> {char.bioAbility.name}
                       </div>
                       <p className="text-[10px] text-orange-300/70 leading-tight">{char.bioAbility.description}</p>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="grid-driver-expanded">
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
            }
          });
        };
        
        const mpAllDrivers = [...CHARACTERS, ...(variant === 'SOCIAL_OVERDRIVE' ? SOCIAL_CHARACTERS : []), ...(variant === 'BIO_FUEL' ? BIO_CHARACTERS : [])];
        
        // Get variant-specific image for a character
        const getDriverImage = (char: typeof CHARACTERS[0]) => {
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
                      <div className={cn("w-16 h-16 rounded-full mb-2 overflow-hidden border-2", 
                        isSelected ? "border-primary" : "border-white/10",
                        char.color
                      )}>
                        <img src={getDriverImage(char)} alt={char.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="font-bold text-sm text-white mb-0.5">{char.name}</h3>
                      <p className="text-[10px] text-primary/80 uppercase tracking-wider">{char.title}</p>
                      
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

      case 'ready':
        return (
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
                  {players.map(p => {
                    // Visibilty Logic for Holding Dots
                    // 1. P1 always visible
                    // 2. If scrambled, show as not holding (or special state?) - User said "Display holding animation ONLY on that player"
                    // 3. If peekTargetId is active, and p is that target, show.
                    // 4. Default: Show all.
                    
                    let isVisible = true;
                    if (p.id !== 'p1') {
                         if (scrambledPlayers.includes(p.id)) isVisible = false;
                         // Wandering Eye Logic: Only visible if I AM HOLDING
                         const amIHolding = players.find(me => me.id === 'p1')?.isHolding;
                         if (!amIHolding) isVisible = false;
                    }

                    // PEEK TARGET LOGIC: If this player is the peek target, they are ALWAYS visible
                    // But if they are scrambled, we might want to show them differently?
                    // "Sadman ... green dots on 1 random player ... liked when it said holding"
                    // So if peekTargetId === p.id, we force visible, but render text instead of dot.
                    const isPeekTarget = peekTargetId === p.id;
                    
                    // Force visible if peek target
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
                  {players.filter(p => p.isHolding).length} / {players.length} READY
                </p>
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="flex flex-col items-center justify-center h-[450px]"> 
             <div className="h-[100px] flex flex-col items-center justify-center space-y-2"> 
              <h2 className="text-3xl font-display text-destructive">PREPARE TO BID</h2>
              <p className="text-muted-foreground">
                {`Release now to abandon auction (-${getTimerStart().toFixed(1)}s)`}
              </p>
            </div>
            
            <div className="h-[280px] flex items-center justify-center relative"> 
               <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
               </div>
               
               <div className="z-20 text-9xl font-display font-black text-destructive animate-ping absolute pointer-events-none">
                  {isMultiplayer ? multiplayerGameState?.countdownRemaining : countdown}
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

      case 'bidding':
        const isBlackout = activeProtocol === 'DATA_BLACKOUT' || activeProtocol === 'SYSTEM_FAILURE';
        const displayTime = isMultiplayer ? currentPlayerBid : currentTime;
        
        return (
          <div className="flex flex-col items-center justify-center h-[450px]">
             {/* Timer Area */}
             <div className="h-[100px] flex items-center justify-center mb-4">
                {isMultiplayer ? (
                  // Multiplayer: Match singleplayer - show time for first 10 seconds, then ??
                  displayTime <= 10 && !isBlackout ? (
                    <TimerDisplay time={displayTime} isRunning={true} />
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
                  <TimerDisplay time={currentTime} isRunning={true} />
                ) : (
                  <div className={cn("flex flex-col items-center justify-center p-4 rounded-lg glass-panel border-accent/20 bg-black/40 w-[320px]", isBlackout && "border-destructive/20")}>
                     <span className={cn("text-muted-foreground text-xs tracking-[0.2em] font-display mb-1", isBlackout && "text-destructive")}>
                       {isBlackout ? "SYSTEM ERROR" : "AUCTION TIME"}
                     </span>
                     <div className={cn("text-4xl font-mono text-zinc-700", isBlackout ? "text-destructive/50" : "")}>
                       {activeProtocol === 'SYSTEM_FAILURE' 
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
                        <h1 className="text-4xl font-bold text-white mb-1 leading-none">{roundWinner.name} WINS</h1>
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
                  // In competitive, show winner and penalties
                  return p.name === roundWinner.name || (p.currentBid || 0) < 0; 
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
              {!showDetails && displayPlayers.filter(p => p.currentBid !== null && p.currentBid > 0).length > (roundWinner ? 1 : 0) && (
                 <div className="text-center text-xs text-zinc-600 italic mt-2">
                   + {displayPlayers.filter(p => p.currentBid !== null && p.currentBid > 0).length - (roundWinner ? 1 : 0)} other hidden bids
                 </div>
              )}
            </div>

            {isMultiplayer ? (() => {
              const mpHumanPlayers = displayPlayers.filter(p => !p.isBot && !p.isEliminated);
              const myAck = mpHumanPlayers.find(p => p.id === myMultiplayerPlayer?.id);
              const hasAcknowledged = (myAck as any)?.roundEndAcknowledged;
              const readyCount = mpHumanPlayers.filter(p => (p as any).roundEndAcknowledged).length;
              
              return (
                <div className="space-y-2">
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
              <Button onClick={nextRound} size="lg" className="w-full bg-white text-black hover:bg-zinc-200">
                NEXT ROUND
              </Button>
            )}
            {/* Inline Overlay for Round End Phase */}
             <GameOverlay 
               overlays={overlays}
               onDismiss={removeOverlay}
               inline={true}
             />
          </motion.div>
        );

      case 'game_end':
        // Sort players by tokens (desc), then time (desc)
        const sortedPlayers = [...players].sort((a, b) => {
          if (b.tokens !== a.tokens) return b.tokens - a.tokens;
          return b.remainingTime - a.remainingTime;
        });
        const winner = sortedPlayers[0];
        const loser = sortedPlayers[sortedPlayers.length - 1];

        return (
          <div className="relative h-[550px] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 z-20 w-full pt-10 pb-4 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur">
              <h1 className="text-5xl font-display font-bold text-white">GAME OVER</h1>
            </div>

            <div className="relative z-0 flex flex-col items-center justify-start gap-8 px-0 pb-10">
              <GameOverlay overlays={overlays} onDismiss={removeOverlay} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} className={cn("p-4 rounded border bg-card/50 flex flex-col gap-2 relative overflow-hidden", p.id === loser.id ? "border-destructive/50 bg-destructive/5" : "border-white/10")}>
                     {p.id === winner.id && <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-0.5">WINNER</div>}
                     {p.id === loser.id && <div className="absolute top-0 right-0 bg-destructive text-white text-[10px] font-bold px-2 py-0.5">ELIMINATED</div>}
                     
                     <div className="flex items-center gap-2 mb-2">
                         <span className="font-bold text-xl text-zinc-500">#{i + 1}</span>
                         <span className="font-bold text-lg">{p.name}</span>
                     </div>
                   
                   <div className="grid grid-cols-3 gap-2 text-xs">
                       <div className="bg-black/20 p-2 rounded">
                           <div className="text-zinc-500">Time Left</div>
                           <div className="font-mono text-white">{formatTime(p.remainingTime)}</div>
                       </div>
                       <div className="bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                           <div className="text-emerald-400/70">Impact Given</div>
                           <div className="font-mono text-emerald-300">+{p.totalImpactGiven?.toFixed(1) || '0.0'}s</div>
                       </div>
                       <div className="bg-red-950/30 p-2 rounded border border-red-500/20">
                           <div className="text-red-400/70">Impact Taken</div>
                           <div className="font-mono text-red-300">-{p.totalImpactReceived?.toFixed(1) || '0.0'}s</div>
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                       <div className="bg-purple-950/30 p-2 rounded border border-purple-500/20" title={p.eventDatabasePopups?.join(', ') || 'None'}>
                           <div className="text-purple-400/70">Moment Flags</div>
                           <div className="font-mono text-purple-300">{p.eventDatabasePopups?.length || 0}</div>
                       </div>
                       <div className="bg-destructive/10 p-2 rounded border border-destructive/20" title={p.protocolWins?.join(', ') || 'None'}>
                           <div className="text-destructive/70">Protocol Wins</div>
                           <div className="font-mono text-destructive">{p.protocolWins?.length || 0}</div>
                       </div>
                       <div className="bg-yellow-950/30 p-2 rounded border border-yellow-500/20">
                           <div className="text-yellow-400/70">Trophies</div>
                           <div className="font-mono text-yellow-300">{p.tokens}</div>
                       </div>
                   </div>
                </div>
              ))}
            </div>

            <Button onClick={() => window.location.reload()} variant="outline" size="lg" className="mt-8">
              <RefreshCw className="mr-2 h-4 w-4" /> Play Again
            </Button>
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

      {/* Header Info */}
      <div className="mb-8 border-b border-white/5 pb-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 justify-center">
            {phase !== 'intro' && (
              <Button variant="ghost" size="icon" onClick={quitGame} className="mr-2 text-white hover:text-white hover:bg-white/10" title="Quit to Menu" data-testid="button-quit-to-menu">
                 <LogOut size={20} />
              </Button>
            )}
            <img src={logoFuturistic} alt="Logo" className="h-6 sm:h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <h1 className="font-display font-bold text-sm sm:text-xl tracking-wider">REDLINE AUCTION</h1>
            {/* Show lobby code during multiplayer game so others can join */}
            {isMultiplayer && currentLobby && phase !== 'multiplayer_lobby' && (
              <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs">
                <Users size={12} className="text-primary" />
                <span className="text-zinc-400">Room:</span>
                <span className="font-mono font-bold text-primary tracking-wider" data-testid="text-game-lobby-code">{currentLobby.code}</span>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-center">
            <div className="max-w-full px-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6">
                {variant === 'BIO_FUEL' && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-orange-950/40 border border-orange-500/30 rounded text-xs text-orange-300">
                      <AlertTriangle size={12} className="text-orange-500" />
                      <span className="font-bold tracking-widest">21+ ONLY</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-black/40 p-1.5 px-2 sm:px-3 rounded-2xl sm:rounded-full border border-white/10">
                 
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
                             : 'BIO-FUEL: Adds drinking prompts and 21+ content.'
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

                <Badge variant="outline" className="font-mono text-lg px-4 py-1 border-white/10 bg-white/5" data-testid="badge-round">
                  ROUND {round} / {totalRounds}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP LIBRARY DIALOG */}
      <Dialog open={showPopupLibrary} onOpenChange={setShowPopupLibrary}>
        <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-2xl mb-4 text-primary flex items-center gap-2">
              <CircleHelp /> MOMENT FLAGS
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Moment Flags are special in-game achievements—some are skill-based, some are chaos, and some reflect game state.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Skill-based Flags */}
            <details className="bg-black/40 rounded border border-blue-500/20">
              <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-blue-300">
                High-Skill Flags
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Consistency & Precision</span>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pt-3">
                {[ 
                  { title: "GENIUS MOVE", desc: "Win by margin < 5s.", color: "text-cyan-400 border-cyan-500/20" },
                  { title: "PRECISION STRIKE", desc: "Win with an exact integer bid (e.g. 20.0s).", color: "text-blue-400 border-blue-500/20" },
                  { title: "CLUTCH PLAY", desc: "Win with < 10s remaining in bank.", color: "text-yellow-400 border-yellow-500/20" },
                  { title: "EASY W", desc: "Win with a bid under 20s.", color: "text-green-400 border-green-500/20" },
                ].map((p, i) => (
                  <div key={i} className={`bg-black/40 p-3 rounded border ${p.color} transition-colors`}>
                    <h4 className={`font-bold text-sm mb-1 ${p.color.split(' ')[0]}`}>{p.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* Chaos & Drama Flags */}
            <details className="bg-black/40 rounded border border-purple-500/20">
              <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-purple-300">
                Chaos & Drama Flags
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Swingy, Loud Moments</span>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pt-3">
                {[ 
                  { title: "SMUG CONFIDENCE", desc: "Win Round 1 immediately.", color: "text-purple-400 border-purple-500/20" },
                  { title: "FAKE CALM", desc: "Win by margin > 15s.", color: "text-amber-400 border-amber-500/20" },
                  { title: "OVERKILL", desc: "Win with a bid over 60s.", color: "text-red-400 border-red-500/20" },
                  { title: "LAST ONE STANDING", desc: "Win the final round while at least one player was eliminated.", color: "text-blue-400 border-blue-500/20" },
                  { title: "LATE PANIC", desc: "Win starting the round with the lowest time bank.", color: "text-fuchsia-300 border-fuchsia-500/20" },
                  { title: "DEADLOCK SYNC", desc: "Exact tie for first place. No winner.", color: "text-zinc-200 border-white/20" },
                ].map((p, i) => (
                  <div key={i} className={`bg-black/40 p-3 rounded border ${p.color} transition-colors`}>
                    <h4 className={`font-bold text-sm mb-1 ${p.color.split(' ')[0]}`}>{p.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* Game State Flags */}
            <details className="bg-black/40 rounded border border-amber-500/20">
              <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between text-sm font-semibold text-amber-300">
                Game State Flags
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Elims & Edge Cases</span>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pt-3">
                {[ 
                  { title: "COMEBACK HOPE", desc: "Win while having the least tokens.", color: "text-emerald-400 border-emerald-500/20" },
                  { title: "PLAYER ELIMINATED", desc: "Player runs out of time.", color: "text-destructive border-destructive/20" },
                  { title: "AFK", desc: "No one bids or everyone abandons.", color: "text-yellow-200 border-yellow-200/20" },
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
                  {[0,1,2,3].map((i) => (
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
              When PROTOCOLS are enabled, random events may trigger at the start of a round.
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
                <div className="text-[10px] uppercase tracking-widest text-red-300/70">11 protocols</div>
              </summary>

              <div className="px-4 pb-4 space-y-3">
                {[ 
                  {
                    id: 'db_standard_hud',
                    title: 'HUD & SIGNAL',
                    subtitle: 'Visibility, noise, scramble',
                    items: [
                      { name: "DATA BLACKOUT", desc: "All timers and clocks are hidden from the HUD.", type: "Visual" },
                      { name: "SYSTEM FAILURE", desc: "HUD glitches and timers display random scrambled numbers.", type: "Visual" },
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
                      { name: "THE MOLE", desc: "A hidden role is assigned. The Mole wants to push time higher while avoiding 1st place. If the Mole wins by MORE than 7.0s, they lose a trophy.", type: "Hidden Role" },
                      { name: "PRIVATE CHANNEL", desc: "Two players are selected to privately coordinate strategy.", type: "Social" },
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
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                    {typeof selectedPlayerStats?.characterIcon === 'string' ? (
                        <img src={selectedPlayerStats.characterIcon} alt={selectedPlayerStats?.name} className="w-full h-full object-cover" />
                    ) : (
                        <User />
                    )}
                </div>
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
                            <div className={cn("text-xl font-mono text-white", difficulty === 'COMPETITIVE' && !selectedPlayerStats?.isBot && selectedPlayerStats?.id !== 'p1' && "blur-sm select-none")}>
                                {(() => {
                                    const isSelfSadman = selectedPlayerStats?.id === 'p1' && selectedCharacter?.id === 'pepe';
                                    const isScrambledOpponent = selectedCharacter?.id === 'bf' && selectedPlayerStats?.id !== 'p1' && selectedPlayerStats?.id !== peekTargetId;
                                    
                                    if (isSelfSadman || isScrambledOpponent) {
                                        return `${Math.floor(Math.random()*99)}:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*9)}`;
                                    }
                                    return selectedPlayerStats?.remainingTime ? formatTime(selectedPlayerStats.remainingTime) : "00:00.0";
                                })()}
                            </div>
                        </div>
                        <div className="bg-black/30 p-3 rounded">
                            <div className="text-[10px] text-zinc-500 uppercase">Impact Given</div>
                            <div className="text-sm font-mono text-zinc-300">{selectedPlayerStats?.totalImpactGiven?.toFixed(1)}s</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded">
                            <div className="text-[10px] text-zinc-500 uppercase">Impact Taken</div>
                            <div className="text-sm font-mono text-zinc-300">-{selectedPlayerStats?.totalImpactReceived?.toFixed(1) || '0.0'}s</div>
                        </div>
                    </div>
                )}
                 {selectedPlayerStats?.remainingTime === -1 && (
                    <div className="bg-black/30 p-3 rounded flex items-center justify-center text-zinc-500 text-xs italic">
                        STATS HIDDEN IN COMPETITIVE MODE
                    </div>
                 )}
            </div>
        </DialogContent>
      </Dialog>

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
            {displayPlayers.map((p, idx) => (
              <PlayerStats 
                key={p.id} 
                player={p} 
                isCurrentPlayer={isMultiplayer 
                  ? (multiplayerGameState?.players.find(mp => mp.socketId === socket?.id)?.id === p.id)
                  : p.id === 'p1'} 
                showTime={showDetails || phase === 'game_end' || p.isEliminated || isMultiplayer} 
                // Show time if: Easy Mode OR Game Over OR Player Eliminated OR Multiplayer
                remainingTime={p.remainingTime}
                formatTime={formatTime}
                peekActive={(selectedCharacter?.id === 'pepe' || selectedCharacter?.id === 'bf') && peekTargetId === p.id}
                isDoubleTokens={isDoubleTokens}
                isSystemFailure={activeProtocol === 'SYSTEM_FAILURE' || (p.id === 'p1' && selectedCharacter?.id === 'pepe')}
                isScrambled={!isMultiplayer && ((p.id !== 'p1' && selectedCharacter?.id === 'bf' && p.id !== peekTargetId) || scrambledPlayers.includes(p.id))}
                // Hide details if competitive mode (ALWAYS, unless game end)
                onClick={() => {
                    if (difficulty === 'COMPETITIVE' && phase !== 'game_end' && !isMultiplayer) {
                         // Mask all stats
                         setSelectedPlayerStats({...p, remainingTime: -1, tokens: -1, totalImpactGiven: -1}); 
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
            ))}
          </div>

          <Separator className="bg-white/10 my-6" />

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
                // Get logs with type information for filtering
                const mpLogs = isMultiplayer && multiplayerGameState?.gameLog 
                  ? multiplayerGameState.gameLog : [];
                const spLogs = !isMultiplayer ? roundLog : [];
                
                // Filter logs: show only important ones unless showAllLogs is true
                // Basic mode shows: wins, eliminations, protocols, abilities - not individual bids
                let logs: string[] = [];
                if (isMultiplayer && mpLogs.length > 0) {
                  const filtered = showAllLogs ? mpLogs : mpLogs.filter(log => 
                    log.type === 'win' || log.type === 'elimination' || 
                    log.type === 'protocol' || log.type === 'ability'
                  );
                  logs = filtered.map(l => l.message);
                } else {
                  logs = showAllLogs ? spLogs : spLogs.filter(log => {
                    const upper = log.toUpperCase();
                    return log.includes('>>') || upper.includes('ROUND') || upper.includes('WON') || 
                           upper.includes('WINNER') || upper.includes('PROTOCOL') || 
                           upper.includes('ELIMINATED') || upper.includes('TOKEN');
                  });
                }
                if (logs.length === 0) return <p className="italic opacity-50">Game started...</p>;
                return logs.map((log, i) => (
                  <div key={i} className="border-b border-white/5 pb-1 mb-1 last:border-0">{log}</div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
