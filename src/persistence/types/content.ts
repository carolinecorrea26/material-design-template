import type { FeatureDefinition } from "../../domain/features";
import type { Json } from "./common";
import type { LibraryRow } from "./catalog";

export type FeatureRow = LibraryRow<FeatureDefinition>;
export type ConfigurationTarget =
  | { kind: "field-definition-ownership" }
  | { kind: "site-page-participation" }
  | { kind: "site-product-availability" }
  | { kind: "site-structure-ownership" }
  | { kind: "site-routing-policy" }
  | { kind: "site-life-aggregate-participation" }
  | { kind: "product-rate-modifier-policy"; productKey: string }
  | { kind: "site-review-policy" }
  | { kind: "product-rate-input-policy"; productKey: string }
  | { kind: "product-journey-policy"; productKey: string }
  | { kind: "product-selection-policy"; productKey: string }
  | { kind: "site-rate-presentation" }
  | { kind: "product-reference-rate-table"; productKey: string }
  | { kind: "product-presentation"; productKey: string; property: string }
  | { kind: "product-rider-set"; productKey: string }
  | { kind: "product-rider-override"; productKey: string; riderKey: string; property: string }
  | { kind: "product-rate-outcome"; productKey: string }
  | { kind: "product-rating-adjustments"; productKey: string }
  | { kind: "product-residency-policy"; productKey: string }
  | { kind: "product-benefit-policy"; productKey: string }
  | { kind: "product-amount-cap-policy"; productKey: string }
  | { kind: "product-dependent-policy"; productKey: string }
  | { kind: "site-life-aggregate" }
  | { kind: "product-eligibility-facts"; productKey: string; applicantKey: string };
export type ConfigurationDefinitionRow = LibraryRow<{ path: string[] | null; metadata: Json; target?: ConfigurationTarget | null }>;
export type ContentEntryRow = LibraryRow<{ path: string[] | null }>;
export type EmailTemplateRow = LibraryRow<{ rendererKey: string; source: string }>;
export type DocumentDefinitionRow = LibraryRow<{ contentKey: string | null; productKey: string | null; source: string }>;
