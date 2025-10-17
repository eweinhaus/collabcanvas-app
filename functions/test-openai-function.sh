#!/bin/bash

# Test script for openaiChat Firebase Function
# This script tests the function locally with the Firebase emulator

echo "=== OpenAI Function Test Script ==="
echo ""

# Check if emulator is running
if ! curl -s http://localhost:5001 > /dev/null 2>&1; then
    echo "❌ Firebase emulator not running!"
    echo "Start it with: firebase emulators:start --only functions"
    exit 1
fi

echo "✅ Firebase emulator is running"
echo ""

# Set test variables
PROJECT_ID="collabcanvas-81fdb"
FUNCTION_URL="http://localhost:5001/${PROJECT_ID}/us-central1/openaiChat"

# Get Firebase ID token (you need to get this from your app after logging in)
# Instructions:
# 1. Open your app in browser and login
# 2. Open console and run: await firebase.auth().currentUser.getIdToken()
# 3. Copy the token and export it: export FIREBASE_ID_TOKEN="your-token-here"

if [ -z "$FIREBASE_ID_TOKEN" ]; then
    echo "⚠️  FIREBASE_ID_TOKEN not set"
    echo "To get a token:"
    echo "  1. Login to your app in browser"
    echo "  2. Open DevTools console"
    echo "  3. Run: await firebase.auth().currentUser.getIdToken()"
    echo "  4. Copy token and run: export FIREBASE_ID_TOKEN='<token>'"
    echo ""
    echo "For now, testing without token (should return 401)..."
    TOKEN=""
else
    echo "✅ Using provided FIREBASE_ID_TOKEN"
    TOKEN="-H \"Authorization: Bearer $FIREBASE_ID_TOKEN\""
fi

echo ""
echo "Testing function at: $FUNCTION_URL"
echo ""

# Test 1: Missing token (should return 401)
echo "Test 1: Request without token (should return 401)"
echo "---"
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }' | jq '.' || echo "Response not JSON"
echo ""
echo ""

# Test 2: Invalid body (should return 400)
echo "Test 2: Invalid request body (should return 400)"
echo "---"
eval curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  $TOKEN \
  -d '{
    "invalid": "body"
  }' | jq '.' || echo "Response not JSON"
echo ""
echo ""

# Test 3: Valid request (requires token and OpenAI API key)
if [ -n "$FIREBASE_ID_TOKEN" ]; then
    echo "Test 3: Valid request with token (requires OpenAI API key configured)"
    echo "---"
    eval curl -s -X POST "$FUNCTION_URL" \
      -H "Content-Type: application/json" \
      $TOKEN \
      -d '{
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": "Say hello in 5 words or less"}
        ]
      }' | jq '.' || echo "Response not JSON"
    echo ""
    echo ""
else
    echo "Test 3: Skipped (no token provided)"
    echo ""
fi

# Test 4: CORS preflight
echo "Test 4: CORS preflight request (OPTIONS)"
echo "---"
curl -s -X OPTIONS "$FUNCTION_URL" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -i | head -20
echo ""

echo "=== Test Complete ==="
echo ""
echo "Expected results:"
echo "  Test 1: 401 Unauthorized (missing token)"
echo "  Test 2: 400 Bad Request (invalid body)"
echo "  Test 3: 200 OK with assistant message OR 500 if no OpenAI key"
echo "  Test 4: 204 No Content with CORS headers"

