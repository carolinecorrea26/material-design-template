# Global → Override → Effective: Documentation Architecture Audit

> Historical audit record. Its `pageFields`/`getPageFields` findings and decisions describe the
> architecture at that phase and are superseded by the canonical field-resolution architecture in
> `src/data/README.md`.

**Status:** Phase 1 (audit) complete. Phase 2 (resolver implementation) complete — see §8. Phase 2b (D1/D2 follow-up decisions) complete — see §8.6. Phase 3 (Global Site Details restructure) complete — see §9. Phase 4 (Client Site Details restructure) complete — see §10. Phase 5 (Global Flow Architecture / React Flow visualization) complete — see §11. Per-client flow resolution (Phase 6) remains out of scope.
**Scope:** Internal documentation data model (Site Details / Client Site Details), not the runtime application itself, though the two share the same underlying config sources.

## 1. Current-state findings

### 1.1 What exists today

Two documentation pages, both under `src/pages/`:

- **`SiteDetails.tsx`** (785 lines) — "Global Site Details." Renders Flows, Behavioral Rules, Validation, Configurations, URL Parameters, and Features as modal sections, plus a client picker that links into Client Site Details. All content is imported pre-built from `src/content/docs/*.ts`.
- **`ClientSiteDetails.tsx`** (1468 lines) — "Client Site Details." Renders Pages, Fields, Coverage, URL Parameters, and Configurations for one active client, with overrides highlighted in yellow. This is the file that actually performs Global+Override→Effective resolution today, entirely inline in the component.

Backing content lives in `src/content/docs/`: `configurations.ts`, `features.tsx`, `flows.ts`, `siteRules.ts`, `fieldRows.ts`, `urlParameters.ts`, `errorMessages.ts`, plus non-audit-scope files (`changeLog.ts`, `componentInventory.ts`, `contentRows.ts`, `portalProject.ts`, `templateChanges.ts`, `parkedIdeas.ts`).

Rendering helpers live in `src/components/docs/`: `ConfigReferenceList.tsx`, `RuleReferenceList.tsx`, `ClientNote.tsx`, `SectionAccordion.tsx`, etc. — presentational only.

Runtime config/resolution sources (the actual global template + override data, also consumed by the live application, not just the docs):

- `src/config/clients/*.ts` — one `ClientConfig` object per client (branding, support, pages, coverages, fields, features, etc.), typed by `src/config/clients/types.ts`.
- `src/config/client/*.ts` — `getActiveClient`, `resolveClientId`, `getClientPageRequirement`, `getActiveClientCoverages`/`getClientCoverages`, `findClientIdUnlockingPage`.
- `src/config/fields/` — `fieldCatalog` (global field definitions), `pageFields.ts` (flat page→fieldId[] registry used by the **runtime** form flow via `getClientPageFields`), `getPageFields.ts`.
- `src/config/clientFields/` — `getClientPageFields.ts` (merges `pageFields` + `ClientConfig.fields[pageId]` at runtime), `membership.ts` (a **second, parallel** per-client field-override mechanism, keyed directly by `ClientId`, independent of `ClientConfig.fields`).
- `src/config/pageSections/pageSections.ts` — a **second** page→field registry, section-grouped with `visibleWhen` rules and applicant scoping. Used by the real page components (`Coverage.tsx`, `Eligibility.tsx`, `Profile.tsx`, `Contact.tsx`, `AdvisorLogin.tsx`, `CoverageQuestions.tsx`) *and* by the docs' `fieldRows.ts`.
- `src/config/coverages/index.ts` + `types.ts` — global `CoverageDefinition[]` catalog; `getClientCoverages`/`getActiveClientCoverages` resolve it against `ClientConfig.coverages`.
- `src/config/coverageQuestionRequirements.ts` and `src/config/coverageConstants.ts` — canonical category-question requirements and max-aggregate-note resolution; `hideSmokerQuestion` filters the canonical question relationship.
- `src/config/formFlow.ts`, `pages.ts`, `pageGroups.ts`, `progressSteps.ts` — global page graph and stepper.

### 1.2 What the audit confirms works well

