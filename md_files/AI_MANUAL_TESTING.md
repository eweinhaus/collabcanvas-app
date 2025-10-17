# AI Manual Testing Guide - PR 17 Complex Commands

This guide provides the complete test suite for AI canvas commands, including creation, manipulation, grid layouts, and complex commands.

## Test Environment Setup

1. Navigate to: https://collabcanvas-app-km8k.onrender.com/
2. Sign in with Google
3. Open AI panel with Cmd/Ctrl+K or click the Agent button
4. Clear canvas if needed

## Test Results Summary

**Target Accuracy**: 18+/19 cases (94%+)  
**Actual Results**: _To be filled in during testing_

| Category | Test Cases | Passed | Failed | Accuracy |
|----------|-----------|--------|--------|----------|
| Creation | 6 | ___ | ___ | ___% |
| Manipulation | 2 | ___ | ___ | ___% |
| Layout (Grid) | 3 | ___ | ___ | ___% |
| Complex Commands | 7 | ___ | ___ | ___% |
| Edge Cases | 1 | ___ | ___ | ___% |
| **Total** | **19** | **___** | **___** | **___%** |

---

## Test Cases

### ✅ Creation Commands (6 cases)

#### Test 1: Create circle with color and position
**Command**: `Create a blue circle at 300, 400`

