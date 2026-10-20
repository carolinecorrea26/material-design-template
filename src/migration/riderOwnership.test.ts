import { beforeAll, describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase, createMigrationDatabase } from "./fixtures";
import { consolidateRiderOwnership } from "./riderOwnership";
import { mcrSource } from "./mcr";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite, type EffectiveSiteData } from "../domain/effectiveSite";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { createLibraryDraft, editDraftRiders } from "../domain/libraryDraft";
import { createSiteBuild } from "../domain/siteBuild";
import { isStoredRider } from "../domain/riderOverrides";
import { libraryMetadata } from "../domain/provenance";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository, type PortalRevision } from "../repositories/portalDataRepository";

const db = createReviewedMigrationDatabase();
let revision: PortalRevision;
beforeAll(async () => { revision = await createPortalDataRepository(new LocalStorageAdapter(db)).open(); });
const preview = (data: EffectiveSiteData = db, site = "ama") => resolvePrototypeLibrary(data, site, "test:rider-ownership");
const riderKeys = (site: string, product: string) => resolveEffectiveSite(db, site).configuration.products.find(row => row.productKey === product)!.riders.map(row => row.key);
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, "ownership regression") });

describe("relational rider ownership", () => {
  it("shares only evidence-backed identities and preserves distinct source codes and source-only rows", () => {
    expect(riderKeys("ama", "di-step-rated")).toEqual(riderKeys("ama", "di-level-rated"));
    for (const product of ["li-10yr", "li-15yr", "li-20yr", "li-term", "li-preferred"]) expect(riderKeys("ama", product)).toContain("rider.ama.r38");
    expect(riderKeys("ama", "li-10yr")).toContain("rider.ama.r39");
    expect(riderKeys("ama", "li-preferred")).toContain("rider.ama.r40");
    expect(riderKeys("ama", "li-preferred")).not.toContain("rider.ama.r39");
    expect(riderKeys("abe", "li-term")).toEqual(["rider.abe.r28"]);
    expect(riderKeys("asce", "li-term")).toEqual(["rider.asce.r37"]);
    expect(riderKeys("waepa-gi", "li-group-term")).toEqual([]);
    const original = createMigrationDatabase().riders.filter(row => row.key.startsWith("mcr."));
    expect(db.riders.filter(row => row.key.startsWith("mcr."))).toEqual(original);
    const activeKeys = new Set(["abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"].flatMap(site => resolveEffectiveSite(db, site).configuration.products.flatMap(product => product.riders.map(rider => rider.key))));
    expect(activeKeys.size).toBe(14);
  });

  it("preserves every offered definition and compatibility view across 59 business Site/product pairs", () => {
    const evidence = db.semanticRequirements.filter(row => row.predicate === "stable-rider-identities");
    expect(evidence).toHaveLength(59);
    for (const row of evidence) {
      const value = row.value;
      if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.productKey !== "string" || !Array.isArray(value.crosswalk)) throw new Error("Missing captured rider evidence");
      const expected = value.crosswalk.map(entry => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry) || !isStoredRider(entry.previousDefinition)) throw new Error("Invalid previous definition");
        return { ...entry.previousDefinition, premiumFactor: entry.previousDefinition.premiumFactor ?? 0 };
      });
      const library = preview(db, row.subjectKey);
      const product = library.products.find(product => product.id === value.productKey)!;
      expect(product.riders).toEqual(expected);
      expect(library.client.coverages.overrides?.[product.id]?.riders).toEqual(product.riders);
    }
    expect(validateMigrationDatabase(db)).toEqual([]);
    const repeated = structuredClone(db);
    consolidateRiderOwnership(repeated);
    const sorted = (data: typeof db) => Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
    expect(sorted(repeated)).toEqual(sorted(db));
  });

  it("edits one property without changing global identity, another product or other inherited properties", () => {
    const draft = createLibraryDraft(revision, "ama");
    const products = preview(draft.data).products;
    const original = products.find(product => product.id === "li-10yr")!.riders!;
    const edited = editDraftRiders(draft, "li-10yr", original.map(rider => rider.id === "wop" ? { ...rider, description: "Site-specific waiver wording" } : rider));
    const library = preview(edited.data);
    expect(library.products.find(product => product.id === "li-10yr")!.riders!.find(rider => rider.id === "wop")!.description).toBe("Site-specific waiver wording");
    expect(library.products.find(product => product.id === "li-15yr")!.riders!.find(rider => rider.id === "wop")!.description).not.toBe("Site-specific waiver wording");
    expect(edited.data.riders).toEqual(draft.data.riders);
    expect(edited.data.configurationDefinitions.filter(row => row.key.startsWith("draft.")).map(row => row.definition.target)).toEqual([{ kind: "product-rider-override", productKey: "li-10yr", riderKey: "rider.ama.r38", property: "description" }]);
    edited.data.riders.find(row => row.key === "rider.ama.r38")!.definition.name = "Updated global waiver label";
    const refreshed = preview(edited.data);
    const rider = refreshed.products.find(product => product.id === "li-10yr")!.riders!.find(rider => rider.id === "wop")!;
    expect(rider).toMatchObject({ name: "Updated global waiver label", description: "Site-specific waiver wording" });
    expect(validateMigrationDatabase({ ...db, ...edited.data })).toEqual([]);
  });

  it("isolates per-product removal, restoration and order even when products share a rider", () => {
    const draft = createLibraryDraft(revision, "ama");
    const original = preview(draft.data).products.find(product => product.id === "li-10yr")!.riders!;
    const hidden = editDraftRiders(draft, "li-10yr", original.filter(rider => rider.id !== "wop"));
    expect(preview(hidden.data).products.find(product => product.id === "li-10yr")!.riders!.map(rider => rider.id)).toEqual(["add"]);
    expect(preview(hidden.data).products.find(product => product.id === "li-15yr")!.riders!.map(rider => rider.id)).toEqual(["add", "wop"]);
    const restored = editDraftRiders(hidden, "li-10yr", [...original].reverse());
    expect(preview(restored.data).products.find(product => product.id === "li-10yr")!.riders!.map(rider => rider.id)).toEqual(["wop", "add"]);
    expect(db.riders.find(row => row.key === "rider.ama.r38")!.definition.id).toBe("wop");
  });

  it("does not author a zero premium when editing an unavailable-price benefit", () => {
    const draft = createLibraryDraft(revision, "csea");
    const original = preview(draft.data, "csea").products.find(product => product.id === "di-ltd")!.riders!;
    const edited = editDraftRiders(draft, "di-ltd", original.map(rider => ({ ...rider, description: "Updated description" })));
    expect(edited.data.riders.find(row => row.key === "csea.spouse-accident")!.definition.premiumFactor).toBeNull();
    expect(edited.data.configurationDefinitions.some(row => row.definition.target?.kind === "product-rider-override" && row.definition.target.property === "premiumFactor")).toBe(false);
    expect(() => editDraftRiders(draft, "di-ltd", original.map(rider => ({ ...rider, premiumFactor: .2 })))).toThrow("pricing is managed separately");
    expect(() => editDraftRiders(draft, "di-ltd", original.map(rider => ({ ...rider, id: `${rider.id}-new` })))).toThrow("existing rider identity");
  });

  it("resolves client and Site properties independently and retains both sources", () => {
    const changed = structuredClone(db);
    for (const [scope, property, value] of [["client", "description", "Association waiver wording"], ["site", "name", "Site waiver label"]] as const) {
      const key = `test.${scope}.waiver.${property}`;
      changed.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: null,
        target: { kind: "product-rider-override", productKey: "li-term", riderKey: "rider.ama.r38", property } } });
      changed.configurationValues.push({ ...meta("configurationValues", key), position: 0, configurationKey: key, scope,
        clientKey: scope === "client" ? "ama" : null, siteKey: scope === "site" ? "ama" : null, value });
    }
    const rider = resolveEffectiveSite(changed, "ama").configuration.products.find(product => product.productKey === "li-term")!.riders.find(rider => rider.key === "rider.ama.r38")!;
    expect(rider.definition!.value).toMatchObject({ name: "Site waiver label", description: "Association waiver wording" });
    expect(rider.definition!.provenance.map(source => source.key)).toEqual(expect.arrayContaining(["rider.ama.r38", "test.client.waiver.description", "test.site.waiver.name"]));
    // The Site value wins only for the property it overrides.
    changed.configurationValues.push({ ...meta("configurationValues", "test.site.waiver.description"), position: 0, configurationKey: "test.client.waiver.description", scope: "site", clientKey: null, siteKey: "ama", value: "Site waiver wording" });
    expect(preview(changed).products.find(product => product.id === "li-term")!.riders![0].description).toBe("Site waiver wording");
    const global = changed.configurationValues.find(row => row.key === "test.client.waiver.description")!;
    global.scope = "global"; global.clientKey = null;
    expect(() => preview(changed)).toThrow("Global rider properties");
  });

  it("copies stable references and overrides into a new Site without coupling edits", () => {
    const original = createLibraryDraft(revision, "ama");
    original.data.organizations = db.organizations;
    original.data.organizationProfiles = db.organizationProfiles;
    const riders = preview(original.data).products.find(product => product.id === "li-10yr")!.riders!;
    const source = editDraftRiders(original, "li-10yr", riders.map(rider => ({ ...rider, description: "Source Site wording" })));
    const client = db.clients.find(client => client.key === "ama")!;
    const organization = db.organizations.find(organization => organization.id === client.organizationId)!;
    const copied = createSiteBuild(source, { siteKey: "ama-rider-copy", siteName: "Rider copy", template: "multi", clientKey: client.key, clientName: client.name,
      organizationKey: organization.key, organizationName: organization.name, newClient: false, newOrganization: false });
    const library = preview(copied.data, copied.siteKey);
    const copiedRiders = library.products.find(product => product.id === "li-10yr")!.riders!;
    expect(copiedRiders).toEqual(preview(source.data).products.find(product => product.id === "li-10yr")!.riders);
    expect(library.site.configuration.products.find(product => product.productKey === "li-10yr")!.riders.map(rider => rider.key)).toEqual(["rider.ama.r39", "rider.ama.r38"]);
    const edited = editDraftRiders(copied, "li-10yr", copiedRiders.map(rider => ({ ...rider, description: "Copied Site wording" })));
    expect(preview(edited.data, copied.siteKey).products.find(product => product.id === "li-10yr")!.riders!.every(rider => rider.description === "Copied Site wording")).toBe(true);
    expect(preview(edited.data).products.find(product => product.id === "li-10yr")!.riders!.every(rider => rider.description === "Source Site wording")).toBe(true);
    expect(edited.data.riders).toEqual(source.data.riders);
    expect(validateMigrationDatabase({ ...db, ...edited.data })).toEqual([]);
  });

  it("keeps an explicit GI empty set isolated from shared Client rider properties", () => {
    const changed = structuredClone(db);
    const key = "test.waepa.client.rider-description";
    changed.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: null,
      target: { kind: "product-rider-override", productKey: "li-group-term", riderKey: "rider.waepa.r34", property: "description" } } });
    changed.configurationValues.push({ ...meta("configurationValues", key), position: 0, configurationKey: key, scope: "client", clientKey: "waepa", siteKey: null, value: "Shared CIR wording" });
    expect(preview(changed, "waepa").products.find(product => product.id === "li-group-term")!.riders!.find(rider => rider.id === "cir")!.description).toBe("Shared CIR wording");
    expect(preview(changed, "waepa-gi").products.find(product => product.id === "li-group-term")!.riders).toEqual([]);
    expect(validateMigrationDatabase(changed)).toEqual([]);
    changed.configurationValues.at(-1)!.value = 123;
    expect(() => preview(changed, "waepa-gi")).toThrow("Invalid effective rider");
    changed.configurationValues.at(-1)!.value = "Shared CIR wording";
    const target = changed.configurationDefinitions.at(-1)!.definition.target;
    if (target?.kind !== "product-rider-override") throw new Error("Missing test target");
    target.riderKey = "rider.ama.r38";
    expect(validateMigrationDatabase(changed)).toContain(`Invalid rider property override ${key}`);
  });

  it.each(["id", "premiumFactor", "enabled", "coverageAmounts", "orphan", "duplicate"])("rejects a malformed %s override without a fallback", scenario => {
    const changed = structuredClone(db);
    const property = ["orphan", "duplicate"].includes(scenario) ? "description" : scenario;
    const key = `test.rider.${scenario}`;
    const riderKey = scenario === "orphan" ? "rider.ama.r40" : "rider.ama.r38";
    changed.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: null, target: { kind: "product-rider-override", productKey: "li-10yr", riderKey, property } } });
    changed.configurationValues.push({ ...meta("configurationValues", key), scope: "site", siteKey: "ama", clientKey: null, configurationKey: key, position: 0,
      value: scenario === "coverageAmounts" ? [{ selections: [{ type: "range", min: 100, max: 50, increment: 0 }] }] : "invalid-or-conflicting" });
    if (scenario === "duplicate") {
      changed.configurationDefinitions.push({ ...changed.configurationDefinitions.at(-1)!, ...meta("configurationDefinitions", `${key}.second`) });
      changed.configurationValues.push({ ...changed.configurationValues.at(-1)!, ...meta("configurationValues", `${key}.second`), configurationKey: `${key}.second` });
    }
    expect(() => preview(changed)).toThrow();
    expect(validateMigrationDatabase(changed)).toContain(`Invalid rider property override ${key}`);
  });

  it("preserves historical whole-array precedence and refuses it on a relational revision", () => {
    const changed = structuredClone(db);
    const key = "test.historical-rider-array";
    changed.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: null, target: { kind: "product-presentation", productKey: "li-10yr", property: "riders" } } });
    changed.configurationValues.push({ ...meta("configurationValues", key), scope: "site", siteKey: "ama", clientKey: null, configurationKey: key, position: 0, value: [] });
    expect(() => preview(changed)).toThrow("Whole-rider overrides");
    changed.configurationValues.find(row => row.key === "ownership.ama.li-10yr.rider-set")!.value = [];
    const before = JSON.stringify(changed);
    expect(preview(changed).products.find(product => product.id === "li-10yr")!.riders).toEqual([]);
    expect(JSON.stringify(changed)).toBe(before);
  });

  it("rejects source drift before mutating the reviewed database", () => {
    const before = JSON.stringify(db);
    expect(() => consolidateRiderOwnership(db, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "L118" ? { ...cell, value: "changed" } : cell))).toThrow("source changed");
    expect(JSON.stringify(db)).toBe(before);
  });
});
