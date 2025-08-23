# EduVisualizer - 智能教育内容可视化工具

一个现代化的React教育工具网站，能够将PDF和图片内容转换为可视化卡片和动态公式图。

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
src/
├── components/          # 可复用组件
├── pages/              # 页面组件
├── context/            # React Context
├── hooks/              # 自定义Hooks
├── services/           # API服务
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
├── styles/             # 样式文件
└── assets/             # 静态资源
```

## 🔧 配置

### 环境变量

创建 `.env.local` 文件并配置以下变量：

```env
# Google Cloud Vision API
VITE_GOOGLE_VISION_API_KEY=your_api_key
VITE_GOOGLE_VISION_ENDPOINT=https://vision.googleapis.com/v1

# MathPix API
VITE_MATHPIX_APP_ID=your_app_id
VITE_MATHPIX_APP_KEY=your_app_key
VITE_MATHPIX_ENDPOINT=https://api.mathpix.com/v3

# OpenAI API
VITE_OPENAI_API_KEY=your_api_key
VITE_OPENAI_ENDPOINT=https://api.openai.com/v1

# Cloudflare R2
VITE_CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
VITE_CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
VITE_CLOUDFLARE_R2_ENDPOINT=your_endpoint

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
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

### Cloudflare Pages

1. 连接GitHub仓库到Cloudflare Pages
2. 配置构建命令: `npm run build`
3. 配置输出目录: `dist`
4. 设置环境变量
5. 部署

### 其他平台

项目可以部署到任何支持静态网站的平台上：
- Vercel
- Netlify
- GitHub Pages
- 阿里云OSS
- 腾讯云COS

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📊 日志系统

项目集成了完整的日志记录系统，用于跟踪项目状态和调试问题：

### 日志功能
- **实时日志记录**: 记录应用启动、API调用、错误等关键事件
- **状态检查**: 检查环境、构建、服务器、API配置状态
- **错误追踪**: 详细记录错误信息和上下文
- **日志导出**: 支持导出JSON格式的日志文件

### 使用方法
1. **查看状态**: 点击右下角的信息图标查看项目状态
2. **导出日志**: 在状态面板中点击下载按钮导出日志
3. **刷新状态**: 点击刷新按钮重新检查项目状态
4. **控制台查看**: 在浏览器控制台中查看实时日志

### 日志级别
- `INFO`: 一般信息
- `WARN`: 警告信息
- `ERROR`: 错误信息
- `SUCCESS`: 成功信息

### 全局访问
在浏览器控制台中可以通过 `window.__EDU_LOGGER__` 访问日志器：
```javascript
// 查看所有日志
console.log(window.__EDU_LOGGER__.getLogs())

// 查看错误日志
console.log(window.__EDU_LOGGER__.getErrors())

// 导出日志
console.log(window.__EDU_LOGGER__.exportLogs())
```

### 已知问题记录
项目维护了一个已知问题列表，记录在 `build-status.json` 文件中，包括：
- 环境配置问题
- 构建错误
- 依赖问题
- 解决方案

## 📞 联系方式

如有问题，请通过以下方式联系：
- 邮箱: [your-email@example.com]
- GitHub: [your-github-username]
