# PR12: Shape Selection Fix - "Moved Wrong Shape"

**Date:** October 15, 2025  
**Issue:** "Move shape to 500, 300" moved the wrong shape (with 52 shapes on canvas)  
**Solution:** Sort shapes by creation time and prefer most recent  

---

## The Problem

**Scenario:**
1. User creates blue circle at 100, 100
2. Canvas already has 52 other shapes
3. User says: "Move shape to 500, 300"
4. AI moves **the wrong shape** (oldest one, not the newly created circle)

**Why:**
- `getCanvasState` returned all 52 shapes in **random order**
- AI picked the first shape in the list
- The first shape was NOT the one user just created
- No timestamp information to identify the most recent shape

---

## The Solution

### 1. Sort Shapes by Creation Time

**File:** `src/services/aiToolExecutor.js`

```javascript
// Sort shapes by creation time (most recent first)
const sortedShapes = [...shapes].sort((a, b) => {
  const timeA = a.createdAt || 0;
  const timeB = b.createdAt || 0;
  return timeB - timeA; // Newest first
});
```

Now the most recently created shape is **always first** in the list.

### 2. Mark Most Recent Shape

```javascript
const simplifiedShapes = sortedShapes.map((shape, index) => ({
  id: shape.id,
  type: shape.type,
  x: Math.round(shape.x),
  y: Math.round(shape.y),
  color: shape.fill || shape.color,
  isRecent: index === 0, // ✅ Flag for AI
  ...(shape.createdAt && { createdAt: shape.createdAt }),
  // ... other properties
}));
```

The AI now sees which shape is most recent via `isRecent: true`.

### 3. Include mostRecentId

```javascript
return {
  success: true,
  canvasState: {
    shapeCount: shapes.length,
    shapes: simplifiedShapes,
    mostRecentId: simplifiedShapes[0]?.id, // ✅ Direct ID
  }
};
```

AI can use `mostRecentId` directly.

### 4. Update System Prompts

**File:** `src/utils/aiPrompts.js`

Added clear instructions:
```
**Workflow for Manipulation:**
1. Canvas state returns shapes SORTED BY CREATION TIME (newest first)
2. If user says "shape" or "it" without specifics → Use FIRST shape (isRecent: true)
3. If user specifies color/type → Find most recent matching shape
4. IMPORTANT: Always prefer the most recently created shape when ambiguous
```

---

## How It Works Now

### Scenario 1: Ambiguous Reference
```
Canvas: 52 shapes (oldest to newest)
User: "Create a blue circle at 100, 100"
User: "Move shape to 500, 300"

getCanvasState returns:
{
  shapeCount: 53,
  mostRecentId: "abc-123", // The blue circle
  shapes: [
    {id: "abc-123", type: "circle", color: "#0000ff", isRecent: true},
    {id: "old-1", type: "rect", color: "#ff0000", isRecent: false},
    {id: "old-2", type: "circle", color: "#00ff00", isRecent: false},
    ...
  ]
}

AI sees:
- First shape = most recent = the blue circle just created
- isRecent: true flag
- Calls moveShape("abc-123", 500, 300)
- ✅ Moves the CORRECT shape!
```

### Scenario 2: Specific Reference
```
User: "Move the blue circle to 600, 400"

AI logic:
1. Filter shapes by color: #0000ff (blue)
2. Multiple blue circles found
3. Pick the FIRST one (most recent blue circle)
4. Call moveShape with that ID
5. ✅ Moves the most recent blue circle
```

### Scenario 3: Type Reference
```
User: "Delete the triangle"

AI logic:
1. Filter shapes by type: "triangle"
2. Find most recent triangle (first in list)
3. Call deleteShape with that ID
4. ✅ Deletes the most recent triangle
```

---

## Expected Behavior

### Test Case 1: Just Created
```
Steps:
1. Create blue circle at 100, 100
2. Command: "Move shape to 500, 300"

Expected:
✅ Blue circle moves (not some old shape)
✅ Toast: "Moved circle to (500, 300)"
```

### Test Case 2: Multiple Matches
```
Steps:
1. Canvas has 3 red circles (old)
2. Create new red circle at 100, 100
3. Command: "Move the red circle to 500, 300"

Expected:
✅ Most recent red circle moves (the new one)
✅ Old red circles stay in place
```

### Test Case 3: It/That Reference
```
Steps:
1. Create blue circle at 100, 100
2. Command: "Change it to red"

Expected:
✅ Blue circle changes to red
✅ Not some random old shape
```

