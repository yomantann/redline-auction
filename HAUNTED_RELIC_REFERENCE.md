# Haunted Mode — Relic & Ghost Ability Reference

Master reference for all Haunted relic contingencies and ghost abilities.

---

## Relics

| # | Icon | Name | Category | Target | Contingency / Outcomes |
|---|------|------|----------|--------|------------------------|
| 01 | 👻 | Ghost Touch | Cursed | Opponent | **10%** — target immediately ghosted (ghost ability assigned) · **90%** — miss, no effect |
| 02 | 🐑 | Sacrificial Lamb | Spooky | Everyone | One random alive player (including activator) loses 1 trophy |
| 03 | 🌀 | Wild Card | Mystical | Everyone | All time banks randomly redistributed among alive players — no one receives their own |
| 04 | 💀 | Death Wish | Cursed | Self | Win the round → **+2 trophies** (instead of 1) · Lose/tie the round → **−15s** extra on top of bid |
| 05 | 🩸 | Blood Pact | Cursed | Everyone | Next round winner wins normally · All non-winners **also lose the winner's bid time** on top of their own bid |
| 06 | 🎲 | Cursed Dice | Cursed | Self | After round resolves → **50% +20s** · **50% −20s** · No way to influence outcome |
| 07 | 🕯️ | Séance | Mystical | Everyone | **≥2 active ghosts** — all ghosts revived with `max(45s, frozen time bank)`, caster gains **+1 trophy** · **< 2 ghosts** — fails, relic **not consumed** |
| 08 | ⛓️ | Protocol Forcer | Spooky | Everyone | Forced dark protocol next round (random pick from: `DATA_BLACKOUT`, `SYSTEM_FAILURE`, `PANIC_ROOM`, `TIME_TAX`, `THE_MOLE`, `UNDERDOG_VICTORY`) |
| 09 | 🎰 | Jackpot | Chaotic | Self | **25%** → +40s to time bank · **25%** → +2 trophies · **25%** → −30s from time bank · **25%** → immediately ghosted |
| 10 | ⚰️ | Last Will | Cursed | Opponent | Activator **ghosted this round** → chosen opponent loses **20s** (time) or **1 trophy** (selected at activation) · Activator **survives** → no effect, relic still consumed |
| 11 | ⚖️ | The Tribunal | Mystical | Opponent | Vote **A majority** → target −15s next round · Vote **B majority** → target must bid ≥30s next round · **Tie** → A |
| 12 | ✒️ | Final Writ | Cursed | Self | Final round skipped — activator **auto-wins** that round's trophy regardless of other effects |
| 13 | 🔁 | Echo | Spooky | Opponent | Target **has bid history** → forced to replay exact last bid next round · Target **has no history** → no effect |
| 14 | 👁️ | Marked | Cursed | Opponent | Next time marked target **wins a round** → immediately ghosted (trophy still awarded) + **50% chance activator also ghosted** · Mark persists until triggered |
| 15 | 🦠 | Corrupt | Cursed | Bot Opponent | Target bot personality overridden to **aggressive** for 3 rounds (bot targets only) |
| 16 | 🔒 | Pattern Lock | Mystical | Opponent | Target **has bid history** → highest past bid becomes their forced minimum next round · Target **has no history** → no effect |
| 17 | 🗳️ | The Conclave | Chaotic | Everyone | Vote **A** → all time banks halved · Vote **B** → next round skipped as a tie · Vote **C** → 100% protocol chance for rest of game · Vote **D** → bottom 2 players by trophies each lose 1 trophy |

---

## Ghost Abilities

When a player is ghosted (by any means), they are assigned one of six ghost abilities at random.

| Ability | Icon + Name | Effect |
|---------|-------------|--------|
| `reaper` | 💀 REAPER | Another alive player is immediately ghosted |
| `curse` | 🔮 CURSE | All DISRUPT driver abilities deal **triple damage** for alive players |
| `vendetta` | ⚔️ VENDETTA | Challenge a random alive player to a click battle — winner is revived, loser loses **25% of their time bank** |
| `bargain` | 🤝 BARGAIN | Offer trophies to an alive player — they give **N × 40s** in return |
| `possession` | 👁️ POSSESSION | Latch onto a player — revived with **45s** when that player is eliminated/ghosted, or after **3 rounds** |
| `purgatory` | 🌑 PURGATORY | After **2 rounds**, return with the time bank of the most at-risk alive player |

---

## Notes

- Relics are consumed on activation unless otherwise stated (Séance fails without ≥2 ghosts and is **not** consumed).
- The `corrupt` relic targets bots only and does not appear in the player relic selection for human opponents.
- Blood Pact and Last Will effects resolve at **end of round** (deferred), not immediately on activation.
- Death Wish: "losing the round" means not winning — being eliminated or simply bidding lower than the winner both trigger the −15s penalty.
- Marked ghost fires **after** the trophy is awarded for that winning round.
- Jackpot ghost outcome: ghost ability is assigned normally at ghosting time.
- Protocol Forcer dark pool (bot version): `PANIC_ROOM`, `TIME_TAX`, `THE_MOLE`, `UNDERDOG_VICTORY` (smaller subset than player version).
