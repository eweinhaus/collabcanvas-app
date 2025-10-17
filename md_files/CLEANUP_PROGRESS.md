# Code Cleanup Progress

## Phase 1: Code Quality & AI Slop Cleanup

### 1.1 Console Statement Cleanup

#### ✅ Completed
- [x] Created `src/utils/logger.js` - Environment-aware logging utility
- [x] Updated `src/services/firestoreService.js` - Replaced all 13 console statements
- [x] Updated `src/services/commentService.js` - Replaced all 14 console statements

#### 🔄 In Progress
Files with console statements remaining (by priority):

**HIGH PRIORITY** (Service Layer):
- `src/services/dragBroadcastService.js` - 6 statements
- `src/services/presenceService.js` - 4 statements
- `src/services/realtimeCursorService.js` - 4 statements
- `src/offline/operationQueue.js` - 11 statements

**MEDIUM PRIORITY** (Context Layer):
- `src/context/CanvasContext.jsx` - 36 statements
- `src/context/CommentsContext.jsx` - 9 statements
- `src/context/AIContext.jsx` - 7 statements
- `src/context/AuthContext.jsx` - 3 statements

**LOW PRIORITY** (Components & Utils):
- `src/components/canvas/Toolbar.jsx` - 2 statements
- `src/components/canvas/Canvas.jsx` - 1 statement
- `src/components/canvas/Shape.jsx` - 1 statement
- `src/components/layout/Header.jsx` - 2 statements
- `src/components/common/ErrorBoundary.jsx` - 1 statement
- `src/components/common/ConnectionBanner.jsx` - 1 statement
- `src/utils/exportCanvas.js` - 3 statements
- `src/utils/CommandHistory.js` - 3 statements
- `src/utils/gridGenerator.js` - 1 statement (in comment)
- `src/utils/performanceTest.js` - 20 statements (testing utility - keep as-is)
- `src/hooks/useConnectionStatus.js` - 3 statements

#### Pattern for Replacements
```javascript
// BEFORE
console.error('[serviceName] Error message:', error);
console.log('[serviceName] Debug info:', data);
console.warn('[serviceName] Warning:', issue);

// AFTER - Add import
import { logger } from '../utils/logger';

// Replace
logger.error('serviceName: Error message:', error);
logger.debug('serviceName: Debug info:', data);
logger.warn('serviceName: Warning:', issue);
```

### 1.2 TODO/FIXME Comment Resolution

#### Files with TODO/FIXME/HACK Comments (124 total)

**Need Immediate Action:**
- `src/offline/operationQueue.js` - 11 TODOs
- `src/context/CanvasContext.jsx` - Multiple TODOs
- `src/context/AIContext.jsx` - Multiple TODOs
- `src/utils/templates/*.js` - Template TODOs

**Categories:**
1. **Remove** - Commented out code that should be deleted
2. **Document** - TODOs that explain why something is the way it is (keep with context)
3. **Fix** - Simple issues that can be fixed immediately
4. **Issue** - Complex TODOs that need GitHub issues created

### 1.3 ESLint Disable Statement Audit

#### Files with eslint-disable (60 total)

**Files to audit:**
- `src/services/firestoreService.js` - 5 disables (FIXED - removed no-console disables)
- `src/services/commentService.js` - 4 disables (FIXED - removed no-console disables)
- `src/services/dragBroadcastService.js` - 6 disables
- `src/offline/operationQueue.js` - 5 disables
- `src/utils/throttle.js` - 2 disables
- `src/services/realtimeCursorService.js` - 4 disables
- `src/services/presenceService.js` - 4 disables
- `src/context/CanvasContext.jsx` - 26 disables

**Pattern:**
- If disable is for `no-console` → Fix by using logger
- If disable is for `react-hooks/exhaustive-deps` → Add explanation comment
- If disable is hiding real issues → Fix the underlying issue

---

## Phase 2: Architecture & Code Organization

### 2.1 Context File Size Reduction
- `CanvasContext.jsx` - 1,126 lines → Target: <300 lines
- Strategy: Extract to custom hooks (useCanvasShapes, useCanvasSelection, useCanvasTools, etc.)

### 2.2 Service Layer Consolidation
- Merge `firestoreService.js` + `firestoreServiceWithQueue.js`
- Strategy: Use strategy pattern for online/offline modes

### 2.3 Utility File Organization
- Reorganize 20+ utility files into logical subdirectories
- Proposed structure:
  ```
  src/utils/
  ├── canvas/     # Canvas-specific utilities
  ├── firebase/   # Firebase utilities
  ├── performance/ # Performance utilities
  ├── ai/         # AI-related utilities
  └── commands/   # Command pattern (already good!)
  ```

---

## Phase 3: Code Duplication & Dead Code

### 3.1 Duplicate Code Patterns

#### Auth Check Pattern (Duplicated 15+ times)
Create `src/utils/auth.js`:
```javascript
export function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated');
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
    email: user.email
  };
}
```

#### Error Handling Pattern
Create `src/utils/firebase/errorHandler.js`:
```javascript
export function handleFirebaseError(error, operation) {
  // Centralized Firebase error handling
}
```

### 3.2 Dead Code Audit
- [ ] Check if `src/utils/performanceTest.js` is used in production
- [ ] Check if `src/utils/uuid.js` wrapper is necessary
- [ ] Verify all template files are actively used

---

## Phase 4: Documentation

### JSDoc Documentation
- [ ] Add JSDoc to all public functions
- [ ] Add file headers to all modules
- [ ] Document complex algorithms

---

## Phase 5: Testing

### Test Quality Audit
- [ ] Review 60 test files for quality
- [ ] Remove over-mocked tests
- [ ] Add missing edge case tests

---

## Quick Wins Completed
✅ Created centralized logger utility
✅ Cleaned up firestoreService.js (13 console statements → logger)
✅ Cleaned up commentService.js (14 console statements → logger)
✅ Removed eslint-disable no-console from cleaned files

## Next Steps
1. Complete console statement cleanup for remaining service files
2. Audit and resolve TODO/FIXME comments
3. Extract duplicate auth and error handling patterns
4. Begin CanvasContext refactoring

## Estimated Remaining Time
- Phase 1: 6-8 hours
- Phase 2: 12-15 hours
- Phase 3: 4-6 hours
- Phase 4: 6-8 hours
- Phase 5: 4-6 hours
**Total: 32-43 hours**

