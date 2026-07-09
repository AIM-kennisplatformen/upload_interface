import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/document': 'http://localhost:8000',
      '/field': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/me': 'http://localhost:8000',
    },
  },
})
