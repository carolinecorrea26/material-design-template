import { describe, expect, it } from "vitest";
import { clients } from "../clients";
import { getGlobalPages, resolveClientPages, resolvePageVisibility } from "./resolveClientPages";

describe("resolvePageVisibility", () => {
  it("inherited: a page with no client override is required and always shown", () => {
    const result = resolvePageVisibility("contact", clients.demo);
    expect(result.status).toBe("inherited");
    expect(result.effective.included).toBe(true);
    expect(result.effective.requirement).toBe("required");
    expect(result.override).toBeUndefined();
  });

  it("overridden: abe makes beneficiary optional", () => {
    const result = resolvePageVisibility("beneficiary", clients.abe);
    expect(result.status).toBe("overridden");
    expect(result.effective.included).toBe(true);
    expect(result.effective.requirement).toBe("optional");
    expect(result.override).toEqual({ requirement: "optional" });
  });

  it("disabled: a client that excludes a required page (page requirement = none)", () => {
    const excludedClient = {
      ...clients.abe,
      pages: { requirements: { beneficiary: "none" as const } },
    };
    const result = resolvePageVisibility("beneficiary", excludedClient);
    expect(result.status).toBe("disabled");
    expect(result.effective.included).toBe(false);
    expect(result.effective.requirement).toBe("none");
  });

  it("health pages are always inherited/included — gated by coverage selection at runtime, not per-client config", () => {
    const result = resolvePageVisibility("health-si", clients.waepa);
    expect(result.status).toBe("inherited");
    expect(result.effective.included).toBe(true);
  });
});

describe("resolveClientPages", () => {
  it("resolves every registered page, marking beneficiary as overridden for abe", () => {
    const resolved = resolveClientPages(clients.abe);
    const beneficiary = resolved.find((p) => p.id === "beneficiary");
    expect(beneficiary?.status).toBe("overridden");
    expect(beneficiary?.global.category).toBe("application");
  });

  it("derives step/breadcrumb from the shared progress-step data, not a hardcoded per-page map", () => {
    const resolved = resolveClientPages(clients.demo);
    const coverage = resolved.find((p) => p.id === "coverage");
    expect(coverage?.global.step).toBe("Coverage");
    expect(coverage?.global.breadcrumb).toBe("Coverage");

    const home = resolved.find((p) => p.id === "home");
    expect(home?.global.step).toBe("N/A");
    expect(home?.global.breadcrumb).toBe("N/A");

    const healthSi = resolved.find((p) => p.id === "health-si");
    expect(healthSi?.global.breadcrumb).toBe("Health");
  });
});

describe("getGlobalPages", () => {
  it("takes no client argument and matches resolveClientPages' global slice for every client", () => {
    const global = getGlobalPages();
    expect(global.find((p) => p.id === "coverage")).toEqual(
      resolveClientPages(clients.demo).find((p) => p.id === "coverage")?.global,
    );
    expect(global.find((p) => p.id === "coverage")).toEqual(
      resolveClientPages(clients.waepa).find((p) => p.id === "coverage")?.global,
    );
  });
});
