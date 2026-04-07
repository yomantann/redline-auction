import {
  gameSnapshots,
  gameSummaries,
  contactMessages,
  stripeTransactions,
  bidEvents,
  driverSelectionStats,
  type InsertGameSnapshot,
  type InsertGameSummary,
  type InsertContact,
  type InsertStripeTransaction,
  type InsertBidEvent,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";

export async function recordGameSnapshot(snapshot: InsertGameSnapshot): Promise<void> {
  try {
    const database = getDb();
    await database.insert(gameSnapshots).values(snapshot as any);
    console.log(`[Snapshot] Recorded ${snapshot.snapshotType} for game ${snapshot.gameId} round ${snapshot.roundNumber}`);
  } catch (error) {
    console.error(`[Snapshot] Failed to record snapshot:`, error);
  }
}

export async function recordGameSummary(summary: InsertGameSummary): Promise<void> {
  try {
    const database = getDb();
    await database.insert(gameSummaries).values(summary as any);
    console.log(`[Summary] Recorded game summary for ${summary.gameId} - winner: ${summary.winnerName}`);
  } catch (error) {
    console.error(`[Summary] Failed to record game summary:`, error);
  }
}

export function createGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function recordContactMessage(data: InsertContact): Promise<void> {
  try {
    const database = getDb();
    await database.insert(contactMessages).values(data);
    console.log(`[Contact] Message from ${data.name} (${data.email}) recorded`);
  } catch (error) {
    console.error(`[Contact] Failed to record message:`, error);
  }
}

export async function recordStripeTransaction(data: InsertStripeTransaction): Promise<void> {
  try {
    const database = getDb();
    await database.insert(stripeTransactions).values(data as any);
    console.log(`[Stripe] Transaction recorded: ${data.creditsAmount} credits for user ${data.userId} (${data.purchasedItemType ?? 'credits_pack'} / ${data.status})`);
  } catch (error) {
    console.error(`[Stripe] Failed to record transaction:`, error);
  }
}

/**
 * Records a single bid event (one entry per player who bid in a round).
 * Called from the round_end snapshot endpoint and the MP game engine
 * to build a raw per-round bid history.
 */
export async function recordBidEvent(event: InsertBidEvent): Promise<void> {
  try {
    const database = getDb();
    await database.insert(bidEvents).values(event as any);
  } catch (error) {
    console.error(`[BidEvent] Failed to record bid event:`, error);
  }
}

/**
 * Upserts driver selection aggregate stats for a player.
 * Call once per game for each real player whose driverId is known.
 * If the row already exists, increments games_selected (and wins if isWinner).
 */
export async function recordDriverSelectionStat(
  playerId: string,
  driverId: string,
  isWinner: boolean,
): Promise<void> {
  if (!playerId || !driverId) return;
  try {
    const database = getDb();
    await database
      .insert(driverSelectionStats)
      .values({
        playerId,
        driverId,
        gamesSelected: 1,
        wins: isWinner ? 1 : 0,
      } as any)
      .onConflictDoUpdate({
        target: [driverSelectionStats.playerId, driverSelectionStats.driverId],
        set: {
          gamesSelected: sql`driver_selection_stats.games_selected + 1`,
          wins: sql`driver_selection_stats.wins + ${isWinner ? 1 : 0}`,
          lastUpdated: new Date(),
        },
      });
    console.log(`[DriverStat] Recorded driver selection: player=${playerId} driver=${driverId} win=${isWinner}`);
  } catch (error) {
    console.error(`[DriverStat] Failed to record driver selection stat:`, error);
  }
}
