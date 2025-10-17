#!/bin/bash

if [ -z "$FIREBASE_TOKEN" ]; then
  echo "❌ FIREBASE_TOKEN not set!"
  echo ""
  echo "First, get your token from browser:"
  echo "1. Login to http://localhost:5173"
  echo "2. Open DevTools Console"
  echo "3. Run: const { auth } = await import('/src/services/firebase.js'); console.log(await auth.currentUser.getIdToken());"
  echo "4. Copy the token"
  echo "5. Run: export FIREBASE_TOKEN='your-token-here'"
  echo "6. Run this script again"
  exit 1
fi

echo "🧪 Testing Production Function with Firebase Token..."
echo ""
echo "URL: https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat"
echo ""

RESPONSE=$(curl -s -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in exactly 3 words"}
    ]
  }')

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "assistant"; then
  echo "✅ SUCCESS! OpenAI integration working!"
else
  echo "⚠️  Check response above for errors"
fi
