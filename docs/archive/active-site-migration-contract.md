# Active Site migration contract

The current migration covers the ten Sites already represented in the prototype. Caroline approved the project plan and clarified this scope on October 1, 2026. This contract defines the inventory, source authority and acceptance evidence needed before implementation proceeds to shared data access, visual building or runtime activation.

The scope decision does not approve new business rules, resolve source conflicts or certify that the MCR snapshot is current. The [legacy platform review](legacy-platform-migration-review.md) and its [property and behavior register](legacy-platform-review-register.json) supplement this contract with Caroline’s supplied platform reference; they add planning evidence without adopting policy values or changing the active Site scope. The [generated inventory](active-site-migration-inventory.md) and [product review register](active-site-coverage-audit.json) describe the checked-in baseline. Record presence, source extraction and existing test parity are separate from validation against authoritative coverage requirements.

## Approved Site scope

| Site | Client | Coverage source review |
| --- | --- | --- |
| `demo-default` | `demo` | Synthetic regression fixture; no MCR product identity required |
| `abe-default` | `abe` | Required |
| `ama-default` | `ama` | Required |
| `asce-default` | `asce` | Required |
| `avma-default` | `avma` | Required |
| `csea-default` | `csea` | Required |
| `nso-default` | `nso` | Required |
| `isitrust-default` | `isitrust` | Required |
| `waepa-standard` | `waepa` | Required independently of GI |
| `waepa-gi` | `waepa` | Required independently of Standard |

The initial product scope is each Site's currently enabled product assignments. Disabled products and additional products found in MCR remain visible for applicability review; they are not automatically enabled. Demo must retain behavioral regression coverage, but its synthetic coverage is not represented as authoritative insurance data.

Other MCR clients remain archived for later migration. Adding a client, Site, or product to the runnable scope requires a recorded scope decision, stable identities and its own acceptance register. Association rows, environment URLs and source product variants do not create Sites. WAEPA Standard and GI share a client but retain distinct assignments, rules and acceptance results.

Caroline subsequently confirmed CSEA is the standard Site. The [platform clarifications](platform-conflict-clarifications.md) narrow supplemental migration candidates to rates, coverage, eligibility, health-question rules and direct dependencies, and authorize legacy calculation fallback where no applicable replacement exists. The filter naming change uses unique Site acronyms without changing stored keys.

The machine contract is [activeSiteScope.ts](../../src/migration/activeSiteScope.ts). Existing migration fixture and promotion inventories share that scope. Application configuration and runtime adapters are unchanged.

## Source authority

| Source | What it establishes | What remains to be verified |
| --- | --- | --- |
| `04-MCR-new-version-full.xlsx`, extracted into `src/migration/sources/mcr.json` | Coverage evidence, exact source cells, comments, formulas and references | Confirm this is the current authoritative workbook; review applicability and adopt exact values |
| `05-requirements-to-fill-out-checklist.xlsx`, extracted in the same snapshot | Completeness and discrepancy evidence | Differences from the workbook require explicit reconciliation |
| `siteconfig-customization-reference.html`, pinned in the platform review register | Reported legacy Site behavior, custom overrides, field/payment/flow rules and service dependencies | Confirm currency and exact Site/product/variant applicability; reconcile policy values with MCR and exact decisions; retire obsolete mechanisms deliberately |
| Current prototype configuration and components | Existing template pages, fields, sections, flows, layout and behavior | Compare coverage policy against MCR; preserve or explicitly change template behavior |
| [ASCE decision register](../asce-business-decisions.md) and persisted approval records | Six existing approved decisions and their exact canonical targets | Retain exact approval evidence; do not extend approval to unrelated rules or claim external sign-off |
| Both New UX workbook sheets | Historical and proposed experience references | Adopt only explicitly reviewed changes; do not overwrite the implemented template from extraction |

An exact approved decision supersedes conflicting source evidence only for its recorded targets. Outside those targets, conflicting sources remain unresolved. Existing prototype behavior is a compatibility baseline, not automatic proof of coverage policy correctness. MCR coverage policy and template presentation have different ownership; resolve conflicts deliberately rather than treating one source as authoritative for everything.

