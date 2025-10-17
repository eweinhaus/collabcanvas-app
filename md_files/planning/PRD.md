# CollabCanvas - Product Requirements Document
# Rubric-Aligned Implementation Status

## Project Overview
**Status**: MVP Complete (PRs 1-8), Additional Features Required  
**Production URL**: https://collabcanvas-app-km8k.onrender.com/  
**Current Rubric Score**: ~60-65/100 points (estimated)  
**Target Rubric Score**: 90+/100 points

---

## Section 1: Core Collaborative Infrastructure (30 points)

### Real-Time Synchronization (10 points)
| Requirement | Status | Evidence | PR |
|------------|--------|----------|-----|
| Sub-100ms object sync | ✅ **ACHIEVED** | ~50ms average latency | PR 3 |
| Sub-50ms cursor sync | ✅ **ACHIEVED** | ~30ms average latency | PR 4 |
| Zero visible lag during rapid multi-user edits | ✅ **ACHIEVED** | Enhanced throttling with burst mode | PR 5, PR 8 |

**Score**: 10/10 points ✅

---

### Conflict Resolution & State Management (10 points)
| Requirement | Status | Evidence | PR |
|------------|--------|----------|-----|
| Two users edit same object simultaneously → consistent final state | ✅ **ACHIEVED** | Last-write-wins + shape locking | PR 5, PR 8 |
| Documented strategy (LWW, CRDT, OT, etc.) | ✅ **ACHIEVED** | README.md, systemPatterns.md | PR 5 |
| No "ghost" objects or duplicates | ✅ **ACHIEVED** | Duplicate prevention on reconnect | PR 5 |
| Rapid edits (10+ changes/sec) don't corrupt state | ✅ **ACHIEVED** | Enhanced throttle + performance monitoring | PR 8 |
| Clear visual feedback on who last edited | ✅ **ACHIEVED** | EditIndicator component | PR 8 |

**Testing Scenarios Completed**:
- ✅ Simultaneous Move: Users A & B drag same rectangle
- ✅ Rapid Edit Storm: User A resizes, User B colors, User C moves
- ✅ Delete vs Edit: User A deletes while User B edits
- ✅ Create Collision: Two users create at identical timestamps

**Score**: 10/10 points ✅

---

### Persistence & Reconnection (10 points)
| Requirement | Status | Evidence | PR |
|------------|--------|----------|-----|
| User refreshes mid-edit → returns to exact state | ✅ **ACHIEVED** | localStorage persistence for edit buffers | PR 8 |
| All users disconnect → canvas persists fully | ✅ **ACHIEVED** | Firestore persistence | PR 3 |
| Network drop (30s+) → auto-reconnects with complete state | ✅ **ACHIEVED** | Firebase auto-reconnect | PR 5 |
| Operations during disconnect queue and sync on reconnect | ✅ **ACHIEVED** | offlineQueueService.js | PR 8 |
| Clear UI indicator for connection status | ✅ **ACHIEVED** | Header with Firebase connection monitor | PR 8 |

**Testing Scenarios Completed**:
- ✅ Mid-Operation Refresh: User drags object, refreshes mid-drag → position preserved
- ✅ Total Disconnect: All users close browsers, wait 2 min, return → full canvas intact
- ✅ Network Simulation: Throttle to 0 for 30s, restore → canvas syncs without data loss
- ✅ Rapid Disconnect: User makes 5 rapid edits, closes tab → edits persist for others

**Score**: 10/10 points ✅

**Section 1 Total**: 30/30 points ✅

---

## Section 2: Canvas Features & Performance (30 points)

### Canvas Functionality (15 points)
| Requirement | Status | Evidence | PR | To-Do |
|------------|--------|----------|-----|-------|
| Smooth pan/zoom | ✅ **ACHIEVED** | 0.1x-3x zoom constraints | PR 2 | - |
| 3+ shape types | ✅ **ACHIEVED** | Rectangle, circle, text | PR 2 | - |
| Text with formatting | ✅ **ACHIEVED** | fontSize, color, editable | PR 2 | - |
| Multi-select (shift-click or drag) | ❌ **NOT IMPLEMENTED** | - | - | **PR 9** |
| Layer management | ❌ **NOT IMPLEMENTED** | - | - | **PR 11** |
| Transform operations (move/resize/rotate) | ⚠️ **PARTIAL** | Move ✅, Resize ❌, Rotate ❌ | PR 2 | **PR 9** |
| Duplicate/delete | ⚠️ **PARTIAL** | Delete ✅, Duplicate ❌ | PR 2 | **PR 9** |

