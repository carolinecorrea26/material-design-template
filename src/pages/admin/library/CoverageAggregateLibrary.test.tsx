import { readFileSync } from "node:fs";
import { resolveSnapshotSite } from "../../../domain/effectiveSite";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeAll, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import CoverageAggregateLibrary from "./CoverageAggregateLibrary";
import { createReviewedMigrationDatabase } from "../../../migration/fixtures";
import { LocalStorageAdapter } from "../../../persistence/localAdapter";
import { createPortalDataRepository } from "../../../repositories/portalDataRepository";
import { validateNormalizedLifeAggregate } from "../../../domain/normalizedCoverageAmounts";
import { inspectSiteAggregates } from "../../../domain/aggregateInspection";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import { readLibraryCatalog } from "../../../services/libraryCatalogService";
import { normalizedSnapshotTables } from "../../../persistence/snapshot";
vi.mock("../../../services/libraryCatalogService", () => ({ readLibraryCatalog: vi.fn() }));
const db = createReviewedMigrationDatabase();
beforeAll(() => { vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });

it("loads stored aggregate edits without regenerating migration fixtures and propagates read failures", async () => {
  const copy = structuredClone(db);
  copy.configurationValues.find(row => row.key === "nso.reviewed-life-aggregate")!.value = { version: 1, groups: [{ key: "stored", applicantKeys: ["member"], productKeys: ["li-term"], maximum: 750000 }] };
  const data = Object.fromEntries([...new Set(normalizedSnapshotTables)].map(table => [table, copy[table]]));
  vi.mocked(readLibraryCatalog).mockResolvedValue({ revision: "stored-test", data: data as Awaited<ReturnType<typeof readLibraryCatalog>>["data"], analyticsTags: [] });
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<CoverageAggregateLibrary siteKey="nso" />));
    // Snapshot hashing is asynchronous; wait for the provider's completed render.
    await vi.waitFor(async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); expect(node.textContent).toContain("$750,000"); });
    expect(readLibraryCatalog).toHaveBeenCalledWith("nso");
    expect(node.textContent).not.toContain("$800,000");
    vi.mocked(readLibraryCatalog).mockRejectedValue(new Error("Stored catalog unavailable"));
    await act(async () => root.render(<CoverageAggregateLibrary siteKey="ama" />));
    expect(node.textContent).toContain("Stored catalog unavailable");
    expect(node.textContent).not.toContain("$750,000");
  } finally { await act(async () => root.unmount()); vi.mocked(readLibraryCatalog).mockReset(); }
});

it("changes client limits with the selected Site and compares all Sites without a universal default", async () => {
  const repository = createPortalDataRepository(new LocalStorageAdapter(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")).data));
  const revision = await repository.open();
  const captured = { open: async () => revision };
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<CoverageAggregateLibrary siteKey="ama" repository={captured} />));
    expect(node.textContent).toContain("$4,000,000");
    expect(node.textContent).toContain("$15,000/month");
    expect(node.textContent).not.toContain("$800,000");
    await act(async () => root.render(<CoverageAggregateLibrary siteKey="ama-gi" repository={captured} />));
    expect(node.textContent).toContain("Individual product limits only");
    expect(node.textContent).not.toContain("$4,000,000");
    await act(async () => root.render(<CoverageAggregateLibrary siteKey={null} repository={captured} />));
    expect(node.textContent).toContain("$4,000,000");
    expect(node.textContent).toContain("$2,000,000");
    expect(node.textContent).toContain("Individual product limits only");
    expect(node.textContent).toContain("unpublished");
  } finally { await act(async () => root.unmount()); }
});

it("reads changed persisted policies and makes missing or invalid migration data explicit", async () => {
  const copy = structuredClone(db);
  const policy = copy.configurationValues.find(row => row.key === "nso.reviewed-life-aggregate")!;
  policy.value = { version: 1, groups: [{ key: "updated", applicantKeys: ["member"], productKeys: ["li-term"], maximum: 750000 }] };
  const changed = resolveSnapshotSite(copy, "nso");
  expect(inspectSiteAggregates(changed).find(row => row.category === "LI")?.maximum).toBe("$750,000");
  expect(validateNormalizedLifeAggregate(changed, "member", [{ productKey: "li-term", amount: 100000 }], 650001)).toMatchObject({ allowed: false, maximum: 750000, total: 750001 });
  const avma = inspectSiteAggregates(resolveSnapshotSite(db, "avma")).find(row => row.category === "LI")!;
  expect(avma.excluded.some(label => label.includes("li-50plus"))).toBe(true);
  expect(avma.excluded.some(label => label.includes("(li-term)"))).toBe(true);
  expect(inspectSiteAggregates(resolveSnapshotSite(db, "waepa")).find(row => row.category === "LI")?.maximum).toBe("Individual product limits only");
  const invalid = resolveSnapshotSite(copy, "nso");
  invalid.configuration.lifeAggregates[0].value = { version: 2 };
  expect(() => inspectSiteAggregates(invalid)).toThrow("Invalid life aggregate");
});

it("reports snapshot failures without displaying stale or default limits", async () => {
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<CoverageAggregateLibrary siteKey="nso" repository={{ open: async () => { throw new Error("Snapshot unavailable"); } }} />));
    expect(node.textContent).toContain("Snapshot unavailable");
    expect(node.textContent).not.toContain("$2,000,000");
  } finally { await act(async () => root.unmount()); }
});

it.each(["ama-gi", "waepa-gi"])("shows the same explicit individual-only participation used by %s validation", siteKey => {
  const site = resolveEffectiveSite(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")).data, siteKey);
  expect(inspectSiteAggregates(site).find(row => row.category === "LI")?.maximum).toBe("Individual product limits only");
  const product = site.configuration.products.find(row => row.catalog?.value.categoryKey === "LI")!;
  expect(validateNormalizedLifeAggregate(site, "member", [{ productKey: product.productKey, amount: 50000 }], 99999999)).toMatchObject({ allowed: true });
  site.configuration.lifeAggregateParticipation[0].value = { version: 1, mode: "invalid", provisional: false };
  expect(() => inspectSiteAggregates(site)).toThrow("Invalid life aggregate participation");
});
