export type MilestoneStatus = "complete" | "in-progress" | "planned";

export type ProjectMilestone = {
  id: string;
  name: string;
  /** Verbatim from source — may be a literal "TBD" or a relative description. */
  targetDate: string;
  status: MilestoneStatus;
  notes?: string[];
};

/**
 * Portal Site Template Re-Design Project timeline, transcribed verbatim from
 * the project status document (Sep 3, 2026 snapshot). Dates/statuses are not
 * invented — anything not stated in the source is left as "TBD".
 */
export const portalTemplateTimeline: ProjectMilestone[] = [
  {
    id: "design-prototype",
    name: "Design prototype",
    targetDate: "Jun 30, 2026",
    status: "complete",
    notes: ["Prototype links: Demo, AMA, ABE, WAEPA, AVMA, CSEA, NSO."],
  },
  {
    id: "user-testing",
    name: "User testing",
    targetDate: "Jun 30, 2026",
    status: "complete",
    notes: ["User Tests."],
  },
  {
    id: "requirements-documentation",
    name: "Requirements documentation",
    targetDate: "Jul 31, 2026",
    status: "complete",
    notes: [
      "Extensive documentation; completed initial version; has outstanding items still.",
      "Related resources: Information architecture, Design system.",
    ],
  },
  {
    id: "requirements-review",
    name: "Requirements review (development, QA, analytics teams)",
    targetDate: "Aug 31, 2026",
    status: "in-progress",
    notes: [
      "Weekly meetings with all teams to review requirements for questions, concerns, or missing items.",
    ],
  },
  {
    id: "stakeholder-reviews",
    name: "Client and internal stakeholder reviews",
    targetDate: "Sep 30, 2026",
    status: "in-progress",
    notes: [
      "Clients — WAEPA: first week of Sept (requesting payment after decision). AMA: monthly in Sept. USBA: Oct.",
      "AMs — Big clients (AMA, AVMA, WAEPA). Shane: TBD. All AMs: September (will also review the new email template).",
      "Contracts — Sites needing re-filing: NYSSCPA, NYSBA. WAEPA membership page title/subtitle verbiage.",
      "SMRU — Pages for review: anything with marketing material (e.g. landing, coverage).",
      "SRB — Need to meet with Jose, Chris if SRB review is needed.",
    ],
  },
  {
    id: "implement-base-site-uat",
    name: "Implement base site in UAT",
    targetDate: "Dec 31, 2026",
    status: "in-progress",
    notes: [
      "Implementation requires updates to: testing automation scripts, analytics (initial base site implementation will not include analytics).",
      "Dependency projects: API integrations (credit card, Zeis microsites, TPA member verification).",
    ],
  },
  {
    id: "migrate-client-site-uat",
    name: "Migrate client site in UAT",
    targetDate: "TBD",
    status: "planned",
    notes: [
      "Potential candidate requirements: medium traffic (to catch issues + analytics migration); multi-page only (single-page template out of scope — avoids confusing clients with different autosave/abandoned-leads processes); standard flow with multiple products (no extreme uniqueness, especially around health questions flow).",
      "Possible candidates: ASCE.",
    ],
  },
  {
    id: "verify-client-site-uat",
    name: "Verify client site in UAT",
    targetDate: "TBD",
    status: "planned",
  },
  {
    id: "production-launch",
    name: "Production launch of client site",
    targetDate: "TBD",
    status: "planned",
  },
  {
    id: "migrate-all-clients",
    name: "Migration of all client sites",
    targetDate: "TBD",
    status: "planned",
  },
  {
    id: "post-implementation-analytics-review",
    name: "Post-implementation analytics review",
    targetDate: "3 months post-launch",
    status: "planned",
  },
];

