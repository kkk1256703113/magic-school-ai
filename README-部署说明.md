# 🚀 Magic School AI - 小白友好的部署指南

## 📋 当前项目结构说明

```
你的项目：
📁 本地电脑 (D:\project\magicschoolai project\EduVisualizer 2.0\)
├── 🌐 前端代码 (src/, public/, 等)      ← 自动部署到 Cloudflare
├── 🖥️ 后端代码 (server-backend/server.js) ← 需要手动同步到服务器
└── 📜 部署脚本 (deploy-to-server.bat)   ← 新增！一键部署

🖥️ 服务器 (45.77.86.20)
└── /opt/magic-school-api/
    ├── server.js                    ← 实际运行的代码
    └── PM2 进程管理                 ← 保持服务运行
```

## 🎯 使用方法（超简单）

### 步骤1：修改代码
在本地修改 `server-backend/server.js` 文件

### 步骤2：一键部署
双击运行 `deploy-to-server.bat`

### 步骤3：验证结果
打开 https://www.magicschoolai.net 检查功能

## 🔍 老站长的安全提醒

- ✅ 每次部署前，服务器会自动备份
- ✅ 如果部署失败，旧版本继续运行
- ✅ 所有操作都有详细日志

## 🆘 遇到问题怎么办

1. **上传失败**：检查网络连接
2. **重启失败**：联系老站长
3. **网站异常**：立即报告，老站长会回滚

## 📈 后续规划

- 阶段二：建立Git版本管理
- 阶段三：自动化CI/CD流程

---
*老站长温馨提示：稳步前进，安全第一 🛡️*