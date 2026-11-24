import { defineConfig } from 'vitest/config';
import prototype from './vitest.config';

// Catalog reconstruction is CPU-heavy. Keep these explicit checks predictable on
// smaller hosted workers without relaxing the ordinary behavior-test timeout.
export default defineConfig({
  ...prototype,
  test: {
    ...prototype.test,
    include: [
      'src/domain/freshStartCatalog.test.ts',
      'src/domain/restoredSites.test.ts',
      'src/domain/amaGiSite.test.ts',
    ],
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});
