# Get Firebase Token for Testing

## Simple Method (Copy Console Output)

1. **Login** to your app at http://localhost:5173
2. Open **DevTools Console** (F12 or Cmd+Option+J)
3. **Paste this code:**

```javascript
const { auth } = await import('/src/services/firebase.js');
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  console.log('==================================================');
  console.log('FIREBASE TOKEN (Copy this entire line):');
  console.log('==================================================');
  console.log(token);
  console.log('==================================================');
} else {
  console.error('❌ No user logged in!');
}
```

4. **Copy the token** from the console output (the long string between the lines)

5. **In your terminal**, test with:

```bash
export FIREBASE_TOKEN="<paste-token-here>"

curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{"messages":[{"role":"user","content":"Say hello in exactly 3 words"}]}'
```

## Expected Response

```json
{
  "message": {
    "role": "assistant",
    "content": "Hello there friend!",
    "tool_calls": []
  }
}
```

## Alternative: One-Line Version

If you want even simpler, just run this and select/copy the output:

```javascript
(async()=>{const{auth}=await import('/src/services/firebase.js');const t=await auth.currentUser.getIdToken();console.log('TOKEN:',t);return t})()
```

Then copy the token that appears after "TOKEN:"

## Test Script (After Getting Token)

Create a file `test-with-token.sh`:

```bash
#!/bin/bash

if [ -z "$FIREBASE_TOKEN" ]; then
  echo "❌ FIREBASE_TOKEN not set!"
  echo "First, get your token from browser console, then:"
  echo "export FIREBASE_TOKEN='your-token-here'"
  exit 1
fi

echo "Testing with your Firebase token..."
echo ""

curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in exactly 3 words"}
    ]
  }' | jq .

echo ""
echo "✅ If you see an assistant message above, it works!"
```

Then:
```bash
chmod +x test-with-token.sh
export FIREBASE_TOKEN='your-token-here'
./test-with-token.sh
```

