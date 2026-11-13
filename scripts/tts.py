#!/usr/bin/env python3
"""Cartesia TTS — text to MP3 file.
Usage: python3 tts.py "<text>" output.mp3 [voice_id]
Env:   CARTESIA_API_KEY
"""
import sys, os, json, requests

API_KEY  = os.environ.get("CARTESIA_API_KEY", "")
ENDPOINT = "https://api.cartesia.ai/tts/bytes"
VERSION  = "2024-06-10"

# Default: Barbershop Man (multilingual, good Indonesian accent)
# User can override with 3rd arg or CARTESIA_VOICE_ID env
DEFAULT_VOICE = os.environ.get("CARTESIA_VOICE_ID", "694f9389-aac1-45b6-b726-9d9369183238")

def tts(text: str, out_file: str, voice_id: str = DEFAULT_VOICE):
    if not API_KEY:
        sys.exit("ERROR: CARTESIA_API_KEY not set. Run: export CARTESIA_API_KEY=your_key")

    payload = {
        "model_id": "sonic-latest",
        "transcript": text,
        "voice": {"mode": "id", "id": voice_id},
        "output_format": {
            "container": "mp3",
            "encoding": "mp3",
            "sample_rate": 44100
        }
    }

    r = requests.post(
        ENDPOINT,
        headers={
            "X-API-Key": API_KEY,
            "Cartesia-Version": VERSION,
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=60
    )

    if r.status_code != 200:
        sys.exit(f"ERROR Cartesia {r.status_code}: {r.text[:300]}")

    with open(out_file, "wb") as f:
        f.write(r.content)

    print(f"OK  {out_file}  ({len(r.content)//1024} KB)")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("Usage: tts.py <text> <output.mp3> [voice_id]")
    voice = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_VOICE
    tts(sys.argv[1], sys.argv[2], voice)
