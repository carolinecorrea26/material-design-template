# ASCE applicant runtime parity

This pass connects the existing MCR-derived coverage declarations to the applicant prototype. It does not redesign Portal Library, Admin Center, Jira, or Site Builder. Existing unrelated working-tree changes were retained.

## Audit and implementation

The audited path is authored configuration (`config/clients/asce.ts`) → effective Site/product resolution (`getClientCoverages`) → normalized requirements → application facts → Coverage/quote controls → validation → flow gates → Review/Receipt. The independently resolved migration fixtures preserve the same declarations and additional field placements.

Previously, Coverage read only the member work threshold and relationship checks, amounts used static ranges, and routing/Review/Receipt used scalar product underwriting. Profile held employment facts needed earlier. Eligibility already held a repeatable child list; it lacked unmarried/student facts, and its list was not restored by the scalar form-default builder.

Now enforced:

- Member DI ages 17–69 and 30 hours/week; spouse ages 17–59. Missing facts prevent selection.
- Every listed child must be unmarried, at least 14 days old, and through completed age 22, or through 24 when a full-time student. Child Life requires member Life and is limited to one Life plan. Zero-amount member selections cannot satisfy that dependency.
- DI amount choices use the lesser of 60% of monthly income and the first applicable configured cap: $1,050 for self-employed under one year; otherwise $4,200 at ages 65–69; otherwise $8,550. Choices retain $150 increments and round down to an available increment. Spouse coverage remains $500.
- Required 90-day/five-year options are locked and persisted. The spouse 30-day/two-year package is also fixed. Restored invalid amounts/options are reconciled; Coverage and Review revalidate against current facts.
- Ten-year and twenty-year Life selections resolve the existing age/amount underwriting bands. QD routing, Review's FUW note, Receipt decisions, and cart labels consume the effective per-applicant outcome. FUW retains the existing manual-review path and does not run QD. No new medical questionnaire requirements were inferred.
- Quote eligibility and amounts consume the same runtime resolver. Employment facts use canonical fields and persist into the application.

Existing functions connected: `evaluateEligibility`, `resolveBenefitLimit`, `coverageRelationshipErrors`, `resolveUnderwritingBand`, and `getCoverageAmountChoices`.

## Normalized additions and fact timing

- `applicationApplicantFacts` / `applicationApplicantFactSet`: shared parsing of dates, currency, numeric and boolean facts; child eligibility evaluates all existing `children` records.
- `resolveApplicationCoverage`, `applicationUnderwriting`, and `validateApplicationCoverages`: shared executable outcomes, constrained amounts/options, and final validation. Outcomes distinguish no rule, resolved, missing information, and unresolved requirements. Missing or unmatched underwriting never falls back to the scalar QD type when a band table is configured.
- Resolved option constraints reuse the existing conditional benefit-cap declarations; no second rule table was introduced.
- Requirement-derived field placements make `is-self-employed` and `years-self-employed` available on Coverage and in the quote. They keep the existing Profile field IDs and values. The field model gains `allowDecimal` so 0.5 years is not silently transformed into five years.
- New canonical `child-unmarried` and `child-full-time-student` fields are placed in Eligibility's existing child dialog. Birth dates are reused from that list. Older saved lists missing these facts require an Eligibility edit.
- Generic section `collectionName` metadata restores the child list when revisiting/resuming Eligibility.
- Conditional field-option exclusions reference existing normalized conditions. This replaces the pre-existing AMA spouse-dependent filtering branch while retaining its behavior.
- Existing generic 40-hour DI/OO defaults moved from component fallback logic into default product eligibility declarations. Site overrides continue to replace requirements.

## Unresolved requirements and executable limits

The prior corrective-pass open issues remain open: disputed base Life eligibility ages, older-age/unspecified underwriting, twenty-year plan-code conflict (retain 121), authoritative rates, GI/NCGI product and flow differences, campaign/no-save URLs, and unconfirmed association-specific downstream behavior. No rates, eligibility boundaries, or workflows were invented.

