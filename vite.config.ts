import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite serves public/catalog/portal.json locally and copies it into the static build.
export default defineConfig({ plugins: [react()] })
