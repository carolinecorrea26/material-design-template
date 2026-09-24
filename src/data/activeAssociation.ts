import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import type { SiteId } from "./model";
import { resolveActiveAssociation } from "./associationSelection";

export const ASSOCIATION_QUERY_PARAM = "association";

export function resolveActiveAssociationFromApplication(
  siteId: SiteId,
  values: Pick<ApplicationFormValues, "membership"> | ApplicationFormValues = {},
) {
  const selectedAssociationId =
    typeof values.membership === "string" ? values.membership : null;
  const urlAssociationId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get(ASSOCIATION_QUERY_PARAM);

  return resolveActiveAssociation(siteId, {
    selectedAssociationId,
    urlAssociationId,
  });
}
