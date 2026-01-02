import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, AlertTriangle, Play, Skull } from "lucide-react";

export type OverlayType = "round_start" | "round_win" | "round_draw" | "eliminated" | "game_over" | null;

interface GameOverlayProps {
  type: OverlayType;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

export function GameOverlay({ type, message, subMessage, onComplete }: GameOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) setTimeout(onComplete, 500); // Wait for exit animation
      }, 2000); // Duration
      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  const variants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.1, filter: "blur(10px)" }
  };

  const getIcon = () => {
    switch (type) {
      case "round_start": return <Play size={64} className="text-primary" />;
      case "round_win": return <Trophy size={64} className="text-primary" />;
      case "round_draw": return <AlertTriangle size={64} className="text-muted-foreground" />;
      case "eliminated": return <Skull size={64} className="text-destructive" />;
      case "game_over": return <Trophy size={64} className="text-primary" />;
      default: return null;
    }
  };

  const getColor = () => {
    switch (type) {
      case "round_start": return "text-primary border-primary/20 bg-primary/10";
      case "round_win": return "text-primary border-primary/20 bg-primary/10";
      case "round_draw": return "text-muted-foreground border-white/10 bg-black/50";
      case "eliminated": return "text-destructive border-destructive/20 bg-destructive/10";
      case "game_over": return "text-primary border-primary/20 bg-primary/10";
      default: return "text-white";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
          <motion.div
            className={`flex flex-col items-center justify-center p-8 rounded-xl border backdrop-blur-xl shadow-2xl ${getColor()} min-w-[300px] text-center`}
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
              className="mb-4"
            >
              {getIcon()}
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-display font-bold mb-2 uppercase tracking-widest text-glow"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.h2>
            
            {subMessage && (
              <motion.p 
                className="text-lg font-mono opacity-80"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
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
