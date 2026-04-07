-- Migration 0002: tracking tables
-- Adds last_seen_at / login_count to player_profiles and creates the
-- bid_events and driver_selection_stats tables.
-- All statements are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ── player_profiles: new activity-tracking columns ───────────────────────────
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "last_seen_at"  timestamp;
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "login_count"   integer NOT NULL DEFAULT 0;

-- ── bid_events ───────────────────────────────────────────────────────────────
-- One row per player per round — records each player's bid in a round.
CREATE TABLE IF NOT EXISTS "bid_events" (
  "id"            varchar   PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id"       varchar   NOT NULL,
  "player_id"     varchar   NOT NULL,
  "player_name"   text      NOT NULL,
  "round_number"  integer   NOT NULL,
  "hold_seconds"  real      NOT NULL,
  "is_winner"     integer   NOT NULL DEFAULT 0,
  "is_multiplayer" integer  NOT NULL DEFAULT 0,
  "lobby_code"    varchar,
  "created_at"    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_bid_events_game_id"
  ON "bid_events" ("game_id");

CREATE INDEX IF NOT EXISTS "idx_bid_events_player_id"
  ON "bid_events" ("player_id");

-- ── driver_selection_stats ───────────────────────────────────────────────────
-- Aggregated per-player, per-driver selection and win counts.
CREATE TABLE IF NOT EXISTS "driver_selection_stats" (
  "id"             varchar   PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id"      varchar   NOT NULL,
  "driver_id"      varchar   NOT NULL,
  "games_selected" integer   NOT NULL DEFAULT 1,
  "wins"           integer   NOT NULL DEFAULT 0,
  "last_updated"   timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "uq_driver_selection_player_driver" UNIQUE ("player_id", "driver_id")
);

CREATE INDEX IF NOT EXISTS "idx_driver_selection_player_id"
  ON "driver_selection_stats" ("player_id");
