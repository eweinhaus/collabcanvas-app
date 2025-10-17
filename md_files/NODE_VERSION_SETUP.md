# Node.js Version Setup for CollabCanvas

## Quick Start

This project requires **Node.js v20.19.0 or higher** (or v22.12.0+).

### Option 1: Use the Helper Script (Easiest)
```bash
cd collabcanvas-app
./dev.sh
```

### Option 2: Use nvm Manually
```bash
# Load nvm and use correct version
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use

# Then run your command
npm run dev
```

## One-Time Setup (Recommended)

Add these lines to your shell profile (`~/.bash_profile`, `~/.zshrc`, or `~/.bashrc`):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Auto-switch Node version when entering directories with .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

After adding this, restart your terminal or run:
```bash
source ~/.zshrc  # or ~/.bash_profile or ~/.bashrc
```

## Why Do I Need This?

Vite 7 requires Node.js v20.19.0+ because it uses the newer `crypto.hash()` API. Using an older version will cause this error:

```
TypeError: crypto.hash is not a function
```

## Verification

Check your current Node.js version:
```bash
node --version
# Should output: v20.19.0
```

## Available Commands

```bash
npm run dev      # Start development server
npm test         # Run tests
npm run build    # Build for production
npm run lint     # Run linter
```

## Troubleshooting

**Problem:** Still getting `crypto.hash is not a function` error?

**Solution:** Make sure you've activated nvm in your current terminal session:
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use
```


