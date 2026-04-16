import { pages } from "../config/pages";
import { getActiveClient } from "./getActiveClient";

export function getAvailableClientPages() {
  const client = getActiveClient();

  const excludedPages = new Set(client.pages.excluded ?? []);
  const categories = new Set(client.coverages.categories ?? []);

  return pages.filter((page) => {
    if (excludedPages.has(page.id)) {
      return false;
    }

    if (page.id === "beneficiary" && !categories.has("LI") && !categories.has("AD")) {
      return false;
    }

    return true;
  });
}
