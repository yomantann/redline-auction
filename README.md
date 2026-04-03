# Redline Auction

A fast-paced, real-time bidding game where players hold a button to place bids — the longer you hold, the higher your bid. Time is currency; every second spent is a second permanently lost from your bank. Outlast and outbid opponents across multiple rounds to win trophies.

## Game Modes

| Mode | Description |
|------|-------------|
| **Standard** | Classic bidding — hold longer to bid higher, but lose that time permanently |
| **Social Overdrive** | Social abilities and personality-based drivers |
| **Bio Fuel** | Bio-stat enhanced drivers with unique skill trees |
| **Haunted** | Ghosting mechanics, relics, purgatory/reaper abilities, and séance revivals |
| **High Circuit (Wager)** | Trophy-doubling wager variant |

## Key Features

- **Single Player & Multiplayer** — Play solo against CPU or compete online in real-time lobbies
- **Drivers & Abilities** — Choose from unique drivers, each with special bidding abilities
- **Protocols** — Random round modifiers (No Look, Mute, Calibration, Overclock, Panic Room, and more)
- **Haunted Relics** — Collectable relic items with unique effects (Echo, Séance, Tribunal, Conclave, etc.)
- **Profile & Shop** — Earn credits by winning games and converting trophies/flags; purchase cosmetics (logos, borders, backgrounds, driver skins)
- **Milestones** — Achievement system that rewards credits and cosmetics for in-game accomplishments

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Real-time**: Socket.IO
- **Auth**: Replit Auth
- **Payments**: Stripe

## Running Locally

```bash
npm install
npm run dev
```

The app runs on port 5000 by default.

## Project Structure

```
client/     # React frontend (pages, components, assets)
server/     # Express backend (game engine, routes, currency engine)
shared/     # Shared types and DB schema (Drizzle)
```

## Game Flow

1. Host creates a lobby and configures game settings (mode, rounds, difficulty)
2. Players join via lobby code and select their driver
3. Each round: players hold the button — bid = elapsed time + minimum bid
4. Releasing releases your bid; running out of time eliminates you (or ghosts you in Haunted mode)
5. Highest bid wins the round trophy; play continues until round limit or elimination
6. Most trophies at game over wins
