import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), {
    name: 'local-library-catalog',
    configureServer(server) {
      // The catalog-only dev server reads the persisted reviewed Library export.
      // Operational localStorage records and the authenticated mock server are separate.
      server.middlewares.use('/api/local-library/catalog', async (request, response) => {
        if (request.method !== 'GET') { response.statusCode = 405; response.end(); return }
        try {
          const [records, tracking] = await Promise.all([
            readFile(resolve('migration-artifacts/mock/library-data.json'), 'utf8'),
            readFile(resolve('migration-artifacts/mock/analytics-tags.json'), 'utf8'),
          ])
          response.setHeader('Content-Type', 'application/json')
          response.setHeader('Cache-Control', 'no-store')
          response.end(JSON.stringify({ revision: `local:v1:sha256:${createHash('sha256').update(records).digest('hex')}`, data: JSON.parse(records), analyticsTags: JSON.parse(tracking) }))
        } catch {
          response.statusCode = 503
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Stored Library export is unavailable. Run npm run mock:seed.' }))
        }
      })
    },
  }],
})
