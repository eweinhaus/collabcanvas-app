# Shape Blink Bug Fix

## ✅ Final Solution Summary
The blink was caused by **reconciliation re-applying server versions of optimistically created shapes**. The fix: **track recently created shapes and skip them during reconciliation for 5 seconds**.

This allows optimistic updates to stay visible without being interrupted by server reconciliation.

```plaintext
State after creating shape:
  - Optimistic shape rendered immediately
  - Firestore create pending
  - recentlyCreatedShapesRef[id] = Date.now()

Reconciliation triggered within 5 second window:
  - Server snapshot arrives (no timestamps yet)
  - shouldIgnoreServerShape(id) returns true → skipped

After 5 seconds:
  - Tracking entry removed automatically
  - Future reconciliation applies server truth if needed
```

---

## Issue Description
Shapes were "blinking" one time when created on the canvas. The console showed multiple Firebase reconnection events triggering reconciliation.

**Console Output**:
```
[firestoreService] Creating shape with auth: {...}
CommentsContext.jsx:52 [CommentsContext] Subscribing to comments for shape: ...
commentService.js:310 [commentService] Subscribing to comments for shape ...
CanvasContext.jsx:608 [CanvasContext] Firebase reconnected, triggering instant reconciliation
2CanvasContext.jsx:573 [CanvasContext] Reconciliation: syncing shapes from server
2CanvasContext.jsx:608 [CanvasContext] Firebase reconnected, triggering instant reconciliation
CanvasContext.jsx:573 [CanvasContext] Reconciliation: syncing shapes from server
CanvasContext.jsx:608 [CanvasContext] Firebase reconnected, triggering instant reconciliation
```

---

## Root Causes

### 1. Aggressive Reconciliation (Primary Cause)
The reconciliation logic used `SET_SHAPES` action which **replaced the entire shapes array**:

```javascript
// ❌ OLD CODE - Replaces entire array
if (needsUpdate) {
  dispatch({ type: CANVAS_ACTIONS.SET_SHAPES, payload: serverShapes });
}
```

**Problem**: Even if only ONE shape changed, ALL shapes would unmount and remount, causing the visible "blink" effect.

### 2. Comment Auto-Subscription (Secondary Cause)
Canvas.jsx had a useEffect that subscribed to comments for **every shape** on every render:

```javascript
// ❌ OLD CODE - Auto-subscribe to all shapes
useEffect(() => {
  shapes.forEach(shape => {
    subscribeToShape(shape.id);
  });
}, [shapes, subscribeToShape]);
```

**Problem**: 
- Created new Firestore subscriptions for every shape
- Potentially triggered Firebase connection state changes
- Unnecessary subscriptions for shapes without comments

### 3. Multiple Rapid Reconnection Events
The `.info/connected` listener fired multiple times without proper debouncing:

```javascript
// ❌ OLD CODE - Fired on every connection event
reconnectUnsubscribe = onValue(connectedRef, async (snapshot) => {
  const isConnected = snapshot.val();
  if (isConnected && now - lastReconcileTime > MIN_RECONCILE_INTERVAL) {
    reconcile();
  }
});
```

**Problem**: Fired reconciliation even when already connected, causing multiple rapid reconciliations.

---

## Solutions Applied

### Fix 1: Skip Recently Created Shapes in Reconciliation (Primary Fix)
**Problem**: Even with granular updates, reconciliation was re-applying server versions of shapes that were just created optimistically, causing a blink.

**Solution**:
1. Track recently created shapes in `recentlyCreatedShapesRef`
2. Skip reconciliation, live updates, and missing-shape deletes for IDs within a 10s grace window
3. Auto-prune entries after grace period to allow eventual server truth

```javascript
// ✅ NEW CODE - Track recently created shapes
const recentlyCreatedShapesRef = useRef(new Map());
const CREATED_SHAPE_GRACE_MS = 10000; // 10s

// In addShape:
recentlyCreatedShapesRef.current.set(shape.id, Date.now());

// In reconciliation:
const createdAt = recentlyCreatedShapesRef.current.get(serverShape.id);
if (createdAt && now - createdAt < 5000) {
  console.log(`Skipping recently created shape ${serverShape.id}`);
  return; // Skip this shape
}

// After grace period
recentlyCreatedShapesRef.current.delete(serverShape.id);
```

**Benefits**:
- ✅ **Completely eliminates blink** on shape creation
- ✅ Optimistic updates stay visible without interruption
- ✅ Server data eventually reconciles after 5 seconds (plenty of time)
- ✅ Handles batch creation correctly
- ✅ Works seamlessly with live Firestore subscriptions & comment indicators

---

### Fix 2: Granular Reconciliation (Secondary Fix)
Changed reconciliation to update **only the shapes that actually changed**:

```javascript
// ✅ NEW CODE - Granular updates
serverShapes.forEach((serverShape) => {
  const localShape = localShapeMap.get(serverShape.id);
  if (!localShape) {
    // New shape from server
    dispatch({ type: CANVAS_ACTIONS.APPLY_SERVER_CHANGE, payload: serverShape });
  } else {
    // Check if server version is newer
    const serverTs = serverShape.updatedAt ?? 0;
    const localTs = localShape.updatedAt ?? 0;
    if (serverTs > localTs + 100) {
      dispatch({ type: CANVAS_ACTIONS.APPLY_SERVER_CHANGE, payload: serverShape });
    }
  }
});

// Handle deletions
state.shapes.forEach((localShape) => {
  if (!serverShapeMap.has(localShape.id)) {
    dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: localShape.id });
  }
});
```

