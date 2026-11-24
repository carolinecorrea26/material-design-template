import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

// Local services consume catalog/portal.json for all Library/prototype definitions.
// Only operational examples need a separate seed; historical migration validation
// must not be a prerequisite for starting the current application.
const vite = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
});
try {
  const { createSeedDatabase } = await vite.ssrLoadModule('/src/persistence/seed.ts');
  const directory = resolve(process.env.MOCK_OPERATIONS_SEED_DIR ?? 'migration-artifacts/mock');
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'operations-data.json'), JSON.stringify(createSeedDatabase()) + '\n');
  console.log('Local operations examples seeded. Library and prototype definitions use public/catalog/portal.json.');
} finally {
  await vite.close();
}
