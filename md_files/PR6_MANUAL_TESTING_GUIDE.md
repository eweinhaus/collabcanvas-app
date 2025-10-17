# PR 6: UI/UX Enhancements - Manual Testing Guide

## Overview
This guide covers manual testing for all UI/UX enhancements implemented in PR 6.

---

## Prerequisites
1. Start the development server: `npm start`
2. Open the application in your browser
3. Have at least 2 browser windows/tabs ready for multi-user testing
4. Test in multiple browsers: Chrome, Firefox, Safari, and Edge (if available)

---

## Test 1: Header Component (Task 9.1)

### Desktop Testing (>1024px)
1. **Verify Header Renders**
   - ✅ Logo appears in the top-left
   - ✅ "CollabCanvas" title is visible next to logo
   - ✅ User avatar and name appear in top-right when logged in
   - ✅ Login button appears when logged out
   - ✅ Header is fixed at the top (scroll page if needed)

2. **Test Hamburger Menu**
   - ✅ Hamburger menu button should NOT be visible on desktop

3. **Test User Info**
   - ✅ Log in with Google
   - ✅ User display name or email shows in header
   - ✅ User avatar renders correctly

### Tablet Testing (768px)
1. **Resize browser to 768px width**
   - ✅ Hamburger menu button becomes visible
   - ✅ User name text hides (only avatar visible)
   - ✅ Logo and title remain visible
   - ✅ Click hamburger button - sidebar should slide in from right

### Mobile Testing (480px)
1. **Resize to 480px or use mobile emulation**
   - ✅ All header elements fit without overflow
   - ✅ Logo is smaller (24px)
   - ✅ Title font size reduced (16px)
   - ✅ User name is hidden
   - ✅ Hamburger menu works

**Potential Issues to Watch:**
- Logo not loading → Check `/public/logo.svg` exists
- Header overlapping canvas → Verify margin-top: 60px on main content
- Hamburger not toggling → Check click handler in App.jsx

---

## Test 2: Sidebar with Presence (Task 9.2)

### Desktop Testing
1. **Verify Sidebar**
   - ✅ Sidebar appears on right side of screen
   - ✅ "Online" section visible with user count
   - ✅ Current user appears in presence list
   - ✅ Sidebar width is 280px
   - ✅ Sidebar does NOT overlap canvas area

2. **Multi-User Testing**
   - ✅ Open 2nd browser/incognito window
   - ✅ Log in with different Google account
   - ✅ Both users appear in both browser windows
   - ✅ User count updates in real-time
   - ✅ Each user has avatar and name displayed

### Mobile Testing (768px and below)
1. **Verify Mobile Behavior**
   - ✅ Sidebar is hidden by default (translateX 100%)
   - ✅ Click hamburger menu → sidebar slides in
   - ✅ Sidebar overlays canvas (position: fixed)
   - ✅ Sidebar appears from right edge
   - ✅ Presence list displays correctly in sidebar

2. **Toggling**
   - ✅ Click hamburger again → sidebar slides out
   - ✅ Click outside sidebar (on canvas) → sidebar closes (if implemented)

**Potential Issues to Watch:**
- Sidebar blocking canvas interactions → Check z-index and pointer-events
- Presence list not updating → Verify Firebase RTDB connection
- translateX animation jerky → Check CSS transitions

---

## Test 3: Toolbar UX Polish (Task 9.3)

### Icon and Accessibility Testing
1. **Verify SVG Icons**
   - ✅ Select tool shows cursor icon
   - ✅ Rectangle tool shows rectangle icon
   - ✅ Circle tool shows circle icon
   - ✅ Text tool shows text icon
   - ✅ Icons are properly sized (24x24px)

