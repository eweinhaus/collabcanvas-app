# PR12: Quick Testing Guide for Proactive Fixes

**Quick reference for testing the 6 new command categories**

---

## Quick Setup

Create test shapes with these commands:

```
"Create a red circle at 100, 100"
"Create a blue circle at 300, 100"
"Create a green circle at 800, 100"
"Create a red rectangle at 100, 300"
"Create a blue rectangle at 300, 300"
"Create a green rectangle at 800, 300"
"Create a red triangle at 100, 500"
"Create a blue triangle at 300, 500"
```

This gives you:
- **Left side (x<500):** red circle, blue circle, red rect, blue rect, red tri, blue tri
- **Right side (x>500):** green circle, green rect
- **Colors:** red (3), blue (3), green (2)
- **Types:** circles (3), rectangles (3), triangles (2)

---

## 1. Negation Tests 🚫

### Test 1A: Exclude by Type
```
Command: "Delete all shapes except circles"
Expected: Only 3 circles remain
Deleted: 3 rectangles + 2 triangles = 5 shapes
```

### Test 1B: Exclude by Color
```
Command: "Delete all shapes except red shapes"
Expected: Only 3 red shapes remain
Deleted: All blue and green shapes
```

### Test 1C: Exclude by Type + Color
```
Command: "Delete all shapes except blue triangles"
Expected: Only blue triangles remain
Deleted: Everything else
```

---

## 2. Position Tests 📍

### Test 2A: Left Side
```
Command: "Delete all shapes on the left"
Expected: Right-side shapes remain (green circle, green rect)
Deleted: All shapes with x < 500 (6 shapes)
```

### Test 2B: Right Side
```
Command: "Change all shapes on the right to purple"
Expected: Green circle and green rect turn purple
Unchanged: All left-side shapes
```

### Test 2C: Move Top to Bottom
```
Command: "Move shapes at the top to bottom"
Expected: Shapes with y < 400 move to y > 600
(Circles at y=100 move to around y=700)
```

---

## 3. Size Tests 📏

**Note:** Need to manually create shapes with different sizes, or use future AI size parameter.

### Manual Setup:
1. Use circle tool → create large circle (drag to radius ~100)
2. Use circle tool → create small circle (radius ~30)

### Test 3A: Large Circles
```
Command: "Delete all large circles"
Expected: Only circles with radius > 75 deleted
Small circles remain
```

### Test 3B: Small + Color
```
Command: "Change all small red shapes to blue"
Expected: Only small AND red shapes change
Large red shapes unchanged
```

---

## 4. Multi-Move (Stacking) 📚

### Test 4A: Stack All Circles
```
Command: "Move all circles to 500, 300"
Expected: All 3 circles move to EXACTLY (500, 300)
Visual: Looks like 1 circle (actually 3 stacked)
```

**Verification:**
- Click on the "circle" → Should see 3 shapes selected in same spot
- Or: Click AI tool → "Get canvas state" → See 3 circles all at x=500, y=300

### Test 4B: Stack by Color
```
Command: "Move all red shapes to 100, 100"
Expected: All red shapes (circle, rect, tri) stack at (100, 100)
Visual: Overlapping shapes
```

---

## 5. Implicit "All" Tests 🎯

### Setup:
```
"Create a purple circle at 100, 700"
"Create a purple circle at 200, 700"
"Create a purple circle at 300, 700"
"Create a purple circle at 400, 700"
"Create a purple circle at 500, 700"
```
Result: 5 purple circles

### Test 5A: Singular (No "All")
```
Command: "Delete circles"
Expected: Only most recent circle deleted (1 shape)
Remaining: 4 purple circles
```

### Test 5B: Explicit "All"
```
Command: "Delete all circles"
Expected: All 4 remaining circles deleted
Remaining: 0 circles
```

### Test 5C: Count
```
Command: "Delete 3 circles"
Expected: 3 most recent circles deleted
Remaining: 2 circles
```

---

## 6. Compound Conditions Tests 🔗

