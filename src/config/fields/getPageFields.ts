import type { PageId } from "../../types/page";
import { fieldCatalog } from "./index";
import { pageFields } from "./pageFields";
import type { FieldDefinition } from "./types";

export function getPageFields(pageId: PageId): FieldDefinition[] {
  const fieldIds = pageFields[pageId] ?? [];

  return fieldIds
    .map((fieldId) => fieldCatalog[fieldId])
    .filter((field): field is FieldDefinition => Boolean(field));
}
