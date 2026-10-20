import type { LibraryMetadata } from "../../domain/provenance";
import type { FieldDefinition } from "../../domain/fields";
import type { Page } from "../../domain/pages";
import type { PageSectionConfig } from "../../config/pageSections/types";
import type { LibraryRow } from "./catalog";

export type PageRow = LibraryRow<Page & { healthGate: boolean }>;
export interface PageSectionRow extends LibraryRow<PageSectionConfig> { pageKey: string }
export type FieldRow = LibraryRow<FieldDefinition>;
export interface PageFieldRow extends Partial<LibraryMetadata> { id: string; key: string; pageKey: string; fieldKey: string; position: number }
export interface ValidationRuleRow extends LibraryRow<{ required?: boolean; format?: FieldDefinition["format"]; inputType?: FieldDefinition["inputType"] }> { fieldKey: string }
