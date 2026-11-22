import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import resume from './api/resume.js'
import preview from './api/preview.js'
import nate from './api/nate.js'

// In development, serve the /api routes the same way the Vercel functions do in production.
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/resume', (req, res) => resume(req, res))
    server.middlewares.use('/api/preview', (req, res) => preview(req, res))
    server.middlewares.use('/api/nate', (req, res) => nate(req, res))
  },
})

export default defineConfig(({ mode }) => {
  // the /api functions read their secrets (GEMINI_API_KEY for Nate) from .env.local in development
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['GEMINI_API_KEY', 'NATE_MODEL', 'NATE_EMBED_MODEL']) if (env[k] && !process.env[k]) process.env[k] = env[k]
  return { plugins: [react(), devApi()] }
})
