export const changeStatuses = ["Draft", "Requested", "Review", "Development", "QA", "Approved", "Scheduled", "Released"] as const;
export type ChangeStatus = (typeof changeStatuses)[number];
export const releaseStatuses = ["Planning", "In Progress", "QA", "Scheduled", "Released"] as const;
export type ReleaseStatus = (typeof releaseStatuses)[number];
export const applicationStatuses = ["In Progress", "Pending TPA Review", "Underwriting", "Waiting for Advisor", "Completed"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export const applicationActionOwners = ["Applicant", "Advisor", "TPA Admin", "NYL", "None"] as const;
export type ApplicationActionOwner = (typeof applicationActionOwners)[number];

export type PortalChange = {
  id: string;
  title: string;
  siteId: string;
  clientId: string;
  type: "Configuration" | "Rule" | "Coverage" | "Email" | "Content" | "Branding" | "Page / Field";
  status: ChangeStatus;
  owner: string;
  targetRelease: string;
  updated: string;
  sourceChangeLogId?: string;
};

export type PortalRelease = {
  id: string;
  name: string;
  date: string;
  status: ReleaseStatus;
  siteIds: string[];
  changeIds: string[];
  notes: string;
};

// Prototype operational records reference canonical site/client IDs. They are intentionally
// separate from the application form state and can later be replaced by API records.
export const portalChanges: PortalChange[] = [
  { id: "CHG-1042", title: "WAEPA product and coverage copy updates", siteId: "waepa-standard", clientId: "waepa", type: "Coverage", status: "QA", owner: "QA", targetRelease: "REL-2026-10", updated: "2026-09-22", sourceChangeLogId: "CL-021" },
  { id: "CHG-1041", title: "Standardize advisor email templates", siteId: "demo-default", clientId: "demo", type: "Email", status: "Development", owner: "Marketing", targetRelease: "REL-2026-10", updated: "2026-09-20", sourceChangeLogId: "CL-023" },
  { id: "CHG-1039", title: "TPA verification flow documentation", siteId: "waepa-standard", clientId: "waepa", type: "Rule", status: "Review", owner: "Portal Admin", targetRelease: "REL-2026-11", updated: "2026-09-18" },
  { id: "CHG-1036", title: "Client theme preset alignment", siteId: "asce-default", clientId: "asce", type: "Branding", status: "Approved", owner: "UX / Design", targetRelease: "REL-2026-10", updated: "2026-09-15" },
  { id: "CHG-1032", title: "Application flow accessibility corrections", siteId: "demo-default", clientId: "demo", type: "Page / Field", status: "Scheduled", owner: "Developer", targetRelease: "REL-2026-10", updated: "2026-09-12", sourceChangeLogId: "CL-022" },
];

export const portalReleases: PortalRelease[] = [
  { id: "REL-2026-10", name: "October 2026 Portal Release", date: "2026-10-15", status: "QA", siteIds: ["waepa-standard", "asce-default", "demo-default"], changeIds: ["CHG-1042", "CHG-1041", "CHG-1036", "CHG-1032"], notes: "Current template, email, accessibility, and client presentation changes." },
  { id: "REL-2026-11", name: "November 2026 Portal Release", date: "2026-11-19", status: "Planning", siteIds: ["waepa-standard"], changeIds: ["CHG-1039"], notes: "Planned TPA verification and rule documentation scope." },
];

export const applicationRecords = [
  { id: "APP-78214", siteId: "waepa-standard", clientId: "waepa", product: "Group Term Life", submitted: "2026-09-22", status: "Pending TPA Review" as ApplicationStatus, actionOwner: "TPA Admin" as ApplicationActionOwner, updated: "2026-09-23" },
  { id: "APP-78198", siteId: "asce-default", clientId: "asce", product: "Term Life", submitted: "2026-09-21", status: "Underwriting" as ApplicationStatus, actionOwner: "NYL" as ApplicationActionOwner, updated: "2026-09-23" },
  { id: "APP-78155", siteId: "waepa-gi", clientId: "waepa", product: "Guaranteed Issue Life", submitted: "—", status: "In Progress" as ApplicationStatus, actionOwner: "Applicant" as ApplicationActionOwner, updated: "2026-09-20" },
  { id: "APP-78092", siteId: "ama-default", clientId: "ama", product: "Disability Income", submitted: "2026-09-18", status: "Waiting for Advisor" as ApplicationStatus, actionOwner: "Advisor" as ApplicationActionOwner, updated: "2026-09-19" },
];

export const siteBuilderDrafts = [
  { id: "DRAFT-014", client: "Portal template", proposedSite: "Migration candidate — ASCE", owner: "Account Manager", progress: "Site Information", status: "Discovery" },
  { id: "DRAFT-011", client: "New client (not assigned)", proposedSite: "New multi-step site", owner: "Portal Admin", progress: "Organization", status: "Draft" },
];
