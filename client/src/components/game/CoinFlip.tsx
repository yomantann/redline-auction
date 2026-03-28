import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type CoinFace = "heads" | "tails";

export interface CoinFlipPlayerResult {
  playerId: string;
  playerName: string;
  face: CoinFace;
}

interface CoinFlipProps {
  /**
   * List of players participating in the flip.  Each entry must have a unique id.
   * When only one player is supplied the component behaves as a single standalone flip.
   */
  players: Array<{ id: string; name: string }>;
  /**
   * Called once all flips (including any tie-breaker rematches) are resolved.
   * Receives the winning player(s) and every round's results.
   */
  onResult: (winners: Array<{ id: string; name: string }>, allRounds: CoinFlipPlayerResult[][]) => void;
  /** Set to true to start the flip sequence.  Reset via onResult. */
  trigger?: boolean;
  /** Duration of a single coin-spin animation in ms (default 1200). */
  durationMs?: number;
  /** Optional extra class for the wrapper. */
  className?: string;
}

const COIN_SYMBOLS: Record<CoinFace, string> = {
  heads: "👑",
  tails: "🌀",
};

function flipOne(): CoinFace {
  return Math.random() < 0.5 ? "heads" : "tails";
}

/** CoinFlip — animated coin for one or multiple players.
 *
 * Rules:
 *   - Each player flips simultaneously.
 *   - The player(s) with the most **heads** wins.
 *   - If there is a tie in heads count, only the tied players rematch; repeat until one winner.
 *
 * Usage:
 * ```tsx
 * const PLAYERS = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
 * const [go, setGo] = useState(false);
 * <CoinFlip
 *   players={PLAYERS}
 *   trigger={go}
 *   onResult={(winners) => { setGo(false); console.log(winners[0].name, 'wins!'); }}
 * />
 * <button onClick={() => setGo(true)}>FLIP</button>
 * ```
 */
