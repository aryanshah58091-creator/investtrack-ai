@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo Starting InvestTrack AI (Full-Stack Platform)
echo ===================================================

start "InvestTrack AI Backend (Django)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe manage.py runserver 8000"
timeout /t 2 /nobreak >nul
start "InvestTrack AI Frontend (Vite React)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173/

echo.
echo InvestTrack AI is running!
echo - Backend API: http://localhost:8000/api/v1/
echo - Admin Panel: http://localhost:8000/admin/
echo - Frontend UI: http://localhost:5173/
echo ===================================================
pause
