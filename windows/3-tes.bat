@echo off
REM LANGKAH 3 — tes cepat: membuat video contoh pythagoras (mode Manim) ke output\final.mp4
cd /d "%~dp0.."
wsl.exe -- bash -lc "cd \"$(wslpath '%CD%')\" && python3 scripts/produce.py examples/pythagoras.storyboard.json output/final.mp4 --engine=manim --scene=examples/pythagoras_manim.py --draft"
if exist output\final.mp4 (start "" output\final.mp4) else (echo Tes gagal — lihat pesan di atas.)
pause