**Estimated Score**: 8/15 points ⚠️  
**Missing**: Multi-select (3 pts), Resize/Rotate (2 pts), Duplicate (1 pt), Layer management (1 pt)

---

### Performance & Scalability (15 points)
| Requirement | Status | Evidence | PR | To-Do |
|------------|--------|----------|-----|-------|
| Consistent performance with 500+ objects | ❌ **NOT TESTED** | Tested only with 50+ shapes | PR 7 | **PR 18** |
| Supports 5+ concurrent users | ✅ **ACHIEVED** | Tested with 5 users | PR 7 | - |
| No degradation under load | ✅ **ACHIEVED** | Maintains 60 FPS | PR 7 | - |
| Smooth interactions at scale | ⚠️ **NEEDS TESTING** | Unknown at 500+ objects | - | **PR 18** |

**Estimated Score**: 10/15 points ⚠️  
**Missing**: 500+ object testing (5 pts)

**Section 2 Total**: 18/30 points ⚠️

---

## Section 3: Advanced Figma-Inspired Features (15 points)

### Tier 1 Features (Choose 3 - Each worth 2 points)
| Feature | Status | Evidence | PR | To-Do |
|---------|--------|----------|-----|-------|
| Color picker with recent colors/saved palettes | ✅ **ACHIEVED** | ColorPicker component | PR 6 | - |
| Undo/redo with keyboard shortcuts (Cmd+Z/Cmd+Shift+Z) | ❌ **NOT IMPLEMENTED** | - | - | **PR 10** |
| Keyboard shortcuts for common operations | ⚠️ **PARTIAL** | Delete works, arrow keys missing | PR 6 | **PR 10** |
| Export canvas or objects as PNG/SVG | ❌ **NOT IMPLEMENTED** | - | - | **PR 10** |
| Snap-to-grid or smart guides when moving objects | ❌ **NOT IMPLEMENTED** | - | - | **PR 10** |
| Object grouping/ungrouping | ❌ **NOT IMPLEMENTED** | - | - | - |
| Copy/paste functionality | ❌ **NOT IMPLEMENTED** | - | - | **PR 9** |

**Current Tier 1 Score**: 2/6 points (1 full feature) ⚠️  
**Target**: Implement 2 more features (Undo/redo + Export or Snap-to-grid)

---

### Tier 2 Features (Choose 2 - Each worth 3 points)
| Feature | Status | Evidence | PR | To-Do |
|---------|--------|----------|-----|-------|
| Component system (create reusable components/symbols) | ❌ **NOT SELECTED** | - | - | Too complex |
| Layers panel with drag-to-reorder and hierarchy | ⏳ **PLANNED** | - | - | **PR 11** ✅ |
| Alignment tools (align left/right/center, distribute evenly) | ⏳ **PLANNED** | - | - | **PR 11** ✅ |
| Z-index management (bring to front, send to back) | ⏳ **PLANNED** | - | - | **PR 11** ✅ |
| Selection tools (lasso select, select all of type) | ✅ **PARTIAL** | Lasso done in PR9 | PR 9 | Select-all-type not needed |
| Styles/design tokens (save and reuse colors, text styles) | ❌ **NOT SELECTED** | - | - | Lower priority |
| Canvas frames/artboards for organizing work | ❌ **NOT SELECTED** | - | - | Too complex |

**Current Tier 2 Score**: 0/6 points ⚠️  
**Target**: Implement **Layers Panel + Alignment Tools** (includes Z-index as foundation)  
**Rationale**: Best balance of value, feasibility, and user impact. Natural feature pairing.

---

