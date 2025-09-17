import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check } from 'lucide-react'

interface LanguageSwitcherProps {
  className?: string
  dropdownAlign?: 'left' | 'right'
}

export const LanguageSwitcher = ({ className = '', dropdownAlign = 'right' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', nativeName: '简体中文', flag: '🇨🇳' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className={`${className.includes('fixed') ? '' : 'relative'} ${className}`}
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 渐变背景效果 */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          layoutId="languageHover"
        />

        {/* 内容 */}
        <div className="relative flex items-center gap-2 z-10">
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <Globe className="h-4 w-4 text-blue-400" />
          </motion.div>

          <motion.span
            className="text-base leading-none"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {currentLanguage.flag}
          </motion.span>

          <span className="hidden sm:inline font-medium">
            {i18n.language === 'zh' ? '语言' : 'Language'}
          </span>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3 text-gray-300 group-hover:text-white transition-colors" />
          </motion.div>
        </div>

        {/* 微妙的光效 */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 下拉菜单 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8, x: dropdownAlign === 'left' ? -8 : 8 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8, x: dropdownAlign === 'left' ? -8 : 8 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.8
              }}
              className={`absolute ${dropdownAlign === 'right' ? 'right-0' : 'left-0'} top-full mt-3 min-w-[180px] bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden`}
            >
              {/* 顶部装饰线 */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="py-2">
                {languages.map((language, index) => (
                  <motion.button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-white/10 ${
                      i18n.language === language.code
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white'
                        : 'text-gray-200 hover:text-white'
                    }`}
                  >
                    <motion.span
                      className="text-lg"
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      {language.flag}
                    </motion.span>

                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{language.name}</span>
                      {language.nativeName !== language.name && (
                        <span className="text-xs text-gray-400 group-hover:text-gray-300">
                          {language.nativeName}
                        </span>
                      )}
                    </div>

                    {i18n.language === language.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="h-4 w-4 text-blue-400" />
                      </motion.div>
                    )}

                    {/* 悬停效果 */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      layoutId={`hover-${language.code}`}
                    />
                  </motion.button>
                ))}
              </div>

              {/* 底部装饰线 */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}