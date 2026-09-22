import type { PageId } from "../../types";
import type { ClientConfig, ClientPageRequirement } from "../clients/types";
import { getActiveClient } from "./getActiveClient";

const DEFAULT_PAGE_REQUIREMENT: ClientPageRequirement = "required";

function isConfigurablePageId(
  pageId: PageId,
): pageId is "beneficiary" | "payment" {
  return pageId === "beneficiary" || pageId === "payment";
}

/** Resolves for an arbitrary client; defaults to the active client so existing call sites are unaffected. */
export function getClientPageRequirement(
  pageId: PageId,
  client: ClientConfig = getActiveClient(),
): ClientPageRequirement {
  const { pages } = client;

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