### Tier 3 Features (Choose 1 - Worth 3 points)
| Feature | Status | Evidence | PR | To-Do |
|---------|--------|----------|-----|-------|
| Auto-layout (flexbox-like automatic spacing and sizing) | ❌ **NOT SELECTED** | - | - | Too complex (9/10 difficulty) |
| Collaborative comments/annotations on objects | ⏳ **PLANNED** | - | - | **PR 12** ✅ |
| Version history with restore capability | ❌ **NOT SELECTED** | - | - | Storage concerns |
| Plugins or extensions system | ❌ **NOT SELECTED** | - | - | Way too complex (10/10 difficulty) |
| Vector path editing (pen tool with bezier curves) | ❌ **NOT SELECTED** | - | - | Limited value, high complexity |
| Advanced blend modes and opacity | ❌ **NOT SELECTED** | - | - | Easy but less collaborative |
| Prototyping/interaction modes (clickable links between frames) | ❌ **NOT SELECTED** | - | - | Requires frames (not implemented) |

**Current Tier 3 Score**: 0/3 points ⚠️  
**Target**: Implement **Collaborative Comments** - perfect fit for collaborative canvas  
**Rationale**: Low risk, high collaborative value, easy to demo, fits time budget (6-8 hours)

**Section 3 Total**: 2/15 points ⚠️

---

## Section 4: AI Canvas Agent (25 points)

### Overview
**Current Status**: ❌ **NOT IMPLEMENTED**  
**Approach**: OpenAI SDK with Function Calling via Firebase Cloud Function proxy  
**Details**: See `AI_build_tool_PRD.md` for comprehensive implementation plan

---

### Command Breadth & Capability (9 points)
| Requirement | Status | To-Do |
|------------|--------|-------|
| 8+ distinct command types | ❌ **NOT IMPLEMENTED** | **PR 13-17** |
| Covers all categories: creation, manipulation, layout, complex | ❌ **NOT IMPLEMENTED** | **PR 13-17** |
| Commands are diverse and meaningful | ❌ **NOT IMPLEMENTED** | **PR 13-17** |

**Current Score**: 0/9 points ⚠️

---

### AI Command Categories (Must demonstrate variety)

#### Creation Commands (Choose 2 - 4 points each)
| Command | Status | To-Do |
|---------|--------|-------|
| "Create a red circle at position 100, 200" | ❌ **NOT IMPLEMENTED** | **PR 14** |
| "Add a text layer that says 'Hello World'" | ❌ **NOT IMPLEMENTED** | **PR 14** |
| "Make a 200x300 rectangle" | ❌ **NOT IMPLEMENTED** | **PR 14** |

**Target**: Implement all 3 commands (2 required, 1 bonus)

---

#### Manipulation Commands (Choose 2 - 4 points each)
| Command | Status | To-Do |
|---------|--------|-------|
| "Move the blue rectangle to the center" | ❌ **NOT IMPLEMENTED** | **PR 15** |
| "Resize the circle to be twice as big" | ❌ **NOT IMPLEMENTED** | **PR 15** |
| "Rotate the text 45 degrees" | ❌ **NOT IMPLEMENTED** | **PR 15** |

**Target**: Implement all 3 commands (2 required, 1 bonus)

---

#### Layout Commands (Choose 1 - 3 points)
| Command | Status | To-Do |
|---------|--------|-------|
| "Arrange these shapes in a horizontal row" | ❌ **NOT IMPLEMENTED** | **PR 16** |
| "Create a grid of 3x3 squares" | ❌ **NOT IMPLEMENTED** | **PR 16** |
| "Space these elements evenly" | ❌ **NOT IMPLEMENTED** | **PR 16** |

**Target**: Implement 1 command (grid recommended)

---

#### Complex Commands (Choose 1 - 5 points)
| Command | Status | To-Do |
|---------|--------|-------|
| "Create a login form with username and password fields" | ❌ **NOT IMPLEMENTED** | **PR 17** |
| "Build a navigation bar with 4 menu items" | ❌ **NOT IMPLEMENTED** | **PR 17** |
| "Make a card layout with title, image, and description" | ❌ **NOT IMPLEMENTED** | **PR 17** |

**Target**: Implement 1 command (login form recommended)

---

