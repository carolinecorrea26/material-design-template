export type AssociationUnderwriting = {
  associationKey: string; applicantKey: string;
  bands: Array<{ minimumAgeYears: number; maximumAgeYears: number; minimumAmount?: number; minimumAmountExclusive?: boolean; maximumAmount?: number; pathway: "QD" | "FUW" | "GI" | "SI" | "NA" | "NCGI" | "TELE"; healthPage: "health-li" | "health-di" | "health-qd" | "health-si" | null }>;
};
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function isAssociationUnderwriting(value: unknown): value is AssociationUnderwriting[] {
  if (!Array.isArray(value) || !value.length) return false;
  const scopes = new Set<string>();
  return value.every(rule => {
    if (!object(rule) || typeof rule.associationKey !== "string" || !rule.associationKey.trim() || !["member", "spouse", "child"].includes(String(rule.applicantKey)) || !Array.isArray(rule.bands) || !rule.bands.length) return false;
    const key = `${rule.associationKey}/${rule.applicantKey}`;
    if (scopes.has(key)) return false;
    scopes.add(key);
    if (!rule.bands.every(band => object(band) && finite(band.minimumAgeYears) && Number.isInteger(band.minimumAgeYears) && finite(band.maximumAgeYears) && Number.isInteger(band.maximumAgeYears) && band.minimumAgeYears <= band.maximumAgeYears && (band.minimumAmount === undefined || finite(band.minimumAmount)) && (band.maximumAmount === undefined || finite(band.maximumAmount) && band.maximumAmount >= Number(band.minimumAmount ?? 0)) && (band.minimumAmountExclusive === undefined || typeof band.minimumAmountExclusive === "boolean") && ["QD", "FUW", "GI", "SI", "NA", "NCGI", "TELE"].includes(String(band.pathway)) && (band.healthPage === null || ["health-li", "health-di", "health-qd", "health-si"].includes(String(band.healthPage))))) return false;
    const bands = rule.bands as AssociationUnderwriting["bands"];
    return bands.every((a, index) => bands.slice(index + 1).every(b => {
      if (a.maximumAgeYears < b.minimumAgeYears || b.maximumAgeYears < a.minimumAgeYears) return true;
      const min = Math.max(a.minimumAmount ?? 0, b.minimumAmount ?? 0), max = Math.min(a.maximumAmount ?? Infinity, b.maximumAmount ?? Infinity);
      return min > max || min === max && ((a.minimumAmount ?? 0) === min && a.minimumAmountExclusive || (b.minimumAmount ?? 0) === min && b.minimumAmountExclusive);
    }));
  });
}
export function resolveAssociationUnderwriting(rules: AssociationUnderwriting[], associationKey: string, applicantKey: string, ageYears?: number, amount?: number) {
  const rule = rules.find(rule => rule.associationKey === associationKey && rule.applicantKey === applicantKey);
  if (!rule) return null;
  if (!finite(ageYears) || !Number.isInteger(ageYears) || !finite(amount) || amount <= 0) return { status: "needs-information" as const, pathway: undefined };
  const bands = rule.bands.filter(band => ageYears >= band.minimumAgeYears && ageYears <= band.maximumAgeYears && (band.minimumAmountExclusive ? amount > (band.minimumAmount ?? 0) : amount >= (band.minimumAmount ?? 0)) && amount <= (band.maximumAmount ?? Infinity));
  return bands.length === 1 ? { status: "resolved" as const, pathway: bands[0].pathway, healthPage: bands[0].healthPage } : { status: "unresolved" as const, pathway: undefined };
}
