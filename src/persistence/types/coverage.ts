import type { LibraryMetadata } from "../../domain/provenance";
import type { CoverageDefinition, RiderDefinition, CoverageApplicantId } from "../../domain/coverage";
import type { Json } from "./common";
import type { LibraryRow, Scope } from "./catalog";

export type CoverageCategoryRow = LibraryRow<{ label: string; shortLabel?: string; iconKey: string }>;
/** Catalog categories can expand without activating new runtime coverage categories. */
export interface ProductRow extends LibraryRow<Omit<CoverageDefinition, "riders" | "gNumber" | "planCode" | "categoryId" | "code"> & { categoryId: string; code: string | null }> { categoryKey: string }
/** Catalog-only MCR riders may lack a confirmed premium factor. Runtime assignment must validate it. */
export type RiderRow = LibraryRow<Omit<RiderDefinition, "premiumFactor"> & { premiumFactor: number | null }>;
export interface ProductRiderRow extends Partial<LibraryMetadata>, Scope { id: string; key: string; productKey: string; riderKey: string; position: number }
export interface ProductIdentifierRow extends Scope, LibraryRow<Json> { productKey: string; kind: "gNumber" | "planCode" }
export type ApplicantTypeRow = LibraryRow<{ label: string; applicantType: CoverageApplicantId }>;
