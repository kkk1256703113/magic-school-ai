import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      // 获取URL中的code参数
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      // 从路径中判断是Google还是GitHub
      const isGoogle = window.location.pathname.includes('google')
      const provider = isGoogle ? 'google' : 'github'
      
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
      
      try {
        // 调用后端API处理OAuth回调
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/oauth/${provider}/callback?code=${code}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('OAuth回调处理失败')
        }
        
        const data = await response.json()
        
        if (data.success && data.token) {
          // 保存token并自动获取用户信息
          localStorage.setItem('token', data.token)
          
          // 显示成功消息
          toast.success(`${provider === 'google' ? 'Google' : 'GitHub'}登录成功！`)
          
          // 重新加载页面以触发AuthContext的token验证
          window.location.href = '/app'
        } else {
          throw new Error(data.error || 'OAuth登录失败')
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err)
        toast.error(err.message || 'OAuth登录失败')
        navigate('/')
      }
    }
    
    handleCallback()
  }, [searchParams, navigate])
  
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