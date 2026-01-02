import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { GameLayout } from "@/components/game/GameLayout";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { AuctionButton } from "@/components/game/AuctionButton";
import { PlayerStats } from "@/components/game/PlayerStats";
import { GameOverlay, OverlayType } from "@/components/game/GameOverlay";
import { MusicPlayer } from "@/components/game/MusicPlayer";
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
  Users, Globe, Lock, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import Generated Images
import charHarambe from '@assets/generated_images/cyberpunk_gorilla_guardian.png';
import charPopcat from '@assets/generated_images/cyberpunk_popcat.png';
import charWinter from '@assets/generated_images/cyberpunk_winter_soldier.png';
import charDoge from '@assets/generated_images/cyberpunk_shiba_inu_astronaut.png';
import charPepe from '@assets/generated_images/cyberpunk_sad_green_alien_analyst.png';
import charNyan from '@assets/generated_images/cyberpunk_neon_rainbow_cat.png';
import charKaren from '@assets/generated_images/cyberpunk_yelling_commander.png';
import charFine from '@assets/generated_images/cyberpunk_burning_pilot.png';
import charBf from '@assets/generated_images/cyberpunk_distracted_pilot.png';
import charStonks from '@assets/generated_images/cyberpunk_stonks_man.png';
import charFloyd from '@assets/generated_images/cyberpunk_boxer_money.png';
import charRat from '@assets/generated_images/cyberpunk_rat_king.png';
import charBaldwin from '@assets/generated_images/cyberpunk_baldwin_mask.png';
import charSigma from '@assets/generated_images/cyberpunk_sigma_executive.png';
import charGigachad from '@assets/generated_images/cyberpunk_gigachad.png';
import charThinker from '@assets/generated_images/cyberpunk_thinker.png';
import charDisaster from '@assets/generated_images/cyberpunk_disaster_girl.png';
import charButtons from '@assets/generated_images/cyberpunk_two_buttons.png';
import charPepeSilvia from '@assets/generated_images/cyberpunk_pepe_silvia.png';
import charHarold from '@assets/generated_images/cyberpunk_hide_pain_harold.png';


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
type ProtocolType = 
  | 'DATA_BLACKOUT' 
  | 'DOUBLE_STAKES' 
  | 'SYSTEM_FAILURE' 
  | 'OPEN_HAND' 
  | 'NOISE_CANCEL' 
  | 'MUTE_PROTOCOL' 
  | 'PRIVATE_CHANNEL' 
  | 'NO_LOOK' 
  | 'LOCK_ON' 
  | 'THE_MOLE' 
  | 'PANIC_ROOM' 
  | null;

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
}

