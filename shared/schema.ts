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

// ─── Player Profile & Cosmetics System ───────────────────────────────────────

export type CosmeticType = 'logo' | 'border' | 'background' | 'driverSkin';
export type CosmeticRarity = 'common' | 'rare' | 'legendary';

export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  cost: number;
  rarity: CosmeticRarity;
  asset: string; // image path or CSS class
  earnableOnly?: boolean; // cannot be purchased, only earned
}

export interface EquippedCosmetics {
  logo?: string;       // cosmetic id
  border?: string;
  background?: string;
  driverSkin?: string;
}

/** Win counts keyed by game mode + multiplayer flag, e.g. "sp_standard", "mp_haunted" */
export interface WinsPerMode {
  sp_standard?: number;
  sp_social?: number;
  sp_bio?: number;
  sp_haunted?: number;
  mp_standard?: number;
  mp_social?: number;
  mp_bio?: number;
  mp_haunted?: number;
}

export interface PlayerProfile {
  id: string;           // keyed by userId (Replit Auth later)
  username: string;
  currencyBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  ownedCosmetics: string[];        // cosmetic ids
  equippedCosmetics: EquippedCosmetics;
  // Conversion tracking – prevents double-converting the same achievements
  convertedTrophies: number;       // how many trophies have been converted so far
  convertedMomentFlags: number;    // how many moment flags have been converted
  // Per-game conversion lock – set of gameIds already converted (anti-cheat)
  convertedGameIds: string[];
  // Win tracking for milestone unlocks (Replit Auth milestone system)
  winsPerMode: WinsPerMode;
  // Cosmetics unlocked by milestones (not purchased, not earnable-only shop items)
  milestoneUnlocks: string[];
  createdAt: string;
  updatedAt: string;
}

// Zod schemas for API validation

export const playerProfileSchema = z.object({
  id: z.string(),
  username: z.string().min(1).max(32),
  currencyBalance: z.number().int().min(0),
  lifetimeEarned: z.number().int().min(0),
  lifetimeSpent: z.number().int().min(0),
  ownedCosmetics: z.array(z.string()),
  equippedCosmetics: z.object({
    logo: z.string().optional(),
    border: z.string().optional(),
    background: z.string().optional(),
    driverSkin: z.string().optional(),
  }),
  convertedTrophies: z.number().int().min(0),
  convertedMomentFlags: z.number().int().min(0),
  convertedGameIds: z.array(z.string()),
  winsPerMode: z.record(z.number().int().min(0)),
  milestoneUnlocks: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createProfileSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1).max(32),
});

export const convertAchievementsSchema = z.object({
  trophies: z.number().int().min(0),
  momentFlags: z.number().int().min(0),
});

/** Used by the end-game conversion endpoint – idempotent per gameId */
export const convertGameSchema = z.object({
  gameId: z.string().min(1),
  trophies: z.number().int().min(0).max(200),   // sanity cap
  momentFlags: z.number().int().min(0).max(500), // sanity cap
  isMultiplayer: z.boolean(),
  variant: z.enum(['STANDARD', 'SOCIAL_OVERDRIVE', 'BIO_FUEL', 'HAUNTED']),
  isWinner: z.boolean(),
});

export const purchaseCosmeticSchema = z.object({
  cosmeticId: z.string().min(1),
});

export const equipCosmeticSchema = z.object({
  cosmeticId: z.string().min(1),
});

export const purchaseCurrencySchema = z.object({
  amount: z.number().int().positive(),
  // stripePaymentIntentId will be added when Stripe is integrated
});

// ─── Stripe Transaction Ledger ──────────────────────────────────────────────
// Records every Stripe currency purchase for audit/accounting.

export const stripeTransactions = pgTable("stripe_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"), // null = placeholder / test
  creditsAmount: integer("credits_amount").notNull(),
  // Status: 'pending' | 'completed' | 'failed' | 'refunded'
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStripeTransactionSchema = createInsertSchema(stripeTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertStripeTransaction = z.infer<typeof insertStripeTransactionSchema>;
export type StripeTransaction = typeof stripeTransactions.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────

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