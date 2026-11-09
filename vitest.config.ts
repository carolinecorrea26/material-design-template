import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    // jsdom, not node: config modules like progressSteps.ts read window.location
    // via getActiveClient()/resolveClientId() at import time.
    environment: "jsdom",
    // Reviewed migration fixtures need a predictable budget on developer and CI machines.
    maxWorkers: 1,
    testTimeout: 15_000,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.mjs"],
  },
});
