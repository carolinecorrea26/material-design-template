import type { DatabaseSchema } from "../persistence/types";
import type { RuleProvenance } from "./effectiveSite";
import { resolvePageCatalog } from "./pageCatalog";

export function isPageParticipationPath(path: readonly string[] | null | undefined) {
  return path?.[0] === "pages" && (path.length === 1 || ["requirements", "excluded", "optional", "participationSource"].includes(path[1]));
}

type Data = Pick<DatabaseSchema, "pages" | "sitePages" | "configurationDefinitions" | "configurationValues">;
type Configuration = { key: string; value: unknown; provenance: RuleProvenance[] };
/** A revision opts in explicitly. Historical revisions keep their existing
 * compatibility settings; new revisions derive those settings from assignments. */
export function resolvePageParticipationOwnership(data: Data, configurations: Configuration[], siteKey: string) {
  const markers = configurations.filter(configuration => data.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-page-participation");
  if (!markers.length) return { source: "legacy" as const, provenance: [] as RuleProvenance[] };
  const value = markers[0].value;
  if (markers.length !== 1 || value === null || typeof value !== "object" || Array.isArray(value)
    || !("version" in value) || value.version !== 2 || !("source" in value) || value.source !== "sitePages"
    || Object.keys(value).some(key => !["version", "source"].includes(key))) throw new Error("Invalid Site page participation contract");
  const assignments = markers[0].provenance.flatMap(source => source.table === "configurationValues" ? data.configurationValues.filter(row => row.key === source.key) : []);
  if (assignments.length !== 1 || assignments[0].scope !== "site" || assignments[0].siteKey !== siteKey || assignments[0].clientKey !== null) throw new Error("Page participation ownership requires an exact Site assignment");
  if (configurations.some(configuration => isPageParticipationPath(data.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.path))) throw new Error("Page configuration copies compete with sitePages");
  const pages = resolvePageCatalog(data, siteKey);
  return { source: "sitePages" as const, provenance: [...markers[0].provenance, ...pages.filter(page => page.assigned).flatMap(page =>
    data.sitePages.filter(row => row.siteKey === siteKey && row.pageKey === page.key).map(row => ({ table: "sitePages", key: row.key, sourceReference: row.sourceReference })))] };
}
