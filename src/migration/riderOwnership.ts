import type { DatabaseSchema } from "../persistence/types";
import { resolveSnapshotSite as resolveEffectiveSite } from "../domain/effectiveSite";
import { isStoredRider, riderOverrideProperties } from "../domain/riderOverrides";
import { isSelectionPolicy } from "../domain/coverageSelectionPolicy";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { mcrSource, type SourceCell } from "./mcr";

const authority = "User-confirmed relational rider ownership, October 19, 2026";
const meta = (table: string, key: string, source = authority) => ({ id: key, key, ...libraryMetadata(table, key, source) });
/** Explicit program/source crosswalk; R39 and R40 remain separate identities. */
export const riderIdentityCrosswalk = [
  { site: "abe", products: ["li-term"], id: "cir", code: "R28", key: "rider.abe.r28" },
  { site: "asce", products: ["li-term"], id: "cir", code: "R37", key: "rider.asce.r37" },
  ...[["true-own-specialty", "R59"], ["cola", "R4a"], ["catastrophic", "R22"]].map(([id, code]) => ({ site: "ama", products: ["di-level-rated", "di-step-rated"], id, code, key: `rider.ama.${code.toLowerCase()}` })),
  { site: "ama", products: ["li-10yr", "li-15yr", "li-20yr", "li-term", "li-preferred"], id: "wop", code: "R38", key: "rider.ama.r38" },
  { site: "ama", products: ["li-10yr", "li-15yr", "li-20yr"], id: "add", code: "R39", key: "rider.ama.r39" },
  { site: "ama", products: ["li-preferred"], id: "add", code: "R40", key: "rider.ama.r40" },
  { site: "avma", products: ["li-group-term"], id: "cir", code: "R44", key: "rider.avma.r44" },
  { site: "avma", products: ["di-ltd"], id: "fpo", code: "R32", key: "rider.avma.r32" },
  { site: "waepa", products: ["li-group-term"], id: "cir", code: "R34", key: "rider.waepa.r34" },
  { site: "waepa", products: ["li-group-term"], id: "abi", code: "R16a", key: "rider.waepa.r16a" },
  ...["csea.spouse-accident", "csea.child-outpatient"].map(id => ({ site: "csea", products: ["di-ltd"], id, code: `mock:${id}`, key: id })),
];

