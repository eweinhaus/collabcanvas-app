# PR11 Part A Quick Start Guide

## 🚀 Testing the Z-Index Implementation

### Quick Test (2 minutes)

1. **Start the app**:
   ```bash
   cd collabcanvas-app
   npm run dev
   ```

2. **Create overlapping shapes**:
   - Click rectangle tool, create shape at (100, 100)
   - Click circle tool, create shape at (120, 120)
   - Click rectangle tool, create shape at (140, 140)

3. **Test context menu**:
   - Right-click the bottom shape (first rectangle)
   - Click "Bring to Front"
   - ✅ Shape should now be on top!

4. **Test keyboard shortcuts**:
   - Select any shape
   - Press `Ctrl+]` (or `Cmd+]` on Mac)
   - ✅ Shape moves to front
   - Press `Ctrl+[` (or `Cmd+[` on Mac)
   - ✅ Shape moves to back

---

## 🔧 For Existing Projects: Run Migration

If you have existing shapes in Firestore without zIndex:

```bash
# 1. Ensure you have firebase-service-account.json in collabcanvas-app/
cd collabcanvas-app

# 2. Run migration script
node scripts/migrateZIndex.js

# Expected output:
# ✨ Migration completed successfully!
# Total updated: [number of shapes]
```

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Shapes render in correct z-index order
- [ ] Right-click shows context menu with 4 options
- [ ] "Bring to Front" moves shape to top
- [ ] "Send to Back" moves shape to bottom
- [ ] "Bring Forward" swaps with next higher shape
- [ ] "Send Backward" swaps with next lower shape
- [ ] Keyboard shortcuts work (Ctrl+], Ctrl+[, ], [)
- [ ] Undo/Redo works for z-index operations
- [ ] No console errors

---

## 🐛 Troubleshooting

### Context menu doesn't appear
- Make sure you're right-clicking directly on a shape
- Try clicking once to select the shape first

### Keyboard shortcuts don't work
- Verify exactly ONE shape is selected
- Check browser console for errors
- Try clicking canvas first to focus the window

### Shapes in wrong order after refresh
- Check Firestore: shapes should have `props.zIndex` field
- Run migration script if zIndex is missing
- Check browser console for sync errors

### Migration script fails
- Verify `firebase-service-account.json` exists
- Check file has correct permissions
- Ensure Firebase Admin SDK credentials are valid

---

## 📊 Testing with DevTools

### Monitor Firestore Updates
1. Open Chrome DevTools → Network tab
2. Filter: `firestore`
3. Perform z-index operation
4. Verify batch write request appears
5. Check response: should be 200 OK

### Check Z-Index Values
1. Open DevTools → Console
2. Run:
   ```javascript
   // Get shapes from context
   const shapes = window.__CANVAS_STATE__.shapes;
   console.table(shapes.map(s => ({ 
     id: s.id, 
     type: s.type, 
     zIndex: s.zIndex 
   })));
   ```

---

## 📝 What to Report

If you find issues, report with:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser** (Chrome/Firefox/Safari + version)
5. **Console errors** (if any)
6. **Screenshot** (if visual issue)

---

## ✨ Key Features Implemented

| Feature | Keyboard Shortcut | Description |
|---------|------------------|-------------|
| **Bring to Front** | `Ctrl/Cmd + ]` | Move shape above all others |
| **Send to Back** | `Ctrl/Cmd + [` | Move shape below all others |
| **Bring Forward** | `]` | Swap with next higher shape |
| **Send Backward** | `[` | Swap with next lower shape |
| **Context Menu** | Right-click | Visual menu for all operations |
| **Undo/Redo** | `Ctrl/Cmd + Z` | Works with all z-index changes |

---

## 🎯 Success Criteria

✅ **Part A is complete when**:
- All 14 manual tests pass
- No console errors during testing
- Multi-user sync works (<500ms latency)
- Undo/redo works for all z-index operations
- Keyboard shortcuts work reliably
- Context menu UI feels polished

---

## 📚 Related Documentation

- **Full Manual Testing Guide**: `md_files/PR11_PART_A_MANUAL_TESTING.md`
- **Implementation Summary**: `md_files/PR11_PART_A_IMPLEMENTATION_SUMMARY.md`
- **Task List**: `md_files/planning/tasks.md` (Tasks 11.1-11.11)

---

**Ready to test?** Start with the Quick Test above! 🚀

