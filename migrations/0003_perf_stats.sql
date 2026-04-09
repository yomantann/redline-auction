-- Migration 0003: performance stats column
-- Adds lifetime_protocol_wins to player_profiles for the performance stats section.
-- Idempotent (ADD COLUMN IF NOT EXISTS).

ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "lifetime_protocol_wins" integer NOT NULL DEFAULT 0;
