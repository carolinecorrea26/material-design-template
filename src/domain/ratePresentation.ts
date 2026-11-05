import type { EffectiveSite } from "./effectiveSite";

export type RatePresentationPolicy = { version: 1; praseConfigured: boolean; quoteToolEnabled: boolean; coverageQuoteEnabled: boolean; suppressedAssociationKeys?: string[] };
export type ReferenceRateTable = { version: 1; title: string; notes?: string[]; sources?: Array<{ kind: "pdf" | "image" | "xml" | "link"; url: string; label: string }> } & (
  { kind: "pdf" | "image" | "link" | "xml"; url: string } |
  { kind: "html-table"; columns: string[]; rows: string[][] }
);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
export function isRatePresentationPolicy(value: unknown): value is RatePresentationPolicy {
  return object(value) && value.version === 1 && ["praseConfigured", "quoteToolEnabled", "coverageQuoteEnabled"].every(key => typeof value[key] === "boolean") && (value.suppressedAssociationKeys === undefined || Array.isArray(value.suppressedAssociationKeys) && new Set(value.suppressedAssociationKeys).size === value.suppressedAssociationKeys.length && value.suppressedAssociationKeys.every(text));
}
export function associationRatesSuppressed(site: EffectiveSite, values: Record<string, unknown>) {
  const key = values.association ?? values.membership;
  return site.configuration.ratePresentationPolicies.some(row => isRatePresentationPolicy(row.value) && typeof key === "string" && row.value.suppressedAssociationKeys?.includes(key));
}
export function safeRateUrl(value: unknown): value is string {
  if (!text(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function isReferenceRateTable(value: unknown): value is ReferenceRateTable {
  if (!object(value) || value.version !== 1 || !text(value.title)) return false;
  if (value.notes !== undefined && (!Array.isArray(value.notes) || !value.notes.every(text))) return false;
  if (value.sources !== undefined && (!Array.isArray(value.sources) || !value.sources.every(source => object(source) && ["pdf", "image", "xml", "link"].includes(String(source.kind)) && text(source.label) && safeRateUrl(source.url)))) return false;
  if (value.kind === "html-table") return Array.isArray(value.columns) && value.columns.length > 0 && value.columns.every(text) && Array.isArray(value.rows) && value.rows.length > 0 && value.rows.every(row => Array.isArray(row) && row.length === (value.columns as unknown[]).length && row.every(cell => typeof cell === "string"));
  if (!["pdf", "image", "link", "xml"].includes(String(value.kind)) || !text(value.url)) return false;
  if (value.url.startsWith("/") && !value.url.startsWith("//") && !value.url.includes("\\")) return true;
  try { const url = new URL(value.url); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export const defaultRatePresentation: RatePresentationPolicy = { version: 1, praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false };

/** Capability is separate from actual premium availability. This does not price
 * coverage or assert that the PRASE integration has been validated. */
export function resolveRatePresentation(site: EffectiveSite, productKey: string, associationKey?: string) {
  const product = site.configuration.products.find(product => product.productKey === productKey);
  const policies = site.configuration.ratePresentationPolicies;
  const invalid = !product || policies.length > 1 || policies.length === 1 && !isRatePresentationPolicy(policies[0].value) || product.referenceRateTables.length > 1 || product.referenceRateTables.some(table => !isReferenceRateTable(table.value));
  if (invalid) return { status: "unresolved" as const, praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false, hideCalculatedRates: true, homePageVariant: "hero-image" as const, referenceTable: null, rateArea: "hidden" as const, reason: "Invalid or ambiguous rate presentation policy" };
  const policy = policies.length ? policies[0].value as RatePresentationPolicy : defaultRatePresentation;
  const suppressed = !!associationKey && !!policy.suppressedAssociationKeys?.includes(associationKey);
  const referenceTable = !policy.praseConfigured && product.referenceRateTables.length ? product.referenceRateTables[0].value as ReferenceRateTable : null;
  return { status: "resolved" as const, praseConfigured: policy.praseConfigured, quoteToolEnabled: !suppressed && policy.praseConfigured && policy.quoteToolEnabled, coverageQuoteEnabled: !suppressed && policy.praseConfigured && policy.coverageQuoteEnabled,
    hideCalculatedRates: suppressed || !policy.praseConfigured, homePageVariant: policy.praseConfigured ? null : "hero-image" as const, referenceTable: suppressed ? null : referenceTable,
    rateArea: suppressed ? "hidden" as const : referenceTable ? "reference-link" as const : policy.praseConfigured && policy.coverageQuoteEnabled ? "quote-capable" as const : "hidden" as const,
    reason: suppressed ? "Premium estimates are suppressed for the selected Association" : policy.praseConfigured ? "Calculated estimates require a verified rate response" : "Calculated rates disabled; optional reference table only" };
}
