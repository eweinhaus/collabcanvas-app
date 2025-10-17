# Firebase Security Rules - Complete Guide

This document explains all Firebase security rules for CollabCanvas and how to manage them.

---

## 📂 Rule Files in This Codebase

**All Firebase rules are located in `md_files/firebase_rules/` directory:**

- **`md_files/firebase_rules/database.rules.json`** - Realtime Database rules (cursors, presence)
- **`md_files/firebase_rules/firestore.rules`** - Firestore Database rules (shapes, boards)
- **`md_files/firebase_rules/README.md`** - Quick reference guide

**⚠️ IMPORTANT**: These files are the **source of truth**. Always update Firebase Console to match these files.

---

## 🔄 How to Sync Rules to Firebase

### Realtime Database Rules

1. Open `md_files/firebase_rules/database.rules.json`
2. Copy the entire JSON content
3. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project
4. Left sidebar → **Realtime Database**
5. Click **"Rules"** tab at top
6. Paste the rules
7. Click **"Publish"**
8. **Wait 10 seconds** for propagation

### Firestore Rules

1. Open `md_files/firebase_rules/firestore.rules`
2. Copy the entire content
3. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project
4. Left sidebar → **Firestore Database**
5. Click **"Rules"** tab at top
6. Paste the rules
7. Click **"Publish"**
8. Rules take effect **immediately**

---

## 📖 Current Rules Explained

### Realtime Database (`database.rules.json`)

```json
{
  "rules": {
    "boards": {
      "$boardId": {
        ".read": "auth != null",
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

**What this means:**

- **`boards/$boardId/.read`**: Any authenticated user can read board-level data
- **`cursors/$uid/.read`**: Any authenticated user can read all cursor positions
- **`cursors/$uid/.write`**: Users can ONLY write to their own cursor path
- **`presence/$uid`**: Same rules as cursors (for future presence feature)

**Security benefits:**
- ✅ Users can't impersonate other users (uid validation)
- ✅ All users see each other's cursors (read access)
- ✅ Authentication required (no anonymous access)

---

### Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boards/{boardId}/shapes/{shapeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

**What this means:**

- **`allow read`**: Any authenticated user can read shapes
- **`allow create`**: Users must be authenticated AND set `createdBy` to their own UID
- **`allow update`**: Any authenticated user can update any shape (collaboration!)
- **`allow delete`**: Any authenticated user can delete any shape

**Security benefits:**
- ✅ Shape ownership tracked via `createdBy` field
- ✅ Real-time collaboration enabled (anyone can edit)
- ✅ Authentication required
- ✅ Prevents anonymous vandalism

---

## 🔐 Security Principles

### 1. Authentication Required
All operations require `request.auth != null` - no anonymous access.

### 2. User Isolation (Cursors/Presence)
Users can only write to paths with their own UID:
```json
"auth.uid == $uid"
```

### 3. Collaborative Editing (Shapes)
Any authenticated user can edit shapes - enables real-time collaboration without complex permissions.

### 4. Ownership Tracking
Shapes track creator via `createdBy` field - future-proof for permissions.

---

## 🧪 Testing Rules

### Test in Firebase Console

**Realtime Database:**
1. Rules tab → Click **"Simulator"** button
2. Test read/write operations
3. Example test:
   ```
   Location: /boards/default/cursors/testUID
   Read: ✅ (authenticated)
   Write: ❌ (wrong UID)
   ```

**Firestore:**
1. Rules tab → Click **"Rules Playground"**
2. Test queries
3. Example test:
   ```
   Operation: get
   Path: /boards/default/shapes/shape123
   Auth: Authenticated UID
   Result: ✅ Allow
   ```

### Test Locally (Future)

When you're ready for local testing:
```bash
# Install Firebase emulator
npm install -g firebase-tools

# In project root
firebase init emulators
firebase emulators:start
```

---

## ⚠️ Common Permission Errors

### Error: `PERMISSION_DENIED`

**Cause:** Rules in Firebase Console don't match `database.rules.json`

**Fix:**
1. Compare Firebase Console rules with `database.rules.json`
2. Copy from `database.rules.json` to Console
3. Publish rules
4. Wait 10 seconds
5. Refresh browser

### Error: `Client doesn't have permission to access the desired data`

**Cause:** User not authenticated OR wrong path structure

**Fix:**
1. Verify user is signed in (check `user.uid` in console)
2. Check path matches rules (e.g., `/boards/default/cursors/USER_UID`)
3. Verify UID in path matches authenticated user's UID

---

## 🚀 Future Enhancements

### Board-Level Permissions
```json
"boards": {
  "$boardId": {
    ".read": "root.child('boards').child($boardId).child('members').child(auth.uid).exists()",
    ".write": "..."
  }
}
```
Restrict board access to invited members only.

### Rate Limiting
```json
".write": "auth != null && 
           !data.exists() || 
           (now - data.child('updatedAt').val()) > 50"
```
Prevent spam by enforcing minimum time between writes.

### Validation
```javascript
allow create: if request.auth != null 
              && request.resource.data.keys().hasAll(['x', 'y', 'type'])
              && request.resource.data.x is number
              && request.resource.data.y is number;
```
Validate data structure on write.

---

## 📚 Reference Links

- [Firebase Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Language Reference](https://firebase.google.com/docs/rules/rules-language)
- [Testing Rules](https://firebase.google.com/docs/rules/unit-tests)

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All rules synced from codebase to Firebase Console
- [ ] Rules tested with Firebase Rules Playground
- [ ] Authentication working (users can sign in)
- [ ] Cursors visible between browsers (RTDB rules working)
- [ ] Shapes sync between browsers (Firestore rules working)
- [ ] No PERMISSION_DENIED errors in console
- [ ] Rules committed to version control

---

## 🆘 Getting Help

**If you see permission errors:**

1. Check this guide first
2. Verify rules in Firebase Console match codebase files
3. Test with Firebase Console simulator
4. Check authentication state (user signed in?)
5. Review paths in code vs paths in rules

**Still stuck?**
- Check Firebase Console → Realtime Database/Firestore → **Usage** tab for denied requests
- Look at browser console for exact error path
- Compare working path with error path structure

