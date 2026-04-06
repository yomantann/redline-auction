import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { gameSnapshots, gameSummaries, contactMessages, wagerProfiles, type InsertGameSnapshot, type InsertGameSummary, type InsertContact } from "@shared/schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    db = drizzle(pool);
  }
  return db;
}

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

// ─── Wager Credits ────────────────────────────────────────────────────────────

const DEFAULT_WAGER_BALANCE = 50000;

/** Return a player's wager balance. Creates a new profile with the default balance if the userId is new. */
export async function getWagerBalance(userId: string): Promise<number> {
  try {
    const database = getDb();
    const rows = await database.select().from(wagerProfiles).where(eq(wagerProfiles.userId, userId));
    if (rows.length > 0) return rows[0].balance;
    // First time – create profile with default balance
    await database.insert(wagerProfiles).values({ userId, balance: DEFAULT_WAGER_BALANCE });
    return DEFAULT_WAGER_BALANCE;
  } catch (error) {
    console.error(`[Wager] getWagerBalance failed:`, error);
    return DEFAULT_WAGER_BALANCE;
  }
}

/**
 * Atomically check that ALL provided userIds have at least `amount` credits,
 * then deduct `amount` from each.
 *
 * Returns `{ success: true, balances }` on success or `{ success: false, error, insufficientPlayers }` on failure.
 * No changes are committed when a failure is detected.
 */
export async function batchDeductWager(
  userIds: string[],
  amount: number
): Promise<{ success: true; balances: Record<string, number> } | { success: false; error: string; insufficientPlayers: string[] }> {
  if (userIds.length === 0 || amount <= 0) {
    return { success: true, balances: {} };
  }
  try {
    const database = getDb();

    // Read/initialise all balances
    const balanceMap: Record<string, number> = {};
    for (const userId of userIds) {
      const rows = await database.select().from(wagerProfiles).where(eq(wagerProfiles.userId, userId));
      if (rows.length === 0) {
        await database.insert(wagerProfiles).values({ userId, balance: DEFAULT_WAGER_BALANCE });
        balanceMap[userId] = DEFAULT_WAGER_BALANCE;
      } else {
        balanceMap[userId] = rows[0].balance;
      }
    }

    const insufficient = userIds.filter(id => (balanceMap[id] ?? 0) < amount);
    if (insufficient.length > 0) {
      return { success: false, error: `Insufficient credits`, insufficientPlayers: insufficient };
    }

    // Deduct from each
    const newBalances: Record<string, number> = {};
    for (const userId of userIds) {
      const newBal = (balanceMap[userId] ?? DEFAULT_WAGER_BALANCE) - amount;
      await database.update(wagerProfiles)
        .set({ balance: newBal, updatedAt: new Date() })
        .where(eq(wagerProfiles.userId, userId));
      newBalances[userId] = newBal;
    }
    console.log(`[Wager] Deducted ${amount} from ${userIds.length} players`);
    return { success: true, balances: newBalances };
  } catch (error) {
    console.error(`[Wager] batchDeductWager failed:`, error);
    return { success: false, error: 'Database error during deduction', insufficientPlayers: [] };
  }
}

/**
 * Credit `amount` to each userId in `payouts`.
 * Used at game-over to distribute the wager pool.
 */
export async function batchPayoutWager(
  payouts: { userId: string; amount: number }[]
): Promise<Record<string, number>> {
  const newBalances: Record<string, number> = {};
  if (payouts.length === 0) return newBalances;
  try {
    const database = getDb();
    for (const { userId, amount } of payouts) {
      if (amount <= 0) continue;
      const rows = await database.select().from(wagerProfiles).where(eq(wagerProfiles.userId, userId));
      const current = rows.length > 0 ? rows[0].balance : DEFAULT_WAGER_BALANCE;
      if (rows.length === 0) {
        const newBal = DEFAULT_WAGER_BALANCE + amount;
        await database.insert(wagerProfiles).values({ userId, balance: newBal });
        newBalances[userId] = newBal;
      } else {
        const newBal = current + amount;
        await database.update(wagerProfiles)
          .set({ balance: newBal, updatedAt: new Date() })
          .where(eq(wagerProfiles.userId, userId));
        newBalances[userId] = newBal;
      }
    }
    console.log(`[Wager] Paid out to ${payouts.length} players`);
  } catch (error) {
    console.error(`[Wager] batchPayoutWager failed:`, error);
  }
  return newBalances;
}