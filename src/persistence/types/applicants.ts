import type { RecordStatus, SoftDeletable, Timestamped } from './common';

/** A person within a Client; a sign-in account is not required. */
export interface Applicant extends Timestamped, SoftDeletable {
  id: string;
  clientId: string;
  displayName: string;
  email: string | null;
  status: RecordStatus;
}

/** Site/Client columns enforce the same tenant through composite database references. */
export interface ApplicationApplicant extends Timestamped {
  id: string;
  applicationId: string;
  siteId: string;
  clientId: string;
  applicantId: string;
  applicantTypeKey: string;
}

/** Optional selection; at most one Association per Application. */
export interface ApplicationAssociation extends Timestamped {
  id: string;
  applicationId: string;
  siteId: string;
  siteKey: string;
  associationKey: string | null;
  associationEntityId?: string | null;
}
