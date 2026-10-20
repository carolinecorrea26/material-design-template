import type { DatabaseSchema, Json } from "../persistence/types";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { resolvePageCatalog } from "../domain/pageCatalog";
import { isPageParticipationPath } from "../domain/pageParticipation";
import { libraryMetadata } from "../domain/provenance";

const authority = "Site page participation ownership, October 19, 2026";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });

/** Reviewed business Sites only. sitePages already contains the accepted
 * participation. Preserve it, retire competing copies and retain the evidence. */
export function consolidatePageParticipationOwnership(db: DatabaseSchema) {
  const business = activeSiteMigrationScope.sites.filter(site => site.mcrRequired);
  for (const site of business) resolvePageCatalog(db, site.key);
  const clientKeys = new Set<string>(business.map(site => site.clientKey));
  const keys = new Set<string>(business.map(site => site.key));
  const retired = db.configurationValues.filter(row => isPageParticipationPath(db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path)
    && (row.scope === "site" && keys.has(row.siteKey ?? "") || row.scope === "client" && clientKeys.has(row.clientKey ?? "")));
  // Do not remove shared defaults from an unrelated Site. Unexpected ownership
  // scope needs reconciliation before changing the reviewed export.
  for (const row of retired.filter(row => row.scope === "client")) {
    if (db.sites.some(site => !keys.has(site.key) && db.clients.some(client => client.id === site.clientId && client.key === row.clientKey))) throw new Error(`Shared page configuration outside reviewed scope: ${row.key}`);
  }
  if (db.configurationValues.some(row => row.scope === "global" && isPageParticipationPath(db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path))) throw new Error("Unreconciled global page participation default");
  // Parse all copies before archiving; a malformed setting is not silently
  // certified by a matching assignment. No current business values are changed.
  for (const row of retired) {
    if (row.scope === "site" && row.clientKey !== null || row.scope === "client" && row.siteKey !== null) throw new Error(`Invalid page configuration scope: ${row.key}`);
    const path = db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path;
    if (!path) throw new Error(`Missing page configuration definition: ${row.key}`);
    const valid = path[1] === "requirements" && path.length === 3 && ["beneficiary", "payment"].includes(path[2]) && ["required", "optional", "none"].some(value => value === row.value)
      || ["excluded", "optional"].includes(path[1]) && path.length === 2 && Array.isArray(row.value) && row.value.every(key => typeof key === "string" && db.pages.some(page => page.key === key)) && new Set(row.value).size === row.value.length;
    if (!valid) throw new Error(`Unresolved page participation copy: ${row.key}`);
  }
  for (const site of business) {
    const applicable = retired.filter(row => row.siteKey === site.key || row.scope === "client" && row.clientKey === site.clientKey).sort((a, b) => Number(a.scope === "site") - Number(b.scope === "site"));
    const settings = new Map<string, Json>();
    const seen = new Set<string>();
    for (const row of applicable) {
      const path = db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path?.join(".");
      if (!path || seen.has(`${row.scope}:${path}`)) throw new Error(`Ambiguous page configuration: ${row.key}`);
      seen.add(`${row.scope}:${path}`); settings.set(path, row.value);
    }
    for (const page of db.pages) {
      const explicit = settings.get(`pages.requirements.${page.key}`);
      const excluded = settings.get("pages.excluded"), optional = settings.get("pages.optional");
      const expected = explicit ?? (Array.isArray(excluded) && excluded.includes(page.key) ? "none" : Array.isArray(optional) && optional.includes(page.key) ? "optional" : undefined);
      if (expected !== undefined && expected !== (db.sitePages.find(row => row.siteKey === site.key && row.pageKey === page.key)?.requirement ?? "none")) throw new Error(`Unreconciled page participation: ${site.key}/${page.key}`);
    }
  }
  for (const site of business) {
    const key = `ownership.${site.key}.page-participation`;
    const evidenceKey = `ownership-evidence.${site.key}.page-participation`;
    if (!db.semanticRequirements.some(row => row.key === evidenceKey)) db.semanticRequirements.push({ ...meta("semanticRequirements", evidenceKey), domain: "information-ownership",
      subjectTable: "sites", subjectKey: site.key, predicate: "site-page-participation", status: "documented", value: { authority,
        previousConfigurations: JSON.parse(JSON.stringify(retired.filter(row => row.siteKey === site.key || row.clientKey === site.clientKey))),
        previousAssignments: JSON.parse(JSON.stringify(db.sitePages.filter(row => row.siteKey === site.key))),
        disposition: "sitePages owns participation and order. Preserve current template requirements; routing rules remain independent. Health page assignments remain authoritative; no obsolete MCR placement is adopted." } });
    if (!db.configurationDefinitions.some(row => row.key === key)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0,
      definition: { path: null, metadata: { authority }, target: { kind: "site-page-participation" } } });
    if (!db.configurationValues.some(row => row.key === key)) db.configurationValues.push({ ...meta("configurationValues", key), position: 0,
      scope: "site", siteKey: site.key, clientKey: null, configurationKey: key, value: { version: 2, source: "sitePages" } satisfies Json });
  }
  db.configurationValues = db.configurationValues.filter(row => !retired.includes(row));
}
