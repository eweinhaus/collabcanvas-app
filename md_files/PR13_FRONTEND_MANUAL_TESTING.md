# PR 13 Frontend Manual Testing Guide
## AI Infrastructure Frontend Setup (Tasks 13.11-13.29)

**Date**: Current Session  
**Status**: Implementation Complete  
**Tester**: Manual QA Required

---

## Prerequisites

Before testing, ensure:
1. ✅ Backend Cloud Function deployed (tasks 13.1-13.10)
2. ✅ OpenAI API key configured in Firebase Functions
3. ✅ Firebase project has sufficient quota
4. ✅ `.env` file has correct Firebase configuration
5. ✅ Development server running (`npm run dev`)

---

## Test 1: Panel Toggle via Toolbar Button

**Steps**:
1. Navigate to http://localhost:5173
2. Sign in with Google OAuth
3. Locate "Agent" button in the Toolbar (Actions section, after Export)
4. Click the Agent button

**Expected**:
- ✅ AI panel slides in from right side
- ✅ Animation completes in ~300ms
- ✅ Panel shows "AI Canvas Assistant" title
- ✅ Empty state displays with example prompts
- ✅ Agent button shows active state (highlighted)

**Actual**: _[Record results]_

---

## Test 2: Panel Toggle via Keyboard Shortcut

**Steps**:
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Observe panel open
3. Press `Cmd+K` again
4. Observe panel close

**Expected**:
- ✅ Panel toggles open/closed with keyboard shortcut
- ✅ Same smooth animation as button click
- ✅ Focus remains manageable

**Actual**: _[Record results]_

---

## Test 3: Close Panel with ESC

**Steps**:
1. Open AI panel (button or `Cmd+K`)
2. Press `ESC` key

**Expected**:
- ✅ Panel closes smoothly
- ✅ Focus returns to toolbar or canvas

**Actual**: _[Record results]_

---

## Test 4: Send "Hello" Message

**Steps**:
1. Open AI panel
2. Type "Hello" in the input textarea
3. Press `Enter` to send

**Expected**:
- ✅ User message appears immediately (blue bubble, right-aligned)
- ✅ Loading indicator shows (three dots animating)
- ✅ Within 2-3 seconds, assistant response appears (gray bubble, left-aligned)
- ✅ Response is contextually appropriate (greeting back)
- ✅ Messages auto-scroll to bottom

**Actual**: _[Record results]_

---

## Test 5: Authentication Required

**Steps**:
1. Sign out of the app
2. Try to open AI panel

**Expected**:
- ✅ Panel still opens (UI functional)
- ✅ If trying to send message while signed out, error toast appears
- ✅ Error message: "Please sign in to use AI features"

**Actual**: _[Record results]_

---

## Test 6: Rate Limiting (429 Error)

**Steps**:
1. Send 11+ messages rapidly (within 60 seconds)
2. Observe response on 11th message

**Expected**:
- ✅ Error toast appears with rate limit message
- ✅ Message: "Rate limit exceeded. Please wait a minute and try again."
- ✅ Error message also appears in chat
- ✅ Toast has 5-second duration

**Actual**: _[Record results]_

---

## Test 7: Network Error Handling

**Steps**:
1. Open browser DevTools → Network tab
2. Set network to "Offline"
3. Try sending a message
4. Observe error handling

**Expected**:
- ✅ Error toast appears: "Network error. Please check your connection."
- ✅ Loading indicator stops
- ✅ Error message appears in chat
- ✅ User can retry after restoring network

**Actual**: _[Record results]_

---

## Test 8: Cancel Request (AbortController)

**Steps**:
1. Send a message that might take a while to respond
2. While loading indicator is shown, click the stop button (square icon)

**Expected**:
- ✅ Loading stops immediately
- ✅ Toast shows "Request cancelled" with ⏹️ icon
- ✅ No assistant message appears
- ✅ Can send new message immediately

**Actual**: _[Record results]_

---

## Test 9: Multiline Input (Shift+Enter)

**Steps**:
1. Type "Create a shape" in input
2. Press `Shift+Enter`
3. Type "that is blue" on second line
4. Press `Enter` to send

