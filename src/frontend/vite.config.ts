import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev-only stand-ins for what a Caddy reverse proxy does in front of
    // this app in real deployments: path-route to scepa-rs's metadata
    // server and Studio's PDF store. scepa-rs's own routes are just
    // /metadata/{sha256} (no /api prefix), so that one needs a rewrite;
    // Studio's PDF store already lives under /api/pdf, so that one doesn't.
    proxy: {
      '/api/metadata': {
        target: 'http://localhost:8081',
        rewrite: path => path.replace(/^\/api\/metadata/, '/metadata'),
      },
      '/api/pdf': 'http://localhost:10090',
    },
  },
})
