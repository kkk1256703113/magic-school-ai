import React, { useState } from 'react'
import { X, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const { login, register, forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isForgotPassword) {
      // 处理忘记密码
      if (!email) {
        setErrorMessage('请输入邮箱地址')
        return
      }
      
      setIsLoading(true)
      setErrorMessage('')
      
      try {
        await forgotPassword(email)
        setSuccessMessage('密码重置邮件已发送到您的邮箱，请查收！')
        toast.success('重置邮件已发送！')
      } catch (error: any) {
        setErrorMessage(error.message || '发送重置邮件失败')
      } finally {
        setIsLoading(false)
      }
      return
    }
    
    // 处理登录/注册
    if (!email || !password) {
      setErrorMessage('请填写邮箱和密码')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    
    try {
      if (isLogin) {
        await login(email, password)
        toast.success('登录成功！')
        onClose()
        resetForm()
      } else {
        await register(email, password, username)
        toast.success('注册成功！')
        onClose()
        resetForm()
      }
    } catch (error: any) {
      setErrorMessage(error.message || (isLogin ? '登录失败' : '注册失败'))
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setErrorMessage('')
    setSuccessMessage('')
    setIsForgotPassword(false)
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }
  
  const showForgotPassword = () => {
    setIsForgotPassword(true)
    setErrorMessage('')
    setSuccessMessage('')
  }
  
  const backToLogin = () => {
    setIsForgotPassword(false)
    setErrorMessage('')
    setSuccessMessage('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {isForgotPassword && (
              <button
                onClick={backToLogin}
                className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isForgotPassword ? '重置密码' : (isLogin ? '登录账号' : '创建账号')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex">
              <div className="text-red-600 dark:text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex">
              <div className="text-green-600 dark:text-green-400">
                <Mail className="w-5 h-5" />
              </div>
              <div className="ml-2 text-sm text-green-700 dark:text-green-300">
                {successMessage}
              </div>
            </div>
          </div>
        )}

        {isForgotPassword ? (
          // 忘记密码表单
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                输入您的邮箱地址，我们将发送密码重置链接给您
              </p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱地址
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
                required
                disabled={!!successMessage}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? '发送中...' : (successMessage ? '已发送' : '发送重置邮件')}
            </button>
            
            {successMessage && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  返回登录
                </button>
              </div>
            )}
          </form>
        ) : (
          // 登录/注册表单
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  用户名（可选）
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="用户名"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  密码
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={showForgotPassword}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    忘记密码？
                  </button>
                )}
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            {/* 登录失败时更突出显示忘记密码 */}
            {isLogin && errorMessage && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={showForgotPassword}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  忘记密码？点击重置
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>
        )}

        {!isForgotPassword && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? '还没有账号？' : '已有账号？'}
            </span>
            <button
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            注册即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  )
}