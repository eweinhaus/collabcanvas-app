# PR 15: Layout & Arrangement Tools - Manual Testing Guide

## Overview
This PR introduces three new AI tools for arranging and distributing shapes on the canvas:
- `arrangeHorizontally`: Lines up shapes side-by-side
- `arrangeVertically`: Stacks shapes top-to-bottom  
- `distributeEvenly`: Spaces shapes uniformly along an axis

## Test Environment Setup
1. Start the development server: `npm start`
2. Open at least 2 browser windows/tabs pointing to `http://localhost:5173`
3. Log in with different Google accounts in each window
4. Ensure you have shapes on the canvas to test with

---

## Test 1: Basic Horizontal Arrangement (Task 18.10)
**Objective:** Verify shapes arrange horizontally with default spacing

### Steps:
1. Create 4 different shapes on the canvas:
   - "Create a red circle at 100, 100"
   - "Create a blue rectangle at 300, 150"
   - "Create a green triangle at 200, 200"
   - "Create a yellow circle at 400, 120"

2. Get canvas state to retrieve shape IDs:
   - "Show me all shapes"
   - Note the IDs of the 4 shapes

3. Arrange shapes horizontally:
   - "Arrange these 4 shapes horizontally" 
   - OR provide explicit IDs if needed

### Expected Results:
✅ All 4 shapes align on the same y-coordinate (averaged position)
✅ Shapes are evenly spaced horizontally (20px default spacing between centers)
✅ Shapes maintain their original left-to-right order based on x position
✅ Message confirms: "Arranged 4 shape(s) horizontally with 20px spacing"
✅ Changes sync to all connected users in <100ms
✅ No console errors

### Pass/Fail: ___

---

## Test 2: Vertical Arrangement with Custom Spacing (Task 18.11)
**Objective:** Verify shapes arrange vertically with custom spacing

### Steps:
1. Create 3 shapes if needed:
   - "Create a purple circle at 100, 100"
   - "Create an orange rectangle at 150, 300"
   - "Create a pink triangle at 120, 200"

2. Arrange vertically with 50px spacing:
   - "Arrange these shapes vertically with 50px spacing"

### Expected Results:
✅ All 3 shapes align on the same x-coordinate (averaged position)
✅ Shapes are 50px apart vertically (measured between centers)
✅ Shapes maintain their original top-to-bottom order based on y position
✅ Message confirms: "Arranged 3 shape(s) vertically with 50px spacing"
✅ Changes sync to all connected users
✅ No console errors

### Pass/Fail: ___

---

## Test 3: Even Distribution (Task 18.12)
**Objective:** Verify shapes distribute evenly along an axis

### Steps:
1. Create 5 shapes scattered across the canvas:
   - "Create a red circle at 100, 200"
   - "Create a blue circle at 180, 200"
   - "Create a green circle at 220, 200"
   - "Create a yellow circle at 350, 200"
   - "Create a purple circle at 500, 200"

2. Distribute evenly horizontally:
   - "Distribute these elements evenly"
   - OR "Distribute these shapes evenly horizontally"

### Expected Results:
✅ First shape stays at x=100 (leftmost)
✅ Last shape stays at x=500 (rightmost)
✅ Middle 3 shapes are evenly spaced between them
✅ Expected positions: 100, 200, 300, 400, 500
✅ All shapes maintain y=200
✅ Message confirms: "Distributed 5 shape(s) evenly horizontally"
✅ Changes sync to all connected users
✅ No console errors

### Pass/Fail: ___

---

## Test 4: Vertical Distribution
**Objective:** Verify vertical distribution works correctly

### Steps:
1. Create 4 shapes at different y positions:
   - "Create a red rectangle at 200, 100"
   - "Create a blue rectangle at 200, 180"
   - "Create a green rectangle at 200, 350"
   - "Create a yellow rectangle at 200, 400"

2. Distribute vertically:
   - "Distribute these shapes evenly vertically"

### Expected Results:
✅ First shape stays at y=100
✅ Last shape stays at y=400
✅ Middle 2 shapes evenly spaced: y=200, y=300
✅ All shapes maintain x=200
✅ Message confirms: "Distributed 4 shape(s) evenly vertically"
✅ Changes sync immediately

### Pass/Fail: ___

---

## Test 5: Multi-User Synchronization
**Objective:** Verify arrangements sync correctly across users

### Steps:
1. In Browser 1: Create 3 shapes
2. In Browser 2: Verify all 3 shapes appear
3. In Browser 1: "Arrange these shapes horizontally"
4. In Browser 2: Watch the shapes rearrange in real-time

### Expected Results:
✅ Browser 2 sees arrangement happen live (<100ms)
✅ Final positions match exactly in both browsers
✅ No duplicate shapes appear
✅ No shapes disappear
✅ Cursor positions update correctly

### Pass/Fail: ___

---

## Test 6: Error Handling - Insufficient Shapes
**Objective:** Verify proper error messages for invalid inputs

### Steps:
1. Create only 1 shape
2. Try to arrange: "Arrange this shape horizontally"

### Expected Results:
✅ Error message: "At least 2 shapes required"
✅ No console errors
✅ Canvas remains in valid state

### Steps (Distribution):
1. Create only 2 shapes
2. Try: "Distribute these shapes evenly"

