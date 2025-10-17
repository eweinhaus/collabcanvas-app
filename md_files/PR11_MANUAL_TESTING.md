# PR11 Manual Testing Guide

## Overview
This guide covers manual testing for PR11: Layers Panel and Alignment Tools features.

## Prerequisites
- CollabCanvas running locally or on staging
- At least 2 browser windows/tabs for multi-user testing
- Authenticated with different accounts in each browser

---

## Part A: Z-Index Foundation

### Test 1: Basic Z-Index Behavior
**Steps:**
1. Create 3 shapes on the canvas (e.g., rectangle, circle, triangle)
2. Overlap them so they stack
3. Verify that later-created shapes appear on top

**Expected:** Shapes stack in creation order (newer = higher z-index)

### Test 2: Z-Index Keyboard Shortcuts
**Steps:**
1. Create 3 overlapping shapes
2. Select the bottom shape
3. Press `Cmd/Ctrl + ]` (Bring to Front)
4. Verify the shape moves to the top of the stack
5. Select the top shape
6. Press `Cmd/Ctrl + [` (Send to Back)
7. Verify the shape moves to the bottom

**Expected:** Keyboard shortcuts correctly reorder shapes

### Test 3: Z-Index Context Menu
**Steps:**
1. Create 3 overlapping shapes
2. Right-click a shape in the middle
3. Select "Bring to Front" from context menu
4. Verify the shape moves to the top
5. Right-click it again
6. Select "Send to Back"

**Expected:** Context menu options work correctly

### Test 4: Z-Index Real-time Sync
**Steps:**
1. Open canvas in Browser A and Browser B
2. In Browser A: Create 3 shapes and reorder them using shortcuts
3. In Browser B: Observe the shapes

**Expected:** Z-index changes sync instantly across both browsers

---

## Part B: Layers Panel

### Test 5: Open/Close Layers Panel
**Steps:**
1. Click the "Layers" button in the Actions toolbar
2. Verify the Layers Panel slides in from the right
3. Verify the "Online" box disappears
4. Click the X button to close the panel
5. Verify the panel closes and "Online" box reappears

**Expected:** Panel opens/closes smoothly with proper UI state

### Test 6: Layer Display
**Steps:**
1. Create 5 different shapes (rectangle, circle, triangle, text, another rectangle)
2. Open the Layers Panel
3. Verify all 5 layers are listed
4. Verify they're sorted by z-index (top layer = highest z-index)
5. Verify each layer shows the correct shape icon and color

**Expected:** All shapes appear as layers in correct order

### Test 7: Drag-and-Drop Reordering
**Steps:**
1. Create 5 shapes
2. Open Layers Panel
3. Drag the bottom layer to the top position
4. Verify the shape moves to the front on canvas
5. Drag the top layer to the middle position
6. Verify the canvas updates correctly

**Expected:** Drag-and-drop reorders shapes and updates canvas z-index

### Test 8: Layer Selection
**Steps:**
1. Create 3 shapes
2. Open Layers Panel
3. Click a layer in the panel
4. Verify the corresponding shape is selected on canvas (blue selection box)
5. Click a different layer
6. Verify selection changes

**Expected:** Clicking layers selects shapes on canvas

### Test 9: Visibility Toggle
**Steps:**
1. Create 3 shapes
2. Open Layers Panel
3. Click the eye icon on one layer
4. Verify the shape disappears from canvas
5. Click the eye icon again
6. Verify the shape reappears

**Expected:** Eye icon toggles shape visibility

### Test 10: Layer Duplication
**Steps:**
1. Create a shape
2. Open Layers Panel
3. Click the duplicate icon on the layer
4. Verify a new shape appears offset from the original
5. Verify a new layer appears in the panel

**Expected:** Duplication creates new shape with offset position

### Test 11: Layer Deletion
**Steps:**
1. Create 3 shapes
2. Open Layers Panel
3. Click the delete icon on one layer
4. Confirm the deletion dialog
5. Verify the layer and shape are removed

**Expected:** Deletion removes layer and shape after confirmation

### Test 12: Layer Reordering with 20+ Shapes (Performance Test)
**Steps:**
1. Create 25 shapes on the canvas
2. Open Layers Panel
3. Drag a layer from bottom to top
4. Verify the reorder completes without lag (<500ms)
5. Verify all 25 layers render smoothly

**Expected:** Panel performs well with many layers

