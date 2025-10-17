#!/bin/bash

# Quick local test of openaiChat function
# Tests basic functionality without OpenAI call first

set -e

FUNCTION_URL="http://127.0.0.1:5001/collabcanvas-81fdb/us-central1/openaiChat"

echo "================================"
echo "OpenAI Function Local Test"
echo "================================"
echo ""

# Check if emulator is running
if ! curl -s "$FUNCTION_URL" -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    echo "❌ Emulator not responding at $FUNCTION_URL"
    echo "Start with: firebase emulators:start --only functions"
    exit 1
fi

echo "✅ Emulator is running"
echo ""

# Test 1: Missing auth token (should return 401)
echo "Test 1: Missing auth token"
echo "---"
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}')

if echo "$RESPONSE" | grep -q "Unauthorized"; then
    echo "✅ Correctly rejected unauthorized request"
else
    echo "❌ Expected 401, got: $RESPONSE"
fi
echo ""

# Test 2: Invalid body (should return 400)
echo "Test 2: Invalid request body"
echo "---"
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token-for-testing" \
  -d '{"invalid":"body"}')

if echo "$RESPONSE" | grep -q "array"; then
    echo "✅ Correctly validated request body"
else
    echo "⚠️  Response: $RESPONSE"
fi
echo ""

# Test 3: CORS preflight
echo "Test 3: CORS preflight (OPTIONS)"
echo "---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$FUNCTION_URL" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST")

if [ "$HTTP_CODE" = "204" ]; then
    echo "✅ CORS preflight working (204)"
else
    echo "⚠️  Got HTTP $HTTP_CODE (expected 204)"
fi
echo ""

echo "================================"
echo "Basic tests complete!"
echo ""
echo "To test with real OpenAI API:"
echo "1. Login to your app at http://localhost:5173"
echo "2. Open DevTools console"
echo "3. Run: const token = await firebase.auth().currentUser.getIdToken()"
echo "4. Run: export FIREBASE_TOKEN='<paste-token>'"
echo "5. Run this test with token:"
echo ""
echo "   curl -X POST $FUNCTION_URL \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer \$FIREBASE_TOKEN' \\"
echo "     -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Say hi in 3 words\"}]}'"
echo ""
echo "================================"

