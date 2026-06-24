import type { PageId } from "../../types";
import { pageSections } from "./pageSections";
import type { PageSectionConfig } from "./types";

export function getPageSections(pageId: PageId): PageSectionConfig[] {
  return pageSections[pageId] ?? [];
}
