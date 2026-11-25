// Generated storage contracts; business relationships use stable semantic keys.
import type { Json } from "./common";
import type { LibraryMetadata } from "../../domain/provenance";
import type { PageId } from "../../domain/identities";
export interface UrlParameters extends LibraryMetadata {
  id: string;
  key: string;
  parameter: string;
  behavior: string;
  status: string;
  entryValidation?: { requiredParameter: string; alias: string; errorPage: PageId };
}
export interface SiteUrlParameters extends LibraryMetadata {
  id: string;
  key: string;
  siteKey: string;
  urlParameterKey: string;
  enabled: boolean;
  defaultValue: string | null;
}
export interface ClientEnvironmentLinks extends LibraryMetadata {
  id: string;
  key: string;
  hostingAssociationKey: string;
  environment: string;
  url: string;
}
export interface UrlParameterValues extends LibraryMetadata {
  id: string;
  key: string;
  urlParameterKey: string;
  value: string;
}
export interface UrlDefinitions extends LibraryMetadata {
  id: string;
  key: string;
  url: string;
  protocol: string;
  host: string;
  pathname: string;
  parameters: Json;
}
export interface UrlUsages extends LibraryMetadata {
  id: string;
  key: string;
  urlKey: string;
  hostingAssociationKey: string | null;
  usage: string;
  sourceOwner: string;
  status: string;
}
