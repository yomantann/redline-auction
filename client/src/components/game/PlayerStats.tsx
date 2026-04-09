import React from "react";
import { cn } from "@/lib/utils";
import { User, Cpu, Trophy, Clock, Zap, Ghost } from "lucide-react";
import { getBorderStyle, getBackgroundStyle, getDriverSkinUrl, getBorderImageUrl } from "@/lib/cosmeticsStyles";
import type { EquippedCosmetics } from "@shared/schema";

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
  impactLogs?: { value: string; reason: string; type: 'loss' | 'gain' | 'neutral' | 'trophy' | 'forced' }[]; // Structured logs
  netImpact?: number; // Net of all positive and negative impacts
  selectedItem?: string; // Haunted mode: selected item name
  relicConsumed?: boolean; // Haunted mode: relic already consumed
  isGhost?: boolean; // Haunted mode: player converted to ghost on elimination
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
  isHyperClickActive?: boolean; // Shown when Click-Click's HYPER CLICK limit break triggers
  children?: React.ReactNode; // Slot for animations
  onClick?: () => void;
  hideDetails?: boolean; // New prop to hide extra details
  hideEliminated?: boolean; // When true, never show the ELIMINATED badge (used in Haunted mode)
  /** Equipped cosmetics for this player – applies border, background, and driver skin overlay */
  equippedCosmetics?: EquippedCosmetics;
  /** Active driver/character ID for this player – used to gate driver-specific skins */
  currentDriverId?: string;
}

