# OAuth密钥管理文档

## 🔐 OAuth应用配置信息

### Google OAuth 2.0
- **Client ID**: 162247767284-0bk0hi3jforpj0hp6g1erq8tt1c9fphh.apps.googleusercontent.com
- **Client Secret**: GOCSPX-your-google-client-secret-here ❌ 需要更新
- **回调URL**: https://www.magicschoolai.net/api/auth/oauth/google/callback
- **需要在Google Cloud Console配置的回调URL**:
  - https://www.magicschoolai.net/api/auth/oauth/google/callback
  - http://localhost:3001/api/auth/oauth/google/callback (开发)

### GitHub OAuth App
- **Client ID**: Ov23likV2yzy38o09lRO  
- **Client Secret**: your-github-client-secret-here ❌ 需要更新
- **回调URL**: https://www.magicschoolai.net/api/auth/oauth/github/callback
- **需要在GitHub App设置配置的回调URL**:
  - https://www.magicschoolai.net/api/auth/oauth/github/callback
  - http://localhost:3001/api/auth/oauth/github/callback (开发)

## 🔧 修复需要执行的操作

### Google Cloud Console (https://console.cloud.google.com)
1. 访问Google Cloud Console
2. 选择项目: Magic School AI
3. 转到"API和服务" > "凭据"
4. 找到Client ID: 162247767284-0bk0hi3jforpj0hp6g1erq8tt1c9fphh
5. 编辑OAuth 2.0客户端ID
6. 在"已获授权的重定向URI"中添加:
   - https://www.magicschoolai.net/api/auth/oauth/google/callback
   - http://localhost:3001/api/auth/oauth/google/callback
7. 保存更改

### GitHub App设置 (https://github.com/settings/apps)
1. 访问GitHub应用设置
2. 找到App ID对应的应用 (Client ID: Ov23likV2yzy38o09lRO)
3. 编辑应用设置
4. 在"Callback URLs"中添加:
   - https://www.magicschoolai.net/api/auth/oauth/github/callback
   - http://localhost:3001/api/auth/oauth/github/callback
5. 保存更改

## 🚨 安全注意事项
- 此文件包含敏感信息，已设置为git忽略
- 请勿将真实的Client Secret提交到代码仓库
- 生产环境密钥需要通过安全渠道获取和配置

## 📝 修复进度
- [x] 创建OAuth配置文件
- [x] 添加Passport.js策略
- [x] 实现OAuth路由
- [ ] 配置Google Cloud Console回调URL
- [ ] 配置GitHub App回调URL
- [ ] 获取真实的Client Secret
- [ ] 测试OAuth流程

创建时间: 2025-01-09
最后更新: 2025-01-09