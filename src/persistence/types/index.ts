import type { CanonicalSchema } from "./canonical";
import type { StructuralSchema } from './structure';
export * from './structure';
import type * as O from "./organization";
import type * as P from "./operations";
export * from "./common";
export * from "./organization";
export * from "./operations";
export * from "./applicants";
import type { LibrarySchema } from "./library";
import type { SiteConfigurationSchema } from "./siteConfiguration";
export * from "./library";
export * from "./siteConfiguration";

export * from "./migrationSchedule";

export interface DatabaseSchema extends LibrarySchema, SiteConfigurationSchema, CanonicalSchema, StructuralSchema {
  migrationSchedules: import("./migrationSchedule").MigrationSchedule[];
  organizations: O.Organization[]; clients: O.Client[]; sites: O.Site[];
  siteCoverages: O.SiteCoverage[]; siteProducts: O.SiteProduct[]; siteRiders: O.SiteRider[]; siteConfigurations: O.SiteConfiguration[];
  applications: P.Application[]; applicationParticipants: P.ApplicationParticipant[]; applicationEvents: P.ApplicationEvent[];
  applicants: import('./applicants').Applicant[];
  applicationApplicants: import('./applicants').ApplicationApplicant[];
  applicationAssociations: import('./applicants').ApplicationAssociation[];
  changeRequests: P.ChangeRequest[]; changeItems: P.ChangeItem[]; releases: P.Release[]; releaseChanges: P.ReleaseChange[];
  siteBuilderDrafts: P.SiteBuilderDraft[]; users: P.PortalUser[]; roles: P.Role[]; userRoles: P.UserRole[]; userScopes: P.UserScope[];
  auditEvents: P.AuditEvent[]; analyticsMetrics: P.AnalyticsMetric[]; analyticsMeasurements: P.AnalyticsMeasurement[];
}

export type TableName = keyof DatabaseSchema;
export type RowFor<T extends TableName> = DatabaseSchema[T][number];
export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt" | "deletedAt"> & Partial<Pick<T, Extract<keyof T, "id" | "createdAt" | "updatedAt" | "deletedAt">>>;
