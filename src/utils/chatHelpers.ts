export const isSimpleGreeting = (content: string): boolean => {
  return /^(在\?|在？|你好|hello|hi|在吗|在嘛)$/i.test(content)
}

export const generateGreetingResponse = (): string => {
  return `在的！😊 有什么我可以帮你的吗？

我可以帮你:
• 📐 分析数学公式 (如 y=x)
• 📊 分析教育内容
• 🎨 生成可视化图表

直接输入你的问题即可！`
}

export const createStatusUpdater = (updateMessage: (id: string, updates: any) => void, messageId: string) => {
  let interval: number | null = null
  
  const start = () => {
    if (interval) return // 防止重复创建
    
    interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString()
      updateMessage(messageId, { 
        content: `⏳ AI仍在分析中...（${currentTime}）请继续等待，不要关闭页面`, 
        status: 'thinking' 
      })
    }, 10000) // 每10秒更新一次状态
    
    return interval
  }
  
  const stop = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }
  
  return { start, stop }
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}