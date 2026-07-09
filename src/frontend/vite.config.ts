import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Not 8000: kp-typedb's docker-compose service in this project family
    // permanently publishes TypeDB's own HTTP API on that port too.
    proxy: {
      '/document': 'http://localhost:8001',
      '/field': 'http://localhost:8001',
      '/auth': 'http://localhost:8001',
      '/me': 'http://localhost:8001',
    },
  },
})
