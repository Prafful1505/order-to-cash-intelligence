@echo off
echo Starting Dodge AI...

:: Start backend
start "Dodge AI Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

:: Start frontend
start "Dodge AI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API docs: http://localhost:8000/docs
echo.
echo Both servers are starting in separate windows.
pause
