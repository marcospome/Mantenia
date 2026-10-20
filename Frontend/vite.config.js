import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Todo lo que empiece con /api se reenvía a la API de .NET (así no hace falta configurar CORS)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5100' } },
})
