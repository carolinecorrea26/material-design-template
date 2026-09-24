# Canonical domain and rules architecture

## September 2026 architecture audit

The full `src` tree was inventoried before this phase. The implementation already contained the
Client → Site → Association normalization described below, plus compatibility adapters into the
legacy `ClientConfig` runtime. This phase extends that work; it does not replace it.

Current ownership found by the audit:

| Concern | Canonical/source input | Derived consumers and compatibility paths |
| --- | --- | --- |
| TPA | `tpas.ts`, `registry.ts` | Portal Admin and Site Details selectors/tables |
| Client/Site | `registry.ts`; explicit WAEPA records in `waepa.ts` | legacy `config/clients/*` remains the effective runtime adapter |
| Association/SiteAssociation | `associations.ts` | Membership selection and effective branding resolvers |
| Global Rules table | all 86 pre-existing rows in `content/docs/siteRules.ts`, plus additive conditional rows | `GlobalSiteDetailsPanel` through `RuleReferenceList` |
| Site Rules table | `getApplicableSiteRules` (global + matching Client/Site scope) | `ClientSiteDetailsPanel` |
| Overrides | `summarizeClientOverrides`, derived from page/field/coverage/flow/config resolvers | separate Overrides view in Client Site Details; never converted to Rules |
| Executable conditions | `config/conditions/conditions.ts` | PageSection/Field visibility and readable Rules condition details |
| Fields | `fieldCatalog` definitions + `pageFieldOrder` placement | `resolvedFieldRegistry` applies Client/Site configuration for runtime, rules, and documentation |

## Executable application behavior

```text
FieldDefinition
  = WHAT a field is

ScopedFieldOverride
  = HOW a field differs for a Client/Site scope

pageFieldOrder / pageSections
  = WHERE a field is placed

ConditionDefinition
  = WHEN an executable condition is true

Field/PageSection visibilityConditionId
  = WHERE a visibility condition applies

ApplicationTransitionDefinition
  = WHAT application values/state change when an application event occurs

ApplicationFormContext
  = runtime application value owner + persistence boundary
```

`config/applicationTransitions` owns Quote Apply and Contact carry-forward mappings. Its pure
executor applies stable Field IDs, typed structured coverage-state targets, and overwrite policy.
React collects source values, invokes the transition, and gives the result to
`ApplicationFormContext`; only the context hydrates and persists `applicationFormValues`.
`DevTools.tsx` is the sole intentional raw-storage exception: its reset/jump/debug controls must
replace or inspect arbitrary stored pages rather than perform normal application business behavior.

`config/coverageQuestionRequirements.ts` is the single canonical coverage-category → application
question Field-ID relationship. Member/spouse applicability is explicit, convenience flags are
derived, and `hideSmokerQuestion` is a filter over that relationship rather than a second category map.

Field presentation such as currency formatting lives on `FieldDefinition.format`. Conditional
section styling lives on `PageSection.presentation`; neither renderer infers those properties from
Field IDs or Condition IDs.

```text
formFlow
  = ordered application page sequence

FlowGateDefinition
  = canonical business requirements controlling page participation

getClientPageRequirement
  = Client-specific page enablement

flow resolver
  = Client page enablement AND FlowGateDefinition

navigation/progress helpers
  = consumers of resolved page participation
```

`config/flowGates.ts` canonically defines the Beneficiary, underwriting, category, and selected-rider
page gates. `resolvePageParticipation` composes those gates with Client page requirements; ungated pages
participate unless Client configuration sets them to `none`. `shouldSkipPage` is now only the negated
compatibility API consumed by ordered navigation and progress filtering.

`FlowGateDefinition != ConditionDefinition`: conditions are predicates attached to fields and sections,
while flow gates determine whether whole pages participate in navigation. No generic workflow engine or
condition effect is needed for the current gates.

Before this phase, manually documented Rules came only from `siteRules.ts`. The Client Rules table
did not contain behavioral rules: it converted `summarizeClientOverrides(...)` output into rule-shaped
rows. That information is now preserved under **Overrides**, while actual applicable Rules are derived
from the rule inventory.

