# Prototype cutover acceptance

October 5, 2026. The reviewed Library is now the configuration source for the local mock applicant prototypes. This accepts the configuration and mock-service cutover. It does not certify production readiness or exact source parity. Real PRASE remains excluded and production publication remains gated.

## Runtime cutover

`npm run dev` (equivalently `npm run mock:dev`) seeds the reviewed normalized Library and starts the applicant application at http://127.0.0.1:5180. Before importing the application, it fetches the selected Site's persisted snapshot from `/api/mock/prototype/library`. A saved Library draft supersedes the seed for that Site only. A missing or invalid snapshot stops bootstrap with an error rather than silently using a catalog.

Quote, Eligibility, Coverage, Review, Payment and the shared applicant page renderers resolve products, field placements/overrides, conditions, page requirements, content and routing configuration from this installed snapshot. Normalized eligibility, residency, benefit, dependent and exclusion policies participate in Coverage decisions. Category restrictions continue across routes; a sole category is selected automatically. Review uses the persisted notice policy and Fields, including state-specific fraud wording and ABE's required dividend acknowledgement with always-visible optional identity fields.

Quote and Coverage call the existing mock PRASE adapter with the Library's rate class selection, required dimensions, periods, riders and billing choices. Payment displays the same synthetic rate contract with modal factors, fees/credits and rounding. Missing inputs, disabled pricing, errors and stale results display an unavailable estimate. CSEA pricing remains suppressed. The application and totals explicitly identify synthetic mock estimates.

The reviewed seed lives in `migration-artifacts/mock/prototype-data.json`; saved drafts live in `.mock-platform/server-state.json`. `npm run dev:catalog` retains an explicit compatibility preview. The production build/publication path is not activated by saving a mock draft.

## Verification evidence

| Check | Result |
| --- | --- |
| Persisted applicant resolvers for every reviewed Site | Ten Sites pass product, page Field, Review and rate-capability checks |
| Persisted coverage journey matrix | All 1,838 applicant/class/association/period/application-mode mappings pass, including incomplete-input rejection |
| Product mock pricing contracts | All 68 product contracts exercised, including configured suppression |
| Focused applicant/runtime acceptance | 65 tests pass across Library resolution, Coverage integration, Home quote participation, categories, Review/rates and household policies |
| Mock platform and persistence acceptance | Seven tests pass, including authenticated save, Site isolation and server restart |
| Repository checks | Lint, production build and whitespace checks pass; existing large-bundle warning remains |

The persistence test starts an isolated mock server, reads ABE's persisted snapshot, saves a birth-date Field label through the Library API, and resolves the changed label through the actual applicant adapter. The changed revision and label survive server restart. AMA's revision stays unchanged, the original catalog-derived database remains unchanged, and the production release head remains empty. The runtime acceptance test also edits a rate capability and verifies the applicant rate presentation, and edits work-hour eligibility to change a live Coverage decision.

Browser spot checks verified ABE Home and Review, ASCE's restricted DI Coverage journey with an actual mock premium, CSEA's price-free Home, and Demo Home/Coverage. ABE Review visibly contains the fraud notice, required acknowledgements and optional identity fields. ASCE's income-dependent amount range and selected periods produce a synthetic mock estimate. These browser checks supplement the all-Site contract tests; they are not a claim that every client completed a signed browser submission.

Evidence files: [ASCE mock estimate](prototype-cutover-asce-mock-rate.jpg), [Library runtime tests](../../src/domain/prototypeLibrary.test.ts), [persisted edit/restart test](../../scripts/prototype-cutover.test.mjs), [all stored mapping test](../../src/migration/coverageJourneyExceptionMatrix.test.ts), and [prior reviewed contract acceptance](step3-prototype-acceptance.md).

## Reproducing a Library-driven change

1. Start `npm run dev`, open Site Builder and select an existing Site.
2. Open its Library draft, change a Field label/participation or a rate setting, and save the draft.
3. Reload the matching applicant Site. Its captured configuration reflects the saved edit. Other Sites keep their own configuration; no source-controlled catalog edit or production release is needed.

Saving is explicit. An already-open application retains its captured snapshot until reload; this cutover does not introduce live publication into an in-progress application.

## Remaining provisional behavior

- Mock rate amounts remain synthetic. Authoritative rate tables and exact class/lookback/volume exceptions require separate source reconciliation.
- Exact medical forms, rider/document exceptions and insurer signatures/destinations remain the separately agreed follow-up. Existing default question participation is retained where source forms remain unresolved.
- Advanced rider-only/increase modes and service-verified in-force primary coverage are exercised by the domain contracts but are not fully exposed as browser journeys by the existing applicant UI. Separately grouped children and per-child aggregate Review collection also remain provisional.
- Supplemental benefit operands now have persisted collection Fields. Existing coverage assumptions must still be reconciled with authoritative source requirements and service-verified policy history.
- Identity, payments, email and submission integrations retain their existing mock scaffolding; no insurer submission or real transaction is accepted by this record.
- Library inspection/compatibility documentation retains source-authored reference views. The Site Builder's saved normalized draft is the editable runtime source for this mock cutover.

The historical Step 3 acceptance describes the earlier candidate-only boundary. This record supersedes that boundary for the local persisted mock prototypes while preserving its source-reconciliation and production-publication limits.
