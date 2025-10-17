# PR11 Part A: Z-Index Foundation - Manual Testing Guide

## Overview
This guide covers manual testing for PR11 Part A, which implements z-index foundation for shape layering.

**Feature**: Z-index management for shapes (bring to front, send to back, bring forward, send backward)

**Date**: Current Session  
**Tester**: _________

---

## Pre-Testing Setup

### 1. Environment Preparation
- [ ] Fresh browser profile or incognito mode
- [ ] Two separate browser windows/tabs for multi-user testing
- [ ] Network tab open in DevTools to monitor Firestore updates
- [ ] Console tab open to check for errors

### 2. Data Migration (if testing with existing data)
```bash
# Run migration script to add zIndex to existing shapes
cd collabcanvas-app
node scripts/migrateZIndex.js
```

Expected output:
- Script completes without errors
- All existing shapes now have zIndex property
- Console shows summary: `✨ Migration completed successfully!`

---

## Test Suite

### Test 1: Basic Z-Index Ordering

**Objective**: Verify shapes render in correct z-index order

**Steps**:
1. Open canvas in browser
2. Create 3 overlapping shapes:
   - Red rectangle at (100, 100)
   - Blue circle at (120, 120) 
   - Green rectangle at (140, 140)
3. Observe the visual stacking order

**Expected Result**:
- [ ] Green rectangle on top (created last, highest zIndex)
- [ ] Blue circle in middle
- [ ] Red rectangle on bottom (created first, lowest zIndex)
- [ ] Each shape has zIndex property in Firestore (check Network tab)

**Actual Result**: _______________

---

### Test 2: Right-Click Context Menu

**Objective**: Context menu appears and displays z-index options

**Steps**:
1. Right-click on any shape
2. Observe the context menu

**Expected Result**:
- [ ] Context menu appears at cursor position
- [ ] Menu shows "Layer Order" section
- [ ] Four options visible:
  - ⬆️ Bring to Front (Ctrl+])
  - ↑ Bring Forward (])
  - ↓ Send Backward ([)
  - ⬇️ Send to Back (Ctrl+[)
- [ ] Menu has clean, modern styling
- [ ] Clicking outside closes menu
- [ ] Pressing Escape closes menu

**Actual Result**: _______________

---

### Test 3: Bring to Front

**Objective**: Shape moves to highest z-index

**Steps**:
1. Create 3 overlapping shapes (A, B, C) where C is on top
2. Select shape A (bottom shape)
3. Right-click → "Bring to Front"

**Expected Result**:
- [ ] Shape A now renders on top of B and C
- [ ] Visual order changes immediately
- [ ] Firestore update seen in Network tab
- [ ] Shape A's zIndex = max(all zIndex) + 1

**Actual Result**: _______________

**Keyboard Shortcut Test**:
- [ ] Select shape B
- [ ] Press Ctrl+] (Cmd+] on Mac)
- [ ] Shape B moves to front

---

### Test 4: Send to Back

**Objective**: Shape moves to lowest z-index

**Steps**:
1. Using shapes from Test 3
2. Select the top shape
3. Right-click → "Send to Back"

**Expected Result**:
- [ ] Selected shape now renders below all others
- [ ] Visual order changes immediately
- [ ] Firestore update seen in Network tab
- [ ] Shape's zIndex = min(all zIndex) - 1

**Actual Result**: _______________

**Keyboard Shortcut Test**:
- [ ] Select any shape
- [ ] Press Ctrl+[ (Cmd+[ on Mac)
- [ ] Shape moves to back

---

### Test 5: Bring Forward (One Step)

**Objective**: Shape swaps z-index with next higher shape

**Steps**:
1. Create 4 shapes in order: A (bottom), B, C, D (top)
2. Select shape B (second from bottom)
3. Right-click → "Bring Forward"

**Expected Result**:
- [ ] Shape B swaps position with C
- [ ] New order: A, C, B, D
- [ ] Only B and C change z-index (batch update)
- [ ] Visual order updates immediately

**Actual Result**: _______________

**Edge Case**:
- [ ] Select top shape D
- [ ] Click "Bring Forward"
- [ ] Nothing happens (already at front)
- [ ] No error in console

**Keyboard Shortcut Test**:
- [ ] Select shape A
- [ ] Press ] key (without Ctrl/Cmd)
- [ ] Shape A moves forward one step

---

### Test 6: Send Backward (One Step)

**Objective**: Shape swaps z-index with next lower shape

**Steps**:
1. Using 4 shapes: A (bottom), B, C, D (top)
2. Select shape C (second from top)
3. Right-click → "Send Backward"

**Expected Result**:
- [ ] Shape C swaps position with B
- [ ] New order: A, C, B, D
- [ ] Only B and C change z-index (batch update)
- [ ] Visual order updates immediately

**Actual Result**: _______________

**Edge Case**:
- [ ] Select bottom shape A
- [ ] Click "Send Backward"
- [ ] Nothing happens (already at back)
- [ ] No error in console

**Keyboard Shortcut Test**:
- [ ] Select shape D
- [ ] Press [ key (without Ctrl/Cmd)
- [ ] Shape D moves backward one step

---

### Test 7: Multi-User Real-Time Sync

**Objective**: Z-index changes sync to all users in <500ms

**Setup**:
- Open canvas in Browser A (User A)
- Open same canvas in Browser B (User B)
- Create 3 overlapping shapes in Browser A

**Steps**:
1. In Browser A: Right-click bottom shape → "Bring to Front"
2. Observe Browser B

**Expected Result**:
- [ ] Shape moves to front in Browser A immediately
- [ ] Shape moves to front in Browser B within 500ms
- [ ] Both browsers show identical visual order
- [ ] No flashing or jitter

**Repeat for all 4 commands**:
- [ ] Bring to Front syncs
- [ ] Send to Back syncs
- [ ] Bring Forward syncs
- [ ] Send Backward syncs

**Actual Result**: _______________

---

### Test 8: Undo/Redo with Z-Index Changes

**Objective**: Z-index operations work with undo/redo

**Steps**:
1. Create 3 shapes (A, B, C)
2. Move shape A to front (Ctrl+])
3. Press Ctrl+Z to undo

**Expected Result**:
- [ ] Shape A returns to original z-index position
- [ ] Visual order reverts
- [ ] Press Ctrl+Shift+Z to redo
- [ ] Shape A returns to front
- [ ] Visual order restored

**Test Multiple Operations**:
1. Shape A: Bring Forward (])
2. Shape B: Send Backward ([)
3. Shape C: Bring to Front (Ctrl+])
4. Undo all 3 operations (Ctrl+Z × 3)

