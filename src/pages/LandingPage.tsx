import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AuthModal } from '@/components/AuthModal'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CTASection } from '@/components/landing/CTASection'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const LandingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // 已登录用户直接进入应用
      navigate('/app')
    } else {
      // 未登录用户显示注册模态框
      setAuthMode('register')
      setShowAuthModal(true)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      {/* 语言切换按钮 - 右上角固定位置 */}
      <LanguageSwitcher className="fixed top-4 right-4 z-50" />

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection onGetStarted={handleGetStarted} />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}

export default LandingPage