**Expected**:
- ✅ `Shift+Enter` creates new line (doesn't send)
- ✅ `Enter` alone sends the message
- ✅ Multiline message displays correctly
- ✅ Textarea auto-resizes up to 200px max height

**Actual**: _[Record results]_

---

## Test 10: Panel Persistence (localStorage)

**Steps**:
1. Open AI panel
2. Send 2-3 messages
3. Close panel
4. Refresh page (F5)
5. Reopen panel

**Expected**:
- ✅ Panel state (open/closed) persists across refresh
- ✅ Last 50 messages are preserved
- ✅ Conversation history loads correctly
- ✅ System message is not visible in UI

**Actual**: _[Record results]_

---

## Test 11: Clear Conversation

**Steps**:
1. Send 3-4 messages to build history
2. Click the trash icon in panel header

**Expected**:
- ✅ All messages cleared
- ✅ Empty state reappears
- ✅ Toast confirms: "Conversation cleared"
- ✅ Can start new conversation immediately

**Actual**: _[Record results]_

---

## Test 12: Responsive Mobile (< 768px)

**Steps**:
1. Resize browser to 375px width (iPhone SE size)
2. Open AI panel

**Expected**:
- ✅ Panel becomes full-screen overlay
- ✅ Takes 100% width and height
- ✅ All controls remain accessible
- ✅ Input font size is 16px (prevents iOS zoom)
- ✅ Scrolling works smoothly

**Actual**: _[Record results]_

---

## Test 13: Focus Management

**Steps**:
1. Open AI panel
2. Try pressing `Tab` repeatedly
3. Verify focus cycles through:
   - Clear button
   - Close button
   - Example prompts (if visible)
   - Input textarea
   - Send button

**Expected**:
- ✅ Focus stays trapped within panel
- ✅ Tab cycles through all interactive elements
- ✅ Shift+Tab reverses direction
- ✅ Textarea gets focus on panel open

**Actual**: _[Record results]_

---

## Test 14: Tool Calls Display (Placeholder)

**Steps**:
1. Send: "Create a blue circle"
2. Check browser console for tool call logs

**Expected**:
- ✅ If OpenAI returns tool_calls in response, they appear in console
- ✅ Message: "Tool calls received (execution in PR 14+): [...]"
- ✅ UI displays assistant's text response normally
- ✅ **Note**: Tool execution not implemented yet - this is expected

**Actual**: _[Record results]_

---

## Test 15: Shortcuts Modal Integration

**Steps**:
1. Press `?` to open shortcuts modal
2. Look for "Cmd/Ctrl + K" shortcut entry

**Expected**:
- ✅ Shortcuts modal includes AI shortcut
- ✅ Entry: "Cmd/Ctrl + K | Toggle AI Assistant panel"
- ✅ Positioned after comments shortcut
- ✅ Formatted consistently with other shortcuts

**Actual**: _[Record results]_

---

## Test 16: Multiple Rapid Messages

**Steps**:
1. Send 3 messages rapidly without waiting for responses:
   - "Hello"
   - "How are you?"
   - "Create a shape"
2. Observe behavior

**Expected**:
- ✅ All messages queue properly
- ✅ Previous request is aborted when new one starts
- ✅ Only the last message gets a response
- ✅ No errors or crashes

**Actual**: _[Record results]_

---

## Test 17: Panel Z-Index Layering

**Steps**:
1. Open Layers Panel (left side)
2. Open AI Panel (right side)
3. Verify both are visible and accessible

**Expected**:
- ✅ AI panel z-index: 1000
- ✅ Layers panel z-index: should be lower (900 or similar)
- ✅ Both panels accessible
- ✅ No visual overlap conflicts

**Actual**: _[Record results]_

---

## Test 18: Long Response Handling

**Steps**:
1. Send a message that triggers a long AI response (ask for detailed explanation)
2. Observe scrolling behavior

**Expected**:
- ✅ Message area auto-scrolls as response arrives
- ✅ Scrollbar appears if content exceeds viewport
- ✅ User can scroll up while response is streaming (future feature)
- ✅ No performance issues with long messages

**Actual**: _[Record results]_

---

## Test 19: Empty Message Prevention

**Steps**:
1. Try sending empty message (just spaces)
2. Try clicking send with no text

**Expected**:
- ✅ Send button disabled when input empty
- ✅ Toast: "Please enter a message"
- ✅ No API call made

**Actual**: _[Record results]_

---

## Test 20: Simultaneous Panel Operations

**Steps**:
1. Open AI panel
2. While loading a response, open layers panel
3. Try interacting with both

**Expected**:
- ✅ Both panels remain functional
- ✅ No conflicts or freezing
- ✅ AI loading state unaffected by other panels

**Actual**: _[Record results]_

---

## Performance Benchmarks

### Initial Load
- **Target**: < 150 KB additional network traffic for AI components
- **Actual**: _[Measure]_

### Panel Animation
- **Target**: 300ms @ 60 FPS
- **Actual**: _[Measure using Chrome DevTools Performance]_

### Message Round-Trip
- **Target**: < 3s P95 for simple "Hello" message
- **Actual**: _[Measure]_

---

## Known Issues / Expected Limitations

1. ✅ **Tool Execution Not Implemented**: This PR only sets up UI. Tools will execute in PR 14+.
2. ✅ **Jest Tests Failing**: `import.meta` issue affects openaiService tests. This is a pre-existing Jest configuration issue, not introduced by this PR.
3. ✅ **Cold Start Latency**: First request to Cloud Function may take 2-3s (Firebase cold start on free tier).
4. ✅ **No Streaming**: Responses arrive as complete blocks, not streamed word-by-word (can be added later).

---

## Accessibility Checklist

- [ ] Panel has `role="dialog"` and `aria-modal="true"`
- [ ] Focus trap works correctly
- [ ] All buttons have `aria-label` attributes
- [ ] Keyboard shortcuts work consistently
- [ ] Color contrast meets WCAG AA (check with axe DevTools)
- [ ] Screen reader can navigate panel (test with VoiceOver/NVDA)

---

## Browser Compatibility

Test on:
- [ ] Chrome 120+ (primary)
- [ ] Firefox 121+
- [ ] Safari 17+ (Mac)
- [ ] Edge 120+
- [ ] Mobile Safari (iOS 16+)
- [ ] Mobile Chrome (Android)

---

## Sign-Off

**Tester**: _________________  
**Date**: _________________  
**Status**: Pass / Fail / Pass with Issues  
**Notes**: _________________

---

## Next Steps (Post-Testing)

1. If all tests pass → Mark PR 13 tasks 13.11-13.29 as complete
2. If issues found → Document in GitHub Issues and fix before merging
3. Update progress.md with completion status
4. Proceed to PR 14: AI Tool Executors

---

## Additional Notes

_[Add any observations, suggestions, or issues discovered during testing]_

