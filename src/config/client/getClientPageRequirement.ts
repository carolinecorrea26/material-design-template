import type { PageId } from "../../types";
import type { ClientPageRequirement } from "../clients/types";
import { getActiveClient } from "./getActiveClient";

const DEFAULT_PAGE_REQUIREMENT: ClientPageRequirement = "required";

function isConfigurablePageId(
  pageId: PageId,
): pageId is "beneficiary" | "payment" {
  return pageId === "beneficiary" || pageId === "payment";
}

export function getClientPageRequirement(
  pageId: PageId,
): ClientPageRequirement {
  const { pages } = getActiveClient();

  if (isConfigurablePageId(pageId)) {
    const configuredRequirement = pages.requirements?.[pageId];
    if (configuredRequirement) {
      return configuredRequirement;
    }
  }

  // Backward compatibility with legacy config arrays.
  if (pages.excluded?.includes(pageId)) {
    return "none";
  }

  if (pages.optional?.includes(pageId)) {
    return "optional";
  }

  return DEFAULT_PAGE_REQUIREMENT;
}
