import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/** Dot positions for each face of a standard d6 */
const DICE_DOTS: Record<number, number[][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

interface DiceRollProps {
  /** Number of sides (default 6). Values 1–sides are equally likely. */
  sides?: number;
  /** Called once when the animation settles with the final rolled value. */
  onResult: (value: number) => void;
  /** Set to true to start a new roll. Resets to false automatically via onResult. */
  trigger?: boolean;
  /** Total animation duration in milliseconds (default 1600). */
  durationMs?: number;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
}

/** DiceRoll — animated d6 (or d4/d8/d20 etc.) that shuffles through faces and settles.
 *
 * Usage:
 * ```tsx
 * const [roll, setRoll] = useState(false);
 * <DiceRoll trigger={roll} onResult={(v) => { setRoll(false); console.log(v); }} />
 * <button onClick={() => setRoll(true)}>Roll</button>
 * ```
 */
export function DiceRoll({
  sides = 6,
  onResult,
  trigger = false,
  durationMs = 1600,
  className,
}: DiceRollProps) {
  const [displayFace, setDisplayFace] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [finalFace, setFinalFace] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startRoll = useCallback(() => {
    if (isRolling) return;

    const result = Math.floor(Math.random() * sides) + 1;
    setFinalFace(null);
    setIsRolling(true);

    let speed = 60; // ms between face changes — starts fast
    let elapsed = 0;

    const tick = () => {
      setDisplayFace(Math.floor(Math.random() * sides) + 1);
      elapsed += speed;

      // Ease out: slow down as we approach the end
      if (elapsed > durationMs * 0.55) speed = 120;
      if (elapsed > durationMs * 0.80) speed = 220;

      if (elapsed >= durationMs) {
        stopRolling();
        setDisplayFace(result);
        setFinalFace(result);
        setIsRolling(false);
        onResult(result);
        return;
      }
      timeoutRef.current = setTimeout(tick, speed);
    };

    timeoutRef.current = setTimeout(tick, speed);
  }, [isRolling, sides, durationMs, onResult, stopRolling]);

  // External trigger support
  useEffect(() => {
    if (trigger && !isRolling) startRoll();
  }, [trigger, startRoll]); // startRoll is useCallback'd — stable unless its own deps change

  // Cleanup on unmount
  useEffect(() => () => stopRolling(), [stopRolling]);

  // For sides > 6 or sides < 1 show a numeric face instead of dots
  const showDots = sides === 6 && displayFace in DICE_DOTS;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Dice body */}
      <motion.div
        animate={
          isRolling
            ? { rotate: [0, 8, -8, 12, -6, 0], scale: [1, 1.08, 0.95, 1.05, 0.98, 1] }
            : { rotate: 0, scale: 1 }
        }
        transition={isRolling ? { duration: 0.35, repeat: Infinity } : { duration: 0.3 }}
        className={cn(
          "relative w-16 h-16 rounded-xl border-2 select-none",
          isRolling
            ? "bg-zinc-800 border-zinc-500 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            : finalFace !== null
            ? "bg-zinc-900 border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.4)]"
            : "bg-zinc-900 border-zinc-600",
        )}
      >
        {showDots ? (
          /* Pip-dot layout */
          <div className="absolute inset-1.5">
            {DICE_DOTS[displayFace].map(([x, y], i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2",
                  isRolling ? "bg-zinc-400" : "bg-white",
                )}
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            ))}
          </div>
        ) : (
          /* Numeric face for non-standard dice */
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "font-display font-black text-2xl",
                isRolling ? "text-zinc-400" : "text-white",
              )}
            >
              {displayFace}
            </span>
          </div>
        )}
      </motion.div>

      {/* Result badge */}
      <AnimatePresence>
        {finalFace !== null && !isRolling && (
          <motion.div
            key={finalFace}
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 text-xs font-bold tracking-widest"
          >
            ROLLED {finalFace}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle call-to-action */}
      {!isRolling && finalFace === null && (
        <button
          onClick={startRoll}
          className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-zinc-300 transition-colors"
        >
          🎲 ROLL
        </button>
      )}
    </div>
  );
}
