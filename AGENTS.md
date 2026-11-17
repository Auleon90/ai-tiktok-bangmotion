# Agent instructions (Antigravity, Codex, other agents)

This repo's rules live in `CLAUDE.md` (Indonesian) and the full workflow in `.claude/skills/bang-motion/SKILL.md`.
Read both before any task. When the user asks for a video (or types `/bang-motion`), follow SKILL.md step by step:
idea → storyboard (`output/storyboard.json`) → approval in chat → ask the render mode → pre-render QA (`--check-only`) → render → report
`output/final.mp4`. Where SKILL.md names Claude Code tools, use chat instead: `AskUserQuestion` = ask the choices in chat,
`SendUserFile` = give the path. Local setup and keys: `LOCAL_SETUP.md` (`.env`).
