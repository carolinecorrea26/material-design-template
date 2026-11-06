# Phase 4B semantic MCR normalization

This pass adds semantic extraction and review infrastructure. **The requested semantic completion gate is not yet met.** The inventory names the remaining engineering gaps; they have not been hidden as source TBDs. Phase 5 runtime/repository switching has not begun.

## Evidence, meaning, and targets

`sourceWorkbooks`, `sourceSheets`, and `sourceRequirements` retain the prior cell/checklist inventory, workbook/checklist hashes, merged ranges, raw values, formulas, comments, hyperlinks, source references, and accounting reasons. The immutable input JSON is included under `src/migration/sources/`. Workbook image counts remain review issues; storing a count does not extract image contents.

Existing canonical domain tables remain the primary business model. `semanticRequirements` supplements those tables with typed declarative facts: a domain, canonical subject table/key, semantic predicate, JSON value, and documented/partial status. Examples include a boolean underwriting requirement, a structured benefit expression, a question display dependency, a document acknowledgement, and a composite amount schedule. It is not a second copy of the raw ledger. Arbitrary prose is not automatically promoted to a complete semantic fact.

`requirementTargets` is the existing many-to-many evidence bridge. It can point to a domain record or a semantic fact. The fact points to its canonical subject, and typed relationship values are integrity-checked. Two Read & Sign cells support one flag derivation; a single amount cell can support an amount pattern, options, applicant eligibility, and a composite schedule.

## Method and sheet coverage

Extraction uses row identities, declared columns, explicit sheet sections, full-cell grammars, and a small number of documented form-specific structures. It never uses 19,000 hand-maintained cell mappings. Workbook structural headers are separately accounted for. Unknown trailing clauses prevent an amount cell from being marked complete.

| Sheet/domain | Implemented mapping | Remaining work |
|---|---|---|
| Main | Products, identifiers, clients, simple amount patterns/options, applicant availability, age limits, underwriting facts, payment/rate configuration, rider links, product/question-set links | Compound amount schedules, restrictions, residency, dependencies, payment/rate conditions and unmatched identities |
| Disability | Reusable plans/variants, amounts/options, period choices, attribute schedules, typed income/cap ternaries with source conflicts preserved | Complex income tiers, age/class caps, exceptions and embedded period/rider clauses |
| Overhead Expense | Plans, simple amount selections, waiting/benefit periods, explicit formula applicability | Expense formulas, age caps, conditional periods and embedded financial forms |
| Riders | Reusable rider catalog, amount/election patterns, product junctions, age/applicability/underwriting facts | Complex dependencies, incompatibilities, inherited amount conditions and caps |
| QD LI / QD DI | Overlay identity audit, full-match QD age/amount bands, applicant applicability and pathway switches | Unmatched identities, benefit-period-dependent schedules and mixed conditional bands |
| Associations | Client/organization/association relations; explicit absence of optional logos/dropdowns | Remaining contact structures, dropdown relationships and identity conflicts |
| URLs | Deduplicated URL definitions, parsed query parameters, explicit environment/campaign/verification usage; safe client links | Unmatched source Site labels and prose URL instructions |
| Health Questions | Reusable question definitions, exact-text deduplication, form-specific sets, exact product/set links | State variants, conditional responses and externally referenced forms |
| Financial questions | Defaults, zero/blank behavior, income arithmetic, self-employment sections and dependencies | The source does not supply the requested explanation character limit |
| WAEPA CIR questions | Member/spouse boolean scopes, lookbacks, reflexive explanations and requiredness | Source references optional questions 9/10 but supplies only 1–7; remaining question details still require mapping |
| Attestation Online and PDF | Existing source question catalog retained | Most online/PDF differences, applicant/product eligibility and signing conditions remain engineering gaps |
| Read & Sign | Shared underwriting flag with structured selected-coverage derivation | Remaining content/applicability exceptions |
| Smoker Question | Reusable question catalog and explicit 24-month non-smoker rate threshold | Additional nicotine variants and follow-ups |
| Electronic Consent | Ordered document/content relationship, execution, acknowledgement, PDF access, validity and withdrawal facts | Custom CAT/WAEPAWL content is referenced but absent |
| Legal Disclosures | Content definitions, placements, explicit always/underwriting-flag visibility rules | Site/state/product-specific conditions and linked documents |
| Standard Decision Wording | Status semantics separated from copy; source owner retained | Owner reconciliation and multi-product decision composition |
| UX sheets | Header accounting; literal reusable copy and boolean configurations assigned only to exact clients | Unknown owners, image requirements, mixed directives and conditions |
| SUP DI / Underwriting / Beneficiary / Product Order | Prior catalogs/evidence retained; standalone question extraction | Cross-product applicability, flow-specific questions and presentation requirements |

