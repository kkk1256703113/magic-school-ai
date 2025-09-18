import { ContentType } from '@/types/chat'
import { logger } from './logger'
import { aiService } from '@/services/ai'
import { getFriendlyErrorMessage, detectAPIErrorType, logAPIError } from './apiErrorHandler'
import type { TFunction } from 'i18next'

export const detectContentType = (content: string): ContentType => {
  const hasFormula = /[+\-*/=()x²³¹²³⁰⁴⁵⁶⁷⁸⁹∫∑√]|[a-zA-Z]\s*=|y\s*=|f\(|sin|cos|tan|log|ln|exp|\^|x\^/.test(content)
  const hasText = content.length > 20 || /[。！？，；：""''（）【】]/.test(content)
  
  if (hasFormula && hasText) return 'mixed'
  if (hasFormula) return 'formula'
  return 'text'
}

/**
 * 清理HTML内容，移除HTML标签之前的解释性文字
 * @param content 原始内容（可能包含解释性文字+HTML代码）
 * @returns 纯净的HTML内容
 */
export const cleanHTMLContent = (content: string): string => {
  logger.info('开始清理HTML内容', { 
    originalLength: content.length,
    preview: content.substring(0, 100)
  }, 'ContentAnalysis')
  
  // 首先检查是否已经是纯净的HTML（以<!DOCTYPE开头）
  if (content.trimStart().startsWith('<!DOCTYPE html>') || content.trimStart().startsWith('<!doctype html>')) {
    logger.info('内容已是纯净HTML（以DOCTYPE开头），无需清理', {}, 'ContentAnalysis')
    return content
  }
  
  // 检查是否在```html代码块中
  const codeBlockMatch = content.match(/```html\s*\n?([\s\S]*?)(?:```|$)/)
  if (codeBlockMatch && codeBlockMatch[1]) {
    const extractedContent = codeBlockMatch[1].trim()
    logger.info('从代码块中提取HTML内容', { 
      extractedLength: extractedContent.length 
    }, 'ContentAnalysis')
    return extractedContent // 直接返回提取的内容，不再递归
  }
  
  // 查找HTML文档的开始位置
  let htmlStartIndex = -1
  
  // 优先查找<!DOCTYPE html>
  const doctypeIndex = content.indexOf('<!DOCTYPE html>')
  if (doctypeIndex === -1) {
    const doctypeLowerIndex = content.indexOf('<!doctype html>')
    if (doctypeLowerIndex !== -1) {
      htmlStartIndex = doctypeLowerIndex
    }
  } else {
    htmlStartIndex = doctypeIndex
  }
  
  // 如果没有DOCTYPE，查找<html标签
  if (htmlStartIndex === -1) {
    const htmlMatch = content.match(/<html[^>]*>/i)
    if (htmlMatch && htmlMatch.index !== undefined) {
      htmlStartIndex = htmlMatch.index
    }
  }
  
  // 如果找到了HTML的开始位置，提取内容
  if (htmlStartIndex !== -1) {
    let cleanedContent = content.substring(htmlStartIndex).trim()
    
    // 移除可能的结尾```标记
    const endMarkerIndex = cleanedContent.lastIndexOf('```')
    if (endMarkerIndex > 0) {
      // 确保```是在HTML结束标签之后
      const htmlEndIndex = cleanedContent.lastIndexOf('</html>')
      if (htmlEndIndex === -1 || endMarkerIndex > htmlEndIndex) {
        cleanedContent = cleanedContent.substring(0, endMarkerIndex).trim()
      }
    }
    
    logger.success('HTML内容清理完成', { 
      originalLength: content.length,
      cleanedLength: cleanedContent.length,
      removedChars: content.length - cleanedContent.length
    }, 'ContentAnalysis')
    
    return cleanedContent
  }
  
  // 如果没有找到标准的HTML开始，但包含基本的HTML结构，返回原内容
  if (content.includes('<body') && content.includes('</body>')) {
    logger.info('内容包含HTML body标签，保持原样', {}, 'ContentAnalysis')
    return content
  }
  
  logger.warn('未找到有效的HTML内容标记，返回原内容', { 
    contentPreview: content.substring(0, 100) 
  }, 'ContentAnalysis')
  return content
}

