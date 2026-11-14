#!/usr/bin/env bash
# One-time setup for bang-motion pipeline
set -euo pipefail

echo "=== bang-motion setup ==="

# Python deps
echo "→ Installing Python dependencies..."
pip install requests --quiet

# Node dep check (playwright is pre-installed in cloud container)
echo "→ Checking Node / Playwright..."
node -e "require('playwright')" 2>/dev/null \
  && echo "  playwright: OK" \
  || { echo "  playwright not found, installing..."; npm install playwright --no-save; }

# Remotion deps
echo "→ Installing Remotion dependencies..."
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ ! -d "$ROOT/remotion/node_modules" ]; then
  (cd "$ROOT/remotion" && npm install --no-audit --no-fund --silent)
fi
echo "  remotion: OK"

# ffmpeg check
echo "→ Checking ffmpeg..."
ffmpeg -version 2>&1 | head -1

echo ""
echo "=== Setup complete ==="
echo ""
echo "Set your Cartesia API key:"
echo "  export CARTESIA_API_KEY=your_key_here"
echo ""
echo "Optional — set a custom voice ID:"
echo "  export CARTESIA_VOICE_ID=your_voice_id"
echo ""
echo "Then use the skill: /bang-motion [your prompt]"
