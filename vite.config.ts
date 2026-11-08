import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ldrawVitePlugin } from './vite-plugin-ldraw.ts'

// GitHub Pages project sites are served from /<repo-name>/. The repository
// name is provided automatically by the Actions environment, so renames and
// forks keep working. VITE_BASE_PATH can override it for custom domains.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE_PATH || (repositoryName ? `/${repositoryName}/` : './')

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    ldrawVitePlugin(),
  ],
})