export const portalTemplateDependencies: ProjectMilestone[] = [
  {
    id: "portal-framework-update",
    name: "Portal framework update",
    targetDate: "Nov 30, 2026",
    status: "in-progress",
  },
  {
    id: "analytics-framework-update",
    name: "Analytics framework update",
    targetDate: "Jan 29, 2027",
    status: "in-progress",
    notes: [
      "Main issue with current implementation: CSS selectors.",
      "Further won't move forward without a recommended approach; NYL will try to do refactoring.",
      "NYL reviewing a potential solution (will need to support current + new portal templates): keep the current implementation but translated to the new template (NYL will need to do the majority of the work, with Further's help).",
      "Eventually will need to move to a new solution (needs funding).",
    ],
  },
  {
    id: "instandid",
    name: "InstandID",
    targetDate: "TBD",
    status: "in-progress",
    notes: [
      "Will affect system flow (may affect user flow).",
      "Need to plan for any updated flows in the new template.",
    ],
  },
];

export const migrationCandidateCriteria: string[] = [
  "Medium traffic (to catch any issues + analytics migration).",
  "Multi-page only — single-page template is out of scope; don't want to confuse clients with both templates having different autosave/abandoned-leads processes.",
  "Standard flow with multiple products — no extreme uniqueness, especially around the health questions flow.",
];

export const migrationCandidateSites: string[] = ["ASCE"];

/** Project-level status — set explicitly per project, not derived from milestone counts. */
export type ProjectStatus =
  | "not-started"
  | "in-progress"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "delayed";

/** Where a project sits relative to now — drives the Past/Current/Future tabs on Portal Admin. */
export type ProjectTimeframe = "past" | "current" | "future";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  timeframe: ProjectTimeframe;
  /** Manually configured target completion date — not derived from the milestone timeline. */
  targetDate?: string;
  /** Tasks/milestones tracked for this project, if any exist. Drives the completion ring and "next up" highlight. */
  milestones?: ProjectMilestone[];
};

export const portalProjectSummaries: ProjectSummary[] = [
  // --- Past -----------------------------------------------------------
  {
    id: "portal-site-template-v1",
    name: "Portal Site Template (v1)",
    description: "TBD",
    status: "completed",
    timeframe: "past",
  },
  {
    id: "portal-site-template-v2-project",
    name: "Portal Site Template (v2) Project",
    description: "TBD",
    status: "completed",
    timeframe: "past",
  },
  {
    id: "portal-autosave-resume-mfa-project",
    name: "Portal Autosave / Resume with MFA Project",
    description: "TBD",
    status: "completed",
    timeframe: "past",
  },
  // --- Current ----------------------------------------------------------
  {
    id: "portal-template-project",
    name: "Portal Site Template (v3) Project",
    description:
      "The portal re-design project itself — timeline, template changes, migration schedule, feedback, and future/dependency initiatives.",
    status: "in-progress",
    timeframe: "current",
    targetDate: "Q1 2027",
    milestones: portalTemplateTimeline,
  },
  {
    id: "portal-requirements-project",
    name: "Portal Admin Project",
    description: "Documenting all global and client-specific site information.",
    status: "in-progress",
    timeframe: "current",
    targetDate: "Q2 2027",
  },
  {
    id: "portal-email-template-project",
    name: "Portal Email Template Project",
    description:
      "New email template design and standardization for consumer and advisor flow emails.",
    status: "in-progress",
    timeframe: "current",
  },
  // --- Future -----------------------------------------------------------
  {
    id: "portal-cm-admin-project",
    name: "Portal CM Admin Project",
    description: "TBD",
    status: "not-started",
    timeframe: "future",
  },
  {
    id: "portal-tpa-admin-project",
    name: "Portal TPA Admin Project",
    description: "TBD",
    status: "not-started",
    timeframe: "future",
  },
];

export type ProjectCompletion = {
  completed: number;
  total: number;
  percent: number;
  /** First milestone not yet complete, in source order — null if all complete or none tracked. */
  nextMilestone: ProjectMilestone | null;
};

/** Completion is derived only from tracked milestones — never invented for projects with no data. */
export function getProjectCompletion(
  milestones: ProjectMilestone[] | undefined,
): ProjectCompletion | null {
  if (!milestones || milestones.length === 0) return null;
  const completed = milestones.filter((m) => m.status === "complete").length;
  const total = milestones.length;
  const nextMilestone = milestones.find((m) => m.status !== "complete") ?? null;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    nextMilestone,
  };
}

