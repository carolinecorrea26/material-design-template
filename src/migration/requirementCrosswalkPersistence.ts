import type { CrosswalkRow } from "./requirementCrosswalk";
import { reviewedPersistenceUiMatches, reviewedRecoveryServiceMatches } from "./requirementCrosswalkServiceReview";

/** Bounded review of the current mock prototype. Owner descriptions link to
 * independently enumerated contracts and are not additional atomic controls. */
export function reviewPersistenceRequirements(rows: CrosswalkRow[]) {
  const uiMatches = reviewedPersistenceUiMatches(), serviceMatches = reviewedRecoveryServiceMatches();
  for (const row of rows.filter(row => row.area === "Save and resume" && !row.serviceOwner)) {
    const rule = row.ruleKeys[0];
    const recoveryContext = rule === "rule-persistence-resume-verification";
    const revision = rule === "rule-persistence-revision-revalidation";
    const navigation = ["rule-persistence-values-preserved-during-navigation", "rule-persistence-progress-saved-feedback", "rule-persistence-membership-starts-autosave-mock-communication"].includes(rule);
    if (!recoveryContext && !revision && !navigation) continue;
    const matches = recoveryContext ? serviceMatches : uiMatches;
    row.atomization = "reviewed";
    row.scope.modes = ["multipage mock prototype", "single-page mock prototype"];
    row.scope.unresolved = [];
    row.scope.basis = "Current captured prototype and inspected shared code paths; production delivery and assurance are separate.";
    row.ownerResolution = "code-owned";
    row.codeOwner = recoveryContext ? "createApplicantSaves in scripts/applicant-saves.mjs; client adapter in src/services/applicantSaveService.ts" : revision ? "src/services/applicantSaveService.ts; src/app/RoutePage.tsx; src/pages/Payment.tsx" : "src/app/RoutePage.tsx; src/components/layout/SinglePageSections.tsx; src/components/feedback/AppSnackbar.tsx";
    row.implementationReferences = recoveryContext ? ["scripts/applicant-saves.mjs", "src/services/applicantSaveService.ts"] : revision ? ["scripts/applicant-saves.mjs", "src/services/applicantSaveService.ts", "src/app/RoutePage.tsx", "src/pages/Payment.tsx"] : ["src/app/RoutePage.tsx", "src/components/layout/SinglePageSections.tsx", "src/components/feedback/AppSnackbar.tsx"];
    row.verificationReferences = recoveryContext ? ["scripts/applicant-saves.test.mjs", "src/services/applicantSaveService.test.ts", "src/pages/ResumeFlow.test.tsx"] : revision ? ["scripts/applicant-saves.test.mjs", "src/services/applicantSaveService.test.ts", "src/app/RoutePage.persistence.test.tsx", "src/pages/Payment.revalidation.test.tsx"] : ["src/app/RoutePage.persistence.test.tsx", "src/components/feedback/AppSnackbar.test.tsx"];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = recoveryContext || revision && /\.(3|4)$/.test(row.id) ? "reviewed-owner-rationale" : "reviewed-template-behavior";
    row.finding = matches ? recoveryContext ? "Owner/scope rationale reviewed. The ten linked service atoms carry the actual expiry, limit, revocation and isolation contracts. Simulated delivery and the absence of production configuration remain explicit boundaries." : "Shared submit/Back/unmount persistence, successful/failed saves in both layouts, responsive feedback and changed-revision Coverage/Review revalidation have regression evidence. Fingerprint drift returns this row to verification pending." : "Owning code or evidence changed since review; reverify before closure.";
  }
}
