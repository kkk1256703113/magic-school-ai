import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Brain, FileText, Sparkles } from 'lucide-react'

export const FeaturesSection = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: Brain,
      title: t('landing.features.ai.title', '双 AI 模型'),
      description: t('landing.features.ai.description', 'GPT-5 + Claude 4 协同工作'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: t('landing.features.format.title', '全格式支持'),
      description: t('landing.features.format.description', 'PDF、Word、Markdown 等主流格式'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: t('landing.features.output.title', '专业输出'),
      description: t('landing.features.output.description', '一键生成精美 HTML 作品集'),
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.features.title', '核心优势')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('landing.features.subtitle', '强大的 AI 技术，简单的使用体验')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative group"
              >
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300">
                  {/* 背景光效 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                  
                  {/* 图标 */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* 内容 */}
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}