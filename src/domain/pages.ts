import type { PageId, PageGroupId } from "./identities";
import type { FieldId } from "./fields";
import type { PageSectionId } from "../config/pageSections/types";

export type ProgressStepId = string;
export type PageHelpDefinition = { id: string; label: string; title: string };
export type Page = { legalSections?: Record<string, { maxHeight: number | null }>; help?: PageHelpDefinition[]; id: PageId; displayName?: string; saveProgress?: boolean; inlineFieldKeys?: string[]; previewPageIds?: PageId[]; groupId?: PageGroupId; path: string; type: string; flow: import("../config/pageCatalog").PageFlow };
export type PageGroup = { id: PageGroupId; pageIds: PageId[] };
export type ProgressStep = { id: ProgressStepId; pageIds: PageId[]; label: string };
export type PageSection = { id: PageSectionId; pageId: PageId; fieldIds: FieldId[] };