The sheet inventory is an accounting report, not a declaration that every sheet above is complete.

## Identity reconciliation

`identityResolutions` records every attempted QD overlay reconciliation with source row, strategy, candidate keys, selected product (or null), and explanation. G numbers normalize case, spacing, and leading G separators. Plan codes normalize case/spacing without fuzzy edit-distance matching. Candidates are intersected when both identifiers exist. A repeated QD client section or exact product name may narrow multiple candidates only to a unique record. No-match/multi-match results remain blocking. URL definitions can be cataloged while owner identity remains blocked; no runnable Site is fabricated.

Prototype rider entity keys now derive from the product and stable rider definition; assignment keys remain independent. Runtime authoring remains unchanged. Coverage Library exports and anchors use the entity key, and the canonical review uses FK target values rather than junction keys.

## Amount parser and Patterns

All 15 amount families have conservative grammar coverage: fixed, list, stepped range, tiered stepped ranges, range-plus-fixed, conditional schedule, calculated, named option, not applicable, attribute-mapped, formula-capped, base reference, multiplier, election-only, and unspecified increment. Tests include workbook examples and composition grammars. This does **not** mean every prose amount cell has been interpreted.

Composite schedules preserve their boundaries/conditions in typed semantic facts associated with `coverageAmountPatterns`; options remain relational rows. Unspecified increments remain null. A range is never silently turned into a stepped range. Monetary grouping errors are source conflicts. Ternaries preserve compared caps and returned caps independently; malformed parentheses/conflicting branches remain explicit source conflicts rather than being corrected.

Patterns and Flags remain first-class catalogs. No per-cell Pattern is created. Read & Sign disclosure visibility points to `application.has-underwritten-coverage` through `ruleFlags`, with a reusable structured derivation.

## Review categories and Phase 5 readiness

Blocking categories: `UNMAPPED_SEMANTIC` (engineering extraction unfinished), `PARSER_GAP` (recognized business grammar not fully parsed), `MODEL_GAP` (required canonical representation absent), and `IDENTITY_CONFLICT` (unsafe target identity). Broken referential integrity also blocks readiness. Unrecognized categories fail closed.

Nonblocking when documented: `SOURCE_TBD`, `SOURCE_CONFLICT`, `REQUIRES_CLIENT_CONFIRMATION`, `REQUIRES_AM_CONFIRMATION`, `REQUIRES_UW_CONFIRMATION`, `REQUIRES_CONTRACTS_CONFIRMATION`, `REQUIRES_COMPLIANCE_CONFIRMATION`, and `IMAGE_REVIEW_REQUIRED`. `NON_FUNCTIONAL_OR_REFERENCE` and `INTENTIONALLY_EXCLUDED` preserve structural/reference evidence. `MAPPED` requires a real target.

`mcrCoverageReport()` exposes counts for every category, per-sheet counts, semantic fact domains, identity strategies, all blockers, integrity errors, and `phase5Ready`. Unknown source values are permitted; unfinished understood semantics are not. No generic UNRESOLVED records remain, but replacing the category alone does not constitute completion.

## Review UI and metadata

In the development server, open **Portal Library → Canonical Review** (`/admin-center/library/canonical-review`). Its lazy-loaded fixture snapshot is read-only and excluded from production builds. Inspect an evidence record, follow its destinations, follow a fact to its subject, and traverse canonical foreign keys or reverse evidence links. There are no mutation controls and no replacement runtime repositories/providers.

BrowseTable supplies ID # / Provided by through one shared column contract. A keyed-row adapter supplies the same metadata to legacy Library tables, including coverage, configurations, rules, content, communications, documents and branding. Existing persisted metadata wins in BrowseTable; prototype projections use deterministic numeric IDs. Provided by values may be blank; the vocabulary remains centralized in `domain/provenance.ts` with no new editing dropdown vocabulary. Sources are inspectable in the canonical review and migration tables.

## Database constraints and validation boundary

The additive SQL enforces table-scoped unique IDs/semantic keys/display IDs, non-null fields, declared foreign keys, controlled Provided by tags, and relation uniqueness. Source categories are SQL-constrained. New product/question-set uniqueness uses PostgreSQL NULLS NOT DISTINCT.

Polymorphic requirement destinations and semantic subjects/JSON references are enforced by deterministic `validateMigrationDatabase`, not a general SQL polymorphic FK framework. It also checks assignment scopes, flag values, canonical site rider targets, candidate integrity, cross-client associations and graph endpoints. These checks are required before migration export/readback. Direct SQL writes to polymorphic JSON bypass this validator; the review UI cannot make such writes. This limitation must be addressed before introducing writable production repositories in Phase 5.

No `getSite`/`getClient` switch, compatibility removal, runtime resolver removal, or legacy Admin/CMS removal was made.
