# AI Chat Testing Guide

## Quick Test Scenarios

After deploying the fix, test these scenarios to verify the issue is resolved:

### ✅ Should Work Now (Previously Broken)

1. **"Create a blue circle"**
   - Expected: ✓ Shape created successfully!
   - Status: Should work ✅

2. **"Create a red square"**
   - Expected: ✓ Shape created successfully!
   - Status: Should work ✅

3. **"Rotate the square by 45 degrees"** ⭐ (This was broken)
   - Expected: Working on it... → Analyzing shapes... → ✓ Shape rotated successfully!
   - Status: **FIXED** ✅
   - The square should actually rotate

4. **"Move the blue circle to 600, 300"**
   - Expected: ✓ Shape moved successfully!
   - Status: Should work ✅

5. **"Rotate the red rectangle 90 degrees"**
   - Expected: ✓ Shape rotated successfully!
   - Status: **FIXED** ✅

### 🧪 Edge Cases to Test

6. **"What shapes are on the canvas?"**
   - Expected: ✓ Retrieved canvas state. + list of shapes
   - Status: Should work (informational query)

7. **"Move the shape to the right"** (ambiguous)
   - Expected: Analyzing shapes... → ✓ Shape moved successfully!
   - Status: Should use fallback loop

8. **"Create a 3x3 grid of blue squares"**
   - Expected: ✓ Grid created successfully!
   - Status: Should work as before

9. **"Create a login form at 300, 200"**
   - Expected: ✓ Shapes created vertically!
   - Status: Should work as before

## How to Test Locally

1. **Start the dev server**:
   ```bash
   cd /Users/ethan/Desktop/Github/Gauntlet/CollabCanvas/collabcanvas-app
   npm run dev
   ```

2. **Open http://localhost:5173**

3. **Sign in with Google**

4. **Open AI Chat Panel** (click AI button in toolbar)

5. **Run through test scenarios above**

6. **Check console** for any errors

## What to Look For

### ✅ Success Indicators
- Shapes actually get created/moved/rotated (not just messages)
- No "Retrieved canvas state" without follow-up action
- "Analyzing shapes..." shows when AI needs to think
- Clear success messages after actions complete

### ❌ Failure Indicators
- "Retrieved canvas state" with no further action
- Commands timeout or hang
- Error messages in chat
- Console errors about tool execution

## Deployment Testing

After deploying to production:

1. **Go to**: https://collabcanvas-app-km8k.onrender.com/

2. **Sign in**

3. **Test the same scenarios** as above

4. **Note**: First request might be slow (cold start on free tier)

## Expected Performance

- **Direct manipulation**: 1-2 seconds
- **With fallback loop**: 2-3 seconds (AI needs two API calls)
- **Grid/complex commands**: 2-4 seconds (depending on complexity)

## If Issues Persist

Check:
1. **OpenAI API key** is configured correctly
2. **Firebase Function** is deployed and accessible
3. **Console logs** for detailed error messages
4. **Network tab** to see API calls and responses

## Success Criteria

All 9 test scenarios should complete successfully with:
- Actual shape changes on canvas
- Clear success messages
- No hanging or incomplete operations

