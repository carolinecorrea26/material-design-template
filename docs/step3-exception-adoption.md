# Step 3 exception acceptance and runtime data audit — October 5, 2026

Current status: [Step 3 prototype acceptance](step3-prototype-acceptance.md) closes the agreed provisional/mock candidate scope. The historical source-fidelity gaps below remain documented for revisit; publication and persisted-Library cutover stay separate.

The reviewed candidate now executes all **1,838 persisted submission mappings** across **ten Sites and 68 products**. This closes the earlier new-member-only matrix gap for the stored applicant/class/association/period/mode combinations. It does not certify every age/amount/rider combination, adopt missing source-specific policy, publish a release, or activate the prototypes. **Exact source-parity review remains deferred.** The user explicitly requested keeping the prototype cutover separate in this continuation.

## Implemented acceptance

`coverageJourneyExceptionAcceptance.ts` constructs synthetic complete facts from the captured Site contracts, then executes each mapping through `evaluateCoverageJourney()`. It verifies submission identifier roles and applicant, and rejects missing residency/attestation, invalid amounts/ages, missing existing-policy verification, and missing/unsupported conditional dimensions. JSON-serialized rows and the real PostgreSQL snapshot pass the same matrix. Fixtures are test inputs, not real policyholders, approved premiums or product documents.

`evaluateCoveragePortfolio()` adds a joint boundary for one person's products:

- Collected payment methods/frequencies must agree where persisted policies require synchronization. Verified existing billing that skips new collection remains separate.
- Disability exclusions use the actual selected product list. Other selected amounts are added to declared in-force benefits before shared-cap checks; caller selection summaries cannot bypass those checks.
- Life totals include resulting coverage totals and explicit existing coverage outside those selections. Increases count their resulting total once. Missing existing coverage is not assumed to be zero.
- Duplicate products and mixed applicant roles are rejected. Evaluate separate people/children separately. No combined submission envelope is returned when any product or joint gate fails.

Tests cover synchronized billing, conflicting methods/frequencies, NSO's $800,000 limit/excess, missing existing life coverage, an existing-policy increase, ABE disability exclusions, and two individually valid disability amounts exceeding their joint cap. This is candidate domain code, not an installed applicant consumer or a full household reconciliation engine.

## Runtime data sources

This audit covers source wiring in this checkout, including normal and local mock startup. It does not inspect a deployed website or hosted database.

| Consumer | Current source | Reads persisted reviewed Library data? |
| --- | --- | --- |
| Applicant prototypes: Demo, ABE, AMA, ASCE, AVMA, CSEA, NSO, ISITRUST, WAEPA, WAEPAGI | `repositories/sites.ts` installs `staticSiteAdapter`; `getActiveClient()` resolves compatibility configuration. Coverage, fields and content retain static catalogs/resolvers. | No |
| Portal Library inspection | `libraryRepository.ts` installs `curatedLibrarySnapshot` from source-controlled catalogs; selected-Site inspection uses compatibility resolution. | No |
| Library Site Preview | Opens the selected applicant prototype. | No |
| Normal Admin persistence | Local storage or configured Supabase; ordinary seed leaves normalized Library tables empty. | Not an applicant source |
| Reviewed candidate, captured Builder drafts, migration tests | Explicit reviewed compiler export and captured repository snapshots. | Yes, within those candidate consumers |
| Local mock applicant pages | Same applicant router/static configuration, with local mock services and candidate draft persistence. | No |

`App.tsx` does not mount `PortalDataProvider`. The provider remains opt-in and has no static fallback when used. Exporting, seeding a disposable review database or running `mock:dev` does not install it in the applicant router. Persisted Library edits therefore do not automatically change the applicant sites.

The prototypes and Library UI share curated source-controlled information. They are **not yet consuming the migrated, persisted Library as their runtime source of truth**.

## Deferred source-fidelity work

- Adopt and accept remaining source-specific rider assignments/exceptions, including additional ABE slices and unresolved ISI rider roles. Generic prototype contracts do not establish complete source migration.
- Complete product-specific health, financial, tobacco, attestation and signature adoption/acceptance. Reused templates and synthetic attestations remain provisional.
- Extend joint acceptance to complete household/dependent reconciliation and remaining mixed-product exceptions. The stored-mapping matrix is not an exhaustive Cartesian matrix of ages, amounts and optional riders.
- Validate identifier roles and submission fields against accepted destination payloads. `mock-coverage-v1` does not certify insurer XML/PDF/service output.

Schedules, jurisdiction/eligibility choices, fees/credits, source conflicts and CSEA's authoritative table remain documented provisional decisions under the earlier user authorization. No renewed confirmation is required for those working choices. Real premiums remain unavailable. Publication readiness and prototype cutover remain separate gates.

## Evidence

- [Serialized exception matrix](step3-exception-acceptance.json): 1,838 mappings, no failures, provisional source approval, publication disabled.
- [PostgreSQL validation](step3-exception-postgres-validation.json): seven migrations, two identical seed applications, exact readback, constraint rejection, 101 RLS-enabled Library tables and concurrent snapshots. All three PostgreSQL tests passed, including the 1,838-mapping matrix from the actual snapshot.

Final validation: the focused six-test exception/portfolio run passed, and all five portfolio tests passed again after the final synchronization refinement. The full suite with two workers passed 898 tests, skipped the three separate PostgreSQL tests and hit four five-second timeouts in Library navigation/adoption. Both affected files were rerun with one worker and a 15-second timeout: all 61 tests passed. The separately executed PostgreSQL tests all passed. TypeScript, full lint, final changed-file lint, production build, regenerated adoption drift check and whitespace checks passed. The existing bundle-size warning remains. Earlier overlapping runs produced resource-contention timeouts; sandboxed mock-server tests also required a rerun with loopback-listener access. No unresolved assertion failure remains in the final checks.

```sh
STEP3_ACCEPTANCE_DIR=docs npx vitest run src/migration/coverageJourneyExceptionMatrix.test.ts src/migration/coveragePortfolioAcceptance.test.ts --maxWorkers=1
npm run migration:postgres -- --reviewed
npm run migration:adoption-review -- --check
```

The PostgreSQL command requires the disposable `portal-migration-review` container. It creates and drops an isolated database, never loads hosted credentials and never activates prototype Library consumption.

## Prototype rating scope clarification

On October 5 the user explicitly excluded an actual PRASE connection and confirmed the intended use of the existing mock service. Real PRASE credentials, authoritative base premiums and a live rating-service acceptance run are not Step 3 completion requirements for this prototype. The existing `/api/mock/rates/quote` endpoint returns explicitly synthetic quotes and is exercised by the Builder's mock contract controls. It is not yet the ordinary applicant form's rating source.

Remaining rating work is implementation and verification of the candidate/mock contract and applicable source-backed modifiers, including unavailable/error handling and CSEA's no-PRASE presentation. Synthetic prices must retain their mock labeling. Earlier real-service/source-reconciliation notes describe future fidelity work, not a request for the user to supply PRASE access. Previously authorized provisional decisions remain available for source gaps; further clarification should identify a specific unresolved Site/product/source item rather than treating the remaining implementation backlog as missing user information.
