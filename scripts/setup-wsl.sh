#!/usr/bin/env bash
# One-time setup for a local Windows 10/11 install (runs INSIDE WSL Ubuntu). Called by windows\2-setup.bat.
# Installs system packages, Node 20, browsers for HyperFrames/Playwright, then the normal scripts/setup.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "=== bang-motion: setup WSL (Ubuntu) di $ROOT ==="

echo "→ Paket sistem (minta password Ubuntu sekali)"
sudo apt-get update -q
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q \
  python3 python3-pip python3-venv python3-requests python3-fonttools python3-brotli \
  ffmpeg git curl ca-certificates build-essential pkg-config libpango1.0-dev libcairo2-dev \
  fonts-jetbrains-mono fonts-noto-color-emoji unzip

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "→ Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -q nodejs
fi
echo "  node $(node -v), python $(python3 -V | cut -d' ' -f2)"

echo "→ Playwright + Chromium (rekam layar mode 4 & QA gambar)"
[ -d scripts/node_modules/playwright ] || npm install --prefix scripts --no-audit --no-fund --silent playwright
npx --prefix scripts playwright install --with-deps chromium chromium-headless-shell

echo "→ Setup utama (Remotion, HyperFrames, Manim, audio, gaya Lemo, sampel musik ~700 MB)"
bash scripts/setup.sh

echo "→ Browser HyperFrames"
(cd hyperframes && npx hyperframes browser ensure) || echo "  WARN: hyperframes browser ensure gagal (dicoba lagi saat render)"

[ -f .env ] || { cp .env.example .env; echo "→ .env dibuat dari .env.example — ISI CARTESIA_API_KEY dll."; }
echo "=== Selesai. Buka folder ini di Antigravity. ==="
