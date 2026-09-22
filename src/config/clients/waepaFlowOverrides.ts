import type { FlowDefinition } from "../../content/docs/flows/types";

/** WAEPA-specific replacement for the global TPA Member Verification flow. */
export const waepaTpaVerificationFlow: FlowDefinition = {
  id: "tpaVerification",
  title: "TPA Member Verification Flow",
  intro:
    "Effective WAEPA TPA integration. New members are treated as TPA verified for downstream auto-approval without an existing-coverage portfolio. Current members must pass LexisNexis verification to become TPA verified and see their Coverage Portfolio.",
  nodes: [
    {
      id: "waepa-membership-decision",
      kind: "decision",
      label: "WAEPA Membership",
      description: "Applicant identifies as a new member or current member.",
    },
    {
      id: "waepa-new-member",
      kind: "action",
      label: "New Member",
      description:
        "No LexisNexis verification is required. Set tpa-verified=true for downstream TPA processing.",
    },
    {
      id: "waepa-new-member-outcome",
      kind: "end",
      label: "Regular Application — No Portfolio",
      description:
        "Continue the regular consumer application flow. Coverage Portfolio remains hidden because there is no existing member portfolio. Submission is marked for auto-approval in the TPA Admin Portal.",
    },
    {
      id: "waepa-current-member",
      kind: "action",
      label: "Current Member",
      description: "Applicant proceeds through the configured LexisNexis identity-verification flow.",
    },
    {
      id: "waepa-verification-decision",
      kind: "decision",
      label: "LexisNexis verification successful?",
      description: "Determines whether the current member is treated as TPA verified.",
    },
    {
      id: "waepa-current-success",
      kind: "end",
      label: "Regular Application — Portfolio Enabled",
      description:
        "Set tpa-verified=true. Continue the regular consumer application flow, show the existing Coverage Portfolio on Coverage, and mark submission for auto-approval in the TPA Admin Portal.",
    },
    {
      id: "waepa-current-failure",
      kind: "end",
      label: "Regular Application — No Portfolio",
      description:
        "tpa-verified is not set to true. Continue the regular consumer application flow without the Coverage Portfolio and without TPA verification-based auto-approval.",
    },
  ],
  edges: [
    { id: "waepa-tpa-e1", source: "waepa-membership-decision", target: "waepa-new-member", condition: "New member" },
    { id: "waepa-tpa-e2", source: "waepa-new-member", target: "waepa-new-member-outcome" },
    { id: "waepa-tpa-e3", source: "waepa-membership-decision", target: "waepa-current-member", condition: "Current member" },
    { id: "waepa-tpa-e4", source: "waepa-current-member", target: "waepa-verification-decision" },
    { id: "waepa-tpa-e5", source: "waepa-verification-decision", target: "waepa-current-success", condition: "Yes" },
    { id: "waepa-tpa-e6", source: "waepa-verification-decision", target: "waepa-current-failure", condition: "No / skipped" },
  ],
};
