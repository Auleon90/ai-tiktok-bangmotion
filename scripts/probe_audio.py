#!/usr/bin/env python3
"""Print duration of an audio file in milliseconds via ffprobe."""
import sys, subprocess, json

def probe_ms(path: str) -> int:
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", path],
        capture_output=True, text=True
    )
    data = json.loads(r.stdout)
    for stream in data.get("streams", []):
        if "duration" in stream:
            return int(float(stream["duration"]) * 1000)
    return 0

if __name__ == "__main__":
    print(probe_ms(sys.argv[1]))
