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
  Shield, MousePointer2, Snowflake, Rocket, Brain, Zap, Megaphone, Flame, TrendingUp, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Game Constants
const TOTAL_ROUNDS = 9; 
const INITIAL_TIME = 300.0;
const COUNTDOWN_SECONDS = 3; 
const READY_HOLD_DURATION = 3.0; 

type GamePhase = 'intro' | 'character_select' | 'ready' | 'countdown' | 'bidding' | 'round_end' | 'game_end';
type BotPersonality = 'balanced' | 'aggressive' | 'conservative' | 'random';

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
  characterIcon?: React.ReactNode;
}

interface Character {
  id: string;
  name: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const CHARACTERS: Character[] = [
  { id: 'harambe', name: 'Guardian H', title: 'The Eternal Watcher', icon: <Shield size={32} />, description: 'Stoic protection against bad bids.', color: 'text-zinc-400' },
  { id: 'popcat', name: 'Click-Click', title: 'The Glitch', icon: <MousePointer2 size={32} />, description: 'Hyperactive timing precision.', color: 'text-pink-400' },
  { id: 'winter', name: 'Frost Protocol', title: 'The Disciplined', icon: <Snowflake size={32} />, description: 'Cold, calculated efficiency.', color: 'text-cyan-400' },
  { id: 'doge', name: 'Shiba Prime', title: 'The Moonwalker', icon: <Rocket size={32} />, description: 'Chaotic luck and high variance.', color: 'text-yellow-400' },
  { id: 'pepe', name: 'Sadman Logic', title: 'The Analyst', icon: <Brain size={32} />, description: 'Feels bad, plays smart.', color: 'text-green-500' },
  { id: 'nyan', name: 'Rainbow Dash', title: 'The Speeder', icon: <Zap size={32} />, description: 'Neon trails and fast reactions.', color: 'text-purple-400' },
  { id: 'karen', name: 'The Accuser', title: 'The Aggressor', icon: <Megaphone size={32} />, description: 'Loud and disruptive tactics.', color: 'text-red-400' },
  { id: 'fine', name: 'Inferno Calm', title: 'The Survivor', icon: <Flame size={32} />, description: 'Perfectly chill in chaos.', color: 'text-orange-500' },
  { id: 'bf', name: 'Wandering Eye', title: 'The Opportunist', icon: <Eye size={32} />, description: 'Always looking for a better deal.', color: 'text-blue-400' },
  { id: 'stonks', name: 'Market Maker', title: 'The Strategist', icon: <TrendingUp size={32} />, description: 'Stonks only go up.', color: 'text-emerald-400' },
];

export default function Game() {
  // Game State
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [round, setRound] = useState(1);
  const [currentTime, setCurrentTime] = useState(0.0); // The central auction clock
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showDetails, setShowDetails] = useState(false);
  const [readyHoldTime, setReadyHoldTime] = useState(0);
  
  // Overlay State
  const [overlay, setOverlay] = useState<{ type: OverlayType; message?: string; subMessage?: string } | null>(null);
  
