import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast"; // Added toast hook
import { GameLayout } from "@/components/game/GameLayout";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { AuctionButton } from "@/components/game/AuctionButton";
import { PlayerStats } from "@/components/game/PlayerStats";
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
  Users, Globe, Lock, BookOpen, CircleHelp, Martini, PartyPopper, Skull, Info
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

type GamePhase = 'intro' | 'multiplayer_lobby' | 'character_select' | 'ready' | 'countdown' | 'bidding' | 'round_end' | 'game_end';
type BotPersonality = 'balanced' | 'aggressive' | 'conservative' | 'random';
type GameDuration = 'standard' | 'long' | 'short';
// NEW PROTOCOL TYPES
    type SocialProtocol = 'TRUTH_DARE' | 'SWITCH_SEATS' | 'GROUP_SELFIE' | 'HUM_TUNE';
type BioProtocol = 'HYDRATE' | 'BOTTOMS_UP' | 'PARTNER_DRINK' | 'WATER_ROUND';

// Extended Protocol Type
type ProtocolType = 
  | 'DATA_BLACKOUT' | 'DOUBLE_STAKES' | 'SYSTEM_FAILURE' 
  | 'OPEN_HAND' | 'NOISE_CANCEL' | 'MUTE_PROTOCOL' 
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
    id: 'prom_king', name: 'Prom King', title: 'The Crowned', image: charPromKing, description: 'Royalty of the moment.', color: 'text-purple-500',
    ability: { name: 'SPOTLIGHT', description: 'If you win, everyone else cheers (no effect, just vibes).', effect: 'TOKEN_BOOST' },
    socialAbility: { name: 'PROM COURT', description: '1 random round: Make a rule for remainder of game.' },
    bioAbility: { name: 'CORONATION', description: 'Initiate a group toast. Everyone drinks.' }
  },
  {
    id: 'idol_core', name: 'Idol Core', title: 'The Star', image: charIdolCore, description: 'Stage presence and perfect timing.', color: 'text-pink-500',
    ability: { name: 'COUNT IT IN', description: 'When you say "count it in", next person to talk must say "5678" or drop their button.', effect: 'PEEK' },
    socialAbility: { name: 'FANCAM', description: '10% chance: 1 random player shows hidden talent at start of round or drops button.' },
    bioAbility: { name: 'DEBUT', description: 'Take a drink to reveal a "secret" (see an opponent\'s bid).' }
  }
];

import charDangerZone from '@assets/generated_images/edgy_cyberpunk_femme_fatale.png';
import charMonkeyHaircut from '@assets/generated_images/cool_monkey_haircut_chef_background.png';
import charIdolCore from '@assets/generated_images/glamorous_kpop_idol_star.png';
import charPromKing from '@assets/generated_images/cool_cyberpunk_prom_king.png';
import charRockShush from '@assets/generated_images/cute_rock_with_shush_gesture.png';
import charRollSafe from '@assets/generated_images/roll_safe_black_character.png';

// ... (Existing Characters)