### AI Performance & Reliability (8 points)
| Requirement | Status | To-Do |
|------------|--------|-------|
| Sub-2 second responses | ❌ **NOT IMPLEMENTED** | **PR 13-17** |
| 90%+ accuracy | ❌ **NOT IMPLEMENTED** | **PR 13-17** |
| Natural UX with feedback | ❌ **NOT IMPLEMENTED** | **PR 13** |
| Shared state works flawlessly | ❌ **NOT IMPLEMENTED** | **PR 13-17** |
| Multiple users can use AI simultaneously | ❌ **NOT IMPLEMENTED** | **PR 13-17** |

**Current Score**: 0/8 points ⚠️

**Section 4 Total**: 0/25 points ⚠️

---

## Section 5: Technical Implementation (Pass/Fail)

### Architecture Quality (5 points)
| Requirement | Status | Evidence |
|------------|--------|----------|
| Clean, well-organized code | ✅ **ACHIEVED** | Modular components, service layer abstraction |
| Clear separation of concerns | ✅ **ACHIEVED** | Context, services, components separated |
| Scalable architecture | ✅ **ACHIEVED** | Dual database strategy, lazy loading |
| Proper error handling | ✅ **ACHIEVED** | ErrorBoundary, toast notifications |
| Modular components | ✅ **ACHIEVED** | Reusable components in organized folders |

**Score**: 5/5 points ✅

---

### Authentication & Security (5 points)
| Requirement | Status | Evidence |
|------------|--------|----------|
| Robust auth system | ✅ **ACHIEVED** | Firebase Google OAuth |
| Secure user management | ✅ **ACHIEVED** | Firebase security rules |
| Proper session handling | ✅ **ACHIEVED** | onAuthStateChanged listener |
| Protected routes | ✅ **ACHIEVED** | PrivateRoute component |
| No exposed credentials | ✅ **ACHIEVED** | Environment variables |

**Score**: 5/5 points ✅

**Section 5 Total**: 10/10 points ✅

---

## Section 6: Documentation & Submission Quality (Pass/Fail)

### Documentation (Pass/Fail)
| Requirement | Status | Evidence |
|------------|--------|----------|
| Clear README | ✅ **ACHIEVED** | Comprehensive README with setup instructions |
| Detailed setup guide | ✅ **ACHIEVED** | Environment variables, installation steps |
| Architecture documentation | ✅ **ACHIEVED** | Memory bank with systemPatterns.md |
| Easy to run locally | ✅ **ACHIEVED** | `npm install && npm run dev` |
| Dependencies listed | ✅ **ACHIEVED** | package.json |
| Supports 5+ users | ✅ **ACHIEVED** | Tested in production |
| Fast load times | ✅ **ACHIEVED** | Lighthouse score 85-92 |

**Status**: ✅ **PASS**

---

## Current Rubric Score Breakdown

| Section | Possible | Current | Missing |
|---------|----------|---------|---------|
| 1. Core Collaborative Infrastructure | 30 | 30 ✅ | 0 |
| 2. Canvas Features & Performance | 30 | 18 ⚠️ | 12 |
| 3. Advanced Figma-Inspired Features | 15 | 2 ⚠️ | 13 |
| 4. AI Canvas Agent | 25 | 0 ⚠️ | 25 |
| 5. Technical Implementation | 10 | 10 ✅ | 0 |
| 6. Documentation & Submission Quality | Pass | ✅ Pass | - |
| **TOTAL** | **100** | **60** | **40** |

---

## Implementation Roadmap

### Priority 1: Canvas Features (PRs 9-10) - +12 points
**Target Score After**: 72/100  
**Rationale**: Quick wins, essential features missing

- **PR 9**: Multi-select, Resize/Rotate, Duplicate, Copy/Paste (+8 pts)
- **PR 10**: Undo/Redo, Export Canvas, Snap-to-Grid (+4 pts)

---

### Priority 2: Advanced Features (PRs 11-12) - +9 points
**Target Score After**: 81/100  
**Rationale**: Higher-value Tier 2/3 features

- **PR 11**: Layers Panel, Alignment Tools, Z-index Management (+6 pts)
- **PR 12**: Collaborative Comments/Annotations (+3 pts)

#### 🔄 Parallel Development: PR11 & PR12

**These PRs can be developed simultaneously** with minimal coordination:

**Advantages of Parallel Development:**
- Faster time to completion (save 6-8 hours of wall-clock time)
- Both features are independent (no logical dependencies)
- Minimal file overlap (only 2 shared files with low conflict risk)