The audit found executable legacy visibility objects in PageSections and Membership extra fields. It also
found imperative visibility in `Membership.tsx` for AMA/WAEPA and in `Eligibility.tsx` for the AMA
dependent-option suppression. All field and PageSection conditional visibility now references canonical
ConditionDefinitions; the legacy executable property, evaluator, and runtime fallback have been removed.
Imperative logic intentionally retained includes validation, value-clearing, TPA verification,
association-link errors, applicant coverage gates, dependent option suppression, dynamic-list behavior,
coverage-category configuration gates, and presentation/layout selection; these are not duplicates of
the migrated field-answer show/hide rules.

## Domain hierarchy

```text
TPA
 └── Client
      ├── Association
      └── Site
           └── SiteAssociation ──> Association
```

TPA, Client, Site, and Association are independent identities even when current data happens to be
1:1. A Client has exactly one `tpaId`; Site and Association do not point directly to TPA. Because no
authoritative shared TPA grouping exists in the current project data, every current Client is mapped
to a deterministic `tpa-{clientId}` compatibility TPA. Those records are marked `provisional` and do
not copy Client support or branding. All mappings require business confirmation; no unrelated Clients
were grouped by name or appearance.

## Rules architecture

```text
RuleDefinition (business-readable requirement)
 └── optional conditionIds ──> ConditionDefinition (executable WHEN expression)

PageSection / Field (executable WHERE target)
 └── visibilityConditionId ──> ConditionDefinition
```

- Behavioral Rules remain valid without a ConditionDefinition.
- Conditional Rules reference one or more canonical `condition-*` IDs.
- Rule scope is `global`, `client`, or `site`; applicability is derived.
- `RuleDefinition` is the single Rule schema and carries condition and scope IDs.
- Site-specific enable/disable assignments are intentionally not modeled: no current requirement
  overrides a Rule's derived scope for one Site. Add an override relationship only when that use case exists.
- A ConditionDefinition owns only the predicate (WHEN), while each PageSection or Field owns its
  `visibilityConditionId` target relationship (WHAT is shown). Conditions do not store effects.
- Applicant targeting remains on the PageSection target (`applicant: self | spouse | child`). A shared
  predicate can therefore drive multiple applicant-specific targets without turning applicant identity
  into Site scope. The post-Coverage applicant-applying gate remains a separate structural check.
- Rule scope controls where a condition is applicable: global rules apply everywhere, while `clientIds`
  and `siteIds` constrain client- and Site-scoped rules. Executable Site-specific fields are registered
  only for their resolved Site, preventing sibling Sites such as `waepa-gi` from inheriting WAEPA rules.
- The runtime and documentation read the same ConditionDefinition records, and documentation derives
  target descriptions from PageSections and the resolved all-page/all-Site Field registry rather than
  storing a second target list or knowing about Membership configuration directly.
- No legacy executable visibility definitions or runtime consumers intentionally remain. Documentation
  tables may still use “Visible when” as a human-readable column label; that is derived output, not a
  second condition mechanism.
- Overrides describe effective configuration differences and are not automatically Rules.
- Derived applicable rules, visible sections, visible fields, and override summaries are never
  manually duplicated.

The five custom Membership rules were scoped from their executable field assignments, not merely
from shared Client ownership:

| Rule family | Scope | Evidence |
| --- | --- | --- |
| AMA spouse physician information | Site: `ama-default` | Conditional AMA fields have canonical Site-scoped overrides only for `ama-default` |
| Four WAEPA membership/qualification rules | Site: `waepa-standard` | Conditional WAEPA fields have canonical Site-scoped overrides only for `waepa-standard`; `waepa-gi` has none |

This prevents a sibling Site from inheriting custom behavior solely because it belongs to the same
Client. A future rule should use Client scope only when every current and future Site of that Client
is intended to inherit it.

## Field resolution architecture

