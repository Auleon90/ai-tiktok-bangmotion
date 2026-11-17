---
description: Generate a ~60 s TikTok motion-graphic MP4 with Indonesian voice-over (storyboard → approval → render mode → QA → render)
---
1. Run `bash scripts/setup.sh` once per machine (skip if already done).
2. Read `.claude/skills/bang-motion/SKILL.md` fully and follow its Flow section with the user's topic.
3. Write `output/storyboard.json`, show the approval summary in chat, wait for "Lanjutkan" or a revision.
4. Ask which render mode (HyperFrames / Remotion / Manim / Lemo native / Auto) unless the user already said.
5. Run `python3 scripts/produce.py output/storyboard.json output/final.mp4 <engine flags> --check-only`, read `output/qa_precheck.md`
   and look at `output/qa_prerender.jpg`; fix and repeat until it passes.
6. Render without `--check-only`, read `output/qa_report.md`, and give the user `output/final.mp4`.
