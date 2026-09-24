import type { Association, Site, SiteId } from "./model";
import { getAssociationsForSite, getSite } from "./registry";

export type AssociationSelectionContext = {
  urlAssociationId?: string | null;
  selectedAssociationId?: string | null;
};

export type ActiveAssociationResolution = {
  status: "resolved" | "not-configured" | "missing" | "invalid" | "unselected";
  association?: Association;
  requestedAssociationId?: string;
  message?: string;
};

/** Pure selection logic. Browser/form adapters provide the context values. */
export function resolveAssociationSelection(
  site: Site,
  enabledAssociations: Association[],
  context: AssociationSelectionContext = {},
): ActiveAssociationResolution {
  const selection = site.associationSelection;
  if (!selection) return { status: "not-configured" };

  const findEnabled = (id: string | null | undefined) =>
    id
      ? enabledAssociations.find(
          (association) =>
            association.id === id && association.clientId === site.clientId,
        )
      : undefined;

  if (selection.mode === "fixed") {
    const association = findEnabled(selection.fixedAssociationId);
    return association
      ? { status: "resolved", association }
      : {
          status: "invalid",
          requestedAssociationId: selection.fixedAssociationId,
          message: "The Site's fixed Association is not enabled for this Site.",
        };
  }

  const requestedAssociationId =
    selection.mode === "url-parameter"
      ? context.urlAssociationId
      : context.selectedAssociationId;

  if (!requestedAssociationId) {
    return {
      status: selection.mode === "url-parameter" ? "missing" : "unselected",
      message:
        selection.mode === "url-parameter"
          ? "This application link is missing the required association parameter."
          : undefined,
    };
  }

  const association = findEnabled(requestedAssociationId);
  return association
    ? { status: "resolved", association, requestedAssociationId }
    : {
        status: "invalid",
        requestedAssociationId,
        message:
          selection.mode === "url-parameter"
            ? "This application link contains an Association that is not available for this Site."
            : "The selected Association is not available for this Site.",
      };
}

export function resolveSiteAssociations(siteId: SiteId): Association[] {
  return getAssociationsForSite(siteId);
}

export function resolveActiveAssociation(
  siteId: SiteId,
  context: AssociationSelectionContext = {},
): ActiveAssociationResolution {
  const site = getSite(siteId);
  if (!site) throw new Error(`Unknown site id: ${siteId}`);
  return resolveAssociationSelection(site, resolveSiteAssociations(siteId), context);
}
