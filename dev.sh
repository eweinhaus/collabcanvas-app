#!/bin/bash
# Helper script to start dev server with correct Node.js version

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use correct Node version
nvm use

# Start dev server
npm run dev


