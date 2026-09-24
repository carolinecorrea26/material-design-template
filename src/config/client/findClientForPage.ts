import type { PageId } from "../../types";
import { resolveSiteCoverage, siteEntities, type SiteId } from "../../data";
import { coverageUnlocksPage } from "../flowGates";

/**
 * Finds a Site whose coverage catalog can unlock a gated health-* page
 * (e.g. one offering an "SI" coverage for health-si). Returns null if no
 * registered Site has a matching coverage — meaning the page can't be
 * reached with any amount of dummy data.
 */
export function findSiteIdUnlockingPage(pageId: PageId): SiteId | null {
  for (const site of siteEntities) {
    const coverages = resolveSiteCoverage(site.id);
    if (coverages.some((coverage) => coverageUnlocksPage(pageId, coverage.effective))) {
      return site.id;
    }
  }

  return null;
}
