# ABE — finish all phases before the next Site

October 22, 2026. **Site status: Complete for current mock prototype.** [Global crosswalk](step1-requirement-crosswalk.md) · [Exact ABE queue and owner links](step1-abe-review.json).

**October 22 final review: Review and approved implementation complete; no unanswered questions.** Read the [seven answered decisions](abe-review-questions.md) and [complete item-by-item assessment](abe-final-review.json). The raw crosswalk queues below are retained for traceability; their remaining items now have reviewed dispositions in that assessment. They are not questions for the user. The user approved the corrections on October 22; implementation and evidence are recorded in the assessment.

Apply explicitly approved changes only. Present any additional prototype change to the user first. Child unmarried requirement is a note, not an answer; keep DI spouse minimum hours.

## Approved implementation

- 10-year Life: ages 17–69; 20-year Life: 17–59, for member and spouse.
- Life children: 14 days through 26; AD&D children: birth through 26.
- Hospital Money children: through 25, with honorable-discharge evidence for ages 26–29; age 30 is outside the extension. Each listed child's answer is evaluated separately.
- Keep the DI spouse 30-hour minimum. Keep “Only unmarried children are eligible for coverage.” as a note without an unmarried question.

The explicit decision and exact stored owners are recorded in [ABE eligibility adoption](../../src/migration/abeEligibilityAdoption.ts). [Eligibility and rendered-note checks](../../src/migration/abeEligibilityAdoption.test.ts) cover both eligibility paths, boundaries, missing facts, per-child answers, editable configuration and the absence of a new unmarried question.

## Review completed in this batch

132 exact source spans have ABE-specific owner/evidence links. The [Coverage checks](../../src/migration/abeCoverageReview.test.ts) cover numeric choices, per-person Life totals including existing coverage, dependent prerequisites/caps, one-Life-plan limits, DI ceilings and waiting periods, the nine-times spouse cap, LTD/LTD Plus exclusion and Overhead expense limits. The full source cell is preserved beside every span so cross-line guards remain visible.

D17's .6666 precision and differing individual/aggregate thresholds remain explicitly provisional. The review checks the retained decision; it does not declare conflicting formulas identical. Ten-/20-year child coverage requires member coverage and one Life plan; an extra child/member amount cap is not inferred.

## Source follow-through and approved shared answers

215 additional source spans now have explicit dispositions and owner links. Optional IDs, member/spouse SSNs, standardized email placement, online/PDF dividend splitting, state exclusions, unavailable applicants, medical participation and the R28 restrictions are reconciled. Named unassigned riders and the restricted country scope keep their **accepted provisional** status; they are not claimed as implemented source parity. The PDF-only ABA membership statement keeps its existing detailed-output deferral.

The user approved the exact twelve tobacco-product answers and clarified that they belong in the **shared member/spouse definitions**, rather than an ABE override. Other is removed from available choices; saved answers are retained, and an old Other selection must be replaced with a current answer to pass validation. Question wording, conditional visibility, processing and lookbacks retain their separate owners. [Shared decision and source guard](../../src/migration/sharedTobaccoOptionsDecision.ts) · [All-Site option and validation checks](../../src/migration/sharedTobaccoOptionsDecision.test.ts).

Six QD source rows have exact product identity joins. Their full cells and individual clauses are now enumerated in the JSON supporting-source queue. The remaining supporting clauses now have explicit dispositions in the final assessment; their raw crosswalk records are retained for traceability. The user has now approved v78 QD age/amount/state processing limits, with FUW outside QD, and the CI note appended inside the existing Read and Sign section. The bounded processing clauses have owner/test links; other supporting clauses retain their reviewed existing-decision/deferred dispositions. Real insurer services remain deferred. [Processing adoption and exact source](../../src/migration/abeProcessingAdoption.ts) · [Boundary and flow checks](../../src/migration/abeProcessingAdoption.test.ts).

## Implementation/sign-off tracking, all for ABE

| Phase | Work | Status |
| --- | --- | --- |
| 1 | Source inventory and applicability: All source items have explicit ABE dispositions and source links. | Complete for current mock prototype |
| 2 | Membership, Eligibility and Coverage: Optional Membership ID, approved eligibility and coverage limits verified; unmarried child note only and spouse minimum hours retained. | Complete for current mock prototype |
| 3 | Health, Review, financial Profile and Payment/rates: All seven answers applied and verified; explicit production/rate/PDF and provisional-source deferrals retained. | Complete for current mock prototype |
| 4 | Shared behavior and final Site reconciliation: Rendered legal sections, Profile placement, health routes, applicant isolation, navigation and validation verified. | Complete for current mock prototype |

| Area | Remaining review rows |
| --- | ---: |
| Review and consent | 194 |
| Payment and rates | 230 |
| Health | 6 |
| Navigation and validation | 65 |
| Eligibility | 21 |
| Coverage | 44 |

Source spans overlap reviewed atoms; queue counts are review rows, not unique business requirements. This ABE-only evidence overlays the global crosswalk without signing off shared requirements for another Site. The 138 blank Main coordinates and shared candidates are separately dispositioned in the completed assessment; no blank cell is treated as an implicit rule.

## Supporting-source handoff

- **QD LI rows 6–8:** Exact ABE product/G-number identity joins are reviewed and source clauses are separately queued; User approved the v78 QD processing limits and FUW outside them. Main and explicitly approved entry ages remain separate. Other supporting collection, rider, rate-class and service clauses remain individually queued.
- **QD DI rows 2–4; Disability rows 21–24:** Separate QD processing from applicant eligibility. D17 working calculations retain the existing explicit provisional precision/threshold decision.
- **Smoker Question row 20:** ABE filing-code question; Main AC is tobacco-question applicability, not payment collection.
- **Riders rows 7, 8, 25, 26, 32; Main L/AT39–49:** R28 source ages, applicants and exclusions are verified. Other named riders retain the existing explicit provisional non-activation decision; shared definitions do not enable them.
- **Legal Disclosures A10:D10; Read & Sign B111/C111 and B125:C139:** Accepted dividend exception already has independent owner/evidence checks. It does not approve unrelated consent wording.

No other Site has started. ABE's completion retains the explicitly accepted production and source-gap deferrals. Global prior reviews remain independent. Regenerate through `npm run rules:crosswalk`; `npm run rules:crosswalk:check` detects generated-file drift. Captured source, code/test and ABE owner fingerprints reopen this batch when they change.