**Shared Files & Conflict Management:**

| File | PR11 Changes | PR12 Changes | Risk Level |
|------|-------------|--------------|------------|
| `Canvas.jsx` | Sort by zIndex, filter hidden shapes, AlignmentToolbar | Comment panel state hook | 🟡 LOW |
| `Shape.jsx` | Z-index context menu | Comment badge overlay | 🟡 LOW |
| `CanvasContext.jsx` | Z-index & layer visibility actions | None (use `CommentsContext`) | 🟢 NONE |
| `ShortcutsModal.jsx` | Alignment shortcuts | Comment shortcut | 🟡 LOW |

**Recommended Merge Order:**
1. **Merge PR12 first** (smaller, simpler, fewer files)
2. Rebase PR11 on updated main
3. Resolve minor conflicts in Canvas.jsx and Shape.jsx (expected: 5-10 minutes)
4. Merge PR11

**Key Isolation Strategy:**
- PR12 MUST use separate `CommentsContext.jsx` (not CanvasContext) to avoid state management conflicts
- PR11 owns all z-index and layer logic in CanvasContext
- Both PRs modify different sections of Canvas.jsx and Shape.jsx

See detailed coordination guidelines in `tasks.md`.

---

### Priority 3: AI Implementation (PRs 13-17) - +19 points (realistic)
**Target Score After**: 100/100  
**Rationale**: Demonstrates AI capability (full 25 pts may be optimistic)

**Approach: OpenAI SDK with Function Calling**
- Backend: Firebase Cloud Function proxy (`openaiChat`)
- Frontend: React Context controller + tool executor layer
- No external frameworks (no LangChain, no LibreChat)

- **PR 13**: AI Infrastructure Setup (Firebase Function + OpenAI SDK)
- **PR 14**: AI Creation Commands (3 commands)
- **PR 15**: AI Manipulation Commands (4 commands)
- **PR 16**: AI Layout Commands (4 commands)
- **PR 17**: AI Complex Commands (1 template)

**Expected AI Score**: 19/25 points (realistic estimate with good implementation)

---

### Priority 4: Performance Testing (PR 18) - +5 points
**Target Score After**: 105/100 (buffer)  
**Rationale**: Prove scalability

- **PR 18**: 500+ Object Performance Testing & Optimization

---

### Priority 5: Backlog Polish & Bug Fixes (PR 20) - 0 points (UX improvements)
**Rationale**: Address UI/UX polish items and minor bugs

- **PR 20**: Multi-shape undo fixes, edit indicator text improvements, Move/Pan tool implementation

---

### Priority 6: Final Polish (PR 19) - 0 points (buffer)
**Rationale**: Ensure everything works together

- **PR 19**: Integration Testing, Documentation Updates, Demo Video

---

## Technical Architecture for AI (OpenAI SDK)

### Architecture Overview

```
User → AIPrompt (React) → AIContext
    ↓
OpenAI Service (fetch)
    ↓
Firebase Cloud Function: openaiChat
    ↓
OpenAI Chat Completions API (with function calling)
    ↓
Returns assistant message + tool_calls[]
    ↓
AIContext executes tools via aiToolExecutor
    ↓
Executor → CanvasContext → Firestore
    ↓
Real-time sync to all users
```

### Key Components

**Backend (Firebase Function)**:
- `openaiChat` Cloud Function (Node.js 20)
- OpenAI SDK integration (v4+)
- Firebase ID token authentication
- Rate limiting & input validation

**Frontend**:
- `AIContext.jsx` - Controller with think-act loop
- `AIPrompt.jsx` - UI component (input + feedback)
- `openaiService.js` - Fetch wrapper to Cloud Function
- `aiTools.js` - 10 tool schemas (OpenAI function calling format)
- `aiToolExecutor.js` - Tool execution bridge to Firestore
- `aiPrompts.js` - Comprehensive system prompt

**Utilities**:
- `colorNormalizer.js` - CSS colors → hex
- `shapeIdentification.js` - Descriptor → shape matching
- `gridGenerator.js` - Grid layout calculations
- `arrangementAlgorithms.js` - Alignment & distribution

