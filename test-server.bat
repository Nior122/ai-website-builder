@echo off
cd /d "c:\Users\PC\Desktop\ai website generator"
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting dev server...
call npm run dev
