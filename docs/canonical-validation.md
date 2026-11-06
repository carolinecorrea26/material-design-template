# Phase 4B validation — 2026-09-28

Historical results only: SQL export and PostgreSQL commands have been removed.
For current behavior, see the [JSON catalog](../README.md#current-shared-catalog).

**`phase5Ready: false`. The Phase 4B semantic completion gate fails.** Implementation/regression checks pass, but they do not override the unresolved authoritative mapping backlog.

## Exact results

| Check | Result |
|---|---|
| `npm test` | 41 files passed, 1 environment-gated file skipped; **557 passed, 1 skipped** |
| `npm run migration:check` | 6 files passed, 1 environment-gated file skipped; **281 passed, 1 skipped** |
| New semantic extraction suite | **30 tests passed**, included in migration/full totals |
| Shared Library metadata / rider navigation suite | **3 tests passed**, included in full total |
| `npm run migration:export` | **4 tests passed**; deterministic schema, data, seed and report exports |
| PostgreSQL readback suite | **1 test passed separately**, including exact canonical rows and all ten prototype sites |
| `npm run migration:postgres` | PostgreSQL **17.11**; **5 migrations**, seed applied **twice**, idempotent; **10 invalid writes rejected**; **101 tables with RLS** |
| TypeScript | `tsc -b` passed, also included in production build |
| `npm run lint` | Passed, no errors |
| `npm run build` | Passed; existing large-chunk advisory remains. Canonical Review and the workbook snapshot are excluded from production output |
| `git diff --check` | Passed |
| Browser review smoke check | Canonical Review loaded with 45,320 source records and zero integrity errors; followed Read & Sign B3 → shared structured flag fact → source evidence B3/B4 |
| Semantic completion command | **Failed (exit 1)**: `node scripts/check-semantic-readiness.mjs` after fresh migration export. `npm run migration:semantic-gate` reproduces both steps |

The ordinary skipped test requires `MIGRATION_POSTGRES_READBACK`. It was explicitly executed with actual PostgreSQL rows, not replaced with an in-memory database assertion. PostgreSQL validation used only the named disposable `portal-migration-review` container and a temporary database, removed by the script. No production database connection was used.

The tests continue to validate prototype configuration/domain equivalence across the ten existing Sites. No tests were removed or relaxed to accept different runtime behavior. Navigation expectations were updated for the additional development-only tab and the common ID column; the page-filter assertion now finds the Page column by header. Export performance was corrected with indexed target/fact/identifier lookups, without increasing the existing test timeout.

## Readiness counts

| Category | Records |
|---|---:|
| Blocking semantic gaps | **10,364** |
| Blocking parser gaps | **928** |
| Blocking model gaps separately identified | **0** |
| Blocking identity-conflict source records | **314** |
| Referential integrity errors | **0** |
| True source TBDs | 4 |
| Source conflicts | 34 |
| Client confirmation | 40 |
| AM confirmation | 1 |
| UW confirmation | 96 |
| Contracts confirmation | 67 |
| Compliance confirmation | 0 |
| Image review | 6 |
| Intentionally excluded | 19,462 |
| Nonfunctional/reference | 105 |
| Mapped | **13,899** |
| Total source accounting records | **45,320** |

Total blocking evidence records: **11,606**. Zero MODEL_GAP records means no gap has separately been assigned that category; it is not proof that the remaining semantic/parser work will need no model extension.

Before: 6,634 mapped, 19,462 excluded, 19,224 generic unresolved. After: 13,899 mapped and all remaining evidence explicitly categorized. **7,265 additional source records now have semantic mappings.** All 23 sheets retain source accounting.

QD identity reconciliation: 5 exact matches, 7 semantic-key matches, 22 G-number-only matches, 0 plan-code-only matches, 55 combined G-number/plan-code matches, 12 multi-match conflicts and 26 no-match rows. These are overlay-row counts, distinct from the 314 blocking identity evidence records, which also include URL owner conflicts. No conflicting candidate set is automatically assigned.

## Exact remaining blockers and source issues

[canonical-mcr-inventory.md](canonical-mcr-inventory.md) gives every sheet/category count, representative blocker cells, all true-source/confirmation issues and table/domain inventories. [mcr-coverage.json](mcr-coverage.json) contains **every blocking cell**, its exact classification, reason and source reference. [canonical-identity-review.json](canonical-identity-review.json) contains candidate keys and reconciliation strategies.

The largest remaining engineering areas are compound Main requirements, conditional DI/OE/rider schedules, attestation behavior, health-question dependencies, SUP DI applicability, Read & Sign exceptions, UX directives and unresolved source-owner identities. These are not relabeled as SOURCE_TBD.

True source issues include missing custom consent text, missing referenced CIR questions 9/10, unspecified financial explanation character limits, malformed QD monetary grouping, inconsistent/malformed benefit formulas, checklist/source discrepancies, explicit stakeholder confirmations and image-only content.

**Phase 4B is not complete. Phase 5 was not started.** The source archive includes the three required Markdown documents, machine-readable blocker/identity reports, source JSON, generators, schema and tests. Runtime repositories, `getSite()`/`getClient()`, ClientConfig compatibility, client configuration/content, Portal Admin and CMS remain in place.
