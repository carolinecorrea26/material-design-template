import type { buildRequirementCrosswalk } from "./requirementCrosswalk";
import { navigationReviewRuleKeys } from "./requirementCrosswalkNavigationReview";
type Report = ReturnType<typeof buildRequirementCrosswalk>;

/** A continuation queue, not an alternative acceptance rule. Pending source
 * spans can overlap reviewed atoms; these counts are never unique requirements. */
export function step1ReviewPhases(report: Report) {
  const named = ["atomic.attestation.isitrust.association-selector", "atomic.ama.di-step-rated.domestic-partner-notice-online", "atomic.ama.di-level-rated.domestic-partner-notice-online", "atomic.unique-dividend-notice"];
  const reviewed = report.requirements.filter(row => named.includes(row.id)
    || row.kind === "source-clause" && /^(?:Attestation Online and PDF!(?:C86|C122)|Legal Disclosures![ABCD]10)$/.test(row.sourceReferences[0])
    || row.kind === "source-clause" && row.sourceReferences[0] === "Attestation Online and PDF!C69" && row.finding.startsWith("Reviewed attestation source leaf:")
    || row.kind === "template-behavior" && row.ruleKeys.some(key => navigationReviewRuleKeys.has(key)));
  const phases = [
    { number: 2, title: "Finish Membership, Eligibility and Coverage", areas: ["Membership", "Eligibility", "Coverage"], work: "Reconcile remaining Attestation online/PDF clauses and shared Membership catalog behavior; split Main guards, eligibility/amount/product/rider instructions; link exact accepted owners and resolve supporting sheet applicability." },
    { number: 3, title: "Finish Health, Review, financial Profile and Payment/rates", areas: ["Health", "Review and consent", "Profile", "Payment and rates"], work: "Reconcile questionnaire/underwriting sources, shared consent and legal/decision wording, payment collection and rating inputs against existing adopted owners. ABE’s approved $7,000 member DI financial trigger uses the existing Profile section, independent of Health completion. Preserve external QD loading, accepted ABE Review and all approved nonblocking deferrals." },
    { number: 4, title: "Finish shared UI and final sign-off reconciliation", areas: ["Navigation and validation"], work: "Verify remaining shared field, repeated-record, drawer, landing/header, advisor and template behavior. Finish unassigned/shared source and identity applicability, source absences and retained decision reconciliation; rerun the crosswalk gates and close only fully evidenced areas." },
  ];
  const pending = report.requirements.filter(row => row.disposition === "review-pending");
  return {
    executionMode: "site-by-site", activeSiteKey: "abe",
    siteQueue: ["abe", ...report.scope.businessSiteKeys.filter(key => key !== "abe")].map(siteKey => ({ siteKey, status: siteKey === "abe" ? "Active — finish all phases" : "Waiting for ABE completion" })),
    reviewedOn: report.reviewedOn, signOff: "Open", enumerationComplete: report.enumerationComplete,
    countMeaning: "Pending review rows overlap reviewed/manual atoms. Counts are review work items, not unique business requirements; source-ledger applicability and source absences remain separate.",
    completedPhase: { number: 1, title: "Named owners, guarded Membership source mappings and shared routing/validation", status: reviewed.length > 0 && reviewed.every(row => row.verificationStatus === "recorded-evidence") ? "Reviewed for current mock prototype" : "Reverification required", requirementIds: reviewed.map(row => row.id) },
    phases: phases.map(phase => ({ ...phase, status: "Open", areaCounts: phase.areas.map(area => {
      const rows = pending.filter(row => row.area === area);
      return { area, sourceClauses: rows.filter(row => row.kind === "source-clause").length, sourceRequirements: rows.filter(row => row.kind === "source-requirement").length, templateBehaviors: rows.filter(row => row.kind === "template-behavior").length, total: rows.length };
    }), queue: pending.filter(row => phase.areas.includes(row.area)).map(row => ({ id: row.id, kind: row.kind, area: row.area, sourceReferences: row.sourceReferences, ruleKeys: row.ruleKeys })) })),
    priorAreaRegressions: ["Profile", "Contact", "Beneficiary", "Save and resume"].filter(area => report.areaClosure[area] !== "Closed for current mock prototype"),
    sourceReconciliation: { ledgerDispositions: report.counts.sourceDisposition, missingMainCoordinates: report.counts.missingMainBehaviorCoordinates, completionGate: report.completionGate },
  };
}

