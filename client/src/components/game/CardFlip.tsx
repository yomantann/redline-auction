import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CardDef {
  /** Unique key for the card (used as React key). */
  id: string;
  /** Text shown on the card face (e.g. "🂡 Ace of Spades", "+10s", "WAGER"). */
  label: string;
  /** Optional sub-text below the label. */
  sublabel?: string;
  /** Tailwind colour class for the card face text (default white). */
  textColor?: string;
  /** Tailwind background/gradient for the face side (default dark zinc). */
  faceClass?: string;
}

interface CardFlipProps {
  /** The deck of cards to pick from.  At least one card required. */
  cards: CardDef[];
  /** Called once the flip animation completes with the revealed card. */
  onResult: (card: CardDef) => void;
  /** Set to true to start a new flip.  Component fires onResult when done. */
  trigger?: boolean;
  /** Pre-selected card id; if omitted a card is chosen at random. */
  forceCardId?: string;
  /** Total animation duration in ms (default 900). */
  durationMs?: number;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
}

/** CardFlip — a card that spins face-down → spins face-up, revealing a random (or forced) result.
 *
 * Usage:
 * ```tsx
 * const CARDS: CardDef[] = [
 *   { id: 'ace',  label: 'A♠', sublabel: 'Ace of Spades' },
 *   { id: 'king', label: 'K♥', sublabel: 'King of Hearts', textColor: 'text-red-400' },
 * ];
 *
 * const [flip, setFlip] = useState(false);
 * <CardFlip
 *   cards={CARDS}
 *   trigger={flip}
 *   onResult={(c) => { setFlip(false); console.log(c); }}
 * />
 * <button onClick={() => setFlip(true)}>DRAW</button>
 * ```
 */
export function CardFlip({
  cards,
  onResult,
  trigger = false,
  forceCardId,
  durationMs = 900,
  className,
}: CardFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [revealedCard, setRevealedCard] = useState<CardDef | null>(null);
  // rotateY in degrees — drives the CSS 3-D flip
  const [rotateY, setRotateY] = useState(0);
  const hasCalledResult = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Ref mirrors isFlipping so the trigger effect doesn't need it as a dep. */
  const isFlippingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startFlip = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    const target =
      forceCardId !== undefined
        ? cards.find((c) => c.id === forceCardId) ?? cards[0]
        : cards[Math.floor(Math.random() * cards.length)];

    hasCalledResult.current = false;
    setIsFlipping(true);
    setRevealedCard(null);
    setRotateY(0);

    // Phase 1: spin to 90° (card edge-on — this is the swap point)
    const half = durationMs / 2;
    setRotateY(90);

    // Phase 2: at the midpoint, swap the face and continue to 180°
    timeoutRef.current = setTimeout(() => {
      setRevealedCard(target);
      setRotateY(180);

      // Phase 3: landing — animation finishes
      timeoutRef.current = setTimeout(() => {
        setIsFlipping(false);
        isFlippingRef.current = false;
        if (!hasCalledResult.current) {
          hasCalledResult.current = true;
          onResult(target);
        }
      }, half);
    }, half);
  }, [cards, forceCardId, durationMs, onResult]);

  // External trigger support — uses ref to avoid re-firing when isFlipping state changes
  useEffect(() => {
    if (trigger && !isFlippingRef.current) startFlip();
  }, [trigger, startFlip]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const half = durationMs / 2;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Card */}
      <div
        className="relative"
        style={{ perspective: 600, width: 80, height: 112 }}
      >
        <motion.div
          animate={{ rotateY }}
          transition={{ duration: half / 1000, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}
          className="relative"
        >
          {/* Back face (shown when rotateY < 90) */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl border-2 flex items-center justify-center backface-hidden",
              isFlipping || revealedCard
                ? "border-zinc-500 bg-zinc-800"
                : "border-zinc-600 bg-zinc-900",
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-3xl opacity-50 select-none">🂠</div>
          </div>

          {/* Front face (shown when rotateY > 90) */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl border-2 flex flex-col items-center justify-center gap-1 backface-hidden",
              revealedCard?.faceClass ?? "bg-zinc-900",
              revealedCard
                ? "border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.35)]"
                : "border-zinc-500",
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {revealedCard ? (
              <>
                <span
                  className={cn(
                    "font-display font-black text-2xl leading-none",
                    revealedCard.textColor ?? "text-white",
                  )}
                >
                  {revealedCard.label}
                </span>
                {revealedCard.sublabel && (
                  <span className="text-[10px] text-zinc-400 tracking-wide text-center px-1 leading-tight">
                    {revealedCard.sublabel}
                  </span>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Result badge */}
      {revealedCard && !isFlipping && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 text-xs font-bold tracking-widest"
        >
          {revealedCard.label}
        </motion.div>
      )}

      {/* Idle call-to-action */}
      {!isFlipping && !revealedCard && (
        <button
          onClick={startFlip}
          className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-zinc-300 transition-colors"
        >
          🃏 DRAW
        </button>
      )}
    </div>
  );
}
