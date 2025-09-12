import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChatContainer } from '@/components/chat/ChatContainer'

const HomePage = () => {
  const [searchParams] = useSearchParams()

  // OAuth token处理日志 - 仅用于调试
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    const providerFromUrl = searchParams.get('provider')
    
    if (tokenFromUrl || providerFromUrl) {
      console.log('[HomePage] OAuth params detected:', {
        hasToken: !!tokenFromUrl,
        provider: providerFromUrl,
        currentURL: window.location.href
      })
      // AuthContext会处理OAuth token，这里只是记录日志
    }
  }, [searchParams])

  return <ChatContainer />
}

export default HomePage