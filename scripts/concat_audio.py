#!/usr/bin/env python3
"""Concatenate MP3 segments with optional silence gap between them.
Usage: python3 concat_audio.py out.mp3 gap_ms seg1.mp3 seg2.mp3 ...
Requires: ffmpeg on PATH
"""
import sys, subprocess, os, tempfile

def concat(out: str, gap_ms: int, segments: list[str]):
    # Build ffmpeg concat filter
    # Each segment gets a silence pad of gap_ms after it
    inputs = []
    filter_parts = []

    for i, seg in enumerate(segments):
        inputs += ["-i", seg]
        filter_parts.append(f"[{i}:a]")

    # apad adds silence at the end of each segment
    gap_s = gap_ms / 1000
    pads = []
    for i, seg in enumerate(segments):
        pads.append(f"[{i}:a]apad=pad_dur={gap_s}[p{i}]")

    concat_in = "".join(f"[p{i}]" for i in range(len(segments)))
    filter_str = ";".join(pads) + f";{concat_in}concat=n={len(segments)}:v=0:a=1[out]"

    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_str,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-q:a", "2",
        out
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"ffmpeg error:\n{result.stderr[-600:]}")
    print(f"OK  {out}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit("Usage: concat_audio.py out.mp3 gap_ms seg1.mp3 ...")
    concat(sys.argv[1], int(sys.argv[2]), sys.argv[3:])
