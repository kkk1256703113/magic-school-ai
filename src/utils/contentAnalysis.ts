import { ContentType } from '../types/chat'
import { logger } from './logger'
import { aiService } from '../services/replicateAPI'

export const detectContentType = (content: string): ContentType => {
  const hasFormula = /[+\-*/=()x²³¹²³⁰⁴⁵⁶⁷⁸⁹∫∑√]|[a-zA-Z]\s*=|y\s*=|f\(|sin|cos|tan|log|ln|exp|\^|x\^/.test(content)
  const hasText = content.length > 20 || /[。！？，；：""''（）【】]/.test(content)
  
  if (hasFormula && hasText) return 'mixed'
  if (hasFormula) return 'formula'
  return 'text'
}

export const analyzeFormulaText = async (text: string) => {
  try {
    const file = new File([text], 'formula.txt', { type: 'text/plain' })
    return await aiService.parseFormulas(file)
  } catch (error) {
    logger.error('公式文本分析失败，使用降级方案', { error }, 'ContentAnalysis')
    return {
      formulas: [
        {
          latex: text.includes('=') ? text : `f(x) = ${text}`,
          category: 'math' as const,
          explanation: `数学表达式: ${text}`,
          difficulty: 'basic' as const,
          confidence: 0.95
        }
      ]
    }
  }
}

export const generateLocalAnalysisResponse = (userContent: string, contentType: ContentType): string => {
  let response = ''
  
  if (contentType === 'formula') {
    response = `我来帮你分析这个数学公式："${userContent}"。\n\n`
    
    // 公式分析
    response += `📐 **公式分析**\n`
    if (userContent.toLowerCase().includes('y=x')) {
      response += `• LaTeX格式: \`y = x\`\n`
      response += `• 说明: 这是一个简单的线性函数，表示y与x相等\n`
      response += `• 特点: 通过原点的45度直线，斜率为1\n\n`
    } else {
      response += `• LaTeX格式: \`${userContent}\`\n`
      response += `• 说明: 这是一个数学表达式\n\n`
    }
    
    // 内容分析
    response += `📊 **内容分析**\n`
    response += `• 学科: 数学\n`
    response += `• 难度: 基础\n`
    response += `• 标签: 线性函数, 基础代数\n`
    response += `• 学习目标: 理解线性关系的基本概念\n\n`
    
    // 可视化信息
    response += `🎨 **可视化建议**\n`
    response += `• 建议绘制坐标系图表\n`
    response += `• 标记几个关键点 (0,0), (1,1), (2,2)\n`
    response += `• 观察直线的斜率和截距\n\n`
    
  } else {
    response = `我来分析这段内容："${userContent}"。\n\n`
    
    response += `📊 **内容分析**\n`
    response += `• 内容类型: 文本内容\n`
    response += `• 长度: ${userContent.length} 字符\n`
    response += `• 建议: 可以进一步详细分析\n\n`
  }
  
  response += `⚠️ **注意**: 当前使用本地分析模式。要获得完整的AI分析功能，请配置API Token:\n\n`
  response += `1. 在项目根目录创建 \`.env.local\` 文件\n`
  response += `2. 添加: \`VITE_REPLICATE_API_TOKEN=你的API密钥\`\n`
  response += `3. 重启服务器\n\n`
  response += `有什么问题可以继续问我！😊`
  
  return response
}

export const generateResponseContent = (
  userContent: string, 
  contentType: ContentType, 
  results: any, 
  hasErrors: boolean = false, 
  errorDetails: string[] = []
): string => {
  let response = ''
  
  // 根据内容类型生成个性化回复
  if (contentType === 'formula') {
    response = `我来帮你分析这个数学公式："${userContent}"。\n\n`
  } else if (contentType === 'mixed') {
    response = `我来分析这段包含数学内容的文本。\n\n`
  } else {
    response = `我来分析这段内容。\n\n`
  }
  
  // 如果有错误，先显示错误信息
  if (hasErrors && errorDetails.length > 0) {
    response += `⚠️ **处理过程中遇到一些问题**\n`
    errorDetails.forEach(error => {
      response += `• ${error}\n`
    })
    response += `\n我会尽力提供可用的分析结果：\n\n`
  }
  
  // 公式分析结果
  if (results.formulas?.formulas?.length > 0) {
    response += `📐 **公式分析**\n`
    results.formulas.formulas.forEach((formula: any, index: number) => {
      response += `• LaTeX格式: \`${formula.latex}\`\n`
      response += `• 说明: ${formula.explanation}\n`
      if (index < results.formulas.formulas.length - 1) response += `\n`
    })
    response += `\n`
  }
  
  // 内容分析结果
  if (results.analysis) {
    response += `📊 **内容分析**\n`
    response += `• 学科: ${results.analysis.subject}\n`
    response += `• 难度: ${results.analysis.difficulty}\n`
    if (results.analysis.tags?.length > 0) {
      response += `• 标签: ${results.analysis.tags.join(', ')}\n`
    }
    if (results.analysis.learningObjectives?.length > 0) {
      response += `• 学习目标: ${results.analysis.learningObjectives.join(', ')}\n`
    }
    if (results.analysis.confidence !== undefined) {
      response += `• 置信度: ${Math.round(results.analysis.confidence * 100)}%\n`
    }
    response += `\n`
  }
  
  // 可视化结果
  if (results.visualization) {
    response += `🎨 **可视化生成完成**\n`
    if (results.visualization.generatedImage) {
      response += `• ✅ 已生成函数图像\n`
    }
    if (results.visualization.codeOptions?.chartjs) {
      response += `• ✅ 已生成 Chart.js 配置\n`
    }
    if (results.visualization.codeOptions?.svg) {
      response += `• ✅ 已生成 SVG 代码\n`
    }
    response += `\n查看上方的可视化图表和代码选项。\n\n`
  }
  
  response += `💡 **提示**: 你可以继续问我关于这个内容的任何问题！`
  
  return response
}

export const handleAPIError = (error: any): { message: string, details: string } => {
  let errorMessage = '未知错误'
  
  if (error instanceof Error) {
    errorMessage = error.message
    
    // 特定错误处理
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'API密钥无效或已过期'
    } else if (errorMessage.includes('402') || errorMessage.includes('Payment Required')) {
      errorMessage = 'API余额不足，请充值'
    } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      errorMessage = '网络连接失败，请检查网络或API服务状态'
    } else if (errorMessage.includes('API Token未配置')) {
      errorMessage = 'API Token未配置，请在.env.local文件中添加VITE_REPLICATE_API_TOKEN'
    }
  }
  
  return {
    message: errorMessage,
    details: error instanceof Error ? error.stack || '' : String(error)
  }
}