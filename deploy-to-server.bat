@echo off
echo ==========================================
echo      Magic School AI - 后端部署工具
echo      老站长为小白定制的同步脚本
echo ==========================================
echo.

echo 🔄 正在将本地代码同步到服务器...
echo.

REM 上传 server-backend/server.js 到服务器
scp "server-backend/server.js" root@45.77.86.20:/opt/magic-school-api/server.js
if %errorlevel% neq 0 (
    echo ❌ 上传失败！请检查网络连接
    pause
    exit /b 1
)

echo ✅ 代码上传成功！

REM 重启服务
echo 🔄 正在重启服务器...
ssh root@45.77.86.20 "cd /opt/magic-school-api && pm2 restart magic-school-api"
if %errorlevel% neq 0 (
    echo ❌ 服务重启失败！
    pause
    exit /b 1
)

echo ✅ 服务重启成功！
echo.
echo 🎉 部署完成！你的修改已经生效
echo 💡 网站地址：https://www.magicschoolai.net
echo.
echo 📝 使用说明：
echo    1. 在本地修改 server-backend/server.js
echo    2. 运行这个脚本同步到服务器
echo    3. 检查网站是否正常
echo.
pause