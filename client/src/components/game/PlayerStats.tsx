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
}

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showTime?: boolean; // Debug only
  remainingTime?: number;
}

export function PlayerStats({ player, isCurrentPlayer, showTime, remainingTime }: PlayerStatsProps) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-full",
            isCurrentPlayer ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400"
          )}>
            {player.isBot ? <Cpu size={16} /> : <User size={16} />}
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
        
        {/* Only show remaining time for self (if allowed by game rules, but prompt says hidden) or debug */}
        {/* Prompt: "Each player's holding time is not disclosed to anyone, including themselves" */}
        {/* So we technically should HIDE this even for the player. But for prototype usability, I'll add a 'cheat' peek or just show ??? */}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Time Left</span>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock size={14} />
            <span className="font-mono text-xl font-bold">
              {showTime && remainingTime !== undefined ? remainingTime.toFixed(1) : "???.?"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
