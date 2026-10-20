import type { DatabaseSchema } from "../persistence/types";
import type { RuleProvenance } from "./effectiveSite";

export const isProductAvailabilityPath = (path: readonly string[] | null | undefined) => path?.[0] === "coverages" && (path.length === 1 || path[1] === "enabled");

export function resolveProductAvailabilityOwnership(data: Pick<DatabaseSchema, "configurationDefinitions" | "configurationValues">,
  configurations: { key: string; value: unknown; provenance: RuleProvenance[] }[], siteKey: string) {
  const markers = configurations.filter(row => data.configurationDefinitions.find(definition => definition.key === row.key)?.definition.target?.kind === "site-product-availability");
  if (!markers.length) return "legacy" as const;
  const value = markers[0].value;
  const rows = markers[0].provenance.flatMap(source => data.configurationValues.filter(row => row.key === source.key));
  if (markers.length !== 1 || rows.length !== 1 || rows[0].scope !== "site" || rows[0].siteKey !== siteKey || rows[0].clientKey !== null
    || value === null || typeof value !== "object" || Array.isArray(value) || !("version" in value) || value.version !== 2
    || !("source" in value) || value.source !== "siteProducts" || Object.keys(value).some(key => !["version", "source"].includes(key))) throw new Error("Invalid Site product availability contract");
  if (configurations.some(row => isProductAvailabilityPath(data.configurationDefinitions.find(definition => definition.key === row.key)?.definition.path))) throw new Error("Product availability copies compete with siteProducts");
  return "siteProducts" as const;
}
