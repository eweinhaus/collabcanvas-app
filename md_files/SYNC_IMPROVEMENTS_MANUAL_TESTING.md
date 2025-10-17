# Sync Improvements - Manual Testing Guide

This document outlines manual testing procedures for the sync improvements implemented in this PR.

## Improvements Implemented

1. **Reduced Cursor Throttle** (50ms → 35ms, env-configurable)
2. **Client-side Cursor Interpolation** (60 FPS smooth rendering)
3. **Real-time Drag Broadcasting** (see shapes move during drag, not just at end)
4. **Batch Firestore Writes** (AI multi-shape operations)
5. **Periodic State Reconciliation** (self-healing for missed updates)

---

## Environment Configuration

### Optional Environment Variables

Create or update `.env` file:

```env
# Cursor update throttle (default: 35ms)
VITE_CURSOR_THROTTLE_MS=35

# Enable/disable periodic reconciliation (default: true)
VITE_ENABLE_RECONCILE=true
```

---

## Test 1: Cursor Smoothness

### Objective
Verify that remote cursors appear smooth at 60 FPS.

### Steps
1. Open the app in two browser windows (Chrome + Firefox recommended)
2. Log in as different users in each window
3. In Window A, move your cursor slowly across the canvas
4. In Window B, observe the remote cursor

### Success Criteria
- ✅ Remote cursor moves smoothly without visible jitter
- ✅ Remote cursor follows within ~35-50ms latency
- ✅ No console errors related to cursor updates

### Expected Behavior
- Cursor should appear to move in a continuous motion (interpolated)
- Movement should be fluid even though updates arrive every 35ms

---

## Test 2: Real-time Shape Dragging

### Objective
Verify that other users see shapes moving in real-time during drag, not just when released.

