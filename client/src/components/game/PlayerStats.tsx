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
  driverName?: string; // Driver/character name
  driverAbility?: string; // Driver ability description
  isHolding?: boolean; // Added for Peek Logic
  roundImpact?: string; // New field for limit break impact
  impactLogs?: { value: string; reason: string; type: 'loss' | 'gain' | 'neutral' }[]; // Structured logs
  netImpact?: number; // Net of all positive and negative impacts
}

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showTime?: boolean; // Debug only
  remainingTime?: number;
  formatTime?: (seconds: number) => string;
  peekActive?: boolean; // New prop for PEEK ability
  isDoubleTokens?: boolean;
  isSystemFailure?: boolean; // New prop for System Failure scramble
  isScrambled?: boolean; // New prop for Wandering Eye scramble
  children?: React.ReactNode; // Slot for animations
  onClick?: () => void;
  hideDetails?: boolean; // New prop to hide extra details
}

export function PlayerStats({ player, isCurrentPlayer, showTime, remainingTime, formatTime, peekActive, isDoubleTokens, isSystemFailure, isScrambled, children, onClick, hideDetails }: PlayerStatsProps) {
  // Default formatter if not provided
  const format = formatTime || ((s: number) => s.toFixed(1));

  // PEEK LOGIC:
  // If peekActive is true, and this is NOT the current player, and they are holding...
  // Show a visual indicator.
  // Note: player.isHolding must be passed from parent or extended in Player interface
  const showHolding = peekActive && !isCurrentPlayer && player.isHolding;

  // SCRAMBLE LOGIC FOR SYSTEM FAILURE / WANDERING EYE
  // If system failure is active OR this player is scrambled for the viewer, we scramble the time display every render
  const getDisplayTime = () => {
      if (isSystemFailure || isScrambled) {
          return `${Math.floor(Math.random()*99)}:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*9)}`;
      }
      return showTime && remainingTime !== undefined ? format(remainingTime) : "??:??.?";
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
      "relative p-4 rounded-lg border flex flex-col gap-3 transition-all duration-300",
      isCurrentPlayer 
        ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]" 
        : "bg-card/50 border-white/5",
      player.isEliminated && "opacity-80 border-red-500/50 bg-red-950/20",
      onClick && "cursor-pointer hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]"
    )}
    data-testid={`player-card-${player.id}`}
    >
      {/* Animation Container */}
      {children}

      {/* PEEK INDICATOR OVERLAY (WANDERING EYE) */}
      {showHolding && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/90 text-emerald-400 text-lg font-black px-6 py-2 rounded-full shadow-2xl z-50 flex items-center justify-center border-2 border-emerald-500/50 animate-pulse tracking-widest whitespace-nowrap">
             HOLDING
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
          <div className="flex flex-col">
            <span className={cn("font-display font-bold tracking-wide leading-tight", isCurrentPlayer ? "text-foreground" : "text-muted-foreground", player.isEliminated && "text-red-500")}>
              {player.name}
            </span>
            {player.driverName && (
              <span className="text-[10px] text-primary/70 leading-tight" title={player.driverAbility}>
                {player.driverName}
              </span>
            )}
          </div>
          {/* NET IMPACT BADGE */}
          {(player.netImpact ?? 0) !== 0 && (
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded border",
                (player.netImpact ?? 0) > 0 
                  ? "bg-emerald-950/40 border-emerald-500/20" 
                  : "bg-red-950/40 border-red-500/20"
              )} title="Net Impact">
                  <span className={cn(
                    "text-[9px] font-mono font-bold",
                    (player.netImpact ?? 0) > 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {(player.netImpact ?? 0) > 0 ? '+' : ''}{(player.netImpact ?? 0).toFixed(1)}s
                  </span>
              </div>
          )}
        </div>
        {player.hasBidThisRound === false && !player.isEliminated && (
           <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/20">
             BIDDING
           </span>
        )}
        {player.isEliminated && (
            <span className="text-[10px] bg-red-950 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold">
             ELIMINATED
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
            <div className="flex items-center gap-2">
                <span className={cn("font-mono text-xl font-bold", !showTime && "text-zinc-700 blur-[2px]")}>
                  {getDisplayTime()}
                </span>
                {/* SHOW IMPACT */}
                <div className="flex flex-col items-start justify-center gap-0.5 ml-2 min-h-[1.5rem]">
                    {player.impactLogs && player.impactLogs.length > 0 ? (
                        player.impactLogs.map((log, i) => (
                            <span key={i} className={cn(
                                "text-xs font-bold whitespace-nowrap flex items-center gap-1",
                                log.type === 'gain' ? "text-emerald-400" : 
                                log.type === 'loss' ? "text-red-400" : "text-zinc-400"
                            )}>
                                {log.value} 
                                <span className="text-[9px] opacity-70 font-mono uppercase tracking-wider bg-black/40 px-1 rounded border border-white/5">{log.reason}</span>
                            </span>
                        ))
                    ) : player.roundImpact ? (
                         <span className={cn(
                             "text-sm font-bold",
                             player.roundImpact.includes('+') ? "text-emerald-400" : 
                             player.roundImpact.includes('-') ? "text-red-400" : "text-zinc-400"
                         )}>
                             {player.roundImpact}
                         </span>
                    ) : null}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
