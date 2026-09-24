import type { PageId } from "../../types";
import type { ClientConfig } from "../clients/types";
import {
  getPageFieldRows,
  applyClientFieldDiff,
  isClientSpecificField,
  pagesWithNoFields,
  type FieldRow,
} from "../../content/docs/fieldRows";
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
 * Classifies a diffed FieldRow using the note applyClientFieldDiff /
 * applyMembershipClientFieldDiff already computed, so status derivation
 * never re-implements the merge precedence (extra > required > override)
 * those functions already encode.
 */
function statusFromDiff(row: FieldRow, included: boolean): ResolutionStatus {
  if (!included) return "disabled";
  if (!row.clientNote) return "inherited";
  if (row.clientNote.includes("Added for this client")) return "client-specific";
  return "overridden";
}

/**
 * Resolves one page's fields for the given client: global catalog rows
 * (pageSections + fieldCatalog, or hand-authored custom rows) merged with
 * the client's field overrides (ClientConfig.fields, or — for Membership —
 * membershipClientFields), via the existing pure diff functions in
 * content/docs/fieldRows.ts. No merge logic is duplicated here.
 */
export function resolveClientFieldsForPage(
  pageId: PageId,
  client: ClientConfig,
): ResolvedField[] {
  const baseRows = getPageFieldRows(pageId).filter(
    (r) => !isClientSpecificField(r.fieldId),
  );
  const { rows, hiddenRows } = applyClientFieldDiff(pageId, baseRows, client);

  const visible: ResolvedField[] = rows
    .filter((row) => row.fieldId !== "—")
    .map((row) => ({
      fieldId: row.fieldId,
      pageId,
      row,
      included: true,
      status: statusFromDiff(row, true),
    }));

  const hidden: ResolvedField[] = hiddenRows.map((row) => ({
    fieldId: row.fieldId,
    pageId,
    row,
    included: false,
    status: statusFromDiff(row, false),
  }));

  return [...visible, ...hidden];
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
