import type { ClientEntityId } from "./organizations";
import type { SiteId } from "./sites";

export type AssociationId = string;
export type SiteAssociationId = string;
export type AssociationSelectionMode = "fixed" | "url-parameter" | "select";
export type Association = {
  id: AssociationId;
  clientId: ClientEntityId;
  name: string;
  acronym?: string;
  logo?: string;
  logoAlt?: string;
};
export type AssociationSelection = {
  mode: AssociationSelectionMode;
  /** Required for fixed mode; never inferred from relationship ordering. */
  fixedAssociationId?: AssociationId;
  /** Defaults to the documented `association` parameter. */
  urlParameter?: "association";
};
export type AssociationBranding = {
  useAssociationLogo: boolean;
};
export type SiteAssociation = {
  id: SiteAssociationId;
  siteId: SiteId;
  associationId: AssociationId;
  enabled: boolean;
};