The contract pins the workbook SHA-256, checklist SHA-256 and the extracted snapshot's actual byte digest. Generation checks the byte digest and source metadata. These checks detect source drift; they do not independently verify the original workbook contents or its currency. A replacement snapshot requires review and a new contract version before regeneration.

Original workbook files are not re-certified in this step. Missing assets, image-only instructions, stakeholder confirmations and contradictory values remain explicit gaps. Owner fields in provenance remain unknown when the source does not establish an owner; suggested review roles are not sign-offs.

## Identity review before policy migration

Every enabled Site/product needs an explicit mapping to source products, plan variants and applicant/class identifiers. Category or product-name similarity alone cannot establish identity. G-numbers and plan codes are preserved as strings, including leading zeros and scoped variants. A code cannot be derived from the Life or Disability category alone unless a reviewed mapping defines that result.

The baseline exact client lookup misses relevant rows labeled `AVMA LIFE` and `ISI`. The scope contract includes these exact Main sheet labels as review hints for AVMA and ISI Trust. CSEA was subsequently confirmed as standard; `CSEA GI` rows are excluded as standard-Site identity evidence. They expand the review queue only; they do not change stored ownership or Site assignments. Student, graduate, simplified-issue and other source variants still require independent applicability review.

Candidate product matches use an existing extracted client relationship or one of those explicit hints, followed by an exact primary G-number and plan-code pair or exact product name. A single match is still a candidate. Conflicting identifiers, scoped variants, category differences, multiple matches and missing matches must be recorded before adoption. Unowned source products and shared sheets remain in the applicability queue instead of being silently excluded.

## Completeness register

The generated JSON contains every enabled Site/product and thirteen acceptance domains. For each domain it records normalized evidence references, representation status, source validation, adoption validation, execution validation and publication validation. Site records separately cover template experience and expose existing candidate resolver findings. Main source catalogs contain extraction issues and identity hints for the scoped business clients.

`records-present` means only that relevant normalized rows exist. `review-needed` means that applicability or representation needs investigation; it does not mean the requirement is absent from every source. A missing domain can be optional or inapplicable only after evidence establishes that disposition. Composite configuration, prose-only requirements and linked assets may require additional model work even when rows exist.

All validation stages initially remain pending. Demo's MCR source validation is explicitly inapplicable; its other stages remain pending. Existing candidate eligibility/underwriting capabilities are shown separately and never turn a domain into a completed review. The register is generated baseline documentation, not a database for approval records; later implementation must persist reviewed decisions and regenerate the baseline without losing those records.

| Domain | Required acceptance evidence |
| --- | --- |
| Product and plan identity | Reviewed Client/Site/product/plan mapping, G-numbers, plan codes and applicant/class variants |
| Applicant availability | Explicit member/spouse/child availability, classes and conditional assignments |
| Eligibility | Age basis and inclusive/exclusive boundaries, student/marital/work restrictions, and missing facts |
| Coverage amounts | Ranges, increments, options, formulas, dependent values and boundary cases |
| Dependencies and limits | Required related coverage, plan counts, aggregate limits and ordered caps |
| Underwriting | Pathways and applicant/class/age/amount bands, including uncovered and unresolved cases |
| Riders | Enablement, applicants, amounts, derivations, restrictions and pricing availability |
| Residency | Site/product jurisdiction exclusions and their conditions |
| Waiting and benefit periods | Selectable/mandatory periods, plan variants and conditional packages |
| Question sets | Health, financial, tobacco and attestation versions; field mappings and conditions |
| Payment | Payment/skip behavior, methods, frequency, fees and processor applicability |
| Documents | Application forms, disclosures, consent, brochures and beneficiary requirements with versions or explicit missing assets |
| Rates | Authoritative inputs, dimensions and calculation tests, or an approved unavailable outcome that suppresses prices |

