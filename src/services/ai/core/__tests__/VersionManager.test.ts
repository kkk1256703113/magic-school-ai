/**
 * 版本管理器测试文件
 * 验证备选方案功能是否正常
 */

import { promptVersionManager } from '../PromptVersionManager'
import { HTMLPrompts } from '@/services/ai/prompts/htmlPrompt'

// 简单的测试函数
function testVersionManager() {
  console.log('🧪 开始版本管理器测试...')

  // 测试1: 默认版本应该是stable
  const defaultVersion = promptVersionManager.getCurrentVersion()
  console.log(`✅ 默认版本: ${defaultVersion}`)
  console.assert(defaultVersion === 'stable', '默认版本应该是stable')

  // 测试2: 版本状态信息
  const status = promptVersionManager.getStatus()
  console.log(`✅ 版本状态:`, status)
  console.assert(status.stable === true, '应该处于stable状态')
  console.assert(status.enhanced === false, '不应该处于enhanced状态')

  // 测试3: 切换到enhanced版本
  promptVersionManager.switchVersion('enhanced')
  const enhancedVersion = promptVersionManager.getCurrentVersion()
  console.log(`✅ 切换后版本: ${enhancedVersion}`)
  console.assert(enhancedVersion === 'enhanced', '版本应该切换到enhanced')

  // 测试4: 测试HTMLPrompts版本选择
  const testContent = "测试内容"
  const promptConfig = HTMLPrompts.getGenerationPrompt(testContent)
  console.log(`✅ 提示词配置生成成功，当前版本: ${enhancedVersion}`)
  console.assert(promptConfig.prompt.includes(testContent), '提示词应该包含测试内容')

  // 测试5: 重置为stable版本
  promptVersionManager.resetToStable()
  const resetVersion = promptVersionManager.getCurrentVersion()
  console.log(`✅ 重置后版本: ${resetVersion}`)
  console.assert(resetVersion === 'stable', '重置后应该回到stable版本')

  console.log('🎉 版本管理器测试完成！所有测试通过。')
}

// 如果在浏览器环境或Node.js环境中直接运行此文件
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).testVersionManager = testVersionManager
  console.log('💡 在浏览器控制台中运行 testVersionManager() 来测试版本管理器')
} else {
  // Node.js环境
  testVersionManager()
}

export { testVersionManager }