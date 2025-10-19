# AI Grid Creation Fix

## Problem
Grid commands like "Create a grid of 3x3 purple triangles" would report "✓ Grid created successfully!" but no shapes would appear on the canvas.

## Root Cause
The `addShapesBatch` function in `CanvasContext.jsx` was catching Firestore errors, rolling back optimistic shapes, but **not re-throwing the error**. This caused:

1. AI tool executor calls `await addShapesBatch(shapes)`
2. Firestore write fails (e.g., permission error, auth issue)
3. `addShapesBatch` catches error, rolls back shapes
4. But doesn't throw, so executor thinks it succeeded
5. Returns `{ success: true }`
6. User sees "✓ Grid created successfully!" but no shapes

## Solution
Added `throw err;` after rollback in `addShapesBatch` so errors propagate to the AI tool executor.

### Code Change
**File**: `src/context/CanvasContext.jsx` (lines 915-944)

**Before**:
```javascript
} catch (err) {
  // rollback all shapes on error
  shapes.forEach((shape) => {
    recentlyCreatedShapesRef.current.delete(shape.id);
    dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
  });
  console.error('Failed to create shapes batch in Firestore', err);
  // Error not re-thrown - executor thinks it succeeded!
}
```

**After**:
```javascript
} catch (err) {
  // rollback all shapes on error
  shapes.forEach((shape) => {
    recentlyCreatedShapesRef.current.delete(shape.id);
    dispatch({ type: CANVAS_ACTIONS.DELETE_SHAPE, payload: shape.id });
  });
  console.error('Failed to create shapes batch in Firestore', err);
  // Re-throw so AI tool executor knows it failed
  throw err;
}
```

## Impact
- ✅ AI will now report actual errors instead of false success
- ✅ Users will see helpful error messages
- ✅ Easier to debug underlying issues (permissions, auth, etc.)

## What Users Will See Now

### Before Fix
```
User: "Create a grid of 3x3 purple triangles"
AI: "✓ Grid created successfully!"
[No shapes appear, user is confused]
```

### After Fix
```
User: "Create a grid of 3x3 purple triangles"
AI: "Sorry, I couldn't complete that: User must be authenticated to create shapes"
[Clear error message, user knows to sign in]
```

## Common Errors That Will Now Be Visible

1. **"User must be authenticated to create shapes"**
   - Cause: User not signed in or session expired
   - Fix: Refresh page and sign in again

2. **"Permission denied"**
   - Cause: Firestore security rules blocking write
   - Fix: Check Firestore rules, ensure user is authenticated

3. **"Failed to create shapes batch"**
   - Cause: Network error, Firestore timeout
   - Fix: Check network connection, try again

## Testing

### Test Scenario
1. **Sign in** to the app
2. Open AI chat panel
3. Send: "Create a grid of 3x3 purple triangles"

### Expected Result (Success)
- AI responds: "✓ Grid created successfully!"
- 9 purple triangles appear on canvas in 3x3 grid

### Expected Result (Failure - Not Signed In)
- AI responds: "Sorry, I couldn't complete that: User must be authenticated to create shapes"
- No shapes appear (correct behavior)

### Expected Result (Failure - Permission Error)
- AI responds: "Sorry, I couldn't complete that: Permission denied"
- Error details logged to console
- Toast notification shown

## Related Issues Fixed
- Grid creation reporting false success
- Batch shape creation (vertical/horizontal layouts) also fixed
- Any batch operation will now properly report errors

## Files Modified
- `src/context/CanvasContext.jsx` (line 942: added `throw err;`)

## Next Steps
If grid creation still fails after this fix:
1. Check browser console for detailed error
2. Verify you're signed in (check header for user info)
3. Test with manual shape creation (toolbar) to verify Firestore works
4. Check Firestore security rules are deployed
5. Verify Firebase project ID and config are correct

## Additional Notes

### Why Optimistic Updates?
The app uses optimistic updates (show shapes immediately, then persist) for better UX. But this means:
- Shapes appear briefly even if Firestore write will fail
- Rollback removes them if write fails
- Important that errors are surfaced so user knows why shapes disappeared

### Error Propagation Flow
```
addShapesBatch fails
  ↓
Rollback optimistic shapes
  ↓
Throw error
  ↓
AI tool executor catches error
  ↓
executeToolCalls returns allSuccessful=false
  ↓
AI creates error message
  ↓
User sees: "Sorry, I couldn't complete that: [error details]"
```

## Deployment
This is a critical bug fix that should be deployed immediately:

```bash
cd /Users/ethan/Desktop/Github/Gauntlet/CollabCanvas/collabcanvas-app
npm test  # Verify no regressions
npm run build
# Deploy to production
```

## Success Criteria
After deployment:
- ✅ Failed grid creations show error message instead of false success
- ✅ Successful grid creations work as before
- ✅ Error messages are clear and actionable
- ✅ Console logs provide detailed debugging info

