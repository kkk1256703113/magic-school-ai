#!/bin/bash

# Magic School AI VPS诊断脚本
# 用于诊断45.77.86.20服务器上的后端服务问题

echo "========================================="
echo "   Magic School AI VPS 诊断工具 v1.0"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器信息
SERVER_IP="45.77.86.20"
API_PORT="3001"

echo -e "${YELLOW}[1/10] 检查系统基本信息...${NC}"
echo "----------------------------------------"
uname -a
echo "当前用户: $(whoami)"
echo "当前时间: $(date)"
echo ""

echo -e "${YELLOW}[2/10] 检查Node.js安装...${NC}"
echo "----------------------------------------"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js已安装${NC}"
    node --version
else
    echo -e "${RED}✗ Node.js未安装${NC}"
fi

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ NPM已安装${NC}"
    npm --version
else
    echo -e "${RED}✗ NPM未安装${NC}"
fi
echo ""

echo -e "${YELLOW}[3/10] 检查PM2进程管理器...${NC}"
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✓ PM2已安装${NC}"
    pm2 --version
    echo ""
    echo "PM2进程列表:"
    pm2 list
    echo ""
    echo "PM2最近日志:"
    pm2 logs --lines 10 --nostream
else
    echo -e "${RED}✗ PM2未安装${NC}"
    echo "建议安装: npm install -g pm2"
fi
echo ""

echo -e "${YELLOW}[4/10] 检查端口${API_PORT}占用情况...${NC}"
echo "----------------------------------------"
if netstat -tulnp 2>/dev/null | grep -q ":${API_PORT}"; then
    echo -e "${GREEN}✓ 端口${API_PORT}正在使用${NC}"
    netstat -tulnp 2>/dev/null | grep ":${API_PORT}"
else
    echo -e "${RED}✗ 端口${API_PORT}未被占用（服务可能未运行）${NC}"
fi
echo ""

echo -e "${YELLOW}[5/10] 检查Node.js进程...${NC}"
echo "----------------------------------------"
NODE_PROCESSES=$(ps aux | grep -E "node|nodejs" | grep -v grep)
if [ -n "$NODE_PROCESSES" ]; then
    echo -e "${GREEN}✓ 发现Node.js进程${NC}"
    echo "$NODE_PROCESSES"
else
    echo -e "${RED}✗ 没有运行中的Node.js进程${NC}"
fi
echo ""

echo -e "${YELLOW}[6/10] 查找后端项目目录...${NC}"
echo "----------------------------------------"
echo "搜索可能的项目位置..."

# 检查常见位置
POSSIBLE_DIRS=(
    "/var/www/magic-school-api"
    "/var/www/eduvisualizer-api"
    "/home/magic-school-api"
    "/home/eduvisualizer-api"
    "/opt/magic-school-api"
    "/opt/eduvisualizer-api"
    "/root/magic-school-api"
    "/root/eduvisualizer-api-old"
)

PROJECT_DIR=""
for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ 找到项目目录: $dir${NC}"
        PROJECT_DIR="$dir"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}正在全局搜索package.json文件...${NC}"
    PACKAGE_FILES=$(find / -name "package.json" -type f 2>/dev/null | head -10)
    if [ -n "$PACKAGE_FILES" ]; then
        echo "找到的package.json文件:"
        echo "$PACKAGE_FILES"
    else
        echo -e "${RED}✗ 未找到后端项目目录${NC}"
    fi
fi
echo ""

echo -e "${YELLOW}[7/10] 测试API端点...${NC}"
echo "----------------------------------------"
endpoints=(
    "/"
    "/api/health"
    "/auth/status"
    "/api/status"
    "/usage/check"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "测试 http://localhost:${API_PORT}${endpoint} ... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}${endpoint}" 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ 200 OK${NC}"
    elif [ "$response" = "404" ]; then
        echo -e "${YELLOW}⚠ 404 Not Found${NC}"
    else
        echo -e "${RED}✗ $response${NC}"
    fi
done
echo ""

echo -e "${YELLOW}[8/10] 检查PostgreSQL数据库...${NC}"
echo "----------------------------------------"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL客户端已安装${NC}"
    
    # 测试数据库连接
    echo "测试数据库连接..."
    PGPASSWORD=EduViz2025Secure psql -U eduvisualizer_user -d eduvisualizer_db -h localhost -c "\l" &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 数据库连接成功${NC}"
        
        # 检查用户表
        USER_COUNT=$(PGPASSWORD=EduViz2025Secure psql -U eduvisualizer_user -d eduvisualizer_db -h localhost -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
        if [ -n "$USER_COUNT" ]; then
            echo "用户表记录数: $USER_COUNT"
        fi
    else
        echo -e "${RED}✗ 数据库连接失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL客户端未安装${NC}"
fi
echo ""

echo -e "${YELLOW}[9/10] 检查系统日志...${NC}"
echo "----------------------------------------"
echo "最近的错误日志:"
journalctl -p err --since "1 hour ago" | tail -10
echo ""

echo -e "${YELLOW}[10/10] 诊断总结...${NC}"
echo "========================================="

# 生成诊断报告
ISSUES=0
WARNINGS=0

echo -e "${YELLOW}发现的问题:${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}• Node.js未安装${NC}"
    ((ISSUES++))
fi

if ! netstat -tulnp 2>/dev/null | grep -q ":${API_PORT}"; then
    echo -e "${RED}• API服务未在端口${API_PORT}运行${NC}"
    ((ISSUES++))
fi

if [ -z "$PROJECT_DIR" ]; then
    echo -e "${RED}• 未找到后端项目目录${NC}"
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ 未发现严重问题${NC}"
else
    echo ""
    echo -e "${YELLOW}建议的修复步骤:${NC}"
    echo "1. 如果Node.js未安装: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "2. 如果PM2未安装: npm install -g pm2"
    echo "3. 如果项目未找到: 需要部署后端代码到服务器"
    echo "4. 如果服务未运行: cd到项目目录并运行 npm install && npm start"
fi

echo ""
echo "========================================="
echo "诊断完成于: $(date)"
echo "========================================="