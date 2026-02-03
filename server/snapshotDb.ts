import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { gameSnapshots, type InsertGameSnapshot } from "@shared/schema";

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

export function createGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
