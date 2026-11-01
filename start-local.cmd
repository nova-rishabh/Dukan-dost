@echo off
rem Starts the WhatsApp service and the app, each in its own window. Close the windows to stop them.
cd /d "%~dp0"
start "WhatsApp service (127.0.0.1:3001)" cmd /k pnpm wa:start
start "Dukaan Dost (127.0.0.1:3000)" cmd /k pnpm exec next start -H 127.0.0.1 -p 3000
echo Open http://localhost:3000 in your browser.
