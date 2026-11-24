import { defineConfig, mergeConfig } from 'vitest/config';
import prototype from './vitest.config';

// Explicitly requested maintenance of historical and out-of-scope tooling only.
export default mergeConfig(prototype, defineConfig({
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.mjs'] },
}));
