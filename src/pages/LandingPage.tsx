import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AuthModal } from '@/components/AuthModal'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { DemoSection } from '@/components/landing/DemoSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { TrustSection } from '@/components/landing/TrustSection'
import { CTASection } from '@/components/landing/CTASection'

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
      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Demo Section */}
      <DemoSection />

      {/* Pricing Section */}
      <PricingSection onSelectPlan={handleGetStarted} />

      {/* Trust Section */}
      <TrustSection />

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