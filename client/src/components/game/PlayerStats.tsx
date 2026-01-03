import React from "react";
import { cn } from "@/lib/utils";
import { User, Cpu, Trophy, Clock } from "lucide-react";

interface Player {
  id: string;
  name: string;
  isBot: boolean;
  tokens: number;
  isEliminated: boolean;
  hasBidThisRound?: boolean;
  bidTime?: number; // Only for round result
  characterIcon?: string | React.ReactNode;
  isHolding?: boolean; // Added for Peek Logic
}

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showTime?: boolean; // Debug only
  remainingTime?: number;
  formatTime?: (seconds: number) => string;
  peekActive?: boolean; // New prop for PEEK ability
  isDoubleTokens?: boolean;
}

export function PlayerStats({ player, isCurrentPlayer, showTime, remainingTime, formatTime, peekActive, isDoubleTokens }: PlayerStatsProps) {
  // Default formatter if not provided
  const format = formatTime || ((s: number) => s.toFixed(1));

  // PEEK LOGIC:
  // If peekActive is true, and this is NOT the current player, and they are holding...
  // Show a visual indicator.
  // Note: player.isHolding must be passed from parent or extended in Player interface
  const showHolding = peekActive && !isCurrentPlayer && player.isHolding;

  return (
    <div className={cn(
      "relative p-4 rounded-lg border flex flex-col gap-3 transition-all duration-300",
      isCurrentPlayer 
        ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]" 
        : "bg-card/50 border-white/5",
      player.isEliminated && "opacity-50 grayscale"
    )}
    data-testid={`player-card-${player.id}`}
    >
      {/* PEEK INDICATOR OVERLAY */}
      {showHolding && (
          <div className="absolute -top-3 -right-3 bg-green-500 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-pulse z-50 flex items-center gap-1 border-2 border-white">
             <User size={12} /> HOLDING
          </div>
      )}

      {/* DOUBLE TOKENS INDICATOR */}
      {isDoubleTokens && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20 animate-bounce whitespace-nowrap">
             2x ROUND
          </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/10 bg-black/40",
            isCurrentPlayer ? "border-primary/50" : ""
          )}>
            {typeof player.characterIcon === 'string' ? (
               <img src={player.characterIcon} alt={player.name} className="w-full h-full object-cover" />
             ) : (
               player.characterIcon || (player.isBot ? <Cpu size={16} className="text-zinc-500"/> : <User size={16} className="text-zinc-500"/>)
             )}
          </div>
          <span className={cn("font-display font-bold tracking-wide", isCurrentPlayer ? "text-foreground" : "text-muted-foreground")}>
            {player.name}
          </span>
        </div>
        {player.hasBidThisRound === false && (
           <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/20 animate-pulse">
             BIDDING
           </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tokens</span>
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy size={14} />
            <span className="font-mono text-xl font-bold">{player.tokens}</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Time Left</span>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock size={14} />
            <span className={cn("font-mono text-xl font-bold", !showTime && "text-zinc-700 blur-[2px]")}>
              {showTime && remainingTime !== undefined ? format(remainingTime) : "??:??.?"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
