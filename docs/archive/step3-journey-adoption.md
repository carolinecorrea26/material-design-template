# Step 3 coverage journey continuation — October 5, 2026

Current status: [Step 3 prototype acceptance](step3-prototype-acceptance.md) closes the agreed provisional/mock candidate scope. The historical source-fidelity gaps below remain documented for revisit; publication and persisted-Library cutover stay separate.

This continuation changes the isolated reviewed migration candidate and its executable domain contracts. It does not activate Library data in the applicant prototype, publish a release, change Builder behavior, or implement authentication. This historical slice-level record is superseded for prototype completion by the acceptance record linked above.

## Implemented candidate behavior

- All ten active Sites and 68 enabled products have persisted journey contracts, billing choices, question participation, eligibility defaults, and conditional submission mappings. The contracts resolve from the same captured effective Site revision as selection, benefit, residency and underwriting policies.
- CSEA dependent elections include optional spouse accident amounts of $500/$1,000 and the $50 child outpatient benefit with two visits. Elections initialize selected, require the applicable attestation, and clear amounts/attestations when deselected. Dependent signatures are not collected for these source-linked elections. The user explicitly requested continuing with a reference table; the persisted HTML reference describes benefits and says rates are unavailable. It contains no invented premiums and remains a substitute pending the authoritative asset.
- WAEPA, ASCE and AVMA supported life products have explicit rider-only contracts. The candidate requires a policy lookup and uses its verified underlying coverage to evaluate the rider. It skips new beneficiary/payment collection when configured, retains verified existing billing, and requires health participation. Increases mean the resulting total, which must exceed verified current coverage.
- The mock policy service matches policy ID, owner reference, Site, product, applicant and association. Missing, mismatched, inactive, expired or unavailable lookups block submission. A form-supplied verified flag or old amount cannot establish a verified policy. Fixtures are synthetic, use `mock-` IDs, and never query real policyholders.
- WAEPA child schedules evaluate each child's birth date separately, enforce a calendar maximum age and use the higher member/spouse coverage for the provisional primary-coverage cap. A complete spouse-linked child-only scenario is tested. The schedule amounts remain engineering placeholders pending the authoritative attachment.
- ISI's 25 persisted association choices participate in mapping resolution. Display, rating, issue, XML, PDF and portal dummy identifiers have separate roles. Source G-number roles are preserved where available; an unspecified role inherits the primary source identifier provisionally. Association-specific availability equivalence remains provisional.
- Rider reconciliation applies supported amounts, base/combined caps, age/residency eligibility, dependency cleanup, included/locked behavior, and removal of stale orphan values. Added source-linked slices include ASCE/AVMA CIR, AVMA FPO and AMA AD&D/WOP/CAT restrictions.
- Missing eligibility/residency dimensions receive explicit working defaults and revisit records; existing adopted constraints remain authoritative within the candidate. Residency exceptions are persisted, including ASCE spouse-only NH. Age is measured by last birthday on the application date; February 29 anniversaries use March 1 in non-leap years provisionally.
- Question participation uses persisted template field definitions and applicant/mode/underwriting scope. Inactive health/tobacco/dependent answers are removed; required answers, option values, affirmative health details and a synthetic attestation gate submission. Adopted underwriting bands retain their age/amount boundaries. CIR uses life health questions as a provisional stand-in where its dedicated form is missing. No additional medical rejection criteria are inferred.
- Payment methods, frequencies, defaults and configured skip rules are persisted. Modal factors, method fees and annual credits are explicit; unavailable annual premiums remain null and suppress calculated price displays. Submission resolution requires one most-specific matching rule and rejects missing dimensions or ambiguous matches. Its output is a mock coverage envelope, not an insurer-approved XML/PDF schema.

## Additional working values to revisit

`coverageJourneyAdoption.ts` records each business-product decision and the exact destination with `revisit: true`. Literal source extraction is unchanged. These choices use the existing provisional-value authorization:

