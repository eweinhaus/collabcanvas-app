# Tooltip Username Fix - Manual Test Guide

## Quick Verification (5 minutes)

### Test 1: Basic Username Display
**Goal:** Verify that tooltips show actual usernames instead of "Unknown"

1. **Start the app:**
   ```bash
   cd collabcanvas-app
   npm run dev
   ```

2. **Login as User 1:**
   - Open `http://localhost:5173` in Chrome
   - Login with any account (e.g., `alice@example.com`)

3. **Create a shape:**
   - Click the Rectangle tool
   - Draw a rectangle on canvas
   - **Hover over it immediately**

4. **✅ Expected Result:**
   ```
   Created by [Your Display Name or Email]
   Created 0s ago
   ```

5. **Edit the shape:**
   - Change its color by double-clicking
   - Select a new color
   - **Hover over it again**

6. **✅ Expected Result:**
   ```
   Created by [Your Display Name]
   Edited 0s ago by [Your Display Name]
   ```

---

### Test 2: Multi-User Attribution
**Goal:** Verify that different users' names appear correctly

1. **Keep User 1 logged in (Chrome)**

2. **Open Firefox in Private/Incognito mode:**
   - Go to `http://localhost:5173`
   - Login as a different user (e.g., `bob@example.com`)

3. **User 2 (Firefox) edits User 1's shape:**
   - Click and drag the rectangle User 1 created
   - Change its position

4. **User 1 (Chrome) hovers over the shape:**

5. **✅ Expected Result in Chrome:**
   ```
   Created by Alice
   Edited 2s ago by Bob
   ```

6. **User 2 (Firefox) hovers over the same shape:**

7. **✅ Expected Result in Firefox:**
   ```
   Created by Alice
   Edited 5s ago by Bob
   ```

---

### Test 3: Offline User Attribution
**Goal:** Verify tooltips work even when creator is offline

1. **User 1 (Chrome) creates a new circle**

2. **User 1 (Chrome) logs out** (or closes tab)

3. **User 2 (Firefox) hovers over the circle User 1 created:**

4. **✅ Expected Result:**
   ```
   Created by Alice
   Created 2m ago
   ```
   *(Should NOT show "Unknown" even though Alice is offline)*

---

### Test 4: Legacy Shape Fallback
**Goal:** Verify existing shapes (created before this fix) still work

1. **If you have shapes created before this fix:**
   - They won't have `createdByName`/`updatedByName` fields
   - Tooltip will show "Unknown" if creator is offline
   - Tooltip will show creator's name if they're online

2. **To test legacy behavior:**
   - Hover over an old shape (created before deployment)
   - **Expected:** "Created by Unknown" (if creator offline)

3. **Edit the old shape (User 1):**
   - Move or resize it
   - **Expected:** Now has `updatedByName` field

4. **Hover again:**
   - **Expected:** "Edited 2s ago by [Current User]"

---

## Advanced Tests (Optional)

### Test 5: Username Formats

Test different user account types:

| Account Type | Display Name | Email | Expected Tooltip |
|--------------|--------------|-------|------------------|
| Google OAuth | "Alice Johnson" | alice@gmail.com | "Created by Alice Johnson" |
| Email/Password (with name) | "Bob Smith" | bob@example.com | "Created by Bob Smith" |
| Email/Password (no name) | null | charlie@test.com | "Created by charlie" (from email) |
| Anonymous | null | null | "Created by Anonymous" |

### Test 6: Real-Time Updates

1. **User 1 creates a shape**
2. **User 2 starts dragging the same shape** (sees lock icon)
3. **User 1 hovers over shape while User 2 is dragging**
4. **✅ Expected:** 
   - Dashed border in User 2's color
   - Tooltip shows "Created by User 1"
   - No "Edited by User 2" yet (drag not finalized)
5. **User 2 releases drag**
6. **User 1 sees 1-second flash** (edit feedback)
7. **User 1 hovers again:**
8. **✅ Expected:** "Edited 0s ago by User 2"

---

## Debugging Tips

### If tooltips show "Unknown":

1. **Check browser console for errors**
   ```
   F12 → Console tab
   ```

2. **Verify user is logged in:**
   ```javascript
   // In console:
   firebase.auth().currentUser
   // Should show: { uid: "...", displayName: "...", email: "..." }
   ```

3. **Check shape metadata in Firestore:**
   - Go to [Firebase Console](https://console.firebase.google.com/project/collabcanvas-prod/firestore)
   - Navigate to `boards/default/shapes/[shape-id]`
   - Verify fields exist:
     - ✅ `createdByName`: "Alice"
     - ✅ `updatedByName`: "Alice"

4. **Check Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### If tooltips don't appear at all:

1. **Verify shape has metadata:**
   - Check `shape.createdBy` exists
   - If null → Shape created with old code

2. **Check React DevTools:**
   - Install React DevTools extension
   - Select `<Shape>` component
   - Verify props:
     - `shape.createdByName`
     - `shape.updatedByName`
     - `onlineUsers` (array)

3. **Check console for Konva errors:**
   - Konva tooltips (Label/Tag) can fail silently
   - Look for: "Cannot read property 'getLayer' of null"

---

## Success Criteria

✅ **All tests pass if:**
1. Tooltips show actual usernames (not "Unknown") for new shapes
2. Creator and editor names appear correctly
3. Tooltips work even when creator is offline
4. Multi-user edits show different usernames
5. Time ago updates correctly ("2s ago" → "5s ago" → "10s ago")

---

## Rollback Plan (If Issues Occur)

If this fix causes problems in production:

1. **Revert Firestore rules:**
   ```bash
   git checkout HEAD~1 collabcanvas-app/firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Revert code changes:**
   ```bash
   git revert [commit-hash]
   ```

3. **Old behavior:**
   - Tooltips will use `onlineUsers` lookup
   - Offline users will show as "Unknown"
   - No data loss (new fields won't break old code)

---

**Estimated Test Time:** 5-10 minutes  
**Required Users:** 2 (different browsers/accounts)  
**Required Tools:** Chrome + Firefox (or Incognito mode)

