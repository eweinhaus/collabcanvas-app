#!/bin/bash

# Script to replace console statements with logger calls
# Usage: ./fix-console-statements.sh

# Find all .js and .jsx files and replace console statements
# But skip test files, node_modules, dist, and the logger file itself

find src -type f \( -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/__tests__/*" \
  ! -path "*/logger.js" \
  -exec sed -i '' \
  -e 's/console\.log(\[.*\]/logger.debug(/g' \
  -e 's/console\.error(\[.*\]/logger.error(/g' \
  -e 's/console\.warn(\[.*\]/logger.warn(/g' \
  -e 's/console\.info(\[.*\]/logger.info(/g' \
  {} +

echo "Console statement cleanup complete!"
echo "Note: You may need to add logger imports manually where missing."

