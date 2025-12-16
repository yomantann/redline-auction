import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuctionButtonProps {
  onPress: () => void;
  onRelease: () => void;
  disabled?: boolean;
  isPressed?: boolean;
}

export function AuctionButton({ onPress, onRelease, disabled, isPressed }: AuctionButtonProps) {
  // We use local state for visual feedback immediately, but parent controls logic
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative group w-64 h-64 flex items-center justify-center">
      {/* Outer Rings */}
      <div className={cn(
        "absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-500",
        isPressed ? "scale-90 opacity-50" : "scale-100 opacity-100 animate-pulse"
      )} />
      <div className={cn(
        "absolute inset-4 rounded-full border border-primary/40 transition-all duration-500",
        isPressed ? "scale-95 border-primary/60" : "scale-100 rotate-180"
      )} />

      {/* The Button */}
      <button
        ref={buttonRef}
        className={cn(
          "relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-100 focus:outline-none",
          "bg-gradient-to-b from-zinc-800 to-black border-4",
          disabled ? "border-zinc-800 opacity-50 cursor-not-allowed grayscale" : "cursor-pointer",
          isPressed 
            ? "border-primary shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] scale-95" 
            : "border-zinc-700 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.1)] hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]"
        )}
        onMouseDown={!disabled ? onPress : undefined}
        onMouseUp={!disabled ? onRelease : undefined}
        onMouseLeave={!disabled && isPressed ? onRelease : undefined}
        onTouchStart={!disabled ? onPress : undefined}
        onTouchEnd={!disabled ? onRelease : undefined}
        disabled={disabled}
        data-testid="button-auction"
      >
        <div className={cn(
          "absolute inset-0 rounded-full bg-primary/10 blur-xl transition-opacity duration-300",
          isPressed ? "opacity-40" : "opacity-0"
        )} />
        
        <span className={cn(
          "font-display text-2xl font-bold tracking-widest transition-colors duration-200",
          isPressed ? "text-primary text-glow" : "text-zinc-400"
        )}>
          {isPressed ? "HOLDING" : "PRESS"}
        </span>
        <span className="text-xs text-zinc-600 font-mono mt-2 uppercase tracking-wider">
          {isPressed ? "Release to Bid" : "Hold to Ready"}
        </span>
      </button>

      {/* Particle Effects (Simplified with CSS) */}
      <AnimatePresence>
        {isPressed && (
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