```text
fieldCatalog (canonical definition and stable ID)
    ↓
pageFieldOrder (page placement and base order; IDs only)
    ↓
ScopedFieldOverride[] (global → Client → Site precedence)
    ↓
resolvedFieldRegistry
    ↓
resolved field
    ↓
runtime rendering / conditions / rules / documentation
```

- A field definition owns control metadata such as label, input type, options, and validation flags.
  `pageFieldOrder` owns only placement and ordering; it does not duplicate definitions.
- `ScopedFieldOverride` contains a field/page identity, explicit scope, optional scoped inclusion or
  exclusion, and only the definition values that differ. Absent properties inherit the canonical field.
- Override precedence is deterministic: base definition, then global, Client, and Site overrides;
  authoring order is stable within one scope. Site values therefore win over Client values.
- `ClientConfig.fields` remains an input-only compatibility shape. `normalizeClientFieldOverrides`
  converts its `extra`, `hidden`, `required`, and `overrides` values before resolution; the registry
  does not interpret that schema.
- `getResolvedFieldsForSite` is the runtime discovery API. The full registry and documentation resolver
  consume the same effective fields and inclusion/status metadata.
- Applicant grouping remains PageSection layout metadata. Section field IDs must reference canonical
  page placements, and resolved definitions retain the same stable IDs.
- Membership uses ordinary canonical fields plus Site-scoped `ScopedFieldOverride` records. The former
  Membership-specific field configuration and merge branch are removed; `waepa-gi` receives only its
  own title override and cannot inherit `waepa-standard` fields.
- The former `pageFields` inventory and `getPageFields` adapter are removed. Historical architecture
  notes may retain the old name when describing the superseded design.

The inventory found other field-shaped structures but did not migrate them: `pageSections` is canonical
layout/applicant metadata; page-local catalog selections in Eligibility, Payment, and Review are derived
runtime composition; custom documentation rows describe controls that are not ordinary form fields; and
dynamic association option resolution remains a derived runtime transformation, not an authored field
override.

## Normalized Client/Site/Association layer

This directory is the incremental canonical relational layer shared by the runtime and Portal Admin.
Legacy `ClientConfig` consumers remain supported through adapters while identity and relationships move
to stable Client, Site, and Association IDs.

**Client, Site, and Association are separate domain identities even when they happen to be 1:1.**

## Canonical identities and relationships

```text
Client
 ├──< Site
 └──< Association

Site ──< SiteAssociation >── Association
```

- `Client.id` identifies the customer/account.
- `Site.id` identifies a deployment or application experience.
- `Association.id` identifies the membership organization independently of Client and Site.
- `SiteAssociation.id` is deterministic (`{siteId}--{associationId}`) and enables an Association for a Site.
- `Association.clientId`, `Site.clientId`, `SiteAssociation.siteId`, and
  `SiteAssociation.associationId` are validated relational IDs.
- A Site can only expose Associations owned by its Client.

## Association selection and active context

A Site may configure one of three selection modes:

- `fixed`: resolves a configured Association directly; no selection control is shown.
- `url-parameter`: validates the documented `association` value against enabled Site relationships.
  Missing or invalid required values return an explicit blocking state; arbitrary URL text is never
  displayed or converted into an asset path.
- `select`: generates the Membership searchable-select options from `getAssociationsForSite(siteId)`.
  The submitted Association ID becomes the active Association in the existing application context.

`resolveAssociationSelection` is the pure domain resolver. Browser/form adapters supply the URL and
form values to `resolveActiveAssociation`; UI components consume the result rather than implementing
selection independently.

Association branding is separate from Association data. A Site may opt into
`associationBranding.useAssociationLogo`. Effective branding resolves in this order:

```text
Client branding → Site branding override → active Association logo (when enabled) → effective branding
```

If the active Association has no logo, the resolver safely retains the effective Site/Client logo.

## ISITRUST and WAEPA proof cases

- All 25 formerly hardcoded ISITRUST Membership options are canonical Association records and
  SiteAssociation records. `isitrust-default` uses `select` mode; its field options are derived at runtime.
