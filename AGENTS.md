# Repository Guidelines

> 适用于本仓库（EduVisualizer 2.0 / Magic School AI）的贡献与协作规范。请在提交代码或开 PR 前快速通读。

## 项目结构与模块
- 前端：`src/`（`components/`、`context/`、`hooks/`、`services/`、`types/`、`utils/`、`assets/`），静态资源在 `public/`。
- 后端：`server-backend/`（Express + PM2，环境变量见 `.env.example`）。
- 工具与运维：`deploy/`、`monitoring/`、`scripts/`、`config/`、`docs/`。
- 测试与诊断：`tests/`（Node 脚本）、`monitoring/health-check.js`。
- 构建产物：`dist/`（请勿提交）。环境样例：`.env.template`。

## 构建、开发与运行
- 前端开发：`npm install`，`npm run dev`（Vite 开发服），`npm run preview`（预览），`npm run build`（打包）。
- 代码质量：`npm run lint`（ESLint + TypeScript）。
- 后端开发：`cd server-backend && npm install && npm run dev`；生产：`npm run pm2:start`、`pm2 logs`。
- 手动测试：`node tests/test-api-endpoints.mjs`，`node tests/test-api-limit.mjs`；健康检查：`node monitoring/health-check.js`。

## 代码风格与命名
- 语言：React 18 + TypeScript；样式：Tailwind CSS。
- 格式化（.prettierrc）：2 空格、单引号、无分号、`printWidth=80`、`trailingComma=es5`。
- Lint（.eslintrc.cjs）：禁止未使用变量（允许下划线前缀）、尽量避免 `any`。
- 命名：组件与文件用 `PascalCase`（如 `UserCard.tsx`），变量/函数用 `camelCase`，工具脚本用 `kebab-case`。

## 测试指南
- 目前采用 Node 18+ 脚本型测试，命名约定 `tests/test-*.mjs`。
- 如需调用受限接口，请在脚本中配置测试账号/`API_BASE`（勿提交真实密钥）。
- 新增接口请附最小可复现实例或对应测试脚本。

## Commit 与 Pull Request
- 推荐风格：表情 + 动词祈使句（中英文均可）。示例：
  - 🐛 fix: 修复 API 限制逻辑
  - 🎨 ui: 优化订阅管理界面
  - 🔧 chore/refactor: 统一路径别名
- PR 要求：清晰描述、关联 Issue、变更范围与风险、测试步骤；前端改动附前后截图/录屏；新增配置同步更新 `.env.template` 与 README。

## 安全与配置
- 本地配置放 `.env.local`；生产配置勿入库（后端使用 `server-backend/.env`）。
- 不要提交密钥、token、密码；日志中避免打印敏感信息。
- 变更外部依赖或权限时，请在 PR 中备注影响范围与回滚方案。
