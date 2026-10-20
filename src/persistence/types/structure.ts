import type { Json, RecordStatus, SoftDeletable, Timestamped } from './common';

/** Canonical Association; legacy clients represent hosting Associations. */
export interface AssociationEntity extends Timestamped, SoftDeletable {
  id: string; key: string; organizationId: string; name: string;
  kind: 'hosting' | 'member'; status: RecordStatus;
}
export interface AssociationAlias {
  id: string; sourceTable: 'clients' | 'associations'; sourceId: string; sourceKey: string;
  associationId: string | null; state: 'resolved' | 'source-only'; originalRecord: Json; createdAt: string;
}
export interface AssociationAffiliation {
  id: string; hostingAssociationId: string; memberAssociationId: string; organizationId: string; createdAt: string;
}
export interface SiteAssociationContext {
  id: string; siteId: string; associationId: string; sourceLinkId: string | null;
  contextMode: 'automatic' | 'membership' | 'url'; enabled: boolean; createdAt: string;
}
export interface PortalActor {
  id: string; key: string; kind: 'human' | 'service' | 'system' | 'unresolved'; displayName: string;
  userId: string | null; authUserId: string | null; applicantId: string | null;
  originalIdentity: Json; archivedAt: string | null; createdAt: string;
}
export interface ApplicationCoverage extends Timestamped {
  id: string; applicationId: string; siteId: string; applicationApplicantId: string | null;
  applicantTypeKey: string; productKey: string; associationEntityId: string | null;
  selectionKey: string; amount: number | null; selections: Json;
}
export interface ApplicationRider {
  id: string; applicationId: string; applicationCoverageId: string; productKey: string;
  productRiderId: string; riderKey: string; amount: number | null; selections: Json; createdAt: string;
}
export interface ApplicationAnswer extends Timestamped {
  id: string; applicationId: string; applicationApplicantId: string | null;
  fieldKey: string; occurrenceKey: string; valueJson: Json;
}
export interface ApplicationSnapshot {
  id: string; applicationId: string; siteId: string; siteKey: string; associationEntityId: string | null;
  configurationReleaseId: string; version: number; configurationSnapshot: Json;
  answersSnapshot: Json; coveragesSnapshot: Json; participantsSnapshot: Json; associationSnapshot: Json;
  payloadHash: string; capturedBy: string; capturedAt: string;
}
export interface SchemaReconciliationIssue {
  id: string; tableName: string; recordId: string; referenceName: string;
  originalValue: Json; reason: string; resolvedAt: string | null; createdAt: string;
}
export interface PortalReferenceType {
  id: string; key: string; tableName: string | null; validationKind: 'table' | 'historical-external';
}
export interface PortalEntityReference {
  id: string; referenceTypeId: string; identity: Json; resolutionState: 'current' | 'historical'; recordSnapshot: Json; createdAt: string;
}
export interface StructuralSchema {
  associationEntities: AssociationEntity[]; associationAliases: AssociationAlias[];
  associationAffiliations: AssociationAffiliation[]; siteAssociationContexts: SiteAssociationContext[];
  portalActors: PortalActor[]; applicationCoverages: ApplicationCoverage[];
  applicationRiders: ApplicationRider[]; applicationAnswers: ApplicationAnswer[];
  applicationSnapshots: ApplicationSnapshot[]; schemaReconciliationIssues: SchemaReconciliationIssue[];
  portalReferenceTypes: PortalReferenceType[]; portalEntityReferences: PortalEntityReference[];
}
