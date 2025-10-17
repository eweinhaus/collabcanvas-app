# PR10: Resize/Rotate Undo Debug Guide

**Date**: October 16, 2025  
**Status**: 🔍 Debugging  
**Issue**: Resize and rotate operations don't trigger undo/redo

---

## Debug Logging Added

I've added comprehensive console logging to help diagnose the issue. The logs will show exactly what's happening at each stage of the resize/rotate process.

### Files Modified with Debug Logs

1. **Shape.jsx** - `handleTransformEnd()`
   - Logs old state captured at transform start
   - Logs new state (updates) at transform end

2. **Canvas.jsx** - `onChange` handler
   - Logs every onChange call with metadata
   - Logs which command type is being created

3. **UpdateShapeCommand.js** - `execute()` and `undo()`
   - Logs when command executes
   - Logs when command undoes
   - Shows exact properties being applied

---

## How to Test and Debug

### Step 1: Open Browser Console
Open your browser's developer console (F12 or Cmd+Option+I on Mac)

### Step 2: Perform a Resize Operation
1. Create a rectangle on the canvas
2. Select it (should see transform handles)
3. Drag a corner handle to resize
4. Watch the console logs

### Expected Log Sequence

```
[Shape] handleTransformEnd - oldState: {x: 100, y: 100, rotation: 0, width: 100, height: 100}
[Shape] handleTransformEnd - newState (updates): {x: 100, y: 100, rotation: 0, width: 150, height: 120}
[Canvas] onChange called for shape: abc-123 metadata: {oldState: {...}, isTransform: true}
[Canvas] Creating UpdateShapeCommand for transform
[UpdateShapeCommand] execute: abc-123 {x: 100, y: 100, rotation: 0, width: 150, height: 120}
```

### Step 3: Try to Undo
1. Press `Cmd+Z` (Mac) or `Ctrl+Z` (Windows)
2. Watch the console logs

### Expected Log on Undo

```
[UpdateShapeCommand] undo: abc-123 {x: 100, y: 100, rotation: 0, width: 100, height: 100}
```

