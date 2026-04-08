# Database Review — Redline Auction

> Generated from `shared/schema.ts`, `shared/models/auth.ts`, and `migrations/0001_prod_sync.sql`.  
> Updated: `migrations/0002_tracking_tables.sql` added `bid_events`, `driver_selection_stats`, and `last_seen_at`/`login_count` on `player_profiles`.

---

## Tables at a Glance

| Table | Rows grow with… | Key purpose |
|---|---|---|
| `users` | Each Replit sign-in | Auth identity store |
| `sessions` | Each browser session | Auth session persistence |
| `player_profiles` | Each unique authenticated player | Wallet, cosmetics, milestone state, activity tracking |
| `game_snapshots` | Each round event in every game | Granular replay / analytics data |
| `game_summaries` | Each completed game | Final scoreboard per game |
| `bid_events` | Each round end (winning bid) | Raw bid-event log for analytics and cheat detection |
| `driver_selection_stats` | Each completed game (upserted) | Aggregated per-player, per-driver pick + win counts |
| `stripe_transactions` | Each credit-pack or cosmetic purchase | Payment audit ledger |
| `contact_messages` | Each contact form submission | Support inbox |

---

## What You Are Currently Gathering

### Identity & Auth
- **User accounts** (`users`): Replit OAuth user ID, email, first/last name, profile image URL, account create/update timestamps.
- **Sessions** (`sessions`): Session token (`sid`), full serialised session JSON (`sess`), expiry timestamp — managed automatically by `connect-pg-simple`.

### Player Economy
- **Credit balance** (`player_profiles.currency_balance`): Current spendable credits.
- **Lifetime earned / spent** (`lifetime_earned`, `lifetime_spent`): Cumulative credit totals for balance reconciliation.
- **Per-game conversion history** (`converted_game_ids`): Array of game IDs already converted to credits — prevents double-dipping.
- **Total trophies / moment-flags converted** (`converted_trophies`, `converted_moment_flags`, `moment_flags_per_type`): Running totals of in-game achievements turned into credits, broken down by flag type.

### Player Progression
- **Total wins / total games** (`total_wins`, `total_games`): Simple aggregate win/play counts.
- **Wins per mode** (`wins_per_mode`): Win counts keyed by mode+multiplayer combination (e.g. `"sp_haunted"`, `"mp_standard"`).
- **Games per mode** (`games_per_mode`): Play counts by the same mode keys.
- **Milestone unlocks** (`milestone_unlocks`): Array of milestone IDs the player has been awarded (e.g. `first_win`, `wins_10`).

### Cosmetics
- **Owned cosmetics** (`owned_cosmetics`): Array of cosmetic item IDs the player owns.
- **Equipped cosmetics** (`equipped_cosmetics`): Map of slot → cosmetic ID for the four slots: `logo`, `border`, `background`, `driverSkin`.

### Game Telemetry
- **Round snapshots** (`game_snapshots`): Per-round state recorded at each `round_end`, `elimination`, or `game_over` event, including:
  - Round number, game ID, lobby code, multiplayer flag
  - Round winner, winning hold time, minimum bid seconds
  - Eliminated player IDs this round
  - Moment flags triggered, protocols triggered, limit-breaks triggered
  - Token counts and remaining time per player
  - Full game settings (difficulty, variant, duration, protocols, abilities)
- **Game summaries** (`game_summaries`): End-of-game record per game ID, including:
  - Total rounds played, lobby code, multiplayer flag
  - Full per-player results: rank, tokens, time bid, net impact, eliminations, bot flag, moment-flags, protocol wins, drinks, social dares
  - Bonus trophy criteria and winners
  - Overall game winner ID and name

### Payments
- **Stripe transaction ledger** (`stripe_transactions`): Each credit-pack or cosmetic purchase with:
  - User ID, Stripe payment intent ID (when wired), credits amount
  - Item type (`credits_pack` | `cosmetic`), item ID, human-readable label
  - Status (`pending` | `completed` | `failed` | `refunded`)

### Support
- **Contact messages** (`contact_messages`): Name, email, message body, submission timestamp.

---

## What You Could Be Gathering

### Player Behaviour & Retention
- **`last_seen_at` and `login_count`** — ✅ Now present on `player_profiles` (added in migration 0002). Updated on every authenticated profile fetch.
- **Platform / device** — a `user_agent` or `device_type` tag on sessions or profiles would enable device-split analysis.

### Game Quality & Balance
- **Per-round bid times per player** — ✅ Now captured in the `bid_events` table (added in migration 0002). Records the winning bid per round from `round_end` snapshots.
- **Driver selection frequency** — ✅ Now aggregated in `driver_selection_stats` (added in migration 0002). Tracks per-player, per-driver pick and win counts, upserted at each game end.
- **Protocol / ability usage rates** — `protocols_triggered` and `limit_breaks_triggered` are arrays of names stored in snapshots but are never aggregated into a summary table.
- **Social dare / drink counts per variant** — `totalDrinks` and `socialDares` are in `game_summaries.player_results` but are not rolled up anywhere.

### Economy & Monetisation
- **Cosmetic purchase conversion funnel** — tracking which cosmetics players view but don't buy (shop impression events) would reveal pricing friction.
- **Wager outcomes** — if the wager system goes live, a `wager_results` table (`game_id`, `player_id`, `wagered_amount`, `outcome`, `credits_delta`) would be needed for audit and balance tuning.
- **Referral / invite tracking** — no referral code or invite chain table exists.

