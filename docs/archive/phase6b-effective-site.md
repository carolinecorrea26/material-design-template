# Phase 6B — expanded EffectiveSite domain

The opt-in persisted candidate now carries domain configuration alongside applicant decisions. `repositories/sites.ts` continues to use `staticSiteAdapter`; no application consumer changes, deployment, or runtime activation are included.

`resolution.completeness` is `partial`. `implementedScopes` identifies actual product/applicant decision capabilities per Site. Only ASCE's four term member/spouse combinations advertise underwriting execution. Other Sites no longer carry an ASCE resolution label.

## Data boundary

`effectiveConfigurationTables` is the repository's explicit normalized-table allowlist. Resolution accepts persisted rows, uses no extraction or migration helpers, and never reads the compatibility `siteConfigurations` table. Configuration and content values retain semantic keys rather than rebuilding ClientConfig paths. Product presentation properties and rider-set replacement markers use explicit persisted `configurationDefinitions.definition.target` relationships (`product-presentation` or `product-rider-set`), never legacy paths. The migration compiler supplies these relationships; existing snapshots must be recompiled to carry them. Product presentation properties resolve directly from catalog properties and explicit scoped normalized values. Every resulting value, assignment and rule retains table/key/source provenance; ASCE approval evidence remains exact and shared with readiness validation.

The returned graph is detached from its inputs. Position-bearing normalized relationship collections are ordered by persisted position then semantic key. Scalar configuration/content values and flattened branding/support properties are returned in semantic-key order after precedence resolution; products and underwriting bands use semantic-key order, and presentation properties use the fixed domain property order. Scoped configuration uses explicit global → client → Site precedence. Same-layer value, field-property and flow collisions fail rather than using insertion order. Duplicate normalized identities fail construction. Missing referenced records appear in `configuration.issues` and cannot trigger a static fallback.

Coverage policy collections use complete Site-specific normalized records, not implicit inheritance from global catalog records. Missing Site amount rules remain unresolved. Catalog references and non-executable policy are represented separately from decision capabilities.

## Represented domains and execution

- Applicant constraints: completed-year ages, minimum age in days, student age extension, marital constraint and work hours. Missing required facts return `needs-information`. Dependencies and maximum-plan constraints require supplied selected-plan facts. Missing or conditional applicant assignments are unresolved. Other underwriting rules remain represented; only approved ASCE underwriting executes.
- Products: catalog/category identity, presentation properties, configuration values, identifiers, applicant assignments, underwriting records and residency references.
- Coverage: dependencies, maximum plans, aggregate limits, ordered benefit caps and waiting/benefit periods.
- Amounts: normalized patterns, ranges, options, fixed and multiplier derivations with provenance. `resolveEffectiveAmount` validates explicit applicant selections and boundaries. Missing/invalid patterns, conditions and ambiguous matching assignments are unresolved.
- Riders: scoped assignments, explicit Site enablement, definitions and amount patterns. Unknown premium factors are recorded as unresolved issues.
- Rates: table references and presentations are represented with `unresolved` execution status. The current schema does not supply executable rate cells and input dimensions; no rates are invented.
- Fields/pages: Site page ordering and requirements, field placement, required/hidden flags, validation and scoped overrides, plus referenced visibility/option conditions.
- Flows/rules: scoped flows, ordered steps, transitions and endpoint references; rule assignments, conditions and documented actions. A human-readable branch label is explicitly unresolved as an executable predicate.
- Site configuration: semantic configuration/content values, branding/support profiles and feature assignments.

## Remaining completeness gaps

This is an expanded partial candidate, not a declaration of full Phase 6B completion or cutover readiness. Formula-based benefit limits need typed executable expressions; flow branches and documented rule actions need executable predicates/actions; rates need normalized numeric inputs. Residency evaluation and broader underwriting execution remain unresolved. The existing issue list is the review surface for these gaps. Plan variants, plan amounts/benefit periods, product question sets and page-section field relationships are also represented; conditional question and plan assignments remain explicit issues until their predicates can be executed.

Phase 6C must still prove full persisted-snapshot parity and transactional revision consistency. Concurrent fresh table reads do not establish a consistent revision. Phase 6D remains a separate controlled consumer activation and compatibility retirement step.

## Validation

Tests compare all ten Sites' branding/support, fields, pages, flow definitions, rider assignments, amount selections and benefit caps against the existing persisted migration review oracle. The original static product/applicant and year-by-year ASCE underwriting parity tests remain in place. Additional checks cover full-table row-order independence, detached results, child eligibility, amount boundaries, malformed amount patterns, ambiguous scopes, missing references, provenance, transport failures and the persisted-input allowlist.
