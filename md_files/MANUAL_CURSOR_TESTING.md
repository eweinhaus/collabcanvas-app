# Manual Testing Guide for Realtime Cursors (Task 6.11)

## Objective
Verify that remote cursors appear with **<50ms latency** between browsers and that cleanup works properly on disconnect.

---

## Prerequisites

**⚠️ IMPORTANT: You must complete Firebase Realtime Database setup first!**

If you see `PERMISSION_DENIED` errors in console, follow the setup guide:
👉 **See `md_files/FIREBASE_RTDB_SETUP.md`** for complete instructions

Quick checklist:
- ✅ Firebase Realtime Database enabled in Firebase Console
- ✅ Security rules published (allows authenticated read/write to cursors path)
- ✅ `VITE_FIREBASE_DATABASE_URL` set in `.env` file
- ✅ Dev server restarted after `.env` changes
- ✅ App running locally via `npm run dev`
- ✅ Two separate browser windows/tabs or different browsers (Chrome, Firefox, Safari, etc.)

---

## Test 1: Basic Cursor Visibility & Latency

### Steps:
1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open Browser #1:**
   - Navigate to `http://localhost:5173` (or your dev server URL)
   - Sign in with Google OAuth
   - You should see the canvas with toolbar

3. **Open Browser #2:**
   - Open a **new incognito/private window** or different browser
   - Navigate to same URL: `http://localhost:5173`
   - Sign in with a **different Google account**

4. **Test cursor synchronization:**
   - In **Browser #1**: Move your mouse slowly across the canvas
   - In **Browser #2**: Watch for the remote cursor
   
5. **Verify:**
   - ✅ Remote cursor appears with **initials** (e.g., "JD") and **unique color**
   - ✅ Cursor follows movement smoothly
   - ✅ Latency feels **<50ms** (no noticeable lag)
   - ✅ Your own cursor does NOT appear as a remote cursor

6. **Test both directions:**
   - Move cursor in **Browser #2**
   - Verify it appears in **Browser #1** with low latency

---

## Test 2: Color & Label Uniqueness

### Steps:
1. With both browsers open and signed in:
   - Check that each remote cursor has a **distinct color** from the user color palette
   - Verify cursor labels show **initials** (e.g., "JD" for "John Doe")

2. **Edge case: Same name initials**
   - If both users have same initials (e.g., "John Doe" and "Jane Dean"), colors should still differ

3. **Verify:**
   - ✅ Each user gets a **stable color** (doesn't change on refresh)
   - ✅ Initials are **readable** and positioned above cursor pointer
   - ✅ No overlap with shapes layer (cursors render on top)

---

## Test 3: Mouse Leave & Disconnect Cleanup

### Steps:
1. In **Browser #1**: Move cursor **off the canvas** area (outside window)
   - **Expected**: Remote cursor disappears from **Browser #2**

2. In **Browser #1**: Move cursor **back onto canvas**
   - **Expected**: Remote cursor reappears in **Browser #2**

3. **Close Browser #1 tab completely**
   - **Expected**: Within ~2 seconds, cursor disappears from **Browser #2**

4. **Verify:**
   - ✅ Cursors disappear when mouse leaves canvas
   - ✅ Cursors disappear when user closes tab/window (onDisconnect cleanup)
   - ✅ No "ghost cursors" remain after disconnect

---

## Test 4: Multi-User Scenario (Optional)

### Steps:
1. Open **3+ browser sessions** (different accounts or incognito windows)
2. Move cursors around in each session
3. **Verify:**
   - ✅ All cursors visible to all users (except own)
   - ✅ No performance degradation with multiple cursors
   - ✅ Colors remain distinct across users

---

## Test 5: Network Throttling (Optional)

### Steps:
1. Open **Chrome DevTools** → **Network** tab → **Throttling** dropdown
2. Set to **Slow 3G** or **Fast 3G**
3. Move cursor in throttled browser
4. **Verify:**
   - ✅ Cursor updates still appear (may have higher latency under throttling)
   - ✅ No errors in console
   - ✅ Throttling to **50ms** prevents excessive writes

---

## Expected Console Behavior

### ✅ Good (No errors)
```
No Firebase errors
No React errors
```

### ❌ Bad (Investigate if seen)
```
Failed to set cursor position
Permission denied (check Firebase rules)
Cannot read property 'uid' of null
```

---

## Debugging Tips

1. **Cursor not appearing?**
   - Check Firebase Realtime Database rules allow read/write
   - Verify `VITE_FIREBASE_DATABASE_URL` is set in `.env`
   - Check browser console for errors
   - Verify user is authenticated (`user.uid` exists)

2. **High latency (>50ms)?**
   - Check network throttling is OFF
   - Verify throttle is set to 50ms in `useRealtimeCursor.js`
   - Test with browsers on same local network

3. **Cursors not cleaning up?**
   - Check `onDisconnect` is being called in `registerDisconnectCleanup`
   - Verify `removeCursor` runs on unmount
   - Check Firebase Realtime DB console to see if old cursors persist

4. **Multiple cursors for same user?**
   - Verify `excludeUid` filter in `subscribeToCursors`
   - Check that `uid` from auth matches cursor `uid`

---

## Success Criteria

- ✅ **Latency**: Cursor movement appears in <50ms across browsers
- ✅ **Cleanup**: Cursors disappear within ~2s of disconnect
- ✅ **Filtering**: Own cursor never appears as remote
- ✅ **Uniqueness**: Each user has distinct color and initials
- ✅ **Performance**: Smooth at 60 FPS with 5+ concurrent users

---

## Checklist

- [ ] Cursor appears in second browser within 50ms
- [ ] Cursor has correct color and initials
- [ ] Own cursor is filtered out (not shown as remote)
- [ ] Cursor disappears when mouse leaves canvas
- [ ] Cursor disappears when browser tab closes
- [ ] No console errors during testing
- [ ] Tested with 2+ browsers successfully

---

Once all tests pass, **mark task 6.11 as complete** in `tasks.md`!

