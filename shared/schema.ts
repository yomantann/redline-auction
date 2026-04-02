import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models (users + sessions tables for Replit Auth)
export * from "./models/auth";

// Player profiles — one row per authenticated Replit user
export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey(), // Replit user ID (sub claim)
  username: text("username"),
  profileImageUrl: text("profile_image_url"),
  credits: integer("credits").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  totalGames: integer("total_games").default(0).notNull(),
  equippedCosmetics: jsonb("equipped_cosmetics").$type<Record<string, string>>().default({}),
  unlockedCosmetics: jsonb("unlocked_cosmetics").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerProfileSchema = createInsertSchema(playerProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type PlayerProfile = typeof playerProfiles.$inferSelect;

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

export const gameSummaries = pgTable("game_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  lobbyCode: varchar("lobby_code"),
  isMultiplayer: integer("is_multiplayer").default(0),
  totalRounds: integer("total_rounds").notNull(),
  gameSettings: jsonb("game_settings").$type<{
    difficulty: string;
    variant: string;
    gameDuration: string;
    protocolsEnabled: boolean;
    abilitiesEnabled: boolean;
  }>(),
  playerResults: jsonb("player_results").$type<{
    playerId: string;
    playerName: string;
    driverId: string | null;
    finalRank: number;
    tokens: number;
    remainingTime: number;
    totalTimeBid: number;
    netImpact: number;
    isEliminated: boolean;
    isBot: boolean;
    momentFlags: number;
    protocolWins: number;
    totalDrinks: number;
    socialDares: number;
  }[]>().default([]),
  bonusTrophyResults: jsonb("bonus_trophy_results").$type<{
    criterion: string;
    criterionName: string;
    winnerIds: string[];
    winnerNames: string[];
    trophiesAwarded: number;
  }[]>().default([]),
  winnerId: varchar("winner_id"),
  winnerName: varchar("winner_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSummarySchema = createInsertSchema(gameSummaries).omit({
  id: true,
  createdAt: true,
});

export type InsertGameSummary = z.infer<typeof insertGameSummarySchema>;
export type GameSummary = typeof gameSummaries.$inferSelect;

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
