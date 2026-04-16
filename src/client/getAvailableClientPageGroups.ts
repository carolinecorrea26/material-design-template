import { pageGroups } from "../config/pageGroups";
import { getAvailableClientPages } from "./getAvailableClientPages";

export function getAvailableClientPageGroups() {
  const availablePages = getAvailableClientPages();
  const availablePageIds = new Set(availablePages.map((page) => page.id));

  return pageGroups.filter((group) =>
    group.pages.some((pageId) => availablePageIds.has(pageId))
  );
}
