import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom, not node: config modules like progressSteps.ts read window.location
    // via getActiveClient()/resolveClientId() at import time.
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
