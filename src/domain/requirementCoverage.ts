import type { DatabaseSchema, Json } from "../persistence/types";

export const requirementCoverageDomain = "application-rule-coverage";
export const coverageReviewLabels = {
  verified: "Verified for this requirement",
  "needs-decision": "Business decision needed",
  "implementation-gap": "Implementation gap",
  "review-pending": "Review pending",
  "accepted-provisional": "Accepted provisional",
  "accepted-exception": "Accepted exception",
  deferred: "Explicitly deferred",
} as const;
export type CoverageReviewStatus = keyof typeof coverageReviewLabels;
export type RequirementCoverage = {
  id: string; area: "Membership" | "Eligibility" | "Coverage";
  siteKey: string; productKey: string | null; applicantKey: string | null;
  title: string; expectedBehavior: string; finding: string; status: CoverageReviewStatus;
  sourceReferences: string[]; ruleKeys: string[];
  owners: Array<{ table: string; key: string; column?: string; reviewedValue?: Json }>;
  implementationReferences: string[]; verificationReferences: string[];
};

/** Review metadata is read from the same captured Library as the rules it describes. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}
export function requirementCoverageRows(data: Pick<DatabaseSchema, "semanticRequirements"> & Partial<DatabaseSchema>, siteKey = "all"): RequirementCoverage[] {
  return data.semanticRequirements.filter(row => row.domain === requirementCoverageDomain).map(row => {
    const value = row.value as unknown as RequirementCoverage;
    if (!value || typeof value !== "object" || value.id !== row.key || typeof value.siteKey !== "string"
      || !Object.hasOwn(coverageReviewLabels, value.status) || !["Membership", "Eligibility", "Coverage"].includes(value.area)
      || [value.title, value.expectedBehavior, value.finding].some(text => typeof text !== "string")
      || ![value.sourceReferences, value.ruleKeys, value.implementationReferences, value.verificationReferences].every(list => Array.isArray(list) && list.every(item => typeof item === "string"))
      || !Array.isArray(value.owners) || value.owners.some(owner => !owner || typeof owner.table !== "string" || typeof owner.key !== "string")
      || value.status === "verified" && !value.verificationReferences.length) throw new Error(`Invalid requirement coverage record: ${row.key}`);
    const result = structuredClone(value);
    if (result.status === "verified" && result.owners.some(owner => {
      const records = data[owner.table as keyof DatabaseSchema];
      const record = Array.isArray(records) ? (records as Array<{ key: string } & Record<string, unknown>>).find(record => record.key === owner.key) : undefined;
      const current = owner.column ? record?.[owner.column] : record;
      return owner.reviewedValue === undefined || canonical(current) !== canonical(owner.reviewedValue);
    })) {
      result.status = "review-pending";
      result.finding = `Owning data changed or is unavailable since verification. Recheck this requirement. Previous finding: ${result.finding}`;
    }
    return result;
  }).filter(row => siteKey === "all" || row.siteKey === siteKey).sort((a, b) => a.area.localeCompare(b.area) || a.siteKey.localeCompare(b.siteKey) || a.id.localeCompare(b.id));
}
