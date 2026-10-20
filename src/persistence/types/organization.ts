import type { LibraryMetadata } from "../../domain/provenance";
import type { Tpa, Client as DomainClient } from "../../domain/organizations";
import type { Site as DomainSite } from "../../domain/sites";
import type { Timestamped, SoftDeletable, RecordStatus, Json } from "./common";
export interface Organization extends Partial<LibraryMetadata>, Timestamped, Pick<Tpa, "name"> {
  id: string; key: string; type: string; status: RecordStatus;
}
export interface Client extends Partial<LibraryMetadata>, Timestamped, Pick<DomainClient, "name" | "acronym"> {
  id: string; organizationId: string; key: string; status: RecordStatus;
}
export interface Site extends Partial<LibraryMetadata>, Timestamped, SoftDeletable, Pick<DomainSite, "name" | "templateType"> {
  id: string; clientId: string; key: string; displayName: string;
  /** Absent only on saved records created before the canonical identity upgrade. */
  hostingAssociationId?: string;
  status: RecordStatus; environment: string; legacyClientId: string;
}
export interface SiteCoverage extends Partial<LibraryMetadata>, Timestamped { key?: string; id: string; siteId: string; coverageKey: string; enabled: boolean }
export interface SiteProduct extends Partial<LibraryMetadata>, Timestamped { key?: string; id: string; siteId: string; productKey: string; enabled: boolean }
export interface SiteRider extends Partial<LibraryMetadata>, Timestamped { key?: string; id: string; siteId: string; riderKey: string; enabled: boolean }
export interface SiteConfiguration extends Timestamped, SoftDeletable {
  id: string; siteId: string; configurationKey: string; valueJson: Json; source: string; effectiveDate: string | null;
}
