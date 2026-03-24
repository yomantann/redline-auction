# Haunted Mode Changes - Implementation Status

## ✅ COMPLETED (Changes 1-7)

### 1. Data Model Additions ✅
- Added fields to `Player` interface in `client/src/pages/Game.tsx` (line ~323)
- Added fields to `GamePlayer` interface in `server/gameEngine.ts` (line ~148)
- New fields include: `ghostReason`, `ghostTimeAtDeath`, `ghostImage`, `relicConsumed`, `bidHistory`, `pendingLastWill`, `markedBy`, `echoForcedBid`, `corruptRoundsLeft`, `patternLockMinBid`, `phantomBidActive`, `deathWishActive`, `bloodPactActive`, `cursedDiceActive`

### 2. Ghost Reason Tagging ✅
- `server/gameEngine.ts`:
  - Line ~727: Natural ghosting (bid exceeds time) - added `ghostReason = 'natural'`
  - Line ~1383: Ability effects ghosting - added `ghostReason = 'natural'`
  - Line ~1575: Bid deduction ghosting - added `ghostReason = 'natural'`
  - Line ~1433: Reaper ability - added `ghostReason = 'forced'` + `ghostTimeAtDeath` capture
- `server/routes.ts`:
  - Line ~716: Reaper ability handler - added `ghostReason = 'forced'` + `ghostTimeAtDeath`
- `client/src/pages/Game.tsx`:
  - Line ~3207: Natural ghosting via bid - added `ghostReason = 'natural'`
  - Line ~3478: Reaper target - added `ghostReason = 'forced'` + `ghostTimeAtDeath`

### 3. Purgatory Revival Enhancement ✅
- `client/src/pages/Game.tsx` (line ~3621): Updated purgatory revival to check `ghostReason` and use `ghostTimeAtDeath` for forced ghosts
- `server/gameEngine.ts` (line ~1516): Same logic applied on server side
- Forced ghosts now revive with their frozen time bank; natural ghosts get min-alive time

### 4. Bid History Tracking ✅
- `client/src/pages/Game.tsx` (line ~3217): Added bid history tracking after playersState is built
- `server/gameEngine.ts` (line ~1577): Added bid history tracking after bid deduction
- Each round, valid bids (>0) are appended to `bidHistory` array