### Step 4: Perform a Rotate Operation
1. Select a shape
2. Drag the rotation handle (the one that's slightly offset from the corner)
3. Watch console logs

### Expected Log Sequence

```
[Shape] handleTransformEnd - oldState: {x: 100, y: 100, rotation: 0, width: 100, height: 100}
[Shape] handleTransformEnd - newState (updates): {x: 100, y: 100, rotation: 45, width: 100, height: 100}
[Canvas] onChange called for shape: abc-123 metadata: {oldState: {...}, isTransform: true}
[Canvas] Creating UpdateShapeCommand for transform
[UpdateShapeCommand] execute: abc-123 {x: 100, y: 100, rotation: 45, width: 100, height: 100}
```

---

## Diagnostic Scenarios

### Scenario A: No Logs At All
**Symptom**: No console logs when you resize/rotate

**Possible Causes**:
1. Transform handle not working properly
2. handleTransformEnd not being called
3. Console cleared or filtered

**Fix**: Check that you're actually dragging the transform handles, not just the shape itself (dragging the shape is a move operation, not a transform)

---

### Scenario B: Logs Stop at handleTransformEnd
**Symptom**: You see Shape logs but no Canvas onChange logs

```
[Shape] handleTransformEnd - oldState: {...}
[Shape] handleTransformEnd - newState (updates): {...}
// Nothing after this
```

**Possible Causes**:
1. onChange prop not passed correctly to Shape
2. onChange callback not being invoked

**Fix**: Verify Shape component is receiving onChange prop and calling it correctly

---

### Scenario C: onChange Called But No Command Created
**Symptom**: You see Canvas onChange log but no "Creating UpdateShapeCommand" log

```
[Canvas] onChange called for shape: abc-123 metadata: undefined
[Canvas] Direct update without undo/redo
```

**Possible Causes**:
1. Metadata not being passed from Shape.jsx
2. isTransform flag missing or wrong value
3. oldState is null/undefined

**Fix**: Check that handleTransformEnd is passing metadata correctly:
```javascript
onChange(updates, {
  oldState: transformStartStateRef.current,
  isTransform: true
});
```

---

### Scenario D: Command Created But Not Executed
**Symptom**: You see "Creating UpdateShapeCommand" but no "execute" log

```
[Canvas] Creating UpdateShapeCommand for transform
// No [UpdateShapeCommand] execute log
```

**Possible Causes**:
1. executeCommand not being called
2. executeCommand failing silently
3. Command not being created properly

**Fix**: Check commandActions.executeCommand is available and working

---

### Scenario E: Execute Works But Undo Doesn't
**Symptom**: Execute log appears, but pressing Cmd+Z doesn't log undo

```
[UpdateShapeCommand] execute: abc-123 {...}
// Press Cmd+Z - nothing happens
```

**Possible Causes**:
1. Command not added to undo stack
2. Keyboard shortcut not working
3. canUndo returns false
4. Undo called but doesn't reach UpdateShapeCommand

**Fix**: 
1. Check CommandHistory.execute() adds to undoStack
2. Test keyboard shortcut with shape creation (known working)
3. Check if commandActions.canUndo is true

---

### Scenario F: Undo Logs Appear But Shape Doesn't Change
**Symptom**: Undo log appears with correct old properties, but visually nothing happens

```
[UpdateShapeCommand] undo: abc-123 {x: 100, y: 100, rotation: 0, width: 100, height: 100}
// Shape still looks resized
```

**Possible Causes**:
1. firestoreActions.updateShape not actually updating
2. Firestore update failing
3. React not re-rendering
4. Optimistic update conflict

**Fix**: This is likely the issue! The problem might be:
- UpdateShape uses throttling (100ms delay)
- Optimistic update happening but Firestore update failing
- Need to check if updateShape is actually sending to Firestore

---

## Most Likely Issue: UpdateShape Throttling

Looking at the code, I suspect the issue is in how `firestoreActions.updateShape` works:

```javascript
// From CanvasContext.jsx
updateShape: (id, updates) => {
  // optimistic update
  dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates: { ...updates, updatedAt: Date.now() } } });
  
  // Throttled Firestore write
  const throttler = ensureThrottler(id);
  throttler(id, updates);
},
```

### The Problem

When you resize and immediately undo:
1. Execute runs → optimistic update happens → throttled write queued (100ms)
2. Undo runs → optimistic update happens → new throttled write queued (100ms)
3. Both throttled writes might execute, causing conflicts

### The Solution

We need UpdateShapeCommand to:
1. Not rely on the throttled update for execute/undo
2. Use a direct, immediate update
3. OR wait for the throttled update to complete

---

## Quick Fix to Test

Let me check if this is the issue by modifying UpdateShapeCommand to use a direct update instead of the throttled one.

### Option 1: Use direct Firestore update

Instead of going through the throttled updateShape, UpdateShapeCommand could:
- Directly call the Firestore service
- Skip the throttle for undo/redo operations

### Option 2: Make updateShape configurable

Add an option to bypass throttling:
```javascript
updateShape: (id, updates, immediate = false) => {
  dispatch({ type: CANVAS_ACTIONS.UPDATE_SHAPE, payload: { id, updates } });
  if (immediate) {
    fsUpdateShape(id, updates); // direct, not throttled
  } else {
    const throttler = ensureThrottler(id);
    throttler(id, updates);
  }
}
```

---

## Next Steps

1. **Run the test** with logging enabled
2. **Report back** which scenario you see in the console
3. Based on the logs, we'll implement the appropriate fix

Most likely we'll need to:
- Make UpdateShapeCommand bypass throttling
- Ensure execute/undo are truly synchronous
- Handle optimistic updates correctly

---

**Status**: Awaiting test results from debug logs  
**Expected Fix Time**: 10-15 minutes once we identify the issue


