import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'dayana-photographic-guardedly.ngrok-free.dev'
    ],
    host: true
  },
  build: {
    rollupOptions: {
      input: '/index.html'
    }
  }
})
