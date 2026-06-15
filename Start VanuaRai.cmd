@echo off
REM VanuaRai dev stack launcher.
REM Runs in its OWN terminal window, independent of any Claude Code session,
REM so the API (:3000) and web (:5173) stay up until you close this window.
cd /d "%~dp0"
title VanuaRai Dev  (API :3000  +  web :5173)
echo ============================================================
echo   VanuaRai dev stack
echo     API : http://localhost:3000
echo     Web : http://localhost:5173
echo.
echo   Keep this window open. Press Ctrl+C (twice) to stop.
echo   If you see "Port 5173 is already in use", close the
echo   other app using it (e.g. another project) and re-run.
echo ============================================================
echo.
call npm run dev
echo.
echo === dev stack stopped (exit code %errorlevel%) ===
pause
