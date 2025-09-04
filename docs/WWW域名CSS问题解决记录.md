# WWW 域名 CSS 未加载问题解决记录

## 📅 日期：2025-09-03

## 🔴 问题描述

### 症状
- **受影响域名**：https://www.magicschoolai.net/
- **问题表现**：页面只显示纯文字，没有任何样式渲染
- **正常域名**：
  - https://magic-school-ai.pages.dev/ ✅
  - https://magicschoolai.net/ ✅

### 错误信息（浏览器控制台）
```
Refused to apply style from 'https://www.magicschoolai.net/assets/index-58b3a6fa.css' 
because its MIME type ('application/javascript') is not a supported stylesheet MIME type, 
and strict MIME checking is enabled.

framer-motion.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
```

### 关键问题
CSS 文件被错误地以 `application/javascript` MIME 类型提供，导致浏览器拒绝将其作为样式表应用。

---

## 🔍 排查过程时间线

### 1. 初始分析（15:00-15:30）
- **发现**：只有 www 子域名受影响，其他域名正常
- **检查项目结构**：
  - 项目使用 React + Vite + TypeScript
  - 部署在 Cloudflare Pages
  - 最近提交：`2079f18 设置落地页为默认首页`

### 2. 检查配置文件（15:30-16:00）
- **发现问题**：`dist/_headers` 文件只配置了 JavaScript 的 MIME 类型，遗漏了 CSS
- **_headers 内容**（有问题的版本）：
```
/*.js
  Content-Type: application/javascript
/assets/*.js
  Content-Type: application/javascript
# 缺少 CSS 配置！
```

### 3. DNS 配置验证（16:00-16:15）
- **DNS 记录**：
  - `magicschoolai.net` → `magic-school-ai.pages.dev` (已代理)
  - `www.magicschoolai.net` → `magic-school-ai.pages.dev` (已代理)
- **结论**：DNS 配置正确，问题不在 DNS 层面

---

## 🛠️ 尝试的解决方案

### ❌ 方案 1：删除 _headers 文件（15:58）
**操作**：
```bash
rm dist/_headers
git commit -m "修复 www.magicschoolai.net CSS 未加载问题"
git push origin master
```

**结果**：失败
- **原因**：Cloudflare 部署的是旧版本（未及时推送）
- **Git 提交**：`d2ab36c`

### ❌ 方案 2：恢复正确的 _headers 配置（16:20）
**操作**：
创建 `public/_headers` 文件，包含完整的 MIME 类型配置：
```
# CSS 文件
/*.css
  Content-Type: text/css; charset=UTF-8
/assets/*.css
  Content-Type: text/css; charset=UTF-8

# JavaScript 文件
/*.js
  Content-Type: application/javascript; charset=UTF-8
/assets/*.js
  Content-Type: application/javascript; charset=UTF-8
```

**结果**：部署后问题依然存在
- **Git 提交**：`27246cf`
- **可能原因**：www 子域名可能有特殊的 Cloudflare 配置或缓存

