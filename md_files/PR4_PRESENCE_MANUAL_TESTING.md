# PR 4: Presence Manual Testing Guide

## Overview
PR 4 adds real-time presence awareness to CollabCanvas. This guide covers manual testing for:
- **Tasks 7.1-7.9**: Presence service, PresenceList component, UserAvatar component

## Prerequisites
✅ All unit tests passing (run `npm test`)
✅ Firebase Realtime Database configured
✅ Multiple browsers or incognito windows available

---

## Test Setup

### 1. Start the Development Server
```bash
cd collabcanvas-app
npm start
```

### 2. Prepare Multiple Browser Windows
- **Option A**: Open 3-5 different browsers (Chrome, Firefox, Safari, Edge)
- **Option B**: Use 3-5 Chrome incognito windows
- **Option C**: Mix of regular + incognito windows

**Important**: Each window should be visible side-by-side to observe real-time updates

---

## Manual Test Cases

### Test 7.1-7.2: Presence Service Updates on Auth and Session Join

**Objective**: Verify presence is set when users sign in and join the canvas

**Steps**:
1. Open Browser 1, navigate to `http://localhost:5173`
2. Click "Sign in with Google" and authenticate
3. Wait for canvas to load
4. **Expected**: 
   - Right sidebar shows "Online" section
   - Counter shows "0" (only other users, not yourself)
   
5. Open Browser 2, sign in with a **different** Google account
6. **Expected in Browser 1**:
   - Counter updates to "1"
   - New user appears in the list with:
     - Colored avatar with initials
     - Display name or email initials
   
7. Open Browser 3, sign in with a **third** Google account
8. **Expected in Browser 1 & 2**:
   - Counter updates to "2" (Browser 1) and "2" (Browser 2)
   - All other users visible in the presence list
   
**Pass Criteria**:
- ✅ User count updates within 1 second
- ✅ User avatars appear with unique colors
- ✅ User names/initials display correctly
- ✅ Own user does NOT appear in list

---

### Test 7.3: onDisconnect Cleanup

**Objective**: Verify presence is removed when users disconnect

**Steps**:
1. Have 3 browsers open and authenticated
2. In Browser 1, observe presence list shows 2 other users
3. **Close Browser 2** (not just the tab, close the entire browser)
4. Wait 3-5 seconds
5. **Expected in Browser 1**:
   - Counter decrements to "1"
   - Browser 2's user removed from list
   
6. **Refresh Browser 3** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
7. **Expected in Browser 1**:
   - Counter briefly shows "0" (during Browser 3 reconnect)
   - Counter returns to "1" after Browser 3 re-authenticates
   
8. In Browser 3, click "Logout"
9. **Expected in Browser 1**:
   - Counter decrements to "0"
   - Browser 3's user removed from list immediately

**Pass Criteria**:
- ✅ Disconnected users removed within 5 seconds
- ✅ Logout removes presence immediately
- ✅ Refresh reconnects presence within 2 seconds
- ✅ No duplicate users in the list

---

### Test 7.4-7.6: PresenceList Component Display

**Objective**: Verify UI displays user count and online users correctly

**Steps**:
1. Have 5 browsers open and authenticated (if possible)
2. In Browser 1, observe the right sidebar
3. **Expected**:
   - Header shows "Online" label
   - Counter badge shows "4" (other users)
   - Each user shows:
     - Circular avatar with background color
     - 2-letter initials in white
     - Full name or email-based name
   
4. Hover over user items in the list
5. **Expected**:
   - Hover state changes background (light gray)
   
6. Observe avatar colors across users
7. **Expected**:
   - Each user has a unique, consistent color
   - Colors are vibrant and distinguishable
   - Same user always has same color across sessions

**Pass Criteria**:
- ✅ PresenceList displays in right sidebar (220px width)
- ✅ User count is accurate
- ✅ All online users visible
- ✅ Avatars display initials correctly
- ✅ Colors are unique and consistent per user
- ✅ UI is responsive and styled cleanly

---

### Test 7.7: Presence Listener in CanvasContext

**Objective**: Verify presence subscription works and updates global state

**Steps**:
1. Open Browser 1, sign in, open DevTools Console (F12)
2. Filter console for `[CanvasContext]` or `[presenceService]`
3. Open Browser 2, sign in
4. **Expected in Browser 1 Console**:
   - Log: `[CanvasContext] Received presence update: 1 users`
   - Log: `[presenceService] Presence update received: 1 users`
   
5. Open Browser 3, sign in
6. **Expected in Browser 1 Console**:
   - Log: `[CanvasContext] Received presence update: 2 users`
   
7. Close Browser 2
8. **Expected in Browser 1 Console**:
   - Log: `[CanvasContext] Received presence update: 1 users`

**Pass Criteria**:
- ✅ Console logs show presence updates
- ✅ Update count matches actual online users
- ✅ Updates fire within 1 second of user changes
- ✅ No errors in console

