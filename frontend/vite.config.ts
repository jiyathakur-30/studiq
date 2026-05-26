import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGithubPages =
  process.env.GITHUB_ACTIONS || process.env.GH_PAGES

export default defineConfig({
  plugins: [react()],
  base: isGithubPages ? "/studiq/" : "/",
})