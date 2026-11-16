@echo off
REM LANGKAH 2 — dobel klik. Memasang semua kebutuhan di Ubuntu (WSL). Butuh internet, 15-40 menit.
cd /d "%~dp0.."
wsl.exe -- bash -lc "cd \"$(wslpath '%CD%')\" && bash scripts/setup-wsl.sh"
echo.
if not exist .env copy .env.example .env >nul
echo Buka file .env dengan Notepad dan isi CARTESIA_API_KEY (dan CF_ACCOUNT_ID / CF_API_TOKEN bila ingin gambar AI).
start notepad .env
pause
