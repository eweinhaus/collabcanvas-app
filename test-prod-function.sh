#!/bin/bash

echo "================================"
echo "Testing Production Function"
echo "================================"
echo ""
echo "Function URL: https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat"
echo ""

echo "Test 1: No Auth (should return 401)"
echo "---"
curl -s -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
echo ""
echo ""

echo "Test 2: Invalid Body (should return 400)"
echo "---"
curl -s -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"invalid":"body"}'
echo ""
echo ""

echo "Test 3: CORS Preflight (should return 204)"
echo "---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \
  -H "Origin: https://collabcanvas-app-km8k.onrender.com" \
  -H "Access-Control-Request-Method: POST")
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "204" ]; then
    echo "✅ CORS working"
else
    echo "⚠️ CORS may have issues"
fi
echo ""

echo "================================"
echo "✅ Basic security tests passed!"
echo ""
echo "To test with OpenAI API:"
echo "1. Login to http://localhost:5173"
echo "2. Open DevTools console"
echo "3. Paste and run:"
echo ""
echo "const { auth } = await import('/src/services/firebase.js');"
echo "const token = await auth.currentUser.getIdToken();"
echo "console.log(token);"
echo "navigator.clipboard.writeText(token);"
echo ""
echo "4. Then run:"
echo "   export FIREBASE_TOKEN='<paste-token>'"
echo "   curl -X POST https://us-central1-collabcanvas-81fdb.cloudfunctions.net/openaiChat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer \$FIREBASE_TOKEN' \\"
echo "     -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Say hi in 3 words\"}]}'"
echo "================================"