**Benefits**:
- Only changed shapes re-render
- No more "blink" effect
- Better performance with many shapes
- More precise state updates

---

### Fix 3: Remove Auto-Subscription
Removed the automatic comment subscription for all shapes:

```javascript
// ✅ NEW CODE - No auto-subscription
// Don't auto-subscribe to comments - subscribe on-demand when user interacts
// This prevents unnecessary Firestore connections that trigger reconciliation
```

**Benefits**:
- Fewer Firestore connections
- Less network traffic
- Comments only load when actually needed
- Subscriptions happen via:
  - User clicks comment indicator
  - User opens comment thread
  - User right-clicks → Add Comment

---

### Fix 4: Improved Reconnection Debouncing
Added state tracking to only reconcile on actual reconnection (disconnected → connected):

```javascript
// ✅ NEW CODE - Track connection state
let wasConnected = false;
const MIN_RECONCILE_INTERVAL = 3000; // Increased from 2000ms

reconnectUnsubscribe = onValue(connectedRef, async (snapshot) => {
  const isConnected = snapshot.val();
  const now = Date.now();
  
  // Only reconcile on transition from disconnected -> connected
  if (isConnected && !wasConnected && now - lastReconcileTime > MIN_RECONCILE_INTERVAL) {
    lastReconcileTime = now;
    console.log('[CanvasContext] Firebase reconnected, triggering instant reconciliation');
    reconcile();
  }
  
  wasConnected = isConnected;
});
```

**Benefits**:
- Prevents multiple rapid reconciliations
- Only reconciles on actual reconnection events
- 3-second debounce window (up from 2s)
- More efficient resource usage

---

## Files Modified

1. **`src/context/CanvasContext.jsx`**
   - ✅ **Added `recentlyCreatedShapesRef` to track newly created shapes**
   - ✅ **Skip recently created shapes in reconciliation (5 second window)**
   - ✅ Made reconciliation granular (use `APPLY_SERVER_CHANGE` instead of `SET_SHAPES`)
   - ✅ Improved reconnection debouncing with state tracking
   - ✅ Increased debounce interval to 3 seconds
   - ✅ Added detailed logging for debugging

2. **`src/components/canvas/Canvas.jsx`**
   - ✅ Removed auto-subscription to comments for all shapes
   - ✅ Comments now subscribe on-demand only

---

## Testing

### Before Fix
- ✅ Shape appears briefly
- ❌ Shape blinks/flashes once
- ❌ Console shows 3+ reconciliation messages
- ❌ Multiple "Firebase reconnected" logs
- ❌ Reconciliation updates shapes immediately after creation

### After Fix
- ✅ Shape appears smoothly with NO blink
- ✅ Console shows: `"Tracking newly created shape {id}"`
- ✅ Console shows: `"Skipping recently created shape {id}"` during reconciliation
- ✅ Reconciliation happens but skips newly created shapes until grace period expires
- ✅ Single "Firebase reconnected" log on actual reconnection
- ✅ Shape remains stable for 5 seconds before server reconciliation

**Expected Console Output**:
```
[CanvasContext] Tracking newly created shape 9077031a-...
[firestoreService] Creating shape with auth: {...}
[CanvasContext] Firebase reconnected, triggering instant reconciliation
[CanvasContext] Reconciliation: Skipping recently created shape 9077031a-...
[CanvasContext] Ignoring shape 9077031a-... from live-update (age 1234ms < 5000)
```

Notice: **"Skipping recently created shape"** - this is the key log that shows the fix is working!

---

## Impact

### Performance Improvements
- **Render Efficiency**: Only changed shapes re-render instead of entire array
- **Network Usage**: Fewer Firestore subscriptions (on-demand only)
- **CPU Usage**: Less reconciliation thrashing
- **Memory**: Fewer active subscriptions

### User Experience
- **No more blinking shapes** when creating/editing
- Smoother visual experience
- Faster perceived performance
- More responsive canvas

---

## Additional Notes

### Why Granular Updates Matter
React's reconciliation with arrays works best when:
1. **Keys remain stable** (shape IDs don't change) ✅
2. **Array identity doesn't change unnecessarily** ❌ (was the problem)
3. **Individual items update independently** ✅ (now fixed)

By using `APPLY_SERVER_CHANGE` for individual shapes instead of `SET_SHAPES` for the entire array, React can efficiently update only the changed DOM elements.

### Comment Subscription Strategy
Comments now use a **lazy loading strategy**:
- **Don't load**: Until user interacts with comment feature
- **Do load**: When user opens thread or clicks indicator
- **Benefit**: Saves bandwidth and reduces Firebase connection churn

### Future Optimizations
If needed, we could further optimize by:
1. **Batch reconciliation updates** into a single dispatch
2. **Use requestIdleCallback** for non-urgent reconciliation
3. **Implement virtual scrolling** for large shape counts (100+)
4. **Add reconciliation metrics** to track performance

---

## Related Issues
- PR11 Part A: Z-Index implementation (context for this fix)
- PR12: Comments feature (affected by auto-subscription issue)

---

**Status**: ✅ Fixed  
**Date**: Current Session  
**Testing**: Manual verification completed  
**Regression Risk**: Low (changes are isolated and improve existing behavior)

