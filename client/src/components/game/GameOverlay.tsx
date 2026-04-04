import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, AlertTriangle, Play, Skull, Zap, TrendingUp, Crosshair, Flame, Hourglass, X, PartyPopper, Martini, Scale, Lightbulb, Sparkles, Meh, Award, Lock, Crown, HeartPulse, Ghost, Orbit, Rocket, History, Bug, Bird, Axe, Waves, CircleDot, Swords, BatteryFull, Timer, Repeat2, Star, Shield, Gauge, Target, BarChart3, Bomb, Anchor } from "lucide-react";

export type OverlayType = 
  | "round_start" 
  | "round_win" 
  | "game_over" 
  | "fake_calm"
  | "genius_move"
  | "easy_w"
  | "time_out" // aka eliminated too
  | "deadlock_sync"
  | "last_one_standing"
  | "comeback_hope"
  | "smug_confidence"
  | "zero_bid" //aka AFK
  | "protocol_alert"
  | "ability_trigger"
  | "haunted_relic"
  | "precision_strike"
  | "overkill"
  | "clutch_play"
  | "late_panic"
  | "hidden_67"
  | "hidden_redline_reversal"
  | "hidden_deja_bid"
  | "hidden_patch_notes"
  | "hidden_redemption"
  | "hidden_nail_in_the_coffin"
  | "mirror_match"
  | "social_event" 
  | "bio_event"    
  | "bonus_trophy"
  | "persistent_ghost"
  // ── 25 new moment flags ──────────────────────────────────────────────────
  | "marathon_bid"          // bid > 90s
  | "overtime_legend"       // bid > 130s
  | "speed_round"           // won with bid ≤ 2s
  | "high_noon"             // bid within 0.5s of 60s
  | "photo_finish"          // won with margin < 0.2s
  | "blowout"               // won with margin > 30s
  | "glass_cannon"          // won with < 5s remaining
  | "banked"                // won with > 150s remaining
  | "zero_hour"             // won when starting time ≤ 20s
  | "double_down"           // won 2 consecutive rounds
  | "triple_crown"          // won 3 consecutive rounds
  | "dominator"             // won 4+ rounds this game
  | "no_mercy"              // won in a duel (2 non-eliminated players)
  | "first_blood_flag"      // first elimination of the game
  | "final_survivor"        // reached final round without being eliminated
  | "protocol_breaker"      // won despite a harmful protocol
  | "power_surge"           // won while leading in both tokens AND time
  | "comeback_arc"          // won while trailing in tokens
  | "time_warp"             // net time gain this round was positive
  | "bounty"                // beat the current token leader (MP)
  | "hidden_lucky_seven"    // bid within 0.2s of 7.0s
  | "hidden_full_house"     // all non-eliminated players bid within 5s
  | "hidden_efficiency"     // remaining > 3× bid after winning
  | "hidden_early_dominator" // won rounds 1, 2 AND 3
  | "hidden_veteran"        // still non-eliminated at round 8+
  | null;

interface OverlayItem {
  id: string;
  type: OverlayType;
  message?: string;
  subMessage?: string;
  duration?: number;
}

interface GameOverlayProps {
  overlays: OverlayItem[];
  onDismiss: (id: string) => void;
  inline?: boolean;
}

