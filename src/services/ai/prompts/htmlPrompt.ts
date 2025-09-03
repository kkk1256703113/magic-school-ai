import { PromptConfig } from '@/services/ai/types/ai.types'
import { promptVersionManager } from '../core/PromptVersionManager'

/**
 * HTML生成提示词
 */
export class HTMLPrompts {
  /**
   * 获取HTML生成提示词（稳定版本）
   */
  static getGenerationPromptStable(content: string, files?: File[], language: 'zh' | 'en' = 'zh'): PromptConfig {
    let fileContext = ''
    if (files?.length) {
      if (language === 'en') {
        fileContext = `Detected ${files.length} files, the file information needs to be reflected in the visualization.`
      } else {
        fileContext = `检测到${files.length}个文件，包含的文件信息需要在可视化中体现。`
      }
    }

    // 根据语言选择提示词
    if (language === 'en') {
      return this.getEnglishPromptStable(content, fileContext)
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
  static getGenerationPrompt(content: string, files?: File[], language: 'zh' | 'en' = 'zh'): PromptConfig {
    const version = promptVersionManager.getCurrentVersion()
    
    switch (version) {
      case 'enhanced':
        return this.getGenerationPromptEnhanced(content, files, language)
      case 'stable':
      default:
        return this.getGenerationPromptStable(content, files, language)
    }
  }

  /**
   * 获取HTML生成提示词（增强版本 - 内容完整性优化版本）
   */
  static getGenerationPromptEnhanced(content: string, files?: File[], language: 'zh' | 'en' = 'zh'): PromptConfig {
    let fileContext = ''
    if (files?.length) {
      if (language === 'en') {
        fileContext = `Detected ${files.length} files, the file information needs to be reflected in the visualization.`
      } else {
        fileContext = `检测到${files.length}个文件，包含的文件信息需要在可视化中体现。`
      }
    }

    // 根据语言选择提示词
    if (language === 'en') {
      return this.getEnglishPromptEnhanced(content, fileContext)
    }

    return {
      prompt: `我给你一个文件，一段内容，将其转化为美观漂亮的中文可视化网页作品集，确保完整展示所有原文内容:

文本内容：${content}
文件信息：${fileContext}

## 内容完整性要求
1. **完整展示所有内容**：原文有多少个步骤、列表项、要点就展示多少个，不允许省略
2. **保持原文结构**：按照原文的层次结构和逻辑顺序组织内容
3. **精确对应原文模块**：只基于原文实际内容创建模块，不添加原文不存在的部分
4. **避免空模块**：每个模块都必须有具体内容，不创建占位模块

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

## 主题切换功能（必须实现）
实现完整的深色/浅色模式切换功能：
1. 为所有颜色定义CSS变量，确保主题切换时所有元素都能正确变色
2. 添加JavaScript切换逻辑，支持localStorage状态持久化
3. 添加明显的主题切换按钮，点击时能够立即切换主题
4. 所有颜色变化都要有CSS transition过渡效果

## 技术规范
使用HTML5、Tailwind CSS 3.0+(通过CDN引入)和必要的JavaScript
代码结构清晰，包含适当注释，便于理解和维护
确保主题切换功能在所有浏览器中正常工作

## 响应式设计
页面必须在所有设备上(手机、平板、桌面)完美展示
针对不同屏幕尺寸优化布局和字体大小
确保移动端有良好的触控体验

## 媒体资源
使用文档中的Markdown图片链接(如果有的话)
使用文档中的视频嵌入代码(如果有的话)

## 图标与视觉元素
使用专业图标库如Font Awesome或Material Icons(通过CDN引入)
为每个步骤添加进度指示器或序号标识
根据内容主题选择合适的插图或图表展示数据
避免使用emoji作为主要图标

## 交互体验
添加适当的微交互效果提升用户体验
按钮悬停时有轻微放大和颜色变化
卡片元素悬停时有精致的阴影和边框效果
页面滚动时有平滑过渡效果
内容区块加载时有优雅的淡入动画

## 内容组织优化
步骤类内容使用数字标识、进度条、时间线等视觉元素
列表内容使用图标、颜色编码、分组展示
分类内容使用卡片布局、标签系统
重点内容使用高亮背景、边框、特殊字体强调

## 性能优化
确保页面加载速度快，避免不必要的大型资源
实现懒加载技术用于长页面内容

## 输出要求
提供完整可运行的单一HTML文件，包含所有必要的CSS和JavaScript
确保代码符合W3C标准，无错误警告
页面在不同浏览器中保持一致的外观和功能
请根据上传文件的内容类型(文档、数据、图片等)，创建最适合展示该内容的可视化网页。

重要提醒：请首先分析原文的完整结构，确保可视化网页包含原文的所有内容要素，不遗漏任何步骤或要点。`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'medium'
    }
  }

  /**
   * 获取英文版稳定提示词
   */
  private static getEnglishPromptStable(content: string, fileContext: string): PromptConfig {
    return {
      prompt: `I will provide you with a file and content. Analyze the content and transform it into a beautiful English visualization web portfolio:

Text Content: ${content}
File Information: ${fileContext}

## Content Requirements
Maintain the core information from the original file, but present it in a more readable and visual way
Add an author information area at the bottom of the page, including:
* Author Name: [Magic School AI]
* Social Media Links: At least include Twitter/X
* Copyright Information and Year

## Design Style
Overall style references Linear App's minimalist modern design
Use clear visual hierarchy to highlight important content
Color scheme should be professional and harmonious, suitable for long-term reading

## Technical Specifications
Use HTML5, Tailwind CSS 3.0+ (via CDN) and necessary JavaScript
Implement complete dark/light mode toggle functionality, default follows system settings
Code structure is clear, contains appropriate comments, easy to understand and maintain

## Responsive Design
The page must display perfectly on all devices (mobile, tablet, desktop)
Optimize layout and font sizes for different screen sizes
Ensure good touch experience on mobile devices

## Media Resources
Use Markdown image links from the document (if any)
Use video embed code from the document (if any)

## Icons and Visual Elements
Use professional icon libraries like Font Awesome or Material Icons (via CDN)
Choose appropriate illustrations or charts to display data based on content theme
Avoid using emojis as main icons

## Interactive Experience
Add appropriate micro-interactions to enhance user experience
Buttons have slight scaling and color changes on hover
Card elements have refined shadows and border effects on hover
Smooth transition effects when scrolling through pages
Elegant fade-in animation when content blocks load

## Performance Optimization
Ensure fast page loading speed, avoid unnecessary large resources
Implement lazy loading technology for long page content

## Output Requirements
Provide a complete runnable single HTML file, including all necessary CSS and JavaScript
Ensure code complies with W3C standards, no error warnings
Pages maintain consistent appearance and functionality across different browsers
Please create the most suitable visualization webpage based on the uploaded file's content type (document, data, image, etc.) to showcase that content.`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'medium'
    }
  }

  /**
   * 获取英文版增强提示词
   */
  private static getEnglishPromptEnhanced(content: string, fileContext: string): PromptConfig {
    return {
      prompt: `I will provide you with a file and content. Transform it into a beautiful English visualization web portfolio, ensuring complete display of all original content:

Text Content: ${content}
File Information: ${fileContext}

## Content Integrity Requirements
1. **Complete display of all content**: Show as many steps, list items, and key points as the original text has, no omissions allowed
2. **Maintain original structure**: Organize content according to the hierarchical structure and logical order of the original text
3. **Precise correspondence to original modules**: Only create modules based on actual content in the original text, do not add parts that do not exist in the original
4. **Avoid empty modules**: Each module must have specific content, do not create placeholder modules

## Core Design Requirements
Maintain the core information from the original file, presenting all content in a more readable and visual way
Add an author information area at the bottom of the page, including:
* Author Name: [Magic School AI]
* Social Media Links: At least include Twitter/X
* Copyright Information and Year

## Design Style
Overall style references Linear App's minimalist modern design
Use clear visual hierarchy to highlight important content
Color scheme should be professional and harmonious, suitable for long-term reading
Add unique visual identifiers for each step/key point

## Theme Toggle Feature (Must Implement)
Implement complete dark/light mode toggle functionality:
1. Define CSS variables for all colors, ensuring all elements change color correctly when themes switch
2. Add JavaScript toggle logic, support localStorage state persistence
3. Add obvious theme toggle button that can immediately switch themes when clicked
4. All color changes should have CSS transition effects

## Technical Specifications
Use HTML5, Tailwind CSS 3.0+ (via CDN) and necessary JavaScript
Code structure is clear, contains appropriate comments, easy to understand and maintain
Ensure theme toggle functionality works properly in all browsers

## Responsive Design
The page must display perfectly on all devices (mobile, tablet, desktop)
Optimize layout and font sizes for different screen sizes
Ensure good touch experience on mobile devices

## Media Resources
Use Markdown image links from the document (if any)
Use video embed code from the document (if any)

## Icons and Visual Elements
Use professional icon libraries like Font Awesome or Material Icons (via CDN)
Add progress indicators or number identifiers for each step
Choose appropriate illustrations or charts to display data based on content theme
Avoid using emojis as main icons

## Interactive Experience
Add appropriate micro-interactions to enhance user experience
Buttons have slight scaling and color changes on hover
Card elements have refined shadows and border effects on hover
Smooth transition effects when scrolling through pages
Elegant fade-in animation when content blocks load

## Content Organization Optimization
Step-type content uses visual elements like number identifiers, progress bars, timelines
List content uses icons, color coding, grouped display
Categorized content uses card layouts, tag systems
Key content uses highlighted backgrounds, borders, special fonts for emphasis

## Performance Optimization
Ensure fast page loading speed, avoid unnecessary large resources
Implement lazy loading technology for long page content

## Output Requirements
Provide a complete runnable single HTML file, including all necessary CSS and JavaScript
Ensure code complies with W3C standards, no error warnings
Pages maintain consistent appearance and functionality across different browsers
Please create the most suitable visualization webpage based on the uploaded file's content type (document, data, image, etc.) to showcase that content.

Important Reminder: Please first analyze the complete structure of the original text, ensure the visualization webpage contains all content elements from the original text, without missing any steps or key points.`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'medium'
    }
  }

}