### Expected Results:
✅ Error message: "At least 3 shapes required"
✅ Toast notification appears
✅ Canvas remains stable

### Pass/Fail: ___

---

## Test 7: Invalid Spacing Values
**Objective:** Verify spacing validation

### Steps:
1. Create 3 shapes
2. Try negative spacing: "Arrange horizontally with -10px spacing"
3. Try excessive spacing: "Arrange horizontally with 600px spacing"

### Expected Results:
✅ Negative spacing rejected: "Spacing must be between 0 and 500 pixels"
✅ Excessive spacing rejected: "Spacing must be between 0 and 500 pixels"
✅ No changes made to canvas
✅ Clear error messages in toast

### Pass/Fail: ___

---

## Test 8: Zero Spacing (Edge Case)
**Objective:** Verify 0px spacing works

### Steps:
1. Create 3 shapes
2. "Arrange these shapes horizontally with 0px spacing"

### Expected Results:
✅ All shapes positioned at same x coordinate (overlapping)
✅ Message confirms: "0px spacing"
✅ Shapes still selectable individually

### Pass/Fail: ___

---

## Test 9: Large Number of Shapes
**Objective:** Verify performance with many shapes

### Steps:
1. Create a 5x5 grid: "Create a 5x5 grid of blue circles"
2. "Arrange all circles horizontally"

### Expected Results:
✅ All 25 shapes arrange successfully
✅ Operation completes in <2 seconds
✅ No lag or freezing
✅ Undo still works (if implemented)
✅ Sync works across browsers

### Pass/Fail: ___

---

## Test 10: Mixed Shape Types
**Objective:** Verify arrangement works with different shape types

### Steps:
1. Create mixed shapes:
   - "Create a circle at 100, 100"
   - "Create a rectangle at 200, 150"
   - "Create a triangle at 300, 120"
   - "Create text 'Hello' at 400, 130"

2. "Arrange these 4 shapes vertically"

### Expected Results:
✅ All shape types arrange correctly
✅ Proper alignment on x-axis
✅ Sizes don't affect alignment (uses center point)
✅ Text remains readable

### Pass/Fail: ___

---

## Test 11: Context-Aware Arrangement
**Objective:** Verify AI can identify shapes by descriptor

### Steps:
1. Create shapes with distinct colors:
   - "Create 3 red circles at 100, 100"
   - "Create 3 blue rectangles at 300, 100"

2. "Arrange the red shapes horizontally"
3. "Arrange the blue shapes vertically"

### Expected Results:
✅ AI correctly identifies red circles
✅ Only red shapes are arranged horizontally
✅ AI correctly identifies blue rectangles
✅ Only blue shapes are arranged vertically
✅ Other shapes remain unchanged

### Pass/Fail: ___

---

## Test 12: Shapes at Negative Coordinates
**Objective:** Verify clamping to non-negative coordinates

### Steps:
1. Manually note some shape positions
2. Arrange shapes that would result in negative coordinates
3. Check final positions

### Expected Results:
✅ All shapes have x >= 0 and y >= 0
✅ No shapes disappear off canvas
✅ Arrangement proportions maintained where possible
✅ Warning if clamping occurred (optional)

### Pass/Fail: ___

---

## Test 13: Network Latency Test
**Objective:** Verify arrangement works on slow connections

### Steps:
1. Open DevTools > Network tab
2. Throttle to "Fast 3G"
3. Create 4 shapes
4. "Arrange horizontally"

### Expected Results:
✅ Arrangement completes successfully
✅ May take slightly longer but completes
✅ No timeout errors
✅ Optimistic update visible immediately
✅ Final state syncs correctly

### Pass/Fail: ___

---

## Test 14: Rapid Successive Arrangements
**Objective:** Verify rapid commands don't cause conflicts

### Steps:
1. Create 5 shapes
2. Quickly execute:
   - "Arrange horizontally"
   - Wait for completion
   - "Arrange vertically"  
   - Wait for completion
   - "Distribute evenly"

### Expected Results:
✅ Each command completes before next starts
✅ No race conditions
✅ Final state matches last command
✅ Command history shows all 3 commands
✅ No duplicate updates

### Pass/Fail: ___

---

## Test 15: Browser Compatibility
**Objective:** Verify works across browsers

### Browsers to Test:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

### Steps (in each browser):
1. Create 3 shapes
2. Arrange horizontally
3. Verify positions are correct

### Expected Results:
✅ Works identically in all browsers
✅ No browser-specific issues
✅ Cross-browser sync works

### Pass/Fail: ___

---

## Performance Benchmarks

### Expected Performance:
- **Arrangement Time (10 shapes):** <200ms
- **Arrangement Time (50 shapes):** <1s
- **Sync Latency:** <100ms
- **Command Response:** <2s (including API call)

### Actual Performance:
- Arrangement (10 shapes): ___ms
- Arrangement (50 shapes): ___ms
- Sync Latency: ___ms
- Command Response: ___s

---

## Critical Issues Found
List any critical issues that block PR approval:

1. 
2. 
3. 

---

## Minor Issues Found
List any minor issues or improvements needed:

1. 
2. 
3. 

---

## Overall Assessment

**All Critical Tests Passed:** ☐ Yes  ☐ No

**Ready for Production:** ☐ Yes  ☐ No  ☐ With fixes

**Tester Name:** ___________________

**Date:** ___________________

**Notes:**