export function renderStep1ReviewPhases(report: Report) {
  const plan = step1ReviewPhases(report);
  return `# Step 1 review phases

October 21, 2026. Step 1 sign-off remains **open**. [Crosswalk](step1-requirement-crosswalk.md) · [Exact continuation queue](step1-review-queue.json).

## Active Site: ABE

The user has replaced the area-wide execution order with Site-by-Site review. Finish **all phases for ABE** before starting another Site. [ABE review, approved changes and remaining phases](step1-abe-review.md) · [Exact ABE queue](step1-abe-review.json). The phase table below preserves the global backlog; it is not authorization to work across Sites. Apply explicitly approved prototype changes only. Keep the unmarried-child note without adding a question; retain the DI spouse 30-hour minimum.

## Earlier shared batch: ${plan.completedPhase.status}

The three named owner/evidence gaps are reconciled: ISITRUST's required selector uses its stored Site policy and 26 enabled Association options (including approved ATPE); AMA's two DI products suppress the online Domestic partner/Civil Union notice with the spouse section visible; ABE's unique dividend capability uses its accepted reusable Review policy and captured fields. There is no separate invented AMA suppression flag. ABE retains required acknowledgement, optional always-visible identity fields and no election checkbox. Detailed PDF remains separately deferred; St. Louis identity reconciliation stays pending.

All 15 ISITRUST C86 and 42 Standard WAEPA C122 online source spans now link to explicit atomic requirements, full cross-line guards and accepted replacements. Eleven CSEA C69 spans also have exact mappings. Compound C69.8, the missing AVMA college list and remaining PDF/GI source instructions retain their own dispositions. Source spans may map to multiple atoms; this does not make the span a new unique business requirement.

The shared routing/validation batch covers five executable rule owners/six gates, captured page order and participation, applicant health-page overrides, questionnaire supersession, Beneficiary exceptions, next/Back symmetry, progress grouping, post-Review Back suppression and field/page validation. Routing descriptions were corrected to match those existing behaviors. Native snapshots and implementation/test fingerprints reopen these reviews on edits. Previously closed areas must retain their evidence; wording-only routing changes are reverified against their dependent Beneficiary checks.

Evidence: [named owner snapshots](step1-owner-review-evidence.json), [routing snapshots](step1-navigation-review-evidence.json), [rendered owner tests](../../src/migration/namedOwnerReview.test.tsx), [shared navigation tests](../../src/migration/navigationReview.test.ts), [validation/interception tests](../../src/app/RoutePage.navigation.test.tsx), and the crosswalk's implementation/verification links. Phase 1 records ${plan.completedPhase.requirementIds.length} exact reviewed row IDs in the queue. Overall area closure has not been inferred from this batch.

The broader verification found and fixed an inactive-Association defect: retained tobacco-lookback overrides were being validated against enabled choices, so disabling ATPE also rejected another Association's mock quote. Stored references now validate against all assigned Associations; selection and eligibility still use enabled Associations. The regression checks cover disabled choices, continued availability for other Associations and rejection of true orphan references.

## Global area backlog (reference only)

| Phase | Area | Pending source spans | Pending source atoms | Pending catalog clauses | Total review rows |
| --- | --- | ---: | ---: | ---: | ---: |
${plan.phases.flatMap(phase => phase.areaCounts.map(area => `| ${phase.number} | ${area.area} | ${area.sourceClauses} | ${area.sourceRequirements} | ${area.templateBehaviors} | ${area.total} |`)).join("\n")}

${plan.phases.map(phase => `**Phase ${phase.number}: ${phase.title}.** ${phase.work}`).join("\n\n")}

${plan.countMeaning} The ${plan.sourceReconciliation.missingMainCoordinates} missing Main coordinates are not inferred N/A. Accepted/provisional decisions, unscoped supporting sources and explicit deferrals remain in the main crosswalk. No new business question was needed for Phase 1; subsequent ambiguity must be identified at the exact source/owner scope before requesting a decision.

Regenerate with \`npm run rules:crosswalk\`; verify all generated files with \`npm run rules:crosswalk:check\`. The machine queue contains exact row IDs and source/rule links for resuming the remaining work.
`;
}
