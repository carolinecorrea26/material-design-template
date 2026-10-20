import { effectiveConfigurationTables } from "../domain/effectiveConfiguration";
import type { DatabaseSchema } from "./types";

/** Read boundary only. Raw extraction, compatibility blobs and operational data are excluded. */
export const normalizedSnapshotTables = [
  'associationEntities', 'associationAliases', 'associationAffiliations', 'siteAssociationContexts',
  ...effectiveConfigurationTables, "components",
  "sites", "clients", "siteProducts", "siteProductApplicants", "eligibilityConstraints", "semanticRequirements",
  "organizations", "organizationProfiles", "associations", "siteAssociations", "sitePolicies", "siteEnvironmentLinks",
  "emailTemplates", "siteEmailTemplates", "documentDefinitions", "siteDocuments",
  "urlParameters", "urlParameterValues", "siteUrlParameters",
  "patterns", "patternAssignments", "patternRules", "patternConditions", "patternFlagDefinitions", "patternFlows", "patternProducts", "patternCoverageCategories", "patternConfigurationDefinitions",
  "flagDefinitions", "flagValues", "flagAssignments", "flagRules", "ruleFlags", "rulePredicates", "structuredRuleActions", "provenanceTags",
] as const;
export type SnapshotTable = typeof normalizedSnapshotTables[number];
export type RevisionSnapshot<T extends SnapshotTable = SnapshotTable> = {
  formatVersion: 1;
  consistency: "single-read";
  revision: string;
  data: Pick<DatabaseSchema, T>;
};
export interface SnapshotReader {
  readSnapshot<T extends SnapshotTable>(tables: readonly T[]): Promise<RevisionSnapshot<T>>;
}
export function validateSnapshotRequest<T extends SnapshotTable>(tables: readonly T[]): T[] {
  if (!Array.isArray(tables) || !tables.length || new Set(tables).size !== tables.length || tables.some(table => !normalizedSnapshotTables.includes(table))) throw new Error("Invalid normalized snapshot table request.");
  return [...tables].sort();
}
export type SnapshotRow = Record<string, unknown> & { id: string };
export type SnapshotStructure<T extends SnapshotTable> = { [Table in T]: SnapshotRow[] };

function isSnapshotRow(value: unknown): value is SnapshotRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return "id" in value && typeof value.id === "string" && value.id.length > 0;
}

/** Validate table/row structure only. Domain resolvers validate executable properties;
 * this boundary does not establish the full DatabaseSchema row contracts.
 */
export function validateSnapshotData<T extends SnapshotTable>(data: unknown, tables: readonly T[]): asserts data is SnapshotStructure<T> {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Incomplete or unexpected snapshot tables.");
  const actualTables = Object.keys(data).sort().join("|");
  const expectedTables = [...tables].sort().join("|");
  if (actualTables !== expectedTables) throw new Error("Incomplete or unexpected snapshot tables.");
  for (const table of tables) {
    const rows = (data as Record<string, unknown>)[table];
    if (!Array.isArray(rows) || !rows.every(isSnapshotRow)) throw new Error(`Malformed snapshot rows: ${table}`);
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error(`Duplicate snapshot row: ${table}`);
    if (table === 'flagAssignments' && rows.some(row => row.applicationId != null)) throw new Error('Operational application flags cannot enter configuration snapshots.');
  }
}
function canonical(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)]));
  throw new Error("Snapshot data must be JSON serializable.");
}
/** Revision of the detached local dataset. Not an authorization token or published release ID. */
export async function localSnapshotRevision(data: Partial<DatabaseSchema>): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Snapshot hashing requires Web Crypto in a secure context.");
  const ordered = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)]));
  const encoded = new TextEncoder().encode(JSON.stringify(canonical(ordered)));
  const hash = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return `local:v1:sha256:${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}