export function GameOverlay({ overlays, onDismiss, inline = false }: GameOverlayProps) {
  
  const getIcon = (type: OverlayType) => {
    switch (type) {
      case "round_start": return <Play size={40} className="text-primary" />;
      case "round_win": return <Trophy size={40} className="text-primary" />;
      case "game_over": return <Trophy size={48} className="text-primary" />;
      
      case "fake_calm": return <Meh size={48} className="text-amber-400" />;
      case "genius_move": return <Lightbulb size={48} className="text-cyan-400" />;
      case "easy_w": return <Sparkles size={48} className="text-teal-400" />;
      case "time_out": return <Skull size={48} className="text-red-800" />;
      case "deadlock_sync": return <Lock size={48} className="text-zinc-400" />;
      case "last_one_standing": return <Award size={48} className="text-pink-600" />;
      case "comeback_hope": return <HeartPulse size={48} className="text-teal-600" />;
      case "smug_confidence": return <Crown size={48} className="text-purple-400" />;
      case "zero_bid": return <Ghost size={48} className="text-amber-600" />;
      case "protocol_alert": return <AlertTriangle size={48} className="text-red-400" />;
      case "ability_trigger": return <Zap size={48} className="text-blue-400" />;
      case "haunted_relic": return null;
      
      case "precision_strike": return <Crosshair size={48} className="text-blue-600" />;
      case "overkill": return <Flame size={48} className="text-red-500" />;
      case "clutch_play": return <Hourglass size={48} className="text-lime-500" />;
      case "late_panic": return <TrendingUp size={48} className="text-orange-500" />;
      case "hidden_67": return <Orbit size={48} className="text-lime-300" />;
      case "hidden_redline_reversal": return <Rocket size={48} className="text-rose-400" />;
      case "hidden_deja_bid": return <History size={48} className="text-sky-300" />;
      case "hidden_patch_notes": return <Bug size={48} className="text-amber-200" />;
      case "hidden_redemption": return <Bird size={48} className="text-pink-400" />;
      case "hidden_nail_in_the_coffin": return <Axe size={48} className="text-rose-300" />;
      
      case "mirror_match": return <Scale size={48} className="text-[#d2b48c]" />;
      
      case "social_event": return <PartyPopper size={40} className="text-purple-400" />;
      case "bio_event": return <Martini size={40} className="text-orange-400" />;
      case "bonus_trophy": return <Trophy size={48} className="text-yellow-400" />;
      case "persistent_ghost": return <Ghost size={48} className="text-teal-300" />;

      // ── New moment flag icons ─────────────────────────────────────────────
      case "marathon_bid":        return <Waves size={48} className="text-orange-400" />;
      case "overtime_legend":     return <Flame size={48} className="text-rose-500" />;
      case "speed_round":         return <Rocket size={48} className="text-cyan-400" />;
      case "high_noon":           return <CircleDot size={48} className="text-yellow-500" />;
      case "photo_finish":        return <Crosshair size={48} className="text-fuchsia-400" />;
      case "blowout":             return <Swords size={48} className="text-red-400" />;
      case "glass_cannon":        return <Skull size={48} className="text-orange-300" />;
      case "banked":              return <BatteryFull size={48} className="text-emerald-400" />;
      case "zero_hour":           return <Timer size={48} className="text-red-600" />;
      case "double_down":         return <Repeat2 size={48} className="text-indigo-400" />;
      case "triple_crown":        return <Crown size={48} className="text-yellow-400" />;
      case "dominator":           return <Star size={48} className="text-yellow-500" />;
      case "no_mercy":            return <Swords size={48} className="text-red-600" />;
      case "first_blood_flag":    return <Skull size={48} className="text-red-500" />;
      case "final_survivor":      return <Shield size={48} className="text-emerald-300" />;
      case "protocol_breaker":    return <Shield size={48} className="text-sky-400" />;
      case "power_surge":         return <Gauge size={48} className="text-lime-400" />;
      case "comeback_arc":        return <TrendingUp size={48} className="text-teal-400" />;
      case "time_warp":           return <Zap size={48} className="text-violet-400" />;
      case "bounty":              return <Target size={48} className="text-amber-500" />;
      case "hidden_lucky_seven":  return <Orbit size={48} className="text-green-300" />;
      case "hidden_full_house":   return <BarChart3 size={48} className="text-pink-300" />;
      case "hidden_efficiency":   return <Gauge size={48} className="text-cyan-300" />;
      case "hidden_early_dominator": return <Bomb size={48} className="text-rose-300" />;
      case "hidden_veteran":      return <Anchor size={48} className="text-zinc-300" />;

      default: return null;
    }
  };

  const getColor = (type: OverlayType) => {
    switch (type) {
      case "round_start": 
      case "round_win": 
      case "game_over":
        return "text-primary border-primary/20 bg-black/80";
        
      case "fake_calm": return "text-amber-400 border-amber-500/20 bg-black/80";
      case "late_panic": return "text-orange-500 border-orange-500/20 bg-black/80";
      case "genius_move": return "text-cyan-400 border-cyan-500/20 bg-black/80";
      case "easy_w": return "text-teal-400 border-teal-400/20 bg-black/80";
      case "time_out": return "text-red-800 border-red-800/20 bg-black/80";
      case "deadlock_sync": return "text-zinc-400 border-zinc-400/20 bg-black/80";
      case "last_one_standing": return "text-pink-600 border-pink-600/20 bg-black/80";
      case "protocol_alert":
        return "text-red-400 border-red-500/20 bg-black/80";
      case "ability_trigger": return "text-blue-400 border-blue-500/20 bg-black/80";
      case "haunted_relic": return "text-teal-300 border-teal-500/30 bg-black/85 shadow-[0_0_20px_rgba(45,212,191,0.15)]";
      case "comeback_hope": return "text-teal-600 border-teal-600/20 bg-black/80";
      case "smug_confidence": return "text-purple-400 border-purple-500/20 bg-black/80";
      case "zero_bid": return "text-amber-600 border-amber-600/20 bg-black/80";
      
      case "precision_strike": return "text-blue-600 border-blue-600/20 bg-black/80";
      case "overkill": return "text-red-500 border-red-500/20 bg-black/80";
      case "clutch_play": return "text-lime-500 border-lime-500/20 bg-black/80";
      
      // Hidden Flags - Special Styling
      case "hidden_67": 
      case "hidden_redline_reversal":
      case "hidden_deja_bid":
      case "hidden_patch_notes":
      case "hidden_redemption":
      case "hidden_nail_in_the_coffin":
      case "hidden_lucky_seven":
      case "hidden_full_house":
      case "hidden_efficiency":
      case "hidden_early_dominator":
      case "hidden_veteran":
        return "text-pink-400 border-pink-500/50 bg-black/95 shadow-[0_0_30px_rgba(236,72,153,0.3)]";

      case "mirror_match": return "text-[#d2b48c] border-[#d2b48c]/20 bg-black/80";

      case "social_event": return "text-purple-400 border-purple-500/20 bg-black/90";
      case "bio_event": return "text-orange-400 border-orange-500/20 bg-black/90";
      case "bonus_trophy": return "text-yellow-400 border-yellow-500/50 bg-black/95 shadow-[0_0_30px_rgba(234,179,8,0.3)]";
      case "persistent_ghost": return "text-teal-300 border-teal-500/40 bg-black/90 shadow-[0_0_20px_rgba(45,212,191,0.2)]";

      // New moment flags
      case "marathon_bid":         return "text-orange-400 border-orange-500/20 bg-black/80";
      case "overtime_legend":      return "text-rose-500 border-rose-500/30 bg-black/85 shadow-[0_0_20px_rgba(244,63,94,0.2)]";
      case "speed_round":          return "text-cyan-400 border-cyan-500/20 bg-black/80";
      case "high_noon":            return "text-yellow-500 border-yellow-500/20 bg-black/80";
      case "photo_finish":         return "text-fuchsia-400 border-fuchsia-500/30 bg-black/85 shadow-[0_0_20px_rgba(232,121,249,0.2)]";
      case "blowout":              return "text-red-400 border-red-500/20 bg-black/80";
      case "glass_cannon":         return "text-orange-300 border-orange-400/20 bg-black/80";
      case "banked":               return "text-emerald-400 border-emerald-500/20 bg-black/80";
      case "zero_hour":            return "text-red-600 border-red-700/20 bg-black/80";
      case "double_down":          return "text-indigo-400 border-indigo-500/20 bg-black/80";
      case "triple_crown":         return "text-yellow-400 border-yellow-500/30 bg-black/85 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
      case "dominator":            return "text-yellow-500 border-yellow-600/30 bg-black/85 shadow-[0_0_25px_rgba(234,179,8,0.25)]";
      case "no_mercy":             return "text-red-600 border-red-700/20 bg-black/80";
      case "first_blood_flag":     return "text-red-500 border-red-600/20 bg-black/80";
      case "final_survivor":       return "text-emerald-300 border-emerald-400/30 bg-black/85 shadow-[0_0_20px_rgba(52,211,153,0.2)]";
      case "protocol_breaker":     return "text-sky-400 border-sky-500/20 bg-black/80";
      case "power_surge":          return "text-lime-400 border-lime-500/20 bg-black/80";
      case "comeback_arc":         return "text-teal-400 border-teal-500/20 bg-black/80";
      case "time_warp":            return "text-violet-400 border-violet-500/20 bg-black/80";
      case "bounty":               return "text-amber-500 border-amber-600/20 bg-black/80";
      
      default: 
        return "text-muted-foreground border-white/10 bg-black/80";
    }
  };

  return (
    <div className={inline ? "absolute left-1/2 -translate-x-1/2 top-full mt-4 z-50 flex flex-col items-center justify-start pointer-events-none w-max gap-2" : "fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none p-4 gap-4"}>
      <AnimatePresence>
        {overlays.map((item) => (
          <motion.div 
            key={item.id}
            className={`flex flex-col items-center justify-center py-4 px-6 sm:py-6 sm:px-10 rounded-2xl border backdrop-blur-xl shadow-2xl ${getColor(item.type)} w-[min(92vw,420px)] text-center pointer-events-auto cursor-pointer relative`}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={() => onDismiss(item.id)}
            layout // Enable layout animation for smooth stacking
          >
            {/* Dismiss Button */}
            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(item.id);
              }}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
              title="Dismiss"
            >
              <X size={16} />
            </button>

            <div className="mb-2">
              {getIcon(item.type)}
            </div>
            
            {/* Header for Hidden Flags */}
            {(item.type?.startsWith('hidden_') || item.type === 'hidden_patch_notes') && (
                <div className="mb-2 text-xs font-bold tracking-[0.2em] text-pink-500 uppercase animate-pulse">
                    HIDDEN MOMENT FLAG
                </div>
            )}

            {/* Header for Bonus Trophy */}
            {item.type === 'bonus_trophy' && (
                <div className="mb-2 text-xs font-bold tracking-[0.2em] text-yellow-500 uppercase animate-pulse">
                    {item.subMessage?.split('\n')[0] || 'BONUS TROPHY AWARDED'}
                </div>
            )}

            <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 uppercase tracking-widest text-glow">
              {item.message}
            </h2>
            
            {item.subMessage && (
              <p className="text-xs sm:text-sm font-mono opacity-80 max-w-[340px] whitespace-pre-wrap">
                {item.type === 'bonus_trophy'
                  ? item.subMessage.split('\n').slice(1).join('\n')
                  : item.subMessage}
              </p>
            )}

            <p className="text-[10px] text-zinc-500 mt-3 uppercase tracking-widest opacity-50">
              Click to dismiss
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