### Test 13: Multi-Layer Visibility Toggle (Stress Test)
**Steps:**
1. Create 10 shapes
2. Open Layers Panel
3. Rapidly toggle visibility on 5 different layers
4. Verify all visibility changes apply correctly
5. Verify no visual glitches

**Expected:** Multiple visibility toggles handle correctly

### Test 14: Layers Panel Real-time Sync
**Steps:**
1. Open canvas in Browser A and Browser B
2. In Browser A: Open Layers Panel and reorder layers
3. In Browser B: Open Layers Panel
4. Verify layer order matches in both browsers
5. In Browser A: Toggle visibility on a layer
6. In Browser B: Verify the layer shows as hidden

**Expected:** All layer operations sync in real-time

---

## Part C: Alignment Tools

### Test 15: Alignment Toolbar Appearance
**Steps:**
1. Create 2 shapes
2. Select both shapes (Shift+click or drag selection box)
3. Verify the Alignment Toolbar appears above the selection
4. Deselect shapes
5. Verify the toolbar disappears

**Expected:** Toolbar appears only when 2+ shapes are selected

### Test 16: Align Left
**Steps:**
1. Create 3 shapes at different x positions (e.g., x=0, x=100, x=200)
2. Select all 3 shapes
3. Click "Align Left" button or press `Cmd/Ctrl + Shift + L`
4. Verify all shapes move to the leftmost x position

**Expected:** All shapes align to the left edge of the leftmost shape

### Test 17: Align Center (Horizontal)
**Steps:**
1. Create 3 shapes at x=0, x=100, x=200
2. Select all shapes
3. Click "Align Center" or press `Cmd/Ctrl + Shift + C`
4. Verify all shapes align to the horizontal center of the selection bounds

**Expected:** Shapes align to horizontal center

### Test 18: Align Right
**Steps:**
1. Create 3 shapes at different x positions
2. Select all shapes
3. Click "Align Right" or press `Cmd/Ctrl + Shift + R`
4. Verify all shapes align to the rightmost edge

**Expected:** All shapes align to the right edge

### Test 19: Align Top
**Steps:**
1. Create 3 shapes at different y positions (y=0, y=100, y=200)
2. Select all shapes
3. Click "Align Top" or press `Cmd/Ctrl + Shift + T`
4. Verify all shapes align to the topmost y position

**Expected:** All shapes align to the top edge

### Test 20: Align Middle (Vertical)
**Steps:**
1. Create 3 shapes at different y positions
2. Select all shapes
3. Click "Align Middle" or press `Cmd/Ctrl + Shift + M`
4. Verify all shapes align to the vertical center

**Expected:** Shapes align to vertical middle

### Test 21: Align Bottom
**Steps:**
1. Create 3 shapes at different y positions
2. Select all shapes
3. Click "Align Bottom" or press `Cmd/Ctrl + Shift + B`
4. Verify all shapes align to the bottom edge

**Expected:** All shapes align to the bottom edge

### Test 22: Distribute Horizontally
**Steps:**
1. Create 5 shapes with uneven horizontal spacing
2. Select all 5 shapes
3. Click "Distribute Horizontally" or press `Cmd/Ctrl + Shift + H`
4. Verify shapes have equal gaps between them
5. Verify leftmost and rightmost shapes stay in place

**Expected:** Even horizontal spacing with endpoints fixed

### Test 23: Distribute Vertically
**Steps:**
1. Create 5 shapes with uneven vertical spacing
2. Select all shapes
3. Click "Distribute Vertically" or press `Cmd/Ctrl + Shift + V`
4. Verify shapes have equal vertical gaps
5. Verify topmost and bottommost shapes stay in place

**Expected:** Even vertical spacing with endpoints fixed

### Test 24: Align 10+ Shapes (Performance Test)
**Steps:**
1. Create 15 shapes scattered across the canvas
2. Select all 15 shapes
3. Click "Align Left"
4. Verify all shapes align without lag (<200ms)
5. Try other alignment options

**Expected:** Alignment is instant even with many shapes

### Test 25: Distribute 15+ Shapes (Performance Test)
**Steps:**
1. Create 20 shapes in a line with random spacing
2. Select all 20 shapes
3. Click "Distribute Horizontally"
4. Verify distribution completes quickly (<300ms)
5. Verify all gaps are equal

**Expected:** Distribution handles many shapes efficiently

