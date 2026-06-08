import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: proxy API calls to the Express/Neon backend on :3000
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
