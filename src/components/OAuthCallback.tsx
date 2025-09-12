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
      
      // 添加sessionStorage标记，防止页面刷新重复处理
      const callbackKey = 'oauth_callback_processed'
      if (sessionStorage.getItem(callbackKey)) {
        console.log('[OAuth] Already processed in this session')
        navigate('/app')
        return
      }
      sessionStorage.setItem(callbackKey, 'true')
      
      console.log('[OAuth] Starting callback processing')
      
      // 先检查URL中是否直接有token（后端302重定向的情况）
      const tokenFromUrl = searchParams.get('token')
      const providerFromUrl = searchParams.get('provider')
      
      if (tokenFromUrl) {
        console.log('[OAuth] Found token in URL, using it directly')
        // 直接使用URL中的token
        localStorage.setItem('token', tokenFromUrl)
        
        // 显示成功消息
        const providerName = providerFromUrl === 'google' ? 'Google' : 'GitHub'
        toast.success(`${providerName}登录成功！`)
        
        // 清理URL中的参数并跳转
        setTimeout(() => {
          navigate('/app', { replace: true })
          window.location.reload()
        }, 100)
        return
      }
      
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
      
      // 构建API URL - 确保使用正确的HTTPS地址
      // 在生产环境中，直接使用相对路径，避免环境变量问题
      const apiUrl = window.location.origin.includes('localhost') 
        ? `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/oauth/${provider}/callback?code=${code}`
        : `/api/auth/oauth/${provider}/callback?code=${code}`
      
      console.log('[OAuth] Redirecting to backend API:', apiUrl)
      
      // 直接跳转到后端API，让浏览器处理302重定向
      // 后端会重定向到 /app?token=xxx&provider=xxx
      window.location.href = apiUrl
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