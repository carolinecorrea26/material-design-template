import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Use the same catalog file Vite serves locally and copies into the static build.
export default defineConfig(() => ({
  plugins: [react()],
  define: {
    'import.meta.env.PORTAL_CATALOG_SHA256': JSON.stringify(createHash('sha256')
      .update(readFileSync(new URL('./public/catalog/portal.json', import.meta.url)))
      .digest('hex')),
  },
}))
