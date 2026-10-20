import { afterEach, expect, it } from "vitest";
import { analyticsTagId, createAnalyticsPayload } from "../domain/analytics";
import { getAnalyticsInventory } from "./inventory";
import { attachPageAnalytics, setAnalyticsSink } from "./runtime";

afterEach(() => { setAnalyticsSink(null); document.body.innerHTML = ""; });
it("has stable unique tags and selected-Site scope across all ten Sites", () => {
  const all = getAnalyticsInventory();
  expect(new Set(all.map(t => t.id)).size).toBe(all.length);
  expect(new Set(all.flatMap(t => t.sites)).size).toBe(10);
  for (const site of new Set(all.flatMap(t => t.sites))) expect(getAnalyticsInventory(site).every(t => t.sites.includes(site))).toBe(true);
  expect(all.some(t => t.kind === "drawer")).toBe(true);
  expect(all.some(t => t.kind === "modal")).toBe(true);
});
it("only constructs permitted metadata and excludes all supplied sensitive values", () => {
  const tag = getAnalyticsInventory("demo").find(t => t.kind === "field")!;
  const payload = createAnalyticsPayload(tag, "change", { siteKey: "demo", template: "multi", revision: "prototype", value: "123-45-6789", email: "sensitive@example.com", health: "yes", href: "?token=secret" });
  expect(payload?.properties).toEqual({ siteKey: "demo", template: "multi", revision: "prototype" });
  expect(JSON.stringify(payload)).not.toContain("secret");
  expect(createAnalyticsPayload(tag, "change", { siteKey: "unknown", template: "multi", revision: "prototype" })).toBeNull();
  expect(createAnalyticsPayload(tag, "change", { siteKey: "demo", template: "multi", revision: "secret" })).toBeNull();
});
it("captures page views, input changes and navigation without reading input values", () => {
  const tags = getAnalyticsInventory("demo"), field = tags.find(t => t.pageId === "eligibility" && t.kind === "field")!;
  const root = document.createElement("div"); document.body.append(root);
  const wrapper = document.createElement("div"); wrapper.dataset.analyticsField = field.elementKey;
  const input = document.createElement("input"); input.value = "private"; wrapper.append(input); root.append(wrapper);
  const next = document.createElement("button"); next.dataset.analyticsNavigation = "next"; root.append(next);
  const events: unknown[] = []; setAnalyticsSink(p => events.push(p));
  const detach = attachPageAnalytics(root, "eligibility", { siteKey: "demo", template: "multi", revision: "prototype" }, tags);
  input.dispatchEvent(new Event("change", { bubbles: true })); next.click();
  expect(events).toHaveLength(3); expect(JSON.stringify(events)).not.toContain("private");
  detach(); input.dispatchEvent(new Event("change", { bubbles: true })); expect(events).toHaveLength(3);
  expect((events[1] as { tagId: string }).tagId).toBe(analyticsTagId("eligibility", "field", field.elementKey));
});

it("separates candidate definitions and local hooks from unconfigured vendor tags", () => {
  const tags = getAnalyticsInventory();
  expect(tags.every(tag => tag.description && tag.source)).toBe(true);
  expect(tags.every(tag => tag.adobe.mapping === null && tag.contentsquare.mapping === null)).toBe(true);
  expect(tags.every(tag => tag.adobe.status === "not-configured" && tag.contentsquare.status === "not-configured")).toBe(true);
  expect(tags.some(tag => tag.status === "local-hook")).toBe(true);
  expect(tags.filter(tag => tag.source === "proposed-interaction").every(tag => tag.status === "proposed")).toBe(true);
  expect(tags.filter(tag => tag.elementKey === "privacy-notice")).toHaveLength(2);
  expect(tags.filter(tag => tag.elementKey === "menu")).toHaveLength(1);
  expect(tags.filter(tag => tag.source === "shared-component").every(tag => tag.sites.length === 10)).toBe(true);
  expect(tags.every(tag => tag.sites.length > 0 && tag.pageId !== "unplaced")).toBe(true);
  expect(tags.find(tag => tag.pageId === "home" && tag.kind === "page")?.events).toEqual(["view"]);
});

it("includes source-reviewed controls and scopes rate toggles to enabled Sites", () => {
  const all = getAnalyticsInventory();
  const rates = all.filter(tag => tag.elementKey === "coverage-rate-frequency");
  expect(rates.length).toBe(1);
  expect(rates[0].kind).toBe("toggle");
  expect(rates[0].events).toEqual(["change"]);
  expect(rates[0].condition).toContain("Frequency toggle enabled");
  for (const site of rates[0].sites) {
    expect(getAnalyticsInventory(site).some(tag => tag.elementKey === "coverage-rate-frequency")).toBe(true);
  }
  expect(all.some(tag => tag.kind === "field" && tag.pageId === "payment")).toBe(true);
  for (const key of ["see-coverage-options", "save-beneficiary", "quote-get-estimates", "confirm-remove-coverage", "print"]) {
    const matches = all.filter(tag => tag.elementKey === key);
    expect(matches.length, key).toBeGreaterThan(0);
    expect(matches.every(tag => tag.source === "component-definition" && tag.sourceFile.startsWith("src/") && tag.condition)).toBe(true);
    expect(matches.every(tag => tag.status === "proposed")).toBe(true);
  }
  expect(all.some(tag => tag.pageId === "beneficiary" && tag.kind === "drawer" && tag.elementKey === "beneficiary")).toBe(false);
});

it("covers document, list, verification and shared-shell actions without claiming instrumentation", () => {
  const tags = getAnalyticsInventory();
  for (const [pageId, elementKey, kind] of [
    ["receipt", "download-application", "button"],
    ["receipt", "download-payment", "button"],
    ["review", "download-application", "button"],
    ["eligibility", "child-editor", "modal"],
    ["profile", "company-confirm-remove", "button"],
    ["eligibility", "member-verification", "modal"],
    ["resume-code", "resend-code", "button"],
    ["app-shell", "cookie-banner", "tool"],
    ["app-shell", "skip-to-content", "link"],
    ["app-shell", "coverage-category-tabs", "navigation"],
  ]) {
    const tag = tags.find(tag => tag.pageId === pageId && tag.elementKey === elementKey && tag.kind === kind);
    expect(tag, `${pageId}/${elementKey}`).toMatchObject({ source: "component-definition", status: "proposed" });
    expect(tag?.condition).toBeTruthy();
    expect(tag?.adobe.mapping).toBeNull();
    expect(tag?.contentsquare.mapping).toBeNull();
  }
  for (const tag of tags.filter(tag => tag.kind === "page" && !tag.events.includes("submit"))) {
    expect(tag.trigger).not.toContain("submission");
    expect(tag.description).toContain("view");
  }
  expect(tags.filter(tag => tag.elementKey === "quote-calculator").every(tag => tag.events.join(",") === "open,close")).toBe(true);
});
