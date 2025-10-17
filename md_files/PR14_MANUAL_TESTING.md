# PR14 Manual Testing Guide: Grid Generation

## Overview
This guide provides manual testing procedures for the grid generation feature (PR14). The grid generation feature allows users to create grids of shapes using AI commands.

---

## Prerequisites

### 1. Environment Setup
- App should be running locally: `npm run dev`
- OpenAI API key configured in `.env`
- Firebase configured and connected
- At least one browser window open to the app

### 2. Login
- Log in with Google OAuth
- Verify you see the AI prompt panel in the sidebar

---

## Test Suite

### Test 17.9: Create a 3x3 Grid of Blue Squares ✅

**Command:**
```
Create a 3x3 grid of blue squares
```

**Expected Behavior:**
- AI should call the `createGrid` tool
- 9 blue rectangles should appear on the canvas
- Shapes should be arranged in 3 rows and 3 columns
- Default spacing (120px) between shapes
- All shapes should be blue (#0000ff or similar)

**Success Criteria:**
- ✅ 9 shapes created
- ✅ All shapes are blue rectangles
- ✅ Grid layout is 3×3 (visually inspect rows and columns)
- ✅ Spacing appears consistent
- ✅ AI responds with success message: "Created 3×3 grid of rectangles (9 shapes)"

---

### Test 17.10: Create a 2x5 Grid of Circles ✅

**Command:**
```
Create a 2x5 grid of circles
```

**Expected Behavior:**
- AI should call the `createGrid` tool
- 10 circles should appear on the canvas
- Shapes should be arranged in 2 rows and 5 columns
- Default spacing (120px) between shapes
- Default color (blue) for circles

**Success Criteria:**
- ✅ 10 shapes created
- ✅ All shapes are circles
- ✅ Grid layout is 2×5 (2 rows, 5 columns)
- ✅ Spacing appears consistent
- ✅ AI responds with success message: "Created 2×5 grid of circles (10 shapes)"

---

### Test 17.11: Performance Test with 9+ Shapes ✅

**Command:**
```
Create a 10x10 grid of small red circles
```

**Expected Behavior:**
- AI should create 100 circles (maximum allowed)
- All shapes should appear in < 5 seconds
- UI should remain responsive during creation
- No errors or timeouts

**Success Criteria:**
- ✅ 100 shapes created successfully
- ✅ Total time < 5 seconds (measure from command submit to last shape appearing)
- ✅ No UI freezing or lag
- ✅ Canvas remains interactive during/after creation
- ✅ All shapes render correctly
- ✅ AI responds with success message

**Performance Benchmarks:**
- Expected batch write time: ~50ms per batch + 10ms per shape
- 100 shapes = 1 batch (under 250 limit) ≈ 1050ms
- Including AI response time: < 5 seconds total

---

### Test 17.12: Verify All Grid Shapes Sync to All Users ⏳

**Setup:**
- Open 2-3 browser windows to the same app
- Log in with different Google accounts in each window
- Position windows side-by-side for easy comparison

**Command (in Browser 1):**
```
Create a 4x4 grid of purple triangles at 300, 300
```

**Expected Behavior:**
- Grid should appear in Browser 1
- Within 100ms, the same grid should appear in Browser 2 and Browser 3
- All users should see identical shapes at identical positions
- Shape properties (color, size, position) should be consistent across all browsers

**Success Criteria:**
- ✅ All 16 triangles appear in all browser windows
- ✅ Sync latency < 100ms per shape (1600ms total for 16 shapes)
- ✅ Shapes appear in identical positions across all browsers
- ✅ All shapes have identical properties (color, size, rotation)
- ✅ No duplicate or missing shapes in any browser
- ✅ Each user can interact with (select, move, delete) the grid shapes
- ✅ Modifications in one browser sync to all others

**Test Variations:**
1. Try grid creation from Browser 2 → should sync to Browser 1 and 3
2. Try creating multiple grids from different browsers simultaneously
3. Try creating a grid, then having another user delete shapes from it

---

## Additional Manual Tests (Optional)

### Test A: Grid with Custom Spacing
**Command:**
```
Create a 3x3 grid of green squares with 200px spacing
```

**Expected:**
- 9 green rectangles
- Large spacing between shapes (200px)
- Grid should span a larger area

---

### Test B: Grid with Custom Size
**Command:**
```
Create a 5x5 grid of small yellow circles
```

**Expected:**
- 25 small circles
- Circles should be smaller than default (radius < 50)

---

### Test C: Grid at Specific Position
**Command:**
```
Create a 2x3 grid of red rectangles at 500, 500
```

**Expected:**
- 6 red rectangles
- Top-left shape should start near (500, 500)

---

### Test D: Text Grid
**Command:**
```
Create a 3x2 grid of text shapes
```

**Expected:**
- 6 text shapes
- Each text should show its grid position: (0,0), (0,1), (1,0), etc.

---

### Test E: Maximum Grid Size (Edge Case)
**Command:**
```
Create a 10x10 grid of circles
```

**Expected:**
- Exactly 100 circles (maximum allowed)
- Should succeed without errors

---

### Test F: Exceeding Maximum (Error Case)
**Command:**
```
Create a 20x20 grid of circles
```

**Expected:**
- AI should return an error
- Error message: "Grid cannot exceed 100 shapes"
- No shapes should be created

---

### Test G: Invalid Parameters (Error Cases)

**Command 1:**
```
Create a grid
```

**Expected:**
- AI should ask for clarification or return error
- Error: Missing required parameters (rows, cols, shapeType, color)

**Command 2:**
```
Create a 3x3 grid of invalid-shape
```

**Expected:**
- AI should return error
- Error: "Unknown shape type: invalid-shape"

**Command 3:**
```
Create a 3x3 grid of blue rectangles with 5px spacing
```

**Expected:**
- AI should return error
- Error: "Spacing must be between 10 and 500 pixels"

---

## Test Results Summary

After completing all tests, fill out this summary:

| Test | Status | Notes |
|------|--------|-------|
| 17.9: 3x3 blue squares | ⏳ | |
| 17.10: 2x5 circles | ⏳ | |
| 17.11: Performance (100 shapes) | ⏳ | Time: _____ seconds |
| 17.12: Multi-user sync | ⏳ | Browsers tested: ____ |
| Test A: Custom spacing | ⏳ | Optional |
| Test B: Custom size | ⏳ | Optional |
| Test C: Custom position | ⏳ | Optional |
| Test D: Text grid | ⏳ | Optional |
| Test E: Max grid (100) | ⏳ | Optional |
| Test F: Exceeding max (error) | ⏳ | Optional |
| Test G: Invalid params (error) | ⏳ | Optional |

---

## Troubleshooting

### Issue: Grid shapes don't appear
**Solutions:**
- Check browser console for errors
- Verify OpenAI API key is valid
- Check Firebase connection status
- Try refreshing the page

### Issue: Shapes appear in wrong positions
**Solutions:**
- Verify spacing parameter is reasonable (10-500)
- Check origin position is within canvas bounds
- Inspect shape coordinates in browser console

### Issue: Sync doesn't work across browsers
**Solutions:**
- Verify all browsers are logged in
- Check Firebase Realtime Database rules
- Verify network connection
- Check for console errors in all browsers

### Issue: AI doesn't understand grid command
**Solutions:**
- Be explicit: "Create a [rows]x[cols] grid of [color] [shapeType]s"
- Example: "Create a 3x3 grid of red circles"
- Avoid ambiguous language

---

## Success Criteria for PR14

**All tests must pass before merging:**

- ✅ All automated tests pass (30 gridGenerator tests + 13 aiToolExecutor tests)
- ⏳ Manual Test 17.9 passes (3x3 blue squares)
- ⏳ Manual Test 17.10 passes (2x5 circles)
- ⏳ Manual Test 17.11 passes (performance with 100 shapes)
- ⏳ Manual Test 17.12 passes (multi-user sync)

**Optional (recommended):**
- Tests A-G provide additional confidence in edge cases and error handling

---

## Notes

- Grid generation uses Firestore batch writes for efficiency
- Maximum grid size is limited to 100 shapes (configurable in gridGenerator.js)
- All shapes in a grid have the same color and type
- Grid positions are calculated in row-major order (left-to-right, top-to-bottom)
- Default spacing is 120px, default size is 50 (radius for circles, width/height for rectangles)

---

## Completion

**Tested by:** _________________  
**Date:** _________________  
**Result:** ⏳ PENDING / ✅ PASS / ❌ FAIL  
**Notes:** _________________________________________________

