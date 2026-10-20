import type { RiderRow } from "../persistence/types/coverage";
import type { CoverageAmountAssignment } from "./coverage";
import { isReferenceRateTable } from "./ratePresentation";

type StoredRider = RiderRow["definition"];
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const money = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const applicants = (value: unknown): boolean => Array.isArray(value) && value.every(item => ["member", "spouse", "child"].includes(item)) && new Set(value).size === value.length;

export const riderOverrideProperties = ["name", "description", "hasAmount", "coverageAmounts", "applicants", "riderOnlyApplicants", "dependentApplicant",
  "defaultSelected", "included", "defaultAmount", "amountLabel", "displayAsProduct", "referenceRateTable", "enabled"] as const;

export function isRelationalRiderSet(value: unknown): boolean {
  return object(value) && value.version === 2 && value.source === "productRiders";
}

function isAmountAssignment(value: unknown): value is CoverageAmountAssignment {
  if (!object(value)) return false;
  if (value.scope !== undefined && (!object(value.scope) || value.scope.applicantType !== undefined && !["member", "spouse", "child"].includes(String(value.scope.applicantType))
    || value.scope.applicantClassId !== undefined && !text(value.scope.applicantClassId))) return false;
  if (value.derivedFrom !== undefined) {
    const derived = value.derivedFrom;
    return object(derived) && ["member", "spouse"].includes(String(derived.applicantType)) && (derived.applicantClassId === undefined || text(derived.applicantClassId))
      && object(derived.calculation) && ["percentage", "fixed"].includes(String(derived.calculation.type)) && money(derived.calculation.value);
  }
  return Array.isArray(value.selections) && value.selections.length > 0 && value.selections.every(selection => {
    if (!object(selection)) return false;
    if (selection.type === "range") return money(selection.min) && money(selection.max) && selection.min <= selection.max && money(selection.increment) && selection.increment > 0;
    if (selection.type === "amountList") return Array.isArray(selection.values) && selection.values.length > 0 && selection.values.every(money) && new Set(selection.values).size === selection.values.length;
    return selection.type === "optionList" && Array.isArray(selection.options) && selection.options.length > 0 && selection.options.every(option => object(option) && text(option.value) && text(option.label));
  });
}

/** Validates the effective global definition plus property overrides. Null pricing
 * remains explicitly unavailable; identity and pricing cannot be overridden here. */
export function isStoredRider(value: unknown): value is StoredRider {
  if (!object(value) || !text(value.id) || !text(value.name) || typeof value.description !== "string" || value.premiumFactor !== null && !money(value.premiumFactor)) return false;
  for (const key of ["hasAmount", "defaultSelected", "included", "displayAsProduct"]) if (value[key] !== undefined && typeof value[key] !== "boolean") return false;
  if (value.defaultAmount !== undefined && (!money(value.defaultAmount) || value.defaultAmount <= 0)) return false;
  if (value.amountLabel !== undefined && !text(value.amountLabel)) return false;
  if (value.dependentApplicant !== undefined && !["spouse", "child"].includes(String(value.dependentApplicant))) return false;
  if (value.applicants !== undefined && !applicants(value.applicants) || value.riderOnlyApplicants !== undefined && !applicants(value.riderOnlyApplicants)) return false;
  if (value.coverageAmounts !== undefined && (!Array.isArray(value.coverageAmounts) || !value.coverageAmounts.every(isAmountAssignment))) return false;
  return value.referenceRateTable === undefined || isReferenceRateTable(value.referenceRateTable);
}

export function applyRiderOverrides(base: StoredRider, overrides: { key: string; value: unknown }[]): { definition: StoredRider; enabled?: boolean } {
  const definition: Record<string, unknown> = { ...structuredClone(base) };
  let enabled: boolean | undefined;
  for (const override of overrides) {
    if (!riderOverrideProperties.some(property => property === override.key)) throw new Error(`Unsupported rider override property: ${override.key}`);
    if (override.key === "enabled") {
      if (typeof override.value !== "boolean") throw new Error("Invalid rider availability override");
      enabled = override.value;
    } else if (override.value === null) delete definition[override.key];
    else definition[override.key] = structuredClone(override.value);
  }
  if (!isStoredRider(definition)) throw new Error("Invalid effective rider definition");
  return { definition, ...(enabled !== undefined ? { enabled } : {}) };
}
