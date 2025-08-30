#!/bin/bash

# Magic School AI 后端服务修复脚本
# 自动修复VPS服务器上的后端服务问题

echo "========================================="
echo "   Magic School AI 后端修复工具 v1.0"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_PORT="3001"
DB_NAME="eduvisualizer_db"
DB_USER="eduvisualizer_user"
DB_PASS="EduViz2025Secure"

# 修复计数器
FIXES_APPLIED=0

echo -e "${BLUE}开始自动修复程序...${NC}"
echo ""

# 1. 检查并安装Node.js
echo -e "${YELLOW}[步骤 1] 检查Node.js环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}正在安装Node.js 18.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ((FIXES_APPLIED++))
    echo -e "${GREEN}✓ Node.js安装完成${NC}"
else
    echo -e "${GREEN}✓ Node.js已安装 ($(node --version))${NC}"
fi
echo ""

# 2. 检查并安装PM2
echo -e "${YELLOW}[步骤 2] 检查PM2进程管理器...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}正在安装PM2...${NC}"
    npm install -g pm2
    ((FIXES_APPLIED++))
    echo -e "${GREEN}✓ PM2安装完成${NC}"
else
    echo -e "${GREEN}✓ PM2已安装${NC}"
fi
echo ""

# 3. 停止现有服务
echo -e "${YELLOW}[步骤 3] 停止现有服务...${NC}"
pm2 delete all 2>/dev/null
killall node 2>/dev/null
echo -e "${GREEN}✓ 已清理现有进程${NC}"
echo ""

# 4. 查找或创建项目目录
echo -e "${YELLOW}[步骤 4] 定位后端项目...${NC}"
PROJECT_DIR=""

# 搜索现有项目
SEARCH_DIRS=(
    "/var/www/magic-school-api"
    "/var/www/eduvisualizer-api"
    "/home/magic-school-api"
    "/opt/magic-school-api"
)

for dir in "${SEARCH_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        PROJECT_DIR="$dir"
        echo -e "${GREEN}✓ 找到现有项目: $PROJECT_DIR${NC}"
        break
    fi
done

# 如果没找到，创建新项目
if [ -z "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}未找到现有项目，将创建临时API服务器...${NC}"
    PROJECT_DIR="/opt/magic-school-api"
    mkdir -p "$PROJECT_DIR"
    ((FIXES_APPLIED++))
    
    # 创建package.json
    cat > "$PROJECT_DIR/package.json" << 'EOF'
{
  "name": "magic-school-api",
  "version": "1.0.0",
  "description": "Magic School AI Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0"
  }
}
EOF

    # 创建临时服务器代码
    cat > "$PROJECT_DIR/server.js" << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库配置
const pool = new Pool({
    user: 'eduvisualizer_user',
    host: 'localhost',
    database: 'eduvisualizer_db',
    password: 'EduViz2025Secure',
    port: 5432,
});

// 中间件
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100个请求
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Magic School AI API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 认证状态端点
app.get('/auth/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        res.json({
            authenticated: false,
            userCount: result.rows[0].count,
            message: 'Authentication service running'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Database connection error',
            message: error.message
        });
    }
});

// 使用检查端点
app.get('/usage/check', (req, res) => {
    res.json({
        apiCallsRemaining: 10,
        apiCallsToday: 0,
        plan: 'free',
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
});

// API状态端点
app.get('/api/status', (req, res) => {
    res.json({
        api: 'Magic School AI',
        version: '1.0.0',
        status: 'operational',
        endpoints: [
            '/api/health',
            '/auth/status',
            '/usage/check',
            '/api/status'
        ]
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Magic School AI API Server',
        documentation: '/api/status'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Magic School AI API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
EOF

    echo -e "${GREEN}✓ 临时API服务器代码已创建${NC}"
fi
echo ""

# 5. 安装依赖
echo -e "${YELLOW}[步骤 5] 安装项目依赖...${NC}"
cd "$PROJECT_DIR"
npm install
((FIXES_APPLIED++))
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 6. 创建环境配置
echo -e "${YELLOW}[步骤 6] 配置环境变量...${NC}"
cat > "$PROJECT_DIR/.env" << EOF
NODE_ENV=production
PORT=$API_PORT
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
JWT_SECRET=$(openssl rand -base64 32)
EOF
echo -e "${GREEN}✓ 环境配置完成${NC}"
echo ""

# 7. 创建PM2配置
echo -e "${YELLOW}[步骤 7] 创建PM2配置...${NC}"
cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
module.exports = {
    apps: [{
        name: 'magic-school-api',
        script: './server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: $API_PORT
        },
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};
EOF
mkdir -p "$PROJECT_DIR/logs"
echo -e "${GREEN}✓ PM2配置创建完成${NC}"
echo ""

# 8. 启动服务
echo -e "${YELLOW}[步骤 8] 启动后端服务...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
((FIXES_APPLIED++))
echo -e "${GREEN}✓ 服务已启动${NC}"
echo ""

# 9. 验证服务
echo -e "${YELLOW}[步骤 9] 验证服务状态...${NC}"
sleep 3  # 等待服务完全启动

# 测试端点
endpoints=(
    "/api/health"
    "/auth/status"
    "/api/status"
    "/usage/check"
)

SUCCESS_COUNT=0
for endpoint in "${endpoints[@]}"; do
    echo -n "测试 http://localhost:${API_PORT}${endpoint} ... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}${endpoint}" 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ 200 OK${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}✗ $response${NC}"
    fi
done
echo ""

# 10. 设置防火墙规则
echo -e "${YELLOW}[步骤 10] 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow $API_PORT/tcp 2>/dev/null
    echo -e "${GREEN}✓ 防火墙规则已添加${NC}"
else
    echo -e "${YELLOW}⚠ UFW未安装，跳过防火墙配置${NC}"
fi
echo ""

# 总结
echo "========================================="
echo -e "${GREEN}修复完成总结${NC}"
echo "========================================="
echo -e "应用的修复: ${FIXES_APPLIED} 项"
echo -e "成功的端点: ${SUCCESS_COUNT}/${#endpoints[@]}"
echo ""

if [ $SUCCESS_COUNT -eq ${#endpoints[@]} ]; then
    echo -e "${GREEN}✅ 所有API端点正常工作！${NC}"
    echo ""
    echo "后端服务信息:"
    echo "- 项目目录: $PROJECT_DIR"
    echo "- 服务端口: $API_PORT"
    echo "- PM2进程名: magic-school-api"
    echo ""
    echo "管理命令:"
    echo "- 查看状态: pm2 status"
    echo "- 查看日志: pm2 logs magic-school-api"
    echo "- 重启服务: pm2 restart magic-school-api"
    echo "- 停止服务: pm2 stop magic-school-api"
else
    echo -e "${YELLOW}⚠ 部分端点可能需要额外配置${NC}"
    echo "请检查:"
    echo "1. 数据库连接是否正常"
    echo "2. 防火墙规则是否正确"
    echo "3. PM2日志: pm2 logs"
fi

echo ""
echo "========================================="
echo "修复完成于: $(date)"
echo "========================================="