**Expected Result**:
- [ ] Each undo reverts one z-index change
- [ ] Operations undo in reverse order (LIFO)
- [ ] Visual order correctly restored at each step

**Actual Result**: _______________

---

### Test 9: Z-Index with Shape Deletion

**Objective**: Deleting shapes doesn't break z-index order

**Steps**:
1. Create 5 shapes with various z-indexes
2. Delete the middle shape (3rd in order)
3. Observe remaining shapes

**Expected Result**:
- [ ] Remaining shapes maintain correct visual order
- [ ] No gaps or errors in z-index sequence
- [ ] Can still use all z-index commands on remaining shapes

**Actual Result**: _______________

---

### Test 10: Z-Index with Copy/Paste

**Objective**: Copied shapes get new z-index

**Steps**:
1. Create 3 shapes (A, B, C)
2. Select shape B (middle)
3. Copy (Ctrl+C) and paste (Ctrl+V)

**Expected Result**:
- [ ] New shape B' appears with offset position
- [ ] B' has highest z-index (on top of all shapes)
- [ ] Original B maintains its z-index
- [ ] All 4 shapes have unique z-index values

**Actual Result**: _______________

---

### Test 11: Performance with Many Shapes

**Objective**: Z-index operations remain fast with 20+ shapes

**Steps**:
1. Create 25 overlapping shapes
2. Select bottom shape
3. Click "Bring to Front"
4. Measure time to visual update

**Expected Result**:
- [ ] Visual update occurs in <100ms (feels instant)
- [ ] No lag when right-clicking shapes
- [ ] Context menu appears instantly
- [ ] Firestore batch update completes in <500ms

**Actual Result**: _______________

---

### Test 12: Z-Index Persistence

**Objective**: Z-index survives page refresh

**Steps**:
1. Create 4 shapes and arrange z-index order
2. Note the visual stacking order
3. Refresh the page (F5 or Cmd+R)

**Expected Result**:
- [ ] After refresh, shapes load in same visual order
- [ ] Z-index values persist in Firestore
- [ ] No reordering or shuffling on load

**Actual Result**: _______________

---

### Test 13: Keyboard Shortcuts Summary

**Objective**: All keyboard shortcuts work correctly

| Action | Shortcut | Expected Behavior |
|--------|----------|-------------------|
| Bring to Front | Ctrl+] (Cmd+]) | Shape moves to highest z-index |
| Send to Back | Ctrl+[ (Cmd+[) | Shape moves to lowest z-index |
| Bring Forward | ] | Shape swaps with next higher |
| Send Backward | [ | Shape swaps with next lower |

**Test Each**:
- [ ] Ctrl+] works (bring to front)
- [ ] Ctrl+[ works (send to back)
- [ ] ] works (bring forward)
- [ ] [ works (send backward)
- [ ] Works on Mac with Cmd key
- [ ] Works on Windows/Linux with Ctrl key

**Actual Result**: _______________

---

### Test 14: Error Handling

**Objective**: Graceful handling of edge cases

**Scenarios**:

1. **No shape selected**:
   - [ ] Z-index keyboard shortcuts do nothing
   - [ ] No console errors

2. **Network offline**:
   - [ ] Z-index changes apply locally (optimistic update)
   - [ ] Visual order updates immediately
   - [ ] Changes queue for sync when online

3. **Firestore permission denied** (simulate with rules):
   - [ ] Toast error appears
   - [ ] Console shows clear error message
   - [ ] UI doesn't crash

**Actual Result**: _______________

---

## Regression Testing

Ensure existing features still work:

- [ ] **Shape Creation**: Can create all shape types
- [ ] **Shape Selection**: Single and multi-select work
- [ ] **Shape Dragging**: Shapes drag smoothly
- [ ] **Shape Resizing**: Transformer handles work
- [ ] **Shape Rotation**: Rotation handles work
- [ ] **Delete**: Delete key removes shapes
- [ ] **Copy/Paste**: Ctrl+C/Ctrl+V work
- [ ] **Undo/Redo**: Ctrl+Z/Ctrl+Shift+Z work for all operations

---

## Bug Reporting Template

If you find issues, report using this format:

```
**Bug**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome/Firefox/Safari + version]
**Screenshot**: [If applicable]
**Console Errors**: [Copy any errors]
```

---

## Test Completion Checklist

- [ ] All 14 tests completed
- [ ] All expected results matched actual results
- [ ] All keyboard shortcuts tested
- [ ] Multi-user sync tested successfully
- [ ] Undo/redo integration verified
- [ ] No console errors observed
- [ ] No Firestore errors in Network tab
- [ ] Performance acceptable (no lag)
- [ ] Regression tests passed

**Overall Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

**Tester Signature**: _________  
**Date**: _________  
**Additional Notes**:
_________________________________
_________________________________
_________________________________

