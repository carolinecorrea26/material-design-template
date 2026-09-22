import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Storybook URL helpers", () => {
  it("uses the local Storybook server by default", async () => {
    vi.stubEnv("VITE_STORYBOOK_URL", "");
    const { getStorybookStoryUrl } = await import("./storybook");

    expect(getStorybookStoryUrl("layout-appheader--application-form-variant")).toBe(
      "http://localhost:6006/?path=/story/layout-appheader--application-form-variant",
    );
  });

  it("removes trailing slashes from the configured base URL", async () => {
    vi.stubEnv("VITE_STORYBOOK_URL", "https://example-storybook.netlify.app///");
    const { getStorybookDocsUrl, getStorybookUrl } = await import("./storybook");

    expect(getStorybookUrl("/?path=/story/foundations-colors--colors")).toBe(
      "https://example-storybook.netlify.app/?path=/story/foundations-colors--colors",
    );
    expect(getStorybookDocsUrl("foundations-colors")).toBe(
      "https://example-storybook.netlify.app/?path=/docs/foundations-colors--docs",
    );
  });
});