Underwriting gaps—including child selections on banded products without a documented child band—return unresolved and cannot proceed. The ten-year 65–69 and twenty-year 55–59 unspecified bands remain blocked. Base eligibility conflicts remain visible unresolved metadata; a matching underwriting band does not establish base eligibility. Generic prototype premium estimates remain estimates, not confirmed actuarial pricing.

No remaining *confirmed rule in the audited normalized coverage requirements* is display-only. The unresolved items above are not executable because the source does not specify a confirmed outcome.

**Are all currently confirmed ASCE requirements represented and enforced?** Yes for the audited, currently confirmed MCR-derived applicant coverage requirements in this repository. This is not a declaration that the unresolved ASCE migration is complete or that the original external MCR has been independently re-certified.

**Can another Site use these business-rule types through configuration alone?** Yes: applicant eligibility, ordered income caps, conditional required options, applicant/product dependencies, maximum plan counts, and age/amount underwriting bands use shared declarations and resolvers, with no client identity checks.

## Identity-branch audit

No ASCE identity branching was found in the audited coverage runtime. An existing `clientId !== "abe"` branch was found in Eligibility's mock member-verification helper. It was removed: the same sample match is now configuration data (`features.memberVerificationMatchFacts`), evaluated by a generic fact matcher. A second existing `client.id === "ama"` branch filtered spouse-dependent choices; it was replaced with a conditional option-exclusion declaration in AMA configuration. Existing Site-keyed aggregate *display-note configuration* remains; it does not decide eligibility, amounts, options, or underwriting.

No new client/Site/association identity branching was introduced. An inventory test rejects known client identifiers in the affected generic coverage, eligibility, verification, facts, quote, Review, and routing modules.

## Files changed in this pass

- `src/domain/coverageRuntime.ts` (new), `coverage.ts`, `fields.ts`, `configuration.ts`
- `src/utils/applicantFacts.ts` (new), `coverageDecisions.ts`
- `src/config/fields/coverageFactFields.ts` (new), `index.ts`, `resolvedFieldRegistry.ts`
- `src/config/coverages/index.ts`, `src/config/clients/abe.ts`, `src/config/clients/ama.ts`, `src/config/flowGates.ts`, `src/config/conditions/resolveVisibility.ts`
- `src/config/pageSections/types.ts`, `pageSections.ts`
- `src/app/useCoverageState.ts`, `RoutePage.tsx`, `coverageRuntime.integration.test.ts` (new)
- `src/pages/Coverage.tsx`, `Eligibility.tsx`, `Review.tsx`, `HealthLi.tsx`, `HealthDi.tsx`
- `src/components/forms/ProductCatalog.tsx`, `QuoteCalculator.tsx`, `EstimatorProductCard.tsx`, `FieldRenderer.tsx`
- `src/components/ui/CoverageCart.tsx`, `MemberVerification.tsx`
- `src/migration/fixtures.tsx`
- `docs/asce-runtime-parity.md` (new)

## Tests and verification

The new application integration suite covers DI hours and member/spouse age boundaries; child age/student/unmarried/dependency/plan-count rules; all income caps and increments; spouse package; mandatory options; representative ten-/twenty-year QD/FUW routing; unresolved and missing underwriting; contextual fields; the mounted Coverage hook; resumed amount/option repair; Profile revalidation; multiple child records; restored collections; generic verification matching; and the identity-branch inventory.

Final verification:

- `npm test -- --maxWorkers=2`: **511 passed**, 38 passing files; the standalone PostgreSQL test is intentionally skipped in this command and passed separately. The new integration/architecture suite contains **31 passing tests**. A default-worker run encountered a five-second migration timeout under contention; limiting workers resolved it without changing test assertions or timeouts.
- TypeScript: passed through `npm run build` (`tsc -b`).
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run build-storybook`: passed.
- `npm run migration:postgres`: passed against disposable PostgreSQL 17.11. All four migrations applied; two seed applications were identical; database readback matched; seven invalid writes were rejected; all 40 library tables had RLS. Export/fixture integrity and migration equivalence tests also passed.
- `git diff --check`: passed.

Non-blocking build warnings: large bundles and Vite plugin timing. Database evidence is in `/tmp/portal-migration-review/postgres-validation.json`; run logs are `/tmp/asce-{tests,lint,build,storybook,postgres}.log`.