### Multiplayer Social
- **Lobby history** — lobbies currently live only in memory (`Map<string, Lobby>` in `routes.ts`) and are never persisted. Storing lobby records in the DB would enable MP game history on the player profile.
- **Friend list / blocked list** — no social graph table; adding one would unlock friend-invite and recent-opponents features.
- **Chat/message log** — if in-lobby text chat is added, a `chat_messages` table per lobby would be needed.

### Support & Moderation
- **Ban / suspension records** — no table exists for moderation actions; a `player_bans` table (`player_id`, `reason`, `expires_at`, `issued_by`) would support enforcement tools.
- **Contact message status** — `contact_messages` has no `status` or `resolved_at` field; adding one would allow triage inside an admin UI.

---

## What Is Not Scalable

### 1. JSONB Arrays Growing Without Bound
- **`converted_game_ids` (player_profiles)** — this array appends one entry per game played and is never pruned. A player who completes 10,000 games has a 10,000-element JSONB array loaded on every profile read. **Fix:** replace with a separate `currency_conversions` table (`player_id`, `game_id`, `converted_at`) and check for duplicates with a unique index instead.
- **`owned_cosmetics` (player_profiles)** — grows with every purchase. For the current catalog size (~50 items) this is fine, but a proper `player_cosmetics` join table would be more queryable.
- **`milestone_unlocks` (player_profiles)** — same pattern; unbounded append. A `player_milestones` table is more correct.
- **`moment_flags_per_type` (player_profiles)** — a map that grows as new flag types are added; not queryable by index.

### 2. JSONB for Relational Data in game_summaries / game_snapshots
- `player_results`, `bonus_trophy_results`, `player_positions`, `eliminated_player_ids`, `moment_flags_triggered`, `protocols_triggered`, `limit_breaks_triggered` are all JSONB blobs. **You cannot filter, sort, or aggregate by any of these sub-fields with standard SQL indexes.** To answer "who are the top 10 players by total tokens earned?" you must pull every row and deserialise in application code. **Fix:** normalise the most-queried fields (player rank, tokens, moment flags) into relational columns or a `game_player_results` table.

### 3. No Foreign-Key Constraints
- `game_summaries.winner_id`, `game_snapshots.winner_player_id`, `stripe_transactions.user_id` all reference player/user IDs but have **no `REFERENCES` constraint**, so orphaned rows are possible (e.g. a player deletes their account). **Fix:** add FKs with `ON DELETE SET NULL` / `ON DELETE CASCADE` as appropriate.
- `game_snapshots.game_id` and `game_summaries.game_id` share the same game ID but there is no FK linking them, nor a `games` parent table.

### 4. No Indexes Beyond Primary Keys
- The only explicit index is `IDX_session_expire` on `sessions`. There are no indexes on:
  - `game_snapshots(game_id)` — needed for "fetch all rounds for game X"
  - `game_summaries(game_id)` — same
  - `stripe_transactions(user_id)` — needed for "fetch payment history for player X"
  - `player_profiles(username)` — needed for username search
  Without these, any filtered query degrades to a full sequential scan.

### 5. Lobbies Are Entirely In-Memory
- The `lobbies` and `playerToLobby` Maps in `routes.ts` are process-local. A server restart wipes all active lobbies. Horizontal scaling (multiple server instances) is impossible with this design. **Fix:** move lobby state to Redis (ephemeral, pub/sub-capable) or a `lobbies` DB table with a TTL.

### 6. game_id Is a Non-Sequential String
- `createGameId()` returns `game_${Date.now()}_${randomString}`. Storing these as `varchar` primary keys means the index is not monotonically growing, which leads to index fragmentation in PostgreSQL over time. A `uuid` default (already used for most other tables) or a ULID would be better.

### 7. Integer Overflow Risk on Currency Fields
- `currency_balance`, `lifetime_earned`, `lifetime_spent`, `converted_trophies`, `converted_moment_flags` are all `integer` (PostgreSQL 4-byte signed int, max ≈ 2.1 billion). High-engagement players who earn thousands of credits per game could theoretically hit this ceiling over a long lifetime. `bigint` would be safer for lifetime totals.

---

## Relationship Map

```
users (id PK)
  └── player_profiles (id PK → users.id)      [no FK enforced]
        └── stripe_transactions (user_id → player_profiles.id) [no FK enforced]

game_snapshots (game_id, FK missing)
game_summaries  (game_id, FK missing)
  ↳  game_snapshots and game_summaries share game_id but there is no parent
     "games" table tying them together.

sessions  — standalone, managed by connect-pg-simple
contact_messages — standalone
```

---

## Recommended Schema Additions (Summary)

| Addition | Replaces / Augments | Benefit |
|---|---|---|
| `currency_conversions (player_id, game_id, converted_at)` | `player_profiles.converted_game_ids` (JSONB array) | Indexed, queryable, prunable |
| `player_cosmetics (player_id, cosmetic_id, equipped_slot)` | `owned_cosmetics` + `equipped_cosmetics` JSONB | Normalized, indexable |
| `player_milestones (player_id, milestone_id, unlocked_at)` | `milestone_unlocks` JSONB | Timestamped, queryable |
| `game_player_results (game_id, player_id, rank, tokens, …)` | `game_summaries.player_results` JSONB | SQL-aggregatable |
| `lobbies (code PK, host_player_id, status, settings, …)` | In-memory Map | Survives restarts, scalable |
| `bid_events (game_id, player_id, round, hold_seconds)` | Nothing (not captured) | Bid-pattern analytics |
| Indexes on `game_id`, `user_id` FK columns | None | Query performance |
| FK constraints throughout | None | Data integrity |
