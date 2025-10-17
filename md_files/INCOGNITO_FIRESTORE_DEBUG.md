# Debugging Incognito Firestore Issues

## Problem
Incognito browsers can see realtime cursors but cannot see shape changes made by incognito users (other browsers can see incognito changes).

## Root Cause Analysis

### Why Cursors Work:
- Cursors use **Realtime Database** (RTDB)
- RTDB rules: `".write": "auth != null && auth.uid == $uid"`
- Each user writes to their own path: `boards/{boardId}/cursors/{uid}`
- ✅ This works because user only writes their own data

### Why Shapes Might Fail in Incognito:
- Shapes use **Firestore**
- Firestore rules: `allow create: if request.auth != null && request.resource.data.createdBy == request.auth.uid`
- All users write to shared collection: `boards/{boardId}/shapes/{shapeId}`
- ❌ Incognito browsers might have auth/permission issues

## Diagnostic Steps

### Step 1: Check Authentication in Incognito
Open incognito browser, sign in, open DevTools Console:

```javascript
// Check if Firebase Auth is working
firebase.auth().currentUser
// Should show: { uid: "...", email: "...", displayName: "..." }

// If null, auth failed in incognito mode
```

### Step 2: Check Firestore Connection
In incognito browser console:

```javascript
// Check Firestore connectivity
firebase.firestore().collection('boards').doc('default').collection('shapes').get()
  .then(snapshot => console.log('Read success:', snapshot.size, 'shapes'))
  .catch(error => console.error('Read error:', error));
```

**Expected**: `Read success: X shapes`  
**If error**: Permission denied or network issue

### Step 3: Check Shape Creation
In incognito browser, try creating a shape (click on canvas). Check console for:

```
[firestoreService] Creating shape: { shapeId: "...", uid: "...", payload: {...} }
[firestoreService] Shape created successfully: ...
```

**If you see an error** like:
```
[firestoreService] Error creating shape: FirebaseError: Missing or insufficient permissions
```

This means Firestore rules are blocking the write.

### Step 4: Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Data** tab
4. Check `boards/default/shapes/` collection
5. Look for shapes with `createdBy` matching the incognito user's uid

**If shapes are missing**: Write failed  
**If shapes are there**: Read or subscription issue

## Solutions

### Solution 1: Update Firestore Rules (Already Applied)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boards/{boardId}/shapes/{shapeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.keys().hasAll(['createdBy', 'createdAt', 'updatedAt'])
                    && request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

**Deploy to Firebase:**
```bash
firebase deploy --only firestore:rules
```

### Solution 2: Verify Third-Party Cookies
Incognito browsers **block third-party cookies** by default, which can break Firebase Auth.

**Chrome Incognito:**
1. Open `chrome://settings/cookies`
2. Ensure "Block third-party cookies in Incognito" is **OFF**
3. Or add Firebase domains to allowed sites

**Firefox Private Window:**
1. Open `about:preferences#privacy`
2. Set Tracking Protection to "Standard" (not Strict)

### Solution 3: Check IndexedDB Access
Firestore uses IndexedDB for local caching. Incognito might block this.

**Test in console:**
```javascript
indexedDB.open('firestore-test', 1)
  .onsuccess = () => console.log('IndexedDB works');
  .onerror = (e) => console.error('IndexedDB blocked:', e);
```

**If blocked**, Firestore persistence fails. Solution:
```javascript
// In firebase.js, disable persistence in incognito
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firestore = getFirestore(app);

// Try to enable persistence, but don't fail if blocked
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available (incognito mode?)');
  }
});
```

### Solution 4: Temporarily Relax Rules for Testing
**ONLY FOR DEBUGGING** - revert after testing:

```javascript
match /boards/{boardId}/shapes/{shapeId} {
  allow read, write: if request.auth != null;  // Allow all authenticated operations
}
```

Deploy and test. If this works, the issue is in the original rules.

## Quick Validation Checklist

Run these in **incognito browser console** after signing in:

```javascript
// 1. Check auth
console.log('Auth UID:', firebase.auth().currentUser?.uid);

// 2. Check Firestore read
firebase.firestore().collection('boards/default/shapes').limit(1).get()
  .then(() => console.log('✅ Read works'))
  .catch(err => console.error('❌ Read failed:', err.code));

// 3. Check Firestore write
const testShape = {
  id: 'test-' + Date.now(),
  type: 'rect',
  props: { x: 0, y: 0, width: 100, height: 100 },
  createdBy: firebase.auth().currentUser.uid,
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  deleted: false
};

firebase.firestore().doc(`boards/default/shapes/${testShape.id}`)
  .set(testShape)
  .then(() => console.log('✅ Write works'))
  .catch(err => console.error('❌ Write failed:', err.code, err.message));
```

## Expected Console Output

### Working Incognito:
```
Auth UID: abc123xyz
✅ Read works
[firestoreService] Creating shape: ...
[firestoreService] Shape created successfully: ...
✅ Write works
```

### Broken Incognito:
```
Auth UID: abc123xyz
✅ Read works
[firestoreService] Creating shape: ...
❌ Error: FirebaseError: Missing or insufficient permissions
❌ Write failed: permission-denied
```

## Next Steps

1. **Run diagnostic checklist above** in incognito browser
2. **Share console output** with any errors
3. **Check Firebase Console** for Firestore rules and data
4. **Verify third-party cookies** are allowed
5. **Test with relaxed rules** to isolate issue

## Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Third-party cookies blocked | Auth works, writes fail | Allow cookies for Firebase domains |
| IndexedDB blocked | Reads work, writes fail | Disable Firestore persistence |
| Strict tracking protection | Auth fails | Use standard tracking protection |
| Rules too strict | Permission denied errors | Review Firestore rules validation |
| Auth state not synced | `auth.currentUser` is null | Wait for `onAuthStateChanged` callback |

---

**After fixing, test with:**
1. Incognito browser creates shape → Regular browser sees it ✅
2. Regular browser creates shape → Incognito browser sees it ✅
3. Two incognito browsers can see each other's shapes ✅