**Expected**:
- Blue circle appears at (300, 400)
- Radius: ~50px (default)
- Color: Blue (#0000FF or similar)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 2: Create text shape
**Command**: `Add a text that says 'Test'`

**Expected**:
- Text shape with content "Test"
- Positioned in center of viewport
- Color: Default blue
- Font size: ~16px

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 3: Create rectangle with dimensions
**Command**: `Make a 200x150 red rectangle`

**Expected**:
- Red rectangle with width 200px, height 150px
- Positioned in center of viewport
- Color: Red (#FF0000 or similar)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 4: Create triangle with color
**Command**: `Create a green triangle`

**Expected**:
- Green triangle appears
- Default size (100x100)
- Positioned in center of viewport
- Color: Green (#00FF00 or similar)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 5: Create square at position
**Command**: `Add a purple square at 100, 100`

**Expected**:
- Purple rectangle with equal sides (100x100)
- Positioned at (100, 100)
- Color: Purple (#800080 or similar)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 6: Create shape with defaults
**Command**: `Create blue circle`

**Expected**:
- Blue circle in center of viewport
- Default radius (~50px)
- No explicit positioning needed

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

### ⚠️ Manipulation Commands (2 cases)

**Prerequisites**: Create a blue rectangle and a blue rectangle (for ambiguity test)

#### Test 7: Move shape by descriptor
**Command**: `Move the blue rectangle to 600, 200`

**Expected**:
- Blue rectangle moves to position (600, 200)
- If multiple blue rectangles exist, most recent one moves
- Other shapes unaffected

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 8: Rotate shape
**Command**: `Rotate the blue rectangle 45 degrees`

**Expected**:
- Blue rectangle rotates to 45 degrees
- Position remains unchanged
- If multiple exist, most recent rotates

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

### ✅ Grid Layout Commands (3 cases)

#### Test 9: Basic grid
**Command**: `Create a 3x3 grid of red squares`

**Expected**:
- 9 red squares in 3x3 grid
- Positioned at default location (200, 200)
- Default spacing (~120px)
- All squares equal size

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 10: Grid with custom position
**Command**: `Create a 2x5 grid of blue circles at 400, 300`

**Expected**:
- 10 blue circles in 2 rows, 5 columns
- Top-left starts at (400, 300)
- Default spacing (~120px)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 11: Grid with custom spacing
**Command**: `Create grid with 150px spacing`

**Prerequisites**: Specify shape type and dimensions first

**Expected**:
- Grid created with 150px spacing between shape centers
- All other properties as specified or defaulted

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

### ✅ Complex Commands (7 cases) - NEW PR 17

#### Test 12: Login form
**Command**: `Create a login form at 300, 200`

**Expected**:
- Username label (text, dark)
- Username input field (white rectangle with gray border, 300x40)
- Password label (text, dark)
- Password input field (white rectangle with gray border, 300x40)
- Submit button (colored rectangle, ~120x40)
- Submit button label (white text)
- All vertically aligned with ~25-30px spacing
- Positioned starting at (300, 200)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 13: Signup form
**Command**: `Build a signup form with email and password`

**Expected**:
- Email label + input field
- Password label + input field
- Optional: Confirm password label + input
- Submit button with label
- Vertical stacking with proper spacing
- Professional styling (white inputs, gray borders)

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 14: Contact form
**Command**: `Create a contact form with name, email, message fields`

**Expected**:
- Name label + input field
- Email label + input field
- Message label + larger input field (for message)
- Submit button
- Vertical layout with ~25-30px spacing
- All fields properly sized and styled

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 15: Navigation bar
**Command**: `Make a nav bar with Home, About, Services, Contact`

**Expected**:
- 4 text elements or buttons
- Horizontally aligned
- ~40-60px spacing between items
- All at same Y position
- Text content: "Home", "About", "Services", "Contact"

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 16: Dashboard with buttons
**Command**: `Create a dashboard with title and 3 buttons`

**Expected**:
- Title text at top
- 3 buttons below (can be vertical or horizontal)
- Professional styling
- Clear layout structure

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 17: Pricing table
**Command**: `Build a pricing table with 3 tiers`

**Expected**:
- 3 columns representing pricing tiers
- Each tier may have:
  - Title/header
  - Price
  - Features/description
  - Action button
- Horizontal or vertical layout depending on AI interpretation
- Clear structure and alignment

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

#### Test 18: Novel command (not in examples)
**Command**: `Create a profile card`

**Expected**:
- AI should decompose "profile card" into reasonable elements
- Possible elements: name, bio, avatar placeholder, buttons
- Layout should make sense (vertical or mixed)
- All shapes properly positioned and styled

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

### ⚠️ Edge Cases (1 case)

**Prerequisites**: Create multiple rectangles of different colors

#### Test 19: Ambiguous descriptor
**Command**: `Move the rectangle`

**Expected**:
- Most recently created rectangle moves
- AI may ask for clarification OR use recency bias
- No error thrown

**Result**: [ ] Pass [ ] Fail  
**Notes**:

---

## Performance Testing

For each successful test, note approximate response times:

| Test # | Latency (seconds) | Within Target? |
|--------|-------------------|----------------|
| 1 | ___ | [ ] <2s |
| 2 | ___ | [ ] <2s |
| 3 | ___ | [ ] <2s |
| 4 | ___ | [ ] <2s |
| 5 | ___ | [ ] <2s |
| 6 | ___ | [ ] <2s |
| 7 | ___ | [ ] <2s |
| 8 | ___ | [ ] <2s |
| 9 | ___ | [ ] <5s |
| 10 | ___ | [ ] <5s |
| 11 | ___ | [ ] <5s |
| 12 | ___ | [ ] <5s |
| 13 | ___ | [ ] <5s |
| 14 | ___ | [ ] <5s |
| 15 | ___ | [ ] <5s |
| 16 | ___ | [ ] <5s |
| 17 | ___ | [ ] <5s |
| 18 | ___ | [ ] <5s |
| 19 | ___ | [ ] <2s |

**Target Latencies**:
- Simple commands (creation, manipulation): <2s P95
- Complex commands (grids, layouts): <5s P95

---

## Multi-User Testing

Test with 2+ users on the same board:

1. **Scenario**: User A creates login form, User B sees it
   - [ ] Pass [ ] Fail
   - Sync latency: ___ ms (target <100ms)

2. **Scenario**: Both users use AI simultaneously
   - [ ] Pass [ ] Fail
   - No conflicts or errors

3. **Scenario**: User A creates nav bar, User B manipulates it
   - [ ] Pass [ ] Fail
   - Both see changes in real-time

**Notes**:

---

## Error Handling

Test invalid or edge case commands:

1. **Invalid color**: `Create a flurple rectangle`
   - Expected: Error message or fallback to default
   - Result: [ ] Pass [ ] Fail

2. **Invalid shape type**: `Create a pentagon`
   - Expected: Error message explaining supported types
   - Result: [ ] Pass [ ] Fail

3. **Out of bounds**: `Create a circle at -1000, -1000`
   - Expected: Shape created (coordinates may be clamped)
   - Result: [ ] Pass [ ] Fail

4. **Grid too large**: `Create a 30x30 grid`
   - Expected: Error - maximum 20x20 or 100 shapes total
   - Result: [ ] Pass [ ] Fail

---

## Final Assessment

**Overall Pass Rate**: ___/19 (___%)

**Key Findings**:
- Strengths:
- Weaknesses:
- Recommendations:

**Next Steps**:
- [ ] Update tasks.md with results
- [ ] Document any bugs found
- [ ] Create tickets for improvements

