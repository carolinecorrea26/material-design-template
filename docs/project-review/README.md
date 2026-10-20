# Project structure and Library review

October 13, 2026. Inventory generation only. Runtime cleanup progress is recorded in the ownership and implementation plan. The original completion gate remains **open**.

The package covers **147 SQL tables**, **141 generic collections**, **100 Library snapshot tables**, **400 foreign keys** and **70 JSON columns**. 289 scalar reference/vocabulary candidates without FKs and 327 observed JSON leaf paths are registered. These are review coverage counts, not final ownership or reference acceptance.

## Package

- [Ownership for every table](ownership.md)
- [Current column/contract/constraint dictionary](table-dictionary.md)
- [Complete FK relationship diagrams](relationships.md)
- [Reference dispositions, contract and seed findings](references.md)
- [Canonical-source proposals and cleanup register](cleanup.md)
- [Runtime ownership and implementation batches](ownership-and-cleanup-plan.md)
- [October 19 rules-only inventory and corrections](ownership-and-cleanup-plan.md#october-19-continuation-rules-only-review), with [all 107 rule records](rules-current-evidence.json)
- [October 19 required constraints, availability and stored structure reconciliation](ownership-and-cleanup-plan.md#october-19-continuation-required-constraints-availability-and-stored-structure)
- [October 19 Step 1 accepted decisions](ownership-and-cleanup-plan.md#october-19-user-decisions), with [approved-state evidence](step1-approved-evidence.json) and the [original exception evidence](step1-exception-evidence.json)
- [Machine-readable evidence, maintenance baseline and complete file register](inventory.json)

## Current completion status

| Original step | Evidence | Remaining work |
| --- | --- | --- |
| 1 Audit | Current table dictionary, FK diagrams, scalar/JSON surfaces and file register | Review candidate classifications and dynamic/unseeded JSON; this package records gaps rather than resolving them |
| 2 Ownership/cardinality | Confirmed TPA → Association → Site; explicit canonical tables and affiliation/context links | Finalize identity mappings, default context, shared Association boundaries, assignments and precedence |
| 3 Application model | SQL people, coverages, riders, answers and immutable snapshots implemented | Runtime operational and applicant stores remain separate; minimum relationships and supplied pair consistency need decisions |
| 4 Identity/actors | Human/service/system/unresolved actor and reference registry implemented | Finalize public/auth/mock identity mapping and historical alternatives; permissions/auth/account workflows remain deferred |
| 5 Constraints/migrations | 23 migrations; declared constraints represented in installed dictionary | 0 contract/nullability findings; export UUID and backend equivalence findings; unresolved lifecycle invariants |
| 6 Validation | Captured fresh/upgrade checks, ASCE scenarios, seed repeatability and preserved historical application | Full relationship/archive/reassignment matrix, domain-specific JSON validation and backend parity |
| 7 Apply | Disposable PostgreSQL evidence only | Intended data-bearing development database not selected or migrated |

## Open decisions and blockers

| ID | Area | Required decision/work | Evidence | Status |
| --- | --- | --- | --- | --- |
| D01 | Identity and tenancy | Reconcile canonical Association aliases, retained hosting records and differing TPA seed mappings; confirm applicant tenancy and multi-Association reuse | hierarchy/identity crosswalk | open |
| D02 | Context lifecycle | Missing association policy currently creates automatic context; finalize explicit defaults and parent/affiliation/archive changes on already-linked Sites | associationStructure.ts and canonical identity migration | open |
| D03 | Canonical assignment sources | Finalize site_products versus site_coverages; define disposition for site_configurations, product_clients and legacy environment links | compatibility tables | open |
| D04 | Business values and precedence | Reconcile product/rider JSON, typed policy tables and configurationValues; define assignment dimensions, ordering and null uniqueness | Library rules/configuration | open |
| D05 | Reference boundaries | Disposition every scalar and JSON candidate, polymorphic target, expression and supplied actor/reference pair; target deletion/key changes need review | reference register | open |
| D06 | Backend equivalence | Choose authoritative local development stores and shared service validation; resolve semantic-ID/UUID differences without guessing historical IDs | persistence adapters and exports | open |
| D07 | Atomic writes and history | Application transition/event/audit writes are separate; define transactional boundary and configuration/archive survival tests for all history | applicationService and publication services | open |
| D08 | Schema authority and checks | SQL is installed structure; export manifests are subsets. Consolidate current full-chain checks and explicitly label historical subset checks | migration manifests/check scripts | open |
| D09 | Applied development database | Identify data-bearing development target; preserve and reconcile its records before applying migrations. Disposable checks are not Step 7 | captured PostgreSQL evidence | not applied |

## Evidence boundaries

The PostgreSQL dictionary was captured at 2026-10-13T05:14:02.048Z. Migration filename lists and modification times match that evidence; current migration hashes are recorded in inventory.json, but the prior capture did not record hashes. This pass did not rerun or apply database migrations. The prior ASCE test result is 139 focused tests passed; the broad regression result and its repaired failure are documented in [ASCE setup](../asce-database-setup.md).

Current TypeScript contracts are inspected directly with the compiler API. SQL-only RPC contracts are recorded explicitly. Both current detached reviewed and operational exports are inspected; application recovery files, credentials and user saved records are excluded. Static candidate detection cannot prove all references embedded in arbitrary JSON or expressions. The full model still needs per-surface decisions and tests.

## Next bounded step

Finalize D01–D04: an approved ownership/cardinality and canonical-source map. Use the cleanup register to define a first implementation batch; preserve source evidence and historical identities. Authentication, role permissions, customer tracking/editing and ASCE content accuracy remain outside this review.

Reproduce with `node scripts/review-project-structure.mjs`; detect drift with `node scripts/review-project-structure.mjs --check`. Refresh the reviewed exports and PostgreSQL evidence through their existing commands when those inputs change.
