import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import resume from './api/resume.js'

// In development, serve /api/resume the same way the Vercel function does in production.
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) { server.middlewares.use('/api/resume', (req, res) => resume(req, res)) },
})

export default defineConfig({ plugins: [react(), devApi()] })
