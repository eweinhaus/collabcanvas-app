# PR9 Manual Testing Guide
## Multi-Select, Transform, and Copy/Paste Features

**Test Date**: _____________  
**Tester**: _____________  
**Environment**: _____________

---

## Test Setup

1. Open the application in two separate browsers (Chrome and Firefox recommended)
2. Log in with different accounts in each browser
3. Navigate to the same canvas board
4. Clear any existing shapes if needed

---

## Test 9.1: Shift-Click Multi-Select

### Steps:
1. Create 5 different shapes on the canvas (rectangles, circles, text)
2. Click on one shape to select it (should show blue transformer handles)
3. Hold **Shift** and click on a second shape
4. Hold **Shift** and click on a third shape
5. Hold **Shift** and click on one of the already-selected shapes

### Expected Results:
- ✅ Step 2: Single shape selected with transformer handles visible
- ✅ Step 3: Both shapes now selected, transformer encompasses both
- ✅ Step 4: All three shapes selected, transformer encompasses all
- ✅ Step 5: Shape is deselected (removed from selection)

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.2: Lasso Selection (Drag Selection Box)

### Steps:
1. Create 10-12 shapes scattered across the canvas
2. Click on empty canvas area and drag to create a selection box
3. Draw a box that encompasses 3-4 shapes
4. Release the mouse
5. Repeat with a very small drag (< 5px)
6. With shapes still selected, click on empty canvas (no drag)

### Expected Results:
- ✅ Step 2: Blue dashed selection box appears while dragging
- ✅ Step 3: Box is visible and follows cursor
- ✅ Step 4: All shapes within the box are selected
- ✅ Step 5: No selection occurs (small accidental drags ignored)
- ✅ Step 6: All shapes are deselected (selection cleared)

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.3-9.4: Resize and Rotate with Transformer

### Steps:
1. Select a single rectangle
2. Drag a corner handle to resize the shape
3. Verify the shape updates in the second browser
4. Drag the rotation handle (circular handle above shape)
5. Select 3 shapes using Shift+Click
6. Drag a corner handle of the group transformer
7. Rotate the group

### Expected Results:
- ✅ Step 2: Shape resizes smoothly, maintains aspect ratio with Shift
- ✅ Step 3: Resized shape appears immediately in second browser
- ✅ Step 4: Shape rotates around its center
- ✅ Step 6: All selected shapes resize together as a group
- ✅ Step 7: All selected shapes rotate together around group center

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.5: Duplicate (Cmd/Ctrl+D)

### Steps:
1. Create a red rectangle
2. Select it and press **Cmd+D** (Mac) or **Ctrl+D** (Windows)
3. Create 2 circles and a text shape
4. Select all 3 using lasso selection
5. Press **Cmd+D**

### Expected Results:
- ✅ Step 2: Duplicate appears 20px down and right, newly duplicated shape is selected
- ✅ Step 5: All 3 shapes duplicated 20px down and right, duplicates are selected
- ✅ All duplicates maintain original properties (color, size, rotation, text content)

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.6-9.7: Copy and Paste

### Steps:
1. Create a blue circle with radius 40
2. Select it and press **Cmd+C**
3. Press **Cmd+V**
4. Create 4 different shapes and select them all
5. Press **Cmd+C**
6. Press **Cmd+V** twice

### Expected Results:
- ✅ Step 3: Copy appears 20px down and right, maintains blue color and size
- ✅ Step 6: 
  - First paste: 4 shapes duplicated, offset by 20px
  - Second paste: 4 more shapes created at 40px offset from originals
- ✅ All properties preserved (colors, sizes, text, rotation)
- ✅ Pasted shapes are selected after paste

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.8: Keyboard Shortcuts Modal

### Steps:
1. Press **?** key
2. Verify the shortcuts modal displays
3. Check that new shortcuts are documented:
   - Shift/Cmd + Click
   - Click + Drag (lasso)
   - Drag handles (resize/rotate)
4. Press **Escape** to close

### Expected Results:
- ✅ Modal appears with all shortcuts listed
- ✅ New multi-select shortcuts are clearly documented
- ✅ Descriptions mention "shape(s)" for multi-select support
- ✅ Modal closes on Escape

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.12: Stress Test with 10+ Shapes

### Steps:
1. Create 15 shapes of various types
2. Use lasso to select all 15 shapes
3. Move them with arrow keys (10 presses in different directions)
4. Resize the group using transformer
5. Copy all 15 shapes
6. Paste them
7. Check second browser

### Expected Results:
- ✅ All 15 shapes selected smoothly
- ✅ Arrow key movement is responsive and accurate
- ✅ Transformer handles large selection without lag
- ✅ All 15 shapes copy and paste correctly
- ✅ Second browser shows all operations in real-time
- ✅ No performance issues or UI freezing

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.13: Multi-Shape Transform Sync

### Steps:
1. In Browser 1: Create 5 shapes
2. In Browser 1: Select all 5 shapes
3. In Browser 1: Resize all shapes together using transformer
4. In Browser 2: Observe changes
5. In Browser 1: Rotate all shapes 45 degrees
6. In Browser 2: Observe changes

### Expected Results:
- ✅ Step 4: All shape sizes update in Browser 2 in real-time
- ✅ Step 6: All shape rotations update in Browser 2 in real-time
- ✅ No shape positions drift or desync
- ✅ Transformations maintain relative positions of shapes

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Test 9.14: Property Preservation in Copy/Paste

### Steps:
1. Create a rotated (45°) red rectangle
2. Create a green circle with custom size
3. Create text shape with content "Test ABC"
4. Create a triangle with orange fill
5. Select all 4 and copy/paste

### Expected Results:
- ✅ Rectangle: maintains red color and 45° rotation
- ✅ Circle: maintains green color and custom radius
- ✅ Text: maintains "Test ABC" text content and font size
- ✅ Triangle: maintains orange color and shape
- ✅ All pasted shapes have correct offset positioning

### Pass/Fail: ___________
### Notes: ___________________________________________

---

## Edge Cases

### Test: Delete During Multi-Select
1. Select 3 shapes
2. Press Delete/Backspace
3. Verify all 3 shapes are deleted

**Pass/Fail**: ___________

### Test: Tool Change Clears Selection
1. Select 2 shapes
2. Click on Rectangle tool in toolbar
3. Verify selection is cleared

**Pass/Fail**: ___________

### Test: Escape Clears Selection
1. Select 3 shapes
2. Press Escape
3. Verify selection is cleared

**Pass/Fail**: ___________

### Test: Mixed Shape Types
1. Select 1 rectangle, 1 circle, 1 text, 1 triangle
2. Resize all together
3. Verify all shapes resize appropriately (text gets larger, circles scale, etc.)

**Pass/Fail**: ___________

---

## Known Issues / Bugs Found

| Issue # | Description | Severity | Steps to Reproduce |
|---------|-------------|----------|-------------------|
| 1       |             |          |                   |
| 2       |             |          |                   |
| 3       |             |          |                   |

---

## Overall Assessment

**Total Tests Passed**: _____ / 16  
**Overall Status**: ⬜ PASS  ⬜ FAIL  ⬜ NEEDS WORK

**Tester Signature**: _____________________  
**Date Completed**: _____________________

---

## Notes for Developers

Please use this space for any additional observations, suggestions, or concerns:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

