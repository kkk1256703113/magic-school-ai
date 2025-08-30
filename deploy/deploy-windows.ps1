# Magic School AI Windows部署脚本
# 适用于Windows PowerShell环境

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Magic School AI Windows部署工具 v1.0" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 配置
$SERVER_IP = "45.77.86.20"
$SERVER_USER = "root"
$REMOTE_DIR = "/opt/magic-school-api"
$LOCAL_BACKEND_DIR = ".\server-backend"
$LOCAL_SCRIPTS_DIR = ".\server-scripts"

# 检查本地文件
Write-Host "[步骤 1/5] 检查本地文件..." -ForegroundColor Yellow
if (-not (Test-Path $LOCAL_BACKEND_DIR)) {
    Write-Host "错误: 找不到后端代码目录 $LOCAL_BACKEND_DIR" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$LOCAL_BACKEND_DIR\server.js")) {
    Write-Host "错误: 找不到server.js文件" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 本地文件检查通过" -ForegroundColor Green
Write-Host ""

# 创建部署包
Write-Host "[步骤 2/5] 创建部署包..." -ForegroundColor Yellow
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$DEPLOY_PACKAGE = "magic-school-deploy-$TIMESTAMP.tar"

# 使用tar创建压缩包（Windows 10+内置）
$files = @(
    "$LOCAL_BACKEND_DIR\*",
    "$LOCAL_SCRIPTS_DIR\*"
)

# 创建临时目录
$TEMP_DIR = New-TemporaryFile | %{ Remove-Item $_; New-Item -ItemType Directory -Path $_ }
Copy-Item -Path "$LOCAL_BACKEND_DIR\*" -Destination $TEMP_DIR -Recurse
Copy-Item -Path "$LOCAL_SCRIPTS_DIR\*" -Destination $TEMP_DIR -Recurse

# 创建tar包
tar -cf $DEPLOY_PACKAGE -C $TEMP_DIR .
Remove-Item -Path $TEMP_DIR -Recurse -Force

Write-Host "✓ 部署包创建完成: $DEPLOY_PACKAGE" -ForegroundColor Green
Write-Host ""

# 生成部署脚本
Write-Host "[步骤 3/5] 生成远程部署脚本..." -ForegroundColor Yellow
$REMOTE_SCRIPT = @'
#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始部署Magic School AI后端服务...${NC}"

# 创建项目目录
REMOTE_DIR="/opt/magic-school-api"
echo "创建项目目录: $REMOTE_DIR"
mkdir -p "$REMOTE_DIR"

# 解压部署包
DEPLOY_PACKAGE=$(ls -t /tmp/magic-school-deploy-*.tar | head -1)
echo "解压部署包: $DEPLOY_PACKAGE"
tar -xf "$DEPLOY_PACKAGE" -C "$REMOTE_DIR"

# 进入项目目录
cd "$REMOTE_DIR"

# 安装Node.js（如果没有）
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}安装Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# 安装PM2（如果没有）
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}安装PM2...${NC}"
    npm install -g pm2
fi

# 安装项目依赖
echo -e "${YELLOW}安装项目依赖...${NC}"
npm install

# 创建.env文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}创建环境配置文件...${NC}"
    cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eduvisualizer_db
DB_USER=eduvisualizer_user
DB_PASS=EduViz2025Secure
JWT_SECRET=$(openssl rand -base64 32)
EOF
fi

# 创建日志目录
mkdir -p logs

# 停止旧服务
echo -e "${YELLOW}停止旧服务...${NC}"
pm2 delete magic-school-api 2>/dev/null || true

# 启动新服务
echo -e "${YELLOW}启动API服务...${NC}"
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✓ 服务部署完成${NC}"

# 显示服务状态
pm2 status magic-school-api

# 测试API
echo -e "${YELLOW}测试API端点...${NC}"
sleep 3
curl -s http://localhost:3001/api/health | jq . || echo "API测试失败"

echo -e "${GREEN}部署完成！${NC}"
'@

$REMOTE_SCRIPT | Out-File -FilePath "deploy-remote.sh" -Encoding UTF8

Write-Host "✓ 远程脚本生成完成" -ForegroundColor Green
Write-Host ""

# 显示手动执行步骤
Write-Host "[步骤 4/5] 请手动执行以下命令进行部署:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 上传部署包到服务器:" -ForegroundColor Cyan
Write-Host "   scp $DEPLOY_PACKAGE ${SERVER_USER}@${SERVER_IP}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "2. 上传部署脚本:" -ForegroundColor Cyan
Write-Host "   scp deploy-remote.sh ${SERVER_USER}@${SERVER_IP}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "3. SSH登录服务器并执行部署:" -ForegroundColor Cyan
Write-Host "   ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
Write-Host "   chmod +x /tmp/deploy-remote.sh" -ForegroundColor White
Write-Host "   /tmp/deploy-remote.sh" -ForegroundColor White
Write-Host ""

# 创建一个批处理文件以便执行
$BATCH_CONTENT = @"
@echo off
echo 正在部署到VPS服务器...
echo.
echo 步骤 1: 上传部署包
scp $DEPLOY_PACKAGE ${SERVER_USER}@${SERVER_IP}:/tmp/
echo.
echo 步骤 2: 上传部署脚本
scp deploy-remote.sh ${SERVER_USER}@${SERVER_IP}:/tmp/
echo.
echo 步骤 3: 执行远程部署
ssh ${SERVER_USER}@${SERVER_IP} "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"
echo.
echo 部署完成！
pause
"@

$BATCH_CONTENT | Out-File -FilePath "deploy-now.bat" -Encoding ASCII

Write-Host "[步骤 5/5] 自动部署批处理文件已创建" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "部署准备完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "你可以选择以下方式部署:" -ForegroundColor Yellow
Write-Host ""
Write-Host "方式1: 双击运行 deploy-now.bat" -ForegroundColor Green
Write-Host "方式2: 手动执行上面显示的命令" -ForegroundColor Green
Write-Host ""
Write-Host "部署包: $DEPLOY_PACKAGE" -ForegroundColor Cyan
Write-Host "目标服务器: ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
Write-Host ""