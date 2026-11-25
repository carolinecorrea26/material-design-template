import type { LibraryMetadata } from "../../domain/provenance";
import type { Tpa } from "../../domain/organizations";
import type { Site as DomainSite } from "../../domain/sites";
import type { Timestamped, SoftDeletable, RecordStatus, Json } from "./common";
export interface Organization extends Partial<LibraryMetadata>, Timestamped, Pick<Tpa, "name"> {
  id: string; key: string; type: string; status: RecordStatus;
}
export interface Site extends Partial<LibraryMetadata>, Timestamped, SoftDeletable, Pick<DomainSite, "name" | "templateType"> {
  id: string; hostingAssociationId: string; key: string; displayName: string;
  status: RecordStatus; environment: string; legacyClientId: string;
}
export interface SiteCoverage extends Partial<LibraryMetadata>, Timestamped { key?: string; id: string; siteId: string; coverageKey: string; enabled: boolean }
/** Authored Site assignments carry timestamps only when recorded in their source. */
export interface SiteProduct extends Partial<LibraryMetadata>, Partial<Timestamped> { key?: string; id: string; siteId: string; productKey: string; enabled: boolean }
export interface SiteRider extends Partial<LibraryMetadata>, Partial<Timestamped> { key?: string; id: string; siteId: string; riderKey: string; enabled: boolean }
export interface SiteConfiguration extends Timestamped, SoftDeletable {
  id: string; siteId: string; configurationKey: string; valueJson: Json; source: string; effectiveDate: string | null;
}
