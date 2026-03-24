# Quick Reference: Remaining Work (Changes 8-11)

## Change 8: Game Over Scoreboard (15-30 min)

### File: `client/src/pages/Game.tsx`

### Location: `renderPlayerCard` function (around line 7094)

**1. Hide ELIMINATED badge for ghosts:**
```tsx
// BEFORE:
{p.id === loser.id && <div className="...">ELIMINATED</div>}

// AFTER:
{p.id === loser.id && !p.isGhost && <div className="...">ELIMINATED</div>}
```

**2. Add GHOST badge:**
```tsx
// Add after winner badge check:
{p.isGhost && (
  <div className="absolute top-0 right-0 bg-teal-800/80 text-teal-200 text-[10px] font-bold px-2 py-0.5">
    👻 GHOST
  </div>
)}
```

### Location: Game over podium (top 3)

**Replace character images with ghost images for ghosts:**
```tsx
// For each podium slot (0, 1, 2):
const displayImg = (variant === 'HAUNTED' && topThree[N].isGhost && topThree[N].ghostImage)
  ? GHOST_IMAGES[parseInt(topThree[N].ghostImage.replace('hnt_ghost_', ''), 10) - 1]
  : getCharacterImage(topThree[N].selectedDriver);

return imgSrc ? (
  <img src={displayImg} alt="..." className="..." />
) : (
  <div className="...">{topThree[N].name.charAt(0).toUpperCase()}</div>
);
```

---

## Change 9: Relic Activation UX (4-6 hours)

### Step 1: Add State (after line ~876)

```tsx
const [relicModalOpen, setRelicModalOpen] = useState(false);
const [relicTargetPickOpen, setRelicTargetPickOpen] = useState(false);
const [relicTargetPickRelicId, setRelicTargetPickRelicId] = useState<string | null>(null);
const [pendingRelicTargetId, setPendingRelicTargetId] = useState<string | null>(null);
```

### Step 2: Add fireRelicEffect Function (after line ~2451)

See full implementation in the original task description. Key structure:

```tsx
const fireRelicEffect = (relicId: string, activatorId: string, targetId?: string, curseType?: 'time' | 'trophy') => {
  setPlayers(prev => {
    const next = prev.map(p => ({ ...p }));
    const activator = next.find(p => p.id === activatorId);
    if (!activator) return prev;

    activator.relicConsumed = true;

    switch (relicId) {
      case 'jackpot': /* random 25% outcomes */ break;
      case 'ghost_touch': /* 10% ghost chance */ break;
      case 'sacrificial_lamb': /* random victim -1 trophy */ break;
      case 'wild_card': /* shuffle time banks */ break;
      case 'echo': /* force last bid next round */ break;
      case 'marked': /* ghost on next win */ break;
      case 'corrupt': /* aggressive for 3 rounds */ break;
      case 'pattern_lock': /* min bid = max past bid */ break;
      case 'last_will': /* deferred curse */ break;
      case 'death_wish': /* +2 win / -15s lose */ break;
      case 'blood_pact': /* all lose winner's bid */ break;
      case 'cursed_dice': /* ±20s random */ break;
      case 'phantom_bid': /* hide bid */ break;
      case 'protocol_forcer': /* force dark protocol */ break;
    }

    return next;
  });
};
```

### Step 3: Add USE RELIC Button (in ready phase, after line ~6785)

```tsx
{variant === 'HAUNTED' && !currentPlayerIsGhost && (() => {
  const myPlayer = isMultiplayer ? displayPlayers.find(p => p.id === myMultiplayerPlayer?.id) : players.find(p => p.id === 'p1');
  const relicId = myPlayer?.selectedItem;
  if (!relicId || myPlayer?.relicConsumed) return null;
  const relicDef = HAUNTED_ITEMS.find(r => r.id === relicId);
  if (!relicDef) return null;
  
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button
        onClick={() => setRelicModalOpen(true)}
        className="px-4 py-2 rounded-lg border border-teal-500/40 bg-teal-950/30 text-teal-300 text-sm font-bold hover:bg-teal-900/40 hover:border-teal-400/60 transition-all"
      >
        {relicDef.icon} USE RELIC: {relicDef.name}
      </button>
    </div>
  );
})()}
```

### Step 4: Add Relic Modal (end of ready case)

See full modal implementation in original task description. Key components:
- Confirmation for self-target relics
- Target picker for opponent-target relics
- Special `LastWillPicker` for Last Will relic (choose target + curse type)
- Vote relic placeholder (not yet implemented)

