import type { DatabaseSchema } from "../persistence/types";
import type { RuleProvenance } from "./effectiveSite";

export const isSiteStructurePath = (path: readonly string[] | null | undefined) => path?.[0] === "fields" || path?.join(".") === "features.defaultTemplate";

export function resolveSiteStructureOwnership(data: Pick<DatabaseSchema, "configurationDefinitions" | "configurationValues">,
  configurations: { key: string; value: unknown; provenance: RuleProvenance[] }[], siteKey: string) {
  const markers = configurations.filter(row => data.configurationDefinitions.find(definition => definition.key === row.key)?.definition.target?.kind === "site-structure-ownership");
  if (!markers.length) return "legacy" as const;
  const value = markers[0].value;
  const rows = markers[0].provenance.flatMap(source => data.configurationValues.filter(row => row.key === source.key));
  if (markers.length !== 1 || rows.length !== 1 || rows[0].scope !== "site" || rows[0].siteKey !== siteKey || rows[0].clientKey !== null
    || value === null || typeof value !== "object" || Array.isArray(value) || !("version" in value) || value.version !== 2
    || !("source" in value) || value.source !== "stored-structure" || Object.keys(value).some(key => !["version", "source"].includes(key))) throw new Error("Invalid Site structure ownership contract");
  if (configurations.some(row => isSiteStructurePath(data.configurationDefinitions.find(definition => definition.key === row.key)?.definition.path))) throw new Error("Site structure copies compete with stored placements and template mode");
  return "stored-structure" as const;
}
