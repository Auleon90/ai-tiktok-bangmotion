"""Load KEY=VALUE pairs from <repo>/.env into os.environ (local installs; cloud sessions already have the env set).
Existing environment variables always win. Imported for its side effect by produce.py, tts.py and gen_image.py."""
import os

_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(_path):
    for line in open(_path, encoding="utf-8-sig"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v and k not in os.environ:
            os.environ[k] = v
