import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Shield, Zap, Globe } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted: () => void
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* 背景动画 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient" />
        <div className="absolute inset-0">
          {/* 动态网格背景 */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo/品牌 */}
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-12 w-12 text-blue-500 mr-3" />
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Magic School AI
              </span>
            </h1>
          </motion.div>

          {/* 副标题 */}
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 text-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Turn Complex Into Clear
          </motion.h2>

          {/* 描述 */}
          <motion.p 
            className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('landing.hero.description', 'AI 驱动的文档可视化平台，让复杂变简单')}
          </motion.p>

          {/* CTA按钮 */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <button
              onClick={onGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-white text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center gap-2">
                {t('landing.hero.cta', '免费开始')}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
                {t('landing.hero.ctaSubtitle', '每日免费额度')}
              </span>
            </button>

            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border border-gray-600 rounded-lg font-semibold text-gray-300 hover:bg-gray-800 transition-all duration-300"
            >
              {t('landing.hero.demo', '查看演示')}
            </button>
          </motion.div>

          {/* 信任标识 */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>{t('landing.hero.secure', '数据安全')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{t('landing.hero.fast', '快速处理')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>{t('landing.hero.multilingual', '多语言支持')}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* 滚动提示 */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-600 rounded-full mt-2 animate-scroll" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}