  // Players State
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false },
    { id: 'b1', name: 'Alpha (Aggr)', isBot: true, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'aggressive' },
    { id: 'b2', name: 'Beta (Cons)', isBot: true, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'conservative' },
    { id: 'b3', name: 'Gamma (Rand)', isBot: true, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'random' },
  ]);

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const [roundWinner, setRoundWinner] = useState<{ name: string; time: number } | null>(null);
  const [roundLog, setRoundLog] = useState<string[]>([]);

  // Refs for loop management
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const readyStartTimeRef = useRef<number | null>(null);

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
            // Trigger Overlay
            setOverlay({ type: "round_start", message: "AUCTION START" });
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
        const deltaTime = (time - startTimeRef.current) / 1000;
        
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
      
      if (p.currentBid !== null && p.currentBid > 0) {
        newTime -= p.currentBid;
      }
      
      if (p.id === winnerId) {
        newTokens += 1;
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
       if (round === 1) {
         overlayType = "smug_confidence";
         overlayMsg = "SMUG CONFIDENCE";
         overlaySub = `${winnerName} takes the lead!`;
       }
       // 2. Fake Calm (Margin >= 15s)
       else if (secondPlayer && margin >= 15) {
         overlayType = "fake_calm";
         overlayMsg = "FAKE CALM";
         overlaySub = `Won by ${margin.toFixed(1)}s!`;
       }
       // 3. Genius Move (Margin <= 5s)
       else if (secondPlayer && margin <= 5) {
         overlayType = "genius_move";
         overlayMsg = "GENIUS MOVE";
         overlaySub = `Won by just ${margin.toFixed(1)}s`;
       }
       // 4. Easy W (Bid < 20s)
       else if (winnerBid < 20) {
         overlayType = "easy_w";
         overlayMsg = "EASY W";
         overlaySub = `Won with only ${winnerBid.toFixed(1)}s`;
       }
       // 5. Comeback Hope (Winner was last in tokens before this win)
       // We check tokens BEFORE this win. 
       else {
         const winnerTokensBefore = players.find(p => p.id === winnerId)?.tokens || 0;
         const minTokens = Math.min(...players.map(p => p.tokens));
         if (winnerTokensBefore === minTokens && players.some(p => p.tokens > winnerTokensBefore)) {
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
    
    // Add to log
    const logMsg = winnerId 
      ? `Round ${round}: ${winnerName} won (${formatTime(winnerTime)})` 
      : `Round ${round}: No winner`;
    setRoundLog(prev => [logMsg, ...prev]);

    if (round >= TOTAL_ROUNDS || players.filter(p => !p.isEliminated && p.remainingTime > 0).length <= 1) {
       // Game End condition
       setTimeout(() => {
        setPhase('game_end');
        setOverlay({ type: "game_over", message: "GAME OVER" });
      }, 3000);
    }
  };

  const nextRound = () => {
    if (round < TOTAL_ROUNDS) {
      setRound(prev => prev + 1);
      setPhase('ready');
      setPlayers(prev => prev.map(p => ({ ...p, isHolding: false, currentBid: null })));
      setReadyHoldTime(0);
    }
  };

  const selectCharacter = (char: Character) => {
    setSelectedCharacter(char);
    setPlayers(prev => prev.map(p => {
      if (p.id === 'p1') {
        return { ...p, name: char.name, characterIcon: char.icon };
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
              You have 5 minutes. 9 Auctions.<br/>
              Bid time to win tokens.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left bg-card/50 p-6 rounded border border-white/5">
               <div className="space-y-2">
                <h3 className="text-primary font-bold">Rules</h3>
                <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                  <li>Hold button to start.</li>
                  <li>Release to bid time.</li>
                  <li>Longest time wins token.</li>
                  <li>Early release costs 0.1s.</li>
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
            
            <div className="flex items-center gap-2 bg-black/40 p-3 rounded-full border border-white/10">
              <Switch 
                id="show-details-intro" 
                checked={showDetails} 
                onCheckedChange={setShowDetails} 
              />
              <Label htmlFor="show-details-intro" className="text-sm cursor-pointer text-zinc-400">
                Easy Mode (Show Timer & Clock)
              </Label>
            </div>

            <Button size="lg" onClick={() => setPhase('character_select')} className="text-xl px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              ENTER GAME
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
                  className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-black/40 hover:border-primary/50 transition-colors group text-center"
                >
                  <div className={cn("p-4 rounded-full bg-white/5 mb-3 group-hover:bg-white/10 transition-colors", char.color)}>
                    {char.icon}
                  </div>
                  <h3 className="font-bold text-white mb-1">{char.name}</h3>
                  <p className="text-xs text-primary/80 uppercase tracking-wider mb-2 font-display">{char.title}</p>
                  <p className="text-xs text-zinc-500 leading-tight">{char.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center h-[450px]">
            <div className="h-[100px] flex flex-col items-center justify-center space-y-2">
              <h2 className="text-3xl font-display">ROUND {round} / {TOTAL_ROUNDS}</h2>
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
        return (
          <div className="flex flex-col items-center justify-center h-[450px]">
             {/* Timer Area */}
             <div className="h-[100px] flex items-center justify-center mb-4">
                {showDetails && currentTime <= 10 ? (
                  <TimerDisplay time={currentTime} isRunning={true} />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg glass-panel border-accent/20 bg-black/40 w-[320px]">
                     <span className="text-muted-foreground text-xs tracking-[0.2em] font-display mb-1">AUCTION TIME</span>
                     <div className="text-4xl font-mono text-zinc-700 animate-pulse">??:??.?</div>
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
                <div className="py-6 space-y-4">
                  <Trophy size={64} className="mx-auto text-primary" />
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{roundWinner.name} WINS</h1>
                    <p className="text-xl font-mono text-primary">{formatTime(roundWinner.time)}</p>
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
          <div className="flex items-center gap-2 bg-black/40 p-1.5 px-3 rounded-full border border-white/10">
            <Switch 
              id="show-details" 
              checked={showDetails} 
              onCheckedChange={setShowDetails} 
            />
            <Label htmlFor="show-details" className="text-sm cursor-pointer text-zinc-400 flex items-center gap-1">
              {showDetails ? <Eye size={12}/> : <EyeOff size={12}/>} 
              {showDetails ? "Easy Mode" : "Hard Mode"}
            </Label>
          </div>
          <Badge variant="outline" className="font-mono text-lg px-4 py-1 border-white/10 bg-white/5">
            ROUND {round} / {TOTAL_ROUNDS}
          </Badge>
        </div>
      </div>

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
