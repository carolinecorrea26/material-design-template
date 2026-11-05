# Step 1 review phases

October 21, 2026. Step 1 sign-off remains **open**. [Crosswalk](step1-requirement-crosswalk.md) · [Exact continuation queue](step1-review-queue.json).

## Active Site: ABE

The user has replaced the area-wide execution order with Site-by-Site review. Finish **all phases for ABE** before starting another Site. [ABE review, approved changes and remaining phases](step1-abe-review.md) · [Exact ABE queue](step1-abe-review.json). The phase table below preserves the global backlog; it is not authorization to work across Sites. Apply explicitly approved prototype changes only. Keep the unmarried-child note without adding a question; retain the DI spouse 30-hour minimum.

## Earlier shared batch: Reviewed for current mock prototype

The three named owner/evidence gaps are reconciled: ISITRUST's required selector uses its stored Site policy and 26 enabled Association options (including approved ATPE); AMA's two DI products suppress the online Domestic partner/Civil Union notice with the spouse section visible; ABE's unique dividend capability uses its accepted reusable Review policy and captured fields. There is no separate invented AMA suppression flag. ABE retains required acknowledgement, optional always-visible identity fields and no election checkbox. Detailed PDF remains separately deferred; St. Louis identity reconciliation stays pending.

All 15 ISITRUST C86 and 42 Standard WAEPA C122 online source spans now link to explicit atomic requirements, full cross-line guards and accepted replacements. Eleven CSEA C69 spans also have exact mappings. Compound C69.8, the missing AVMA college list and remaining PDF/GI source instructions retain their own dispositions. Source spans may map to multiple atoms; this does not make the span a new unique business requirement.

The shared routing/validation batch covers five executable rule owners/six gates, captured page order and participation, applicant health-page overrides, questionnaire supersession, Beneficiary exceptions, next/Back symmetry, progress grouping, post-Review Back suppression and field/page validation. Routing descriptions were corrected to match those existing behaviors. Native snapshots and implementation/test fingerprints reopen these reviews on edits. Previously closed areas must retain their evidence; wording-only routing changes are reverified against their dependent Beneficiary checks.

Evidence: [named owner snapshots](step1-owner-review-evidence.json), [routing snapshots](step1-navigation-review-evidence.json), [rendered owner tests](../../src/migration/namedOwnerReview.test.tsx), [shared navigation tests](../../src/migration/navigationReview.test.ts), [validation/interception tests](../../src/app/RoutePage.navigation.test.tsx), and the crosswalk's implementation/verification links. Phase 1 records 98 exact reviewed row IDs in the queue. Overall area closure has not been inferred from this batch.

The broader verification found and fixed an inactive-Association defect: retained tobacco-lookback overrides were being validated against enabled choices, so disabling ATPE also rejected another Association's mock quote. Stored references now validate against all assigned Associations; selection and eligibility still use enabled Associations. The regression checks cover disabled choices, continued availability for other Associations and rejection of true orphan references.

## Global area backlog (reference only)

| Phase | Area | Pending source spans | Pending source atoms | Pending catalog clauses | Total review rows |
| --- | --- | ---: | ---: | ---: | ---: |
| 2 | Membership | 33 | 0 | 31 | 64 |
| 2 | Eligibility | 821 | 0 | 21 | 842 |
| 2 | Coverage | 862 | 0 | 51 | 913 |
| 3 | Health | 301 | 0 | 5 | 306 |
| 3 | Review and consent | 525 | 0 | 9 | 534 |
| 3 | Profile | 0 | 0 | 0 | 0 |
| 3 | Payment and rates | 1320 | 0 | 7 | 1327 |
| 4 | Navigation and validation | 0 | 0 | 65 | 65 |

**Phase 2: Finish Membership, Eligibility and Coverage.** Reconcile remaining Attestation online/PDF clauses and shared Membership catalog behavior; split Main guards, eligibility/amount/product/rider instructions; link exact accepted owners and resolve supporting sheet applicability.

**Phase 3: Finish Health, Review, financial Profile and Payment/rates.** Reconcile questionnaire/underwriting sources, shared consent and legal/decision wording, payment collection and rating inputs against existing adopted owners. ABE’s approved $7,000 member DI financial trigger uses the existing Profile section, independent of Health completion. Preserve external QD loading, accepted ABE Review and all approved nonblocking deferrals.

**Phase 4: Finish shared UI and final sign-off reconciliation.** Verify remaining shared field, repeated-record, drawer, landing/header, advisor and template behavior. Finish unassigned/shared source and identity applicability, source absences and retained decision reconciliation; rerun the crosswalk gates and close only fully evidenced areas.

Pending review rows overlap reviewed/manual atoms. Counts are review work items, not unique business requirements; source-ledger applicability and source absences remain separate. The 516 missing Main coordinates are not inferred N/A. Accepted/provisional decisions, unscoped supporting sources and explicit deferrals remain in the main crosswalk. No new business question was needed for Phase 1; subsequent ambiguity must be identified at the exact source/owner scope before requesting a decision.

Regenerate with `npm run rules:crosswalk`; verify all generated files with `npm run rules:crosswalk:check`. The machine queue contains exact row IDs and source/rule links for resuming the remaining work.
