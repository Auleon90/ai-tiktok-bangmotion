#!/usr/bin/env python3
"""Cartesia TTS (sonic-3, SSE) -> MP3 + per-word timestamps.

Usage: python3 tts.py "<text>" output.mp3 [voice_id]
Env:   CARTESIA_API_KEY, CARTESIA_VOICE_ID (optional)

Writes:
  output.mp3          audio, leading/trailing silence trimmed
  output.words.json   {"duration_ms": int, "words": [{"text", "start_ms", "end_ms"}]}

Note: sonic-2 rejects language "id"; sonic-3 supports Indonesian and timestamps.
"""
import sys, os, json, base64, subprocess, requests

API_KEY  = os.environ.get("CARTESIA_API_KEY", "")
ENDPOINT = "https://api.cartesia.ai/tts/sse"
VERSION  = os.environ.get("CARTESIA_VERSION", "2025-04-16")
MODEL    = os.environ.get("CARTESIA_MODEL", "sonic-3")
RATE     = 44100
BYTES_PER_SAMPLE = 2  # pcm_s16le mono
LEAD_PAD_S  = 0.12    # silence kept before first word
TRAIL_PAD_S = 0.25    # silence kept after last word

DEFAULT_VOICE = os.environ.get("CARTESIA_VOICE_ID", "694f9389-aac1-45b6-b726-9d9369183238")


def tts(text: str, out_file: str, voice_id: str = DEFAULT_VOICE):
    if not API_KEY:
        sys.exit("ERROR: CARTESIA_API_KEY not set.")

    payload = {
        "model_id": MODEL,
        "transcript": text,
        "voice": {"mode": "id", "id": voice_id},
        "language": "id",
        "add_timestamps": True,
        "output_format": {"container": "raw", "encoding": "pcm_s16le", "sample_rate": RATE},
    }
    gc = {k: v for k, v in {
        "speed": os.environ.get("CARTESIA_SPEED"), "volume": os.environ.get("CARTESIA_VOLUME"),
        "emotion": os.environ.get("CARTESIA_EMOTION")}.items() if v}
    if gc:
        for k in ("speed", "volume"):
            if k in gc: gc[k] = float(gc[k])
        payload["generation_config"] = gc
    r = requests.post(
        ENDPOINT,
        headers={"X-API-Key": API_KEY, "Cartesia-Version": VERSION, "Content-Type": "application/json"},
        json=payload, stream=True, timeout=120,
    )
    if r.status_code != 200:
        sys.exit(f"ERROR Cartesia {r.status_code}: {r.text[:300]}")

    pcm = bytearray()
    words = []
    for raw in r.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data:"):
            continue
        msg = json.loads(raw[5:].strip())
        if msg.get("type") == "error" or msg.get("error"):
            sys.exit(f"ERROR Cartesia stream: {msg}")
        if msg.get("type") == "chunk" and msg.get("data"):
            pcm += base64.b64decode(msg["data"])
        wt = msg.get("word_timestamps")
        if wt:
            for w, s, e in zip(wt["words"], wt["start"], wt["end"]):
                words.append({"text": w, "start": s, "end": e})

    if not pcm:
        sys.exit("ERROR: no audio received")

    total_s = len(pcm) / (RATE * BYTES_PER_SAMPLE)
    cut_start = max(0.0, words[0]["start"] - LEAD_PAD_S) if words else 0.0
    cut_end = min(total_s, words[-1]["end"] + TRAIL_PAD_S) if words else total_s
    a = int(cut_start * RATE) * BYTES_PER_SAMPLE
    b = int(cut_end * RATE) * BYTES_PER_SAMPLE
    pcm = pcm[a:b]

    proc = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(RATE), "-ac", "1",
         "-i", "pipe:0", "-c:a", "libmp3lame", "-q:a", "2", out_file],
        input=bytes(pcm), capture_output=True,
    )
    if proc.returncode != 0:
        sys.exit(f"ffmpeg error: {proc.stderr.decode()[-400:]}")

    duration_ms = round(len(pcm) / (RATE * BYTES_PER_SAMPLE) * 1000)
    out_words = [
        {"text": w["text"],
         "start_ms": round((w["start"] - cut_start) * 1000),
         "end_ms": round((w["end"] - cut_start) * 1000)}
        for w in words
    ]
    side = os.path.splitext(out_file)[0] + ".words.json"
    with open(side, "w") as f:
        json.dump({"duration_ms": duration_ms, "words": out_words}, f, ensure_ascii=False, indent=1)

    print(f"OK  {out_file}  {duration_ms} ms  {len(out_words)} words")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("Usage: tts.py <text> <output.mp3> [voice_id]")
    tts(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else DEFAULT_VOICE)
