import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import resume from './api/resume.js'
import preview from './api/preview.js'

// In development, serve the /api routes the same way the Vercel functions do in production.
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/resume', (req, res) => resume(req, res))
    server.middlewares.use('/api/preview', (req, res) => preview(req, res))
  },
})

export default defineConfig({ plugins: [react(), devApi()] })
