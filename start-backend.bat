@echo off
setlocal
cd /d "%~dp0backend"
echo Starting InvestTrack AI Backend...
venv\Scripts\python.exe manage.py runserver 8000
