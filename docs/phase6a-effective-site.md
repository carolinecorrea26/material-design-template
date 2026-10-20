# Phase 6A — EffectiveSite candidate resolution

This records the completed 6A baseline. See [Phase 6B expansion](phase6b-effective-site.md) for the subsequent model and its remaining unresolved semantics.

The opt-in `createEffectiveSiteRepository(adapter).resolve(siteKey)` reads persisted rows and returns an `EffectiveSite` candidate. `resolveEffectiveSite` is the pure domain resolver; `resolveEffectiveEligibility` and `resolveEffectiveUnderwriting` evaluate applicant facts against that candidate. No application consumer or browser adapter is switched. `repositories/sites.ts` still creates the application repository with `staticSiteAdapter`.

The path is persisted Site and canonical rows → normalized `EffectiveSite` → explicit decision functions. Neither the repository nor the domain layer imports migration fixtures, workbook extraction, static configuration or the compatibility adapter. Tests use the migration fixture to supply persisted canonical inputs; ordinary prototype seed data does not contain these approvals and correctly fails ASCE candidate resolution.

## Implemented scope

- Active Site and Client identity, Site name, enabled product assignments and ordered applicant assignments are resolved for the ten prototype Sites.
- ASCE 10-Year and 20-Year member/spouse eligibility resolves inclusive completed-year ages 18–69 and 18–59.
- ASCE member/spouse underwriting resolves persisted documented QD/FUW bands, including the approved 10-Year ages 65–69 and 20-Year ages 55–59 FUW bands. Amount boundaries preserve inclusive/exclusive minimums and inclusive maximums. Eligibility is evaluated before underwriting.
- Each resolved rule retains table/key, display ID, source reference, provided-by metadata and, where applicable, its exact approval record key and provenance. Existing prototype-derived bands retain their own source references; the six approvals are not represented as approval of every rule.
- The shared exact ASCE approval validator now lives in the domain layer. Migration keeps its existing exports and compiler-only mutation function. Both readiness and candidate resolution require the same exact approval evidence and canonical target values.

This is a deliberately scoped domain model, not yet a complete application configuration. Child rules, other products/Sites' eligibility and underwriting, content, fields, flows, rates, benefit limits and other runtime domains remain outside this resolver's implemented scope. Requests outside the implemented decision scope return `unresolved`; they never inherit a default pathway or an implicit eligibility approval. Existing child and other runtime behavior remains with the static adapter.

## Determinism and failure behavior

The repository performs fresh reads without caching or writes. The pure resolver sorts product and rule keys and applicant positions, rejects duplicate assignments, rejects conflicting eligibility rows rather than inventing precedence, and rejects unsupported or overlapping underwriting bands. Missing approvals, changed canonical targets, unavailable Sites/Clients and missing applicant assignments reject candidate construction. Transport errors propagate without static fallback. Missing or invalid facts return `needs-information`; an out-of-range age blocks underwriting; an uncovered amount returns `unresolved`.

The result is detached from the persisted input. It is a point-in-time candidate: adapters do not currently offer transactional multi-table snapshot reads. A future runtime cutover must establish revision consistency and broader domain completeness; callers must not treat this read as a deployment approval.

## Approval and activation

`runtimeActivation` remains `pending-phase-6` in both the persisted approval evidence and candidate model. Approval means user approval in this project, as recorded in [the existing decision register](asce-business-decisions.md). It does not assert separate Underwriting/Contracts sign-off or a production effective date. No database deployment, compatibility retirement or runtime activation is part of this pass.

## Validation

The Phase 6A tests cover all four product/applicant combinations at the approved age and amount boundaries, parity with every existing documented ASCE underwriting band across each completed year, product/applicant parity for all ten Sites, row-order determinism, provenance, unsupported scopes, invalid facts, approval loss, changed targets, ambiguity, duplicate assignments and transport failures. The existing compatibility tests continue to verify all ten Sites with non-compatibility tables removed and with normalized rules mutated.

Validation on 2026-09-29: full suite **621 passed**, one PostgreSQL test conditionally skipped; production build and lint passed. The existing Vite bundle-size warning remains. No PostgreSQL deployment or fresh database readback was performed.
