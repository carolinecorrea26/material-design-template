import type { FlowDefinition } from "../../content/docs/flows/types";

/** WAEPA policy shared by the standard and guaranteed-issue sites. */
export const waepaTpaVerificationFlow: FlowDefinition = {
  id: "tpaVerification",
  title: "TPA Member Verification Flow",
  intro: "WAEPA performs membership attestation and a TPA lookup by First Name, Last Name and DOB. Neither branch runs LexisNexis or shows a coverage portfolio. New members auto-approve at submission; existing members go to the TPA admin for manual review, regardless of coverage status.",
  nodes: [
    { id: "waepa-attestation", kind: "page", pageId: "membership", label: "Membership attestation" },
    { id: "waepa-lookup", kind: "external", label: "TPA API lookup", description: "First Name, Last Name and DOB. Return existing-member and coverage status." },
    { id: "waepa-membership-decision", kind: "decision", label: "Existing member?", description: "Use the lookup result; coverage status does not change the outcome." },
    { id: "waepa-new-member", kind: "action", label: "New Member", description: "No LexisNexis verification and no coverage portfolio." },
    { id: "waepa-new-member-outcome", kind: "end", label: "Auto-approve — No Portfolio", description: "Continue the application; mark submission for TPA auto-approval." },
    { id: "waepa-current-member", kind: "end", label: "Manual Review — No Portfolio", description: "No LexisNexis verification. Continue the application; send submission to the TPA admin for manual review." },
  ],
  edges: [
    { id: "waepa-attestation-lookup", source: "waepa-attestation", target: "waepa-lookup" },
    { id: "waepa-lookup-result", source: "waepa-lookup", target: "waepa-membership-decision" },
    { id: "waepa-tpa-e1", source: "waepa-membership-decision", target: "waepa-new-member", condition: "New member" },
    { id: "waepa-tpa-e2", source: "waepa-new-member", target: "waepa-new-member-outcome" },
    { id: "waepa-tpa-e3", source: "waepa-membership-decision", target: "waepa-current-member", condition: "Existing member" },
  ],
};
