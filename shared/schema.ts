import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Game Snapshot Schema - Write-only for recording game state
export const gameSnapshots = pgTable("game_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  snapshotType: varchar("snapshot_type").notNull(), // 'round_end', 'elimination', 'game_over'
  roundNumber: integer("round_number").notNull(),
  winnerPlayerId: varchar("winner_player_id"), // null if no winner this round
  winningHoldTime: real("winning_hold_time"), // seconds
  minBidSeconds: real("min_bid_seconds"),
  eliminatedPlayerIds: jsonb("eliminated_player_ids").$type<string[]>().default([]),
  momentFlagsTriggered: jsonb("moment_flags_triggered").$type<string[]>().default([]),
  protocolsTriggered: jsonb("protocols_triggered").$type<string[]>().default([]),
  limitBreaksTriggered: jsonb("limit_breaks_triggered").$type<string[]>().default([]),
  playerPositions: jsonb("player_positions").$type<{
    playerId: string;
    tokens: number;
    remainingTime: number;
    isEliminated: boolean;
  }[]>().default([]),
  lobbyCode: varchar("lobby_code"), // null for singleplayer
  gameSettings: jsonb("game_settings").$type<{
    difficulty: string;
    variant: string;
    gameDuration: string;
    protocolsEnabled: boolean;
    abilitiesEnabled: boolean;
  }>(),
  isMultiplayer: integer("is_multiplayer").default(0), // 0 = singleplayer, 1 = multiplayer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSnapshotSchema = createInsertSchema(gameSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertGameSnapshot = z.infer<typeof insertGameSnapshotSchema>;
export type GameSnapshot = typeof gameSnapshots.$inferSelect;
