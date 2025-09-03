import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, TrendingUp, BookOpen, ArrowRight, Sparkles } from 'lucide-react'

export const DemoSection = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const useCases = [
    {
      icon: FileText,
      title: t('landing.demo.academic.title', '学术论文'),
      description: t('landing.demo.academic.description', '将复杂公式转为互动图表'),
      before: '/demo/academic-before.png',
      after: '/demo/academic-after.png'
    },
    {
      icon: TrendingUp,
      title: t('landing.demo.business.title', '商业报告'),
      description: t('landing.demo.business.description', '数据可视化，一目了然'),
      before: '/demo/business-before.png',
      after: '/demo/business-after.png'
    },
    {
      icon: BookOpen,
      title: t('landing.demo.education.title', '教学材料'),
      description: t('landing.demo.education.description', '让知识更生动有趣'),
      before: '/demo/education-before.png',
      after: '/demo/education-after.png'
    }
  ]

  return (
    <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.demo.title', '看看 Magic School AI 能做什么')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('landing.demo.subtitle', '真实案例，真实效果')}
          </p>
        </motion.div>

        {/* Tab 切换 */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <motion.button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{useCase.title}</span>
              </motion.button>
            )
          })}
        </div>

        {/* 内容展示 */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
        >
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Before */}
            <div className="relative">
              <div className="absolute top-4 left-4 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm font-medium">
                {t('landing.demo.before', '原始文档')}
              </div>
              <div className="bg-gray-900 rounded-lg p-6 h-96 flex items-center justify-center border border-gray-700">
                {/* 这里可以放置实际的演示图片或模拟内容 */}
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">复杂的文档内容</p>
                  <div className="space-y-2 text-left max-w-xs mx-auto">
                    <div className="h-2 bg-gray-700 rounded w-full" />
                    <div className="h-2 bg-gray-700 rounded w-4/5" />
                    <div className="h-2 bg-gray-700 rounded w-3/4" />
                    <div className="h-2 bg-gray-700 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ArrowRight className="h-12 w-12 text-purple-500" />
              </motion.div>
            </div>

            {/* After */}
            <div className="relative">
              <div className="absolute top-4 left-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-medium">
                {t('landing.demo.after', 'AI 转换后')}
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-6 h-96 flex items-center justify-center border border-purple-700/50">
                {/* 这里可以放置实际的演示图片或模拟内容 */}
                <div className="text-center">
                  <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-white mb-4">精美的可视化效果</p>
                  <div className="space-y-3 max-w-xs mx-auto">
                    <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg animate-pulse" />
                      <div className="h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div className="mt-8 text-center">
            <h3 className="text-xl font-semibold mb-2">{useCases[activeTab].title}</h3>
            <p className="text-gray-400">{useCases[activeTab].description}</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}