- `ClientConfig` (`clients/types.ts`) is a genuinely well-structured override schema — every override field is `Partial`/optional and the intent ("this is additive/subtractive over a global baseline") is mostly clear from the types alone.
- `getClientCoverages` / `getActiveClientCoverages` is close to a correct resolver: pure function, takes global catalog + client override, returns merged effective objects. It's a reasonable model for what `ResolvedCoverage` resolution should look like everywhere else.
- `configurations.ts` already states the intended principle in its own header comment (don't duplicate `featureStatusDisplay` because it "belongs conceptually with features.ts") — the instinct behind the requested architecture is already present in the codebase, just not applied consistently.

## 2. Sources of duplication

| # | Duplication | Detail |
|---|---|---|
| D1 | **Two page→field registries** | `pageFields.ts` (flat array, drives the real runtime form via `getClientPageFields`/`RoutePage.tsx`) and `pageSections.ts` (section-grouped, drives real page components for Coverage/Eligibility/Profile/Contact/AdvisorLogin, *and* drives the docs' field table). Eligibility, for example, is registered in **both**. Neither references the other; a field added to one and not the other silently diverges from what's documented vs. what's rendered. |
| D2 | **Two client field-override mechanisms** | `ClientConfig.fields[pageId]` (extra/hidden/required/overrides — the documented, typed mechanism) vs. `membershipClientFields` in `clientFields/membership.ts` (a parallel, `ClientId`-keyed map used only for the Membership page, with its own `showTitleField` flag not modeled in `ClientConfig` at all). `ClientSiteDetails.tsx` has to special-case Membership (`applyMembershipClientFieldDiff`) because it doesn't fit the general `applyClientFieldDiff` path. |
| D3 | **Configuration narrative vs. runtime values** | `configurations.ts` describes each `ClientConfig` property's meaning/allowed values in prose (e.g. "Selects an approved MUI theme token set... default, teal, purple, dark-blue") but does not read `clients/*.ts` to check which clients actually use which values — it's authored text, not derived. If a new theme token is added to `ThemeColorId` without a matching prose update, the two silently drift (this already nearly happened: `themeColorLabel` in `ClientSiteDetails.tsx` is a second, independent copy of the same four-value enum). |
| D4 | **Coverage business-rule ownership consolidated** | `coverageQuestionRequirements.ts` owns category → question Field IDs; `hideSmokerQuestion` is an explicit filter and documentation describes the same configuration rather than defining it. |
| D5 | **Page visibility/requirement logic duplicated between runtime and docs** | `getClientPageRequirement` is the one true resolver for beneficiary/payment inclusion, but `ClientSiteDetails.tsx::getPageVisibleWhen` re-derives visibility text for *every* page (including hardcoded health-page and legacy-array logic) directly in the component, rather than calling a shared "resolve this page's effective visibility" utility that both the router and the docs could share. |
| D6 | **Static maps duplicating page metadata already in `pages.ts`/`pageGroups.ts`/`progressSteps.ts`** | `ClientSiteDetails.tsx` hardcodes `pageStepLabel`, `pageBreadcrumbLabel`, and `applicationPageOrder` as literal `PageId → string` maps rather than deriving them from `progressSteps.ts`/`formFlow.ts`, which already encode this same sequencing/grouping information for the runtime app. |
| D7 | **`configurationsData` mixes global-static and per-client-configurable rows in one flat list**, disambiguated only by a free-text `configurable` string ("Client Configurable" vs "Globally defined" vs "Static" vs "Globally Controlled" vs "Client / Product Configurable" — five overlapping-but-not-enumerated values). `SiteDetails.tsx` and `ClientSiteDetails.tsx` each filter/consume this same array differently (`clientConfigurableRows` vs. full list), which only works because of a naming convention (`.startsWith("Client")`), not a type. |
| D8 | **`themeColorLabel` in `ClientSiteDetails.tsx`** duplicates the `ThemeColorId` union already declared in `clients/types.ts` — new theme values require editing three places (`types.ts`, `theme.ts`, and this label map) to stay consistent. |

## 3. Proposed Global → Override → Effective model

```
GLOBAL TEMPLATE  +  CLIENT OVERRIDE  =  EFFECTIVE (per client)
```

Applied per concept:

- **Pages**: global = `pages.ts`/`formFlow.ts`/`pageGroups.ts`/`progressSteps.ts`. Override = `ClientConfig.pages.requirements` (+ deprecated `excluded`/`optional` arrays) and coverage-driven health-page unlocking. Effective = `ResolvedPage` (below), computed once per client instead of re-derived inline in the docs component.
- **Fields**: global = `fieldCatalog` + (`pageFields.ts` **or** `pageSections.ts`, once unified — see §6). Override = `ClientConfig.fields[pageId]` (extra/hidden/required/overrides), with the Membership special case folded into the same shape. Effective = `ResolvedField`.
- **Coverage**: global = `coverages/index.ts` catalog. Override = `ClientConfig.coverages` (`enabled`, `ranges`, `descriptions`, `overrides`, category settings). Effective = `ResolvedCoverage` — `getClientCoverages` already computes almost exactly this; it should become the canonical resolver both the app and the docs call, and its return type should become `ResolvedCoverage[]`.
- **Configuration options**: global = `configurationsData` (describes what a setting *means*, its shape, and where it's read) — this is documentation *about* the schema, not a per-client value. Override/Effective = the client's actual value for that setting, read live from `ClientConfig`/`clients/*.ts` at doc-render time instead of re-typed as prose.

### 3.1 Status vocabulary

Each resolved item carries one status, consistently:

- `inherited` — no client override exists; value comes straight from global.
- `overridden` — a client override exists and changes the global value/inclusion.
- `disabled` — explicitly excluded for this client (page `requirement: "none"`, field `hidden`, coverage not in `enabled`).
- `client-specific` — exists only for this client, with no global counterpart (client-added field, client-only coverage rider, WAEPA/AVMA-prefixed fields).

## 4. Proposed shared resolved types

Kept as distinct, domain-shaped types (not one universal generic) per the phase's explicit instruction — each still follows the same `global`/`override`/`effective`/`status` shape so they read as one family.

```ts
type ResolutionStatus = "inherited" | "overridden" | "disabled" | "client-specific";

// --- Pages -----------------------------------------------------------------
interface ResolvedPage {
  id: PageId;
  global: {
    title: string;
    path: string;
    category: "application" | "resume" | "advisor" | "internal";
    step?: string;        // from progressSteps.ts
    breadcrumb?: string;  // from pageGroups.ts / formFlow.ts
  };
  override?: {
    requirement?: ClientPageRequirement; // beneficiary/payment only, today
    unlockedByCoverage?: boolean;        // health-* pages
  };
  effective: {
    included: boolean;
    requirement: ClientPageRequirement; // "required" default when no override
    visibleWhen: string; // human-readable, derived not hand-authored
  };
  status: ResolutionStatus;
}

// --- Fields ------------------------------------------------------------------
interface ResolvedField {
  fieldId: FieldId;
  pageId: PageId;
  global?: FieldDefinition;               // absent for client-specific fields
  override?: Partial<FieldDefinition> & { hidden?: boolean; required?: boolean };
  effective: FieldDefinition;              // global merged with override
  status: ResolutionStatus;
}

// --- Coverage ------------------------------------------------------------------
interface ResolvedCoverage {
  id: CoverageId;
  global?: CoverageDefinition;             // absent only if catalog entry removed
  override?: ClientCoverageOverrides & { coverageAmounts?: CoverageAmountAssignment[] };
  effective: CoverageDefinition;            // same shape getClientCoverages already returns
  status: ResolutionStatus;
}

// --- Configuration options (schema-level, not a resolved runtime value) -----
interface ResolvedConfiguration {
  key: string;                 // e.g. "ClientConfig.theme"
  group: string;
  global: {                    // description of the setting itself
    description: string;
    sourcePath: string;
    allowedValues?: string[];
  };
  override?: unknown;          // this client's actual configured value, read live
  effective: unknown;          // override ?? documented default
  status: ResolutionStatus;
}
```

`ResolvedConfiguration` is intentionally the loosest of the four — "configuration options" is a schema-description concept, not a per-instance override like the other three, which is exactly why `configurations.ts` should stop trying to also carry per-client values (see source-of-truth matrix, row for Configurations).

## 5. Authoritative source-of-truth matrix

| Concept | Global source (authoritative) | Client override source (authoritative) | Effective value = | Descriptive documentation belongs in | Duplicate to remove/convert |
|---|---|---|---|---|---|
| Pages | `pages.ts`, `formFlow.ts`, `pageGroups.ts`, `progressSteps.ts` | `ClientConfig.pages.requirements` (+ deprecated `excluded`/`optional`) | `resolvePage(pageId, client)` (new, wraps `getClientPageRequirement` + health-unlock check) | New `ResolvedPage`-producing utility; docs render its output only | `ClientSiteDetails.tsx`'s `getPageVisibleWhen`, `pageStepLabel`, `pageBreadcrumbLabel`, `applicationPageOrder` — convert to calls into `progressSteps.ts`/`formFlow.ts` |
| Fields | `fieldCatalog` (`config/fields/index.ts`) + page registry | `ClientConfig.fields[pageId]`; **once merged**, also today's `membershipClientFields` | `resolveFieldsForPage(pageId, client)` (generalization of `applyClientFieldDiff`) | Field catalog entries themselves (labels/help text describe the field); no separate prose doc needed | `fieldRows.ts`'s duplicate visibility-formatting logic once a shared resolver exists; `membershipClientFields` merged into `ClientConfig.fields.membership` |
| Coverage/Products/Riders | `coverages/index.ts` catalog | `ClientConfig.coverages` | `getClientCoverages(client)` (already close to canonical — promote it) | `coverages/index.ts` per-product `description`/`definition` fields | `ClientSiteDetails.tsx`'s inline `clientCoverageRows` construction — should call `getClientCoverages` and format its output, not re-implement the merge |
| Page requirements (beneficiary/payment) | Default `"required"` in `getClientPageRequirement.ts` | `ClientConfig.pages.requirements` | `getClientPageRequirement(pageId)` (already canonical) | N/A — logic is documentation-complete via types | Deprecated `pages.excluded`/`pages.optional` arrays — remove once no client config still sets them |
| Field overrides | `fieldCatalog` | `ClientConfig.fields[pageId]` | `applyClientFieldDiff` (already close to canonical) | N/A | — |
| Coverage overrides | `coverages/index.ts` | `ClientConfig.coverages.overrides` / `.ranges` / `.descriptions` | `getClientCoverages` | N/A | — |
| URL parameters | `urlParameters.ts` (spec/behavior) | `ClientConfig.urlParametersInUse` | set membership (`inUse = urlParametersInUse.includes(param)`) | `urlParameters.ts` | none found — this one is already modeled correctly |
| Rules (behavioral) | `siteRules.ts` | none — rules are explicitly "global, not affected by client configuration" (per `SiteDetails.tsx` copy) | n/a (no per-client resolution) | `siteRules.ts` | none |
| Validation | `errorMessages.ts` (+ `fieldRows.ts`'s `FORMAT_VALIDATION_MESSAGE`) | none currently modeled per-client | n/a | `errorMessages.ts` | `FORMAT_VALIDATION_MESSAGE` duplicates format-triggered messages already implied by `FieldDefinition.format`; consider generating from field catalog instead of a hand-kept parallel map |
| Features/capabilities | `features.tsx` (`featuresData`) | none — features are described as global capabilities, not per-client toggles | n/a | `features.tsx` | none, but note `ClientConfig.features` (chat/schedule/homePageVariant/etc.) is a *different, unrelated* "features" concept from `featuresData` — naming collision worth resolving in Phase 2 |
| Flows | `flows.ts` | none (flows are global journeys) | n/a | `flows.ts` | none |
| Configurations (schema description) | `configurations.ts` | *(should not exist as separate per-client values — read live from `ClientConfig`)* | `override ?? documented default`, read from live client object | `configurations.ts` | `themeColorLabel` in `ClientSiteDetails.tsx` (duplicates `ThemeColorId`); any future prose that restates a specific client's actual configured value instead of linking to it |
| Client identity | `clients/types.ts` (shape) | `clients/*.ts` (values) | the client object itself — no separate resolution needed | `configurations.ts`'s "Client identity & branding" group | none — this row is the simplest correct example already |

## 6. Logic that should be extracted from UI components (Phase 2 candidates)

All found in `src/pages/ClientSiteDetails.tsx` unless noted:

1. `getPageVisibleWhen()` — page-visibility resolution — should become a shared `resolvePageVisibility(pageId, client)` utility, callable from both docs and (eventually) the router.
2. The `clientCoverageRows` construction block (lines ~131–200) — re-implements what `getClientCoverages` already does, then adds presentation formatting on top. Split into: (a) call `getClientCoverages`, (b) a pure `formatCoverageRow()` presentation function.
3. `getPageCategory()`, `pageStepLabel`, `pageBreadcrumbLabel`, `applicationPageOrder` — static page-metadata maps that duplicate `pageGroups.ts`/`progressSteps.ts`/`formFlow.ts`. Should be derived, not re-authored.
4. `handlePageLinkClick`'s health-page-unlock redirect logic — reasonable to stay component-local (it's a UI affordance, not a documentation fact), but the "does this client's catalog unlock this page" check should call the same resolver as `findClientIdUnlockingPage` rather than re-checking `coverageUnlocksPage` inline.
5. In `src/content/docs/fieldRows.ts`: `applyClientFieldDiff` and `applyMembershipClientFieldDiff` are two parallel implementations of the same concept (page-level field diffing) purely because Membership uses a different override mechanism (D2 above). Once `membershipClientFields` is folded into `ClientConfig.fields`, these collapse into one function — this is the clearest, lowest-risk first unification for Phase 2.
6. `themeColorLabel` map — replace with a single labeled-enum source next to `ThemeColorId` in `clients/types.ts`.
7. `SiteDetails.tsx`'s `clientConfigurableRows` filter (`row.configurable.startsWith("Client")`) — string-convention-based filtering should become a typed field on `ConfigRow` (e.g. `configurable: "client" | "global" | "static"` union) once `ResolvedConfiguration` exists.

## 7. Recommended migration sequence (Phase 2+, not performed now)

1. **Type the `configurable` field** on `ConfigRow` as a union instead of free text (low risk, unblocks D7).
2. **Fold `membershipClientFields` into `ClientConfig.fields.membership`**, adding `showTitleField` to `ClientFields`'s type; delete `applyMembershipClientFieldDiff` in favor of a generalized `applyClientFieldDiff` (resolves D2, item 5 above).
3. **Promote `getClientCoverages` to the canonical `ResolvedCoverage` resolver** and have `ClientSiteDetails.tsx` consume it instead of re-deriving `clientCoverageRows` inline (resolves D4 partially, item 2 above).
4. **Introduce `resolvePageVisibility(pageId, client)`** wrapping `getClientPageRequirement` + health-unlock logic; replace `getPageVisibleWhen` (resolves D5, item 1).
5. **Reconcile `pageFields.ts` vs. `pageSections.ts`** (D1) — this is the highest-effort, highest-risk item: determine whether every page should move to the section-based model (richer, already used by more pages and by docs) or whether the flat model should absorb section metadata. Needs a decision before any resolver work touches fields further.
6. **Derive `configurations.ts`'s per-client examples live** instead of prose, once `ResolvedConfiguration` exists — lowest priority since current prose is accurate today, but drifts silently (D3, D8).
7. Only after 1–6: introduce the `ResolvedPage` / `ResolvedField` / `ResolvedCoverage` / `ResolvedConfiguration` types formally and have both `SiteDetails.tsx` and `ClientSiteDetails.tsx` render from resolver output exclusively — no inline resolution left in either component.

No React Flow, no UI redesign, and no section removals are implied by this sequence — each step is a data/logic relocation behind the existing UI.

## 8. Phase 2 — implemented resolvers

Phase 2 executed migration-sequence items 1, 3, and 4 in full, item 7 partially (typed classifier introduced; `ConfigRow.configurable` itself is still free text), and left item 2 (Membership field-mechanism merge) and item 5 (`pageFields.ts` vs. `pageSections.ts` reconciliation) untouched, as flagged in §7 as needing a prior team decision. No React Flow, no UI redesign — `ClientSiteDetails.tsx`'s JSX, columns, and highlighting are unchanged; only the data preparation above the `return` was replaced.

### 8.1 Resolver locations

All new code lives in `src/config/resolvers/` (barrel: `src/config/resolvers/index.ts`):

| Resolver | File | Wraps / promotes |
|---|---|---|
| `resolveClientPages(client)` | `resolveClientPages.ts` | New — replaces `ClientSiteDetails.tsx`'s inline `getPageVisibleWhen`/`pageStepLabel`/`pageBreadcrumbLabel`/`applicationPageOrder`/`getPageCategory`. Step/breadcrumb are now derived from `progressSteps.ts` (page→step membership) and `getPageNavTitle` (the same content source the real applicant-facing breadcrumb, `ProgressStep.tsx`, reads) instead of a hand-authored per-page map. |
| `resolvePageVisibility(pageId, client)` | `resolveClientPages.ts` | New — the per-page Global→Override→Effective computation `resolveClientPages` calls for every page; also usable standalone. |
| `resolveClientCoverage(client)` | `resolveClientCoverage.ts` | Promotes `getClientCoverages` (`config/client/getActiveClientCoverages.ts`, unchanged) to the canonical merge step, adds the full catalog (including disabled coverages, which `getClientCoverages` doesn't return), status, and `healthPagesUnlocked`. |
| `resolveClientFields(client)` / `resolveClientFieldsForPage(pageId, client)` | `resolveClientFields.ts` | Wraps the existing pure functions in `content/docs/fieldRows.ts` (`getPageFieldRows`, `applyClientFieldDiff`, `applyMembershipClientFieldDiff` — all unchanged) and adds a `status` derived from the diff's own note, so the two field-override mechanisms (`ClientConfig.fields` vs. `membershipClientFields`) present one shape to callers without merging their underlying data (that merge is still migration-sequence item 2, not done). |
| `resolveClientConfigurations(client)` | `resolveClientConfigurations.ts` | New. Also exports `classifyConfigurable`, a typed replacement for the `configurable.startsWith("Client")` string convention (used by both `SiteDetails.tsx` and, previously, `ClientSiteDetails.tsx`). Deliberately partial — see §8.3. |

Supporting, non-resolver changes made to enable the above (all backward-compatible, existing call sites unaffected):
- `config/client/getClientPageRequirement.ts` — added an optional second `client` parameter (defaults to `getActiveClient()`), so resolvers can evaluate an arbitrary client rather than only the active one.
- `config/progressSteps.ts` — exported the previously-module-private `progressSteps` array.
- `config/clients/types.ts` — added `themeColorLabels`, a single labeled-enum source for `ThemeColorId` (migration item 6/D8), replacing the `themeColorLabel` map that used to live in `ClientSiteDetails.tsx`.

### 8.2 Resolved model types

Each lives next to its resolver and is exported from the barrel; all follow the shared `ResolutionStatus` vocabulary (`src/config/resolvers/types.ts`, unchanged from §3.1):

- `ResolvedPage` — `{ id, global: { title, path, category, step, breadcrumb }, override?: { requirement }, effective: { included, requirement, visibleWhen }, status }`.
- `ResolvedCoverage` — `{ id, global: CoverageDefinition, override?, effective: CoverageDefinition, status, healthPagesUnlocked, clientDiffs }`. `effective` is exactly what `getClientCoverages` already returned — no new merge logic.
- `ResolvedField` — `{ fieldId, pageId, row: FieldRow, included, status }`. Deliberately reuses the project's existing `FieldRow` (from `content/docs/fieldRows.ts`) as the "effective" shape rather than introducing a parallel `FieldDefinition`-shaped structure, per the phase instruction to reuse real domain models.
- `ResolvedConfiguration` — `{ key, group, label, global: { description, sourcePath, usedIn }, kind, liveValueAvailable, override?, effective?, status }`. The loosest of the four (see §8.3).

### 8.3 `resolveClientConfigurations` — intentionally partial

`configurationsData` rows describe ~40 settings, many backed by `content.*` (client content overlays, not `ClientConfig`) or by static/globally-governed data with no single per-client value to read. `resolveClientConfigurations` maps ~20 rows with an unambiguous `ClientConfig` accessor (branding, support, theme, features, coverages.*, fields, etc.) to a real live value and a computed `overridden`/`inherited` status (comparing against a small `CONFIG_DEFAULTS` table for the handful of enum settings whose "unset" state is a literal string, e.g. `themeColor: "default"`, rather than `undefined`). Rows without a mapped accessor report `liveValueAvailable: false` rather than a fabricated status. `ClientSiteDetails.tsx`'s Configurations section is unchanged (still renders the static `configurationsData` list via `ConfigReferenceList`) because there was no per-client resolution logic in that section to extract — `ConfigReferenceList` takes a flat `ConfigRow[]` and would need a new variant to render `ResolvedConfiguration[]`'s live values, which is UI work for a future phase (see §8.5).

### 8.4 UI logic removed from `ClientSiteDetails.tsx`

- `getPageVisibleWhen`, `pageStepLabel`, `pageBreadcrumbLabel`, `applicationPageOrder`, `getPageCategory` — deleted; `resolveClientPages` now supplies `global.step`/`global.breadcrumb`/`global.category`/`effective.visibleWhen` directly, and `applicationPageOrder` is imported from the resolver module (derived as `["home", ...formFlow]` instead of re-authored).
- The inline `clientCoverageRows` construction (global-catalog lookup + range/override merge, ~70 lines) — replaced by `resolveClientCoverage(activeClient)` plus a small local `formatCoverageRow` presentation function (string joins/formatting only, per the migration doc's suggested split).
- The inline `fieldsByPage` construction's calls to `getPageFieldRows`/`applyClientFieldDiff`/`isClientSpecificField`/`pagesWithNoFields` — now all internal to `resolveClientFields`; the component only shapes the resolver's output for the table/caption.
- `themeColorLabel` — moved to `clients/types.ts` as `themeColorLabels`.
- `SiteDetails.tsx`'s `clientConfigurableRows` filter now calls `classifyConfigurable` instead of `configurable.startsWith("Client")` inline (D7, item 7 — partially: the field itself is still free text, only the read side is typed now).

One behavior fix, not just a relocation: the old inline `healthFlowTriggered` computation checked `coverageUnlocksPage(pageId, base)` — the **global**, pre-override coverage — so a client whose override changes `underwritingType` (e.g. abe's `di-mtd` → `TELE`) never showed the resulting health-page trigger in the docs table. `resolveClientCoverage` checks the **effective** (merged) coverage, matching how `getActiveClientCoverages()`/`coverageUnlocksPage` are actually used elsewhere in this same file (`handlePageLinkClick`). This can change the visible "Health flow triggered" column for clients with underwriting-type overrides; everything else in the Pages/Fields/Coverage tables — columns, highlighting, filtering, sort order — is unchanged.

### 8.5 Remaining duplicated documentation (status after §8.6)

- **D1** `pageFields.ts` vs. `pageSections.ts` — deliberately kept as two separate, hand-maintained files (see §8.6.1 for why); now enforced not to drift via a consistency test rather than merged.
- **D2** `ClientConfig.fields` vs. `membershipClientFields` — still two mechanisms structurally (Membership is still keyed by `ClientId` outside `ClientConfig.fields`), but the two things that made merging them hard — the `showTitleField` flag and the hardcoded per-client conditional-visibility checks — are gone (§8.6.2, §8.6.3). `applyClientFieldDiff`/`applyMembershipClientFieldDiff` in `content/docs/fieldRows.ts` are still two implementations, but they no longer differ in what *kind* of thing they express.
- **Configurations live-value rendering** — `resolveClientConfigurations` exists and is tested, but nothing in the UI consumes it yet; `ConfigReferenceList` only knows how to render static `ConfigRow[]`. Wiring it into `ClientSiteDetails.tsx`'s Configurations section (or `SiteDetails.tsx`) is UI work for a later phase.
- **`ConfigRow.configurable` is still free text** — `classifyConfigurable` parses it defensively (matching the exact previous `startsWith("Client")` predicate so no visible rows changed), but the source data itself hasn't been migrated to a typed union (migration item 1's second half).
- **`categoryOrder`** (pages-table sort) and the `formatAmountRange`/`formatCoverageRow` presentation helpers remain component-local in `ClientSiteDetails.tsx` — reasonable to stay there (pure display formatting, not resolution), noted here only so it isn't mistaken for missed cleanup.

## 8.6 Phase 2b — D1/D2 decisions

Follow-up to §8.5: the team reviewed D1 and D2 and made three decisions, implemented here without a runtime schema migration.

### 8.6.1 D1 — keep `pageFields.ts`/`pageSections.ts` separate, enforce consistency instead of merging

Rejected: mechanically generating one from the other. `pageSections.ts` is semantically a *layout/grouping* concept (title, `applicant` scope, `visibleWhen`); `pageFields.ts` is *page field membership*. Deriving `pageSections` from `pageFields` is impossible (the grouping/visibility data doesn't exist in the flat list); deriving `pageFields` from `pageSections` by flattening is possible, but would require inventing artificial single-field "sections" for pages that don't conceptually have any (Payment, Resume, Resume Code) purely to make every page fit one schema — that changes what a "section" means to solve a data-normalization problem, not a real one.

Decision: keep both, hand-maintained, and add enforcement. `src/config/pageSections/pageSections.consistency.test.ts` asserts every `fieldId` referenced by a page's sections exists in that page's `pageFields.ts` entry. Running it against the real data found one real drift: `pageSections.ts`'s `eligibility.spouseSection` already included `spouse-membership`, but `pageFields.ts`'s `eligibility` entry didn't — meaning that field had no RHF default-value registration on the live Eligibility page. Fixed by adding it to `pageFields.eligibility`. This also revealed that `abe.ts`'s `fields.eligibility.extra: ["spouse-membership"]` was marking an already-global field as client-added; removed the now-incorrect `extra` entry (kept the `overrides.spouse-membership.label` customization, which is still valid — abe genuinely does relabel this field). abe's eligibility docs now correctly show this field as "Overridden: label" instead of "Added for this client · Overridden: label".

Documented, not implemented: a future runtime-architecture phase could unify both into one `PageDefinition { fields: FieldId[]; sections?: PageSectionConfig[] }`, with `sections` (when present) required to subset `fields`. That's a page-schema change touching `RoutePage.tsx`, `getClientPageFields`, and five real page components — explicitly out of scope for the documentation-architecture work in this and prior phases.

### 8.6.2 D2, part 1 — `showTitleField` retired

`showTitleField` was a boolean special-cased in three places (`membershipClientFields`'s type, `getClientPageFields.ts`, `applyMembershipClientFieldDiff`) to do exactly what the generic `overrides[fieldId].hidden` mechanism already does for every other field. It's gone from `ClientPageFieldConfig`/`MembershipClientFieldConfig`, `getClientPageFields.ts`, and `fieldRows.ts`. Every client's `membershipClientFields` entry that used to set `showTitleField: false` now sets `overrides: { title: { hidden: true }, ... }` instead (demo, abe, avma, csea, isitrust, nso, waepa); AMA (`showTitleField: true`) simply has no `title` override, since not-hidden is the field's ordinary default. `waepagi` had no `membershipClientFields` entry at all and relied on `showTitleField ?? false` defaulting to hidden — it now has an explicit entry (`overrides: { title: { hidden: true } }`) so its behavior doesn't change now that the implicit default is gone.

### 8.6.3 D2, part 2 — conditional extra fields generalized via `visibleWhen`

The hardcoded checks in `getClientPageFields.ts` (`client.id === "waepa" && values?.membership !== "new" ? [] : ...`, and the equivalent for `"ama"`/`"spouse"`) are gone. `ClientPageFieldConfig.extraFields` is now typed as `ConditionalFieldDefinition[]` (`FieldDefinition & { visibleWhen?: SectionVisibilityRule[] }`) — reusing the same rule shape `pageSections.ts` already uses, rather than inventing a new rule language. The rule-evaluation logic itself was extracted from `RoutePage.tsx`'s `isSectionVisible` into a shared, tested pure function, `config/pageSections/evaluateVisibilityRules.ts`, used by both `isSectionVisible` (sections) and `getClientPageFields` (extra fields). WAEPA's and AMA's extra-field arrays in `membership.ts` now carry their conditions as data (`visibleWhen: [{ fieldId: "membership", equals: "new" }]` / `"spouse"`) instead of living in application code. Any future client with a similar need expresses it the same way — no code change required.

Docs impact: `applyMembershipClientFieldDiff` has no live form values to evaluate a condition against, so conditional extra fields are still always listed (as before), but their `visibleWhen` column now reads the actual condition (e.g. "membership = new") via the existing `formatVisibleWhen` helper, instead of the previous unconditional "Always visible".

## 9. Phase 3 — Global Site Details restructure

`src/pages/SiteDetails.tsx` (the global, not-scoped-to-any-client documentation page) moved from a flat grid of 7 topic cards — each opening an isolated fullscreen modal with no deep link — to one scrollable, anchored page using `SectionAccordion` + `DocsSidebarNav` (the pattern `ClientSiteDetails.tsx` already used), organized into 4 conceptual peer areas instead of 7 unordered topics. `ClientSiteDetails.tsx` is untouched.

### 9.1 Old section → new section mapping

| Old (modal) | New (anchored subsection) |
|---|---|
| — (didn't exist) | **Application** → Pages, Fields, Coverage (new global-only tables — see §9.2) |
| Flows | **Application** → Flows (moved verbatim) |
| Configurations | **Configuration** → main config table (now shows the *full* `configurationsData`, not just the client-configurable subset) |
| URL Parameters | **Configuration** → URL Parameters (moved verbatim, folded from a top-level peer into a subsection) |
| Behavioral Rules | **Behavior** → Behavioral Rules (moved verbatim) |
| Validation | **Behavior** → Validation (moved verbatim) |
| Features | **Capabilities** (reauthored — see §9.3) |
| Design System | unchanged — still a standalone link card, not part of the 4 areas |

### 9.2 Application — new global (client-independent) tables

Pages/Fields/Coverage didn't exist as global (not-per-client) documentation before this phase — they only existed inside `ClientSiteDetails.tsx`'s per-client resolved views. Building them surfaced one architectural decision, resolved explicitly with the user rather than defaulted:

**Pages** could have reused `resolveClientPages(getActiveClient())` and rendered only `.global` (its fields don't actually read the `client` argument today) — but that was rejected as the wrong dependency direction: Global Site Details must never require an active client to render its baseline, even where a resolver's output happens to be client-invariant *today*. Instead, `resolveClientPages.ts` was refactored to extract a standalone `getGlobalPages(): GlobalPageInfo[]` function (page id/title/path/category/step/breadcrumb, no client parameter at all), which `resolveClientPages` now calls internally as its baseline before diffing overrides on top. `SiteDetails.tsx` calls `getGlobalPages()` directly and has no `getActiveClient()` dependency for this section. `resolveClientPages.test.ts` covers the refactor (`getGlobalPages` describe block) and still passes unchanged for the pre-existing cases.

**Fields** and **Coverage** don't have (and don't need) an equivalent extraction — `resolveClientFields`/`resolveClientCoverage`'s global/effective split only exists *inside* a client diff, so `SiteDetails.tsx` instead reads the pre-diff sources those resolvers already diff against: `getPageFieldRows(pageId)` (from `content/docs/fieldRows.ts`, unchanged, already client-agnostic) for Fields, and the raw `coverages` catalog (from `config/coverages/index.ts`, unchanged) for Coverage — both rendered with no client column, no enabled/disabled framing, no highlighting.

### 9.3 Capabilities — reauthored, not just renamed

`features.tsx`'s 16 `featuresData` rows are unchanged and still the detail layer. A new `content/docs/capabilities.ts` adds 12 higher-level `Capability` entries (`{ id, name, summary, relatedFeatureIds, seeAlso }`) that group those 16 rows under capability-level summaries — Instant Quote & Coverage Shopping, Advisor-Assisted Application, Resume Application, Autosaved Application, Abandoned Lead Follow-up, TPA Member Verification, Health Underwriting, Contextual Help, Online Payment, Online Beneficiary Designation, plus two genuinely new entries with no prior `featuresData` row: **E-sign** and **URL-Driven Entry**.

A new `components/docs/CapabilityList.tsx` renders these as cards: name, summary, a compact "Related: X, Y, Z" caption (feature *names* only — deliberately not a re-rendered mini feature table, per explicit user feedback that Capabilities should stay orientation/cross-reference, not reproduce the old Features section inside every card), and "See also" chips linking to the relevant Application/Configuration/Behavior anchor. "Future enhancements" (parked ideas + InstantID) moved into Capabilities too, but as a visually separate "Future / Planned Capabilities" subsection below the current-capability cards, per user feedback, so parked ideas can't be mistaken for shipped capabilities.

### 9.4 What's still duplicated / left for later

- Capabilities' `seeAlso` links are one-directional — Flows/Configuration/Behavior don't link back up to the capability that references them. Not required now; would need per-subsection "referenced by" metadata.
- The Application → Fields/Coverage tables are new, close cousins of `ClientSiteDetails.tsx`'s per-client Fields/Coverage tables (same underlying data, no client diff). They aren't componentized to share JSX — acceptable duplication for now since the column sets differ (no client/override columns here), same tradeoff already accepted for Pages in Phase 2.
- `ConfigRow.configurable` is still free text (unchanged from §8.5) — Configuration now shows the full list regardless of this, so the classification gap is lower-stakes than before but not resolved.

## 10. Phase 4 — Client Site Details restructure

`src/pages/ClientSiteDetails.tsx` moved from a flat run of seven peer sections (Client information, Site URLs, Pages, Fields, Coverage, URL Parameters, Configurations) to three sections that answer, in order: who/what this client site is, what differs from the Global Template, and what the resulting effective site is. `SiteDetails.tsx` is untouched.

### 10.1 New client page hierarchy

| New section | Contains | Old section(s) it replaces/absorbs |
|---|---|---|
| **Client Overview** | Client information (identity, branding, support), Site URLs (testing/pre-prod/prod/prototype links) | Client information, Site URLs (moved verbatim, one level deeper) |
| **Overrides** | A single digest — one compact block per domain (Pages, Fields, Coverage, Configuration, URL Parameters), each showing an "N of M overridden" count and a list of just the overridden items, linking down to that domain's full table | — (didn't exist before; see §10.2) |
| **Effective Site** | Effective Pages, Effective Fields, Effective Coverage (all moved verbatim, renamed), Effective Configuration (new — see §10.3) | Pages, Fields, Coverage, URL Parameters, Configurations |

Pages/Fields/Coverage's table bodies, columns, filtering, and highlighting are byte-for-byte unchanged from Phase 2/3 — only their section id/title (`pages-table` → `effective-pages-table`, etc.) and nesting (now inside "Effective Site" rather than top-level) changed. No React Flow, no column changes, no removed rows.

### 10.2 Overrides — how counts/statuses are calculated

`src/config/resolvers/summarizeClientOverrides.ts` is a new resolver-summary function, `summarizeClientOverrides(client): OverrideSummaryDomain[]`, exported from the `resolvers` barrel alongside the other four resolvers. It computes the Overrides digest by calling `resolveClientPages`, `resolveClientFields`, `resolveClientCoverage`, and `resolveClientConfigurations` — the exact same four resolver calls `ClientSiteDetails.tsx` already made for Effective Site — and filtering each result to `status !== "inherited"` (configurations further filtered to `status === "overridden"` among `liveValueAvailable` rows, since "inherited" there also covers rows with no live accessor at all). URL parameter overrides use `client.urlParametersInUse` directly (there's no dedicated resolver for this — see the source-of-truth matrix's URL parameters row, unchanged since Phase 1).

No independent comparison logic exists in the summary — it is a filter-and-map over the same resolver output the tables below render, so a page/field/coverage/setting can never show as overridden in one place and inherited in the other. `src/components/docs/OverridesSummary.tsx` renders the result: one block per domain with a count chip, a link to that domain's Effective Site anchor, and a plain list of `{label, detail}` items for whatever's overridden — no table, no highlighting logic of its own (it just reads `overriddenCount > 0` to decide whether to render the highlighted count-chip styling).

### 10.3 Effective Configuration — new, resolver-backed

Previously, `ClientSiteDetails.tsx`'s "Configurations" section rendered the full, client-independent `configurationsData` via `ConfigReferenceList` — exactly the same static list `SiteDetails.tsx` shows, with no per-client value at all (flagged as unresolved in §8.5: "nothing in the UI consumes it yet"). This phase wires it up.

`src/components/docs/ResolvedConfigurationList.tsx` renders `resolveClientConfigurations(activeClient)`'s output (filtered to `liveValueAvailable` rows — 25 of `configurationsData`'s 44 rows have a real `ClientConfig` accessor) as a `Setting | Global | Client override | Effective | Status` table, per the phase's suggested pattern. Overridden rows are highlighted the same yellow used everywhere else in this file (`CLIENT_HIGHLIGHT_BG`/`CLIENT_HIGHLIGHT_BORDER` from `ClientNote.tsx`, not a new color); inherited rows render their override cell as dimmed italic "Inherited" text so overrides read as the exception. A `formatConfigValue` helper renders arbitrary override/effective values (primitives, arrays, small objects) as a compact readable string rather than raw `JSON.stringify` everywhere.

Rows without a live accessor (19 of `configurationsData`'s 44 rows — content-overlay or static/globally-governed settings with no single per-client value, per `resolveClientConfigurations`'s existing doc comment) are not rendered as a second, duplicate table. Instead a single line reports the count and links to Global Site Details' Configuration section for the full schema. URL Parameters' per-client "in use" table (previously its own top-level section) moved into Effective Configuration as a second sub-block, unchanged in content — it's conceptually a per-client configuration value, not its own peer concept.

### 10.4 Duplicated content removed

- The full `configurationsData` prose table (44 rows, identical to what Global Site Details already shows) is no longer duplicated inside Client Site Details — replaced by the 25-row *resolved* table (§10.3) plus a reference link for the remaining 19. `ConfigReferenceList` (the component that rendered the duplicate) is no longer imported by this file at all.
- The Overrides digest is generated from existing resolver output, not hand-authored — there was no prior version of this content to duplicate, but it was built so that adding a future fifth override domain requires only extending `summarizeClientOverrides`, not maintaining two lists in sync.
- The stale `#flows-table` anchor in the intro paragraph (pointing at an id that Phase 3 renamed to `flows-subsection`) was fixed while rewriting that paragraph for the new structure — it now links to Global Site Details' top level instead of guessing a single anchor for a sentence spanning five topics.

### 10.5 Unresolved client-specific edge cases

- `resolveClientConfigurations` is still deliberately partial (§8.3, unchanged by this phase) — settings backed by `content.*` client overlays (hero copy, help content, footer content, etc.) have no live accessor and so never appear as "overridden" in Effective Configuration even when a client clearly customizes them (e.g. every client's hero copy differs). They're covered by the reference-link count, not resolved individually.
- `ConfigRow.configurable` is still free text (§8.5/§9.4, unchanged) — `classifyConfigurable`'s `startsWith("Client")` convention is what `resolveClientConfigurations` uses to decide `kind`, so a future configuration row with inconsistent phrasing could silently be classified as non-client and excluded from `liveValueAvailable` counting.
- The Overrides digest's per-domain items are one-line summaries (page `visibleWhen` text, field `clientNote`, coverage `clientDiffs` joined, a fixed "Overridden from global default" string for configurations). Configuration rows don't show *what* changed in the digest itself (only in the Effective Configuration table below) — acceptable for now since the digest's job is to say *that* something changed and link to the detail, not to duplicate the detail.
- URL Parameters has no dedicated resolver (unchanged from Phase 1's source-of-truth matrix) — `summarizeClientOverrides` and the Effective Configuration URL Parameters table both independently read `client.urlParametersInUse`. This is the one domain in Overrides that isn't backed by one of the four canonical resolvers; formalizing it into a fifth resolver was judged out of scope for a documentation-only phase.

## 11. Phase 5 — Global Flow Architecture and React Flow Visualization

`src/components/docs/FlowStepper.tsx` — a bare MUI `Stepper` wrapper over flat `{label, description}[]` arrays — is gone, replaced by a real node/edge content model rendered through `@xyflow/react`, with coordinates computed by a separate deterministic `dagre` layout utility rather than ever hand-authored. `SiteDetails.tsx`'s Flows subsection is the only render site (unchanged from Phase 3/4 — this phase touches no client-scoped page). The base flow model remains global. Client-specific flow differences are stored on the client configuration and resolved through `resolveClientFlows`, following the same Global → Override → Effective pattern as pages, fields, coverage, and configuration.

### 11.1 What moved

| Old | New |
|---|---|
| `src/content/docs/flows.ts` (6 `FlowStep[]` exports + `healthRoutingRows`) | `src/content/docs/flows/` — one `FlowDefinition` file per flow (`consumerFlow.ts`, `advisorFlow.ts`, `resumeFlow.ts`, `autosaveFlow.ts`, `quoteFlow.ts`, `tpaVerificationFlow.ts`), `healthRouting.ts` (moved, unmodified), `types.ts`, barrel `index.ts` (`allFlows`) |
| `src/components/docs/FlowStepper.tsx` | `src/components/docs/flows/FlowDiagram.tsx` + `flows/layout.ts` (dagre) + `flows/nodes/*` (one presentational component per `FlowNodeKind`) |
| Hand-written intro `Typography` blocks in `SiteDetails.tsx`'s JSX | `FlowDefinition.intro`, rendered once by `FlowDiagram` itself |

Each `FlowDefinition` is a `{ id, title, intro, nodes: FlowNodeDef[], edges: FlowEdgeDef[] }` graph — no `x`/`y`/position field anywhere in the content model (§11.2, D1). Node kinds: `page` (carries a `pageId`, independent of the node's own `id` — see D3), `decision`, `action`, `summary`, `external`, `start`, `end`. Branches were added only where the prior prose (or `pageflows.md`, where it stated something more precisely) already documented conditional routing — no new behavior was invented:

| Flow | Branches modeled | Notes |
|---|---|---|
| Consumer | None in the backbone | The chart now shows only the stable page journey. Conditional coverage behavior and health routing remain in their configuration/routing documentation rather than selectively expanding one variation. |
| Advisor | Send/Cancel dialog (Profile → Advisor Send Confirmation); post-review edit-request decision (Send → Application Edit Confirmation, Cancel → back to Review) | Richest branching; page nodes reuse the same `pageId`s as consumer's tail with their own flow-local node ids |
| Resume | Delivery-method choice (Text/Call, both converge); verification result (Successful → end, Unsuccessful → loops back to Resume Code) | `resume-method` and `resume-code` are real `PageId`s, modeled as `page` nodes even though they also branch |
| Autosave | Save-outcome decision fanning out to a single `summary` node listing all 10 documented recovery scenarios | Not modeled as 10 separate decision leaves — the source gives no distinct destination per scenario |
| Quote | None | Product selection is a validation gate, not a routing branch — stays a linear `start → action → action → action → end` chain |
| TPA Verification | Match-found decision; 4-way verification-method decision; explicit verified vs unverified downstream outcomes | Failed/skipped verification returns to the regular application without portfolio; successful verification continues with portfolio enabled and TPA auto-approval. Client-specific behavior is not rendered on the global page. |

### 11.2 Decision log

- **D1 — `@dagrejs/dagre` over `elkjs` or a hand-rolled layout.** Every flow is a small layered DAG (≤ ~19 nodes). Dagre's synchronous Sugiyama layout is the right-sized tool for a read-only documentation diagram; `elkjs`'s async, compound-graph-oriented API is unneeded weight for this shape. The layout utility (`src/components/docs/flows/layout.ts`) is a pure function — same `FlowDefinition` in, same `{nodes: LaidOutNode[], edges}` out — tested for determinism and for preserving every input node/edge unchanged (`layout.test.ts`).
- **D2 — branch only where the source documentation clearly supports it.** Two places a branch was deliberately *not* introduced despite a natural-seeming opportunity: autosave's 10 failure scenarios (one `summary` node, not 10 decision leaves — no distinct downstream destination is documented per scenario) and both flows' health pages (one `summary` node each, since real health-page inclusion is gated independently per coverage/underwriting type via `formFlow.ts`'s `shouldSkipPage`, not a sequence or a single branch point this content model should assert).
- **D3 — node `id` is independent of `pageId`.** A `page`-kind `FlowNodeDef` carries its own flow-local `id` (convention: `${flowId}-${slug}`) *and* a separate `pageId` field referencing the real page. The id space that must stay unique for edge-wiring is per-flow; the page registry is shared across flows. This also means Phase 6's per-client resolution can key off `pageId` without needing to know any given flow's internal node-id scheme.
- **D4 — page-node → page-doc linking via a table-row anchor, not a new lookup structure.** `SiteDetails.tsx`'s Pages table rows already have a natural key (`page.id`); they now also carry `id={`page-${page.id}`}`. `PageFlowNode` links to `#page-${pageId}`. Because `SectionAccordion` keeps its `AccordionDetails` mounted even when collapsed (MUI `Collapse`, not `unmountOnExit`), a plain anchor jump would resolve to a real but zero-height (invisible) element if the Pages section was manually collapsed — `navigateToPageAnchor()` (`components/docs/flows/nodes/navigateToPageAnchor.ts`) handles this by clicking the section's `AccordionSummary` open first (only if `aria-expanded="false"`) before scrolling. No change to `SectionAccordion`'s API.
- **D5 — `proOptions.hideAttribution` left unset.** Hiding React Flow's attribution badge requires an xyflow Pro subscription, which isn't confirmed for this project — the badge stays visible until that's resolved.
- **D6 — taxonomy: `summary` (not `group`) and a new `external` kind.** `summary` stands in for a set of real pages that aren't sequential/branchable in a documented way (health pages in consumer/advisor). `external` is reserved for a system outside the portal that a flow depends on but doesn't route through as a page — used once in this phase (the TPA eligibility lookup) — not for every page that merely integrates a third party (E-Sign stays a normal `page` node referencing the real `docusign` `PageId`, even though DocuSign sits behind it).
- **D7 — `minZoom` overridden to `0.05` and the diagram box height made content-dependent (clamped 340–900px), not a fixed 480px.** React Flow's default `minZoom` (0.5) floors how far `fitView` can zoom out; a fixed 480px box combined with that floor silently *clipped* the top of any flow taller than ~5 nodes (advisor's 18-node chain, in particular) instead of shrinking it to fit — the diagram looked fine at a glance but the first several nodes were entirely un-rendered. Both fixes were necessary: a low `minZoom` alone makes tall flows fit but at an illegibly tiny scale; sizing the box to content (`components/docs/flows/FlowDiagram.tsx`'s `diagramHeight` calc) keeps most flows near a readable zoom while the `minZoom` floor still guarantees nothing clips if a future flow is taller than the 900px cap.
- **D8 — page nodes declare `measured` (not just top-level `width`/`height`) up front.** React Flow's `fitView`/`useNodesInitialized` gate on `node.measured.width/height`, populated only by an actual `ResizeObserver` pass — a *separate* internal field from the `width`/`height` a node object can declare. For a static node array that's set once and never re-passed to `setNodes` (this component's case, by design — the layout never changes after mount), the store's aggregate `nodesInitialized` flag is computed once at mount and never recomputed, so it stays permanently `false` if `measured` isn't already populated at that point. Declaring measured dimensions up front still sidesteps the timing question, but node height is now content-based rather than fixed: `layout.ts` estimates a per-node height for dagre/fitView while `FlowNodeShell` uses only a minimum height and allows the rendered card to grow naturally.
- **D9 — page-node anchors need an explicit `pointerEvents: "auto"`.** React Flow sets a node wrapper's `pointer-events` to `none` (inline style, so it beats any CSS rule) whenever the diagram has no `onNodeClick`/selectable/draggable handler wired at the `<ReactFlow>` level — true here by design, since the diagram is read-only. That's an inherited ancestor style, not a hard block, so the one truly interactive element per flow (the whole-card anchor in `PageFlowNode`/`FlowNodeShell`) opts back in explicitly rather than the diagram wiring up `onNodeClick` at the top level (which would make every node, including non-page kinds, register as generically "clickable" per React Flow's own bookkeeping for no reason).

### 11.3 Testing approach — not pinned to exact node/edge counts

`content/docs/flows/flows.test.ts` and `components/docs/flows/layout.test.ts` deliberately avoid asserting a fixed node/edge count per flow (a label wording tweak shouldn't break a count assertion, and pinned counts discourage future edits). Instead they check referential integrity (every edge resolves to a node id present in the same flow), uniqueness (node/edge ids unique within a flow), page validity (every `page`-kind node's `pageId` exists in `config/pages.ts`), layout preservation (dagre's output node-id set and edge array exactly match the input — nothing dropped, added, or reordered) and determinism (repeated layout calls produce identical positions), plus a small set of named assertions for the specific documented branches in the table above (e.g. advisor's Cancel edges loop back correctly, resume's Unsuccessful edge loops back to Resume Code, TPA's method decision has all four documented branches).

### 11.4 Left for later / Phase 6

Client flow resolution is implemented in `src/config/resolvers/resolveClientFlows.ts`. Global `FlowDefinition`s remain the baseline; `ClientConfig.flows.overrides` supplies client-specific replacements where needed. `ClientSiteDetails.tsx` summarizes flow overrides under Overrides and renders all resolved diagrams under Effective Site → Effective Flows. WAEPA's TPA variation therefore appears only when WAEPA is the active client, while Global Site Details remains client-neutral.

### 11.5 Duplicated content check

None introduced. `content/docs/flows/index.ts`'s barrel (`allFlows`) is the one source `SiteDetails.tsx` renders from today and that a future Phase 6 client resolver would consume — no second copy of any flow's nodes/edges exists anywhere.

---

## Summary

**Files reviewed:** `SiteDetails.tsx`, `ClientSiteDetails.tsx`, `content/docs/{configurations.ts, features.tsx, flows.ts, siteRules.ts, fieldRows.ts, urlParameters.ts, errorMessages.ts}`, `config/clients/types.ts`, `config/clients/waepa.ts`, `config/client/{getActiveClient,getClientPageRequirement,getActiveClientCoverages,findClientForPage,resolveClientId}.ts`, `config/coverages/{index.ts,types.ts}`, `config/coverageConstants.ts`, `config/pageSections/getPageSections.ts`, `config/clientFields/{membership.ts,getClientPageFields.ts}`, `config/fields/{getPageFields.ts,pageFields.ts}`.

**Duplicate/parallel sources found:** two page→field registries (`pageFields.ts` vs `pageSections.ts`); two client field-override mechanisms (`ClientConfig.fields` vs `membershipClientFields`); configuration prose (`configurations.ts`) that can silently drift from live `ClientConfig` values; three-way split of coverage business rules (`ClientConfig.coverages`, `coverageConstants.ts`, prose); several static page-metadata maps in `ClientSiteDetails.tsx` that duplicate `progressSteps.ts`/`pageGroups.ts`/`formFlow.ts`; a duplicated `ThemeColorId` label map.

**Recommended resolver utilities (Phase 2):** `resolvePageVisibility(pageId, client)`, a promoted/typed `getClientCoverages` as the canonical `ResolvedCoverage` resolver, a unified `applyClientFieldDiff` (post-Membership-merge), and a typed `ConfigRow.configurable` union feeding a future `ResolvedConfiguration` reader.

**Architectural concerns to resolve before Phase 2:** primarily the `pageFields.ts` vs. `pageSections.ts` split (item 5 in the migration sequence) — it's the one duplication that isn't purely a documentation concern, since both registries also drive real runtime behavior (`RoutePage.tsx`/`getClientPageFields` vs. actual page components), so unifying them touches the live application, not just docs. Recommend deciding that direction explicitly with the team before Phase 2 begins.

**Phase 2 outcome (see §8):** all four resolvers listed above were implemented in `src/config/resolvers/` and `ClientSiteDetails.tsx`/`SiteDetails.tsx` were refactored to consume them; `pageFields.ts` vs. `pageSections.ts` (D1) and `ClientConfig.fields` vs. `membershipClientFields` (D2) were deliberately left unmerged, as recommended above. §8.5 lists what's still duplicated.

**Phase 5 outcome (see §11):** `flows.ts`'s flat `FlowStep[]` arrays became `FlowDefinition` node/edge graphs (`content/docs/flows/`), rendered by a new read-only `@xyflow/react` diagram (`components/docs/flows/`) laid out by a deterministic `dagre` utility — no positions are ever hand-authored. Conditional routing previously buried in prose (coverage confirmation, advisor send/cancel and edit-request dialogs, resume verification method/result, TPA's 4-way verification choice) is now explicit branch data, added only where the prior documentation already supported it. The model remains fully client-independent; per-client flow resolution is Phase 6.


### Portal Admin information architecture update (Sep 14, 2026)

Portal Admin now separates **Portal Information** and **Portal Projects** into top-level tabs. The former Site Details **Capabilities** section has moved to a dedicated **Site Features** page linked from Portal Information. Portal Projects are presented as a status-based Kanban with Completed, In Progress, and Not Started columns.
