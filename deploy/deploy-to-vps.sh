#!/bin/bash

# Magic School AI 自动化部署脚本
# 一键部署后端服务到VPS服务器

echo "========================================="
echo "   Magic School AI 自动部署工具 v1.0"
echo "========================================="
echo ""

# 配置
SERVER_IP="45.77.86.20"
SERVER_USER="root"
REMOTE_DIR="/opt/magic-school-api"
LOCAL_BACKEND_DIR="./server-backend"
LOCAL_SCRIPTS_DIR="./server-scripts"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查本地文件
echo -e "${YELLOW}[步骤 1/6] 检查本地文件...${NC}"
if [ ! -d "$LOCAL_BACKEND_DIR" ]; then
    echo -e "${RED}错误: 找不到后端代码目录 $LOCAL_BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -f "$LOCAL_BACKEND_DIR/server.js" ]; then
    echo -e "${RED}错误: 找不到server.js文件${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 本地文件检查通过${NC}"
echo ""

# 创建部署包
echo -e "${YELLOW}[步骤 2/6] 创建部署包...${NC}"
DEPLOY_PACKAGE="magic-school-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
cp -r "$LOCAL_BACKEND_DIR"/* "$TEMP_DIR/"
cp -r "$LOCAL_SCRIPTS_DIR"/* "$TEMP_DIR/"

# 打包
tar -czf "$DEPLOY_PACKAGE" -C "$TEMP_DIR" .
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✓ 部署包创建完成: $DEPLOY_PACKAGE${NC}"
echo ""

# 上传到服务器
echo -e "${YELLOW}[步骤 3/6] 上传文件到VPS服务器...${NC}"
echo "目标服务器: $SERVER_USER@$SERVER_IP"

# 使用SCP上传
scp "$DEPLOY_PACKAGE" "$SERVER_USER@$SERVER_IP:/tmp/"

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 文件上传失败${NC}"
    echo "请确保:"
    echo "1. 服务器IP地址正确"
    echo "2. 有SSH访问权限"
    echo "3. 网络连接正常"
    exit 1
fi

echo -e "${GREEN}✓ 文件上传成功${NC}"
echo ""

# 在服务器上执行部署
echo -e "${YELLOW}[步骤 4/6] 在VPS服务器上执行部署...${NC}"

ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}连接到VPS服务器成功${NC}"

# 创建项目目录
REMOTE_DIR="/opt/magic-school-api"
echo "创建项目目录: $REMOTE_DIR"
mkdir -p "$REMOTE_DIR"

# 解压部署包
DEPLOY_PACKAGE=$(ls -t /tmp/magic-school-deploy-*.tar.gz | head -1)
echo "解压部署包: $DEPLOY_PACKAGE"
tar -xzf "$DEPLOY_PACKAGE" -C "$REMOTE_DIR"

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

# 创建.env文件（如果不存在）
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}创建环境配置文件...${NC}"
    cp .env.example .env
    # 生成随机JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
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

# 设置开机自启
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✓ 服务部署完成${NC}"

# 显示服务状态
pm2 status magic-school-api

ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 远程部署失败${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[步骤 5/6] 验证部署...${NC}"

# 等待服务启动
sleep 5

# 测试API端点
echo "测试API健康检查..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:3001/api/health")

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ API服务正常运行${NC}"
else
    echo -e "${YELLOW}⚠ API返回状态码: $response${NC}"
    echo "请手动检查服务状态"
fi

# 清理临时文件
echo ""
echo -e "${YELLOW}[步骤 6/6] 清理临时文件...${NC}"
rm -f "$DEPLOY_PACKAGE"
echo -e "${GREEN}✓ 清理完成${NC}"

# 显示总结
echo ""
echo "========================================="
echo -e "${GREEN}🎉 部署成功完成！${NC}"
echo "========================================="
echo ""
echo "服务信息:"
echo "- API地址: http://$SERVER_IP:3001"
echo "- 健康检查: http://$SERVER_IP:3001/api/health"
echo "- API状态: http://$SERVER_IP:3001/api/status"
echo ""
echo "管理命令:"
echo "- SSH登录: ssh $SERVER_USER@$SERVER_IP"
echo "- 查看日志: pm2 logs magic-school-api"
echo "- 重启服务: pm2 restart magic-school-api"
echo "- 停止服务: pm2 stop magic-school-api"
echo "- 监控服务: pm2 monit"
echo ""
echo "本地测试:"
echo "- 健康检查: curl http://$SERVER_IP:3001/api/health"
echo "- 运行诊断: node monitoring/health-check.js"
echo ""
echo "========================================="