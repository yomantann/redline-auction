import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models (users + sessions tables for Replit Auth)
export * from "./models/auth";

// Player profiles — one row per authenticated Replit user
// Includes full currency/cosmetics/milestone state for the wallet system.
export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey(), // Replit user ID (sub claim from OIDC)
  username: text("username"),
  profileImageUrl: text("profile_image_url"),
  // ── Currency ──────────────────────────────────────────────────────────────
  currencyBalance: integer("currency_balance").default(0).notNull(),
  lifetimeEarned: integer("lifetime_earned").default(0).notNull(),
  lifetimeSpent: integer("lifetime_spent").default(0).notNull(),
  // ── Win/game tracking ─────────────────────────────────────────────────────
  totalWins: integer("total_wins").default(0).notNull(),
  totalGames: integer("total_games").default(0).notNull(),
  winsPerMode: jsonb("wins_per_mode").$type<Record<string, number>>().default({}).notNull(),
  // ── Cosmetics ─────────────────────────────────────────────────────────────
  ownedCosmetics: jsonb("owned_cosmetics").$type<string[]>().default([]).notNull(),
  equippedCosmetics: jsonb("equipped_cosmetics").$type<Record<string, string>>().default({}).notNull(),
  // ── Conversion anti-cheat ─────────────────────────────────────────────────
  convertedTrophies: integer("converted_trophies").default(0).notNull(),
  convertedMomentFlags: integer("converted_moment_flags").default(0).notNull(),
  convertedGameIds: jsonb("converted_game_ids").$type<string[]>().default([]).notNull(),
  // ── Milestones ────────────────────────────────────────────────────────────
  milestoneUnlocks: jsonb("milestone_unlocks").$type<string[]>().default([]).notNull(),
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
  limitedTime?: boolean; // rotates out of the shop after endsAt
  endsAt?: string; // ISO date string — item hidden from shop after this date
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

// PlayerProfile is derived from the playerProfiles DB table above.
// Use PlayerProfile (= typeof playerProfiles.$inferSelect) throughout the codebase.

// Zod schemas for API endpoint validation


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
  /**
   * STRIPE_HOOK: When Stripe is integrated, add stripePaymentMethodId or
   * paymentIntentId here so the server can validate the payment before crediting.
   * The fields below are already wired through to the stripe_transactions table
   * so every purchase is fully auditable.
   */
  // What the player is actually buying with this credit purchase.
  // 'credits_pack' = buying a bundle of credits; 'cosmetic' = buying one specific item.
  purchasedItemType: z.enum(['credits_pack', 'cosmetic']).default('credits_pack'),
  purchasedItemId: z.string().optional(),    // cosmetic id (when type = 'cosmetic')
  purchasedItemLabel: z.string().optional(), // human-readable e.g. "1,000 Credits Pack"
});

// ─── Stripe Transaction Ledger ──────────────────────────────────────────────
// Records every Stripe currency purchase for audit/accounting.
// userId = Replit Auth user ID (req.user.claims.sub) — wired in routes.ts.
//
// STRIPE_HOOK: When Stripe is wired in:
//   1. Create a PaymentIntent in POST /api/player/purchase-currency and
//      return the clientSecret to the front-end.
//   2. On Stripe webhook `payment_intent.succeeded`, look up the pending row
//      by stripePaymentIntentId, mark it 'completed', and call
//      addCurrencyFromStripe() to credit the player.
//   3. On `payment_intent.payment_failed`, mark the row 'failed'.
//   4. On `charge.refunded`, mark the row 'refunded' and deduct the credits.

export const stripeTransactions = pgTable("stripe_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Replit Auth user ID (sub claim)
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  creditsAmount: integer("credits_amount").notNull(),
  // What the player purchased with this transaction
  purchasedItemType: varchar("purchased_item_type").notNull().default("credits_pack"),
  // 'credits_pack' | 'cosmetic'
  purchasedItemId: varchar("purchased_item_id"),    // cosmetic id when type = 'cosmetic'
  purchasedItemLabel: varchar("purchased_item_label"), // human-readable e.g. "1,000 Credits"
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
