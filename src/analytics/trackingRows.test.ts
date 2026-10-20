import { expect, it } from "vitest";
import { getAnalyticsInventory } from "./inventory";
import { getAnalyticsTrackingRows } from "./trackingRows";

it("groups reusable controls while retaining every exact placement and tag ID", () => {
  const tags = getAnalyticsInventory();
  const rows = getAnalyticsTrackingRows(tags);
  expect(rows.length).toBeLessThan(tags.length);
  expect(rows.flatMap(row => row.placements).map(tag => tag.id).sort()).toEqual(tags.map(tag => tag.id).sort());
  const amounts = rows.filter(row => row.elementKey.startsWith("coverage-amount:"));
  expect(amounts).toHaveLength(1);
  expect(amounts[0].placements.length).toBeGreaterThan(10);
  const needs = rows.filter(row => row.elementKey === "needs-annual-income");
  expect(needs).toHaveLength(1);
  expect(needs[0].pageIds).toEqual(["Coverage needs calculator drawer"]);
  expect(needs[0].sharedArea).toBe("Coverage needs calculator drawer");
  expect(needs[0].accessPageIds.length).toBeGreaterThan(1);
  expect(needs[0].accessPageIds.sort()).toEqual([...new Set(needs[0].placements.map(tag => tag.pageId))].sort());
  expect(amounts[0].sharedArea).toBeUndefined();
  expect(amounts[0].accessPageIds).toEqual([]);
  expect(getAnalyticsTrackingRows(tags, true)).toHaveLength(tags.length);
});
it("does not merge unrelated labels, different vendors, or distinct riders", () => {
  const base = getAnalyticsInventory().find(tag => tag.elementKey.startsWith("coverage-amount:"))!;
  const distinct = { ...base, id: "other", elementKey: "other-control" };
  const mapped = { ...base, id: "mapped", adobe: { ...base.adobe, mapping: "event42" } };
  expect(getAnalyticsTrackingRows([base, distinct, mapped])).toHaveLength(3);
  const riders = ["waiver", "child"].map(rider => ({ ...base, id: rider, elementKey: `coverage-rider:product:${rider}:member`, label: "Rider" }));
  expect(getAnalyticsTrackingRows(riders)).toHaveLength(2);
  expect(base.sites).toEqual(getAnalyticsInventory().find(tag => tag.id === base.id)?.sites);
});
it("preserves selected-Site scope in every expanded placement", () => {
  for (const site of new Set(getAnalyticsInventory().flatMap(tag => tag.sites))) {
    expect(getAnalyticsTrackingRows(getAnalyticsInventory(site)).every(row => row.placements.every(tag => tag.sites.includes(site)))).toBe(true);
  }
});

it("keeps drawer ownership when inspecting individual access contexts", () => {
  const tags = getAnalyticsInventory("demo").filter(tag => tag.elementKey === "needs-annual-income");
  const rows = getAnalyticsTrackingRows(tags, true);
  expect(rows).toHaveLength(tags.length);
  for (const row of rows) {
    expect(row.pageIds).toEqual(["Coverage needs calculator drawer"]);
    expect(row.accessPageIds).toEqual([row.pageId]);
    expect(row.placements).toHaveLength(1);
  }
});
