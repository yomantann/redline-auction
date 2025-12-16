import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { GameLayout } from "@/components/game/GameLayout";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { AuctionButton } from "@/components/game/AuctionButton";
import { PlayerStats } from "@/components/game/PlayerStats";
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
import { Trophy, AlertTriangle, RefreshCw, LogOut, SkipForward, Clock, Settings, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Game Constants
const TOTAL_ROUNDS = 19;
const INITIAL_TIME = 600.0; // 10 minutes
const COUNTDOWN_SECONDS = 5;

type GamePhase = 'intro' | 'ready' | 'countdown' | 'bidding' | 'round_end' | 'game_end';
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
}

export default function Game() {
  // Game State
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [round, setRound] = useState(1);
  const [currentTime, setCurrentTime] = useState(0.0); // The central auction clock
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showDetails, setShowDetails] = useState(false);
  
  // Players State
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'YOU', isBot: false, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false },
    { id: 'b1', name: 'Alpha (Aggr)', isBot: true, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'aggressive' },
    { id: 'b2', name: 'Beta (Cons)', isBot: true, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'conservative' },
    { id: 'b3', name: 'Gamma (Rand)', isBot: true, tokens: 0, remainingTime: INITIAL_TIME, isEliminated: false, currentBid: null, isHolding: false, personality: 'random' },
  ]);

  const [roundWinner, setRoundWinner] = useState<{ name: string; time: number } | null>(null);
  const [roundLog, setRoundLog] = useState<string[]>([]);

  // Refs for loop management
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // --- Game Loop Logic ---

  // Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'countdown') {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Start Auction
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
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      startTimeRef.current = null;
    }
    
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
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
       setPlayers(prev => prev.map(p => p.id === 'p1' ? { ...p, isHolding: false, currentBid: 0 } : p));
    }
  };

  // Start Round Logic
  const startCountdown = () => {
    setCurrentTime(0);
    setCountdown(COUNTDOWN_SECONDS);
    setPlayers(prev => prev.map(p => ({ ...p, currentBid: null, isHolding: true }))); 
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

    // Update stats
    setPlayers(prev => prev.map(p => {
      let newTime = p.remainingTime;
      let newTokens = p.tokens;
      
      if (p.currentBid !== null && p.currentBid > 0) {
        newTime -= p.currentBid;
      }
      
      if (p.id === winnerId) {
        newTokens += 1;
      }
      
      return { ...p, remainingTime: newTime, tokens: newTokens };
    }));

    setRoundWinner(winnerId ? { name: winnerName!, time: winnerTime } : null);
    
    // Add to log
    const logMsg = winnerId 
      ? `Round ${round}: ${winnerName} won (${winnerTime.toFixed(1)}s)` 
      : `Round ${round}: No winner`;
    setRoundLog(prev => [logMsg, ...prev]);

    if (round >= TOTAL_ROUNDS) {
      setTimeout(() => setPhase('game_end'), 3000);
    }
  };

  const nextRound = () => {
    if (round < TOTAL_ROUNDS) {
      setRound(prev => prev + 1);
      setPhase('ready');
      setPlayers(prev => prev.map(p => ({ ...p, isHolding: false, currentBid: null })));
    }
  };

  const playerIsReady = players.find(p => p.id === 'p1')?.isHolding;

  // Render Helpers
  const renderPhaseContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-8 text-center max-w-2xl mx-auto mt-20"
          >
            <h1 className="text-6xl font-display text-primary text-glow font-bold">TIME AUCTION</h1>
            <p className="text-xl text-muted-foreground">
              You have 10 minutes. 19 Auctions.<br/>
              Bid time to win tokens.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left bg-card/50 p-6 rounded border border-white/5">
               <div className="space-y-2">
                <h3 className="text-primary font-bold">Rules</h3>
                <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                  <li>Hold button to start.</li>
                  <li>Release to bid time.</li>
                  <li>Longest time wins token.</li>
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

            <Button size="lg" onClick={() => setPhase('ready')} className="text-xl px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              ENTER GAME
            </Button>
          </motion.div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center space-y-12 mt-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-display">ROUND {round} / {TOTAL_ROUNDS}</h2>
              <p className="text-muted-foreground animate-pulse">Hold the button to start the round</p>
            </div>
            
            <AuctionButton 
              onPress={handlePress} 
              onRelease={handleRelease} 
              isPressed={playerIsReady}
            />
            
            {playerIsReady && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-primary font-bold tracking-widest">READY CONFIRMED</p>
                <Button variant="outline" onClick={startCountdown} className="border-primary/50 text-primary hover:bg-primary/10">
                  START AUCTION NOW
                </Button>
              </motion.div>
            )}
          </div>
        );

      case 'countdown':
        return (
          <div className="flex flex-col items-center justify-center space-y-12 mt-10">
             <div className="text-center space-y-2">
              <h2 className="text-3xl font-display text-destructive">PREPARE TO BID</h2>
              <p className="text-muted-foreground">Release now to abandon auction</p>
            </div>
            
            <div className="text-9xl font-display font-black text-destructive animate-ping">
              {countdown}
            </div>

            <AuctionButton 
              onPress={() => {}} 
              onRelease={handleRelease} 
              isPressed={players.find(p => p.id === 'p1')?.isHolding}
              disabled={!players.find(p => p.id === 'p1')?.isHolding} 
            />
          </div>
        );

      case 'bidding':
        return (
          <div className="flex flex-col items-center justify-center space-y-12 mt-10">
            {showDetails ? (
              <TimerDisplay time={currentTime} isRunning={true} />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 rounded-lg glass-panel border-accent/20 bg-black/40 h-[200px] w-[300px]">
                 <span className="text-muted-foreground text-sm tracking-[0.2em] font-display mb-4">AUCTION TIME</span>
                 <div className="text-6xl font-mono text-zinc-700 animate-pulse">???.?</div>
              </div>
            )}
            
            <AuctionButton 
              onPress={() => {}} 
              onRelease={handleRelease} 
              isPressed={players.find(p => p.id === 'p1')?.isHolding}
              disabled={!players.find(p => p.id === 'p1')?.isHolding}
            />
            
            <div className="text-center text-sm text-muted-foreground font-mono">
              <p>Release to lock in your bid.</p>
              {!showDetails && <p className="text-xs opacity-50 mt-1">Timer is hidden in Hard Mode.</p>}
            </div>
          </div>
        );

      case 'round_end':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 mt-10 max-w-md mx-auto"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display text-muted-foreground">ROUND {round} RESULTS</h2>
              {roundWinner ? (
                <div className="py-6 space-y-4">
                  <Trophy size={64} className="mx-auto text-primary" />
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{roundWinner.name} WINS</h1>
                    <p className="text-xl font-mono text-primary">{roundWinner.time.toFixed(1)}s</p>
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
                .map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className={p.id === roundWinner?.name ? "text-primary font-bold" : "text-zinc-300"}>
                    {p.name}
                  </span>
                  <span className="font-mono">{p.currentBid?.toFixed(1)}s</span>
                </div>
              ))}
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
          <div className="flex flex-col items-center justify-center space-y-8 mt-10">
            <h1 className="text-5xl font-display font-bold text-white">GAME OVER</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="col-span-1 md:col-span-3 bg-primary/10 border border-primary/50 p-8 rounded-lg text-center">
                <h3 className="text-primary font-display tracking-widest text-lg mb-2">WINNER</h3>
                <p className="text-6xl font-bold text-white mb-4">{winner.name}</p>
                <div className="flex justify-center gap-8 text-xl">
                  <span>🏆 {winner.tokens}</span>
                  <span className="font-mono">{winner.remainingTime.toFixed(1)}s left</span>
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
                     <p>Time: <span className="font-mono text-white">{p.remainingTime.toFixed(1)}s</span></p>
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
          <Clock className="text-primary" size={24} />
          <h1 className="font-display font-bold text-xl tracking-wider">TIME AUCTION</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-black/40 p-1.5 px-3 rounded-full border border-white/10">
            <Switch 
              id="show-details" 
              checked={showDetails} 
              onCheckedChange={setShowDetails} 
            />
            <Label htmlFor="show-details" className="text-xs cursor-pointer text-zinc-400 flex items-center gap-1">
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
                showTime={showDetails && p.id === 'p1'}
                remainingTime={p.remainingTime}
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