### Test 26: Alignment Real-time Sync
**Steps:**
1. Open canvas in Browser A and Browser B
2. In Browser A: Create 5 shapes
3. In Browser B: Verify shapes appear
4. In Browser A: Select all shapes and align left
5. In Browser B: Verify shapes align simultaneously

**Expected:** Alignment changes sync instantly to all users

### Test 27: Alignment with Mixed Shape Types
**Steps:**
1. Create 1 rectangle, 1 circle, 1 triangle, 1 text
2. Select all shapes
3. Try various alignments (left, center, top, bottom)
4. Verify all shapes align correctly despite different types

**Expected:** Alignment works for all shape types

### Test 28: Alignment with Rotated Shapes
**Steps:**
1. Create 3 rectangles
2. Rotate one rectangle 45 degrees
3. Select all shapes
4. Align left
5. Verify rotated shape aligns based on its bounding box

**Expected:** Rotated shapes align correctly

---

## Integration Tests

### Test 29: Layers Panel + Alignment Together
**Steps:**
1. Create 5 shapes
2. Open Layers Panel
3. Reorder layers by dragging
4. Select 3 shapes
5. Use alignment toolbar to align them
6. Verify both features work together without conflict

**Expected:** Features work harmoniously

### Test 30: Alignment + Undo/Redo
**Steps:**
1. Create 3 shapes
2. Select all and align left
3. Press `Cmd/Ctrl + Z` (Undo)
4. Verify shapes return to original positions
5. Press `Cmd/Ctrl + Shift + Z` (Redo)
6. Verify shapes align left again

**Expected:** Alignment operations are undoable/redoable

### Test 31: Layer Reorder + Undo/Redo
**Steps:**
1. Create 3 shapes
2. Open Layers Panel
3. Use `Cmd/Ctrl + ]` to bring a shape to front
4. Press `Cmd/Ctrl + Z` (Undo)
5. Verify z-index reverts
6. Press `Cmd/Ctrl + Shift + Z` (Redo)

**Expected:** Z-index changes are undoable/redoable

---

## Edge Cases & Error Handling

### Test 32: Empty Layers Panel
**Steps:**
1. Open Layers Panel with no shapes on canvas
2. Verify "No layers yet" message displays
3. Create a shape
4. Verify layer appears automatically

**Expected:** Graceful empty state

### Test 33: Alignment with Single Shape
**Steps:**
1. Create 1 shape
2. Select it
3. Verify Alignment Toolbar does NOT appear

**Expected:** Toolbar requires 2+ shapes

### Test 34: Distribution with 2 Shapes
**Steps:**
1. Create 2 shapes
2. Select both
3. Verify "Distribute" buttons are NOT visible

**Expected:** Distribution requires 3+ shapes

### Test 35: Rapid Layer Operations
**Steps:**
1. Create 5 shapes
2. Open Layers Panel
3. Rapidly: drag layers, toggle visibility, duplicate, delete
4. Verify no crashes or visual glitches

**Expected:** Handles rapid operations gracefully

---

## Accessibility

### Test 36: Layers Panel Keyboard Navigation
**Steps:**
1. Open Layers Panel
2. Press Tab to focus on close button
3. Press Enter to close
4. Verify panel closes

**Expected:** Keyboard navigation works

### Test 37: Alignment Toolbar Keyboard Access
**Steps:**
1. Select 2 shapes
2. Press Tab to focus on alignment buttons
3. Press Enter to activate
4. Verify alignment executes

**Expected:** Toolbar is keyboard accessible

---

## Success Criteria

✅ **All 37 manual tests pass**
✅ **No console errors during normal operation**
✅ **Real-time sync works reliably (<500ms latency)**
✅ **Performance is acceptable with 20+ shapes**
✅ **UI feels responsive and polished**

---

## Known Issues / Limitations

1. **Layer names:** Currently show shape type + dimensions, not custom names
2. **Group support:** Grouping shapes is not yet implemented
3. **Alignment preview:** Hover preview is not yet implemented (task 11.45)
4. **Undo/Redo for alignment:** Command pattern not yet integrated (future PR)

---

## Reporting Issues

When reporting bugs, please include:
- Browser and OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or video if applicable
- Console errors (if any)

---

**Last Updated:** PR11 Part C completion
**Test Coverage:** 37 manual tests covering Layers Panel and Alignment Tools
