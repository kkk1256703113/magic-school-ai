import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChatContainer } from '@/components/chat/ChatContainer'
import toast from 'react-hot-toast'

const HomePage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  useEffect(() => {
    // 检查URL中是否有OAuth重定向的token
    const tokenFromUrl = searchParams.get('token')
    const providerFromUrl = searchParams.get('provider')
    
    if (tokenFromUrl) {
      console.log('[HomePage] Found OAuth token in URL, processing...')
      
      // 清理OAuth回调处理标记
      sessionStorage.removeItem('oauth_callback_processed')
      
      // 保存token到localStorage
      localStorage.setItem('token', tokenFromUrl)
      console.log('[HomePage] Token saved to localStorage:', tokenFromUrl.substring(0, 20) + '...')
      
      // 显示成功消息
      const providerName = providerFromUrl === 'google' ? 'Google' : 
                          providerFromUrl === 'github' ? 'GitHub' : 'OAuth'
      toast.success(`${providerName}登录成功！`)
      
      // 延迟清理URL和刷新，确保token保存完成
      setTimeout(() => {
        // 清理URL中的参数
        navigate('/app', { replace: true })
        
        // 再延迟一下刷新页面以触发AuthContext更新
        setTimeout(() => {
          console.log('[HomePage] Reloading page to update AuthContext')
          window.location.reload()
        }, 200)
      }, 100)
    }
  }, [searchParams, navigate])
  
  return <ChatContainer />
}

export default HomePage