import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChatContainer } from '@/components/chat/ChatContainer'

const HomePage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // OAuth token处理逻辑 - 备用方案
  useEffect(() => {
    const handleOAuthToken = () => {
      const tokenFromUrl = searchParams.get('token')
      const providerFromUrl = searchParams.get('provider')
      
      if (tokenFromUrl && providerFromUrl) {
        console.log('[HomePage] Processing OAuth token from URL')
        
        // 检查是否已经处理过
        if (sessionStorage.getItem('homepage_oauth_processed')) {
          console.log('[HomePage] OAuth already processed by HomePage')
          return
        }
        
        // 设置处理标记
        sessionStorage.setItem('homepage_oauth_processed', 'true')
        
        try {
          // 保存token到localStorage
          localStorage.setItem('token', tokenFromUrl)
          console.log('[HomePage] Token saved to localStorage')
          
          // 显示成功消息
          const providerName = providerFromUrl === 'google' ? 'Google' : 
                              providerFromUrl === 'github' ? 'GitHub' : 'OAuth'
          toast.success(`${providerName}登录成功！`)
          
          // 清除URL参数
          navigate('/app', { replace: true })
          
          // 延迟刷新页面，确保状态更新
          setTimeout(() => {
            sessionStorage.removeItem('homepage_oauth_processed')
            window.location.reload()
          }, 1000)
          
        } catch (error) {
          console.error('[HomePage] Error processing OAuth token:', error)
          sessionStorage.removeItem('homepage_oauth_processed')
          toast.error('登录失败，请重试')
        }
      }
    }
    
    // 延迟执行，确保AuthContext有机会先处理
    const timeoutId = setTimeout(() => {
      handleOAuthToken()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [searchParams, navigate])

  return <ChatContainer />
}

export default HomePage