2. **Active State**
   - ✅ Click each tool button
   - ✅ Active tool has teal background (#4ECDC4)
   - ✅ Icon inverts to white on active tool
   - ✅ Active tool has bold font weight

3. **Hover and Focus**
   - ✅ Hover over each button → background changes
   - ✅ Button lifts slightly on hover (transform translateY(-1px))
   - ✅ Tab through buttons with keyboard
   - ✅ Focused button has visible outline (2px solid #4ECDC4)

4. **Accessibility**
   - ✅ Each button has `aria-label`
   - ✅ Active button has `aria-pressed="true"`
   - ✅ Toolbar has `role="toolbar"`
   - ✅ Hint text updates based on selected tool

### Responsive Testing
1. **Mobile (768px and below)**
   - ✅ Toolbar positioned at top: 70px, left: 10px
   - ✅ Buttons remain tappable (min-height 40px)
   - ✅ Icons and labels are readable

**Potential Issues to Watch:**
- Icons not loading → Check `/public/icons/*.svg` files exist
- Filter invert not working on active → Browser CSS support
- Toolbar overlapping header → Check z-index values

---

## Test 4: Loading Spinner (Task 9.4)

### Initial Load Testing
1. **Test Spinner Visibility**
   - ✅ Refresh page
   - ✅ Spinner appears centered while loading
   - ✅ "Loading canvas..." message displays
   - ✅ Spinner animates smoothly (rotating circle)
   - ✅ Spinner disappears once canvas loads

2. **Auth Loading**
   - ✅ Log out
   - ✅ Spinner shows briefly during auth check
   - ✅ Canvas appears after auth completes

### Slow Connection Testing
1. **Throttle Network**
   - ✅ Open DevTools → Network tab → Throttle to "Slow 3G"
   - ✅ Refresh page
   - ✅ Spinner visible for longer duration
   - ✅ No flicker or multiple spinners

**Potential Issues to Watch:**
- Spinner flash on fast loads → Add minimum display time if needed
- Multiple spinners → Check conditional rendering logic
- Spinner not centered → Verify flexbox centering

---

## Test 5: Error States & Toast Notifications (Task 9.5)

### Error Boundary Testing
1. **Trigger Error** (Manual test - requires code modification)
   - Temporarily add `throw new Error('Test');` in a component
   - ✅ Error boundary catches error
   - ✅ Fallback UI displays
   - ✅ "Something went wrong" message appears
   - ✅ Error details expandable
   - ✅ "Try again" and "Reload page" buttons work

### Toast Notification Testing
1. **Firestore Error**
   - ✅ Turn off WiFi
   - ✅ Try to create a shape
   - ✅ Toast appears: "Failed to create shape. Please try again."
   - ✅ Toast auto-dismisses after 5 seconds
   - ✅ Toast has red icon for error

2. **Presence Error**
   - ✅ Disconnect/reconnect WiFi
   - ✅ Check for presence-related toasts
   - ✅ Toast position: top-right

3. **Toast Styling**
   - ✅ Dark background (#363636)
   - ✅ White text
   - ✅ Icon visible
   - ✅ Readable contrast

**Potential Issues to Watch:**
- Toast not appearing → Check react-hot-toast installation
- Error boundary not catching → Verify ErrorBoundary wraps app correctly
- Too many toasts → Implement toast queuing/deduplication

---

## Test 6: Responsive Design (Task 9.6)

### Breakpoint Testing
Test at these exact widths:
1. **1440px (Desktop XL)**
   - ✅ All elements fit comfortably
   - ✅ Canvas uses full available space
   - ✅ Sidebar fixed at 280px

2. **1024px (Desktop)**
   - ✅ Layout remains intact
   - ✅ No horizontal scrolling

3. **768px (Tablet)**
   - ✅ Hamburger menu appears
   - ✅ Sidebar becomes overlay
   - ✅ Toolbar adjusts size
   - ✅ Touch interactions work (if testing on device)

4. **480px (Mobile)**
   - ✅ All UI elements scaled down
   - ✅ Canvas still usable
   - ✅ Buttons have min 40px tap targets
   - ✅ No text cutoff

### Canvas Responsiveness
1. **Resize Window**
   - ✅ Canvas adjusts to window size
   - ✅ Min-height: calc(100vh - 60px) maintained
   - ✅ Shapes remain in place (no position drift)
   - ✅ Zoom and pan still work

**Potential Issues to Watch:**
- Horizontal scroll bars → Check overflow settings
- Canvas not filling space → Verify flex: 1
- Touch gestures not working → May need touch event handlers

---

## Test 7: Keyboard Shortcuts Modal (Task 9.7)

### Modal Triggering
1. **Open Modal**
   - ✅ Press `?` key → modal opens
   - ✅ Press `Cmd+/` (Mac) or `Ctrl+/` (Windows) → modal opens
   - ✅ Modal appears centered on screen

2. **Modal Content**
   - ✅ "Keyboard Shortcuts" title visible
   - ✅ All shortcuts listed:
     - Esc: Switch to select mode
     - Delete/Backspace: Delete selected shape
     - Double-click: Edit text shape
     - Click + Drag: Pan canvas
     - Scroll: Zoom in/out
     - ?: Show this help

3. **Closing Modal**
   - ✅ Click X button → closes
   - ✅ Press Escape → closes
   - ✅ Click outside modal (on overlay) → closes
   - ✅ Click inside modal → does NOT close

4. **Focus Trap**
   - ✅ Tab through modal elements
   - ✅ Focus cycles within modal (doesn't go to background)
   - ✅ First focusable element gets focus on open

**Potential Issues to Watch:**
- Modal not opening → Check keyboard event listener in Canvas.jsx
- Focus escaping modal → Verify focus trap logic
- Background still scrollable → Check portal and overlay styles

---

## Test 8: Color Picker (Task 9.8)

### Opening Color Picker
1. **For Non-Text Shapes**
   - ✅ Create a rectangle
   - ✅ Double-click rectangle → color picker opens
   - ✅ Color picker positioned near cursor
   - ✅ Create a circle
   - ✅ Double-click circle → color picker opens

2. **Text Shapes**
   - ✅ Create a text shape
   - ✅ Double-click text → text editor opens (NOT color picker)
   - ✅ Verify color picker does NOT open for text

### Color Selection
1. **Change Color**
   - ✅ Color picker shows 20 color swatches (5×4 grid)
   - ✅ Hover over swatch → border appears, scales up
   - ✅ Click a color → shape color changes immediately
   - ✅ Color picker closes after selection

2. **Multi-User Sync**
   - ✅ Open 2nd browser window
   - ✅ Change shape color in window 1
   - ✅ Color updates in window 2 in real-time

3. **Closing Picker**
   - ✅ Click X button → closes
   - ✅ Press Escape → closes
   - ✅ Click outside picker → closes
   - ✅ Click inside picker (not on swatch) → does NOT close

### Accessibility
1. **Keyboard Navigation**
   - ✅ Tab through swatches
   - ✅ Focused swatch has visible outline
   - ✅ Enter/Space selects color (if implemented)

2. **ARIA Attributes**
   - ✅ Color picker has `role="dialog"`
   - ✅ Each swatch has `aria-label` with color value
   - ✅ Close button has `aria-label`

**Potential Issues to Watch:**
- Picker opening off-screen → Adjust positioning logic
- Color not syncing → Check firestoreService.updateShape
- Picker clicking through to canvas → Check z-index and portal

---

## Test 9: Accessibility (Task 9.10)

### Keyboard Navigation
1. **Tab Order**
   - ✅ Tab from Header → Toolbar → Sidebar → Canvas modals
   - ✅ Order makes logical sense
   - ✅ No keyboard traps (except intentional modal traps)

2. **Focus Indicators**
   - ✅ All interactive elements show focus outline
   - ✅ Outline color contrasts with background
   - ✅ Focus visible on toolbar buttons
   - ✅ Focus visible on sidebar elements

### Screen Reader Testing (if available)
1. **ARIA Labels**
   - ✅ Header has `role="banner"`
   - ✅ Sidebar has `role="complementary"`
   - ✅ Toolbar has `role="toolbar"`
   - ✅ Presence list has `aria-label="Online users"`
   - ✅ User count has descriptive label

2. **Dynamic Updates**
   - ✅ Presence count updates announced
   - ✅ Toolbar hint has `aria-live="polite"`
   - ✅ Loading spinner has `role="status"`

### Color Contrast
1. **Use DevTools**
   - Open Chrome DevTools → More Tools → Rendering → Emulate vision deficiencies
   - ✅ Test with "Protanopia" (red-blind)
   - ✅ Test with "Deuteranopia" (green-blind)
   - ✅ Test with "Tritanopia" (blue-blind)
   - ✅ All interactive elements remain distinguishable

2. **Lighthouse Audit**
   - ✅ Run Lighthouse (DevTools → Lighthouse)
   - ✅ Accessibility score ≥90
   - ✅ No contrast issues flagged

**Potential Issues to Watch:**
- Missing ARIA labels → Add to components
- Poor contrast → Adjust colors to meet WCAG AA standard
- Keyboard trap → Fix focus management

---

## Cross-Browser Testing

### Test in Each Browser:
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest, Mac only)
- [ ] **Edge** (latest)

### What to Verify:
1. ✅ All components render correctly
2. ✅ CSS animations work smoothly
3. ✅ SVG icons display
4. ✅ Modals/portals work
5. ✅ Toast notifications appear
6. ✅ Focus states visible
7. ✅ Responsive breakpoints trigger correctly

---

## Performance Testing

### 60 FPS Canvas
1. **FPS Counter** (Chrome DevTools)
   - ✅ Open DevTools → More Tools → Rendering → Frame Rendering Stats
   - ✅ Create 10-20 shapes
   - ✅ Pan and zoom canvas
   - ✅ FPS stays ≥55 (close to 60)

### Load Time
1. **Lighthouse Performance**
   - ✅ Run Lighthouse audit
   - ✅ First Contentful Paint < 2s
   - ✅ Time to Interactive < 5s
   - ✅ Performance score ≥80

**Potential Issues to Watch:**
- FPS drops → Optimize rendering or reduce console.logs
- Slow load → Check bundle size, lazy-load components

---

## Final Checklist

### All Features Working?
- [ ] Header renders with logo, title, user info
- [ ] Sidebar toggles on mobile, shows presence
- [ ] Toolbar has icons, tooltips, focus states
- [ ] Loading spinner appears on initial load
- [ ] Error boundary catches errors
- [ ] Toast notifications appear on failures
- [ ] Responsive design works at all breakpoints
- [ ] Shortcuts modal opens with `?` key
- [ ] Color picker opens on double-click (non-text shapes)
- [ ] Keyboard navigation works throughout

### No Regressions?
- [ ] Canvas pan/zoom still works
- [ ] Shapes create/update/delete as before
- [ ] Text editing still works
- [ ] Remote cursors visible
- [ ] Multi-user sync works
- [ ] All existing tests pass (`npm test`)

### Documentation
- [ ] README updated with new features (if needed)
- [ ] Screenshots/GIFs captured for PR
- [ ] Known issues documented

---

## Reporting Issues

If you find any issues during testing:
1. Note the exact steps to reproduce
2. Include browser and OS version
3. Take screenshots if visual issue
4. Check browser console for errors
5. Document in GitHub issue or PR comment

---

## Success Criteria

✅ **Ready for Production:**
- All manual tests pass
- No blocking bugs
- Accessibility score ≥90
- Performance score ≥80
- Cross-browser compatible
- Responsive on mobile/tablet/desktop
- All automated tests pass

**Great work! PR 6 is complete.** 🎉

