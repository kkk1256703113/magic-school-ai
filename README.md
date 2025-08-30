# Magic School AI - Turn Complex Into Clear

A professional document and formula visualization platform powered by AI, serving both workplace professionals and educational users.

## 🚀 功能特性

- **智能文字识别**: 高精度OCR技术，准确识别文档中的文字内容
- **公式解析**: 智能识别数学、物理、化学公式并转换为LaTeX
- **智能可视化**: AI驱动的动态图表生成，让复杂概念变得直观
- **深色/浅色模式**: 完整的主题切换功能，默认跟随系统设置
- **响应式设计**: 在所有设备上完美展示
- **现代化UI**: Linear App风格的简约现代设计

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS 3.0+
- **动画库**: Framer Motion
- **路由**: React Router
- **HTTP客户端**: Axios
- **文件上传**: React Dropzone
- **通知**: React Hot Toast
- **图标**: Lucide React

## 📦 安装和运行

### 前置要求

确保您的系统已安装：
- Node.js (版本 18 或更高)
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 🎨 设计系统

### 色彩方案

- **主色调**: 蓝色渐变 (#0ea5e9 到 #8b5cf6)
- **辅助色**: 紫色、绿色、橙色、粉色
- **中性色**: 灰色系列，支持深色模式

### 字体系统

- **主要字体**: Inter (无衬线字体)
- **等宽字体**: JetBrains Mono (代码和公式)

### 组件样式

- **Bento Grid布局**: 现代化的卡片网格系统
- **玻璃效果**: 毛玻璃背景效果
- **渐变文字**: 主色调渐变文字效果
- **高亮背景**: 不同颜色的透明度渐变背景

## 📁 项目结构

```
EduVisualizer 2.0/
├── src/                    # 前端源代码
│   ├── components/        # React组件
│   ├── context/           # React Context (认证、主题、语言)
│   ├── hooks/             # 自定义Hooks
│   ├── services/          # API服务层
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   └── assets/            # 静态资源
├── server-backend/         # 后端服务器代码
│   ├── server.js          # Express服务器主文件
│   └── ecosystem.config.js # PM2配置
├── deploy/                 # 部署脚本
│   ├── deploy-to-vps.sh   # Linux完整部署脚本
│   ├── deploy-windows.ps1 # Windows部署脚本
│   └── quick-update.bat   # 快速更新脚本
├── tests/                  # 测试脚本
│   ├── test-api-endpoints.mjs # API端点测试
│   └── test-api-limit.mjs     # API限制测试
├── monitoring/             # 监控脚本
│   └── health-check.js    # 健康检查脚本
└── docs/                   # 项目文档
    ├── 项目背景及进展说明书.md
    └── 管理员后台系统设计文档.md
```

## 🔧 配置

### 环境变量

创建 `.env.local` 文件并配置以下变量：

```env
# Replicate API配置
VITE_REPLICATE_API_TOKEN=your_replicate_token

# AI模型配置
VITE_GPT5_MODEL=openai/gpt-5
VITE_CLAUDE4_MODEL=anthropic/claude-4-sonnet

# API服务器配置 (可选，使用默认值即可)
VITE_API_BASE_URL=/api
```

## 🎯 开发指南

### 代码规范

- 使用ESLint和Prettier进行代码格式化
- 遵循TypeScript严格模式
- 使用函数式组件和Hooks
- 组件命名使用PascalCase
- 文件命名使用kebab-case

### 组件开发

- 每个组件都应该有TypeScript类型定义
- 使用Tailwind CSS进行样式设计
- 添加适当的动画效果
- 确保响应式设计
- 支持深色/浅色模式

### 状态管理

- 使用React Context进行全局状态管理
- 使用useState和useEffect进行本地状态管理
- 避免过度使用全局状态

## 🚀 部署

### 后端部署

#### Windows环境部署
```powershell
# 使用PowerShell完整部署
.\deploy\deploy-windows.ps1

# 快速更新服务器代码
.\deploy\quick-update.bat
```

#### Linux环境部署
```bash
# 完整部署到VPS
./deploy/deploy-to-vps.sh
```

### 前端部署

构建并部署到任何静态网站托管平台：

```bash
# 构建生产版本
npm run build

# 部署dist目录到：
# - Cloudflare Pages
# - Vercel
# - Netlify
# - GitHub Pages
```

### 服务器管理

```bash
# SSH登录VPS服务器
ssh root@45.77.86.20

# 查看服务状态
pm2 status

# 查看服务日志
pm2 logs magic-school-api

# 重启服务
pm2 restart magic-school-api

# 监控服务
pm2 monit
```

## 🧪 测试

### API端点测试
```bash
# 测试所有API端点
node tests/test-api-endpoints.mjs

# 测试API调用限制
node tests/test-api-limit.mjs
```

### 健康检查
```bash
# 运行健康检查
node monitoring/health-check.js
```

## 📊 API端点

### 认证相关
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册  
- `GET /auth/status` - 认证状态检查
- `POST /auth/logout` - 用户登出

### 使用量管理
- `GET /usage/check` - 检查API使用限制
- `POST /usage/record` - 记录API使用

### 系统状态
- `GET /api/health` - 健康检查
- `GET /api/status` - API状态信息

## 📝 许可证

Private - Magic School AI

## 🤝 贡献

内部项目，请联系团队负责人

## 🛠️ 故障排除

### 常见问题

1. **API调用失败 (404错误)**
   - 检查 `.env.local` 中的API配置
   - 确认后端服务已启动
   - 验证网络连接

2. **API限制错误**
   - 检查用户认证状态
   - 验证API调用次数限制
   - 查看 `/api/usage/check` 响应

3. **部署失败**
   - 确认SSH密钥配置正确
   - 检查服务器网络连接
   - 查看PM2日志

## 📞 技术支持

- **项目维护**: Magic School AI Team
- **服务器地址**: 45.77.86.20:3001
- **技术栈**: React + Node.js + PostgreSQL
