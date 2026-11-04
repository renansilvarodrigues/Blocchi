import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages project sites are served from /<repo-name>/, so use the repo path in production.
  // In local development we keep a relative root so the app still works when run with `vite`.
  base: process.env.NODE_ENV === 'production' ? '/Blocchi/' : './',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
