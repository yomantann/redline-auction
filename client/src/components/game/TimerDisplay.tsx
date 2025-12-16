import React from "react";
import { motion } from "framer-motion";

interface TimerDisplayProps {
  time: number; // in seconds
  isRunning: boolean;
  label?: string;
}

export function TimerDisplay({ time, isRunning, label = "AUCTION TIME" }: TimerDisplayProps) {
  // Simple format for main display (m:ss.d)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return { m, s: s.toString().padStart(2, '0'), ms };
  };

  const { m, s, ms } = formatTime(time);

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg glass-panel border-accent/20 bg-black/40 shadow-[0_0_30px_rgba(0,0,0,0.5)] min-w-[320px]">
      <span className="text-muted-foreground text-sm tracking-[0.2em] font-display mb-2">{label}</span>
      <div className="relative flex items-baseline gap-1">
        <motion.div 
          className="flex items-baseline font-mono font-bold text-foreground tabular-nums tracking-tight text-glow-red"
          animate={{ opacity: isRunning ? [1, 0.9, 1] : 1 }}
          transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
        >
          <span className="text-7xl md:text-8xl">{m}</span>
          <span className="text-4xl md:text-5xl text-muted-foreground mx-1">:</span>
          <span className="text-7xl md:text-8xl">{s}</span>
          <span className="text-4xl md:text-5xl text-muted-foreground mx-1">.</span>
          <span className="text-6xl md:text-7xl">{ms}</span>
        </motion.div>
      </div>
      {isRunning && (
        <div className="h-1 w-full bg-accent/20 mt-4 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent shadow-[0_0_10px_var(--color-accent)]"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}
