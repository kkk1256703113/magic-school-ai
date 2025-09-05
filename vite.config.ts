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
  },
})
