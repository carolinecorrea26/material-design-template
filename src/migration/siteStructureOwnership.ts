import type { DatabaseSchema } from "../persistence/types";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { libraryMetadata } from "../domain/provenance";
import { isSiteStructurePath } from "../domain/siteStructureOwnership";
import { resolveSnapshotSite as resolveEffectiveSite } from "../domain/effectiveSite";

/** Retire only copies whose exact value already exists on the effective field
 * placement or Site mode. Do not reinterpret old MCR page locations. */
export function consolidateSiteStructureOwnership(db: DatabaseSchema) {
  const business = activeSiteMigrationScope.sites.filter(site => site.mcrRequired);
  const keys = new Set<string>(business.map(site => site.key));
  const clients = new Set<string>(business.map(site => site.clientKey));
  const copies = db.configurationValues.filter(row => isSiteStructurePath(db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path)
    && (row.scope === "global" || row.scope === "site" && keys.has(row.siteKey ?? "") || row.scope === "client" && clients.has(row.clientKey ?? "")));
  const seen = new Set<string>();
  for (const row of copies) {
    const identity = `${row.scope}/${row.siteKey ?? row.clientKey}/${db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path?.join(".")}`;
    if (seen.has(identity)) throw new Error(`Ambiguous ownership source: ${identity}`);
    seen.add(identity);
    if (row.scope === "global" || row.scope === "client" && db.sites.some(site => !keys.has(site.key) && db.clients.some(client => client.id === site.clientId && client.key === row.clientKey))) throw new Error(`Structure scope outside reviewed Sites: ${row.key}`);
    if (row.scope === "client" && row.siteKey !== null || row.scope === "site" && row.clientKey !== null) throw new Error(`Invalid structure scope: ${row.key}`);
    const path = db.configurationDefinitions.find(definition => definition.key === row.configurationKey)!.definition.path!;
    for (const site of business.filter(site => row.scope === "site" ? row.siteKey === site.key : row.clientKey === site.clientKey)) {
      const saved = db.sites.find(saved => saved.key === site.key)!;
      if (path.join(".") === "features.defaultTemplate") {
        if (row.value !== saved.templateType) throw new Error(`Unreconciled template mode: ${row.key}`);
        continue;
      }
      const fields = resolveEffectiveSite(db, site.key).configuration.pages.find(page => page.key === path[1])?.fields;
      if (!fields) throw new Error(`Unreconciled field page: ${row.key}`);
      if (path.length === 3 && ["hidden", "extra", "required"].includes(path[2]) && Array.isArray(row.value)) {
        if (new Set(row.value).size !== row.value.length || row.value.some(key => {
          const field = fields.find(field => field.key === key);
          return !field || (path[2] === "hidden" ? field.included : path[2] === "extra" ? !field.included : !field.definition.required);
        })) throw new Error(`Unreconciled field placement: ${row.key}`);
      } else if (path.length === 5 && path[2] === "overrides") {
        const field = fields.find(field => field.key === path[3]);
        if (!field || JSON.stringify(field.definition[path[4] as keyof typeof field.definition]) !== JSON.stringify(row.value)) throw new Error(`Unreconciled scoped field property: ${row.key}`);
      } else throw new Error(`Unreviewed field configuration: ${row.key}`);
    }
  }
  const authority = "Stored field placement and template mode ownership, October 19, 2026";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  for (const site of business) {
    const key = `ownership.${site.key}.site-structure`;
    if (db.configurationValues.some(row => row.key === key)) continue;
    const evidence = `ownership-evidence.${site.key}.site-structure`;
    db.semanticRequirements.push({ ...meta("semanticRequirements", evidence), domain: "information-ownership", subjectTable: "sites", subjectKey: site.key,
      predicate: "stored-site-structure", status: "documented", value: { authority, previousConfigurations: JSON.parse(JSON.stringify(copies.filter(row => row.siteKey === site.key || row.clientKey === site.clientKey))),
        disposition: "sites.templateType owns mode. pageFields/pageSectionFields own shared placement; siteFieldConfigurations owns scoped inclusion, visibility and properties. Preserve differing labels/options and current template placement." } });
    db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { authority }, target: { kind: "site-structure-ownership" } } });
    db.configurationValues.push({ ...meta("configurationValues", key), position: 0, configurationKey: key, scope: "site", clientKey: null, siteKey: site.key, value: { version: 2, source: "stored-structure" } });
  }
  db.configurationValues = db.configurationValues.filter(row => !copies.includes(row));
}