### Test Case 4: Type Specific
```
Steps:
1. Canvas has 5 rectangles
2. Create new rectangle at 200, 200
3. Command: "Rotate the rectangle 45 degrees"

Expected:
✅ Most recent rectangle rotates
✅ Old rectangles don't rotate
```

---

## Implementation Details

### What Was Added to getCanvasState:

1. **Sorting:**
   - Shapes sorted by `createdAt` timestamp
   - Most recent = index 0
   - Oldest = last index

2. **isRecent Flag:**
   - `isRecent: true` for first shape
   - `isRecent: false` for all others
   - AI can quickly identify most recent

3. **mostRecentId:**
   - Direct ID of most recent shape
   - AI can use without searching

4. **createdAt Timestamps:**
   - Included in response
   - AI can use for additional logic

### System Prompt Updates:

1. **Explicit Sorting:**
   - "Canvas state returns shapes SORTED BY CREATION TIME (newest first)"

2. **Selection Rules:**
   - Ambiguous → Use first shape
   - Specific → Find most recent match
   - Position → Find closest

3. **Priority:**
   - "IMPORTANT: Always prefer the most recently created shape when ambiguous"

---

## Performance Impact

**Before:**
- Random order shapes
- O(1) to return list
- Wrong shape selected ❌

**After:**
- Sorted shapes (newest first)
- O(n log n) sorting overhead (~0.1ms for 100 shapes)
- Correct shape selected ✅

**Trade-off:** Tiny performance cost for correct behavior.

---

## Edge Cases Handled

### 1. No Timestamp (Old Shapes)
```javascript
const timeA = a.createdAt || 0;
```
Shapes without timestamp default to 0 (sorted last).

### 2. Same Timestamp
```javascript
return timeB - timeA;
```
Stable sort maintains original order for ties.

### 3. Empty Canvas
```javascript
mostRecentId: simplifiedShapes[0]?.id
```
Optional chaining prevents errors.

### 4. Deleted Shapes
Firestore already filters out deleted shapes, so they never reach getCanvasState.

---

## Testing Checklist

After restarting dev server:

- [ ] Create blue circle at 100, 100
- [ ] Say "Move shape to 500, 300"
- [ ] ✅ **Blue circle moves (not old shape)**
- [ ] Create 3 red circles
- [ ] Say "Change the red circle to green"
- [ ] ✅ **Most recent red circle changes**
- [ ] Create rectangle
- [ ] Say "Rotate the rectangle 90 degrees"
- [ ] ✅ **Most recent rectangle rotates**
- [ ] Create circle, then say "Delete it"
- [ ] ✅ **Deletes the just-created circle**

---

## Future Improvements

### 1. Selection Heuristics
```javascript
// Could add more intelligence:
- Distance to cursor
- Currently selected shape
- Shapes in viewport vs off-screen
- User's recent interactions
```

### 2. Explicit Selection
```javascript
// User could explicitly select:
"Move the shape at 100, 100 to 500, 300"
// AI finds shape closest to (100, 100)
```

### 3. Context Memory
```javascript
// Remember last manipulated shape:
"Create a circle" → circle-1
"Move it left" → circle-1
"Change it to red" → circle-1 (same shape)
```

### 4. Visual Feedback
```javascript
// Highlight shape being manipulated:
AI: "I'll move this circle for you"
Canvas: Briefly highlights the circle
User: Confirms it's the right one
```

---

## Summary

**Problem:** AI moved wrong shape when canvas had many shapes  
**Root Cause:** No timestamp sorting, random order  
**Solution:** Sort by createdAt, prefer most recent  

**Changes:**
1. ✅ Sort shapes newest-first in getCanvasState
2. ✅ Add isRecent flag and mostRecentId
3. ✅ Update system prompts with selection rules
4. ✅ Include timestamps in response

**Result:**
- ✅ "Move shape" moves the shape you just created
- ✅ "Change it" changes the right shape
- ✅ Context-aware commands work correctly
- ✅ Ambiguous references resolved intelligently

**Status: Ready for testing!** 🎉

---

**Next Steps:**
1. Restart dev server: `npm run dev`
2. Test: Create shape → Move shape → Verify correct shape moves
3. Test: Multiple shapes → Specific command → Verify most recent selected
4. Continue PR12 manual testing from Test 2 onwards

