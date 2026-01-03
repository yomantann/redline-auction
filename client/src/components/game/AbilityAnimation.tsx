import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, Shield, Eye, Flame, Skull } from "lucide-react";

export type AnimationType = 'TIME_REFUND' | 'TOKEN_BOOST' | 'DISRUPT' | 'PEEK' | 'PROTECT' | 'DAMAGE';

interface AbilityAnimationProps {
  type: AnimationType;
  value?: string; // e.g., "+1.0s", "-2 Tokens"
  onComplete: () => void;
}

export function AbilityAnimation({ type, value, onComplete }: AbilityAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'TIME_REFUND': return <Clock size={24} className="text-emerald-400" />;
      case 'TOKEN_BOOST': return <Zap size={24} className="text-yellow-400" />;
      case 'DISRUPT': return <Flame size={24} className="text-orange-500" />;
      case 'PEEK': return <Eye size={24} className="text-blue-400" />;
      case 'PROTECT': return <Shield size={24} className="text-cyan-400" />;
      case 'DAMAGE': return <Skull size={24} className="text-red-500" />;
      default: return <Zap size={24} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'TIME_REFUND': return "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]";
      case 'TOKEN_BOOST': return "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]";
      case 'DISRUPT': return "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]";
      case 'PEEK': return "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]";
      case 'PROTECT': return "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]";
      case 'DAMAGE': return "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";
      default: return "text-white";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 0 }}
        animate={{ opacity: 1, scale: 1.2, y: -40 }}
        exit={{ opacity: 0, scale: 0.8, y: -60 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
      >
         <div className="bg-black/80 backdrop-blur-sm p-3 rounded-full border border-white/20 shadow-xl flex items-center gap-2">
            <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
            >
                {getIcon()}
            </motion.div>
            <span className={`font-display font-black text-xl tracking-wider ${getColor()}`}>
                {value || type}
            </span>
         </div>
      </motion.div>
    </AnimatePresence>
  );
}