### 5. relicConsumed Tracking ✅
- Field added to data models (see #1)
- **TODO**: Need to add helper function and implement in relic activation flow (part of Change 9)

### 6. Ghost Spectator View ✅
- Added `currentPlayerIsGhost` computed value (line ~4872)
- Added ghost spectator UI to `ready`, `countdown`, and `bidding` phases
- Shows ghost image, ability name/description, purgatory countdown
- Displays "👻 YOU ARE A GHOST" / "AUCTION IN PROGRESS" messages
- Fixed `allPlayersReady` to exclude ghosts (line ~4883)
- Fixed ready counter display to exclude ghosts (line ~6819)

### 7. Round Progression Edge Cases ✅
- Removed "all ghosts = game end" block (was at line ~3664)
- Rounds now continue even if all players are ghosts
- Added auto-advance for ready phase when all alive players are ghosts (line ~1922)
- Game ends naturally when `round >= totalRounds`

---

## ⚠️ TODO (Changes 8-11) - Requires Additional Implementation

### 8. Game Over Scoreboard Enhancements
**Status**: Partially complete
- Ghost badge needs to be added to player cards
- ELIMINATED badge should not show for ghosts
- Ghost images need to be used in podium display (top 3)

**Files to modify**:
- `client/src/pages/Game.tsx` - `renderPlayerCard` function (~line 7094)
- `client/src/pages/Game.tsx` - Game over podium rendering (top3)

**Required changes**:
```tsx
// In renderPlayerCard:
{p.id === loser.id && !p.isGhost && <div className="...">ELIMINATED</div>}
{p.isGhost && <div className="absolute top-0 right-0 bg-teal-800/80 text-teal-200 text-[10px] font-bold px-2 py-0.5">👻 GHOST</div>}

// In podium rendering (for each top3 slot):
const displayImg = (variant === 'HAUNTED' && p.isGhost && p.ghostImage)
  ? GHOST_IMAGES[parseInt(p.ghostImage.replace('hnt_ghost_', ''), 10) - 1]
  : getCharacterImage(p.selectedDriver);
```

### 9. Relic Activation UX
**Status**: Not started
**Complexity**: HIGH - requires extensive new UI components

**Required components**:
1. `fireRelicEffect` function (massive switch statement for all 14 relics)
2. Relic activation states: `relicModalOpen`, `relicTargetPickOpen`, etc.
3. USE RELIC button in ready phase (conditional rendering)
4. Relic confirmation modal with target picker
5. `LastWillPicker` component for Last Will relic
6. Integration with consumeRelic tracking

**Location**: Insert after line ~2451 (after `assignGhostImage` helper)

**Relics to implement**:
- Self-target: `jackpot`, `wild_card`, `sacrificial_lamb`, `death_wish`, `blood_pact`, `cursed_dice`, `phantom_bid`
- Opponent-target: `ghost_touch`, `echo`, `marked`, `pattern_lock`, `last_will` (needs curse type picker)
- Bot-target: `corrupt`
- Vote-based: `protocol_forcer`, `memory_bank`, `coin_flip`, `revenant_call`

### 10. Deferred Relic Effects in endRound
**Status**: Not started
**Complexity**: MEDIUM

**Required logic** (add after ghost ability processing, before `setPlayers`):
- Last Will: trigger curse if player was ghosted this round
- Death Wish: +1 trophy on win, -15s on loss
- Blood Pact: all non-winners lose winner's bid
- Cursed Dice: ±20s random
- Marked: ghost the winner (50% chance to ghost marker too)
- Corrupt: decrement rounds counter
- Echo/Pattern Lock: clear flags after use

**Location**: `client/src/pages/Game.tsx` endRound function, around line ~3640

### 11. Multiplayer Relic Synchronization
**Status**: Not started
**Complexity**: MEDIUM

**Required changes**:
- Server-side relic effect handlers in `server/routes.ts`
- New socket event: `activate_relic`
- Broadcast relic effects to all players
- Sync relic state (relicConsumed, active flags) via game state

---

## Testing Checklist

### Data Model & Ghost Tagging
- [ ] Player goes ghost naturally (runs out of time) → `ghostReason = 'natural'`
- [ ] Player gets Reaped → `ghostReason = 'forced'` + time saved
- [ ] Forced ghost revives via Purgatory → gets original time back
- [ ] Natural ghost revives → gets min(alive times)

### Ghost Spectator
- [ ] SP: Ghost player sees spectator view in ready/countdown/bidding
- [ ] MP: Ghost player sees spectator view
- [ ] Ready phase auto-advances when all players are ghosts
- [ ] Game continues when all players are ghosts (doesn't end early)

### Bid History
- [ ] Each round, bids >0 are appended to `bidHistory`
- [ ] Echo relic can read last bid from history
- [ ] Pattern Lock can find max bid from history

### Game Over
- [ ] Ghost players show ghost images on podium
- [ ] Ghost badge appears on ghost player cards
- [ ] Eliminated badge doesn't show for ghosts

---

## Notes for Future Implementation

### Relic Effect Timing
- **Immediate**: `jackpot`, `ghost_touch`, `wild_card`, `sacrificial_lamb`, `echo`, `marked`, `corrupt`, `pattern_lock`, `phantom_bid`
- **Deferred (end of round)**: `death_wish`, `blood_pact`, `cursed_dice`, `last_will` (if ghosted), `marked` (if win)
- **Ongoing**: `corrupt` (3 rounds), `purgatory` possession tracking

### Vote Relics (Not Yet Implemented)
These require a voting UI system that doesn't exist yet:
- `protocol_forcer`: Vote to override next protocol
- `memory_bank`: Vote to repeat last round's protocol
- `coin_flip`: Vote for 50/50 sabotage all/help all
- `revenant_call`: Vote to revive a ghost

### Known Issues
1. Multiplayer relic activation not yet implemented (server sync needed)
2. Vote-based relics need voting UI system
3. Protocol Forcer needs protocol override logic in endRound
4. Some relic effects need additional animation/overlay support

---

## Dependencies Required

All ghost-related constants are already defined:
- `GHOST_IMAGES` (line 162)
- `GHOST_ABILITY_NAMES` (line 178)
- `GHOST_ABILITY_DESCS` (line 187)
- `HAUNTED_ITEMS` (relic definitions - location TBD)

The `assignGhostImage` function exists and is working correctly.
