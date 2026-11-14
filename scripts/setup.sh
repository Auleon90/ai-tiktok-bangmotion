#!/usr/bin/env bash
# Idempotent setup for all bang-motion modes (run once per new session).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "=== bang-motion setup ==="

echo "→ Python deps (requests, fonttools)"
pip install -q requests fonttools brotli 2>/dev/null || pip install -q --break-system-packages requests fonttools brotli

echo "→ Remotion (mode 2)"
[ -d "$ROOT/remotion/node_modules" ] || (cd "$ROOT/remotion" && npm install --no-audit --no-fund --silent)

echo "→ HyperFrames + GSAP + lottie-web (mode 1)"
[ -d "$ROOT/hyperframes/node_modules" ] || (cd "$ROOT/hyperframes" && npm install --no-audit --no-fund --silent)

echo "→ Manim venv (mode 3)"
if [ ! -x "$ROOT/.venv-manim/bin/manim" ]; then
  if ! pkg-config --exists pangocairo 2>/dev/null; then
    (apt-get install -y -q libpango1.0-dev pkg-config >/dev/null 2>&1 || (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q libpango1.0-dev pkg-config >/dev/null 2>&1)) || echo "  WARN: could not install pango dev libs"
  fi
  python3 -m venv "$ROOT/.venv-manim"
  "$ROOT/.venv-manim/bin/pip" install -q --upgrade pip setuptools wheel
  "$ROOT/.venv-manim/bin/pip" install -q manim==0.19.0 fonttools brotli || echo "  WARN: manim install failed (mode 3 unavailable)"
fi

echo "→ Audio venv (music + SFX, audio/lemo)"
if [ ! -x "$ROOT/.venv-audio/bin/python" ]; then
  python3 -m venv "$ROOT/.venv-audio"
  "$ROOT/.venv-audio/bin/pip" install -q numpy scipy soundfile numba || echo "  WARN: audio venv failed (no music/SFX)"
fi

echo "→ Lemo-Opuscar style library (.lemo/, not committed: CC BY-NC docs)"
LEMO="$ROOT/.lemo/lemo-opuscar"
if [ ! -d "$LEMO/styles" ]; then
  mkdir -p "$ROOT/.lemo"
  git clone -q --depth 1 --filter=blob:none --sparse https://github.com/lemomo-ai/lemo-opuscar.git "$LEMO" \
    && (cd "$LEMO" && git sparse-checkout set --no-cone '/styles/*/STYLE.md' '/styles/*/style.json' '/styles/*/poster.jpg' '/LICENSE' '/DIRECTOR.md') \
    || echo "  WARN: style library download failed"
fi
[ -d "$LEMO/styles" ] && echo "  styles: $(ls "$LEMO/styles" | wc -l)"

echo "→ Lottie assets"
[ -n "$(ls -A "$ROOT/assets/lottie" 2>/dev/null)" ] || python3 "$ROOT/scripts/make_lottie.py"

echo "→ ffmpeg: $(ffmpeg -version 2>&1 | head -1 | cut -d' ' -f1-3)"
[ -n "${CARTESIA_API_KEY:-}" ] && echo "→ CARTESIA_API_KEY: set" || echo "→ CARTESIA_API_KEY: MISSING"
[ -n "${CF_ACCOUNT_ID:-}" ] && echo "→ CF_ACCOUNT_ID: set (AI images available)" || echo "→ CF_ACCOUNT_ID: missing (AI images unavailable)"
echo "=== Setup complete ==="
