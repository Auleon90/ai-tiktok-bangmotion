@echo off
REM LANGKAH 1 — klik kanan > "Run as administrator". Memasang WSL + Ubuntu (sekali saja).
net session >nul 2>&1 || (echo Jalankan file ini dengan klik kanan ^> Run as administrator & pause & exit /b 1)
wsl --install -d Ubuntu
echo.
echo Selesai. RESTART laptop, lalu buka "Ubuntu" dari Start Menu dan buat username + password.
echo Setelah itu jalankan windows\2-setup.bat
pause
