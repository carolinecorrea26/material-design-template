# Project structure and Library review

October 13, 2026. Inventory generation only. Runtime cleanup progress is recorded in the ownership and implementation plan. The original completion gate remains **open**.

The package covers **147 SQL tables**, **141 generic collections**, **100 Library snapshot tables**, **400 foreign keys** and **70 JSON columns**. 289 scalar reference/vocabulary candidates without FKs and 327 observed JSON leaf paths are registered. These are review coverage counts, not final ownership or reference acceptance.

## Package

- [Advisor component review](advisor-component-review.md): Start/Continue login, sent and edit-request confirmations, shared send dialog and service boundaries

- [Resume component review](resume-component-review.md): email request, delivery method and verification code, shared expiry/resend controls and seven whole-page examples

- [Payment component review](payment-component-review.md): optional collection, product/shared payment elections, banking fields, rate-state summaries and whole-page scenarios

- [Health component review](health-component-review.md): shared question owners, restoration and validation corrections, source variants, QD loading and verification

- [Health Storybook pages](health-storybook-pages.md): six separate Health route entries, questionnaire examples and the QuickDecision processing boundary

- [Unique phone bindings](phone-field-bindings.md): self/spouse/business fields, shared PhoneField and validation against accidental state sharing

- [Standalone component boundaries](standalone-component-boundaries.md): Home through Contact views, application adapters, quote workflow organization and independent examples

- [Global template capability review](global-template-review.md): all ten configurations reconciled across Home through Contact; generic capability examples replace Site selectors
- [Main steps and breadcrumbs state review](navigation-state-review.md): completed/current/upcoming, hidden/showing, locked, pending and mobile states
- [Previously reviewed page structure checkpoint](reviewed-page-structure.md): reconciled Home, Membership, Eligibility, Coverage and Beneficiary before continuing
- [Contact component review](contact-component-review.md): residential, business/employer and spouse sections with real-page scenarios
- [Component documentation contract](component-documentation.md): application frame → page sections → shared pieces across saved JSON, Storybook, Library and prototypes
- [Home component review](home-component-review.md): standard quote and hero-image homepage sections, pieces and Storybook examples
- [Membership component review](membership-component-review.md): membership sections, reused pieces, conditional examples and removed lookup-step decision
- [Eligibility component review](eligibility-component-review.md): applicant details, dependent selection, spouse/child sections and reused form pieces
- [Beneficiary component review](beneficiary-component-review.md): optional participation, applicant/product records, allocation editor and copy flow, with real-page review examples
- [Cross-page reuse review](page-reuse-review.md): shared pieces, repeated behavior/content, and proposed documentation format for Home, Membership and Eligibility
- [ABE Portal Library requirements](abe-template-requirements.md): ABE requirements organized by the planned Library sections and ownership boundaries, for review before Admin Center entry
- [Ownership for every table](ownership.md)
- [Current column/contract/constraint dictionary](table-dictionary.md)
- [Complete FK relationship diagrams](relationships.md)
- [Reference dispositions, contract and seed findings](references.md)
- [Canonical-source proposals and cleanup register](cleanup.md)
- [Runtime ownership and implementation batches](ownership-and-cleanup-plan.md)
- [Application rules coverage and Library rollout](rules-coverage-plan.md), including area review order, decision questions, execution ownership and demo propagation
- [Step 1 requirement enumeration](step1-requirement-crosswalk.md), with the [manual source/service batch](step1-atomic-requirements.md), full catalog links, source dispositions and explicit remaining enumeration work
- [Shared tobacco-product answer standardization](abe-tobacco-options-proposal.md): approved twelve-choice list, stored values and all-Site verification
- [ABE Site review](step1-abe-review.md): finish all ABE phases before starting another Site; approved changes, exact owners and the remaining queue
- [ABE decisions applied](abe-review-questions.md), with [every reviewed item and implementation evidence](abe-final-review.json); all seven answers are implemented, including the optional Membership ID
- [Step 1 phased continuation](step1-review-phases.md), with completed named-owner and routing evidence plus an exact generated queue for the seven remaining areas
- [Current MCR interpretation and rule hierarchy](rule-organization-and-interpretation.md), including the approved six WAEPA choices, scoped reusable definitions and legacy-workaround review boundary
- [Atomic requirement crosswalk](rules-requirement-crosswalk.json), including verified work eligibility and accepted AMA and WAEPA GI decisions
- [October 19 rules-only baseline and corrections](ownership-and-cleanup-plan.md#october-19-continuation-rules-only-review), with [current rule catalog evidence](rules-current-evidence.json)
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

- [Pinned v78 drawing and embedded-object review](step1-workbook-drawings.json): 210 drawing anchors, all 195 media files and five embedded object parts. Reverify read-only with `scripts/verify-current-mcr-drawings.py <original-v78-workbook>`.

Coverage section review: [Coverage components](coverage-component-review.md). Catalog layout and validation: [catalog README](../../public/catalog/README.md). Developer implementation entry point: [handoff guide](../handoff/README.md), including the generated table dictionary and Membership, Eligibility and Coverage maps.

## October 27 Library checkpoint cleanup

The Pages/Fields regression expectations now match the reviewed ZIP → State → Birthday order and include the five shared utility pages in ABE's enabled page inventory. The 61 focused catalog, page, field, component and Storybook analyzer tests pass. Application and Storybook production builds pass; catalog/document drift checks pass.

The [component review register](component-consolidation-review.md) now accounts for all 85 saved components, including CoverageSelectionFeedback and ReferenceRateTableLink, and reflects the completed Coverage section review. The [Storybook audit](storybook-component-audit.json) recognizes real documentation components without adding them to the applicant inventory; the legacy FieldGrid reference points to its current stacked-fields story. All 306 non-admin story IDs are present in the clean build, with zero audit errors and zero invalid saved catalog examples.

This closes the test/register/reference cleanup. The six missing component examples, remaining page/state reviews, header/grid consolidation proposals, domain-specific nested JSON validation and Site-wide visual/accessibility acceptance remain open. The broader project completion gate above is unchanged.

## October 28 Profile review preparation

[Profile components](profile-component-review.md) follows the shared review contract with frame/section ownership, field and policy behavior, seven whole-page scenarios and optional standalone section examples. ProfileSections is the production content owner; the page retains application rules and advisor navigation. Shared controls carry their canonical review forward. Profile wording/layout and Site-wide visual/accessibility acceptance remain open.

Profile reuse follow-through: physician addresses now share AddressFields using explicit mappings, and member/spouse personal fields share ProfilePersonalInformation with independent bindings. Canonical examples and the [Profile review](profile-component-review.md#reuse-follow-through) record the change.

## October 28 Review page preparation

[Review components](review-component-review.md) documents its frame, guidance/readout, two legal sections, adult acknowledgements, validation and edit workflows. Ten whole-page scenarios lead the sidebar. ReviewStatement now has canonical examples; the document preview is standalone, and both disclosure sections share LegalReviewSection. Saved legal policies and workflow rules stay in the page/controller adapter.

## October 28 Payment review preparation

[Payment components](payment-component-review.md) follows the completed Health component checkpoint. PaymentSections owns explicit display composition; SharedPaymentControls receives authored fields from its controller and now has canonical standalone examples. Whole-page scenarios cover required/optional collection, restoration, Bill me, adults, multiple products, empty selection and an explicit shared-choice capability fixture. Mock authorization/submission remain in the page.
