import type { Timestamped, SoftDeletable, RecordStatus, Json, ApplicationStatus, ActionOwnerType, ChangeRequestStatus, ReleaseStatus } from "./common";
export interface Application extends Timestamped, SoftDeletable {
  id: string; applicationNumber: string; siteId: string; productKey: string;
  status: ApplicationStatus; currentActionOwnerType: ActionOwnerType; currentActionOwnerId: string | null;
  submittedAt: string | null;
  productCatalogKey?: string | null; legacyActionOwnerId?: string | null;
  recordOrigin?: 'native' | 'legacy-import'; importReference?: string | null;
}
export interface ApplicationParticipant extends Timestamped {
  id: string; applicationId: string; participantType: string; userId: string | null;
  name: string; email: string; relationship: string | null;
  actorId?: string | null; applicationApplicantId?: string | null;
}
export interface ApplicationEvent {
  id: string; applicationId: string; eventType: string; fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null; fromOwnerType: ActionOwnerType | null; toOwnerType: ActionOwnerType | null;
  performedBy: string; notes: string | null; createdAt: string;
  actorId?: string;
  fromOwnerActorId?: string | null; toOwnerActorId?: string | null;
}

export type ChangeType = "create" | "update" | "remove";
export interface ChangeRequest extends Timestamped, SoftDeletable {
  id: string; changeNumber: string; title: string; description: string; status: ChangeRequestStatus;
  requestedBy: string; ownerId: string | null; targetReleaseId: string | null;
  requestedByActorId?: string; ownerActorId?: string | null;
}
export interface ChangeItem extends Timestamped {
  id: string; changeRequestId: string; siteId: string | null; entityType: string; entityId: string | null;
  fieldKey: string; currentValueJson: Json; proposedValueJson: Json; changeType: ChangeType;
  entityReferenceId?: string;
}
export interface Release extends Timestamped, SoftDeletable {
  id: string; releaseKey: string; name: string; releaseDate: string; status: ReleaseStatus; notes: string;
}
export interface ReleaseChange { id: string; releaseId: string; changeRequestId: string; createdAt: string }
export interface SiteBuilderDraft extends Timestamped, SoftDeletable {
  id: string; clientId: string | null; siteKey: string; siteName: string; status: string;
  currentStep: string; draftDataJson: Json; ownerId: string | null;
  ownerActorId?: string | null;
}

export interface PortalUser extends Timestamped { id: string; email: string; displayName: string; status: RecordStatus }
export interface Role extends Timestamped { id: string; key: string; name: string }
export interface UserRole { id: string; userId: string; roleId: string; createdAt: string }
export type UserScopeType = "global" | "organization" | "client" | 'association' | "site" | "advisor";
export interface UserScope { id: string; userId: string; scopeType: UserScopeType; scopeId: string | null; createdAt: string; referenceState?: 'legacy' | 'resolved'; targetReferenceId?: string | null }
export type AuditAction = "create" | "update" | "archive" | "restore" | "status_change";
export interface AuditEvent {
  id: string; entityType: string; entityId: string; action: AuditAction; fieldKey: string | null;
  oldValueJson: Json; newValueJson: Json; performedBy: string; changeRequestId: string | null; createdAt: string;
  actorId?: string;
  entityReferenceId?: string;
}

export type AnalyticsUnit = "count" | "percent" | "percentage_points" | "duration_seconds";
export interface AnalyticsMetric extends Timestamped {
  id: string; metricKey: string; name: string; description: string; unit: AnalyticsUnit; source: string;
}
export interface AnalyticsMeasurement extends Timestamped {
  id: string; metricKey: string; periodStart: string; periodEnd: string; periodType: "month" | "ytd" | "year";
  siteId: string | null; clientId: string | null; device: "desktop" | "mobile" | null; value: number;
  sourceReport: string; sourceSystem: string; definitionVersion: string; notes: string | null;
}
