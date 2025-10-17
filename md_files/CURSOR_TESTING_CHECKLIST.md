# Realtime Cursor - Quick Testing Checklist

## ✅ Pre-Flight Checks

Before testing, verify:
- [ ] Firebase Realtime Database is enabled
- [ ] `.env` file has `VITE_FIREBASE_DATABASE_URL`
- [ ] Security rules are published (see `FIREBASE_RTDB_SETUP.md`)
- [ ] Dev server is running (`npm run dev`)

## 🧪 Quick Test (2 minutes)

### Single User Test
1. Open browser, navigate to app
2. **Open DevTools Console (F12)**
3. Sign in with Google
4. Look for these logs:
   ```
   [useRealtimeCursor] Setting up cursor for user: ...
   [CanvasContext] Starting cursor subscription: ...
   ```
5. **Move mouse on canvas**
6. Look for:
   ```
   [useRealtimeCursor] Publishing local cursor: ...
   [realtimeCursorService] Setting cursor position: ...
   ```

✅ **Success**: Logs appear, no errors

### Multi-User Test
1. Keep first browser open
2. **Open incognito/different browser**
3. Navigate to same URL
4. Sign in with DIFFERENT Google account
5. Move mouse in Window #2
6. **Look at Window #1 console**:
   ```
   [Canvas] Remote cursors updated: 1 cursors
   ```
7. **Look at Window #1 canvas**: See colored circle with initials

✅ **Success**: Cursor appears in other window

## 🔍 What to Look For

### Console Logs (in order)
1. `[useRealtimeCursor] Setting up cursor` - Hook initialized
2. `[CanvasContext] Starting cursor subscription` - Listening for others
3. `[useRealtimeCursor] Publishing local cursor` - Your movements
4. `[Canvas] Remote cursors updated: X cursors` - Receiving others

### On Canvas
- **Your cursor**: Normal system cursor (arrow)
- **Others' cursors**: Colored circles with labels (e.g., "JD", "SM")
- **Label color**: Unique per user
- **Position**: Updates smoothly (50ms throttle)

### In Firebase Console
1. Go to Firebase Console → Realtime Database → Data
2. Navigate to: `boards/default/cursors/`
3. Should see entries for each active user
4. Data updates in real-time as users move

## ⚠️ Common Issues & Quick Fixes

### Issue: No logs at all
- **Check**: Console open? (F12)
- **Check**: Signed in?
- **Fix**: Refresh page after signing in

### Issue: "PERMISSION_DENIED"
- **Problem**: Firebase rules not configured
- **Fix**: Run through `FIREBASE_RTDB_SETUP.md` steps 1-6

### Issue: Logs but no cursor visible
- **Check Console**: See "Remote cursors updated: 1 cursors"?
  - ✅ Yes → Rendering issue, check React DevTools
  - ❌ No → Not receiving updates, check Firebase rules

### Issue: Cursor in wrong spot
- **Check**: Both windows zoomed same (100%)?
- **Check**: Canvas not panned differently?
- **Note**: Position is canvas-relative, not screen-relative

## 🎯 Expected Behavior

| Action | Window A (You) | Window B (Other) |
|--------|----------------|------------------|
| A moves mouse | Logs publish | Sees A's cursor appear |
| B moves mouse | Sees B's cursor appear | Logs publish |
| A leaves page | Cursor removed | B's cursor disappears |
| A returns | Sees B's cursor | Sees A's cursor |

## 📊 Performance Check

Open DevTools → Network tab:
- Filter: `firebaseio.com`
- Should see WebSocket connection (WS)
- Status: 101 Switching Protocols (good!)
- Data flowing when moving mouse

## 🚨 Red Flags

**Stop and debug if you see:**
- ❌ `Cannot publish cursor: no user.uid`
- ❌ `PERMISSION_DENIED` errors
- ❌ No logs when moving mouse
- ❌ `Failed to set cursor position`
- ❌ WebSocket shows red/failed

## ✨ Success Looks Like

```
Console (Window A - User 1):
[useRealtimeCursor] Setting up cursor for user: abc123 boardId: default
[CanvasContext] Starting cursor subscription: {boardId: "default", uid: "abc123"}
[useRealtimeCursor] Publishing local cursor: {x: 100, y: 200, ...}
[Canvas] Remote cursors updated: 1 cursors
  ↳ [{uid: "xyz789", x: 150, y: 250, name: "JD", color: "#3498db"}]

Canvas (Window A):
- Your cursor: normal arrow
- Other cursor: 🔵 blue circle with "JD" label

Console (Window B - User 2):
[useRealtimeCursor] Setting up cursor for user: xyz789 boardId: default
[CanvasContext] Starting cursor subscription: {boardId: "default", uid: "xyz789"}
[Canvas] Remote cursors updated: 1 cursors
  ↳ [{uid: "abc123", x: 100, y: 200, name: "SM", color: "#e74c3c"}]

Canvas (Window B):
- Your cursor: normal arrow
- Other cursor: 🔴 red circle with "SM" label
```

## 🎓 Understanding the Logs

| Log Prefix | Layer | Meaning |
|------------|-------|---------|
| `[Canvas]` | Component | UI layer, render updates |
| `[useRealtimeCursor]` | Hook | Business logic, coordination |
| `[CanvasContext]` | Context | State management |
| `[realtimeCursorService]` | Service | Firebase communication |

## 📋 Sign-Off Criteria

Before marking as "working":
- [ ] Cursor publishes to Firebase (check Data tab)
- [ ] Other users see your cursor
- [ ] You see others' cursors
- [ ] Cursors have correct colors & labels
- [ ] Cursor disappears when user leaves
- [ ] No errors in console
- [ ] Smooth updates (no lag/jumps)

## 🔧 Debug Commands

```bash
# Check environment variables
cat .env | grep FIREBASE_DATABASE_URL

# Restart with clean logs
npm run dev

# Check Firebase connection
# In browser console:
firebase.database().ref('.info/connected').on('value', (snap) => {
  console.log('Connected:', snap.val());
});
```

## 📚 Full Documentation

- **Setup**: `FIREBASE_RTDB_SETUP.md`
- **Architecture**: `REALTIME_CURSOR_FIX.md`
- **Troubleshooting**: Section in `REALTIME_CURSOR_FIX.md`

---

**Time to test**: 5 minutes  
**Expected result**: Cursors visible between users  
**If stuck**: Check `FIREBASE_RTDB_SETUP.md` first

