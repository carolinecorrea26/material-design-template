export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type RecordStatus = "active" | "inactive" | "archived";
export const applicationStatuses = ["In Progress", "Pending TPA Review", "Underwriting", "Waiting for Advisor", "Completed", "Rejected"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export const actionOwnerTypes = ["Applicant", "Advisor", "TPA", "NYL", "None"] as const;
export type ActionOwnerType = (typeof actionOwnerTypes)[number];
export const changeRequestStatuses = ["Draft", "Requested", "Review", "Development", "QA", "Approved", "Scheduled", "Released"] as const;
export type ChangeRequestStatus = (typeof changeRequestStatuses)[number];
export const releaseStatuses = ["Planning", "In Progress", "QA", "Scheduled", "Released"] as const;
export type ReleaseStatus = (typeof releaseStatuses)[number];

export interface Timestamped { createdAt: string; updatedAt: string }
export interface SoftDeletable { deletedAt: string | null }

