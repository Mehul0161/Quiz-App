import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://quiz-app-b-o-backend.vercel.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
