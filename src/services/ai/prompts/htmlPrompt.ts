import { PromptConfig } from '../types/ai.types'
import { promptVersionManager } from '../core/PromptVersionManager'

/**
 * HTML生成提示词
 */
export class HTMLPrompts {
  /**
   * 获取HTML生成提示词（稳定版本）
   */
  static getGenerationPromptStable(content: string, files?: File[]): PromptConfig {
    let fileContext = ''
    if (files?.length) {
      fileContext = `检测到${files.length}个文件，包含的文件信息需要在可视化中体现。`
    }

    return {
      prompt: `我给你一个文件，一段内容，分析内容，并将其转化为美观漂亮的中文可视化网页作品集:

文本内容：${content}
文件信息：${fileContext}

## 内容要求
保持原文件的核心信息，但以更易读、可视化的方式呈现
在页面底部添加作者信息区域，包含:
*作者姓名:[Magic School AI]
*社交媒体链接:至少包含Twitter/x:
版权信息和年份

## 设计风格
整体风格参考Linear App的简约现代设计
使用清晰的视觉层次结构，突出重要内容
配色方案应专业、和谐，适合长时间阅读

## 技术规范
使用HTML5、Tailwindcss 3.0+(通过CDN引入)和必要的Javascript
实现完整的深色/浅色模式切换功能，默认跟随系统设置
代码结构清晰，包含适当注释，便于理解和维护

## 响应式设计
页面必须在所有设备上(手机、平板、桌面)完美展示
针对不同屏幕尺寸优化布局和字体大小
确保移动端有良好的触控体验

## 媒体资源
使用文档中的Markdown图片链接(如果有的话)
使用文档中的视频嵌入代码(如果有的话)

## 图标与视觉元素
使用专业图标库如Font Awesome或Material Icons(通过CDN引入)
根据内容主题选择合适的插图或图表展示数据
避免使用emoji作为主要图标

## 交互体验
添加适当的微交互效果提升用户体验
按钮悬停时有轻微放大和颜色变化
卡片元素悬停时有精致的阴影和边框效果
页面滚动时有平滑过渡效果
内容区块加载时有优雅的淡入动画

## 性能优化
确保页面加载速度快，避免不必要的大型资源
实现懒加载技术用于长页面内容

## 输出要求
提供完整可运行的单一HTML文件，包含所有必要的css和Javascript
确保代码符合W3c标准，无错误警告
页面在不同浏览器中保持一致的外观和功能
请根据上传文件的内容类型(文档、数据、图片等)，创建最适合展示该内容的可视化网页。`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'medium'
    }
  }

  /**
   * 获取HTML生成提示词（版本选择入口）
   */
  static getGenerationPrompt(content: string, files?: File[]): PromptConfig {
    const version = promptVersionManager.getCurrentVersion()
    
    switch (version) {
      case 'enhanced':
        return this.getGenerationPromptEnhanced(content, files)
      case 'stable':
      default:
        return this.getGenerationPromptStable(content, files)
    }
  }

