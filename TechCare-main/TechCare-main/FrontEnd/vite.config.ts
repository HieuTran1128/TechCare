import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward mọi request bắt đầu bằng /api đến backend
      '/api': {
        target: 'http://localhost:3000',       // ← port backend của bạn
        changeOrigin: true,
        secure: false,
        // Không cần rewrite vì backend đã dùng /api/users
      }
    }
  },
})