export function CoinFlip({
  players,
  onResult,
  trigger = false,
  durationMs = 1200,
  className,
}: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  /** Results for each round including rematches */
  const [rounds, setRounds] = useState<CoinFlipPlayerResult[][]>([]);
  /** Who is currently in play (narrows on each rematch) */
  const [activePlayers, setActivePlayers] = useState(players);
  /** Current round results (shown while animating) */
  const [currentResults, setCurrentResults] = useState<CoinFlipPlayerResult[] | null>(null);
  /** Spinning face per player id (changes rapidly during animation) */
  const [spinFaces, setSpinFaces] = useState<Record<string, CoinFace>>({});
  /** Final winners, null until done */
  const [winners, setWinners] = useState<Array<{ id: string; name: string }> | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allRoundsRef = useRef<CoinFlipPlayerResult[][]>([]);
  const hasCalledResult = useRef(false);
  /** Ref mirrors isFlipping so the trigger effect doesn't need it as a dep. */
  const isFlippingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const runRound = useCallback(
    (participants: Array<{ id: string; name: string }>, previousRounds: CoinFlipPlayerResult[][]) => {
      setIsFlipping(true);
      setCurrentResults(null);
      setWinners(null);

      // Animate the spinning phase
      intervalRef.current = setInterval(() => {
        const next: Record<string, CoinFace> = {};
        participants.forEach((p) => (next[p.id] = flipOne()));
        setSpinFaces(next);
      }, 80);

      timeoutRef.current = setTimeout(() => {
        // Stop spinning and determine results
        if (intervalRef.current) clearInterval(intervalRef.current);

        const results: CoinFlipPlayerResult[] = participants.map((p) => ({
          playerId: p.id,
          playerName: p.name,
          face: flipOne(),
        }));

        // Set final spin faces to match results
        const finalFaces: Record<string, CoinFace> = {};
        results.forEach((r) => (finalFaces[r.playerId] = r.face));
        setSpinFaces(finalFaces);
        setCurrentResults(results);

        const updatedRounds = [...previousRounds, results];
        allRoundsRef.current = updatedRounds;
        setRounds(updatedRounds);

        // In a 2+ player game: count total heads per player (each flips once per round)
        // Winners = those who flipped heads (when only 1 person heads), or all if nobody heads (rematch)
        const headPlayers = results.filter((r) => r.face === "heads").map((r) => ({ id: r.playerId, playerName: r.playerName }));

        let roundWinners: Array<{ id: string; name: string }>;

        if (participants.length === 1) {
          // Single-player: just show the result, no competition
          roundWinners = participants;
        } else if (headPlayers.length === 0) {
          // Everyone got tails → rematch all
          roundWinners = [];
        } else if (headPlayers.length === 1) {
          // One person got heads → winner
          roundWinners = [{ id: headPlayers[0].id, name: headPlayers[0].playerName }];
        } else {
          // Multiple heads — rematch between the heads players
          roundWinners = [];
        }

        setIsFlipping(false);

        if (roundWinners.length === 1 || participants.length === 1) {
          // Single winner (or standalone) → done
          setWinners(roundWinners.length === 1 ? roundWinners : participants);
          setActivePlayers(roundWinners.length === 1 ? roundWinners : participants);
          if (!hasCalledResult.current) {
            hasCalledResult.current = true;
            isFlippingRef.current = false;
            onResult(roundWinners.length === 1 ? roundWinners : participants, updatedRounds);
          }
        } else {
          // Rematch: wait briefly then re-run with remaining players
          const rematchers =
            headPlayers.length === 0
              ? participants
              : headPlayers.map((h) => participants.find((p) => p.id === h.id)!);
          setActivePlayers(rematchers);
          timeoutRef.current = setTimeout(() => {
            runRound(rematchers, updatedRounds);
          }, 1800);
        }
      }, durationMs);
    },
    [durationMs, onResult]
  );

  const startFlip = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    hasCalledResult.current = false;
    allRoundsRef.current = [];
    setRounds([]);
    setWinners(null);
    setCurrentResults(null);
    setActivePlayers(players);
    runRound(players, []);
  }, [players, runRound]);

  // External trigger — uses ref to avoid re-firing when isFlipping state changes
  useEffect(() => {
    if (trigger && !isFlippingRef.current) startFlip();
  }, [trigger, startFlip]);

  // Cleanup
  useEffect(() => () => clearTimers(), [clearTimers]);

  const isRematch = rounds.length > 1;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Round / rematch badge */}
      <AnimatePresence>
        {isRematch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/50 text-orange-300 text-xs font-bold tracking-widest"
          >
            🔄 REMATCH — ROUND {rounds.length}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coins grid */}
      <div className={cn("flex flex-wrap justify-center gap-4", activePlayers.length > 4 && "gap-2")}>
        {activePlayers.map((player) => {
          const resultFace = currentResults?.find((r) => r.playerId === player.id)?.face;
          const displayFace = isFlipping ? spinFaces[player.id] : resultFace;
          const isWinner = winners?.some((w) => w.id === player.id);

          return (
            <div key={player.id} className="flex flex-col items-center gap-1.5">
              {/* Coin */}
              <motion.div
                animate={
                  isFlipping
                    ? { rotateY: [0, 360], scale: [1, 1.1, 1] }
                    : { rotateY: 0, scale: 1 }
                }
                transition={
                  isFlipping
                    ? { duration: 0.18, repeat: Infinity, ease: "linear" }
                    : { duration: 0.3 }
                }
                className={cn(
                  "w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl select-none transition-shadow",
                  isFlipping
                    ? "bg-zinc-700 border-zinc-500"
                    : resultFace === "heads"
                    ? isWinner
                      ? "bg-yellow-900/60 border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.5)]"
                      : "bg-yellow-950/40 border-yellow-600/70"
                    : "bg-zinc-800 border-zinc-600",
                )}
              >
                {isFlipping ? (
                  <span className="opacity-60">{COIN_SYMBOLS[displayFace ?? "heads"]}</span>
                ) : displayFace ? (
                  COIN_SYMBOLS[displayFace]
                ) : (
                  <span className="text-zinc-600 text-sm">?</span>
                )}
              </motion.div>

              {/* Player name */}
              <span
                className={cn(
                  "text-xs font-bold tracking-wide truncate max-w-[72px] text-center",
                  isWinner ? "text-yellow-300" : "text-zinc-400",
                )}
              >
                {player.name}
              </span>

              {/* Result label */}
              <AnimatePresence>
                {!isFlipping && resultFace && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "text-[10px] uppercase tracking-widest font-bold",
                      resultFace === "heads" ? "text-yellow-400" : "text-zinc-500",
                    )}
                  >
                    {resultFace}
                    {isWinner && " ✓"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winners && winners.length > 0 && !isFlipping && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 text-sm font-bold tracking-widest text-center"
          >
            👑 {winners.map((w) => w.name).join(" & ")} WIN{winners.length > 1 ? "" : "S"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle CTA */}
      {!isFlipping && !winners && (
        <button
          onClick={startFlip}
          className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-zinc-300 transition-colors"
        >
          🪙 FLIP
        </button>
      )}
    </div>
  );
}
