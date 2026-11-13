#!/usr/bin/env bash
# Mux video + audio → final MP4 (1080×1920, H.264, AAC)
# Usage: ./mux.sh <video.webm> <audio.mp3> <output.mp4>
set -euo pipefail

VIDEO="$1"
AUDIO="$2"
OUTPUT="$3"

if [[ -z "$VIDEO" || -z "$AUDIO" || -z "$OUTPUT" ]]; then
  echo "Usage: mux.sh <video.webm> <audio.mp3> <output.mp4>"
  exit 1
fi

ffmpeg -y \
  -i "$VIDEO" \
  -i "$AUDIO" \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  -c:a aac \
  -b:a 192k \
  -shortest \
  -movflags +faststart \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" \
  "$OUTPUT"

echo "OK  $OUTPUT  ($(du -h "$OUTPUT" | cut -f1))"