Shared QD, DI, overhead, rider, question, consent, disclosure, association and URL sheets require explicit applicability review. Main row ownership is a starting point, not a complete coverage-data boundary. General requirements that apply to an enabled product remain in scope even if they live outside Main or carry no client label.

The same acceptance process must later verify pages, fields, sections, conditions, flow transitions, content, support, branding, features, ordering, provenance, email templates and documents for each Site. The supplemental platform register records legacy property triage and scoped behavior evidence. Its recommendations remain pending applicability and decision review; property presence and framework-unused labels do not certify inclusion or retirement. Administrative builder settings and applicant-entered facts need distinct definitions. The referenced builder-field attachment has not been provided in this chat; its exact inventory remains a later definition task.

## Acceptance gates

1. **Scope and sources:** all ten Sites and enabled assignments are inventoried, ownership is valid, source digests are pinned, and source currency is confirmed or explicitly pending. This step delivers the contract and baseline register; it does not certify currency.
2. **Identity and source review:** every applicable requirement has exact evidence, a reviewed identity/applicability mapping, and a confirmed value, explicit inapplicability, or an unresolved issue with its reason. Source conflicts and stakeholder confirmations stay separate from engineering gaps.
3. **Adoption:** reviewed requirements have typed canonical targets, explicit Site assignments, provenance and exact decision evidence. Extraction or catalog inclusion alone cannot pass this gate.
4. **Execution:** applicable confirmed requirements run through shared rule operations, with boundary, missing-fact, conditional and regression tests. Display-only prose does not pass. Approved unavailable rates must suppress prices rather than use generic estimates.
5. **Persistence and parity:** actual database readback and a consistent revision match the reviewed expected behavior for each Site. Static/prototype equivalence tests alone do not prove MCR correctness. Intentional template changes have separate recorded expectations.
6. **Publication:** Library inspection, draft preview and the live prototype agree for the same published revision; drafts remain isolated, publication is atomic, audit attribution is real, and rollback is tested. This gate belongs to later stages.

A Site is complete only when each applicable product/domain and its Site experience pass the relevant gates. Supported inapplicability or an approved unavailable service is a recorded outcome, not an implicit success caused by missing rows. No global percentage or green historical readiness flag substitutes for those per-Site outcomes.

## Implementation sequence

Step 1 delivered the scope, source contract and acceptance register. Caroline approved that contract and authorized **step 2: shared data access and consistent revision reads**. The [shared revision contract](shared-data-revision-contract.md) records that implementation and its limits. Step 2 is complete with the limits recorded there. Step 3 is in progress and covers both scoped MCR mapping and applicable legacy platform behavior. Follow [the revised sequence](legacy-platform-migration-review.md#revised-delivery-sequence): identity/applicability, smallest typed contract extensions, then reviewed adoption and execution. Payment policy, reactive derivations, exceptional rider-only flows, service contracts and URL compatibility are explicit review areas, not automatic imports. Typed draft/derivation definitions precede the visual builder, then publication/revision behavior, admin authentication with TOTP, and controlled runtime activation.

TOTP remains a later stage. This supplemental review makes documentation changes only. No account provisioning, authentication changes, schema deployment, draft UI, publication or runtime cutover is part of this review. Caroline is the intended sole initial admin, using username `caroline`; the password/TOTP and recovery details are defined when that stage begins.

## Maintaining the baseline

Run `npm run migration:scope-audit` to regenerate the JSON register and Markdown inventory from the checked-in compiler. Run `npm run migration:scope-audit -- --check` to detect drift without rewriting them. Both commands run in an isolated authoring environment and do not install data, call a hosted database or change the running application.

Historical phase documents retain their original validation evidence. This contract governs the clarified current scope. In particular, `phase5Ready` and `phase6Ready` in the older curated migration report describe their existing limited gates; they do not assert complete MCR migration, consistent revision reads or runtime publication readiness.

The [Step 3 adoption register](step3-active-site-adoption.md) records the explicit crosswalk, required missing behaviors and first reviewed WAEPAGI amount slice. CSEA GI rows are no longer standard-Site identity hints.
