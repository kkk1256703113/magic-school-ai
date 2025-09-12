import React, { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasHandledCallback = useRef(false)
  const isProcessing = useRef(false)

  useEffect(() => {
    // 双重防护：防止重复执行
    if (hasHandledCallback.current || isProcessing.current) {
      console.log('[OAuth] Already processed or processing, skipping')
      return
    }
    
    const handleCallback = async () => {
      // 立即设置处理标记，防止并发执行
      isProcessing.current = true
      hasHandledCallback.current = true
      
      console.log('[OAuth] Starting callback processing')
      
      // 首先检查URL中是否直接有token（后端302重定向的情况）
      // 这个检查必须在sessionStorage检查之前，确保token能被正确处理
      const tokenFromUrl = searchParams.get('token')
      const providerFromUrl = searchParams.get('provider')
      
      if (tokenFromUrl) {
        console.log('[OAuth] Found token in URL, processing it')
        // 直接使用URL中的token
        localStorage.setItem('token', tokenFromUrl)
        
        // 尝试解析用户信息并保存
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${tokenFromUrl}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            localStorage.setItem('user_data', JSON.stringify(userData))
          }
        } catch (error) {
          console.error('[OAuth] Error fetching user data:', error)
        }
        
        // 显示成功消息
        const providerName = providerFromUrl === 'google' ? 'Google' : 'GitHub'
        toast.success(`${providerName}登录成功！`)
        
        // 清理URL中的参数并跳转
        navigate('/app', { replace: true })
        setTimeout(() => {
          window.location.reload()
        }, 100)
        return
      }
      
      // 如果没有token，再检查sessionStorage标记，防止重复处理
      const callbackKey = 'oauth_callback_processed'
      if (sessionStorage.getItem(callbackKey)) {
        console.log('[OAuth] Already processed in this session, no token found')
        navigate('/app')
        return
      }
      sessionStorage.setItem(callbackKey, 'true')
      
      // 获取URL中的code参数（OAuth流程的第一步）
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      // 从路径中判断是Google还是GitHub
      const isGoogle = window.location.pathname.includes('google')
      const provider = isGoogle ? 'google' : 'github'
      
      console.log(`[OAuth] Processing ${provider} callback with code:`, code?.substring(0, 20) + '...')
      
      if (error) {
        toast.error(`OAuth登录失败: ${error}`)
        navigate('/')
        return
      }
      
      if (!code) {
        toast.error('未收到授权码')
        navigate('/')
        return
      }
      
      // 直接调用后端API获取token（不依赖浏览器重定向）
      console.log('[OAuth] Calling backend API to exchange code for token')
      
      try {
        // 使用fetch直接调用后端（后端需要支持返回JSON）
        const apiUrl = window.location.origin.includes('localhost')
          ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/oauth/${provider}/callback`
          : `https://api.magicschoolai.net/api/auth/oauth/${provider}/callback`
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.token) {
            console.log('[OAuth] Token received, saving and redirecting')
            localStorage.setItem('token', data.token)
            
            // 保存用户信息
            if (data.user) {
              localStorage.setItem('user_data', JSON.stringify(data.user))
            }
            
            // 显示成功消息
            const providerName = provider === 'google' ? 'Google' : 'GitHub'
            toast.success(`${providerName}登录成功！`)
            
            // 跳转到功能页面
            navigate('/app', { replace: true })
            setTimeout(() => {
              window.location.reload()
            }, 100)
          } else {
            throw new Error('未收到有效的token')
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || '认证失败')
        }
      } catch (error: any) {
        console.error('[OAuth] Error exchanging code for token:', error)
        toast.error(`OAuth登录失败: ${error.message}`)
        navigate('/')
      }
    }
    
    // 延迟执行，确保DOM完全渲染
    const timeoutId = setTimeout(() => {
      handleCallback()
    }, 100)
    
    // 清理函数
    return () => {
      clearTimeout(timeoutId)
    }
  }, []) // 移除所有依赖项，只在组件挂载时执行一次
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">正在登录...</h2>
          <p className="text-gray-600">请稍候，正在处理您的登录请求</p>
        </div>
      </div>
    </div>
  )
}