- WAEPA has one canonical Association record. Both `waepa-standard` and `waepa-gi` use `fixed` mode and
  reference that same record, proving one Client → many Sites → one shared Association.
- AMA, ASCE, and AVMA have fixed canonical Associations where the full identity is explicit in current data.
  Other legacy clients remain unconfigured rather than inventing Association names.

## Current source-of-truth audit

| Business concept | Current canonical/runtime source | Parallel or derived representation |
| --- | --- | --- |
| Clients and Sites | `registry.ts`; WAEPA authored in `waepa.ts` | Other clients adapt `config/clients/*.ts`; `clientGroups.ts` remains legacy |
| Associations and Site relationships | `associations.ts` and registry relationship APIs | Membership field options are derived, not authored |
| Active Association and branding | `associationSelection.ts`, `activeAssociation.ts`, `resolvers.ts`, existing application context | None for Association selection; legacy ClientConfig still supplies non-Association defaults |
| Pages, groups, and progress | Existing `src/config` registries | Documentation resolvers add display metadata |
| Fields | `fieldCatalog`, `pageFieldOrder`, `fieldOverrides.ts`, and `resolvedFieldRegistry.ts` | `ClientConfig.fields` remains an input-only adapter normalized at the registry boundary |
| Rules/conditions | `content/docs/siteRules.ts`; `config/conditions` | applicable Rules and readable expressions are derived |
| Coverage/config/flows | Existing normalized Phase 1 registries and resolvers | Several legacy/config documentation representations remain |
| CMS and content | `SiteId`-keyed content overrides, CMS entries, and content builders | Legacy-client adapter retained only for design previews |
| Email | `SiteId`-keyed preview generation and persistence | Legacy stored previews are upgraded through a compatibility adapter when read |

## Compatibility retained

- `getActiveClient()` still returns the legacy effective `ClientConfig` for the active Site.
- `resolveClientId()` still returns the Site's legacy runtime ID.
- Runtime-generated links and developer tools emit `?site=`. `?client=` remains a supported read-only compatibility alias.
- `legacyClientId`, the `waepagi` legacy ID, `clientGroups.ts`, and `ClientConfig` remain in place.
- WAEPA's special Membership behavior remains unchanged.
- Association selection changes neither the active Client ID nor the active Site ID.

## Remaining duplicated/parallel sources

1. Page components still consume effective legacy `ClientConfig` through the active-Site adapter while unrelated configuration domains are normalized.
2. `ClientConfig.fields` remains as an authoring compatibility input, but it has no independent runtime merge semantics.
3. `pageSections.ts` repeats field IDs for layout/applicant grouping; its subset relationship to
   `pageFieldOrder` is enforced, but merging those concepts would broaden the page-layout architecture.
4. Configuration definitions, executable defaults/accessors, and flow diagrams remain separately authored. Rule prose is intentionally documentation, linked to executable conditions only where applicable.
5. Single-site Clients other than WAEPA are still adapted from `src/config/clients`.
6. `legacyClientId`, `clientGroups.ts`, and the `waepagi` compatibility ID remain until configuration consumers no longer require `ClientConfig`.

## Phase 3 runtime migration

Content overrides/builders, CMS inspection, email previews, resume links, prototype links, coverage-note
overrides, membership overrides, cross-Site page discovery, and developer Site switching now use `SiteId`.
Association-aware runtime copy and email payloads resolve the active canonical Association independently
from Client and Site identity. Stored email previews written before this migration are mapped to a Site
when read. Compatibility-only structures have not been removed while configuration consumers still need them.

## Recommended next phase

Move the remaining single-site clients into explicit Client defaults plus Site overrides, migrate page
components from the effective `ClientConfig` adapter to domain-specific Site resolvers, and then retire
`clientGroups.ts`, `clientGroupId`, `siteLabel`, the `waepagi`
legacy ID, and `resolveClientId()` only after their final consumers have moved. Confirm provisional TPA
records with an authoritative business source before grouping any Clients or adding TPA branding/support.