  /**
   * 获取HTML生成提示词（增强版本 - 超详细版本）
   */
  static getGenerationPromptEnhanced(content: string, files?: File[]): PromptConfig {
    let fileContext = ''
    if (files?.length) {
      fileContext = `检测到${files.length}个文件，包含的文件信息需要在可视化中体现。`
    }

    return {
      prompt: `我给你一个文件，一段内容，请进行深度分析并将其转化为美观漂亮的中文可视化网页作品集。

文本内容：${content}
文件信息：${fileContext}

## ⚠️ 内容完整性要求（严格执行）
1. **逐一展示所有内容**：如果原文有步骤一、二、三、四，必须全部显示，不允许省略任何步骤
2. **保持原文结构**：严格按照原文的层次结构和逻辑顺序组织内容
3. **完整保留信息**：所有重要信息点、列表项、步骤都必须在可视化中体现
4. **禁止遗漏**：特别注意步骤类、列表类、分类类内容，确保每一项都有对应的视觉元素

## ⚠️ 模块创建原则（严格限制）
1. **只基于原文创建模块**：严格按照原文的实际内容划分模块，不得添加原文不存在的模块
2. **禁止空模块**：每个模块都必须有实际内容，不允许创建空的或占位的模块
3. **一一对应**：原文有几个主要部分，就创建几个对应模块，数量必须精确匹配
4. **内容验证**：生成前先分析原文结构，确保模块数量和内容与原文完全对应

## 核心设计要求
保持原文件的核心信息，以更易读、可视化的方式呈现所有内容
在页面底部添加作者信息区域，包含:
*作者姓名:[Magic School AI]
*社交媒体链接:至少包含Twitter/x
*版权信息和年份

## 设计风格
整体风格参考Linear App的简约现代设计
使用清晰的视觉层次结构，突出重要内容
配色方案应专业、和谐，适合长时间阅读
为每个步骤/要点添加独特的视觉标识

## ⚠️ 主题切换功能（必须实现）
实现完整的深色/浅色模式切换功能，必须包含：
1. **CSS变量定义**：为所有颜色定义CSS变量，确保主题切换时所有元素都能正确变色
2. **JavaScript切换逻辑**：
   
   // 主题切换核心代码（必须包含）
   function toggleTheme() {
     const body = document.body;
     const isDark = body.classList.contains('dark-theme');
     
     if (isDark) {
       body.classList.remove('dark-theme');
       localStorage.setItem('theme', 'light');
     } else {
       body.classList.add('dark-theme');
       localStorage.setItem('theme', 'dark');
     }
   }
   
   // 页面加载时恢复主题设置
   document.addEventListener('DOMContentLoaded', function() {
     const savedTheme = localStorage.getItem('theme');
     if (savedTheme === 'dark') {
       document.body.classList.add('dark-theme');
     }
   });
3. **主题按钮**：添加明显的主题切换按钮，点击时能够立即切换主题
4. **状态持久化**：使用localStorage保存用户的主题选择
5. **平滑过渡**：所有颜色变化都要有CSS transition过渡效果

## 技术规范
使用HTML5、Tailwind CSS 3.0+(通过CDN引入)和必要的JavaScript
代码结构清晰，包含详细注释，便于理解和维护
确保主题切换功能在所有浏览器中正常工作

## 响应式设计
页面必须在所有设备上(手机、平板、桌面)完美展示
针对不同屏幕尺寸优化布局和字体大小
确保移动端有良好的触控体验
主题切换按钮在移动端也要易于点击

## 视觉增强
使用专业图标库如Font Awesome或Material Icons(通过CDN引入)
为每个步骤添加进度指示器或序号标识
根据内容主题选择合适的插图或图表展示数据
避免使用emoji作为主要图标，使用专业图标

## 交互体验升级
添加丰富的微交互效果提升用户体验：
1. **按钮交互**：悬停时有轻微放大和颜色变化
2. **卡片效果**：元素悬停时有精致的阴影和边框效果
3. **滚动动画**：页面滚动时有平滑过渡效果
4. **加载动画**：内容区块加载时有优雅的淡入动画
5. **主题切换动画**：主题切换时有平滑的颜色过渡

## 内容组织强化
1. **步骤类内容**：使用数字标识、进度条、时间线等视觉元素
2. **列表内容**：使用图标、颜色编码、分组展示
3. **分类内容**：使用卡片布局、标签系统、过滤功能
4. **重点突出**：使用高亮背景、边框、特殊字体强调重要内容

## 性能和可访问性
确保页面加载速度快，避免不必要的大型资源
实现懒加载技术用于长页面内容
添加键盘导航支持
确保颜色对比度符合无障碍标准

## 输出要求
提供完整可运行的单一HTML文件，包含所有必要的CSS和JavaScript
确保代码符合W3C标准，无错误警告
页面在不同浏览器中保持一致的外观和功能
特别确保主题切换功能在所有现代浏览器中正常工作
请根据上传文件的内容类型(文档、数据、图片等)，创建最适合展示该内容的可视化网页。

## 🔍 执行检查清单（生成前必须验证）
□ 是否已分析原文的完整结构？
□ 所有步骤/列表项是否都将在可视化中展示？
□ 模块数量是否与原文结构精确匹配？
□ 主题切换JavaScript代码是否完整包含？
□ CSS变量是否为所有元素定义了深色/浅色版本？
□ 是否添加了localStorage主题持久化？`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'high'
    }
  }

}