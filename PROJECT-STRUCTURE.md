# EduVisualizer 项目结构

## 📁 项目概览

EduVisualizer 是一个智能教育内容分析和可视化平台，基于 React + TypeScript + Vite 构建。

## 🏗️ 目录结构

```
EduVisualizer/
├── 📄 package.json                 # 项目依赖和脚本
├── 📄 package-lock.json            # 依赖版本锁定
├── 📄 vite.config.ts               # Vite配置（包含API代理）
├── 📄 tsconfig.json                # TypeScript配置
├── 📄 tsconfig.node.json           # Node.js TypeScript配置
├── 📄 tailwind.config.js           # Tailwind CSS配置
├── 📄 postcss.config.js            # PostCSS配置
├── 📄 index.html                   # 主HTML模板
├── 📄 .env.local                   # 环境变量（API密钥等）
├── 📄 README.md                    # 项目说明
├── 📄 CLAUDE-INTEGRATION.md        # Claude集成说明
├── 📄 test-api-browser.html        # API测试页面
│
├── 📁 public/                      # 静态资源
│   └── vite.svg
│
├── 📁 dist/                        # 构建输出目录
│   ├── index.html
│   └── assets/
│
├── 📁 src/                         # 源代码目录
│   ├── 📄 main.tsx                 # 应用入口点
│   ├── 📄 index.css                # 全局样式
│   ├── 📄 vite-env.d.ts            # Vite类型定义
│   │
│   ├── 📁 components/              # React组件
│   │   └── 📄 ProjectStatus.tsx    # 项目状态组件
│   │
│   ├── 📁 context/                 # React Context
│   │   └── 📄 ThemeContext.tsx     # 主题上下文
│   │
│   ├── 📁 hooks/                   # 自定义Hooks
│   │   └── 📄 useLocalStorage.ts   # 本地存储Hook
│   │
│   ├── 📁 pages/                   # 页面组件
│   │   └── 📄 HomePage.tsx         # 主页面（聊天界面）
│   │
│   ├── 📁 services/                # API服务
│   │   ├── 📄 replicateAPI.ts      # Replicate API集成
│   │   └── 📄 mockAPI.ts           # 模拟API服务
│   │
│   ├── 📁 types/                   # TypeScript类型定义
│   │   └── 📄 index.ts             # 统一类型导出
│   │
│   ├── 📁 utils/                   # 工具函数
│   │   ├── 📄 index.ts             # 工具函数导出
│   │   ├── 📄 logger.ts            # 日志工具
│   │   ├── 📄 cacheManager.ts      # 缓存管理
│   │   └── 📄 temporaryStorage.ts  # 临时存储
│   │
│   ├── 📁 assets/                  # 静态资源（保留为空）
│   └── 📁 styles/                  # 样式文件（保留为空）
│
└── 📁 node_modules/                # 依赖包
```

## 🎯 核心文件说明

### 📄 入口文件
- **`src/main.tsx`**: 应用程序入口，设置React渲染和主题提供者
- **`src/pages/HomePage.tsx`**: 主要页面组件，包含聊天界面和AI交互逻辑

### 🤖 AI服务
- **`src/services/replicateAPI.ts`**: 集成Replicate平台的AI模型
  - GPT-5: 主要文本分析
  - Claude 3.7 Sonnet: 高级内容分析
  - DALL-E 3: 图像生成
  - 轮询机制和错误处理
- **`src/services/mockAPI.ts`**: 离线模式的模拟API响应

### 🎨 用户界面
- **`src/context/ThemeContext.tsx`**: 深色/浅色主题切换
- **`src/components/ProjectStatus.tsx`**: 项目状态显示
- **Tailwind CSS**: 响应式设计和现代UI

### 🔧 配置文件
- **`vite.config.ts`**: 
  - 开发服务器配置
  - API代理设置（解决CORS问题）
  - 构建优化
- **`.env.local`**: 
  - `VITE_REPLICATE_API_TOKEN`: Replicate API密钥
  - 其他环境变量

### 📝 类型定义
- **`src/types/index.ts`**: 
  - API响应类型
  - 组件Props类型
  - 数据结构定义

## 🚀 核心功能

### 1. **AI内容分析**
- 支持GPT-5和Claude 3.7 Sonnet两种模型
- 智能内容分类和难度评估
- 学习目标和前置知识分析

### 2. **对话式界面**
- DeepSeek风格的聊天体验
- 实时状态反馈和思考动画
- 模型选择器

### 3. **可视化生成**
- 数学函数图像绘制
- Chart.js图表配置
- SVG和D3.js代码生成

### 4. **文件处理**
- OCR文字识别
- 数学公式解析
- 多格式文件支持

## 🔄 已移除的冗余部分

### 删除的测试文件
- `test-*.js` 系列测试脚本
- 调试用的HTML页面
- 临时的API测试工具

### 删除的未使用组件
- `SmartInput.tsx`
- `ResultsDisplay.tsx`
- `ProcessingProgress.tsx`
- `FileUpload.tsx`
- `Button.tsx`
- `Card.tsx`

### 删除的冗余服务
- `api.ts` (功能已整合到replicateAPI.ts)
- `fileProcessor.ts` (未被使用)
- `errorHandler.ts` (已简化)

### 删除的文档文件
- 各种调试和故障排查指南
- 重复的配置说明文档

## 🎨 设计原则

1. **简洁性**: 只保留必要的文件和组件
2. **模块化**: 清晰的文件组织和职责分离
3. **可维护性**: 统一的代码风格和类型定义
4. **可扩展性**: 预留的目录结构便于功能扩展

## 📈 下一步发展方向

1. **文件上传**: 实现真实的文件拖拽上传功能
2. **R2集成**: 完善Cloudflare R2存储集成
3. **可视化增强**: 实际渲染Chart.js图表
4. **教育专业化**: 增强教育内容理解能力
