# Firebase Realtime Database Setup Guide

## The Problem
You're seeing `PERMISSION_DENIED` errors because Firebase Realtime Database security rules haven't been configured yet.

## Quick Fix (5 minutes)

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your **CollabCanvas** project

### Step 2: Navigate to Realtime Database
1. In left sidebar, click **"Build"** → **"Realtime Database"**
2. If you see "Create Database" button, click it and choose:
   - **Location**: Choose closest to you (e.g., `us-central1`)
   - **Security rules**: Start in **test mode** (we'll update next)
3. Click **"Enable"**

### Step 3: Update Security Rules
1. Click the **"Rules"** tab at the top
2. You'll see the default rules (probably blocks everything or allows all)
3. **Replace** the entire content with:

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
        },
        "presence": {
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

4. Click **"Publish"** button
5. Confirm if prompted

### Step 4: Verify Database URL
1. Still in Realtime Database page, look at the URL at the top
2. It should look like: `https://collabcanvas-xxxxx-default-rtdb.firebaseio.com/`
3. Copy this URL

### Step 5: Update .env File
1. Open `collabcanvas-app/.env`
2. Find or add the line:
   ```
   VITE_FIREBASE_DATABASE_URL=https://YOUR-PROJECT-default-rtdb.firebaseio.com
   ```
3. Paste your actual database URL
4. **Save the file**

### Step 6: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
# Start fresh
npm run dev
```

### Step 7: Test Again
1. Open two browsers
2. Sign in with different accounts
3. Move your mouse on the canvas
4. **You should now see cursors appear!** ✅

---

## What These Rules Do

```json
".read": "auth != null"
```
- Anyone who is authenticated can **read** cursor positions

```json
".write": "auth != null && auth.uid == $uid"
```
- Users can only **write** to their own cursor path
- Prevents users from impersonating others
- `$uid` is a wildcard that matches the user's Firebase UID

---

## Troubleshooting

### Error: "Database URL not configured"
- Make sure `.env` has `VITE_FIREBASE_DATABASE_URL`
- Restart dev server after changing `.env`

### Error: Still getting PERMISSION_DENIED
- Verify rules were published in Firebase Console
- Check you're signed in (user.uid exists)
- Look at Firebase Console → Realtime Database → Data tab
  - You should see: `boards/default/cursors/` appear when you move mouse
  - If path is different, check `DEFAULT_BOARD_ID` in code

### Database shows data but still permission error
- Clear browser cache
- Sign out and sign back in
- Check that your auth token is valid

### Cursors write but still not visible
- Check browser console for other errors
- Add debug logs from earlier walkthrough
- Verify both browsers use same `boardId`

---

## Security Notes

✅ **Safe**: Users can only write their own cursor data  
✅ **Safe**: Authentication required to read/write  
⚠️ **Note**: All authenticated users can see all cursors on same board  

For production, you might want to add:
- Rate limiting (throttle already helps)
- Board-level access control
- Timestamp validation

---

## Next Steps

Once cursors work:
- ✅ Mark task **6.11** complete
- Move on to **PR4 tasks 7.1-7.9** (Presence features)
- Or continue to PR5 (Robustness)

---

**Still stuck?** Check that:
1. Firebase project has Realtime Database enabled
2. Rules are published (check Rules tab)
3. `.env` has correct `VITE_FIREBASE_DATABASE_URL`
4. Dev server restarted after `.env` changes
5. Both users are signed in with Google OAuth

