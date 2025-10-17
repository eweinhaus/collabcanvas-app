# PR 13: Context-Aware AI & Command History - Manual Testing Guide

## Overview
This guide covers manual testing for PR 13, which adds context-aware AI shape identification and command history display.

**New Features:**
- Context-aware shape manipulation (identify shapes by color, type, or both)
- Enhanced canvas state with full shape properties
- AIHistory component to display command execution history
- Shape identification utility with color family matching

**Test Environment:**
- Two browser windows (or one normal + one incognito)
- CollabCanvas app running locally or on production
- Both users logged in with different Google accounts

---

## Test 16.10: "Move the blue rectangle to 500, 300"

### Objective
Test context-aware shape identification with color + type descriptor.

### Prerequisites
- Canvas has at least one blue rectangle
- Canvas may have other shapes (different colors/types)

### Steps

1. **Setup**
   - User A: Create a blue rectangle at position (200, 200)
   - User A: Create a red circle at position (300, 300) (to verify it's not moved)
   - Verify both users see both shapes

2. **Execute Command**
   - User A: Type in AI prompt: `"Move the blue rectangle to 500, 300"`
   - Press Send

3. **Expected Results**
   - ✅ Blue rectangle moves to position (500, 300)
   - ✅ Red circle remains at (300, 300) - not affected
   - ✅ Command appears in AIHistory with timestamp
   - ✅ AIHistory shows "moveShape" tool execution
   - ✅ Success toast: "Moved rectangle to (500, 300)"
   - ✅ Both users see the updated position
   - ✅ Latency < 2 seconds

4. **Variations to Test**
   - Multiple blue rectangles: Should move the most recent one
   - No blue rectangles: Should show error "No blue rectangle shapes found"
   - Blue circle instead: Should show error "No blue rectangle shapes found"

### Success Criteria
- ✅ Correct shape identified and moved
- ✅ Other shapes not affected
- ✅ Clear success/error messages
- ✅ History updated correctly
- ✅ Real-time sync to all users

---

## Test 16.11: "Change the red circle to green"

### Objective
Test context-aware color change with color + type descriptor.

### Prerequisites
- Canvas has at least one red circle
- Canvas may have other shapes

### Steps

1. **Setup**
   - User A: Create a red circle at position (200, 200)
   - User A: Create a blue rectangle at position (400, 400)
   - Verify both users see both shapes

2. **Execute Command**
   - User B: Type in AI prompt: `"Change the red circle to green"`
   - Press Send

3. **Expected Results**
   - ✅ Red circle changes to green (#00ff00 or similar)
   - ✅ Blue rectangle remains blue - not affected
   - ✅ Command appears in AIHistory
   - ✅ AIHistory shows "updateShapeColor" tool execution
   - ✅ Success toast: "Changed circle color to green"
   - ✅ Both users see the color change
   - ✅ Latency < 2 seconds

4. **Variations to Test**
   - Multiple red circles: Should change the most recent one
   - No red circles: Should show error "No red circle shapes found"
   - Red rectangle: Should show error "No red circle shapes found"
   - Color aliases: "Change the red circle to blue" should work

### Success Criteria
- ✅ Correct shape identified and color changed
- ✅ Other shapes not affected
- ✅ Color normalized correctly (hex format)
- ✅ History updated correctly
- ✅ Real-time sync to all users

---

## Test 16.12: "Delete the triangle"

### Objective
Test context-aware deletion with type-only descriptor.

### Prerequisites
- Canvas has at least one triangle
- Canvas may have other shapes

### Steps

1. **Setup**
   - User A: Create a red circle at (100, 100)
   - User A: Create a blue triangle at (200, 200)
   - User A: Create a green rectangle at (300, 300)
   - Verify both users see all three shapes

2. **Execute Command**
   - User A: Type in AI prompt: `"Delete the triangle"`
   - Press Send

3. **Expected Results**
   - ✅ Blue triangle is deleted
   - ✅ Red circle and green rectangle remain
   - ✅ Command appears in AIHistory
   - ✅ AIHistory shows "deleteShape" tool execution
   - ✅ Success toast: "Deleted triangle"
   - ✅ Both users see the shape removed
   - ✅ Latency < 2 seconds

4. **Variations to Test**
   - Multiple triangles: Should delete the most recent one
   - No triangles: Should show error "No triangle shapes found"
   - Delete with color: "Delete the blue triangle" should work

### Success Criteria
- ✅ Correct shape identified and deleted
- ✅ Other shapes not affected
- ✅ History updated correctly
- ✅ Real-time sync to all users

---

## Test 16.13: Multiple Users Using Manipulation Simultaneously

### Objective
Test concurrent context-aware manipulation by multiple users.

### Prerequisites
- Two users (A and B) logged in
- Canvas with multiple shapes

### Steps

1. **Setup**
   - User A: Create a red circle at (100, 100)
   - User A: Create a blue rectangle at (200, 200)
   - User B: Create a green triangle at (300, 300)
   - User B: Create a purple circle at (400, 400)
   - Verify both users see all four shapes

2. **Concurrent Manipulation**
   - **User A** (at the same time): Type `"Move the red circle to 500, 100"`
   - **User B** (at the same time): Type `"Change the blue rectangle to yellow"`
   - Both press Send within 1 second of each other

3. **Expected Results**
   - ✅ Red circle moves to (500, 100) successfully
   - ✅ Blue rectangle changes to yellow successfully
   - ✅ No conflicts or errors
   - ✅ Both commands appear in each user's AIHistory
   - ✅ Both users see both changes
   - ✅ Each user sees their own command history locally

4. **Sequential Test**
   - User A: `"Delete the green triangle"`
   - Wait 2 seconds
   - User B: `"Rotate the purple circle 45 degrees"`
   - Verify both operations succeed

5. **Rapid Fire Test**
   - User A: Execute 3 commands rapidly (within 5 seconds)
     1. `"Create a red square"`
     2. `"Move the square to 600, 600"`
     3. `"Change the square color to blue"`
   - Verify all three commands execute successfully
   - Verify history shows all three commands in order

### Success Criteria
- ✅ No conflicts or data loss
- ✅ All commands execute successfully
- ✅ All shape changes sync to both users
- ✅ History is maintained independently per user
- ✅ No race conditions or errors
- ✅ Performance remains smooth (<2s per command)

---

## Test 16.14: Command History Display Verification

### Objective
Verify AIHistory component displays command history correctly.

### Steps

1. **Test Empty State**
   - Start with fresh session (no commands)
   - Open Sidebar with AIHistory
   - **Expected:** See empty state with icon 💭, "No commands yet", and hint text

2. **Test Single Command**
   - Execute: `"Create a blue circle"`
   - **Expected:**
     - Two entries in history: User message + Assistant message
     - User entry: 👤 icon, "You", timestamp, command text
     - Assistant entry: 🤖 icon, "AI Assistant", timestamp, latency
     - Success indicator: "✅ 1" in tool summary
     - Expand button (▶) to show tool details

3. **Test Tool Expansion**
   - Click expand button on assistant message
   - **Expected:**
     - Tool details expand
     - Shows "createShape" with success checkmark
     - Shows message: "Created circle at (x, y)"
     - Expand button changes to ▼

4. **Test Multiple Commands**
   - Execute 3 more commands:
     - `"Move the circle to 300, 300"`
     - `"Change color to red"`
     - `"Delete the circle"`
   - **Expected:**
     - 8 entries total (4 user + 4 assistant)
     - Most recent at bottom
     - Each with correct timestamp
     - Scrollable if needed

5. **Test Error Display**
   - Execute: `"Delete the pentagon"` (doesn't exist)
   - **Expected:**
     - Error entry with ⚠️ icon
     - Red background
     - Error message displayed clearly

6. **Test Clear History**
   - Click "🗑️ Clear" button
   - **Expected:**
     - History cleared
     - Back to empty state
     - No errors

7. **Test Latency Display**
   - Execute any command
   - **Expected:**
     - Latency shown as "⚡ XXXms" or "⚡ X.XXs"
     - Format: <1000ms shows "ms", ≥1000ms shows "s"

8. **Test Responsive Design**
   - Resize browser to mobile width (<768px)
   - **Expected:**
     - History container adjusts height
     - Text remains readable
     - Scrollbar appears if needed

### Success Criteria
- ✅ Empty state displays correctly
- ✅ All entry types render properly (user, assistant, error)
- ✅ Timestamps formatted correctly
- ✅ Tool expansion/collapse works
- ✅ Clear button works
- ✅ Latency formatted correctly
- ✅ Responsive design works
- ✅ Scrolling works for long history

---

## Additional Edge Cases

### Edge Case 1: Ambiguous References
- Create 3 blue rectangles
- Command: `"Move the blue rectangle to 500, 500"`
- **Expected:** Moves the most recent blue rectangle (first in sorted list)

### Edge Case 2: No Match
- Canvas has only circles
- Command: `"Delete the triangle"`
- **Expected:** Error message "No triangle shapes found"

### Edge Case 3: Color Family Matching
- Create circle with hex color #3366ff (light blue)
- Command: `"Change the blue circle to green"`
- **Expected:** Circle identified by color family, changes to green

### Edge Case 4: Mixed Descriptors
- Create red circle, blue circle, red rectangle
- Command: `"Move the red circle to 400, 400"`
- **Expected:** Moves red circle, not red rectangle

### Edge Case 5: Recent Shape Priority
- Create blue rectangle
- Create red circle
- Command: `"Move shape to 500, 500"` (no descriptor)
- **Expected:** Moves the red circle (most recent)

---

## Performance Benchmarks

| Command Type | Target Latency | Acceptable Range |
|-------------|----------------|------------------|
| Simple manipulation (move, color, delete) | <1.5s | 0.5s - 2s |
| With getCanvasState first | <2.5s | 1s - 3s |
| Multiple shapes (bulk operations) | <3s | 2s - 5s |

---

## Regression Tests

Ensure existing functionality still works:
- ✅ Shape creation with explicit parameters still works
- ✅ Direct ID-based manipulation still works
- ✅ All PR 11 and PR 12 tests still pass
- ✅ Multi-user sync still works (<100ms latency)
- ✅ Cursor updates still work (<50ms latency)

---

## Known Limitations

1. **Single Shape Selection:** When multiple shapes match, only the most recent is selected (unless "all" keyword used)
2. **Color Matching:** Uses color family matching, may match unintended shades
3. **History Per Session:** Command history is local to each user, not synced
4. **No Undo:** Deleted shapes cannot be recovered via AI commands

---

## Success Criteria Summary

**Must Pass:**
- ✅ All 4 main tests (16.10-16.13) pass
- ✅ History display test (16.14) passes
- ✅ No regressions in existing functionality
- ✅ 47/47 unit tests pass
- ✅ No console errors

**Performance:**
- ✅ Latency <2s for simple commands
- ✅ No UI lag or freezing
- ✅ Real-time sync works

**User Experience:**
- ✅ Clear success/error messages
- ✅ History is readable and informative
- ✅ Natural language commands work intuitively

---

## Troubleshooting

**Problem:** "Shape not found" error when shape exists
- Check color matching (hex vs name)
- Verify shape type spelling
- Check if shape is most recent

**Problem:** Wrong shape manipulated
- Verify descriptor is specific enough
- Check if multiple shapes match descriptor
- Use more specific descriptors (color + type)

**Problem:** History not updating
- Check AIContext is properly initialized
- Verify AIProvider wraps the app
- Check browser console for errors

**Problem:** Latency too high
- Check network connection
- Verify OpenAI API key is valid
- Check for console errors

---

## Test Completion Checklist

- [ ] Test 16.10: Move blue rectangle (basic descriptor)
- [ ] Test 16.11: Change red circle color (color + type)
- [ ] Test 16.12: Delete triangle (type only)
- [ ] Test 16.13: Multiple users simultaneous manipulation
- [ ] Test 16.14: Command history display
- [ ] Edge cases tested
- [ ] Performance benchmarks met
- [ ] Regression tests passed
- [ ] No console errors

**Date Tested:** _______________  
**Tested By:** _______________  
**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________

