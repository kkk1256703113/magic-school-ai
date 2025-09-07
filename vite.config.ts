import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/replicate': {
        target: 'https://api.replicate.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/replicate/, ''),
        headers: {
          'Origin': 'https://api.replicate.com'
        }
      },
      '/api': {
        target: 'http://45.77.86.20:8080',
        changeOrigin: true,
        secure: false,
        // 不要移除/api前缀，因为后端路由包含/api
        // rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          'Origin': 'http://localhost:3000'
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // 确保React Context正确初始化
      external: [],
      output: {
        manualChunks: (id) => {
          // 基于文档成功经验：确保React生态系统完整性
          if (id.includes('node_modules')) {
            // React完整生态系统 - 包含所有React相关依赖
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router') || 
                id.includes('scheduler') ||
                id.includes('react-hot-toast') ||
                id.includes('framer-motion') ||
                id.includes('react-i18next') ||
                id.includes('react-dropzone') ||
                id.includes('react-chartjs-2')) {
              return 'react-vendor'
            }
            // 大型库单独分离
            if (id.includes('pdfjs-dist')) {
              return 'pdf-lib'
            }
            // 其他所有第三方库合并
            return 'vendor'
          }
          // AI服务相关代码保持分离
          if (id.includes('src/services/ai')) {
            return 'ai-services'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000, // 提高警告阈值到1MB
  },
})
