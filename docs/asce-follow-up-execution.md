# ASCE follow-up execution

Updated November 6, 2026 following the user's prototype review. This register supersedes earlier implementation and recertification backlogs. The MCR, amounts and health-flow business reviews are complete; the six approved age/FUW decisions remain unchanged. Do not reopen those reviews or request additional sources.

The current priority is correct, matching behavior in the prototype, Portal Library and Storybook. The fresh-start JSON migration has resumed page by page: each page's JSON is reviewed, then rolled out to all three surfaces and reviewed again (see the [page review](requirements-spec/page-review.md)). Rates, verification, save/resume and document actions are prototype demonstrations, not production-service work.

## ASCE scope

| ID | Reviewed requirement | Current scope |
|---|---|---|
| ASCE-01 | MCR comparison | Done. No additional page-by-page comparison is required. |
| ASCE-02 | Rates | No additional work. Show mock estimates only; no rate service is required. |
| ASCE-03 | CIR amounts and health flow | Reviewed. CIR remains a normal rider; ASCE has no CIR-only flow. Do not introduce separate new/increase application modes. |
| ASCE-04 | Plan codes | Confirmed, including 121 for 20-Year Term. |
| ASCE-05 | Health-page participation | ASCE shows only QD Life health questions, with no CIR or DI health pages. Keep the prototype, Library and ASCE-derived Storybook examples on the same saved configuration. QD remains a placeholder; approved underwriting classifications are unchanged. |
| ASCE-06 | Documents | Placeholder actions only. PDF generation is not required for this prototype. Remove the download-application action from the Review preview. |
| ASCE-07 | Save/resume | Existing prototype demonstration is sufficient. No additional durability or service work is required. |
| ASCE-08 | TPA integration | ASCE has TPA integration. Lookup uses membership ID, first/last name, birthday and state. If triggered, an alert requests the full residential address before the member verification modal opens. Use prototype records, not a real provider. |
| ASCE-09 | Children | Child Life selections must be mutually exclusive across the Life products. Keep the selected plan removable and disable the other child Life selections. |
| ASCE-10 | Sign-in | Ignore for this review. Do not change sign-in or credentials. |
| ASCE-11 | Refactoring | Fresh-start JSON migration in progress, one reviewed page at a time. Membership is rolled out. Keep the three review surfaces consistent. |
| ASCE-12 | Internal consistency | Continue correcting defects as the user reviews the prototype and Library. No production release checklist is required. |

## Completed before this clarification

- Corrected the live ASCE catalog so CIR cannot be elected on its own. CIR remains an ordinary rider.
- Applied the saved rider eligibility and amount limits to Quote and Coverage controls and restored elections.
- Required a selected product and valid current answers before quote Apply, preserving answer/rider carry-forward.
- Removed stale Membership quote-helper documentation. Home remains the quote entry point.
- Added actual-catalog regression checks to detect differences between migration fixtures and the runtime catalog.

The prior broad test/build results are historical evidence, not a recurring checklist. Storybook has already been reviewed; only make the shared-component or example changes necessary to keep it aligned with an accepted fix.

## Current UI corrections

- Admin exposes only Portal Library and Storybook and opens to Portal Library by default. The Library includes the fresh-start changelog and the same component-reference table used in Storybook.
- Remove applicant-facing developer/demo shortcuts and internal requirements-review commentary. Do not show the unfinished-estimate instruction in place of a price.
- Keep spacing between Benefit amount and Add coverage. Keep height feet/inches on one row.
- Shared theme: helper text line-height 1.2 and bottom margin 14px; field-label weight 500; link weight 700 without underlines; loading buttons disabled.
- Beneficiary reuse: preselect eligible target coverages, include Self/Spouse groups when applicable, support existing beneficiaries and omit the offer when no other eligible coverage remains. Allocation/type limits still apply.
- Review sections 1 and 2 use matching styling. Coverage preview labels are generic within applicant groups, with the estimated rate in the coverage preview. No bottom estimated-cost bar from Review onward; no download-application button in the preview.
- Keep the reviewed Receipt decision/receipt/help structure and removal of previously rejected elements. Receipt document actions remain placeholders, not generated PDFs.

Only explicitly requested changelog entries are recorded in the [fresh-start changelog](../requirements/changelog.json), which is displayed directly in Admin.

## Verification

Use a basic focused regression case for the behavior updated, plus a type/build check when shared wiring changes. Do not repeatedly run the entire ASCE or application suite. Expand checks only when a failure or a shared behavior change warrants it.

## Remaining work

Implement and verify the corrections listed above, then continue addressing the user's findings as they review. No further MCR comparison, rate-service work, production save/resume work, PDF generation or JSON migration is part of this review.
