# 🔐 安全配置指南

## 📋 首次设置清单

### 1. 环境变量配置
1. 复制 `.env.template` 为 `.env.local`
2. 填入所有必需的API密钥和配置信息
3. 确保 `.env.local` 不会被提交到Git

### 2. 密码管理文档
1. 复制 `docs/密码管理.template.md` 为 `docs/密码管理.md`
2. 填入实际的数据库密码和服务器信息
3. 确保 `docs/密码管理.md` 不会被提交到Git

### 3. 生产环境配置
- 在Cloudflare Pages中设置环境变量：
  - `VITE_REPLICATE_API_TOKEN`
  - `VITE_BACKEND_API_KEY` 
  - 其他必需的API密钥

## 🚨 安全注意事项

### ❌ 禁止操作
- **禁止**将 `.env.local` 文件提交到Git
- **禁止**将 `docs/密码管理.md` 文件提交到Git
- **禁止**在代码中硬编码API密钥
- **禁止**在公共场所分享敏感信息

### ✅ 必须操作
- **必须**使用模板文件创建本地配置
- **必须**定期更新API密钥
- **必须**使用环境变量管理敏感信息
- **必须**定期备份重要密钥

## 🔄 API密钥更换流程

### Replicate API Token
1. 访问 https://replicate.com/account/api-tokens
2. 创建新的API Token
3. 更新后端 `.env` 文件中的 `REPLICATE_API_KEY`
4. 更新Cloudflare Pages环境变量 `VITE_REPLICATE_API_TOKEN`
5. 测试功能正常后，删除旧Token

### 其他API密钥
- 按照类似流程更新其他第三方服务的API密钥

## 🛠️ 故障排除

### 如果可视化功能不工作
1. 检查 `VITE_REPLICATE_API_TOKEN` 是否在Cloudflare Pages中正确设置
2. 检查后端 `REPLICATE_API_KEY` 是否配置正确
3. 检查后端服务是否正常运行

### 如果登录功能不工作  
1. 检查后端数据库连接是否正常
2. 检查Nginx反向代理配置
3. 检查API代理路径是否正确

## 📞 联系方式

如有安全相关问题，请联系系统管理员。