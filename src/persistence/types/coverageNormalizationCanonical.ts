// Generated storage contracts; business relationships use stable semantic keys.
import type { Json } from "./common";
import type { LibraryMetadata } from "../../domain/provenance";
export interface ProductConfigurationValues extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  configurationKey: string;
  value: Json;
}
export interface ProductClients extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  clientKey: string;
}
export interface CoveragePlanDefinitions extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
  coverageType: string;
}
export interface CoveragePlanVariants extends LibraryMetadata {
  id: string;
  key: string;
  planKey: string;
  name: string | null;
  applicantTypeKey: string | null;
  position: number;
}
export interface PlanAmountRules extends LibraryMetadata {
  id: string;
  key: string;
  variantKey: string;
  amountPatternKey: string;
  conditionKey: string | null;
}
export interface ProductCoveragePlans extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  planKey: string;
  applicantTypeKey: string;
}
export interface PlanBenefitPeriods extends LibraryMetadata {
  id: string;
  key: string;
  variantKey: string;
  kind: string;
  value: number;
  unit: string;
  position: number;
}
export interface CoverageAmountPatterns extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  amountType: string;
  minimum: number | null;
  maximum: number | null;
  increment: number | null;
  formula: string | null;
  baseProductKey: string | null;
  baseApplicantKey: string | null;
  baseApplicantClass: string | null;
  multiplier: number | null;
}
export interface AmountOptions extends LibraryMetadata {
  id: string;
  key: string;
  amountPatternKey: string;
  value: string;
  label: string;
  position: number;
}
export interface AmountBands extends LibraryMetadata {
  id: string;
  key: string;
  amountPatternKey: string;
  minimum: number | null;
  maximum: number | null;
  increment: number | null;
  conditionKey: string | null;
  position: number;
}
export interface ProductAmountRules extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  applicantTypeKey: string | null;
  applicantClass: string | null;
  amountPatternKey: string;
  conditionKey: string | null;
  clientKey: string | null;
  siteKey: string | null;
  position: number;
}
export interface ProductApplicantEligibility extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  applicantTypeKey: string;
  siteKey: string | null;
  eligible: boolean;
  conditionKey: string | null;
}
export interface RiderAmountRules extends LibraryMetadata {
  id: string;
  key: string;
  riderKey: string;
  applicantTypeKey: string | null;
  amountPatternKey: string;
  baseProductKey: string | null;
  conditionKey: string | null;
}
export interface AggregateLimits extends LibraryMetadata {
  id: string;
  key: string;
  categoryKey: string | null;
  productKey: string | null;
  applicantTypeKey: string | null;
  maximum: number | null;
  formula: string | null;
  conditionKey: string | null;
  siteKey: string | null;
}
