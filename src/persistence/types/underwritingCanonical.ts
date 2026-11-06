// Generated storage contracts; business relationships use stable semantic keys.
import type { LibraryMetadata } from "../../domain/provenance";
export interface UnderwritingBands extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  applicantTypeKey: string | null;
  siteKey: string | null;
  pathway: string | null;
  minimumAge: number | null;
  maximumAge: number | null;
  minimumAmount: number | null;
  maximumAmount: number | null;
  minimumAmountExclusive: boolean;
  applicantClass: string | null;
  mortalityMorbidity: string | null;
  conditionKey: string | null;
  status: string;
}
export interface ResidencyRules extends LibraryMetadata {
  id: string;
  key: string;
  siteKey: string | null;
  productKey: string | null;
  riderKey: string | null;
  mode: string;
  conditionKey: string | null;
}
export interface ResidencyJurisdictions extends LibraryMetadata {
  id: string;
  key: string;
  residencyRuleKey: string;
  jurisdiction: string;
}
export interface BenefitPeriodOptions extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  siteKey: string | null;
  applicantTypeKey: string | null;
  kind: string;
  value: string;
  label: string;
  days: number | null;
  position: number;
}
export interface EligibilityConstraints extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  siteKey: string | null;
  applicantTypeKey: string;
  minimumAgeDays: number | null;
  minimumAgeYears: number | null;
  maximumAgeYears: number | null;
  studentMaximumAgeYears: number | null;
  minimumWorkHours: number | null;
}
export interface CoverageDependencies extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  siteKey: string | null;
  applicantTypeKey: string;
  requiresApplicantKey: string;
  categoryKey: string;
  sameProduct: boolean;
}
export interface MaximumPlanRules extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  siteKey: string | null;
  applicantTypeKey: string;
  categoryKey: string;
  count: number;
}
export interface BenefitCaps extends LibraryMetadata {
  id: string;
  key: string;
  aggregateLimitKey: string;
  minimumAgeYears: number | null;
  maximumAgeYears: number | null;
  selfEmployedLessThanYears: number | null;
  maximum: number;
  requiredWaitingPeriod: string | null;
  requiredBenefitPeriod: string | null;
  position: number;
}
