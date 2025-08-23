# Claude 3.7 Sonnet 集成说明

## 概述

我们已经成功将 Anthropic 的 Claude 3.7 Sonnet 模型集成到 EduVisualizer 应用程序中。Claude 3.7 Sonnet 是 Anthropic 最智能的 Claude 模型，也是市场上第一个混合推理模型。

## 集成特性

### 1. 模型选择器
- 在应用程序的顶部添加了一个下拉菜单，用户可以在 GPT-5 和 Claude 3.7 Sonnet 之间选择
- 选择的模型会影响内容分析的结果

### 2. Claude 专用API方法
- 新增了 `analyzeContentWithClaude()` 方法，专门用于调用 Claude 3.7 Sonnet API
- 针对 Claude 的输出格式进行了优化的JSON解析
- 增强的错误处理和降级方案

### 3. UI改进
- 在消息底部显示使用的AI模型标识（🧠 Claude 3.7 或 🤖 GPT-5）
- 在处理过程中显示当前选择的模型
- 处理结果中包含模型信息

## API配置

### 模型配置
```javascript
models: {
  gpt5: 'openai/gpt-5',
  claude37: 'anthropic/claude-3.7-sonnet',  // 新增
  dalleE3: 'openai/dall-e-3',
  llama2: 'meta/llama-2-70b-chat'
}
```

### Claude API调用参数
```javascript
{
  prompt: "教育专家分析提示词",
  max_tokens: 2000,
  temperature: 0.3
}
```

## 使用方法

### 1. 基本使用
1. 启动应用程序：`npm run dev`
2. 在顶部选择 "Claude 3.7 Sonnet" 模型
3. 输入要分析的内容
4. 观察Claude的分析结果

### 2. 测试页面
访问 `http://localhost:3000/test-api-browser.html`：
1. 输入API Token
2. 在 "Claude 3.7 Sonnet测试" 区域输入内容
3. 点击 "测试Claude 3.7 Sonnet" 按钮
4. 查看分析结果

## Claude vs GPT-5 对比

### Claude 3.7 Sonnet 优势
- 更强的推理能力（混合推理模型）
- 更详细的教育内容分析
- 更好的结构化输出
- 对复杂概念的深度理解

### GPT-5 优势
- 更快的响应速度
- 更稳定的JSON输出格式
- 更好的多语言支持

## 代码示例

### 调用Claude分析
```javascript
// 在HomePage.tsx中
if (selectedModel === 'claude37' && !useMockAPI) {
  console.log('🧠 使用 Claude 3.7 Sonnet 进行分析')
  contentAnalysis = await aiService.analyzeContentWithClaude(userContent)
} else {
  console.log('🤖 使用 GPT-5 进行分析')
  contentAnalysis = await apiService.analyzeContent(userContent)
}
```

### Claude专用方法
```javascript
// 在replicateAPI.ts中
async analyzeContentWithClaude(content: string, images?: File[]): Promise<ContentAnalysisResponse> {
  // Claude特定的提示词和参数
  // 智能JSON解析
  // 增强的错误处理
}
```

## 注意事项

1. **API Token**: 确保你的 Replicate API Token 有权限访问 Claude 3.7 Sonnet 模型
2. **计费**: Claude 3.7 Sonnet 的使用可能有不同的计费标准
3. **响应时间**: Claude 可能需要更长的处理时间，但会提供更深入的分析
4. **输出格式**: Claude 的输出可能包含额外的解释文本，我们的代码会自动提取JSON部分

## 故障排查

### Claude API调用失败
1. 检查API Token是否有效
2. 确认账户有足够的余额
3. 检查网络连接
4. 查看浏览器控制台的详细错误信息

### 模型选择不生效
1. 确认页面已正确加载
2. 检查选择器的值是否正确传递
3. 查看控制台日志确认选择的模型

## 未来改进

1. **视觉分析**: 当Claude支持图像输入时，可以增加图像分析功能
2. **对话模式**: 实现与Claude的多轮对话
3. **个性化设置**: 允许用户自定义Claude的参数（temperature、max_tokens等）
4. **性能优化**: 实现模型结果的缓存机制

## 相关链接

- [Claude 3.7 Sonnet API文档](https://replicate.com/anthropic/claude-3.7-sonnet/api)
- [Anthropic官方文档](https://docs.anthropic.com/)
- [Replicate平台](https://replicate.com/)
