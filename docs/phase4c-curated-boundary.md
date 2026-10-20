# Phase 4C — Curated migration boundary

Current status: `phase5Ready: true`, `phase6Ready: true` after the six [ASCE business decisions](asce-business-decisions.md) were explicitly approved and recorded canonically. Phase 4C is closed. Phase 5 preserves compatibility behavior; approval does not activate a normalized runtime. The original six-blocker inventory below is historical. See [Phase 5](phase5-repositories.md).

## Source accounting

The complete 45,320-record source ledger is retained, including cells, formulas, comments, hyperlinks, checklist-only evidence and image references. Extraction classification and promotion state are separate persisted fields. An additive sixth SQL migration defaults existing records to source-only; it does not rewrite historical migrations.

| Promotion state | Source records | Treatment |
| --- | ---: | --- |
| SOURCE_ONLY | 43,576 | Archive/reference, not active Library or Site data |
| PATTERN_CANDIDATE | 1,742 | Successfully extracted discovery evidence from DI, overhead, rider, QD and question sheets; no adoption or assignment |
| CANONICAL_LIBRARY | 2 | Read & Sign B3/B4 support the approved derived underwriting flag |
| SITE_CONFIGURATION | 0 | No additional workbook cells automatically assigned to a Site |
| UNRESOLVED | 0 | No adopted cell-ledger requirement; the six former business unknowns below are now separately approved |

These counts measure **source evidence**, not the size of the canonical Library. The existing five Patterns, configured/derived Flags, normalized amount patterns, products, riders, questions and Site configuration remain intact. ABE, AMA and ASCE retain 90 page assignments, 48 Site field configuration rows and 25 enabled product assignments between them, plus inherited configuration. All ten existing prototype Sites retain their behavior. No new runnable Sites were fabricated.

The 928 parser gaps and 314 identity conflicts remain searchable extraction findings, but are source-only. The old 10,364 semantic-gap total is no longer a readiness metric. The current extraction inventory has 11,660 semantic gaps because the former automatic UX extraction has been removed; they are source-only too. The report includes an extraction-category × promotion-state breakdown.

Both New UX sheets (19,803 source workbook cells) are reference-only. They no longer generate semantic UX configuration or global copy. Curation rejects promotion or active Site scopes for these sheets without a future explicit adoption implementation. Tests also prove that changing their text cannot change any implemented Site resolution. Unadopted extracted products/riders cannot be assigned to runnable Sites without failing integrity validation.

Extracted MCR catalog rows remain inspection artifacts in Canonical Review. They are not automatically adopted entities. Existing normal Portal Library consumers remain curated and do not load the MCR fixture. Canonical Review displays promotion state, rationale, extracted targets, semantic facts, relationships and active Site scope, separately from extraction classification.

## Historical Phase 6 business-data blockers (now approved)

| Site/product | Requirement | Source / affected range |
| --- | --- | --- |
| ASCE / `li-10yr` | Base eligibility ages conflict | Summary 17–64 versus detailed bands beginning at 18 and extending to older ages; ASCE_Portal_Site_Rules.xlsx, Open Issues!C3 / Life Products!E2 |
| ASCE / `li-20yr` | Base eligibility ages conflict | Summary 17–54 versus detailed bands beginning at 18 and extending to older ages; Open Issues!C3 / Life Products!E3 |
| ASCE / `li-10yr` / member | Underwriting pathway unspecified | Ages 65–69, $100,000–$2,000,000 |
| ASCE / `li-10yr` / spouse | Underwriting pathway unspecified | Ages 65–69, $100,000–$2,000,000 |
| ASCE / `li-20yr` / member | Underwriting pathway unspecified | Ages 55–59, $100,000–$2,000,000 |
| ASCE / `li-20yr` / spouse | Underwriting pathway unspecified | Ages 55–59, $100,000–$2,000,000 |

These were business blockers for enabled products at Phase 4C completion. The user subsequently approved ages 18–69 / 18–59 and FUW for all four older-age bands; see the decision register above. Existing scalar compatibility values did not settle them. The approved canonical rules now resolve them without changing prototype behavior.

The gate inspects persisted compatibility products for all ten Sites and reconciles the six exact unknown keys against explicit approval evidence and matching canonical rules. It also blocks explicit unresolved promotions, missing Site/page relationships, invalid promotion scopes and canonical integrity failures. Tests prove that thousands of archival gaps alone do not block readiness, while missing or changed approved rules reopen blockers.

## Portal Library contract audit

- `BrowseTable` / `libraryColumns` own shared numeric ID and Provided by columns; legacy tables use `ResponsiveTableContainer` / `withLibraryMetadata`.
- Domain tables retain semantic keys/names, relevant status/scope, source references and existing relationship navigation. Identity/support detail tables are property summaries, not entity inventories.
- Fixed effective Fields display IDs: the entity ID is now derived from the stable field key, not a serialized effective configuration. React row grouping remains separate.
- Rider links still resolve canonical rider keys, never product-rider junction keys. Relationship tests additionally cover product plans, underwriting, amount/rider rules, question assignments, coverage dependencies, Patterns, Flags and provenance destinations.
- All five seeded Patterns and configured-versus-derived Flags are preserved. No per-client Pattern copies were introduced.

## Validation

See `migration-artifacts/mcr-coverage.json`, `inventory.json`, `postgres-validation.json`, and `postgres.json` for reproducible reports. The original Phase 5 gate deferred the six named unknowns. Following business approval that exemption is removed: readiness now requires the approval records and canonical values to match. Current results are in the Phase 5 document; the counts below are historical.

- Full suite with PostgreSQL readback: 564/564 passed, 43 test files, no skips (before the additional effective-field-ID UI regression test).
- Migration suite and all ten-Site behavioral equivalence tests passed; full suite includes seven new promotion-boundary tests.
- Final Library regression run: 20/20 passed, including the new effective-field-ID test (565 distinct passing tests across the runs).
- PostgreSQL: six additive migrations, repeatable seed applied twice, 12 invalid writes rejected, 101 Library tables with RLS, real row readback through the existing Supabase adapter column mapping. Transport is stubbed; this is not a hosted PostgREST end-to-end test.
- TypeScript, full lint, production build and `git diff --check` passed. Vite retains its bundle-size warning.

The validation counts above record Phase 4C. Phase 5 now introduces repositories and compatibility consumers; its validation is documented separately. Phase 6 and legacy deletion remain out of scope.