### Steps
1. Open the app in two browser windows
2. Log in as different users
3. In Window A, create a rectangle
4. In Window A, click and drag the rectangle slowly across the canvas (don't release yet)
5. In Window B, observe the rectangle

### Success Criteria
- ✅ Window B sees the rectangle moving while being dragged in Window A
- ✅ Updates arrive approximately every 100ms during drag
- ✅ Final position syncs correctly when drag ends
- ✅ No "jumping" or teleportation of shapes

### Expected Behavior
- Shape should move smoothly in real-time during drag
- Position should update ~10 times per second during active drag
- Final position should be authoritative from Firestore

---

## Test 3: Cursor Teleport Detection

### Objective
Verify that large cursor jumps don't cause interpolation artifacts.

### Steps
1. Open the app in two browser windows
2. In Window A, move cursor to top-left corner (0, 0)
3. Quickly jump cursor to bottom-right corner (far away)
4. In Window B, observe the remote cursor

### Success Criteria
- ✅ Cursor "snaps" to new position instead of slowly interpolating
- ✅ No visible trail or slow movement across screen
- ✅ Teleport threshold is ~500 pixels

### Expected Behavior
- Jumps > 500 pixels should snap immediately
- Small movements should interpolate smoothly

---

## Test 4: Batch Shape Creation

### Objective
Verify that multiple shapes can be created efficiently in a batch.

### Steps
1. Open browser console (F12)
2. Execute the following code to create 20 shapes at once:

```javascript
const shapes = Array.from({ length: 20 }, (_, i) => ({
  id: crypto.randomUUID(),
  type: 'rect',
  x: 100 + (i % 5) * 120,
  y: 100 + Math.floor(i / 5) * 120,
  width: 100,
  height: 100,
  fill: `hsl(${i * 18}, 70%, 50%)`,
}));

// Access the canvas context (you may need to adjust this based on your component structure)
// This is a test; in production, the AI or grid feature would call this
console.log('Creating', shapes.length, 'shapes in batch...');
```

3. Open Network tab in DevTools
4. Check Firestore write operations

### Success Criteria
- ✅ All 20 shapes appear on canvas
- ✅ Only 1-2 Firestore write requests (not 20 individual requests)
- ✅ Other users see all shapes appear nearly simultaneously
- ✅ Performance is fast (< 500ms total)

### Expected Behavior
- Batch writes should be significantly faster than individual writes
- Network tab should show minimal requests

---

## Test 5: Periodic Reconciliation

### Objective
Verify that missed updates are automatically recovered within 10 seconds.

### Steps
1. Open the app in two browser windows (A and B)
2. Open Network tab in Window B
3. In Window B, **temporarily block Firestore** (use DevTools Network throttling or ad blocker)
4. In Window A, create 2-3 shapes
5. In Window B, verify shapes are NOT visible
6. In Window B, **unblock Firestore**
7. Wait up to 10 seconds

### Success Criteria
- ✅ Shapes appear in Window B within 10 seconds automatically
- ✅ Console shows message: `[CanvasContext] Reconciliation: syncing shapes from server`
- ✅ No manual refresh required
- ✅ Only the "leader" tab performs reconciliation (check console)

### Expected Behavior
- Leader election: user with lowest UID becomes leader
- Reconciliation runs every 10 seconds
- Only visible tabs reconcile (hidden tabs skip)

---

## Test 6: Leader Election

### Objective
Verify that only one user reconciles at a time to reduce Firestore reads.

### Steps
1. Open the app in THREE browser windows (A, B, C)
2. Log in as different users with known UIDs (check user UID in console)
3. Open browser console in all windows
4. Wait 15 seconds for reconciliation cycle

### Success Criteria
- ✅ Only ONE window logs reconciliation messages
- ✅ The window with the lowest UID is the leader
- ✅ If leader disconnects, another user becomes leader

### Expected Behavior
- Leader is deterministically selected (lowest UID)
- Leadership changes when online users change

---

## Test 7: Multi-User Stress Test

### Objective
Verify that all improvements work together under realistic load.

### Steps
1. Open 3-5 browser windows/tabs
2. Log in as different users
3. Perform the following actions simultaneously:
   - Window A: Drag shapes continuously
   - Window B: Create new shapes
   - Window C: Move cursor rapidly
   - Window D: Delete shapes
   - Window E: Edit text shapes

### Success Criteria
- ✅ All operations sync correctly across windows
- ✅ No shapes "stuck" in inconsistent state
- ✅ Cursor movements remain smooth
- ✅ Drag updates appear in real-time
- ✅ No significant lag or freezing
- ✅ Console shows no errors

### Performance Targets
- Cursor latency: < 50ms
- Drag update latency: < 150ms
- Shape sync latency: < 200ms
- 60 FPS maintained on canvas

---

## Test 8: Network Resilience

### Objective
Verify that sync improvements handle network issues gracefully.

### Steps
1. Open the app in two browser windows
2. In Window A, enable **Fast 3G** throttling (Chrome DevTools)
3. In Window B, use normal connection
4. Perform drag and cursor operations

### Success Criteria
- ✅ Window A sees updates (slower but still works)
- ✅ Window B not affected by Window A's slow connection
- ✅ No errors or crashes
- ✅ Updates eventually sync correctly

---

## Test 9: Disable Features via Environment

### Objective
Verify that features can be disabled via env vars.

### Steps
1. Set `VITE_ENABLE_RECONCILE=false` in `.env`
2. Restart dev server (`npm run dev`)
3. Open browser console
4. Wait 15 seconds

### Success Criteria
- ✅ No reconciliation messages in console
- ✅ App still functions normally
- ✅ Other features (drag, cursor) still work

---

## Test 10: Firebase RTDB Rules

### Objective
Verify that new `activeEdits` rules work correctly.

### Steps
1. Check Firebase Console → Realtime Database → Rules
2. Verify `activeEdits` section exists under `boards/$boardId`
3. Attempt to write as authenticated user (should succeed)
4. Attempt to read as authenticated user (should succeed)

### Success Criteria
- ✅ Authenticated users can read `activeEdits`
- ✅ Authenticated users can write any shape in `activeEdits`
- ✅ Unauthenticated users cannot access `activeEdits`

---

## Regression Testing

Ensure existing features still work:

- [ ] Shape creation (rect, circle, text, triangle)
- [ ] Shape selection
- [ ] Shape deletion
- [ ] Text editing
- [ ] Color picker
- [ ] Pan and zoom
- [ ] Presence indicators
- [ ] User avatars in sidebar
- [ ] Keyboard shortcuts
- [ ] Authentication (login/logout)

---

## Performance Monitoring

### Metrics to Track

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cursor latency | < 50ms | Chrome DevTools Performance tab |
| Drag update frequency | ~10/sec | Console logs with `onDragMove` |
| Canvas FPS | 60 FPS | Chrome DevTools Rendering → FPS meter |
| Firestore reads/min | < 10/user | Firebase Console → Usage |
| RTDB writes/min | < 1200/user | Firebase Console → Usage (20/sec × 60) |
| Initial load time | < 2s | Lighthouse audit |

### Chrome DevTools Setup
1. Open DevTools (F12)
2. Performance tab → Record
3. Perform test actions
4. Stop recording
5. Analyze FPS, network timing, and long tasks

---

## Known Issues / Limitations

1. **Reconciliation** only runs when tab is visible (intentional)
2. **Leader election** based on UID (not robust to network partitions)
3. **Drag broadcasting** increases RTDB writes by ~50%
4. **Batch writes** limited to 500 shapes per batch (Firestore limit)
5. **Cursor interpolation** may show slight "lag" on very slow networks

---

## Rollback Plan

If issues arise in production:

1. Set `VITE_CURSOR_THROTTLE_MS=50` (revert to original)
2. Set `VITE_ENABLE_RECONCILE=false` (disable reconciliation)
3. Remove `onDragMove` callback from Shape component (disable drag broadcast)
4. Deploy updated env vars to Render

---

## Success Criteria Summary

**All improvements must:**
- ✅ Improve user experience measurably
- ✅ Not introduce new bugs
- ✅ Not significantly increase Firebase costs
- ✅ Work across modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Pass all automated tests
- ✅ Pass all manual tests listed above

---

## Contact

If issues are discovered during testing:
- Check browser console for errors
- Check Firebase Console for quota issues
- Check Network tab for failed requests
- Document reproduction steps

