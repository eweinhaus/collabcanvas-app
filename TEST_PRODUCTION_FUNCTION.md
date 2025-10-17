# Test Production Function

**Function URL:** https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat

## Get Firebase Token

### Option 1: Browser Console (Easiest)

1. Open your app at http://localhost:5173
2. Login with Google
3. Open DevTools Console (F12 or Cmd+Option+J)
4. Paste this code:

```javascript
// Get the auth instance from window (React DevTools)
const getToken = async () => {
  try {
    // Try to get auth from React DevTools
    const reactRoot = document.getElementById('root')?._reactRootContainer?._internalRoot?.current;
    
    // Or access it from the window if exposed
    if (window.__FIREBASE_AUTH__) {
      const token = await window.__FIREBASE_AUTH__.currentUser.getIdToken();
      console.log('Token:', token);
      return token;
    }
    
    // Alternative: import dynamically
    const { auth } = await import('/src/services/firebase.js');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      console.log('✅ Token retrieved!');
      console.log('Copy this token:');
      console.log(token);
      
      // Also copy to clipboard
      navigator.clipboard.writeText(token);
      console.log('✅ Token copied to clipboard!');
      
      return token;
    } else {
      console.error('❌ No user logged in');
      return null;
    }
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Run it
getToken();
```

### Option 2: Add to Your App Temporarily

Add this to your app's header (e.g., in `Header.jsx`):

```javascript
// Add a debug button
{process.env.NODE_ENV === 'development' && (
  <button
    onClick={async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        console.log('Token:', token);
        navigator.clipboard.writeText(token);
        alert('Token copied to clipboard!');
      }
    }}
    style={{ padding: '5px', fontSize: '12px' }}
  >
    Get Token
  </button>
)}
```

### Option 3: Use Curl with Manual Token

If the above doesn't work, I'll create a simpler test:

```bash
# This tests without authentication (should return 401)
curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'

# Expected: {"error":"Unauthorized - missing token"}
```

## Test Commands

### Test 1: No Auth (Should Return 401)
```bash
curl -v -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

Expected: `{"error":"Unauthorized - missing token"}`

### Test 2: Invalid Body (Should Return 400)
```bash
curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"invalid":"body"}'
```

Expected: `{"error":"messages must be an array"}`

### Test 3: With Valid Token (Should Work!)
```bash
# First, get your token using one of the methods above
export FIREBASE_TOKEN="your-token-here"

curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in exactly 3 words"}
    ]
  }'
```

Expected: `{"message":{"role":"assistant","content":"Hello there friend!","tool_calls":[]}}`

## Quick Test Script

Run this from your terminal:

```bash
cd /Users/ethan/Desktop/Github/Gauntlet/CollabCanvas/collabcanvas-app

# Test 1: No auth
echo "Test 1: No Auth (should return 401)"
curl -s -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}' | jq .

echo ""
echo "Test 2: Invalid body (should return 400)"
curl -s -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"invalid":"body"}' | jq .

echo ""
echo "✅ If you see 401 and 400 errors above, the function is working!"
echo ""
echo "To test with OpenAI, get a token from your app and run:"
echo "export FIREBASE_TOKEN='your-token'"
echo "curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer \$FIREBASE_TOKEN' \\"
echo "  -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Say hi in 3 words\"}]}'"
```

## Update Frontend Environment

Don't forget to add this to your Render environment variables:

```
VITE_OPENAI_ENDPOINT=https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

Or for local testing:
```bash
# Add to collabcanvas-app/.env
VITE_OPENAI_ENDPOINT=https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat
```

## Troubleshooting

### "Cannot get token"
- Make sure you're logged in to the app
- Try refreshing the page and logging in again

### "CORS error"
- This shouldn't happen (CORS is configured)
- Check browser console for specific error

### "Unauthorized"
- Token may be expired (1 hour lifetime)
- Get a fresh token

### "OpenAI API error"
- Check OpenAI dashboard for API key issues
- Verify billing is set up on OpenAI
- Check Firebase logs: `firebase functions:log --only openaiChat`