### Step 5: Add LastWillPicker Component

```tsx
function LastWillPicker({ opponents, onConfirm, onCancel }: {
  opponents: { id: string; name: string; remainingTime: number; tokens: number }[];
  onConfirm: (targetId: string, curseType: 'time' | 'trophy') => void;
  onCancel: () => void;
}) {
  const [pickedTarget, setPickedTarget] = React.useState<string | null>(null);
  const [pickedCurse, setPickedCurse] = React.useState<'time' | 'trophy' | null>(null);
  
  return (
    <div className="space-y-3">
      {/* Target selection UI */}
      {/* Curse type selection UI */}
      {/* Confirm button */}
    </div>
  );
}
```

---

## Change 10: Deferred Relic Effects (2-3 hours)

### Location: `endRound` function, after ghost ability processing (~line 3640)

```tsx
// Deferred relic effects
if (variant === 'HAUNTED') {
  finalPlayers.forEach(p => {
    // Last Will: if player was ghosted this round
    if (p.pendingLastWill && p.isGhost && !players.find(op => op.id === p.id)?.isGhost) {
      const willTarget = finalPlayers.find(fp => fp.id === p.pendingLastWill!.targetId);
      if (willTarget) {
        if (p.pendingLastWill.curseType === 'time') {
          willTarget.remainingTime = Math.max(0, willTarget.remainingTime - 20);
          addOverlay('protocol_alert', '📜 LAST WILL TRIGGERED', `${p.name} left a curse! ${willTarget.name} loses 20s.`, 3000);
        } else {
          willTarget.tokens = Math.max(0, willTarget.tokens - 1);
          addOverlay('protocol_alert', '📜 LAST WILL TRIGGERED', `${p.name} left a curse! ${willTarget.name} loses 1 trophy.`, 3000);
        }
      }
      p.pendingLastWill = undefined;
    }

    // Death Wish: check if won/lost
    if (p.deathWishActive) {
      if (p.id === winnerId) {
        p.tokens += 1; // +2 total (already got +1 from winning)
        setTimeout(() => addOverlay('ability_trigger', '💀 DEATH WISH: WIN!', '+1 bonus trophy!', 3000), 600);
      } else {
        p.remainingTime = Math.max(0, p.remainingTime - 15);
        setTimeout(() => addOverlay('ability_trigger', '💀 DEATH WISH: CURSED', '-15s extra penalty.', 3000), 600);
      }
      p.deathWishActive = false;
    }

    // Blood Pact: all non-winners lose winner's bid
    if (p.bloodPactActive && winnerId && winnerTime > 0) {
      finalPlayers.forEach(fp => {
        if (fp.id !== winnerId && !fp.isGhost && !fp.isEliminated) {
          fp.remainingTime = Math.max(0, fp.remainingTime - winnerTime);
        }
      });
      setTimeout(() => addOverlay('protocol_alert', '🩸 BLOOD PACT', `Everyone loses ${winnerTime.toFixed(1)}s!`, 3000), 600);
      p.bloodPactActive = false;
    }

    // Cursed Dice: ±20s random
    if (p.cursedDiceActive) {
      const gain = Math.random() > 0.5;
      if (gain) {
        p.remainingTime += 20;
        setTimeout(() => addOverlay('ability_trigger', '🎲 CURSED DICE: LUCKY!', '+20s!', 3000), 600);
      } else {
        p.remainingTime = Math.max(0, p.remainingTime - 20);
        setTimeout(() => addOverlay('ability_trigger', '🎲 CURSED DICE: CURSED!', '-20s!', 3000), 600);
      }
      p.cursedDiceActive = false;
    }

    // Marked: ghost if won
    if (p.markedBy && p.id === winnerId) {
      const marker = finalPlayers.find(fp => fp.id === p.markedBy);
      const savedTime = p.remainingTime;
      const ghostData = assignGhostImage();
      p.isGhost = true;
      p.ghostReason = 'forced';
      p.ghostTimeAtDeath = savedTime;
      p.ghostAbility = ghostData.ghostAbility;
      p.characterIcon = ghostData.characterIcon;
      p.ghostImage = ghostData.ghostImage;
      p.remainingTime = 0;
      p.markedBy = undefined;
      setTimeout(() => addOverlay('protocol_alert', '🎯 MARK TRIGGERED', `${p.name} ghosted!`, 0), 800);
      
      // 50% chance to ghost marker too
      if (marker && !marker.isGhost && !marker.isEliminated && Math.random() < 0.5) {
        const markerGhostData = assignGhostImage();
        const markerSavedTime = marker.remainingTime;
        marker.isGhost = true;
        marker.ghostReason = 'forced';
        marker.ghostTimeAtDeath = markerSavedTime;
        marker.ghostAbility = markerGhostData.ghostAbility;
        marker.characterIcon = markerGhostData.characterIcon;
        marker.ghostImage = markerGhostData.ghostImage;
        marker.remainingTime = 0;
        setTimeout(() => addOverlay('protocol_alert', '🎯 MARK BACKLASH', `${marker.name} also ghosted!`, 0), 1200);
      }
    }

    // Corrupt: decrement rounds
    if (p.corruptRoundsLeft !== undefined && p.corruptRoundsLeft > 0) {
      p.corruptRoundsLeft--;
      if (p.corruptRoundsLeft <= 0) {
        p.corruptRoundsLeft = undefined;
        if (p.isBot) p.personality = ['balanced', 'aggressive', 'conservative', 'random', 'adaptive', 'psychological'][Math.floor(Math.random() * 6)] as any;
      }
    }

    // Clear one-time flags
    p.phantomBidActive = false;
  });
}
```