- Missing adult ages use 18–64 and child ages 0–25; preserved product-specific limits take precedence. Membership is an applicant declaration pending a real verification contract.
- WAEPA child caps may attach to member or spouse coverage; both primary amount facts must be supplied. This explicitly supersedes the earlier member-only working attachment for scheduled child amounts.
- WAEPA payment allows bank/card with monthly frequency; ISI bank/bill-me monthly; AVMA bank/bill-me with monthly, quarterly or semiannual frequency. Source conflicts and missing method rules remain documented working values.
- AMA modal factors use `.083`, `.265`, `.52`, `1`; other missing modal factors use `1/12`, `.25`, `.5`, `1`. Missing fees/credits are zero. Billing rounds the final modal amount to cents; these factors cannot provide a missing base premium.
- Default mainland US/DC availability fills missing residency policies. Source exclusion names/codes are normalized, including obvious transcription repairs, with provenance and revisit markers. Unsupported territories/countries are excluded provisionally.
- Missing dedicated question sets reuse existing templates and an explicitly synthetic mock attestation. Missing underwriting pathways use the persisted presentation type or a documented template default. Missing conditional identifier roles inherit the primary identifier; synthetic placeholders are visibly prefixed `mock:`.

## Acceptance evidence and limits

The persisted-contract report checks ten Sites, 68 enabled products and 1,838 conditional mappings, including all 25 ISI associations. It explicitly retains `fullProductAcceptance: pending` and `publicationReady: false`.

The reusable executable matrix submits a complete new member journey for every enabled product and rejects missing residency, invalid amounts and missing attestations. It runs both after serialization and against Site snapshots captured from actual PostgreSQL readback. Specific scenario tests additionally cover CSEA dependent cleanup/reference presentation, three-Site rider-only verification and failures, resulting-total increases, WAEPA individual child schedules and spouse-linked child-only submission, AVMA FPO caps, ISI identifier roles, ASCE underwriting boundaries/spouse residency, question cleanup and unavailable-rate billing.

Final validation: 492 migration/domain/repository tests passed; two PostgreSQL tests skipped in that ordinary command passed separately against the actual reviewed database. The PostgreSQL run also passed reviewed export, exact readback, all ten Site snapshots and the 68-product executable matrix. [The PostgreSQL result](step3-journey-postgres-validation.json) records idempotent seeding, invalid-write rejection, RLS and concurrent snapshots. TypeScript, scoped lint, production build and whitespace checks passed. The build retains the existing large-bundle warning.

The earlier broader application run passed 892 tests with one failure in `libraryNavigation.test.ts`: its Analytics copy expectation says “placement details”, while the UI says “context details”. That unrelated Step 4 expectation was left unchanged. The final current-code run above covers the migration/domain/repository scope.

This is engineering acceptance for those scenarios. It does not establish publication readiness, source reconciliation, or full applicant/class/service parity. The [contract report](step3-contract-acceptance.json) and PostgreSQL evidence retain their narrower meaning. The disposable local database container was stopped after validation; no hosted database was changed.

## Remaining Step 3 work

- Complete the exception matrix for every applicant/class, period, existing-policy mode and rider combination. The 68-product matrix is predominantly new-member happy paths plus negative checks; it does not certify all spouse/child paths.
- Adopt remaining source rider assignments and exceptions. For example, unresolved ISI rider naming/roles and additional ABE rider slices are not completed by the generic contract defaults.
- Reconcile dedicated health, financial, tobacco and attestation definitions, triggers and signatures. Current template reuse and synthetic attestations need explicit product-by-product acceptance.
- Finish portfolio-wide payment synchronization and mixed-product behavior. A persisted synchronization setting is not proof that every aggregate journey enforces it.
- Verify conditional mappings against accepted destination payload examples for every association, applicant and mode. The mock envelope does not prove real XML/PDF/service acceptance.
- Replace or confirm provisional schedules, eligibility, jurisdiction choices, fees/credits, rate inputs and CSEA's authoritative asset when source evidence arrives. Source gaps may remain provisional under the user's instruction, but implementation/acceptance gaps remain open.

Steps 4–6 remain outside this continuation.