// NEW CHARACTERS (BIO-FUEL MODE)
const BIO_CHARACTERS: Character[] = [
  { 
    id: 'tank', name: 'The Tank', title: 'Iron Liver', image: charRockShush, description: 'Solid as a rock. Literally.', color: 'text-green-600',
    ability: { name: 'IRON STOMACH', description: 'Immune to "Drink" penalties (Lore only).', effect: 'TIME_REFUND' },
    socialAbility: { name: 'PEOPLE\'S ELBOW', description: 'Challenge someone to a thumb war for 0.5s.' },
    bioAbility: { name: 'ABSORB', description: 'Take a big sip to cancel out any drinking prompt.' }
  },
  {
    id: 'danger_zone', name: 'Danger Zone', title: 'Club Queen', image: charDangerZone, description: 'Works the pole, takes your soul.', color: 'text-pink-600',
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
    id: 'harambe', name: 'Guardian H', title: 'The Eternal Watcher', image: charHarambe, description: 'Stoic protection against bad bids.', color: 'text-zinc-400',
    ability: { name: 'SPIRIT SHIELD', description: 'Limit Break: +11s if you win Round 1.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'VIBE GUARD', description: 'Shown at prepare-to-bid: Designate a player immune to social dares this round.' },
    bioAbility: { name: 'LIQUID AUTHORIZATION', description: 'At round end: Tell others they cannot release button until you finish a sip.' }
  },
  { 
    id: 'popcat', name: 'Click-Click', title: 'The Glitch', image: charPopcat, description: 'Hyperactive timing precision.', color: 'text-pink-400',
    ability: { name: 'HYPER CLICK', description: 'Gain +1 token if you win within 1.1s of 2nd place.', effect: 'TOKEN_BOOST' },
    socialAbility: { name: 'MISCLICK', description: '25% chance: 1 player must hold bid without using hands (only they and you are notified).' },
    bioAbility: { name: 'MOUTH POP', description: '1 random round: Everyone sips when Click-Click opens and closes mouth IRL.' }
  },
  { 
    id: 'winter', name: 'Frostbyte', title: 'The Disciplined', image: charWinter, description: 'Cold, calculated efficiency.', color: 'text-cyan-400',
    ability: { name: 'CYRO FREEZE', description: 'Refund 1.0s regardless of outcome.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'COLD SHOULDER', description: '25% chance: Ignore all social interactions (only you see this at prepare-to-bid).' },
    bioAbility: { name: 'BRAIN FREEZE', description: '1 random round: Force opponent to win or drink (only you and target notified).' }
  },
  { 
    id: 'pepe', name: 'Sadman Logic', title: 'The Analyst', image: charPepe, description: 'Feels bad, plays smart.', color: 'text-green-500',
    ability: { name: 'SAD REVEAL', description: 'See 1 opponent holding per round. Your time bank is permanently scrambled.', effect: 'PEEK' },
    socialAbility: { name: 'SAD STORY', description: '5% chance after round: 1 random player shares a sad story (shown to that player only).' },
    bioAbility: { name: 'DRINKING PARTNER', description: 'Every round you are notified you can change your drinking buddy.' }
  },
  { 
    id: 'nyan', name: 'Rainbow Dash', title: 'The Speeder', image: charNyan, description: 'Neon trails and fast reactions.', color: 'text-purple-400',
    ability: { name: 'RAINBOW RUN', description: 'Get 3.5s refund if you bid > 40s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'SUGAR RUSH', description: '15% chance: 1 random opponent must speak 2x speed (shown at start of round).' },
    bioAbility: { name: 'RAINBOW SHOT', description: '10% chance: 1 random player mixes two drinks (shown at end of round).' }
  },
  { 
    id: 'karen', name: 'The Accuser', title: 'The Aggressor', image: charKaren, description: 'Loud and disruptive tactics.', color: 'text-red-400',
    ability: { name: 'MANAGER CALL', description: 'Remove 2s from random opponent every round.', effect: 'DISRUPT' },
    socialAbility: { name: 'COMPLAINT', description: '15% chance: Everyone votes on winner\'s punishment (shown to all at end of round).' },
    bioAbility: { name: 'SPILL HAZARD', description: '25% chance: Accuse someone of spilling; they drink (shown to driver post-round).' }
  },
  { 
    id: 'fine', name: 'Low Flame', title: 'The Survivor', image: charFine, description: 'Perfectly chill in chaos.', color: 'text-orange-500',
    ability: { name: 'FIRE WALL', description: 'Immune to ALL protocols.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'HOT SEAT', description: '25% chance: Choose a player to answer a truth (shown to driver after round).' },
    bioAbility: { name: 'ON FIRE', description: 'When you win, everyone else drinks (shown to all after your winning round).' }
  },
  { 
    id: 'bf', name: 'Wandering Eye', title: 'The Opportunist', image: charBf, description: 'Always looking for a better deal.', color: 'text-blue-400',
    ability: { name: 'SNEAK PEEK', description: 'See 1 random player holding. All other banks scrambled.', effect: 'PEEK' },
    socialAbility: { name: 'DISTRACTION', description: '35% chance at start: Point at something; anyone who looks must drop buzzer (shown to driver).' },
    bioAbility: { name: 'THE EX', description: '10% chance: 1 random player toasts to an ex (shown to them at end of round).' }
  },
  { 
    id: 'rat', name: 'The Rind', title: 'The Time Thief', image: charRat, description: 'Sneaky tactics and stolen seconds.', color: 'text-gray-500',
    ability: { name: 'CHEESE TAX', description: 'Steal 2s from winner if you lose.', effect: 'DISRUPT' },
    socialAbility: { name: 'SNITCH', description: '5% chance: 1 random player must reveal someone\'s tell (shown to them after round).' },
    bioAbility: { name: 'SCAVENGE', description: '5% chance: 1 random player finishes someone else\'s drink (shown to them after round).' }
  },
  { 
    id: 'baldwin', name: 'The Anointed', title: 'The Royal', image: charBaldwin, description: 'Silent authority and iron will.', color: 'text-blue-500',
    ability: { name: 'ROYAL DECREE', description: 'Get 4s refund if you bid within 0.1s of exactly 20s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'COMMAND SILENCE', description: '50% chance: Everyone is commanded silence at start of round.' },
    bioAbility: { name: 'ROYAL CUP', description: '1 random round at end: Make a rule for remainder of game.' }
  },
  { 
    id: 'sigma', name: 'Executive P', title: 'The Psycho', image: charSigma, description: 'Impeccable taste, dangerous mind.', color: 'text-red-500',
    ability: { name: 'AXE SWING', description: 'Remove 2s from non-eliminated opponent with most time.', effect: 'DISRUPT' },
    socialAbility: { name: 'CC\'D', description: '20% chance: 1 random player must copy your actions next round (both notified at end).' },
    bioAbility: { name: 'REASSIGNED', description: '50% chance: Choose 1 player to take a drink (shown to driver at end of round).' }
  },
  { 
    id: 'gigachad', name: 'Alpha Prime', title: 'The Perfect', image: charGigachad, description: 'Peak performance in every bid.', color: 'text-zinc-300',
    ability: { name: 'JAWLINE', description: 'Can drop during countdown without penalty.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'MOG', description: '20% chance: 1 random player must drop if they lose stare challenge (both notified at start).' },
    bioAbility: { name: 'PACE SETTER', description: 'Every 3 rounds, start a game of waterfall (shown post-round).' }
  },
  { 
    id: 'thinker', name: 'Roll Safe', title: 'The Consultant', image: charThinker, description: 'Modern solutions for modern bids.', color: 'text-indigo-400',
    ability: { name: 'CALCULATED', description: 'Cannot be impacted by Limit Break abilities.', effect: 'PEEK' },
    socialAbility: { name: 'TECHNICALLY', description: 'You are the decision maker for disputes and unclear rules all game.' },
    bioAbility: { name: 'BIG BRAIN', description: '15% chance at end of round: Option to have everyone pass drink to the left.' }
  },
  { 
    id: 'disaster', name: 'Hotwired', title: 'The Anarchist', image: charDisaster, description: 'Watches the market burn with a smile.', color: 'text-orange-600',
    ability: { name: 'BURN IT', description: 'Remove 1s from everyone else.', effect: 'DISRUPT' },
    socialAbility: { name: 'VIRAL MOMENT', description: '1 random round: Re-enact a meme. Best performance wins.' },
    bioAbility: { name: 'SPICY', description: '20% chance post-round: Everyone drinks (all notified).' }
  },
  { 
    id: 'buttons', name: 'Panic Bot', title: 'The Indecisive', image: charButtons, description: 'Always sweating the big decisions.', color: 'text-red-400',
    ability: { name: 'PANIC MASH', description: '50% chance +3s refund, 50% -3s penalty.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'SWEATING', description: 'Wipe brow. If anyone mimics, they drop button.' },
    bioAbility: { name: 'EMERGENCY MEETING', description: '25% chance: Everyone points at person to gang up on next round for drinking.' }
  },
  { 
    id: 'primate', name: 'Primate Prime', title: 'The Chef', image: charMonkeyHaircut, description: 'Trust the process. He\'s cooking.', color: 'text-amber-600',
    ability: { name: 'CHEF\'S SPECIAL', description: 'Get 4s refund on wins > 10s over second place.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'FRESH CUT', description: '10% chance post-round: 1 random player must compliment everyone.' },
    bioAbility: { name: 'GREEDY GRAB', description: '5% chance post-round: Previous winner must burn 40s next round or finish drink.' }
  },
  { 
    id: 'harold', name: 'Pain Hider', title: 'The Stoic', image: charHarold, description: 'Smiling through the bear market.', color: 'text-slate-400',
    ability: { name: 'HIDE PAIN', description: 'Get 3s refund if you lose by > 15s.', effect: 'TIME_REFUND' },
    socialAbility: { name: 'BOOMER', description: 'You forgot what your power was (never triggers).' },
    bioAbility: { name: 'SUPPRESS', description: 'If anyone reacts to their drink, they drink again.' }
  },
];

// New Types for Refactored Game Modes
type GameDifficulty = 'COMPETITIVE' | 'CASUAL';
type GameVariant = 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL';

// ... (Existing types)

export default function Game() {
  const { toast } = useToast();
  // Game State
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('COMPETITIVE');
  const [variant, setVariant] = useState<GameVariant>('STANDARD');
  
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
  const [allowedProtocols, setAllowedProtocols] = useState<ProtocolType[]>([
        'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
        'OPEN_HAND', 'NOISE_CANCEL', 'MUTE_PROTOCOL', 
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
      const id = Math.random().toString(36).substring(7);
      setOverlays(prev => [...prev, { id, type, message, subMessage, duration }]);
      
      // Auto dismiss if desired (0 = manual dismiss)
      if (duration > 0) {
          setTimeout(() => {
              setOverlays(prev => prev.filter(o => o.id !== id));
          }, duration);
      }
  };

  const removeOverlay = (id: string) => {
      setOverlays(prev => prev.filter(o => o.id !== id));
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
            const socialProtocols: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'GROUP_SELFIE', 'HUM_TUNE'];
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
            const socialProtocols: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'GROUP_SELFIE', 'HUM_TUNE'];
            const bioProtocols: ProtocolType[] = ['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
            // Remove social protocols, add bio protocols
            const withoutSocial = prev.filter(p => !socialProtocols.includes(p));
            const toAdd = bioProtocols.filter(p => !withoutSocial.includes(p));
            return [...withoutSocial, ...toAdd];
        });
    } else {
        // Standard mode - remove mode-specific protocols
        setAllowedProtocols(prev => {
            const modeSpecific: ProtocolType[] = ['TRUTH_DARE', 'SWITCH_SEATS', 'GROUP_SELFIE', 'HUM_TUNE', 'HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
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

  // Refs for loop management
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const readyStartTimeRef = useRef<number | null>(null);
  const overLimitToastShownRef = useRef(false);

  // Multiplayer State
  const [lobbyCode, setLobbyCode] = useState("");

  // Helper for formatting time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

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
                             tokens: Math.max(0, p.tokens - 1), 
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
                description: "You held longer than your remaining time! Eliminated & Lost Trophy.",
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

      setPlayers(prev => prev.map(p => {
        if (p.isBot) {
          const char = shuffledChars[charIndex % shuffledChars.length];
          charIndex++;
          
          return { 
            ...p, 
            name: char.name, 
            characterIcon: char.image,
            // Bots also get abilities if enabled, but we just store the icon/name for now
          };
        }
        return p;
      }));
  };

  useEffect(() => {
    if (phase === 'ready') {
      const newBotBids: Record<string, number> = {};
      players.forEach(p => {
        if (p.isBot) {
          const maxBid = p.remainingTime;
          let bid = 0;

          // Personality-based Randomness
          switch (p.personality) {
            case 'aggressive':
              // Likes to bid high (20s - 60s), sometimes low to trick
              if (Math.random() > 0.3) {
                 bid = 20 + Math.random() * 40; 
              } else {
                 bid = Math.random() * 10;
              }
              break;
            
            case 'conservative':
              // Likes to save time, bids low (1s - 15s)
              bid = 1 + Math.random() * 14;
              break;

            case 'random':
            default:
              // Pure chaos
              bid = Math.random() * 40 + 1;
              break;
          }

          // Random fuzzy factor so they don't hit exact integers often
          bid += Math.random(); 

          // Hard cap at max time
          if (bid > maxBid) bid = maxBid;
          
          // Ensure at least 0.1s
          if (bid < 0.1) bid = 0.1;

          newBotBids[p.id] = parseFloat(bid.toFixed(1));
        }
      });
      setBotBids(newBotBids);
    }
  }, [phase]);

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


  // User Interactions
  const handlePress = () => {
    if (phase === 'ready') {
       setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: true } : p));
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

  const handleRelease = () => {
    if (phase === 'ready') {
      setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: false } : p));
    } else if (phase === 'bidding') {
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
       // If releasing during countdown, store penalty to apply at round end
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

  // Start Round Logic
  const startCountdown = () => {
    // Check for Protocol Trigger 
    if (protocolsEnabled && Math.random() > 0.65) {
      
      // Build Protocol Pool
      let protocolPool = [...allowedProtocols];
      
      if (variant === 'SOCIAL_OVERDRIVE') {
          protocolPool = [...protocolPool, 'TRUTH_DARE', 'SWITCH_SEATS', 'HUM_TUNE', 'LOCK_ON'];
      }
      if (variant === 'BIO_FUEL') {
          protocolPool = [...protocolPool, 'HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'];
      }
      
      // Filter out nulls
      protocolPool = protocolPool.filter(p => p !== null);

      if (protocolPool.length === 0) return;

      // Equal Chance Logic (Unweighted)
      const finalPool = protocolPool;

      const newProtocol = finalPool[Math.floor(Math.random() * finalPool.length)];
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
        case 'NOISE_CANCEL': msg = "NOISE CANCEL"; sub = `${getRandomPlayer()} must make noise for 15s!`; break;
        case 'MUTE_PROTOCOL': msg = "SILENCE ENFORCED"; sub = "All players must remain silent!"; break;
        case 'PRIVATE_CHANNEL': 
            const [p1, p2] = getTwoRandomPlayers();
            msg = "PRIVATE CHANNEL"; sub = `${p1} & ${p2} discuss strategy now!`; 
            break;
        case 'NO_LOOK': msg = "BLIND BIDDING"; sub = "Do not look at screens until drop!"; break;
        case 'LOCK_ON':
            // Moved to Social only pool logic, but if triggered here fallback
            const [l1, l2] = getTwoRandomPlayers();
            msg = "LOCK ON"; sub = `${l1} & ${l2} must maintain eye contact!`;
            break;
        case 'THE_MOLE':
          const target = Math.random() > 0.5 ? 'YOU' : getRandomPlayer();
          const targetId = target === 'YOU' ? 'p1' : players.find(p => p.name === target)?.id || null;
          setMoleTarget(targetId);
          msg = "THE MOLE";
          sub = target === 'YOU' ? "YOU are the Mole! Lose secretly." : "A Mole is active..."; 
          break;
        case 'PANIC_ROOM': msg = "PANIC ROOM"; sub = "Time 2x Speed | Double Win Tokens"; break;
        case 'UNDERDOG_VICTORY': showPopup = false; break; // Secret
        case 'TIME_TAX': showPopup = false; break; // Secret
        
        // ... SOCIAL PROTOCOLS ...
        // Some show up at end of round - HIDDEN START OF ROUND per user request
        case 'TRUTH_DARE': showPopup = false; break;
        case 'SWITCH_SEATS': showPopup = false; break;
        case 'HUM_TUNE': msg = "AUDIO SYNC"; sub = `${getRandomPlayer()} must hum a song (others guess)!`; break;
        
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
      const targetProtocols = ['THE_MOLE', 'PRIVATE_CHANNEL', 'OPEN_HAND', 'NOISE_CANCEL', 'LOCK_ON', 'PARTNER_DRINK', 'HUM_TUNE', 'UNDERDOG_VICTORY', 'TIME_TAX'];

      if (newProtocol && targetProtocols.includes(newProtocol)) {
         showPopup = false;
         if (newProtocol === 'THE_MOLE') {
             if (moleTarget === 'p1') showPopup = true;
         } else if (sub.includes('YOU') || sub.includes(players.find(p => p.id === 'p1')?.name || 'YOU')) {
             showPopup = true;
         }
      }

      if (showPopup) {
         if (['TRUTH_DARE', 'SWITCH_SEATS', 'GROUP_SELFIE', 'HUM_TUNE', 'LOCK_ON'].includes(activeProtocol || '')) {
             addOverlay("social_event", msg, sub);
         } else if (['HYDRATE', 'BOTTOMS_UP', 'PARTNER_DRINK', 'WATER_ROUND'].includes(activeProtocol || '')) {
             addOverlay("bio_event", msg, sub);
         } else {
             addOverlay("protocol_alert", msg, sub);
         }
      } else {
         addOverlay("protocol_alert", "SECRET PROTOCOL", "A hidden protocol is active...");
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
    
    // 2. CALCULATE PRELIMINARY TIME & ELIMINATION (Pre-Winner)
    
    // First, identify Roll Safe (Thinker) if present - immune to all abilities
    const rollSafeId = players.find(p => p.name === 'Roll Safe' || p.name === 'The Consultant' || (p.isBot && [...CHARACTERS].find(c => c.name === p.name)?.id === 'thinker') || (!p.isBot && selectedCharacter?.id === 'thinker'))?.id;

    const disruptEffects: { targetId: string, amount: number, source: string, ability: string }[] = [];
    let playersOut: string[] = [];
    
    if (abilitiesEnabled) {
        players.forEach(sourcePlayer => {
            if (sourcePlayer.isEliminated || sourcePlayer.remainingTime <= 0) return; // Eliminated players cannot attack
            
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
                    if (ab.name === 'RAINBOW RUN' && (p.currentBid || 0) > 40) refund = 3.5;
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
             newTokens -= 2; 
             impact += " -1 Token (Mole Win)";
             impactLogs.push({ value: "-1 Token", reason: "Mole Win", type: 'loss' });
             extraLogs.push(`>> MOLE FAILURE: ${p.name} won and LOST a trophy!`);
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
    if (winnerId) {
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
         
         setPhase('game_end'); // Skip round_end summary, go straight to game over
         setOverlay({ type: "game_over", message: "GAME OVER" });
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
            // ROLL SAFE: "BIG BRAIN" (15% chance)
            else if (bName === 'BIG BRAIN' && roll < 0.15) {
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
            // FROSTBYTE: "COLD SHOULDER" (25% chance)
            else if (sName === 'COLD SHOULDER' && roll < 0.25) {
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
            // ALPHA PRIME: "MOG" (20% chance)
            else if (sName === 'MOG' && roll < 0.2) {
                 triggered = true; abilityName = sName; abilityDesc = "Stare challenge!";
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
    let overlayType: OverlayType = null;
    let overlayMsg = "";
    let overlaySub = "";

    if (playersOut.length > 0) {
      overlayType = "time_out";
      overlayMsg = "PLAYER ELIMINATED";
      overlaySub = "Out of time!";
    } else if (winnerId) {
       const winnerPlayer = participants[0]; // winner is first
       const secondPlayer = participants.length > 1 ? participants[1] : null;
       const winnerBid = winnerPlayer.currentBid || 0;
       const secondBid = secondPlayer?.currentBid || 0;
       const margin = winnerBid - secondBid;

       // 1. Smug Confidence (Round 1 Win) - Title Changed Back
       if (round === 1 && winnerId === 'p1') {
         overlayType = "smug_confidence";
         overlayMsg = "SMUG CONFIDENCE";
         overlaySub = `${winnerName} starts strong!`;
       }
       // 2. Fake Calm (Margin >= 15s)
       else if (secondPlayer && margin >= 15 && winnerId === 'p1') {
         overlayType = "fake_calm";
         overlayMsg = "FAKE CALM";
         overlaySub = `Won by ${margin.toFixed(1)}s!`;
       }
       // 3. Genius Move (Margin <= 5s)
       else if (secondPlayer && margin <= 5 && winnerId === 'p1') {
         overlayType = "genius_move";
         overlayMsg = "GENIUS MOVE";
         overlaySub = `Won by just ${margin.toFixed(1)}s`;
       }
       // 4. Easy W (Bid < 20s)
       else if (winnerBid < 20 && winnerId === 'p1') {
         overlayType = "easy_w";
         overlayMsg = "EASY W";
         overlaySub = `Won with only ${winnerBid.toFixed(1)}s`;
       }
       // 5. Comeback Hope (Winner was last in tokens before this win)
       else {
         const winnerTokensBefore = players.find(p => p.id === winnerId)?.tokens || 0;
         const minTokens = Math.min(...players.map(p => p.tokens));
         if (winnerTokensBefore === minTokens && players.some(p => p.tokens > winnerTokensBefore) && winnerId === 'p1') {
           overlayType = "comeback_hope";
           overlayMsg = "COMEBACK HOPE";
           overlaySub = `${winnerName} stays in the fight!`;
         } else if (winnerId === 'p1') {
           // New Event 1: Precision
           if (winnerBid % 1 === 0) {
               overlayType = "precision_strike";
               overlayMsg = "PRECISION STRIKE";
               overlaySub = "Exact second bid!";
           }
           // New Event: Calculated (Handled below, but check priority)
           // New Event 2: Overkill (More tokens than time needed?)
           else if (winnerBid > 60) {
               overlayType = "overkill";
               overlayMsg = "OVERKILL";
               overlaySub = "Massive bid!";
           }
           // New Event 3: Clutch (Less than 10s remaining after bid)
           else if (winnerPlayer.remainingTime < 10) {
               overlayType = "clutch_play";
               overlayMsg = "CLUTCH PLAY";
               overlaySub = "Almost out of time!";
           }
           else {
             overlayType = null;
           }
         } else {
           overlayType = null;
         }
       }

    } else {
       // No winner
       overlayType = "round_draw";
       overlayMsg = "NO WINNER";
       overlaySub = "Tie or No Bids";
    }

    if (!winnerId && participants.length === 0) {
       // Everyone zero bid / abandoned?
       overlayType = "zero_bid";
       overlayMsg = "AFK";
       overlaySub = "No one dared to bid!";
    }

    // Protocol Post-Round Popups
    if (activeProtocol === 'TRUTH_DARE' || activeProtocol === 'SWITCH_SEATS' || activeProtocol === 'GROUP_SELFIE') {
        // Override overlay to show protocol requirement
        let msg = "";
        let sub = "";
        if (activeProtocol === 'TRUTH_DARE') { msg = "TRUTH OR DARE"; sub = "Winner: Ask. Loser: Do."; }
        if (activeProtocol === 'SWITCH_SEATS') { msg = "SEAT SWAP"; sub = "Everyone move left!"; }
        if (activeProtocol === 'GROUP_SELFIE') { msg = "GROUP SELFIE"; sub = "Smile!"; }
        
        // Priority over win popup
        overlayType = "protocol_alert";
        overlayMsg = msg;
        overlaySub = sub;
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
             overlayType = "clutch_play"; // Reuse clutch_play color/icon or add new one? User didn't specify color.
             // Wait, overlayType "clutch_play" is yellow hourglass. "CALCULATED" was blue zap. 
             // "LAST ONE STANDING" sounds like a clutch/survival moment.
             // Let's use "clutch_play" (Yellow) or reuse the "ability_trigger" (Blue)?
             // The old "calculated" used overlayType="calculated" which wasn't in definition list but was handled?
             // Ah, previous edit I missed adding "calculated" to GameOverlay types in the Read result, 
             // but I saw it in the edit block I sent.
             // Actually, I should probably add "last_one_standing" to GameOverlay.tsx if I want a specific icon.
             // For now, let's reuse "clutch_play" which fits "Last One Standing".
             
             // Or better, let's stick to the BLUE theme of Calculated since I'm replacing it.
             overlayType = "genius_move"; // Blue Badge Check
             overlayMsg = "LAST ONE STANDING";
             overlaySub = `Survivor Victory! (${playersOut.length} eliminated)`;
         }
    }

    // BIO-FUEL Logic: Add drink prompt if applicable
    if (variant === 'BIO_FUEL' && (overlayType === 'time_out')) {
        if (overlayType === 'time_out') {
             // Stack Bio Event for time out
             addOverlay("bio_event", "ELIMINATED! CONSUME BIO-FUEL.", "", 0);
        }
    }

    if (overlayType) {
        addOverlay(overlayType, overlayMsg, overlaySub, 0);
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
        extraLogs.push(`>> MOLE PENALTY: ${winnerName} lost 1 Token!`);
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
        setPhase('game_end');
        setOverlay({ type: "game_over", message: "GAME OVER" });
      }, 3000);
    }
  };

  const nextRound = () => {
    // Check if all players are eliminated
    const activePlayers = players.filter(p => !p.isEliminated && p.remainingTime > 0);
    
    if (activePlayers.length <= 1 || round >= totalRounds) {
      // End game immediately if only 1 or 0 players remain
      setPhase('game_end');
      setOverlay({ type: "game_over", message: "GAME OVER" });
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
    
    setPlayers(prev => prev.map(p => {
      if (p.id === 'p1') {
        return { ...p, name: char.name, characterIcon: char.image };
      }
      return p;
    }));
    setPhase('ready');
  };

  const playerIsReady = players.find(p => p.id === 'p1')?.isHolding;
  const playerBid = players.find(p => p.id === 'p1')?.currentBid ?? null;
  const allPlayersReady = players.every(p => p.isHolding);

  // New logic for 'waiting' state
  const isWaiting = phase === 'bidding' && playerBid !== null && playerBid > 0;

  // Multiplayer handlers (mock)
  const handleCreateRoom = () => {
    // In real app, this would call backend to create room
    // For mockup, we just pretend and go to char select
    setPhase('character_select');
  };
  
  const handleJoinRoom = () => {
    if (lobbyCode.length > 0) {
      setPhase('character_select');
    }
  };

  const quitGame = () => {
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
    switch (phase) {
      case 'intro':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-8 text-center max-w-2xl mx-auto mt-20"
          >
            {/* Protocol Selection Dialog */}
            <Dialog open={showProtocolSelect} onOpenChange={setShowProtocolSelect}>
                <DialogContent className="bg-zinc-950 border-white/10 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-destructive font-display tracking-widest">PROTOCOL CONFIGURATION</DialogTitle>
                        <DialogDescription>
                            Select allowed protocols for this session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* SYSTEM PROTOCOLS */}
                        <div className="md:col-span-2 mt-4 mb-2">
                             <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/10 pb-1">SYSTEM PROTOCOLS</h4>
                        </div>
                        {[
                            { id: 'DATA_BLACKOUT', label: 'DATA BLACKOUT', desc: 'Hides all timers' },
                            { id: 'DOUBLE_STAKES', label: 'HIGH STAKES', desc: 'Double tokens for winner' },
                            { id: 'SYSTEM_FAILURE', label: 'SYSTEM FAILURE', desc: 'HUD Glitches & Scramble' },
                            { id: 'OPEN_HAND', label: 'OPEN HAND', desc: 'Player forced to reveal plan' },
                            { id: 'NOISE_CANCEL', label: 'NOISE CANCEL', desc: 'Player forced to make noise' },
                            { id: 'MUTE_PROTOCOL', label: 'SILENCE ENFORCED', desc: 'Silence required' },
                            { id: 'PRIVATE_CHANNEL', label: 'PRIVATE CHANNEL', desc: 'Secret strategy chat' },
                            { id: 'NO_LOOK', label: 'BLIND BIDDING', desc: 'Cannot look at screen' },
                            { id: 'THE_MOLE', label: 'THE MOLE', desc: 'Secret traitor assignment' },
                            { id: 'PANIC_ROOM', label: 'PANIC_ROOM', desc: '2x Speed' },
                            { id: 'UNDERDOG_VICTORY', label: 'UNDERDOG VICTORY', desc: 'Lowest valid bid wins token' },
                            { id: 'TIME_TAX', label: 'TIME TAX', desc: '-10s to everyone' },
                        ].map((p) => (
                            <div key={p.id} className="flex items-start space-x-3 p-3 rounded bg-zinc-900/50 border border-white/5">
                                <Switch 
                                    checked={allowedProtocols.includes(p.id as ProtocolType)}
                                    onCheckedChange={(checked) => {
                                        setAllowedProtocols(prev => 
                                            checked 
                                            ? [...prev, p.id as ProtocolType]
                                            : prev.filter(id => id !== p.id)
                                        );
                                    }}
                                />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-zinc-200">{p.label}</h4>
                                    <p className="text-xs text-zinc-500">{p.desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* SOCIAL PROTOCOLS */}
                        <div className="md:col-span-2 mt-4 mb-2">
                             <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-1 flex items-center gap-2">
                                <PartyPopper size={12}/> SOCIAL OVERDRIVE
                             </h4>
                        </div>
                        {[
                            { id: 'TRUTH_DARE', label: 'TRUTH_DARE', desc: 'Social', type: 'social' },
                            { id: 'SWITCH_SEATS', label: 'SWITCH_SEATS', desc: 'Social', type: 'social' },
                            { id: 'HUM_TUNE', label: 'HUM_TUNE', desc: 'Social', type: 'social' },
                            { id: 'LOCK_ON', label: 'LOCK_ON', desc: 'Eye contact required', type: 'social' },
                        ].map((p) => (
                            <div key={p.id} className="flex items-start space-x-3 p-3 rounded bg-purple-950/20 border border-purple-500/10">
                                <Switch 
                                    checked={allowedProtocols.includes(p.id as ProtocolType)}
                                    disabled={variant !== 'SOCIAL_OVERDRIVE'} // Only enable in social mode
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                             setAllowedProtocols(prev => [...prev, p.id as ProtocolType]);
                                        } else {
                                             setAllowedProtocols(prev => prev.filter(id => id !== p.id));
                                        }
                                    }}
                                />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-purple-200">{p.label}</h4>
                                    <p className="text-xs text-purple-400">{p.desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* BIO PROTOCOLS */}
                        <div className="md:col-span-2 mt-4 mb-2">
                             <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-orange-500/20 pb-1 flex items-center gap-2">
                                <Martini size={12}/> BIO-FUEL
                             </h4>
                        </div>
                        {[
                            { id: 'HYDRATE', label: 'HYDRATE', desc: 'Bio-Fuel', type: 'bio' },
                            { id: 'BOTTOMS_UP', label: 'BOTTOMS UP', desc: 'Bio-Fuel', type: 'bio' },
                            { id: 'PARTNER_DRINK', label: 'LINKED SYSTEMS', desc: 'Bio-Fuel', type: 'bio' },
                            { id: 'WATER_ROUND', label: 'WATER_ROUND', desc: 'Bio-Fuel', type: 'bio' },
                        ].map((p) => (
                            <div key={p.id} className="flex items-start space-x-3 p-3 rounded bg-orange-950/20 border border-orange-500/10">
                                <Switch 
                                    checked={allowedProtocols.includes(p.id as ProtocolType)}
                                    disabled={variant !== 'BIO_FUEL'} // Only enable in bio mode
                                    onCheckedChange={(checked) => {
                                         if (checked) {
                                             setAllowedProtocols(prev => [...prev, p.id as ProtocolType]);
                                        } else {
                                             setAllowedProtocols(prev => prev.filter(id => id !== p.id));
                                        }
                                    }}
                                />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-orange-200">{p.label}</h4>
                                    <p className="text-xs text-orange-400">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <div className="text-xs text-zinc-500 w-full text-left pt-2">
                            {allowedProtocols.length} selected
                        </div>
                        <Button variant="outline" onClick={() => setShowProtocolSelect(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <h1 className="text-6xl font-display text-primary text-glow font-bold">REDLINE AUCTION</h1>
            <p className="text-xl text-muted-foreground">
              Bid time to win tokens.<br/>
              <span className="text-sm font-mono opacity-70">
                {gameDuration === 'short' && "SPEED MODE: 2.5 Minutes | 9 Rounds"}
                {gameDuration === 'standard' && "STANDARD: 5 Minutes | 9 Rounds"}
                {gameDuration === 'long' && "MARATHON: 10 Minutes | 18 Rounds"}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-4 text-left bg-card/50 p-6 rounded border border-white/5">
               <div className="space-y-2">
                <h3 className="text-primary font-bold">Rules</h3>
                <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                  <li>Hold button to start.</li>
                  <li>Release to bid time.</li>
                  <li>Longest time wins token.</li>
                  <li>Min Bid: {gameDuration === 'short' ? '1.0s' : gameDuration === 'long' ? '4.0s' : '2.0s'}</li>
                  <li>Max Bid: Your Remaining Time.</li>
                </ul>
              </div>
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-destructive font-bold">Winning</h3>
                  <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                    <li>Most tokens wins game.</li>
                    <li>Tiebreaker: Remaining Time.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 bg-black/40 p-4 rounded-xl border border-white/10 w-full max-w-lg">
              {/* Top Row: Modes */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* GAME DIFFICULTY (Matches top banner) */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant={difficulty === 'COMPETITIVE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDifficulty('COMPETITIVE')}
                    className={cn(
                      'h-8 px-3 text-xs font-mono flex items-center gap-2 border',
                      difficulty === 'COMPETITIVE' 
                        ? 'bg-destructive text-white border-destructive/80' 
                        : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10'
                    )}
                  >
                    <Skull size={12} /> COMPETITIVE
                  </Button>
                  <Button 
                    variant={difficulty === 'CASUAL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDifficulty('CASUAL')}
                    className={cn(
                      'h-8 px-3 text-xs font-mono flex items-center gap-2 border',
                      difficulty === 'CASUAL' 
                        ? 'bg-emerald-500 text-black border-emerald-500' 
                        : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10'
                    )}
                  >
                    <span role="img" aria-label="casual" className="text-emerald-300">:)</span> CASUAL
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-6 bg-white/10" />

                 <div className="flex items-center gap-2">
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleVariant}
                      className="h-8 px-3 text-xs font-mono bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                   >
                      <span className={getVariantColor()}>{getVariantIcon()}</span>
                      <span className={cn("tracking-widest", getVariantColor())}>
                         {variant.replace('_', ' ')}
                      </span>
                   </Button>
                </div>
                
                <Separator orientation="vertical" className="h-6 bg-white/10" />
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                        id="protocols-intro" 
                        checked={protocolsEnabled} 
                        onCheckedChange={setProtocolsEnabled} 
                        className="data-[state=checked]:bg-destructive"
                    />
                    <Label htmlFor="protocols-intro" className="text-sm cursor-pointer text-zinc-400 flex items-center gap-1">
                        <AlertTriangle size={14} className={protocolsEnabled ? "text-destructive" : "text-muted-foreground"}/>
                        Protocols
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    disabled={!protocolsEnabled}
                    onClick={() => setShowProtocolSelect(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6 bg-white/10" />

                <div className="flex items-center gap-2">
                  <Switch 
                    id="abilities-intro" 
                    checked={abilitiesEnabled} 
                    onCheckedChange={setAbilitiesEnabled} 
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="abilities-intro" className="text-sm cursor-pointer text-zinc-400 flex items-center gap-1">
                    <Zap size={14} className={abilitiesEnabled ? "text-blue-400" : "text-muted-foreground"}/>
                    Abilities
                  </Label>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Bottom Row: Game Pace */}
              <div className="flex flex-col items-center gap-2">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">GAME PACE</h3>
                 <div className="flex items-center justify-center gap-2">
                     <button 
                       onClick={() => setGameDuration('short')}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'short' 
                           ? "bg-purple-500/20 border-purple-500 text-purple-400" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       SPEED (2.5m)
                     </button>
                     <button 
                       onClick={() => setGameDuration('standard')}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'standard' 
                           ? "bg-primary/20 border-primary text-primary" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       STANDARD (5m)
                     </button>
                     <button 
                       onClick={() => setGameDuration('long')}
                       className={cn(
                         "px-3 py-1 rounded text-xs font-bold tracking-wider transition-all border",
                         gameDuration === 'long' 
                           ? "bg-orange-500/20 border-orange-500 text-orange-400" 
                           : "bg-black/20 border-white/10 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       MARATHON (10m)
                     </button>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button size="lg" onClick={() => setPhase('character_select')} className="text-xl px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 max-w-xs">
                 SINGLE PLAYER
              </Button>
              <Button size="lg" variant="outline" onClick={() => setPhase('multiplayer_lobby')} className="text-xl px-12 py-6 border-white/20 hover:bg-white/10 flex-1 max-w-xs">
                 MULTIPLAYER
              </Button>
            </div>

          </motion.div>
        );

      case 'multiplayer_lobby':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-[450px] max-w-md mx-auto w-full space-y-8"
          >
             <div className="text-center space-y-2">
               <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
               <h2 className="text-3xl font-display font-bold">MULTIPLAYER LOBBY</h2>
               <p className="text-muted-foreground">Join the global network.</p>
             </div>

             <div className="grid grid-cols-1 gap-6 w-full">
                {/* Create Room */}
                <div className="bg-card/30 p-6 rounded-lg border border-white/10 hover:border-primary/50 transition-colors text-center space-y-4">
                   <h3 className="font-bold text-lg flex items-center justify-center gap-2"><Users size={20}/> Create Room</h3>
                   <p className="text-xs text-zinc-500">Host a private match for friends.</p>
                   <Button onClick={handleCreateRoom} className="w-full">Create New Lobby</Button>
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
                     />
                     <Button onClick={handleJoinRoom} variant="secondary" disabled={lobbyCode.length < 4}>Join</Button>
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
              <p className="text-xs text-zinc-500 mt-1">Each time bid subtracts from your time bank.</p>
              {variant !== 'STANDARD' && (
                  <Badge variant="outline" className={cn("mt-2 border-white/10", getVariantColor())}>
                      {getVariantIcon()} {variant.replace('_', ' ')} MODE ACTIVE
                  </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               {/* RANDOM BUTTON */}
               <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={selectRandomCharacter}
                  className="flex flex-col items-center p-4 rounded-xl border border-dashed border-white/20 bg-white/5 hover:border-primary/50 transition-colors group text-center justify-center min-h-[200px]"
                >
                  <div className="w-20 h-20 rounded-full bg-white/10 mb-3 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                     <CircleHelp size={32} className="text-zinc-500 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-primary transition-colors">RANDOM</h3>
                  <p className="text-xs text-zinc-500 mt-1">Roll the dice</p>
                </motion.button>

              {[...CHARACTERS, ...(variant === 'SOCIAL_OVERDRIVE' ? SOCIAL_CHARACTERS : []), ...(variant === 'BIO_FUEL' ? BIO_CHARACTERS : [])].map((char) => (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectCharacter(char)}
                  className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-black/40 hover:border-primary/50 transition-colors group text-center overflow-hidden"
                >
                  <div className={cn("w-24 h-24 rounded-full mb-3 group-hover:scale-110 transition-transform overflow-hidden border-2 border-white/10", char.color)}>
                     <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{char.name}</h3>
                  <p className="text-xs text-primary/80 uppercase tracking-wider mb-2 font-display">{char.title}</p>
                  <p className="text-xs text-zinc-500 leading-tight line-clamp-2">{char.description}</p>
                  
                  {char.ability && (
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
              ))}
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
              <p className="text-muted-foreground">Release now to abandon auction (-{getTimerStart().toFixed(1)}s)</p>
            </div>
            
            <div className="h-[280px] flex items-center justify-center relative"> 
               <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
               </div>
               
               <div className="z-20 text-9xl font-display font-black text-destructive animate-ping absolute pointer-events-none">
                  {countdown}
               </div>

               <div className="z-10 relative">
                 <AuctionButton 
                    onPress={() => {}} 
                    onRelease={handleRelease} 
                    isPressed={players.find(p => p.id === 'p1')?.isHolding}
                    disabled={!players.find(p => p.id === 'p1')?.isHolding} 
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
        
        return (
          <div className="flex flex-col items-center justify-center h-[450px]">
             {/* Timer Area */}
             <div className="h-[100px] flex items-center justify-center mb-4">
                {showDetails && !isBlackout && currentTime <= 10 ? (
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
                    onPress={() => {}} 
                    onRelease={handleRelease} 
                    isPressed={players.find(p => p.id === 'p1')?.isHolding}
                    disabled={!players.find(p => p.id === 'p1')?.isHolding}
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
                     {players.find(p => p.name === roundWinner.name)?.characterIcon && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden border-4 border-primary/50 shadow-[0_0_20px_var(--color-primary)] z-0 opacity-80">
                           {typeof players.find(p => p.name === roundWinner.name)?.characterIcon === 'string' ? (
                             <img src={players.find(p => p.name === roundWinner.name)?.characterIcon as string} alt="Winner" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full bg-zinc-800" />
                           )}
                        </div>
                     )}
                  </div>
                  
                  {/* Clean layout for image + text */}
                   <div className="flex items-center justify-center gap-4 mt-4">
                     {players.find(p => p.name === roundWinner.name)?.characterIcon && typeof players.find(p => p.name === roundWinner.name)?.characterIcon === 'string' && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-lg">
                           <img src={players.find(p => p.name === roundWinner.name)?.characterIcon as string} alt="Winner" className="w-full h-full object-cover" />
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
              {players
                .filter(p => p.currentBid !== null && p.currentBid > 0)
                .sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0))
                .filter(p => {
                  if (showDetails) return true; 
                  if (!roundWinner) return true; 
                  return p.name === roundWinner.name; 
                })
                .map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className={p.id === roundWinner?.name ? "text-primary font-bold" : "text-zinc-300"}>
                    {p.name}
                  </span>
                  <span className="font-mono">{formatTime(p.currentBid || 0)}</span>
                </div>
              ))}
              {!showDetails && players.filter(p => p.currentBid !== null && p.currentBid > 0).length > (roundWinner ? 1 : 0) && (
                 <div className="text-center text-xs text-zinc-600 italic mt-2">
                   + {players.filter(p => p.currentBid !== null && p.currentBid > 0).length - (roundWinner ? 1 : 0)} other hidden bids
                 </div>
              )}
            </div>

            <Button onClick={nextRound} size="lg" className="w-full bg-white text-black hover:bg-zinc-200">
              NEXT ROUND
            </Button>
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
          <div className="flex flex-col items-center justify-center space-y-8 mt-10 h-[550px] overflow-y-auto custom-scrollbar">
            <h1 className="text-5xl font-display font-bold text-white">GAME OVER</h1>
            
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
        );
    }
  };

  return (
    <GameLayout>

      {/* Header Info */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          {phase !== 'intro' && (
            <Button variant="ghost" size="icon" onClick={quitGame} className="mr-2 text-muted-foreground hover:text-white hover:bg-white/10" title="Quit to Menu">
               <LogOut size={20} />
            </Button>
          )}
          <img src={logoFuturistic} alt="Logo" className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <h1 className="font-display font-bold text-xl tracking-wider hidden sm:block">REDLINE AUCTION</h1>
        </div>
          <div className="flex items-center gap-6">
            
            {variant === 'BIO_FUEL' && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-orange-950/40 border border-orange-500/30 rounded text-xs text-orange-300">
                    <AlertTriangle size={12} className="text-orange-500" />
                    <span className="font-bold tracking-widest">21+ ONLY</span>
                </div>
            )}

            <div className="flex items-center gap-4 bg-black/40 p-1.5 px-3 rounded-full border border-white/10">
             
             {/* DIFFICULTY TOGGLE */}
             <div className="flex items-center gap-2">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={toggleDifficulty}
                   className="h-6 px-2 text-xs font-mono hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                >
                   {difficulty === 'CASUAL' ? <Eye size={12} className="text-emerald-400"/> : <EyeOff size={12} className="text-zinc-400"/>}
                   <span className={difficulty === 'CASUAL' ? "text-emerald-400" : "text-zinc-400"}>
                      {difficulty}
                   </span>
                </Button>
             </div>

             <Separator orientation="vertical" className="h-4 bg-white/10" />

             {/* REALITY MODE TOGGLE */}
             <div className="flex items-center gap-2">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={toggleVariant}
                   className="h-6 px-2 text-xs font-mono hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                >
                   <span className={getVariantColor()}>{getVariantIcon()}</span>
                   <span className={cn("tracking-widest", getVariantColor())}>
                      {variant.replace('_', ' ')}
                   </span>
                </Button>
             </div>
             
             <Separator orientation="vertical" className="h-4 bg-white/10" />

             <div className="flex items-center gap-2">
                <Switch 
                  id="protocols" 
                  checked={protocolsEnabled} 
                  onCheckedChange={setProtocolsEnabled} 
                  className="data-[state=checked]:bg-destructive scale-75 origin-right"
                />
                <Label htmlFor="protocols" className={cn("text-sm cursor-pointer flex items-center gap-1", protocolsEnabled ? "text-destructive" : "text-zinc-400")}>
                  <AlertTriangle size={12}/>
                  Protocols
                </Label>
                <button onClick={() => setShowProtocolGuide(true)} className="text-zinc-500 hover:text-white transition-colors ml-1" title="Protocol Guide">
                   <BookOpen size={14} />
                </button>
             </div>

             <Separator orientation="vertical" className="h-4 bg-white/10" />

             <div className="flex items-center gap-2">
                <Switch 
                  id="abilities" 
                  checked={abilitiesEnabled} 
                  onCheckedChange={setAbilitiesEnabled} 
                  className="data-[state=checked]:bg-blue-500 scale-75 origin-right"
                />
                <Label htmlFor="abilities" className={cn("text-sm cursor-pointer flex items-center gap-1", abilitiesEnabled ? "text-blue-400" : "text-zinc-400")}>
                  <Zap size={12}/>
                  LIMIT BREAK
                </Label>
             </div>
             {/* Popup Library Info Button */}
             <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-white ml-2"
                onClick={() => setShowPopupLibrary(true)}
                title="Popup Gallery"
             >
                <CircleHelp className="h-4 w-4" />
             </Button>
          </div>
          <Badge variant="outline" className="font-mono text-lg px-4 py-1 border-white/10 bg-white/5">
            ROUND {round} / {totalRounds}
          </Badge>
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
              A guide to all special victory conditions and game events.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { title: "SMUG CONFIDENCE", desc: "Win Round 1 immediately.", color: "text-purple-400 border-purple-500/20" },
              { title: "FAKE CALM", desc: "Win by margin > 15s.", color: "text-amber-400 border-amber-500/20" },
              { title: "GENIUS MOVE", desc: "Win by margin < 5s.", color: "text-cyan-400 border-cyan-500/20" },
              { title: "EASY W", desc: "Win with a bid under 20s.", color: "text-green-400 border-green-500/20" },
              { title: "COMEBACK HOPE", desc: "Win while having the least tokens.", color: "text-emerald-400 border-emerald-500/20" },
              { title: "LAST ONE STANDING", desc: "Win the final round while at least one player was eliminated.", color: "text-blue-400 border-blue-500/20" },
              { title: "PRECISION STRIKE", desc: "Win with an exact integer bid (e.g. 20.0s).", color: "text-blue-400 border-blue-500/20" },
              { title: "OVERKILL", desc: "Win with a bid over 60s.", color: "text-red-400 border-red-500/20" },
              { title: "CLUTCH PLAY", desc: "Win with < 10s remaining in bank.", color: "text-yellow-400 border-yellow-500/20" },
              { title: "DEADLOCK SYNC", desc: "Exact tie for first place. No winner.", color: "text-zinc-200 border-white/20" },
              { title: "PLAYER ELIMINATED", desc: "Player runs out of time.", color: "text-destructive border-destructive/20" },
              { title: "AFK", desc: "No one bids or everyone abandons.", color: "text-yellow-200 border-yellow-200/20" },
            ].map((p, i) => (
              <div key={i} className={`bg-black/40 p-4 rounded border ${p.color} transition-colors`}>
                <h4 className={`font-bold text-sm mb-1 ${p.color.split(' ')[0]}`}>{p.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
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
            <DialogTitle className="font-display tracking-widest text-2xl mb-4 text-destructive flex items-center gap-2">
              <AlertTriangle /> PROTOCOL DATABASE
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              When PROTOCOLS are enabled, random events may trigger at the start of a round.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {variant === 'BIO_FUEL' && (
                <div className="col-span-1 md:col-span-2 bg-orange-950/30 border border-orange-500/30 p-3 rounded mb-2 flex items-center gap-3 text-orange-200 text-sm">
                    <AlertTriangle className="shrink-0 text-orange-500" size={18} />
                    <p><strong>DISCLAIMER:</strong> Bio-Fuel mode is intended for adults (21+). Please play responsibly.</p>
                </div>
            )}
            <h3 className="col-span-1 md:col-span-2 text-lg font-bold text-white mt-4 border-b border-white/10 pb-2">STANDARD PROTOCOLS</h3>
            {[
              { name: "DATA BLACKOUT", desc: "All timers and clocks are hidden from the HUD.", type: "Visual" },
              { name: "HIGH STAKES", desc: "Winner receives DOUBLE tokens for this round.", type: "Economy" },
              { name: "SYSTEM FAILURE", desc: "HUD glitches and timers display random scrambled numbers.", type: "Visual" },
              { name: "OPEN HAND", desc: "One player must publicly state they will not bid (Bluffing allowed).", type: "Social" },
              { name: "NOISE CANCEL", desc: "Selected player must make continuous noise for first 15s.", type: "Social" },
              { name: "MUTE PROTOCOL", desc: "Complete silence enforced. Speaking is shunned.", type: "Social" },
              { name: "PRIVATE CHANNEL", desc: "Two players selected to discuss strategy privately.", type: "Social" },
              { name: "NO LOOK", desc: "Players cannot look at screens until they release button.", type: "Physical" },
              { name: "THE MOLE", desc: "Selected player must LOSE. Their bid time is NOT subtracted.", type: "Hidden Role" },
              { name: "PANIC ROOM", desc: "Game speed 2x. Winner gets Double Tokens.", type: "Game State" },
            ].map((p, i) => (
              <div key={i} className="bg-white/5 p-4 rounded border border-white/5 hover:border-destructive/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <Badge variant="outline" className="text-[10px] py-0 h-5 border-white/10 text-zinc-500">{p.type}</Badge>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}

            <h3 className="col-span-1 md:col-span-2 text-lg font-bold text-purple-400 mt-4 border-b border-purple-500/30 pb-2 flex items-center gap-2"><PartyPopper size={18}/> SOCIAL OVERDRIVE</h3>
            {[
                { name: "TRUTH DARE", desc: "Winner asks a Truth, Loser does a Dare.", type: "Social" },
                { name: "SWITCH SEATS", desc: "Players must physically swap seats before next round.", type: "Physical" },
                { name: "GROUP SELFIE", desc: "Everyone must pose for a photo. Last one ready loses 1s.", type: "Social" },
                { name: "HUM TUNE", desc: "You must hum a song while bidding. If you stop, you forfeit.", type: "Social" },
            ].map((p, i) => (
              <div key={`social-${i}`} className="bg-purple-500/5 p-4 rounded border border-purple-500/20 hover:border-purple-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-purple-200 text-sm">{p.name}</h4>
                  <Badge variant="outline" className="text-[10px] py-0 h-5 border-purple-500/20 text-purple-400">{p.type}</Badge>
                </div>
                <p className="text-xs text-purple-300/70 leading-relaxed">{p.desc}</p>
              </div>
            ))}

            <h3 className="col-span-1 md:col-span-2 text-lg font-bold text-orange-400 mt-4 border-b border-orange-500/30 pb-2 flex items-center gap-2"><Martini size={18}/> BIO-FUEL</h3>
            {[
                { name: "HYDRATE", desc: "Everyone takes a sip.", type: "Bio" },
                { name: "BOTTOMS UP", desc: "Winner must finish their drink.", type: "Bio" },
                { name: "LINKED SYSTEMS", desc: "Pick a partner. When you drink, they drink.", type: "Bio" },
                { name: "WATER ROUND", desc: "Winner gives a glass of water to someone.", type: "Bio" },
            ].map((p, i) => (
              <div key={`bio-${i}`} className="bg-orange-500/5 p-4 rounded border border-orange-500/20 hover:border-orange-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-orange-200 text-sm">{p.name}</h4>
                  <Badge variant="outline" className="text-[10px] py-0 h-5 border-orange-500/20 text-orange-400">{p.type}</Badge>
                </div>
                <p className="text-xs text-orange-300/70 leading-relaxed">{p.desc}</p>
              </div>
            ))}
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
                <span className="font-display tracking-widest uppercase text-xl">{selectedPlayerStats?.name}</span>
                {selectedPlayerStats?.isBot && <Badge variant="secondary" className="ml-2 text-[10px]">BOT</Badge>}
            </DialogTitle>
            <DialogDescription>
                Detailed player statistics and abilities.
            </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
                {/* Ability Section */}
                <div className="bg-white/5 p-4 rounded border border-white/10">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Zap size={14} className="text-blue-400"/> ABILITIES</h4>
                    {/* Show abilities based on current mode */}
                    {(() => {
                        // Find character definition to get ability details
                        const char = [...CHARACTERS, ...SOCIAL_CHARACTERS, ...BIO_CHARACTERS].find(c => c.name === selectedPlayerStats?.name);
                        if (!char) return <p className="text-zinc-500 text-xs">Unknown character data.</p>;
                        
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
          <h3 className="font-display text-muted-foreground text-sm tracking-widest mb-4">PLAYERS</h3>
          <div className="space-y-3">
            {players.map(p => (
              <PlayerStats 
                key={p.id} 
                player={p} 
                isCurrentPlayer={p.id === 'p1'} 
                showTime={showDetails || phase === 'game_end' || p.isEliminated} 
                // Show time if: Easy Mode OR Game Over OR Player Eliminated
                remainingTime={p.remainingTime}
                formatTime={formatTime}
                peekActive={(selectedCharacter?.id === 'pepe' || selectedCharacter?.id === 'bf') && peekTargetId === p.id}
                isDoubleTokens={isDoubleTokens}
                isSystemFailure={activeProtocol === 'SYSTEM_FAILURE' || (p.id === 'p1' && selectedCharacter?.id === 'pepe')}
                isScrambled={(p.id !== 'p1' && selectedCharacter?.id === 'bf' && p.id !== peekTargetId) || scrambledPlayers.includes(p.id)}
                // Hide details if competitive mode (ALWAYS, unless game end)
                onClick={() => {
                    if (difficulty === 'COMPETITIVE' && phase !== 'game_end') {
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
              <Button variant="ghost" size="sm" className="h-4 text-[10px] px-1" onClick={() => console.log('Toggle log filter')}>
                ALL
              </Button>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-zinc-500 custom-scrollbar">
              {roundLog.length === 0 && <p className="italic opacity-50">Game started...</p>}
              {roundLog.map((log, i) => (
                <div key={i} className="border-b border-white/5 pb-1 mb-1 last:border-0">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
