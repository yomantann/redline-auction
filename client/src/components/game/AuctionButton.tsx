import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuctionButtonProps {
  onPress: () => void;
  onRelease: () => void;
  disabled?: boolean;
  isPressed?: boolean;
  isWaiting?: boolean; // New prop to indicate waiting for others
}

export function AuctionButton({ onPress, onRelease, disabled, isPressed, isWaiting }: AuctionButtonProps) {
  // We use local state for visual feedback immediately, but parent controls logic
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative group w-64 h-64 flex items-center justify-center">
      {/* Outer Rings - Different animation for waiting */}
      <div className={cn(
        "absolute inset-0 rounded-full border-2 transition-all duration-500",
        isWaiting 
          ? "border-yellow-500/20 scale-100 opacity-80 animate-ping duration-[3s]" 
          : "border-primary/20",
        isPressed && !isWaiting ? "scale-90 opacity-50" : !isWaiting ? "scale-100 opacity-100 animate-pulse" : ""
      )} />
      <div className={cn(
        "absolute inset-4 rounded-full border transition-all duration-500",
        isWaiting ? "border-yellow-500/40 animate-spin duration-[10s]" : "border-primary/40",
        isPressed && !isWaiting ? "scale-95 border-primary/60" : !isWaiting ? "scale-100 rotate-180" : ""
      )} />

      {/* The Button */}
      <button
        ref={buttonRef}
        className={cn(
          "relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-100 focus:outline-none",
          "bg-gradient-to-b from-zinc-800 to-black border-4",
          disabled && !isWaiting ? "border-zinc-800 opacity-50 cursor-not-allowed grayscale" : "cursor-pointer",
          isPressed 
            ? "border-primary shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] scale-95" 
            : isWaiting 
              ? "border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]" 
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
          "font-display text-2xl font-bold tracking-widest transition-colors duration-200 text-center px-2",
          isPressed ? "text-primary text-glow" : isWaiting ? "text-yellow-500 animate-pulse text-xl" : "text-zinc-400"
        )}>
          {isWaiting ? "BID LOCKED" : isPressed ? "HOLDING" : "PRESS"}
        </span>
        <span className="text-xs text-zinc-600 font-mono mt-2 uppercase tracking-wider">
          {isWaiting ? "Waiting for others..." : isPressed ? "" : "Hold to Ready"}
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