const CHARACTERS: Character[] = [
  { 
    id: 'harambe', name: 'Guardian H', title: 'The Eternal Watcher', image: charHarambe, description: 'Stoic protection against bad bids.', color: 'text-zinc-400',
    ability: { name: 'SPIRIT SHIELD', description: 'Get 1.0s refund if you lose the round.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'popcat', name: 'Click-Click', title: 'The Glitch', image: charPopcat, description: 'Hyperactive timing precision.', color: 'text-pink-400',
    ability: { name: 'HYPER CLICK', description: 'Gain +1 token if you win by < 1s.', effect: 'TOKEN_BOOST' }
  },
  { 
    id: 'winter', name: 'Frost Protocol', title: 'The Disciplined', image: charWinter, description: 'Cold, calculated efficiency.', color: 'text-cyan-400',
    ability: { name: 'CYRO FREEZE', description: 'Refund 0.5s regardless of outcome.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'doge', name: 'Shiba Prime', title: 'The Moonwalker', image: charDoge, description: 'Chaotic luck and high variance.', color: 'text-yellow-400',
    ability: { name: 'TO THE MOON', description: 'Double tokens if you win with > 30s bid.', effect: 'TOKEN_BOOST' }
  },
  { 
    id: 'pepe', name: 'Sadman Logic', title: 'The Analyst', image: charPepe, description: 'Feels bad, plays smart.', color: 'text-green-500',
    ability: { name: 'SAD REVEAL', description: 'See if opponents are holding.', effect: 'PEEK' }
  },
  { 
    id: 'nyan', name: 'Rainbow Dash', title: 'The Speeder', image: charNyan, description: 'Neon trails and fast reactions.', color: 'text-purple-400',
    ability: { name: 'RAINBOW RUN', description: 'Get 1.5s refund if you bid > 40s.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'karen', name: 'The Accuser', title: 'The Aggressor', image: charKaren, description: 'Loud and disruptive tactics.', color: 'text-red-400',
    ability: { name: 'MANAGER CALL', description: 'Remove 1s from random opponent.', effect: 'DISRUPT' }
  },
  { 
    id: 'fine', name: 'Inferno Calm', title: 'The Survivor', image: charFine, description: 'Perfectly chill in chaos.', color: 'text-orange-500',
    ability: { name: 'FIRE WALL', description: 'Immune to disruption.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'bf', name: 'Wandering Eye', title: 'The Opportunist', image: charBf, description: 'Always looking for a better deal.', color: 'text-blue-400',
    ability: { name: 'SNEAK PEEK', description: 'See who is still holding.', effect: 'PEEK' }
  },
  { 
    id: 'stonks', name: 'Market Maker', title: 'The Strategist', image: charStonks, description: 'Stonks only go up.', color: 'text-emerald-400',
    ability: { name: 'DIVIDEND', description: 'Gain +1 token every 3rd win.', effect: 'TOKEN_BOOST' }
  },
  { 
    id: 'floyd', name: 'Money May', title: 'The Champion', image: charFloyd, description: 'Undefeated in financial combat.', color: 'text-yellow-500',
    ability: { name: 'PAY DAY', description: 'Get 0.5s refund on every win.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'rat', name: 'Rat King', title: 'The Scavenger', image: charRat, description: 'Sneaky tactics and hidden cheese.', color: 'text-gray-500',
    ability: { name: 'CHEESE TAX', description: 'Steal 1s from winner if you lose.', effect: 'DISRUPT' }
  },
  { 
    id: 'baldwin', name: 'Leper King', title: 'The Royal', image: charBaldwin, description: 'Silent authority and iron will.', color: 'text-blue-500',
    ability: { name: 'ROYAL DECREE', description: 'Get 2s refund if you bid exactly 20s.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'sigma', name: 'Executive P', title: 'The Psycho', image: charSigma, description: 'Impeccable taste, dangerous mind.', color: 'text-red-500',
    ability: { name: 'AXE SWING', description: 'Remove 2s from opponent with most time.', effect: 'DISRUPT' }
  },
  { 
    id: 'gigachad', name: 'Alpha Prime', title: 'The Perfect', image: charGigachad, description: 'Peak performance in every bid.', color: 'text-zinc-300',
    ability: { name: 'JAWLINE', description: 'Ignore first 1s of every bid.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'thinker', name: 'Roll Safe', title: 'The Consultant', image: charThinker, description: 'Modern solutions for modern bids.', color: 'text-indigo-400',
    ability: { name: 'SMART PLAY', description: 'See active bot count.', effect: 'PEEK' }
  },
  { 
    id: 'disaster', name: 'Pyro Girl', title: 'The Anarchist', image: charDisaster, description: 'Watches the market burn with a smile.', color: 'text-orange-600',
    ability: { name: 'BURN IT', description: 'Remove 0.5s from everyone else.', effect: 'DISRUPT' }
  },
  { 
    id: 'buttons', name: 'Panic Bot', title: 'The Indecisive', image: charButtons, description: 'Always sweating the big decisions.', color: 'text-red-400',
    ability: { name: 'PANIC MASH', description: '50% chance +1s refund, 50% -1s penalty.', effect: 'TIME_REFUND' }
  },
  { 
    id: 'pepesilvia', name: 'Conspiracy', title: 'The Seeker', image: charPepeSilvia, description: 'Connecting dots that do not exist.', color: 'text-amber-600',
    ability: { name: 'RED STRING', description: 'See random opponent bid.', effect: 'PEEK' }
  },
  { 
    id: 'harold', name: 'Pain Hider', title: 'The Stoic', image: charHarold, description: 'Smiling through the bear market.', color: 'text-slate-400',
    ability: { name: 'HIDE PAIN', description: 'Get 2s refund if you lose by > 10s.', effect: 'TIME_REFUND' }
  },
];

export default function Game() {
  // Game State
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [round, setRound] = useState(1);
  const [gameDuration, setGameDuration] = useState<GameDuration>('standard');
  const [currentTime, setCurrentTime] = useState(0.0); // The central auction clock
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showDetails, setShowDetails] = useState(false);
  const [protocolsEnabled, setProtocolsEnabled] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<ProtocolType>(null);
  const [readyHoldTime, setReadyHoldTime] = useState(0);
  const [moleTarget, setMoleTarget] = useState<string | null>(null);
  const [showProtocolGuide, setShowProtocolGuide] = useState(false);
  const [abilitiesEnabled, setAbilitiesEnabled] = useState(false);
  const [playerAbilityUsed, setPlayerAbilityUsed] = useState(false);
  
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

  // Overlay State
  const [overlay, setOverlay] = useState<{ type: OverlayType; message?: string; subMessage?: string } | null>(null);
  
  // Players State
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false },
    { id: 'b1', name: 'Alpha (Aggr)', isBot: true, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'aggressive' },
    { id: 'b2', name: 'Beta (Cons)', isBot: true, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'conservative' },
    { id: 'b3', name: 'Gamma (Rand)', isBot: true, tokens: 0, remainingTime: STANDARD_INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'random' },
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
        const deltaTime = rawDelta * multiplier;
        
        setCurrentTime(deltaTime);

        // Check if any bots should release
        handleBotLogic(deltaTime);

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
  
  // Initialize Bots with Random Unique Characters on Mount
  useEffect(() => {
    // Shuffle characters to ensure uniqueness
    const shuffledChars = [...CHARACTERS].sort(() => 0.5 - Math.random());
    let charIndex = 0;

    setPlayers(prev => prev.map(p => {
      if (p.isBot) {
        // Assign next available character
        const char = shuffledChars[charIndex % shuffledChars.length];
        charIndex++;
        
        return { 
          ...p, 
          name: char.name, // Rename bot to character name
          characterIcon: char.image 
        };
      }
      return p;
    }));
  }, []);

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
  useEffect(() => {
    if (phase === 'bidding') {
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
    }
  }, [currentTime, phase, botBids]);


  // User Interactions
  const handlePress = () => {
    if (phase === 'ready') {
       setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: true } : p));
    }
  };

  const handleRelease = () => {
    if (phase === 'ready') {
      setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: false } : p));
    } else if (phase === 'bidding') {
      const bidTime = parseFloat(currentTime.toFixed(1));
      setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: false, currentBid: bidTime } : p));
    } else if (phase === 'countdown') {
       // If releasing during countdown, deduct 0.1 seconds immediately and mark as not holding
       // This essentially 'abandons' the auction but with a small penalty
       const penalty = 0.1;
       setPlayers(prev => prev.map(p => p.id === 'p1' ? { 
         ...p, 
         isHolding: false, 
         currentBid: 0, 
         remainingTime: Math.max(0, p.remainingTime - penalty) 
       } : p));
    }
  };

  // Start Round Logic
  const startCountdown = () => {
    // Check for Protocol Trigger (35% chance if enabled)
    if (protocolsEnabled && Math.random() > 0.65) {
      const protocols: ProtocolType[] = [
        'DATA_BLACKOUT', 'DOUBLE_STAKES', 'SYSTEM_FAILURE', 
        'OPEN_HAND', 'NOISE_CANCEL', 'MUTE_PROTOCOL', 
        'PRIVATE_CHANNEL', 'NO_LOOK', 'LOCK_ON', 
        'THE_MOLE', 'PANIC_ROOM'
      ];
      const newProtocol = protocols[Math.floor(Math.random() * protocols.length)];
      setActiveProtocol(newProtocol);
      
      let msg = "PROTOCOL INITIATED";
      let sub = "Unknown Effect";
      
      // Helper to get random player name(s)
      const getRandomPlayer = () => players[Math.floor(Math.random() * players.length)].name;
      const getTwoRandomPlayers = () => {
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        return [shuffled[0].name, shuffled[1].name];
      };
      
      switch(newProtocol) {
        case 'DATA_BLACKOUT': 
          msg = "DATA BLACKOUT"; 
          sub = "Timers Hidden";
          break;
        case 'DOUBLE_STAKES': 
          msg = "HIGH STAKES"; 
          sub = "Double Tokens for Winner";
          break;
        case 'SYSTEM_FAILURE': 
          msg = "SYSTEM FAILURE"; 
          sub = "HUD Glitches & Timer Scramble";
          break;
        case 'OPEN_HAND':
          msg = "OPEN HAND";
          sub = `${getRandomPlayer()} must state they won't bid!`;
          break;
        case 'NOISE_CANCEL':
          msg = "NOISE CANCEL";
          sub = `${getRandomPlayer()} must make noise for 15s!`;
          break;
        case 'MUTE_PROTOCOL':
          msg = "SILENCE ENFORCED";
          sub = "All players must remain silent!";
          break;
        case 'PRIVATE_CHANNEL':
          const [p1, p2] = getTwoRandomPlayers();
          msg = "PRIVATE CHANNEL";
          sub = `${p1} & ${p2} discuss strategy now!`;
          break;
        case 'NO_LOOK':
          msg = "BLIND BIDDING";
          sub = "Do not look at screens until drop!";
          break;
        case 'LOCK_ON':
          const [l1, l2] = getTwoRandomPlayers();
          msg = "LOCK ON";
          sub = `${l1} & ${l2} must maintain eye contact!`;
          break;
        case 'THE_MOLE':
          // In single player, we pretend the user might be the mole or someone else
          // If we want to target the user specifically sometimes:
          const target = Math.random() > 0.5 ? 'YOU' : getRandomPlayer();
          const targetId = target === 'YOU' ? 'p1' : players.find(p => p.name === target)?.id || null;
          
          setMoleTarget(targetId); // Store for logic
          
          msg = "THE MOLE";
          sub = `${target} must secretly lose this round.`;
          break;
        case 'PANIC_ROOM':
          msg = "PANIC ROOM";
          sub = "Time 2x Speed | Double Win Tokens";
          break;
      }
      
      setOverlay({ type: "protocol_alert", message: msg, subMessage: sub });
    } else {
      setActiveProtocol(null);
    }

    setCurrentTime(0);
    setCountdown(COUNTDOWN_SECONDS);
    setPhase('countdown');
  };

  // End Round Logic
  const endRound = (finalTime: number) => {
    setPhase('round_end');
    
    // Filter participants (those who held past countdown)
    const participants = players.filter(p => p.currentBid !== null && p.currentBid > 0);
    
    // Sort by bid time descending
    participants.sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    
    let winnerId: string | null = null;
    let winnerName: string | null = null;
    let winnerTime = 0;
    
    // Determine winner
    if (participants.length > 0) {
      const potentialWinner = participants[0];
      // Check for tie
      const isTie = participants.some(p => p.id !== potentialWinner.id && Math.abs((p.currentBid || 0) - (potentialWinner.currentBid || 0)) < 0.05);
      
      if (!isTie) {
        winnerId = potentialWinner.id;
        winnerName = potentialWinner.name;
        winnerTime = potentialWinner.currentBid || 0;
      }
    }

    // Update stats logic here (tokens, time subtraction)
    let playersOut: string[] = [];

    const updatedPlayers = players.map(p => {
      let newTime = p.remainingTime;
      let newTokens = p.tokens;
      
      // --- ABILITY EFFECTS (Passive / Triggered on Result) ---
      if (abilitiesEnabled && !p.isBot && p.id === 'p1' && selectedCharacter?.ability) {
        const ability = selectedCharacter.ability;
        
        // TIME REFUNDS
        if (ability.effect === 'TIME_REFUND') {
            if (ability.name === 'SPIRIT SHIELD' && p.id !== winnerId) newTime += 1.0;
            if (ability.name === 'CYRO FREEZE') newTime += 0.5;
            if (ability.name === 'RAINBOW RUN' && (p.currentBid || 0) > 40) newTime += 1.5;
            if (ability.name === 'PAY DAY' && p.id === winnerId) newTime += 0.5;
            if (ability.name === 'ROYAL DECREE' && Math.abs((p.currentBid || 0) - 20) < 0.5) newTime += 2.0;
            if (ability.name === 'JAWLINE') newTime += 1.0; 
            if (ability.name === 'PANIC MASH') newTime += (Math.random() > 0.5 ? 1.0 : -1.0);
            if (ability.name === 'HIDE PAIN' && p.id !== winnerId && winnerTime - (p.currentBid||0) > 10) newTime += 2.0;
        }
        
        // TOKEN BOOSTS
        if (ability.effect === 'TOKEN_BOOST' && p.id === winnerId) {
            if (ability.name === 'HYPER CLICK' && (p.currentBid || 0) < winnerTime + 1.0) newTokens += 1;
            if (ability.name === 'TO THE MOON' && (p.currentBid || 0) > 30) newTokens += 1; // Double means +1 on top of +1
            if (ability.name === 'DIVIDEND' && round % 3 === 0) newTokens += 1;
        }
        
        // DISRUPT (Applied to enemies logic would go here, simplified as refund to self for now or handled in separate loop)
         if (ability.effect === 'DISRUPT' && playerAbilityUsed) {
             // Logic handled at button press time for active abilities, or here for result based
         }
      }

      if (p.currentBid !== null && p.currentBid > 0) {
        // If THE_MOLE and this player is the mole, do NOT subtract time
        if (activeProtocol === 'THE_MOLE' && p.id === moleTarget) {
           // Mole plays for free (time-wise) but must lose to "win" the protocol (though we aren't tracking protocol wins separately yet)
           // User request: "mole can still bid but that time is not subtracted from their time left"
           newTime -= 0; 
        } else {
           newTime -= p.currentBid;
        }
      }
      
      if (p.id === winnerId) {
        newTokens += (activeProtocol === 'DOUBLE_STAKES' || activeProtocol === 'PANIC_ROOM' ? 2 : 1);
      }
      
      // Check elimination
      if (newTime <= 0 && p.remainingTime > 0) {
        playersOut.push(p.name);
      }

      return { ...p, remainingTime: Math.max(0, newTime), tokens: newTokens };
    });

    setPlayers(updatedPlayers);
    setRoundWinner(winnerId ? { name: winnerName!, time: winnerTime } : null);
    
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

       // 1. Smug Confidence (Round 1 Win)
       if (round === 1 && winnerId === 'p1') {
         overlayType = "smug_confidence";
         overlayMsg = "SMUG CONFIDENCE";
         overlaySub = `${winnerName} takes the lead!`;
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
       // We check tokens BEFORE this win. 
       else {
         const winnerTokensBefore = players.find(p => p.id === winnerId)?.tokens || 0;
         const minTokens = Math.min(...players.map(p => p.tokens));
         if (winnerTokensBefore === minTokens && players.some(p => p.tokens > winnerTokensBefore) && winnerId === 'p1') {
           overlayType = "comeback_hope";
           overlayMsg = "COMEBACK HOPE";
           overlaySub = `${winnerName} stays in the fight!`;
         } else {
           // Default Win
           overlayType = "round_win";
           overlayMsg = `${winnerName} WINS`;
           overlaySub = `${formatTime(winnerTime)}`;
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
       overlayMsg = "CRICKETS...";
       overlaySub = "No one dared to bid!";
    }

    setOverlay({ 
      type: overlayType, 
      message: overlayMsg, 
      subMessage: overlaySub 
    });

    if (abilityTriggered) {
        // Queue ability popup slightly after result popup
        setTimeout(() => {
            setOverlay({ type: 'ability_trigger', message: abilityMsg, subMessage: 'Limit Break Activated!' });
        }, 2000);
    }
    
    // Add to log
    const logMsg = winnerId 
      ? `Round ${round}: ${winnerName} won (${formatTime(winnerTime)})` 
      : `Round ${round}: No winner`;
    setRoundLog(prev => [logMsg, ...prev]);

    if (round >= totalRounds || players.filter(p => !p.isEliminated && p.remainingTime > 0).length <= 1) {
       // Game End condition
       setTimeout(() => {
        setPhase('game_end');
        setOverlay({ type: "game_over", message: "GAME OVER" });
      }, 3000);
    }
  };

  const nextRound = () => {
    if (round < totalRounds) {
      setRound(prev => prev + 1);
      setPhase('ready');
      setPlayers(prev => prev.map(p => ({ ...p, isHolding: false, currentBid: null })));
      setReadyHoldTime(0);
      setPlayerAbilityUsed(false); // Reset ability usage
    }
  };

  const selectCharacter = (char: Character) => {
    setSelectedCharacter(char);
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

  // Render Helpers
  const renderPhaseContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-8 text-center max-w-2xl mx-auto mt-20"
          >
            <h1 className="text-6xl font-display text-primary text-glow font-bold">REDLINE AUCTION</h1>
            <p className="text-xl text-muted-foreground">
              Bid time to win tokens.<br/>
              <span className="text-sm font-mono opacity-70">
                {gameDuration === 'short' && "SPEED MODE: 2.5 Minutes | 5 Rounds"}
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
                  <li>Early release costs {gameDuration === 'short' ? '0.05s' : gameDuration === 'long' ? '0.2s' : '0.1s'}.</li>
                </ul>
              </div>
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-destructive font-bold">Winning</h3>
                  <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                    <li>Most tokens wins game.</li>
                    <li>Tiebreaker: Remaining Time.</li>
                    <li>{gameDuration === 'short' ? 'Protocol Chance: 50%' : gameDuration === 'long' ? 'Protocol Chance: 25%' : 'Protocol Chance: 35%'}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 bg-black/40 p-4 rounded-xl border border-white/10 w-full max-w-lg">
              {/* Top Row: Modes */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="show-details-intro" 
                    checked={showDetails} 
                    onCheckedChange={setShowDetails} 
                  />
                  <Label htmlFor="show-details-intro" className="text-sm cursor-pointer text-zinc-400">
                    Easy Mode
                  </Label>
                </div>
                
                <Separator orientation="vertical" className="h-6 bg-white/10" />
                
                <div className="flex items-center gap-2">
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

              {/* Bottom Row: Duration */}
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
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {CHARACTERS.map((char) => (
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
                    <p className="text-muted-foreground animate-pulse text-sm">All players must hold button to start</p>
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
                  {players.map(p => (
                    <div key={p.id} className={cn(
                      "w-3 h-3 rounded-full transition-colors duration-300",
                      p.isHolding ? "bg-primary shadow-[0_0_10px_var(--color-primary)]" : "bg-zinc-800"
                    )} title={p.name} />
                  ))}
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
              <p className="text-muted-foreground">Release now to abandon auction (-0.1s)</p>
            </div>
            
            <div className="h-[280px] flex items-center justify-center relative"> 
               <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
               </div>
               
               <div className="z-20 text-9xl font-display font-black text-destructive animate-ping absolute pointer-events-none">
                  {countdown}
               </div>

               <div className="z-10">
                 <AuctionButton 
                    onPress={() => {}} 
                    onRelease={handleRelease} 
                    isPressed={players.find(p => p.id === 'p1')?.isHolding}
                    disabled={!players.find(p => p.id === 'p1')?.isHolding} 
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
                  <div className={cn("flex flex-col items-center justify-center p-4 rounded-lg glass-panel border-accent/20 bg-black/40 w-[320px]", isBlackout && "animate-pulse border-destructive/20")}>
                     <span className={cn("text-muted-foreground text-xs tracking-[0.2em] font-display mb-1", isBlackout && "text-destructive")}>
                       {isBlackout ? "SYSTEM ERROR" : "AUCTION TIME"}
                     </span>
                     <div className={cn("text-4xl font-mono text-zinc-700", isBlackout ? "text-destructive/50" : "animate-pulse")}>
                       {activeProtocol === 'SYSTEM_FAILURE' 
                          ? `${Math.floor(Math.random()*99)}:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*9)}` 
                          : isBlackout ? "ERROR" : "??:??.?"}
                     </div>
                  </div>
                )}
             </div>
            
            <div className="h-[280px] flex items-center justify-center">
              <AuctionButton 
                onPress={() => {}} 
                onRelease={handleRelease} 
                isPressed={players.find(p => p.id === 'p1')?.isHolding}
                disabled={!players.find(p => p.id === 'p1')?.isHolding}
                isWaiting={isWaiting} // Pass waiting state
              />
            </div>
            
             <div className="h-[50px] flex flex-col items-center justify-start">
               <div className="text-center text-sm text-muted-foreground font-mono">
                <p>Release to lock in your bid.</p>
                {/* {!showDetails && <p className="text-xs opacity-50 mt-1">Timer is hidden in Hard Mode.</p>} */}
              </div>
             </div>
          </div>
        );

      case 'round_end':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 mt-10 max-w-md mx-auto h-[450px]"
          >
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
          <div className="flex flex-col items-center justify-center space-y-8 mt-10 h-[450px]">
            <h1 className="text-5xl font-display font-bold text-white">GAME OVER</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="col-span-1 md:col-span-3 bg-primary/10 border border-primary/50 p-8 rounded-lg text-center">
                <h3 className="text-primary font-display tracking-widest text-lg mb-2">WINNER</h3>
                <p className="text-6xl font-bold text-white mb-4">{winner.name}</p>
                <div className="flex justify-center gap-8 text-xl">
                  <span>🏆 {winner.tokens}</span>
                  <span className="font-mono">{formatTime(winner.remainingTime)} left</span>
                </div>
              </div>

              {sortedPlayers.slice(1).map((p, i) => (
                <div key={p.id} className={cn("p-6 rounded border bg-card/50", p.id === loser.id ? "border-destructive/50 bg-destructive/5" : "border-white/10")}>
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-2xl font-bold">{i + 2}. {p.name}</span>
                     {p.id === loser.id && <span className="text-destructive text-xs font-bold uppercase border border-destructive px-2 py-0.5 rounded">Eliminated</span>}
                   </div>
                   <div className="space-y-1 text-sm text-zinc-400">
                     <p>Tokens: <span className="text-white">{p.tokens}</span></p>
                     <p>Time: <span className="font-mono text-white">{formatTime(p.remainingTime)}</span></p>
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
      <MusicPlayer />
      <GameOverlay 
        type={overlay?.type || null} 
        message={overlay?.message} 
        subMessage={overlay?.subMessage} 
        onComplete={() => setOverlay(null)} 
      />

      {/* Header Info */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Clock className="text-primary" size={24} />
          <h1 className="font-display font-bold text-xl tracking-wider">REDLINE AUCTION</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-black/40 p-1.5 px-3 rounded-full border border-white/10">
             <div className="flex items-center gap-2">
                <Switch 
                  id="show-details" 
                  checked={showDetails} 
                  onCheckedChange={setShowDetails} 
                />
                <Label htmlFor="show-details" className="text-sm cursor-pointer text-zinc-400 flex items-center gap-1">
                  {showDetails ? <Eye size={12}/> : <EyeOff size={12}/>} 
                  {showDetails ? "Easy" : "Hard"}
                </Label>
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
          </div>
          <Badge variant="outline" className="font-mono text-lg px-4 py-1 border-white/10 bg-white/5">
            ROUND {round} / {totalRounds}
          </Badge>
        </div>
      </div>

      <Dialog open={showProtocolGuide} onOpenChange={setShowProtocolGuide}>
        <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-2xl mb-4 text-destructive flex items-center gap-2">
              <AlertTriangle /> PROTOCOL DATABASE
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              When PROTOCOLS are enabled, random events (35% chance) may trigger at the start of a round.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { name: "DATA BLACKOUT", desc: "All timers and clocks are hidden from the HUD.", type: "Visual" },
              { name: "HIGH STAKES", desc: "Winner receives DOUBLE tokens for this round.", type: "Economy" },
              { name: "SYSTEM FAILURE", desc: "HUD glitches and timers display random scrambled numbers.", type: "Visual" },
              { name: "OPEN HAND", desc: "One player must publicly state they will not bid (Bluffing allowed).", type: "Social" },
              { name: "NOISE CANCEL", desc: "Selected player must make continuous noise for first 15s.", type: "Social" },
              { name: "MUTE PROTOCOL", desc: "Complete silence enforced. Speaking is shunned.", type: "Social" },
              { name: "PRIVATE CHANNEL", desc: "Two players selected to discuss strategy privately.", type: "Social" },
              { name: "NO LOOK", desc: "Players cannot look at screens until they release button.", type: "Physical" },
              { name: "LOCK ON", desc: "Two players must maintain eye contact entire round.", type: "Social" },
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
          </div>
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowProtocolGuide(false)} variant="secondary" className="w-full">
              ACKNOWLEDGE
            </Button>
          </DialogFooter>
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
              />
            ))}
          </div>

          <Separator className="bg-white/10 my-6" />

          <div className="bg-card/30 rounded p-4 border border-white/5 h-[300px] flex flex-col">
            <h3 className="font-display text-muted-foreground text-xs tracking-widest mb-2 flex items-center gap-2">
              <SkipForward size={12} /> GAME LOG
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
