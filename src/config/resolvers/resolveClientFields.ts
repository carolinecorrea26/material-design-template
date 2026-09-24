import type { PageId } from "../../types";
import type { ClientConfig } from "../clients/types";
import {
  createFieldRowFromDefinition,
  getPageFieldRows,
  isClientSpecificField,
  mergeFieldOverrideIntoRow,
  pagesWithNoFields,
  type FieldRow,
} from "../../content/docs/fieldRows";
import { getResolvedFieldResolutionsForSite } from "../fields/resolvedFieldRegistry";
import { getSiteIdForLegacyClient } from "../../data";
import { getPageTitle } from "../pages";
import type { ResolutionStatus } from "./types";
import { getSiteDetailsPageOrder } from "./resolveClientPages";

export type ResolvedField = {
  fieldId: string;
  pageId: PageId;
  /** Effective (already-merged) row this client sees, or would see if not disabled. */
  row: FieldRow;
  included: boolean;
  status: ResolutionStatus;
};

export type ResolvedFieldPage = {
  pageId: PageId;
  pageTitle: string;
  fields: ResolvedField[];
};

/**
 * Projects canonical resolved fields into documentation rows. Client/Site
 * merge precedence is owned by resolvedFieldRegistry, not reconstructed here.
 */
export function resolveClientFieldsForPage(
  pageId: PageId,
  client: ClientConfig,
): ResolvedField[] {
  const baseRows = getPageFieldRows(pageId).filter(
    (r) => !isClientSpecificField(r.fieldId),
  );
  const resolutions = getResolvedFieldResolutionsForSite(
    pageId,
    getSiteIdForLegacyClient(client.id),
  );

  if (resolutions.length === 0) {
    return baseRows
      .filter((row) => row.fieldId !== "—")
      .map((row) => ({
        fieldId: row.fieldId,
        pageId,
        row,
        included: true,
        status: "inherited",
      }));
  }

  return resolutions.map((resolution) => {
    const baseRow = baseRows.find((row) => row.fieldId === resolution.fieldId);
    const projectedRow = baseRow
      ? mergeFieldOverrideIntoRow(baseRow, resolution.field)
      : createFieldRowFromDefinition(resolution.field);
    const row = resolution.notes.length > 0
      ? { ...projectedRow, clientNote: resolution.notes.join(" · ") }
      : projectedRow;
    return {
      fieldId: resolution.fieldId,
      pageId,
      row,
      included: resolution.included,
      status: resolution.status,
    };
  });
}

/** Resolves fields for every page in the form flow that has user-interactive fields. */
export function resolveClientFields(client: ClientConfig): ResolvedFieldPage[] {
  const result: ResolvedFieldPage[] = [];
  for (const pageId of getSiteDetailsPageOrder()) {
    if (pagesWithNoFields.has(pageId)) continue;
    const fields = resolveClientFieldsForPage(pageId, client);
    if (fields.length > 0) {
      result.push({ pageId, pageTitle: getPageTitle(pageId), fields });
    }
  }
  return result;
}
