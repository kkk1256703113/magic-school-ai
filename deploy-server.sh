#!/bin/bash

# 服务器后端代码部署脚本
# 用于将最新的后端代码部署到生产服务器

SERVER_HOST="45.77.86.20"
SERVER_USER="root"
SERVER_PATH="/root/eduvisualizer-backend"
LOCAL_PATH="./server-backend"

echo "🚀 开始部署服务器后端代码..."

# 1. 打包本地后端代码
echo "📦 打包本地代码..."
tar -czf server-backend.tar.gz -C server-backend .

# 2. 上传代码到服务器
echo "⬆️ 上传代码到服务器..."
scp -i ~/.ssh/id_rsa server-backend.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/

# 3. 在服务器上解压和部署
echo "🔧 在服务器上部署代码..."
ssh -i ~/.ssh/id_rsa ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    cd /root/eduvisualizer-backend
    
    # 停止PM2服务
    echo "⏸️ 停止服务..."
    pm2 stop magic-school-api
    
    # 备份当前代码
    echo "💾 备份当前代码..."
    cp -r api api_backup_$(date +%Y%m%d_%H%M%S)
    
    # 解压新代码
    echo "📂 部署新代码..."
    cd api
    tar -xzf /tmp/server-backend.tar.gz
    
    # 安装依赖
    echo "📚 安装依赖..."
    npm install
    
    # 重启服务
    echo "🔄 重启服务..."
    pm2 start magic-school-api
    pm2 save
    
    # 清理临时文件
    rm /tmp/server-backend.tar.gz
    
    echo "✅ 部署完成！"
EOF

# 4. 清理本地临时文件
rm server-backend.tar.gz

echo "🎉 服务器后端代码部署完成！"
echo "📊 可以通过以下命令查看服务状态："
echo "ssh -i ~/.ssh/id_rsa ${SERVER_USER}@${SERVER_HOST} 'pm2 logs magic-school-api'"