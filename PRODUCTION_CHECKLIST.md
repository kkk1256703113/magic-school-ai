# 生产环境切换清单

## 一、Google OAuth配置步骤

### 1. 创建Google OAuth凭据
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在左侧菜单中，选择"API和服务" > "凭据"
4. 点击"创建凭据" > "OAuth 客户端 ID"
5. 选择应用类型为"Web应用"
6. 填写以下信息：
   - 名称：`EduVisualizer`
   - 授权JavaScript源：
     - `http://localhost:3002`（开发）
     - `http://45.77.86.20`（服务器IP）
     - `https://你的域名.com`（生产域名）
   - 授权重定向URI：
     - `http://localhost:3002/auth/callback`
     - `https://你的域名.com/auth/callback`
7. 保存并获取`Client ID`和`Client Secret`

### 2. 更新环境变量
```bash
# 前端 .env.local
VITE_DEV_MODE=false                           # 关闭开发模式
VITE_GOOGLE_CLIENT_ID=你的_CLIENT_ID         # Google OAuth客户端ID

# 后端 server-backend/.env
NODE_ENV=production
DEV_MODE=false
GOOGLE_CLIENT_ID=你的_CLIENT_ID
GOOGLE_CLIENT_SECRET=你的_CLIENT_SECRET
```

## 二、邮件服务配置（可选）

### 使用Gmail SMTP
1. 登录Gmail账号
2. 开启两步验证
3. 生成应用专用密码：
   - 访问 [Google账号设置](https://myaccount.google.com/security)
   - 选择"两步验证" > "应用专用密码"
   - 生成密码并保存

### 更新SMTP配置
```bash
# server-backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=你的Gmail邮箱
SMTP_PASS=应用专用密码
SMTP_FROM=noreply@你的域名.com
```

## 三、部署步骤

### 1. 服务器准备
```bash
# SSH连接到服务器
ssh root@45.77.86.20

# 安装必要软件
apt update
apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx

# 配置PostgreSQL数据库
sudo -u postgres psql
CREATE DATABASE eduvisualizer_db;
CREATE USER eduvisualizer_user WITH PASSWORD 'EduViz2025Secure';
GRANT ALL PRIVILEGES ON DATABASE eduvisualizer_db TO eduvisualizer_user;
\q
```

### 2. 部署代码
```bash
# 克隆代码
git clone https://github.com/你的用户名/eduvisualizer.git
cd eduvisualizer

# 安装依赖
npm install
cd server-backend && npm install

# 构建前端
npm run build

# 配置PM2进程管理
npm install -g pm2
cd server-backend
pm2 start server.js --name eduvisualizer-api
pm2 save
pm2 startup
```

### 3. Nginx配置
```nginx
server {
    listen 80;
    server_name 你的域名.com;

    # 前端静态文件
    location / {
        root /path/to/eduvisualizer/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL证书配置
```bash
# 使用Let's Encrypt获取免费SSL证书
certbot --nginx -d 你的域名.com
```

## 四、切换清单

### 开发环境 → 生产环境

- [ ] 1. 在Google Cloud Console创建OAuth凭据
- [ ] 2. 更新`.env.local`中的`VITE_DEV_MODE=false`
- [ ] 3. 配置真实的Google OAuth密钥
- [ ] 4. 配置SMTP邮件服务（可选）
- [ ] 5. 更新后端`.env`文件
- [ ] 6. 运行数据库迁移脚本
- [ ] 7. 构建前端：`npm run build`
- [ ] 8. 部署到服务器
- [ ] 9. 配置Nginx反向代理
- [ ] 10. 配置SSL证书
- [ ] 11. 测试所有认证流程
- [ ] 12. 更新`passwords.md`文档

### 需要安装的npm包（生产环境）

如果要实现真实的Google OAuth，需要安装：
```bash
# 前端
npm install @react-oauth/google

# 后端
npm install google-auth-library
```

如果要实现邮件发送，需要安装：
```bash
# 后端
npm install nodemailer
```

## 五、测试验证

### 功能测试
- [ ] 注册新用户（验证码）
- [ ] 邮箱密码登录
- [ ] Google OAuth登录
- [ ] 忘记密码流程
- [ ] 密码重置
- [ ] API限制检查
- [ ] 深色模式切换
- [ ] 语言切换

### 安全检查
- [ ] HTTPS正确配置
- [ ] 环境变量不暴露
- [ ] 密码正确加密
- [ ] JWT token有效期
- [ ] CORS配置正确
- [ ] SQL注入防护
- [ ] XSS防护

## 六、回滚方案

如果出现问题，可以快速切换回开发模式：

1. 修改`.env.local`：`VITE_DEV_MODE=true`
2. 修改`server-backend/.env`：`DEV_MODE=true`
3. 重启服务

## 七、监控和维护

### 日志监控
```bash
# 查看PM2日志
pm2 logs eduvisualizer-api

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 数据库备份
```bash
# 每日备份脚本
pg_dump -U eduvisualizer_user eduvisualizer_db > backup_$(date +%Y%m%d).sql
```

### 性能监控
- 使用PM2监控：`pm2 monit`
- 设置Uptime监控
- 配置错误告警

---

**注意事项：**
1. 所有密钥和密码请保存到`passwords.md`文件
2. 不要在代码中硬编码任何密钥
3. 定期更新依赖包：`npm audit fix`
4. 保持备份策略

*最后更新：2025-09-02*