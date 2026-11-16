@echo off
REM Jalankan perintah Linux (WSL Ubuntu) di folder project ini.
REM Contoh:  bm.cmd python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render
wsl.exe -- bash -lc "cd \"$(wslpath '%~dp0.')\" && %*"