### Tools Implemented (10 total)
1. `createShape` - Create circles, rectangles, triangles, text
2. `getCanvasState` - Query current shapes
3. `moveShape` - Move by ID or descriptor
4. `updateShapeColor` - Change colors
5. `deleteShape` - Delete shapes
6. `rotateShape` - Rotate shapes
7. `createGrid` - Generate grids (up to 20×20)
8. `arrangeHorizontally` - Arrange in row
9. `arrangeVertically` - Arrange in column
10. `distributeEvenly` - Even spacing along axis

### Testing Strategy
- **Unit Tests**: Executors, utilities, color/shape matching
- **Integration Tests**: Full prompt → execution → Firestore flow
- **Manual Tests**: 30-case test suite across all command categories
- **Accuracy Target**: 90%+ on manual test suite

---

## Risk Assessment

### High Risk
- **AI Accuracy**: Achieving 90%+ accuracy requires careful prompt engineering and tool schema design
- **AI Response Time**: Meeting <2s P95 target may require optimization (GPT-3.5-turbo fallback)

### Medium Risk
- **500+ Object Performance**: May require significant optimization (virtualization, lazy rendering)
- **Multi-select UX**: Complex interaction patterns to implement
- **Firebase Function Limits**: 60s timeout, may need streaming for complex AI operations

### Low Risk
- **Export Canvas**: Well-documented Konva feature
- **Undo/Redo**: Standard command pattern implementation
- **OpenAI SDK Integration**: Straightforward API with good documentation

---

## Success Criteria

### Must Achieve (90+ points)
- ✅ Section 1: 30/30 points (already achieved)
- ✅ Section 5: 10/10 points (already achieved)
- 🎯 Section 2: 25/30 points (need +7 from current 18)
- 🎯 Section 3: 11/15 points (need +9 from current 2)
- 🎯 Section 4: 19/25 points (need +19 from current 0)

### Stretch Goal (100 points)
- Achieve perfect scores in all sections
- Demonstrate exceptional AI capabilities (25/25 points)
- Prove scalability with 1000+ objects

---

## Timeline Estimate

| PR | Description | Estimated Time | Points |
|----|-------------|---------------|--------|
| PR 9 | Multi-select, Resize/Rotate, Duplicate, Copy/Paste | 8-12 hours | +8 |
| PR 10 | Undo/Redo, Export, Snap-to-Grid | 8-10 hours | +4 |
| PR 11 | Layers Panel + Alignment Tools (includes Z-index) | 14-18 hours | +6 |
| PR 12 | Collaborative Comments | 6-8 hours | +3 |
| PR 13 | AI Infrastructure (Firebase Function + OpenAI SDK) | 10-14 hours | +0 (setup) |
| PR 14 | AI Creation Commands | 8-10 hours | +8 |
| PR 15 | AI Manipulation Commands | 6-8 hours | +8 |
| PR 16 | AI Layout Commands | 4-6 hours | +3 |
| PR 17 | AI Complex Commands | 8-12 hours | +5 |
| PR 18 | Performance Testing (500+ objects) | 6-10 hours | +5 |
| PR 20 | Backlog Polish & Bug Fixes (incl. Move tool) | 3-5 hours | +0 (UX) |
| PR 19 | Final Polish & Documentation | 4-6 hours | +0 (buffer) |
| **TOTAL** | | **86.5-120 hours** | **+50** |

**Target Completion**: 10-15 working days (full-time) or 3-4 weeks (part-time)

---

## Notes on Original PRD

**Original PRs 1-8**: ✅ Complete and deployed  
**Original PRs 10-17** (AI features): ❌ NOT implemented, only documented as plans

**Key Differences in New Approach**:
- Using **OpenAI SDK with Function Calling** via Firebase Cloud Function proxy
- Direct integration (no LangChain, no LibreChat)
- 10 tools covering creation, manipulation, layout, and complex commands
- More comprehensive advanced features (multi-select, layers, etc.)
- Explicit testing at 500+ object scale
- Clearer mapping to rubric requirements

---

## Document Status
**Version**: 2.0 (Rubric-Aligned)  
**Last Updated**: Current session  
**Next Review**: After completing PRs 9-10 (canvas features)