export function PlayerStats({ player, isCurrentPlayer, showTime, remainingTime, formatTime, peekActive, isDoubleTokens, isSystemFailure, isScrambled, isHyperClickActive, children, onClick, hideDetails, hideEliminated, equippedCosmetics, currentDriverId }: PlayerStatsProps) {
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

  // Cosmetic styles (only applied when not eliminated/ghost to preserve game feedback colours)
  const applyCosmetics = !!equippedCosmetics && !player.isEliminated && !player.isGhost;
  const borderStyle = applyCosmetics ? (getBorderStyle(equippedCosmetics) ?? undefined) : undefined;
  const borderImageUrl = applyCosmetics ? getBorderImageUrl(equippedCosmetics) : null;
  const backgroundStyle = applyCosmetics ? (getBackgroundStyle(equippedCosmetics) ?? undefined) : undefined;
  const skinUrl = applyCosmetics ? getDriverSkinUrl(equippedCosmetics, currentDriverId) : null;
  // When an image background is equipped the card uses a photo — add a text-shadow so the
  // player name stays legible against any background image.
  const hasImageBackground = applyCosmetics && !!backgroundStyle?.backgroundImage;
  // Shared text-shadow applied to player name, token count, and time display when an image
  // background is equipped so all labels remain legible on bright backgrounds.
  const bgTextShadow: React.CSSProperties | undefined = hasImageBackground
    ? { textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.7)', color: 'white' }
    : undefined;
  // Border image overlay style: the border PNGs have transparent backgrounds (white areas
  // are alpha=0), so we stretch the image to cover the card exactly.
  const borderImgStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-18px',
    left: '-22px',
    width: 'calc(100% + 200px)',
    height: 'calc(100% + 36px)',
    objectFit: 'fill',
    pointerEvents: 'none',
    borderRadius: 'inherit',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
      "relative p-4 rounded-lg border flex flex-col gap-3 transition-all duration-300 isolate",
      isCurrentPlayer 
        ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]" 
        : "bg-card/50 border-white/5",
      player.isGhost && "opacity-70 border-teal-500/40 bg-teal-950/20",
      !player.isGhost && player.isEliminated && !hideEliminated && "opacity-80 border-red-500/50 bg-red-950/20",
      onClick && "cursor-pointer hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]"
    )}
    style={{ ...backgroundStyle, ...borderStyle, overflow: 'visible' }}
    data-testid={`player-card-${player.id}`}
    >
      {/* Border overlay: PNG has transparent background (white areas are alpha=0),
          so just stretch the image over the card — only the decorative ring is visible. */}
      {borderImageUrl && (
        <img
          src={borderImageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none z-20 rounded-lg"
          style={borderImgStyle}
          loading="eager"
          decoding="async"
        />
      )}
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

      {/* HYPER CLICK LIMIT BREAK INDICATOR */}
      {isHyperClickActive && (
          <div className="absolute -top-2 right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20 animate-bounce whitespace-nowrap flex items-center gap-1">
             <Zap size={8} /> ×2 🏆
          </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/10 bg-black/40 relative",
            isCurrentPlayer ? "border-primary/50" : "",
            player.isGhost && "border-teal-500/40 opacity-60"
          )}>
            {typeof player.characterIcon === 'string' ? (
               <img 
                 src={player.characterIcon} 
                 alt={player.name} 
                 className={cn("w-full h-full object-cover", player.isGhost && "grayscale opacity-70")}
                 loading="lazy" 
                 decoding="async"
                 onError={(e) => { 
                   const el = e.target as HTMLImageElement;
                   el.style.display = 'none';
                   const parent = el.parentElement;
                   if (parent && !parent.querySelector('svg')) {
                     const fallback = document.createElement('span');
                     fallback.className = 'text-zinc-500 text-xs font-bold';
                     fallback.textContent = player.name.charAt(0).toUpperCase();
                     parent.appendChild(fallback);
                   }
                 }}
               />
             ) : (
               player.characterIcon || (player.isBot ? <Cpu size={16} className="text-zinc-500"/> : <User size={16} className="text-zinc-500"/>)
             )}
            {/* Driver skin overlay */}
            {skinUrl && (
              <img
                src={skinUrl}
                alt="skin"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-full"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className="flex flex-col">
            <span className={cn("font-display font-bold tracking-wide leading-tight", isCurrentPlayer ? "text-foreground" : "text-muted-foreground", player.isGhost && "text-teal-400", !player.isGhost && player.isEliminated && !hideEliminated && "text-red-500")}
              style={bgTextShadow}
            >
              {player.name}
            </span>
            {player.driverName && (
              <span className="text-[10px] text-primary/70 leading-tight" title={player.driverAbility}>
                {player.driverName}
              </span>
            )}
            {player.selectedItem && (
              <span className={cn("text-[10px] leading-tight cursor-default", player.relicConsumed ? "text-zinc-600 line-through" : "text-teal-400/70")} title={player.relicConsumed ? "Relic consumed" : "Haunted Item"}>
                🔮 {player.selectedItem}{player.relicConsumed ? ' (used)' : ''}
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
        {player.hasBidThisRound === false && !player.isEliminated && !player.isGhost && (
           <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/20">
             BIDDING
           </span>
        )}
        {player.isGhost && (
            <span className="text-[10px] bg-teal-950 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20 font-bold flex items-center gap-1">
              <Ghost size={10} /> GHOST
           </span>
        )}
        {!player.isGhost && player.isEliminated && !hideEliminated && (
            <span className="text-[10px] bg-red-950 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold">
             ELIMINATED
           </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider"
            style={bgTextShadow}
          >Trophies</span>
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy size={14} />
            <span className="font-mono text-xl font-bold"
              style={bgTextShadow}
            >{player.tokens}</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider"
            style={bgTextShadow}
          >Time Left</span>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock size={14} />
            <div className="flex items-center gap-2">
                <span className={cn("font-mono text-xl font-bold", !showTime && "text-zinc-700 blur-[2px]")}
                  style={bgTextShadow}
                >
                  {getDisplayTime()}
                </span>
                {/* SHOW IMPACT */}
                <div className="flex flex-col items-start justify-center gap-0.5 ml-2 min-h-[1.5rem]">
                    {player.impactLogs && player.impactLogs.length > 0 ? (
                        player.impactLogs.map((log, i) => (
                            <span key={i} className={cn(
                                "text-xs font-bold whitespace-nowrap flex items-center gap-1",
                                log.type === 'gain'   ? "text-emerald-400" :
                                log.type === 'loss'   ? "text-red-400"     :
                                log.type === 'trophy' ? "text-amber-400"   :
                                log.type === 'forced' ? "text-orange-400"  :
                                "text-zinc-400"
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
