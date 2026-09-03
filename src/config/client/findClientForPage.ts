import type { ClientId, PageId } from "../../types";
import { clients } from "../clients";
import { coverageUnlocksPage } from "../formFlow";
import { getClientCoverages } from "./getActiveClientCoverages";

/**
 * Finds a client whose coverage catalog can unlock a gated health-* page
 * (e.g. one offering an "SI" coverage for health-si). Returns null if no
 * registered client has a matching coverage — meaning the page can't be
 * reached with any amount of dummy data.
 */
export function findClientIdUnlockingPage(pageId: PageId): ClientId | null {
  for (const [id, client] of Object.entries(clients)) {
    const coverages = getClientCoverages(client);
    if (coverages.some((coverage) => coverageUnlocksPage(pageId, coverage))) {
      return id as ClientId;
    }
  }

  return null;
}
