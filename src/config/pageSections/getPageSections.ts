import type { PageId } from "../../types/page";
import { pageSections } from "./pageSections";
import type { PageSectionConfig } from "./types";

export function getPageSections(pageId: PageId): PageSectionConfig[] {
  return pageSections[pageId] ?? [];
}
