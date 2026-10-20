import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createMockPlatform } from './mock-platform.mjs';

const database = JSON.parse(readFileSync(resolve('migration-artifacts/mock/database.json'), 'utf8'));
const analyticsTags = JSON.parse(readFileSync(resolve('migration-artifacts/mock/analytics-tags.json'), 'utf8'));
const prototypeDatabase = JSON.parse(readFileSync(resolve("migration-artifacts/mock/prototype-data.json"), "utf8"));
const libraryDatabase = JSON.parse(readFileSync(resolve("migration-artifacts/mock/library-data.json"), "utf8"));
const operationsDatabase = JSON.parse(readFileSync(resolve("migration-artifacts/mock/operations-data.json"), "utf8"));
const mock = createMockPlatform({ accountSignInEnabled: false, operationsDatabase, database, prototypeDatabase, libraryDatabase, analyticsTags, validatePayload: async payload => { const { isLibraryDraft } = await vite.ssrLoadModule('/src/domain/libraryDraft.ts'); const { resolvePrototypeLibrary } = await vite.ssrLoadModule('/src/domain/prototypeLibrary.ts'); if (!isLibraryDraft(payload)) throw new Error('Invalid Library snapshot'); resolvePrototypeLibrary(payload.data, payload.siteKey, payload.baseRevision); }, statePath: resolve('.mock-platform/server-state.json') });
await new Promise((resolve, reject) => { mock.once('error', reject); mock.listen(8787, '127.0.0.1', resolve); });
const vite = await createViteServer({ plugins: [{ name: 'admin-passkey-domain', configureServer(server) { server.middlewares.use((req, res, next) => {
  const host = req.headers.host;
  if (host === '127.0.0.1:5180' && /^\/admin-center(?:[/?]|$)/.test(req.url ?? '')) {
    res.writeHead(302, { Location: `http://localhost:5180${req.url}`, 'Cache-Control': 'no-store' }); res.end(); return;
  }
  next();
}); } }], define: { 'import.meta.env.VITE_MOCK_PLATFORM_ENABLED': 'true' }, server: { host: '127.0.0.1', port: 5180, strictPort: true, proxy: { '/api/mock': 'http://127.0.0.1:8787' } } });
try { await vite.listen(); } catch (error) { mock.close(); await vite.close(); throw error; }
console.log('Local mock platform enabled. PRASE/payment responses are synthetic. No emails are sent.');
vite.printUrls();
console.log('Admin Center (passkey domain): http://localhost:5180/admin-center');
const stop = async () => { mock.close(); await vite.close(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
