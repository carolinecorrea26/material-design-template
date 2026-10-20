// Generated storage contracts; business relationships use stable semantic keys.
import type { Json } from "./common";
import type { LibraryMetadata } from "../../domain/provenance";
export interface ProvenanceTags extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
}
export interface SourceWorkbooks extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
  sha256: string;
}
export interface SourceSheets extends LibraryMetadata {
  id: string;
  key: string;
  workbookKey: string;
  name: string;
  cellCount: number;
  mergedRanges: Json;
  imageCount: number;
}
export interface SourceRequirements extends LibraryMetadata {
  id: string;
  key: string;
  sheetKey: string;
  cell: string;
  value: Json | null;
  formula: string | null;
  comment: string | null;
  hyperlink: string | null;
  promotionState: import("../../domain/sourcePromotion").PromotionState;
  promotionReason: string;
  activeSiteKeys: Json;
  classification: string;
  reason: string;
  checklistNotes: string | null;
}
export interface RequirementTargets extends LibraryMetadata {
  id: string;
  key: string;
  requirementKey: string;
  targetTable: string;
  targetKey: string;
  targetColumn: string;
}
export interface SemanticRequirements extends LibraryMetadata {
  id: string;
  key: string;
  domain: string;
  subjectTable: string;
  subjectKey: string;
  predicate: string;
  value: Json;
  status: string;
}
export interface IdentityResolutions extends LibraryMetadata {
  id: string;
  key: string;
  sheetKey: string;
  sourceRow: number;
  strategy: string;
  candidateKeys: Json;
  productKey: string | null;
  explanation: string;
}