---

### Test 7.8: Edge Cases and Stress Testing

**Objective**: Verify presence handles edge cases gracefully

#### Test A: Rapid Connect/Disconnect
1. Open 5 browsers in quick succession (within 10 seconds)
2. Sign in all 5 users rapidly
3. **Expected**: Counter eventually stabilizes at "4" for each user

#### Test B: Network Interruption
1. Have 2 browsers open and authenticated
2. Disconnect Browser 1's network (turn off WiFi or use DevTools offline mode)
3. Wait 10 seconds
4. **Expected in Browser 2**: Browser 1's user removed after timeout

#### Test C: Same User Multiple Tabs
1. Open Browser 1, sign in with User A
2. Open Browser 2, sign in with **same** User A account
3. **Expected**: 
   - Only one presence entry (deduplicated by uid)
   - Counter shows "1" in Browser 3

#### Test D: Long Session
1. Leave 2 browsers open for 10+ minutes
2. **Expected**: 
   - Presence list remains accurate
   - No stale entries
   - Counter stays correct

**Pass Criteria**:
- ✅ Handles rapid connects without duplicates
- ✅ Removes disconnected users after timeout
- ✅ Deduplicates same user across tabs
- ✅ No memory leaks or stale data over time

---

### Test 7.9: Component Tests (Already Automated)

**Covered by Unit Tests**:
- `PresenceList.test.jsx`: Renders count and user items correctly
- `UserAvatar.test.jsx`: Renders initials with color
- `presenceService.test.js`: All service methods work correctly

**Manual Verification** (optional):
1. Run `npm test -- --coverage`
2. Verify coverage for:
   - `src/services/presenceService.js`: >80%
   - `src/components/collaboration/PresenceList.jsx`: >80%
   - `src/components/collaboration/UserAvatar.jsx`: >80%

---

## Integration with Existing Features

### Presence + Cursors (from PR 4 earlier tasks)

**Test**: Verify presence and cursors work together

**Steps**:
1. Open 2 browsers, sign in with different accounts
2. In Browser 1, move mouse over canvas
3. **Expected in Browser 2**:
   - Remote cursor appears with user's color
   - User appears in presence list with **same color**
   
4. In Browser 1, move shapes around
5. **Expected**:
   - Presence list remains stable (no flickering)
   - Cursors continue to update smoothly
   - No performance degradation

**Pass Criteria**:
- ✅ Presence and cursors use consistent colors
- ✅ Both features work simultaneously
- ✅ No conflicts or performance issues

---

## Success Criteria Summary

### Must Pass:
- [ ] User count accurate for all connected users
- [ ] Users appear/disappear within 5 seconds
- [ ] onDisconnect cleanup works (users removed on disconnect)
- [ ] PresenceList displays correctly in sidebar
- [ ] UserAvatar shows initials and unique colors
- [ ] No duplicate users in list
- [ ] No console errors
- [ ] Presence state updates in CanvasContext

### Nice to Have:
- [ ] Handles 5+ users without lag
- [ ] Survives network interruptions gracefully
- [ ] UI is polished and responsive

---

## Troubleshooting

### Issue: Presence list shows 0 users even with multiple browsers
**Fix**: 
- Check Firebase Realtime Database rules allow read/write
- Verify `VITE_FIREBASE_DATABASE_URL` is set in `.env.local`
- Check browser console for errors

### Issue: Users appear but don't disappear on disconnect
**Fix**:
- onDisconnect requires Firebase to detect connection loss
- Wait 5-10 seconds (Firebase has built-in timeout)
- Check Realtime Database rules allow delete

### Issue: Duplicate users in list
**Fix**:
- Clear browser cache and hard refresh
- Check `excludeUid` is working (shouldn't see own user)
- Verify uid is unique per user

### Issue: Colors not consistent
**Fix**:
- Color is hashed from uid, should be consistent
- Check `getColorForUser` in `cursorColors.js`
- Clear cache to reset color assignments

---

## Quick Verification Checklist

Run through this in 5 minutes to verify basic functionality:

1. ✅ Open 2 browsers, sign in → Presence list shows 1 user in each
2. ✅ Close one browser → Counter decrements to 0
3. ✅ Refresh a browser → User briefly disappears, then reappears
4. ✅ Logout → User removed immediately
5. ✅ Avatars show initials and unique colors
6. ✅ No console errors

---

## Reporting Issues

If any test fails:
1. Document exact steps to reproduce
2. Screenshot the presence list state
3. Include browser console logs
4. Note which Firebase rules are active
5. Verify Firebase Realtime Database data in Firebase Console

**Firebase Console Check**:
- Navigate to Realtime Database
- Check `boards/default/presence/` path
- Verify user entries appear/disappear correctly

---

## Next Steps

After manual testing passes:
- Mark tasks 7.1-7.9 as complete in `tasks.md`
- Document any bugs found
- Proceed to PR 5: Robustness and Error Handling