/**
 * 验证HTML内容的完整性
 * @param htmlContent HTML内容
 * @returns 是否为有效的HTML文档
 */
export const isValidHTMLDocument = (htmlContent: string): boolean => {
  // 检查必要的HTML标签
  const hasDoctype = htmlContent.includes('<!DOCTYPE html>') || htmlContent.includes('<!doctype html>')
  const hasHtmlTag = /<html[^>]*>/.test(htmlContent) && htmlContent.includes('</html>')
  const hasBodyTag = /<body[^>]*>/.test(htmlContent) && htmlContent.includes('</body>')
  const hasHeadTag = /<head[^>]*>/.test(htmlContent) && htmlContent.includes('</head>')
  
  // 至少需要html和body标签
  const isValid = (hasDoctype || hasHtmlTag) && hasBodyTag
  
  logger.info('HTML文档验证', {
    hasDoctype,
    hasHtmlTag,
    hasBodyTag,
    hasHeadTag,
    isValid
  }, 'ContentAnalysis')
  
  return isValid
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


export const generateResponseContent = (
  userContent: string, 
  contentType: ContentType, 
  results: any, 
  hasErrors: boolean = false, 
  errorDetails: string[] = []
): string => {
  // 如果Claude返回了HTML内容，直接返回HTML
  if (results.analysis?.claudeAnalysis) {
    return results.analysis.claudeAnalysis
  }
  
  // 如果GPT-5返回了HTML内容（字符串格式），直接返回
  if (typeof results.analysis === 'string' && results.analysis.includes('<')) {
    return results.analysis
  }
  
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
  
  // 内容分析结果（如果是结构化的分析结果）
  if (results.analysis && typeof results.analysis === 'object' && results.analysis.subject) {
    response += `📊 **内容分析**\n`
    response += `• 学科: ${results.analysis.subject}\n`
    response += `• 难度: ${results.analysis.difficulty}\n`
    if (results.analysis.tags?.length > 0) {
      response += `• 标签: ${results.analysis.tags.join(', ')}\n`
    }
    if (results.analysis.learningObjectives?.length > 0) {
      response += `• 学习目标: ${results.analysis.learningObjectives.join(', ')}\n`
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

/**
 * 处理API错误 - 使用友好的国际化错误信息
 * @param error 错误对象
 * @param t 翻译函数（可选，如果没有提供则使用英文fallback）
 * @param remaining 剩余次数（可选）
 * @returns 友好的错误信息
 */
export const handleAPIError = (
  error: any,
  t?: TFunction,
  remaining?: number
): { message: string, details: string } => {
  // 记录错误日志
  logAPIError(error, 'ContentAnalysis')

  let errorMessage: string

  if (t) {
    // 如果有翻译函数，使用友好的国际化错误信息
    errorMessage = getFriendlyErrorMessage(error, t, remaining)
  } else {
    // Fallback：使用英文错误信息
    const errorType = detectAPIErrorType(error, remaining)

    switch (errorType.toString()) {
      case 'NO_CREDITS':
        errorMessage = '🎯 Out of AI Credits\n\nYour AI analysis credits have been used up! Don\'t worry, getting more is quick and easy.\n\n💎 Get More Credits: Add credits instantly to continue your AI-powered work'
        break
      case 'AUTH_ERROR':
        errorMessage = '🔐 Authentication failed. Please sign in again to continue.'
        break
      case 'NETWORK_ERROR':
        errorMessage = '🌐 Network connection issue. Please check your internet and try again.'
        break
      case 'SERVER_ERROR':
        errorMessage = '⚠️ Our AI service is temporarily unavailable. Please try again in a few moments.'
        break
      case 'PAYMENT_ERROR':
        errorMessage = '💳 Payment processing unavailable. Please try again later.'
        break
      case 'CONFIG_ERROR':
        errorMessage = '⚙️ Service configuration error. Please refresh the page and try again.'
        break
      case 'PROCESSING_ERROR':
        errorMessage = '⚡ AI processing failed. This might be a temporary issue - please try again.'
        break
      default:
        errorMessage = error instanceof Error ? error.message : String(error)
    }
  }

  return {
    message: errorMessage,
    details: error instanceof Error ? error.stack || '' : String(error)
  }
}