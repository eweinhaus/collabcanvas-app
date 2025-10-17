# Cursor Troubleshooting Guide

## Step 1: Check Console Logs

I've added comprehensive logging. **Restart your dev server** and open browser console:

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Step 2: Look for These Logs

### On Page Load (Both Browsers):
```
[FIREBASE] Initialized with config: { databaseURL: "https://...", projectId: "..." }
[CURSOR] Subscribing to cursors: { boardId: "default", excludeUid: "...", path: "boards/default/cursors" }
```

**If you see:**
- ❌ `VITE_FIREBASE_DATABASE_URL is not set` → Database URL missing from `.env`
- ❌ `databaseURL: undefined` → Database URL not configured

### When Moving Mouse (Browser #1):
```
[CURSOR] handlePointerMove: { x: 123, y: 456, scale: 1 }
[CURSOR] Writing to RTDB: { uid: "...", x: 123, y: 456, boardId: "default" }
```

**If you DON'T see these:**
- ❌ Mouse events not attached
- ❌ User not authenticated (check `user?.uid`)

### When Cursor Updates (Browser #2):
```
[CURSOR] onUpdate called with cursors: 1 [{ uid: "...", x: 123, y: 456, ... }]
```

**If you see:**
- ✅ Array with 1+ cursors → Working! Check rendering
- ❌ Array with 0 cursors → Check Firebase rules or write is failing
- ❌ No log at all → Subscription not working

---

## Common Issues & Fixes

### Issue 1: Database URL Not Set

**Console shows:** `VITE_FIREBASE_DATABASE_URL is not set`

**Fix:**
1. Open Firebase Console → Realtime Database
2. Look for the database URL at the top (e.g., `https://PROJECT-default-rtdb.firebaseio.com`)
3. If you don't see it, **you need to create the database first**:
   - Click **"Create Database"** button
   - Choose location (us-central1 recommended)
   - Start in **test mode** (we'll add rules next)
   - Click **"Enable"**
4. Copy the database URL
5. Edit `collabcanvas-app/.env`:
   ```
   VITE_FIREBASE_DATABASE_URL=https://YOUR-PROJECT-default-rtdb.firebaseio.com
   ```
6. **Restart dev server** (Ctrl+C, then `npm run dev`)

### Issue 2: Permission Denied Error Returns

**Console shows:** `PERMISSION_DENIED: Permission denied`

**Fix:**
1. Firebase Console → Realtime Database → **Rules** tab
2. Replace with:
   ```json
   {
     "rules": {
       "boards": {
         "$boardId": {
           "cursors": {
             "$uid": {
               ".read": "auth != null",
               ".write": "auth != null && auth.uid == $uid"
             }
           }
         }
       }
     }
   }
   ```
3. Click **"Publish"**
4. Wait 10 seconds for rules to propagate
5. Refresh both browsers

### Issue 3: User Not Authenticated

**Console shows:** `[CURSOR] setCursorPosition called without uid`

**Fix:**
- Make sure you're **signed in** with Google OAuth
- Check top-right corner for user info
- Try signing out and back in

### Issue 4: Mouse Events Not Firing

**No `handlePointerMove` logs when moving mouse**

**Fix:**
1. Make sure you're moving mouse **on the canvas area** (not toolbar)
2. Check that `onMouseMove` is attached to Stage in `Canvas.jsx`
3. Verify you're not in "select mode" with a shape selected

### Issue 5: Writes Succeed But No Updates Received

**See write logs in Browser #1, but no onUpdate in Browser #2**

**Check:**
1. Both browsers using same `boardId` (should be "default")
2. Firebase Console → Realtime Database → **Data** tab
   - Should see: `boards/default/cursors/<UID>`
   - If path is different, there's a mismatch
3. Both users authenticated
4. Rules allow reads: `".read": "auth != null"`

### Issue 6: Database Rules Not Working

**If you added rules but database doesn't exist:**

1. Go to Firebase Console → Realtime Database
2. If you see **"Get Started"** or **"Create Database"** → Database doesn't exist yet
3. Click to create it:
   - Location: Choose closest (us-central1)
   - Mode: Test mode (temporary)
   - Click **Enable**
4. THEN go to Rules tab and add the secure rules
5. Publish rules
6. Copy database URL to `.env`
7. Restart dev server

---

## Verification Checklist

Run through this with **both browsers open**:

### Browser #1 (Moving Cursor):
- [ ] Page loads without errors
- [ ] `[FIREBASE]` log shows valid `databaseURL`
- [ ] User signed in (check UI)
- [ ] Moving mouse shows `[CURSOR] handlePointerMove` logs
- [ ] Each move shows `[CURSOR] Writing to RTDB` logs
- [ ] No permission errors in console

### Browser #2 (Viewing Cursor):
- [ ] Page loads without errors
- [ ] `[FIREBASE]` log shows same `databaseURL`
- [ ] User signed in with **different account**
- [ ] `[CURSOR] Subscribing to cursors` log on load
- [ ] When Browser #1 moves, see `[CURSOR] onUpdate` logs
- [ ] `onUpdate` array length > 0
- [ ] Visual cursor appears on canvas

### Firebase Console:
- [ ] Realtime Database exists (not just rules)
- [ ] Data tab shows: `boards/default/cursors/<UID>`
- [ ] Rules tab shows published rules with `auth != null`

---

## Quick Test Without Two Browsers

1. Open Firebase Console → Realtime Database → **Data** tab
2. In your app, move mouse on canvas
3. Watch Firebase console - should see data appear:
   ```
   boards
     └── default
          └── cursors
               └── M8unvqT... (your UID)
                    ├── x: 123
                    ├── y: 456
                    ├── color: "#FF6B6B"
                    └── name: "JD"
   ```

If data appears in Firebase → writes work, problem is on read side  
If no data appears → writes failing, check auth/permissions

---

## Still Stuck?

**Share these logs:**
1. `[FIREBASE]` log on page load
2. `[CURSOR] handlePointerMove` log (if any)
3. `[CURSOR] Writing to RTDB` log (if any)
4. `[CURSOR] onUpdate` log from Browser #2 (if any)
5. Screenshot of Firebase Realtime Database → Data tab
6. Screenshot of Firebase Realtime Database → Rules tab

This will pinpoint exactly where the chain breaks!