### Test 6A: Type + Color
```
Setup: Mixed colors and types (use quick setup above)

Command: "Delete all red circles"
Expected: Only red circles deleted (1 shape)
Remaining: Blue circles, green circles, red rect, red tri, etc.
```

### Test 6B: Type + Color + Position
```
Command: "Delete all red shapes on the left"
Expected: Only red shapes with x < 500 deleted
(Red circle at 100, red rect at 100, red tri at 100)
Remaining: All blues, greens, and any reds on right
```

### Test 6C: Size + Color (if size available)
```
Command: "Delete all large red circles"
Expected: Only circles that are BOTH large AND red
Remaining: Small red circles, large blue circles, etc.
```

---

## Edge Case Tests ⚠️

### Edge 1: No Matches
```
Command: "Delete all orange hexagons"
Expected: AI responds "No orange hexagons found"
Toast: Info message (not error)
Result: No shapes deleted
```

### Edge 2: Empty Exclusion
```
Command: "Delete all except purple triangles"
Canvas: No purple triangles exist
Expected: All shapes deleted (nothing to exclude)
```

### Edge 3: Position + Negation
```
Command: "Delete all shapes on the left except circles"
Expected: Delete left-side rectangles and triangles
Remaining: All circles + all right-side shapes
```

---

## Expected Console Output

When AI processes compound commands:

```
🚀 Sending request... (Round 1: getCanvasState)
Canvas state: 8 shapes
Filtering: type=circle AND color=red AND x<500
Matches: 1 shape

🚀 Sending request... (Round 2: deleteShape)
Tool calls: 1
Result: success
```

For multi-delete:
```
🚀 Sending request... (Round 2: deleteShape)
Tool calls: 5
✅ Successfully executed 5 action(s)
```

---

## Quick Verification Checklist

After each test:

- [ ] Correct shapes affected? (count, type, color)
- [ ] Correct shapes untouched?
- [ ] Toast message accurate?
- [ ] Console shows correct filtering logic?
- [ ] No errors in console?
- [ ] Change syncs to other tabs? (open 2nd tab to verify)

---

## Common Issues to Watch For

### ❌ Issue: AI uses OR instead of AND
```
Command: "Delete large red circles"
Wrong: Deletes large shapes OR red shapes OR circles (way too many)
Right: Deletes shapes that are large AND red AND circle (only matches)
```

### ❌ Issue: Negation inverted
```
Command: "Delete all except circles"
Wrong: Deletes circles, keeps everything else
Right: Deletes everything else, keeps circles
```

### ❌ Issue: Position ignored
```
Command: "Delete shapes on the left"
Wrong: Deletes random shapes or all shapes
Right: Only deletes x < 500
```

### ❌ Issue: "All" implicit when shouldn't be
```
Command: "Delete circles" (no "all")
Wrong: Deletes all circles
Right: Deletes only most recent circle
```

### ❌ Issue: Multi-move spreads instead of stacks
```
Command: "Move all circles to 500, 300"
Wrong: Circles spread out (e.g., 480, 500, 520)
Right: All at exactly 500, 300 (stacked)
```

---

## Reporting Issues

If you find a command that doesn't work correctly:

**Report Format:**
```
Command: [exact command]
Setup: [what shapes existed]
Expected: [what should happen]
Actual: [what actually happened]
Console: [any errors or unexpected logs]
```

**Example:**
```
Command: "Delete all shapes except circles"
Setup: 3 circles, 2 rectangles, 1 triangle
Expected: Only 3 circles remain
Actual: Deleted everything including circles
Console: No errors, but tool_calls showed deleteShape for all 6 shapes
```

---

## Summary

**6 New Categories:**
1. 🚫 **Negation** - "all except X"
2. 📍 **Position** - "on the left/right/top/bottom"
3. 📏 **Size** - "large/small shapes"
4. 📚 **Multi-Move** - Stacking behavior
5. 🎯 **Implicit All** - Singular vs plural
6. 🔗 **Compound** - Multiple filters (AND logic)

**Quick Test:** Run all 6 categories with quick setup (8-10 shapes)  
**Time:** ~10 minutes  
**Result:** Confidence in AI command handling 🎯

