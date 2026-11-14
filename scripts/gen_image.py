#!/usr/bin/env python3
"""Optional AI illustration step: FLUX.1 schnell on Cloudflare Workers AI (free daily quota).

Usage: python3 gen_image.py "<prompt>" out.jpg [--steps=6]
Env:   CF_ACCOUNT_ID (Cloudflare account id). The API token is injected by the session's
       network proxy for api.cloudflare.com, so no token variable is needed here.

Output: 1024x1024 JPEG. Scenes use it full-bleed (cover) with a slow Ken Burns move.
Cost ~58 neurons/image at 4 steps (free plan: 10,000 neurons/day, resets 00:00 UTC).
"""
import base64, json, os, sys, requests

MODEL = "@cf/black-forest-labs/flux-1-schnell"


def generate(prompt: str, out: str, steps: int = 6):
    acct = os.environ.get("CF_ACCOUNT_ID", "")
    if not acct:
        sys.exit("ERROR: CF_ACCOUNT_ID not set")
    url = f"https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/{MODEL}"
    headers = {"Content-Type": "application/json", "Authorization": "Bearer " + os.environ.get("CF_API_TOKEN", "proxy-injected")}
    r = requests.post(url, headers=headers, json={"prompt": prompt, "steps": max(1, min(8, steps))}, timeout=120)
    try:
        d = r.json()
    except ValueError:
        sys.exit(f"ERROR Cloudflare {r.status_code}: {r.text[:300]}")
    if not d.get("success"):
        errs = d.get("errors")
        if any(e.get("code") == 3036 for e in errs or []):
            sys.exit("ERROR: Cloudflare daily free quota exhausted (resets 00:00 UTC / 07:00 WIB)")
        sys.exit(f"ERROR Cloudflare {r.status_code}: {errs}")
    with open(out, "wb") as f:
        f.write(base64.b64decode(d["result"]["image"]))
    print(f"OK  {out}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    steps = int(next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("--steps=")), 6))
    if len(args) < 2:
        sys.exit(__doc__)
    generate(args[0], args[1], steps)
