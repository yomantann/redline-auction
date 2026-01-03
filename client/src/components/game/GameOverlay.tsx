import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, AlertTriangle, Play, Skull, Zap, ThumbsDown, Smile, TrendingUp, ShieldAlert, BadgeCheck } from "lucide-react";

export type OverlayType = 
  | "round_start" 
  | "round_win" 
  | "round_draw" 
  | "eliminated" 
  | "game_over" 
  | "fake_calm"
  | "undercut"
  | "genius_move"
  | "easy_w"
  | "time_out"
  | "comeback_hope"
  | "smug_confidence"
  | "bad_judgment"
  | "zero_bid"
  | "protocol_alert"
  | "ability_trigger"
  | null;

interface GameOverlayProps {
  type: OverlayType;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

export function GameOverlay({ type, message, subMessage, onComplete }: GameOverlayProps) {
  
  useEffect(() => {
    if (type) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  const variants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.1, filter: "blur(10px)" }
  };

  const getIcon = () => {
    switch (type) {
      case "round_start": return <Play size={48} className="text-primary" />;
      case "round_win": return <Trophy size={48} className="text-primary" />;
      case "round_draw": return <AlertTriangle size={48} className="text-muted-foreground" />;
      case "eliminated": return <Skull size={48} className="text-destructive" />;
      case "game_over": return <Trophy size={48} className="text-primary" />;
      
      case "fake_calm": return <Zap size={48} className="text-amber-400" />;
      case "undercut": return <ShieldAlert size={48} className="text-orange-500" />;
      case "genius_move": return <BadgeCheck size={48} className="text-cyan-400" />;
      case "easy_w": return <Smile size={48} className="text-green-400" />;
      case "time_out": return <Skull size={48} className="text-destructive" />;
      case "comeback_hope": return <TrendingUp size={48} className="text-emerald-400" />;
      case "smug_confidence": return <Trophy size={48} className="text-purple-400" />;
      case "bad_judgment": return <ThumbsDown size={48} className="text-red-400" />;
      case "zero_bid": return <AlertTriangle size={48} className="text-yellow-200" />;
      case "protocol_alert": return <AlertTriangle size={48} className="text-destructive animate-pulse" />;
      case "ability_trigger": return <Zap size={48} className="text-blue-400" />;
      
      default: return null;
    }
  };

  const getColor = () => {
    switch (type) {
      case "round_start": 
      case "round_win": 
      case "game_over":
        return "text-primary border-primary/20 bg-black/80";
        
      case "fake_calm": return "text-amber-400 border-amber-500/20 bg-black/80";
      case "undercut": return "text-orange-500 border-orange-500/20 bg-black/80";
      case "genius_move": return "text-cyan-400 border-cyan-500/20 bg-black/80";
      case "easy_w": return "text-green-400 border-green-500/20 bg-black/80";
      case "time_out": 
      case "eliminated":
      case "protocol_alert":
        return "text-destructive border-destructive/20 bg-black/80";
      case "ability_trigger": return "text-blue-400 border-blue-500/20 bg-black/80";
      case "comeback_hope": return "text-emerald-400 border-emerald-500/20 bg-black/80";
      case "smug_confidence": return "text-purple-400 border-purple-500/20 bg-black/80";
      case "bad_judgment": return "text-red-400 border-red-500/20 bg-black/80";
      case "zero_bid": return "text-yellow-200 border-yellow-200/20 bg-black/80";
      
      case "round_draw": 
      default: 
        return "text-muted-foreground border-white/10 bg-black/80";
    }
  };

  return (
    <AnimatePresence>
      {type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-8">
          <motion.div 
            key="overlay-content" // Force re-render if needed, but framer handles it
            className={`flex flex-col items-center justify-center py-6 px-12 rounded-2xl border backdrop-blur-xl shadow-2xl ${getColor()} min-w-[400px] text-center pointer-events-auto`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mb-2"
            >
              {getIcon()}
            </motion.div>
            
            <motion.h2 
              className="text-2xl font-display font-bold mb-1 uppercase tracking-widest text-glow"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {message}
            </motion.h2>
            
            {subMessage && (
              <motion.p 
                className="text-sm font-mono opacity-80"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {subMessage}
              </motion.p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
