-- =============================================================================
-- Redline Auction — Clean Schema Export
-- Generated from shared/schema.ts + shared/models/auth.ts
-- =============================================================================
-- This file is the canonical DDL for all database tables.
-- It adds explicit foreign-key constraints and performance indexes that are
-- recommended but not yet present in the production migration.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- provides gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. sessions
--    Managed by connect-pg-simple (Replit Auth session store).
--    Do NOT drop or rename this table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid"    varchar        PRIMARY KEY,
  "sess"   jsonb          NOT NULL,
  "expire" timestamp(6)   NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
  ON "sessions" ("expire");

-- ---------------------------------------------------------------------------
-- 2. users
--    One row per Replit OAuth identity (upserted on every login).
--    id = OIDC sub claim from Replit.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
  "id"                varchar        PRIMARY KEY,
  "email"             varchar        UNIQUE,
  "first_name"        varchar,
  "last_name"         varchar,
  "profile_image_url" varchar,
  "created_at"        timestamp      DEFAULT now(),
  "updated_at"        timestamp      DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. player_profiles
--    One row per authenticated player.
--    Stores currency balance, cosmetics state, win/game counts, milestones.
--
--    Relationship: player_profiles.id → users.id  (1-to-1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "player_profiles" (
  -- ── Identity ────────────────────────────────────────────────────────────
  "id"                     varchar        PRIMARY KEY,
  "username"               text,
  "profile_image_url"      text,

  -- ── Currency ────────────────────────────────────────────────────────────
  "currency_balance"       integer        NOT NULL DEFAULT 0,
  "lifetime_earned"        integer        NOT NULL DEFAULT 0,
  "lifetime_spent"         integer        NOT NULL DEFAULT 0,

  -- ── Win / Game Tracking ─────────────────────────────────────────────────
  "total_wins"             integer        NOT NULL DEFAULT 0,
  "total_games"            integer        NOT NULL DEFAULT 0,
  -- Keys: "sp_standard" | "sp_social" | "sp_bio" | "sp_haunted"
  --     | "mp_standard" | "mp_social" | "mp_bio" | "mp_haunted"
  "wins_per_mode"          jsonb          NOT NULL DEFAULT '{}',
  "games_per_mode"         jsonb          NOT NULL DEFAULT '{}',

  -- ── Cosmetics ───────────────────────────────────────────────────────────
  "owned_cosmetics"        jsonb          NOT NULL DEFAULT '[]',   -- string[]
  "equipped_cosmetics"     jsonb          NOT NULL DEFAULT '{}',   -- { logo, border, background, driverSkin }

  -- ── Conversion anti-cheat ───────────────────────────────────────────────
  "converted_trophies"     integer        NOT NULL DEFAULT 0,
  "converted_moment_flags" integer        NOT NULL DEFAULT 0,
  "moment_flags_per_type"  jsonb          NOT NULL DEFAULT '{}',   -- Record<flagType, count>
  "converted_game_ids"     jsonb          NOT NULL DEFAULT '[]',   -- string[] — games already converted

  -- ── Milestones ──────────────────────────────────────────────────────────
  "milestone_unlocks"      jsonb          NOT NULL DEFAULT '[]',   -- string[] of milestone IDs

  -- ── Timestamps ──────────────────────────────────────────────────────────
  "created_at"             timestamp      NOT NULL DEFAULT now(),
  "updated_at"             timestamp      NOT NULL DEFAULT now(),

  -- ── Foreign Key ─────────────────────────────────────────────────────────
  CONSTRAINT "fk_player_profiles_users"
    FOREIGN KEY ("id") REFERENCES "users" ("id")
    ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- 4. game_snapshots
--    One row per round-event (round_end / elimination / game_over).
--    Granular replay and analytics data.
--
--    Relationship: game_snapshots.game_id groups rows within a single game.
--                  (No parent "games" table yet — game_id is a shared key with
--                   game_summaries.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "game_snapshots" (
  "id"                      varchar        PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id"                 varchar        NOT NULL,
  "snapshot_type"           varchar        NOT NULL,   -- 'round_end' | 'elimination' | 'game_over'
  "round_number"            integer        NOT NULL,
  "winner_player_id"        varchar,                   -- null if no winner this round
  "winning_hold_time"       real,                      -- seconds
  "min_bid_seconds"         real,
  -- Arrays of IDs / names
  "eliminated_player_ids"   jsonb          DEFAULT '[]',   -- string[]
  "moment_flags_triggered"  jsonb          DEFAULT '[]',   -- string[]
  "protocols_triggered"     jsonb          DEFAULT '[]',   -- string[]
  "limit_breaks_triggered"  jsonb          DEFAULT '[]',   -- string[]
  -- Per-player state at this snapshot
  "player_positions"        jsonb          DEFAULT '[]',
  -- { playerId, tokens, remainingTime, isEliminated }[]
  "lobby_code"              varchar,                   -- null for singleplayer
  "game_settings"           jsonb,
  -- { difficulty, variant, gameDuration, protocolsEnabled, abilitiesEnabled }
  "is_multiplayer"          integer        DEFAULT 0,  -- 0 = SP, 1 = MP
  "created_at"              timestamp      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_game_snapshots_game_id"
  ON "game_snapshots" ("game_id");

CREATE INDEX IF NOT EXISTS "idx_game_snapshots_created_at"
  ON "game_snapshots" ("created_at");

-- ---------------------------------------------------------------------------
-- 5. game_summaries
--    One row per completed game.
--    Final scoreboard and per-player result breakdown.
--
--    Relationship: game_summaries.game_id matches game_snapshots.game_id.
--                  winner_id logically references player_profiles.id but
--                  includes bot/guest player IDs that may not exist there.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "game_summaries" (
  "id"                    varchar        PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id"               varchar        NOT NULL,
  "lobby_code"            varchar,
  "is_multiplayer"        integer        DEFAULT 0,
  "total_rounds"          integer        NOT NULL,
  "game_settings"         jsonb,
  -- { difficulty, variant, gameDuration, protocolsEnabled, abilitiesEnabled }
  "player_results"        jsonb          DEFAULT '[]',
  -- [{
  --   playerId, playerName, driverId, finalRank, tokens,
  --   remainingTime, totalTimeBid, netImpact, isEliminated,
  --   isBot, momentFlags, protocolWins, totalDrinks, socialDares
  -- }]
  "bonus_trophy_results"  jsonb          DEFAULT '[]',
  -- [{ criterion, criterionName, winnerIds[], winnerNames[], trophiesAwarded }]
  "winner_id"             varchar,
  "winner_name"           varchar,
  "created_at"            timestamp      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_game_summaries_game_id"
  ON "game_summaries" ("game_id");

CREATE INDEX IF NOT EXISTS "idx_game_summaries_created_at"
  ON "game_summaries" ("created_at");

-- ---------------------------------------------------------------------------
-- 6. stripe_transactions
--    Audit ledger for every credit-pack or cosmetic purchase.
--    Every row represents one payment attempt.
--
--    Relationship: stripe_transactions.user_id → player_profiles.id  (M-to-1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "stripe_transactions" (
  "id"                       varchar        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"                  varchar        NOT NULL,
  "stripe_payment_intent_id" varchar,                   -- populated when Stripe is live
  "credits_amount"           integer        NOT NULL,
  -- What the player purchased
  "purchased_item_type"      varchar        NOT NULL DEFAULT 'credits_pack',
  -- 'credits_pack' | 'cosmetic'
  "purchased_item_id"        varchar,                   -- cosmetic ID (when type = 'cosmetic')
  "purchased_item_label"     varchar,                   -- e.g. "1,000 Credits Pack"
  "status"                   varchar        NOT NULL DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed' | 'refunded'
  "created_at"               timestamp      NOT NULL DEFAULT now(),

  -- ── Foreign Key ─────────────────────────────────────────────────────────
  CONSTRAINT "fk_stripe_transactions_player"
    FOREIGN KEY ("user_id") REFERENCES "player_profiles" ("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_stripe_transactions_user_id"
  ON "stripe_transactions" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_stripe_transactions_status"
  ON "stripe_transactions" ("status");

-- ---------------------------------------------------------------------------
-- 7. contact_messages
--    One row per contact-form submission. Standalone — no FK relationships.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id"         varchar        PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text           NOT NULL,
  "email"      text           NOT NULL,
  "message"    text           NOT NULL,
  "created_at" timestamp      NOT NULL DEFAULT now()
);

-- =============================================================================
-- Relationship Summary
-- =============================================================================
--
--   users (id PK)
--     └─1:1─ player_profiles (id PK → users.id  ON DELETE CASCADE)
--               └─1:M─ stripe_transactions (user_id → player_profiles.id  ON DELETE CASCADE)
--
--   game_snapshots (game_id, not FK)  ─┐  share game_id (no parent table yet)
--   game_summaries  (game_id, not FK) ─┘
--
--   sessions        — standalone (connect-pg-simple)
--   contact_messages — standalone
--
-- =============================================================================
-- Data Export Query (run against live DB to get all relational data)
-- =============================================================================

-- All players with their currency state
-- SELECT
--   pp.id,
--   u.email,
--   u.first_name,
--   u.last_name,
--   pp.username,
--   pp.currency_balance,
--   pp.lifetime_earned,
--   pp.lifetime_spent,
--   pp.total_wins,
--   pp.total_games,
--   pp.wins_per_mode,
--   pp.games_per_mode,
--   pp.owned_cosmetics,
--   pp.equipped_cosmetics,
--   pp.milestone_unlocks,
--   pp.created_at  AS profile_created_at
-- FROM player_profiles pp
-- LEFT JOIN users u ON u.id = pp.id
-- ORDER BY pp.created_at DESC;

-- All Stripe transactions joined to player
-- SELECT
--   st.id              AS transaction_id,
--   st.user_id,
--   u.email,
--   st.stripe_payment_intent_id,
--   st.credits_amount,
--   st.purchased_item_type,
--   st.purchased_item_id,
--   st.purchased_item_label,
--   st.status,
--   st.created_at
-- FROM stripe_transactions st
-- LEFT JOIN users u ON u.id = st.user_id
-- ORDER BY st.created_at DESC;

-- All game summaries with round count
-- SELECT
--   gs.game_id,
--   gs.lobby_code,
--   gs.is_multiplayer,
--   gs.total_rounds,
--   gs.winner_id,
--   gs.winner_name,
--   gs.game_settings,
--   gs.player_results,
--   gs.bonus_trophy_results,
--   gs.created_at,
--   COUNT(snap.id) AS snapshot_count
-- FROM game_summaries gs
-- LEFT JOIN game_snapshots snap ON snap.game_id = gs.game_id
-- GROUP BY gs.id
-- ORDER BY gs.created_at DESC;
