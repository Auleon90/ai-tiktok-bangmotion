"""Build ONE preview image per available style (docs/styles/<id>.jpg) + docs/styles/index.json.
Run once (or when a style is added): python3 scripts/style_previews.py [only-id ...]
The style picker after storyboard approval shows these files; nothing is generated at pick time."""
import json, os, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(R, "docs", "styles"); TMP = os.path.join(R, "output", "preview"); os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
SAMPLE = [
 {"id": 1, "type": "headline", "eyebrow": "Contoh gaya", "headline": "Bersama kesulitan ada kemudahan", "sub": "QS. Al-Insyirah: 5–6",
  "vo": "Allah tidak bilang setelah kesulitan. Yang Allah bilang, bersama kesulitan."},
 {"id": 2, "type": "ayat", "arabic": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", "translation": "Maka sesungguhnya bersama kesulitan ada kemudahan.",
  "ref": "QS. Al-Insyirah: 5", "vo": "Maka sesungguhnya bersama kesulitan, ada kemudahan."}]
DIAGRAM = [{"shape": "circle", "cx": 500, "cy": 220, "r": 120, "role": "fireSoft", "at": .05}, {"shape": "text", "x": 500, "y": 235, "text": "kesulitan", "size": 52, "at": .08},
 {"shape": "arrow", "pts": [[440, 350], [260, 560]], "role": "accent", "at": .25}, {"shape": "arrow", "pts": [[560, 350], [740, 560]], "role": "accent", "at": .3},
 {"shape": "circle", "cx": 240, "cy": 680, "r": 120, "role": "airSoft", "at": .35}, {"shape": "text", "x": 240, "y": 695, "text": "kemudahan", "size": 46, "at": .38},
 {"shape": "circle", "cx": 760, "cy": 680, "r": 120, "role": "airSoft", "at": .45}, {"shape": "text", "x": 760, "y": 695, "text": "kemudahan", "size": 46, "at": .48}]
DISABLED_LEMO = {"tilt-shift", "brick-toy"}

def styles():
    L = []
    kits = json.load(open(os.path.join(R, "lemo", "kits", "kits.json")))
    for k, v in kits.items():
        if k not in DISABLED_LEMO: L.append(dict(id="lemo-" + k, engine="lemo", style=k, name=v["name"], themes=", ".join(v.get("themes", []))))
    bang = json.load(open(os.path.join(R, "hyperframes", "bang", "styles.json")))
    for k, v in bang.items():
        if k.startswith("_") or not os.path.exists(os.path.join(R, "hyperframes", "bang", k + ".hf.html")): continue
        L.append(dict(id="bang-" + k, engine="hyperframes", style="bang:" + k, name=(v.get("name") if isinstance(v, dict) else None) or k,
                      themes=(v.get("use") or v.get("themes") or v.get("desc") or "") if isinstance(v, dict) else ""))
    L.append(dict(id="remotion", engine="remotion", style="", name="Remotion + Lottie", themes="kualitas tertinggi, sirah dengan peta"))
    L.append(dict(id="manim", engine="manim", style="", name="Manim", themes="matematika, fisika, rumus, grafik"))
    return L

def render(s):
    sb = {"title": s["name"], "music": "none", "ambience": "none", "sfx": False, "scenes": json.loads(json.dumps(SAMPLE))}
    cmd_extra = []
    if s["engine"] == "manim":
        sb = json.load(open(os.path.join(R, "examples", "pythagoras.storyboard.json"))); cmd_extra = ["--engine=manim", "--scene=" + os.path.join(R, "examples", "pythagoras_manim.py")]
    elif s["engine"] == "lemo": sb["style"] = s["style"]; cmd_extra = ["--engine=lemo"]
    elif s["engine"] == "hyperframes":
        sb["style"] = s["style"]; sb["scenes"][0].update(type="diagram", headline="1 kesulitan, *2 kemudahan*", diagram={"parts": DIAGRAM}); cmd_extra = ["--engine=hyperframes", "--html=" + os.path.join(R, "hyperframes", "bang", s["style"][5:] + ".hf.html")]
    p = os.path.join(TMP, s["id"] + ".json"); json.dump(sb, open(p, "w"), ensure_ascii=False)
    mp4 = os.path.join(TMP, s["id"] + ".mp4")
    r = subprocess.run(["python3", os.path.join(R, "scripts", "produce.py"), p, mp4, "--draft", "--accept-qa", "--no-qa", *cmd_extra], cwd=R, capture_output=True, text=True)
    if r.returncode or not os.path.exists(mp4): print("FAIL", s["id"], r.stdout[-600:], r.stderr[-600:]); return False
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], capture_output=True, text=True).stdout)
    t1, t2 = (dur * .3, dur * .7) if s["engine"] == "manim" else (dur * .38, dur * .93)
    jpg = os.path.join(OUT, s["id"] + ".jpg")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t1:.2f}", "-i", mp4, "-ss", f"{t2:.2f}", "-i", mp4, "-filter_complex",
                    "[0:v]scale=405:720[a];[1:v]scale=405:720[b];[a][b]hstack=inputs=2:shortest=1[v]", "-map", "[v]", "-frames:v", "1", "-q:v", "4", jpg], check=True)
    return True

if __name__ == "__main__":
    only = set(sys.argv[1:]); idx = []
    for s in styles():
        if not only or s["id"] in only:
            print("STYLE", s["id"], flush=True); s["ok"] = render(s)
        s["image"] = f"docs/styles/{s['id']}.jpg"; idx.append(s)
    idx = [s for s in idx if os.path.exists(os.path.join(R, s["image"]))]
    for s in idx: s.pop("ok", None)
    json.dump(idx, open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False, indent=1)
    print("INDEX", len(idx), "styles")
    # numbered gallery of all previews (5 per row) for the style list message
    from PIL import Image, ImageDraw, ImageFont
    th = [Image.open(os.path.join(R, s["image"])).convert("RGB").resize((405, 360)) for s in idx]
    cols = 5; rows = (len(th) + cols - 1) // cols; G = Image.new("RGB", (cols * 415, rows * 420), "#111")
    try: F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except Exception: F = ImageFont.load_default()
    d = ImageDraw.Draw(G)
    for k, (im, s) in enumerate(zip(th, idx)):
        x, y = (k % cols) * 415 + 5, (k // cols) * 420 + 5; G.paste(im, (x, y)); d.text((x + 4, y + 366), f"{k + 1}. {s['name'].split(' (')[0]}"[:30], fill="#fff", font=F)
    G.save(os.path.join(OUT, "gallery.jpg"), quality=82)
