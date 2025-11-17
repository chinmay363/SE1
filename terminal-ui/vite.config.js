import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/identify': 'http://localhost:3000',
      '/parking': 'http://localhost:3000',
      '/barrier': 'http://localhost:3000',
      '/payment': 'http://localhost:3000'
    }
  }
})