/** Newly compiled reviewed exports only; never rewrites saved snapshots. */
export function consolidateRiderOwnership(db: DatabaseSchema, cells: readonly SourceCell[] = mcrSource.cells) {
  const business = activeSiteMigrationScope.sites.filter(site => site.mcrRequired);
  // Capture and validate all identities before mutating any row.
  const captured = business.flatMap(scope => {
    const site = resolveEffectiveSite(db, scope.key);
    return site.configuration.products.map(product => ({ site, product, mappings: product.riders.map(rider => {
      const definition = rider.definition?.value;
      if (!isStoredRider(definition)) throw new Error(`Invalid rider source: ${rider.key}`);
      const entries = riderIdentityCrosswalk.filter(entry => entry.site === site.siteKey && entry.products.includes(product.productKey) && entry.id === definition.id);
      if (entries.length !== 1) throw new Error(`Unmapped rider identity: ${site.siteKey}/${product.productKey}/${definition.id}`);
      const entry = entries[0];
      const mainRow = site.siteKey === "csea" ? 246 : activeSiteMainRows[site.siteKey]?.[product.productKey];
      if (mainRow === undefined) throw new Error(`Missing rider source row: ${site.siteKey}/${product.productKey}`);
      const reference = `Main!L${mainRow}`;
      const expected = mcrSource.cells.filter(cell => `${cell.sheet}!${cell.cell}` === reference);
      const actual = cells.filter(cell => `${cell.sheet}!${cell.cell}` === reference);
      if (expected.length !== 1 || actual.length !== 1 || JSON.stringify(expected[0]) !== JSON.stringify(actual[0])
        || entry.site !== "csea" && !String(expected[0].value).includes(entry.code)) throw new Error(`Rider identity source changed: ${reference}`);
      if (product.journeyPolicies.length !== 1 || !isCoverageJourneyPolicy(product.journeyPolicies[0].value)
        || product.journeyPolicies[0].value.mappings.some(mapping => mapping.riderCodes[rider.key] !== entry.code)) throw new Error(`Rider code differs from crosswalk: ${rider.key}`);
      return { rider, definition, entry, reference };
    }) }));
  });
  const families = new Map<string, typeof db.riders[number]["definition"]>();
  for (const { mappings } of captured) for (const { entry, definition } of mappings) {
    const base = families.get(entry.key) ?? db.riders.find(row => row.key === entry.key)?.definition ?? definition;
    if (base.id !== definition.id || base.premiumFactor !== definition.premiumFactor) throw new Error(`Conflicting rider identity or pricing: ${entry.key}`);
    families.set(entry.key, base);
  }
  const targetKeys = new Set(db.configurationDefinitions.filter(row => row.definition.target?.kind === "product-rider-set").map(row => row.key));
  db.configurationValues = db.configurationValues.filter(row => {
    if (!targetKeys.has(row.configurationKey) || !business.some(site => row.scope === "site" ? row.siteKey === site.key : row.scope === "client" && row.clientKey === site.clientKey)) return true;
    const key = `ownership-evidence.rider-marker.${row.key}`;
    if (!db.semanticRequirements.some(evidence => evidence.key === key) && !row.key.startsWith("ownership.")) db.semanticRequirements.push({ ...meta("semanticRequirements", key),
      subjectTable: "configurationDefinitions", subjectKey: row.configurationKey, domain: "information-ownership", predicate: "superseded-rider-set", status: "documented",
      value: { authority, previousValue: row.value, scope: row.scope, siteKey: row.siteKey, clientKey: row.clientKey } });
    return false;
  });
  for (const { site, product, mappings } of captured) {
    const evidenceKey = `ownership-evidence.${site.siteKey}.${product.productKey}.riders`;
    if (!db.semanticRequirements.some(row => row.key === evidenceKey)) db.semanticRequirements.push({ ...meta("semanticRequirements", evidenceKey),
      domain: "information-ownership", subjectTable: "sites", subjectKey: site.siteKey, predicate: "stable-rider-identities", status: "documented",
      value: { authority, productKey: product.productKey, crosswalk: mappings.map(({ rider, definition, entry, reference }) => ({ previousKey: rider.key, riderKey: entry.key, code: entry.code,
        sourceReference: reference, previousDefinition: JSON.parse(JSON.stringify(definition)), previousAssignments: JSON.parse(JSON.stringify(rider.provenance)) })),
        previousSelectionPolicies: JSON.parse(JSON.stringify(product.selectionPolicies)), previousJourneyPolicies: JSON.parse(JSON.stringify(product.journeyPolicies)) } });
    const replacements = new Map(mappings.map(({ rider, entry }) => [rider.key, entry.key]));
    db.productRiders = db.productRiders.filter(row => !(row.scope === "site" && row.siteKey === site.siteKey && row.productKey === product.productKey));
    for (const [position, { rider, definition, entry, reference }] of mappings.entries()) {
      let global = db.riders.find(row => row.key === entry.key);
      if (!global) { global = { ...meta("riders", entry.key, reference), position: 0, definition: structuredClone(definition) }; db.riders.push(global); }
      if (global.definition.id !== definition.id || global.definition.premiumFactor !== definition.premiumFactor) throw new Error(`Conflicting rider identity or pricing: ${entry.key}`);
      const key = `ownership.${site.siteKey}.${product.productKey}.${entry.key}`;
      db.productRiders.push({ ...meta("productRiders", key, reference), scope: "site", siteKey: site.siteKey, clientKey: null, productKey: product.productKey, riderKey: entry.key, position });
      const siteId = db.sites.find(row => row.key === site.siteKey)!.id;
      if (!db.siteRiders.some(row => row.siteId === siteId && row.riderKey === entry.key)) db.siteRiders.push({ ...meta("siteRiders", `ownership.${site.siteKey}.${entry.key}`, reference), siteId, riderKey: entry.key, enabled: true,
        createdAt: "2026-10-19T00:00:00.000Z", updatedAt: "2026-10-19T00:00:00.000Z" });
      for (const property of riderOverrideProperties) {
        const value = property === "enabled" ? rider.enabled : definition[property];
        const base = property === "enabled" ? true : global.definition[property];
        if (JSON.stringify(value) === JSON.stringify(base)) continue;
        const overrideKey = `${key}.${property}`;
        if (!db.configurationDefinitions.some(row => row.key === overrideKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", overrideKey, reference), position: 0,
          definition: { path: null, metadata: { authority }, target: { kind: "product-rider-override", productKey: product.productKey, riderKey: entry.key, property } } });
        db.configurationValues = db.configurationValues.filter(row => row.key !== overrideKey);
        db.configurationValues.push({ ...meta("configurationValues", overrideKey, reference), scope: "site", siteKey: site.siteKey, clientKey: null, position: 0, configurationKey: overrideKey,
          value: value === undefined ? null : JSON.parse(JSON.stringify(value)) });
      }
      for (const amount of db.riderAmountRules.filter(row => rider.key !== entry.key && row.riderKey === rider.key && (row.baseProductKey === null || row.baseProductKey === product.productKey))) {
        const key = `ownership.${entry.key}.${product.productKey}.${amount.applicantTypeKey ?? "all"}.amount`;
        if (!db.riderAmountRules.some(row => row.key === key)) db.riderAmountRules.push({ ...amount, ...meta("riderAmountRules", key, reference), riderKey: entry.key });
      }
    }
    const markerKey = `ownership.${site.siteKey}.${product.productKey}.rider-set`;
    if (!db.configurationDefinitions.some(row => row.key === markerKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", markerKey), position: 0,
      definition: { path: null, metadata: { authority }, target: { kind: "product-rider-set", productKey: product.productKey } } });
    db.configurationValues.push({ ...meta("configurationValues", markerKey), scope: "site", siteKey: site.siteKey, clientKey: null, position: 0, configurationKey: markerKey, value: { version: 2, source: "productRiders" } });
    for (const value of db.configurationValues.filter(row => row.scope === "site" && row.siteKey === site.siteKey)) {
      const target = db.configurationDefinitions.find(definition => definition.key === value.configurationKey)?.definition.target;
      if (!target || !("productKey" in target) || target.productKey !== product.productKey) continue;
      const replace = (key: string) => replacements.get(key) ?? key;
      if (target.kind === "product-selection-policy" && isSelectionPolicy(value.value)) value.value = JSON.parse(JSON.stringify({ ...value.value,
        riders: value.value.riders.map(rider => ({ ...rider, key: replace(rider.key), requires: rider.requires.map(replace), incompatible: rider.incompatible.map(replace) })) }));
      if (target.kind === "product-journey-policy" && isCoverageJourneyPolicy(value.value)) value.value = JSON.parse(JSON.stringify({ ...value.value,
        mappings: value.value.mappings.map(mapping => ({ ...mapping, riderCodes: Object.fromEntries(Object.entries(mapping.riderCodes).map(([key, code]) => [replace(key), code])) })) }));
    }
  }
}
