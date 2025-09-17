@echo off
echo ================================
echo   Quick Server Update
echo ================================
echo.

echo Uploading server.js to VPS...
scp server-backend\server.js root@45.77.86.20:/opt/magic-school-api/server.js

if %ERRORLEVEL% NEQ 0 (
    echo Upload failed!
    pause
    exit /b 1
)

echo Restarting PM2 service...
ssh root@45.77.86.20 "cd /opt/magic-school-api && pm2 restart magic-school-api && pm2 status"

echo.
echo ================================
echo   Update Complete!
echo ================================
echo.
echo Testing API endpoints...
echo.

pause