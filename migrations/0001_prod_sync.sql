-- Production sync migration
-- Run this against the production database to bring it up to date with the
-- current schema. All statements are idempotent (IF NOT EXISTS / DO NOTHING).

-- ── player_profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "player_profiles" (
  "id"                     varchar PRIMARY KEY,
  "username"               text,
  "profile_image_url"      text,
  "currency_balance"       integer NOT NULL DEFAULT 0,
  "lifetime_earned"        integer NOT NULL DEFAULT 0,
  "lifetime_spent"         integer NOT NULL DEFAULT 0,
  "total_wins"             integer NOT NULL DEFAULT 0,
  "total_games"            integer NOT NULL DEFAULT 0,
  "wins_per_mode"          jsonb   NOT NULL DEFAULT '{}',
  "owned_cosmetics"        jsonb   NOT NULL DEFAULT '[]',
  "equipped_cosmetics"     jsonb   NOT NULL DEFAULT '{}',
  "converted_trophies"     integer NOT NULL DEFAULT 0,
  "converted_moment_flags" integer NOT NULL DEFAULT 0,
  "moment_flags_per_type"  jsonb   NOT NULL DEFAULT '{}',
  "converted_game_ids"     jsonb   NOT NULL DEFAULT '[]',
  "milestone_unlocks"      jsonb   NOT NULL DEFAULT '[]',
  "created_at"             timestamp NOT NULL DEFAULT now(),
  "updated_at"             timestamp NOT NULL DEFAULT now()
);

-- Add any columns that may be missing in older deployments
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "lifetime_spent"         integer NOT NULL DEFAULT 0;
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "wins_per_mode"          jsonb   NOT NULL DEFAULT '{}';
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "games_per_mode"         jsonb   NOT NULL DEFAULT '{}';
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "milestone_unlocks"      jsonb   NOT NULL DEFAULT '[]';
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "converted_moment_flags" integer NOT NULL DEFAULT 0;
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "moment_flags_per_type"  jsonb   NOT NULL DEFAULT '{}';
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "converted_game_ids"     jsonb   NOT NULL DEFAULT '[]';
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "equipped_cosmetics"     jsonb   NOT NULL DEFAULT '{}';

-- ── game_snapshots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "game_snapshots" (
  "id"                    varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id"               varchar NOT NULL,
  "snapshot_type"         varchar NOT NULL,
  "round_number"          integer NOT NULL,
  "winner_player_id"      varchar,
  "winning_hold_time"     real,
  "min_bid_seconds"       real,
  "eliminated_player_ids" jsonb   DEFAULT '[]',
  "moment_flags_triggered" jsonb  DEFAULT '[]',
  "protocols_triggered"   jsonb   DEFAULT '[]',
  "limit_breaks_triggered" jsonb  DEFAULT '[]',
  "player_positions"      jsonb   DEFAULT '[]',
  "lobby_code"            varchar,
  "game_settings"         jsonb,
  "is_multiplayer"        integer DEFAULT 0,
  "created_at"            timestamp NOT NULL DEFAULT now()
);

-- ── game_summaries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "game_summaries" (
  "id"                    varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id"               varchar NOT NULL,
  "lobby_code"            varchar,
  "is_multiplayer"        integer DEFAULT 0,
  "total_rounds"          integer NOT NULL,
  "game_settings"         jsonb,
  "player_results"        jsonb   DEFAULT '[]',
  "bonus_trophy_results"  jsonb   DEFAULT '[]',
  "winner_id"             varchar,
  "winner_name"           varchar,
  "created_at"            timestamp NOT NULL DEFAULT now()
);

-- ── stripe_transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "stripe_transactions" (
  "id"                       varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"                  varchar NOT NULL,
  "stripe_payment_intent_id" varchar,
  "credits_amount"           integer NOT NULL,
  "purchased_item_type"      varchar NOT NULL DEFAULT 'credits_pack',
  "purchased_item_id"        varchar,
  "purchased_item_label"     varchar,
  "status"                   varchar NOT NULL DEFAULT 'pending',
  "created_at"               timestamp NOT NULL DEFAULT now()
);

-- ── contact_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id"         varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text    NOT NULL,
  "email"      text    NOT NULL,
  "message"    text    NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- ── Replit Auth tables (from shared/models/auth) ─────────────────────────────
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid"    varchar PRIMARY KEY,
  "sess"   jsonb   NOT NULL,
  "expire" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "sessions_expire_idx" ON "sessions" ("expire");

CREATE TABLE IF NOT EXISTS "users" (
  "id"                varchar PRIMARY KEY,
  "email"             varchar,
  "first_name"        varchar,
  "last_name"         varchar,
  "profile_image_url" varchar,
  "created_at"        timestamp DEFAULT now(),
  "updated_at"        timestamp DEFAULT now()
);
