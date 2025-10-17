# Manual Testing Guide - Persistence & Reconnection Upgrade

## Quick Test Scenarios

### 1. Mid-Operation Refresh (Full Props Preservation)

**Test**: Mid-Drag Refresh
1. Create a rectangle on canvas
2. Start dragging it to a new position
3. **While dragging**, press `Cmd/Ctrl + R` to refresh the page
4. **Expected**: Rectangle appears at the dragged position (not original position)
5. **Success Criteria**: Position preserved with 100% accuracy

**Test**: Mid-Transform Refresh
1. Create a circle
2. Select it (Transformer appears)
3. Start rotating or scaling
4. **While transforming**, refresh the page
5. **Expected**: Circle appears with the transformed rotation/scale
6. **Success Criteria**: All transform properties preserved

**Test**: Mid-Color Change Refresh
1. Create a shape
2. Double-click to open color picker
3. Change color
4. **Immediately** refresh before closing picker
5. **Expected**: New color preserved
6. **Success Criteria**: Color change saved

---

### 2. Offline Operation Queueing

**Test**: Create Shapes Offline
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Create 3-5 shapes on canvas
4. **Observe**: Connection banner shows "Offline - X changes queued"
5. Set throttling back to "Online"
6. **Expected**: Banner shows "Syncing X operations..." then "Connected"
7. **Success Criteria**: All shapes sync to server and appear for other users

**Test**: Edit Shapes Offline
1. Create 3 shapes normally (while online)
2. Go offline (DevTools → Network → Offline)
3. Move, rotate, and change colors of shapes
4. **Observe**: Banner shows queued operations
5. Go back online
6. **Expected**: All changes sync automatically
7. **Success Criteria**: Zero data loss, all edits reflected on server

---

### 3. Connection Banner Visibility

**Test**: Banner States
1. **Start Online**: Banner should NOT be visible
2. **Go Offline**: 
   - Banner appears: "📡 Offline"
   - Shows: "X changes queued" if operations pending
3. **Go Online with Queue**:
   - Banner shows: "⬆️ Syncing - X operations pending"
   - Then disappears when synced
4. **Firebase Disconnect** (simulate):
   - Open Network tab → Throttle to "Slow 3G"
   - Banner shows: "🔄 Reconnecting"
5. **Success Criteria**: Clear visual feedback at every stage

---

### 4. Rapid Edits + Tab Close

**Test**: Persistence of Last-Second Changes
1. Open canvas in **two browser windows** (side-by-side)
2. In Window 1: Create 5 shapes rapidly (1 per second)
3. **Immediately** close Window 1 (within 1-2 seconds of last edit)
4. In Window 2: Wait 5 seconds, refresh page
5. **Expected**: All 5 shapes visible in Window 2
6. **Success Criteria**: Zero data loss, even with immediate tab close

---

### 5. Reconnection After Extended Disconnect

**Test**: 2-Minute Full Disconnect
1. Create 5-10 shapes on canvas
2. **Close ALL browser tabs/windows** with CollabCanvas
3. Wait **2 minutes**
4. Reopen CollabCanvas
5. **Expected**: All shapes intact, full canvas state restored
6. **Success Criteria**: Complete persistence, nothing lost

**Test**: Network Simulation (30+ seconds)
1. Create 3 shapes
2. Open DevTools → Network → Throttle to "Offline"
3. Wait **30 seconds**
4. Create 3 more shapes (queued)
5. Set throttling back to "Online"
6. **Expected**: 
   - Banner shows "Syncing 3 operations..."
   - All 6 shapes visible after sync
   - Toast notification: "Synced 3 operations"
7. **Success Criteria**: Automatic recovery, clear feedback

---

### 6. Retry Logic Verification

**Test**: Transient Error Handling
1. Create a shape
2. **Simulate Firebase error** (optional: modify firestoreServiceWithQueue to throw error on next write)
3. Try to move the shape
4. **Expected**: 
   - Operation queued
   - Banner shows "Syncing 1 operation pending"
   - After 1-2 seconds, retry succeeds
   - Toast: "Synced 1 operation"
5. **Success Criteria**: Automatic retry without user intervention

---

### 7. Fast Reconciliation

**Test**: Instant Sync on Reconnect
1. Create 3 shapes normally
2. Go offline
3. In another tab (still online), delete 1 shape
4. Go back online in first tab
5. **Expected**: 
   - Within **3 seconds** (not 10s!), deleted shape disappears
   - Instant reconciliation triggered by reconnect
6. **Success Criteria**: Sync happens ≤3s (faster than old 10s interval)

---

## Advanced Edge Cases

### Multi-User Concurrent Offline Edits
1. User A and User B both online
2. Both go offline simultaneously
3. User A creates 3 shapes, User B creates 3 different shapes
4. Both go back online
5. **Expected**: All 6 shapes appear (no conflicts, both queues flush)

### Buffer Size Limits
1. Go offline
2. Create 100+ shapes rapidly
3. Go back online
4. **Expected**: All shapes sync (may take 10-20 seconds for batch)
5. **Watch**: Browser console for any errors

### IndexedDB Unavailable (Private Browsing)
1. Open CollabCanvas in **Incognito/Private mode**
2. Create shapes
3. Drag shapes mid-operation
4. Refresh
5. **Expected**: Falls back to SessionStorage (may lose some recent edits in private mode)
6. **Success Criteria**: App still functions, doesn't crash

---

## Success Metrics

### Excellent (8-9/9) Checklist
- ✅ Mid-operation refresh preserves **100%** of state (all props, not just x,y)
- ✅ All users disconnect → canvas **fully** intact on return
- ✅ Network drop (30s+) → **auto-reconnects** with complete state
- ✅ Operations during disconnect **queue** and sync on reconnect
- ✅ **Clear UI indicator** for connection status (banner with details)
- ✅ **Instant reconciliation** on reconnect (≤3s, not 10s)
- ✅ **Retry logic** handles transient errors automatically
- ✅ **Zero data loss** in all tested scenarios

---

## Troubleshooting

### Banner Never Shows "Connected"
- Check browser console for errors
- Verify Firebase connection in DevTools → Application → IndexedDB
- Check operation queue: `await getStats('default')`

### Operations Not Syncing
- Open browser console
- Check for error messages in `[OperationQueue]` logs
- Verify auth state: `auth.currentUser` should not be null
- Check Firebase rules allow write access

### Buffer Not Restoring
- Check IndexedDB → `keyval-store` → Look for `editBuffer:*` entries
- Verify buffer timestamp is newer than server timestamp
- Check console for `[CanvasContext] Restoring buffered state` logs

---

## Test Report Template

```
Date: _________
Tester: _________

| Scenario | Status | Notes |
|----------|--------|-------|
| Mid-drag refresh | ☐ Pass ☐ Fail | __________ |
| Mid-transform refresh | ☐ Pass ☐ Fail | __________ |
| Offline shape creation | ☐ Pass ☐ Fail | __________ |
| Banner visibility | ☐ Pass ☐ Fail | __________ |
| Rapid edits + close | ☐ Pass ☐ Fail | __________ |
| 2-min disconnect | ☐ Pass ☐ Fail | __________ |
| 30s network drop | ☐ Pass ☐ Fail | __________ |
| Instant reconciliation | ☐ Pass ☐ Fail | __________ |

Overall Score: ___/9

Issues Found:
1. _________________________
2. _________________________
```

---

## Automated Testing

Run the test suite:
```bash
npm test -- --testPathPatterns="operationQueue|editBuffers|useConnectionStatus"
```

Expected: All tests pass (30+ tests)

