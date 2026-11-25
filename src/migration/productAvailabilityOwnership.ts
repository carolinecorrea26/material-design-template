import type { DatabaseSchema } from "../persistence/types";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { libraryMetadata } from "../domain/provenance";
import { isProductAvailabilityPath } from "../domain/productAvailabilityOwnership";

/** siteProducts already owns execution. Retire legacy enabled lists after
 * checking exact agreement or the accepted CSEA / WAEPA GI dispositions. */
export function consolidateProductAvailabilityOwnership(db: DatabaseSchema) {
  const business = activeSiteMigrationScope.sites.filter(site => site.mcrRequired);
  const keys = new Set<string>(business.map(site => site.key));
  const clients = new Set<string>(business.map(site => site.hostingAssociationKey));
  const copies = db.configurationValues.filter(row => isProductAvailabilityPath(db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path)
    && (row.scope === "global" || row.scope === "site" && keys.has(row.siteKey ?? "") || row.scope === "association" && clients.has(row.hostingAssociationKey ?? "")));
  const authority = "Site product availability ownership, October 19, 2026";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const seen = new Set<string>();
  for (const row of copies) {
    const identity = `${row.scope}/${row.siteKey ?? row.hostingAssociationKey}/${db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path?.join(".")}`;
    if (seen.has(identity)) throw new Error(`Ambiguous ownership source: ${identity}`);
    seen.add(identity);
    if (row.scope === "global" || row.scope === "association" && db.sites.some(site => !keys.has(site.key) && db.associationEntities.some(client => client.id === site.hostingAssociationId && client.key === row.hostingAssociationKey))) throw new Error(`Availability scope outside reviewed Sites: ${row.key}`);
    if (row.scope === "association" && row.siteKey !== null || row.scope === "site" && row.hostingAssociationKey !== null) throw new Error(`Invalid availability scope: ${row.key}`);
    const path = db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path;
    if (path?.join(".") !== "coverages.enabled" || !Array.isArray(row.value) || row.value.some(key => typeof key !== "string" || !db.products.some(product => product.key === key)) || new Set(row.value).size !== row.value.length) throw new Error(`Invalid availability copy: ${row.key}`);
    for (const site of business.filter(site => row.scope === "site" ? row.siteKey === site.key : row.hostingAssociationKey === site.hostingAssociationKey)) {
      const saved = db.sites.find(saved => saved.key === site.key)!;
      const enabled = db.siteProducts.filter(product => product.siteId === saved.id && product.enabled).map(product => product.productKey);
      const missing = enabled.filter(key => !(row.value as unknown[]).includes(key));
      const extra = row.value.filter(key => !enabled.includes(String(key)));
      const accepted = site.key === "csea" && JSON.stringify(missing) === '["li-add"]' && !extra.length
        || site.key === "waepa-gi" && !missing.length && JSON.stringify(extra) === '["di-short-term"]';
      if ((missing.length || extra.length) && !accepted) throw new Error(`Unreconciled product availability: ${site.key}/${row.key}`);
    }
  }
  for (const site of business) {
    const key = `ownership.${site.key}.product-availability`;
    if (db.configurationValues.some(row => row.key === key)) continue;
    const saved = db.sites.find(saved => saved.key === site.key)!;
    const evidence = `ownership-evidence.${site.key}.product-availability`;
    db.semanticRequirements.push({ ...meta("semanticRequirements", evidence), domain: "information-ownership", subjectTable: "sites", subjectKey: site.key,
      predicate: "site-product-availability", status: "documented", value: { authority,
        previousConfigurations: JSON.parse(JSON.stringify(copies.filter(row => row.siteKey === site.key || row.hostingAssociationKey === site.hostingAssociationKey))),
        compatibilityAssignments: JSON.parse(JSON.stringify(db.siteCoverages.filter(row => row.siteId === saved.id))),
        disposition: "siteProducts owns Site availability. CSEA AD&D stays enabled per accepted adoption. WAEPA GI excludes Standard disability. siteCoverages remains historical compatibility evidence, outside applicant execution." } });
    db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { authority }, target: { kind: "site-product-availability" } } });
    db.configurationValues.push({ ...meta("configurationValues", key), position: 0, configurationKey: key, scope: "site", hostingAssociationKey: null, siteKey: site.key, value: { version: 2, source: "siteProducts" } });
  }
  db.configurationValues = db.configurationValues.filter(row => !copies.includes(row));
}