---

## Change 11: Multiplayer Relic Sync (2-3 hours)

### File: `server/routes.ts`

Add new socket event handler:

```typescript
socket.on('activate_relic', (data: { lobbyCode: string; relicId: string; targetId?: string; curseType?: 'time' | 'trophy' }, callback?: (response: any) => void) => {
  const game = games.get(data.lobbyCode);
  if (!game) {
    callback?.({ success: false, error: 'Game not found' });
    return;
  }

  const player = game.players.find(p => p.socketId === socket.id);
  if (!player || player.relicConsumed) {
    callback?.({ success: false, error: 'Invalid player or relic already used' });
    return;
  }

  // Mark relic as consumed
  player.relicConsumed = true;

  // Execute relic effect (similar to client fireRelicEffect logic)
  switch (data.relicId) {
    case 'jackpot': /* ... */ break;
    case 'ghost_touch': /* ... */ break;
    // ... etc
  }

  // Broadcast updated state
  broadcastGameState(data.lobbyCode);
  callback?.({ success: true });
});
```

### Integration Points:
1. Call `socket.emit('activate_relic', ...)` from client modal
2. Wait for server confirmation before closing modal
3. Server broadcasts updated game state to all players
4. All clients receive updated player states with relic effects applied

---

## Testing Strategy

### For Change 8:
1. End game with mix of ghosts and alive players
2. Verify ghost badge shows on ghost cards
3. Verify ELIMINATED doesn't show for ghosts
4. Check top 3 podium uses ghost images

### For Change 9:
1. Test each relic individually
2. Verify target picker works
3. Check Last Will dual-picker
4. Ensure relicConsumed prevents re-use

### For Change 10:
1. Test each deferred effect timing
2. Verify overlay messages appear
3. Check edge cases (death wish win/lose, marked backlash, etc.)

### For Change 11:
1. Two-player test: one activates relic
2. Verify other player sees effect
3. Check race conditions (simultaneous relic use)
4. Test disconnection during relic activation

---

## Constants Needed

Make sure these exist (they should already be in Game.tsx):

```tsx
const GHOST_IMAGES = [hntGhost1, ..., hntGhost8];
const GHOST_ABILITY_NAMES = { reaper: '💀 REAPER', ... };
const GHOST_ABILITY_DESCS = { reaper: '...', ... };
const HAUNTED_ITEMS = [ /* array of relic definitions */ ];
```

---

## Estimated Timeline

- **Change 8:** 30 minutes
- **Change 9:** 5 hours
- **Change 10:** 2.5 hours
- **Change 11:** 2.5 hours

**Total:** ~10-11 hours of focused development work

---

## Priority Order

1. **Change 8** (quick win, high visibility)
2. **Change 9** (core feature, enables testing)
3. **Change 10** (completes single-player relic system)
4. **Change 11** (adds multiplayer support)

---

## Notes

- All changes build on the completed Changes 1-7
- No breaking changes to existing functionality
- Maintain consistent code style
- Add overlays/animations for player feedback
- Consider adding sound effects for relic activation
