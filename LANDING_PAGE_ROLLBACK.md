# 宣传页回退指南

## 🚀 当前实施状态

宣传页功能已成功实施，包含以下特性：
- ✅ 独立的宣传页组件（不影响现有功能）
- ✅ 新路由配置（/welcome 和 /app）
- ✅ 环境变量控制
- ✅ 科技感动画效果
- ✅ 中英文国际化支持
- ✅ 点击"开始使用"跳转注册功能

## 📍 访问路径

- **宣传页**: http://localhost:3000/welcome
- **现有功能页**: http://localhost:3000/app 或 http://localhost:3000/
- **根路径**: 默认指向现有功能页（可通过环境变量改变）

## 🔄 如何回退（如需要）

### 方案一：通过环境变量禁用（推荐）

1. 编辑 `.env.local` 文件：
```env
VITE_ENABLE_LANDING_PAGE=false  # 改为false禁用宣传页
VITE_LANDING_AS_HOME=false      # 确保根路径不指向宣传页
```

2. 重启开发服务器：
```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

3. 效果：
- /welcome 路径将无法访问
- 根路径继续指向现有功能页
- 所有现有功能完全不受影响

### 方案二：代码回退（完全移除）

如果需要完全移除宣传页功能：

1. **删除新增文件**：
```bash
# 删除宣传页组件
rm src/pages/LandingPage.tsx
rm -rf src/components/landing/
rm src/styles/landing.css

# 删除回退文档
rm LANDING_PAGE_ROLLBACK.md
```

2. **恢复 main.tsx**：
```bash
git checkout src/main.tsx
```

或手动编辑 `src/main.tsx`，移除：
- `import LandingPage from './pages/LandingPage'`
- `import './styles/landing.css'`
- 宣传页相关的路由配置

3. **恢复 AuthModal.tsx**：
```bash
git checkout src/components/AuthModal.tsx
```

4. **移除环境变量**：
从 `.env.local` 中删除：
- `VITE_ENABLE_LANDING_PAGE`
- `VITE_LANDING_AS_HOME`

5. **移除国际化翻译**（可选）：
从 `src/i18n/locales/zh.ts` 和 `src/i18n/locales/en.ts` 中删除 `landing` 部分。

### 方案三：Git 分支回退

如果在独立分支开发：

```bash
# 切换回主分支
git checkout main

# 如需删除宣传页分支
git branch -D feature/landing-page
```

## ✅ 安全保障

1. **现有功能完全不受影响**：
   - HomePage 组件未修改
   - /app 路径始终可用
   - 原有路由保持不变

2. **快速切换**：
   - 通过环境变量可以立即启用/禁用
   - 无需修改代码即可控制

3. **独立组件**：
   - 所有宣传页代码都在独立文件中
   - 不与现有组件产生依赖

## 🎯 测试验证

回退后请验证：

1. 访问 http://localhost:3000/ 正常显示功能页
2. 所有现有功能（登录、注册、文档处理等）正常工作
3. 如果设置 `VITE_ENABLE_LANDING_PAGE=false`，/welcome 路径应该无法访问

## 📝 注意事项

- 环境变量修改后需要重启开发服务器才能生效
- 生产环境部署时，可以通过环境变量控制是否启用宣传页
- 建议先通过环境变量测试，确认无问题后再决定是否永久移除代码

## 🚀 如何切换为宣传页作为首页

如果测试后决定将宣传页设为首页：

1. 修改 `.env.local`：
```env
VITE_LANDING_AS_HOME=true  # 将宣传页设为首页
```

2. 重启服务器，访问 http://localhost:3000/ 将显示宣传页

3. 用户仍可通过 http://localhost:3000/app 访问功能页

---

最后更新：2025-09-01