### ❌ 方案 3：清除 Cloudflare 缓存
**操作**：
1. Cloudflare Dashboard → 缓存 → 配置
2. 自定义清除 → 输入 www.magicschoolai.net/*
3. 清除所有内容

**结果**：无效
- **分析**：问题可能更深层，不仅仅是缓存

### ✅ 方案 4：Cloudflare Functions 中间件（16:33）
**操作**：
创建 `functions/_middleware.js`：
```javascript
export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  
  const newResponse = new Response(response.body, response);
  
  // 强制设置 CSS 的 Content-Type
  if (url.pathname.endsWith('.css') || url.pathname.includes('.css')) {
    newResponse.headers.set('Content-Type', 'text/css; charset=UTF-8');
    console.log(`Fixed CSS MIME type for: ${url.pathname}`);
  }
  
  // 强制设置 JS 的 Content-Type
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
    newResponse.headers.set('Content-Type', 'application/javascript; charset=UTF-8');
  }
  
  // 添加调试头部
  newResponse.headers.set('X-Middleware-Applied', 'true');
  newResponse.headers.set('X-Original-URL', url.pathname);
  
  return newResponse;
}
```

**Git 提交**：`13f49c3`
**状态**：已部署，待验证

---

## 📊 技术分析

### 根本原因
1. **配置文件问题**：_headers 文件配置不完整，只设置了 JS 文件的 MIME 类型
2. **Cloudflare 行为差异**：www 子域名可能有不同的处理逻辑
3. **可能的边缘情况**：某些 Cloudflare 节点对 www 子域名有特殊处理

### 为什么只影响 www？
- 可能原因：
  1. www 和主域名可能路由到不同的 Cloudflare 边缘节点
  2. www 可能有不同的缓存策略
  3. _headers 文件可能在 www 上的处理方式不同

### Git 提交历史
```
13f49c3 添加 Cloudflare Functions 中间件修复 www.magicschoolai.net MIME 类型问题
27246cf 添加正确的 _headers 文件修复 www.magicschoolai.net CSS 加载问题
d2ab36c 修复 www.magicschoolai.net CSS 未加载问题
2079f18 设置落地页为默认首页
3127825 删除 _headers 文件，使用 Cloudflare 默认配置
599b7aa 修复 Cloudflare Pages MIME 类型和重定向问题
c590b05 修复 CSS MIME 类型错误
```

---

## 📌 当前状态（截至 16:45）

### 已部署的修复
1. ✅ 正确配置的 `_headers` 文件（包含 CSS MIME 类型）
2. ✅ Cloudflare Functions 中间件（强制修正 MIME 类型）
3. ✅ 修复了 `.gitignore`（不再忽略 public 目录）

### 等待验证
- Cloudflare Functions 中间件是否生效
- www.magicschoolai.net 是否正常渲染

---

## 📝 明天的测试计划

### 1. 验证中间件效果
```bash
# 1. 访问 www.magicschoolai.net
# 2. 打开开发者工具 (F12)
# 3. Network 标签查看 CSS 文件
# 4. 检查 Response Headers：
#    - Content-Type: text/css
#    - X-Middleware-Applied: true
```

### 2. 如果中间件方案失败

#### 备用方案 A：Page Rules
1. Cloudflare Dashboard → 规则 → Page Rules
2. 创建规则：
   - URL: `www.magicschoolai.net/*`
   - 设置：缓存级别 = 绕过

#### 备用方案 B：Transform Rules
1. Cloudflare Dashboard → 规则 → Transform Rules
2. 创建响应头修改规则：
   - 匹配：`(http.host eq "www.magicschoolai.net" and http.request.uri.path contains ".css")`
   - 操作：设置 Content-Type = text/css

#### 备用方案 C：重定向方案
1. 在 Cloudflare 创建重定向规则
2. 将 www.magicschoolai.net 301 重定向到 magicschoolai.net
3. 完全避开问题

### 3. 性能监控
- 检查中间件对性能的影响
- 监控 Cloudflare Functions 的执行次数
- 确认是否触达免费计划限制（100,000 次/天）

---

## 🎯 经验总结

### 教训
1. **配置要完整**：_headers 文件必须包含所有资源类型
2. **及时推送**：修改后要立即推送到 GitHub
3. **缓存要清除**：Cloudflare 的缓存可能导致问题持续
4. **多层解决**：从配置文件到中间件，需要多层防护

### 最佳实践
1. 使用 Cloudflare Functions 作为兜底方案
2. 保持 _headers 文件配置完整
3. 定期检查所有子域名的可用性
4. 在开发环境测试 MIME 类型配置

---

## 🔗 相关资源
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions 文档](https://developers.cloudflare.com/pages/platform/functions/)
- [项目 GitHub 仓库](https://github.com/kkk1256703113/magic-school-ai)
- [Cloudflare Dashboard](https://dash.cloudflare.com)

---

## 📞 后续行动
1. [ ] 明天上午验证 www.magicschoolai.net 是否正常
2. [ ] 监控 Functions 执行情况
3. [ ] 考虑是否需要长期保留中间件
4. [ ] 更新部署文档，加入 MIME 类型配置说明