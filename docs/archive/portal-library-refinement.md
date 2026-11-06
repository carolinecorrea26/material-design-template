# Portal Library refinement

Current change boundaries and user-specified requirements are in [Portal Library acceptance criteria](../portal-library-acceptance.md). These supersede conflicting historical descriptions below. Passing tests does not close the user's latest reported display regression.

## Scope

Focused inspection changes; the static runtime adapter and MCR promotion boundary are unchanged. Standards are checked-in documentation data, not persisted Site configuration or a new database migration.

## Ordering sources

| Structure | Source used |
| --- | --- |
| Pages | `getSiteDetailsPageOrder()` in `src/config/resolvers/resolveClientPages.ts`, derived from `applicationPageOrder` / `src/config/formFlow.ts`; internal and advisor categories excluded using `getPageCategory()` |
| Application sequence | `formFlow`: Membership, Eligibility, Coverage, Beneficiary, Contact, Profile, Review, then health/payment/signature/receipt steps. Home remains the pre-application entry. Resume pages follow the application group. |
| Fields on a page | Global `src/config/fields/pageFieldOrder.ts`; Effective Site `getResolvedFieldResolutionsForSite()` output order when navigating to a page's fields. Unfiltered Fields remains a searchable catalog. |
| Page sections and fields within sections | Array position in `src/config/pageSections/pageSections.ts`; exposed in page details |
| Coverage categories | Array position in `src/config/coverageCategories.ts` |
| Products | Global coverage array (`src/config/coverages/index.ts`) or existing `resolveSiteCoverage()` output; no extra sorting, category position displayed |
| Progress | `src/config/progressSteps.ts` array and page membership, with existing `resolvePageStepLabel()` |
| Flow nodes | `FlowDefinition.nodes` authoring array; edges remain the authority for branching, not a fabricated linear sequence |

## Initial standards

| ID | Standard | Classification |
| --- | --- | --- |
| TS-001 | Membership first application page | Modified |
| TS-002 | Membership application/session and save milestone | New Template |
| TS-003 | Membership/attestation consolidation | Modified |
| TS-004 | Autosave after first page | Modified |
| TS-005 | Page submission validates before advancing | Migrated |
| TS-006 | Reusable Field validation separate from page submit | Migrated |
| TS-007 | Quote supports applicable products | Modified |
| TS-008 | Category/product/amount selection and estimates | New Template |
| TS-009 | Coverage Cart | New Template |
| TS-010 | Standard navigation/progress | Modified |
| TS-011 | Applicant/member-first interaction | Modified |
| TS-012 | Three-step resume | Migrated |
| TS-013 | Smaller task-focused pages | Modified |
| TS-014 | Contextual progressive-disclosure help | Modified |
| TS-015 | Material Design interaction system | Modified |
| TS-016 | Mobile-first responsive behavior | Modified |

Every record carries its exact repository evidence. Comparisons use `src/content/docs/templateChanges.ts`. Runtime and flow references establish present behavior; they do not certify production services. Partial entries deliberately distinguish documented intent from verified implementation. Validation is classified as retained behavior because the current rules specify it without a documented intentional change; historical equivalence has not been independently established. No Deprecated standard was invented. No product-specific Quote guarantees, production rate accuracy, or production session persistence guarantee was added because these are not established by the inspected source.

## Relationships

- Page → Fields (exact page filter), modeled Rules, related Flows.
- Fields → Pages, modeled Rules/conditions, existing Storybook components.
- Rules → condition input Fields and explicit visibility target Pages/Fields.
- Flow nodes → modeled Pages; Page links select the related flow.
- Categories → filtered Products; Products → Category anchors, modeled category questions, Rider definitions.
- Configuration → Page where `getConfigurationPage()` explicitly supplies a page.
- Standards → relevant Library entities.
- Site and explicit scope persist in all new cross-domain links; unrelated domain filters are dropped.

No relationships are inferred from arbitrary prose. Feature and URL Parameter documentation lacks normalized entity-reference lists; existing rich links are retained. Content retains its existing component/design links. Adding broad relational navigation for these domains requires explicit reference metadata.

## Resolution and detail behavior

Pages expose their actual resolver record, including the existing override and effective result. Fields expose resolver status, global/effective required values, notes and explicit Site field-override records. Existing Configuration resolver views retain their detailed comparison. The legacy Page/Field adapters do not expose full independently attributable Global → Client → Site provenance; the UI does not invent that attribution. Standards stay identical in either scope.

Dense coverage cells retain their existing expandable `TruncatedString` behavior. Section and resolver details are expandable. Structural order stays outside Patterns and Configurations.

## Files changed for this refinement

- `src/components/docs/BrowseTable.tsx`
- `src/content/docs/templateStandards.ts` (new)
- `src/pages/admin/PortalLibrary.tsx`
- `src/pages/admin/library/LibraryLink.tsx` (new)
- `src/pages/admin/library/libraryInspection.ts` (new)
- `src/pages/admin/library/TemplateStandardsLibrary.tsx` (new)
- `src/pages/admin/library/PagesLibrary.tsx`
- `src/pages/admin/library/FieldsLibrary.tsx`
- `src/pages/admin/library/SiteDetailsLibraryDomains.tsx`
- `src/pages/admin/library/libraryInspection.test.ts` (new)
- `src/pages/admin/libraryNavigation.test.ts`
- `docs/portal-library-refinement.md` (new)

Shared abstractions: `libraryHref` / `LibraryLink` for scope-preserving navigation; `orderedLibraryPages` for the applicant-facing projection; `ruleRelations` for explicit condition references; `ruleDisplayType` for non-executable display classification. BrowseTable accepts initial URL search/filter values and uses simple filter labels with visible All defaults.

## Remaining gaps

- Prose-only rules cannot be safely linked or finely classified; Unclassified and Not modeled remain deliberate states. Status differentiates executable conditions from documented behavior, not production certification.
- Product eligibility/underwriting constraints are displayed in their existing structures; they do not all have separate Rule IDs to navigate to.
- Full separately attributable Client/Site provenance needs resolver support.
- Validation remains adjacent to Pages/Fields; it is not a new entity domain with durable validation targets.
- Historical classifications and production completeness need product-owner review where only current requirements/prototype evidence exists.
- No browser visual QA was performed; validation is through DOM interaction tests, source contracts, and build.

## Verification

- Full suite: `npm test -- --maxWorkers=2` — 48 files passed, 1 skipped; 650 tests passed, 1 skipped. The default-worker run encountered a five-second timeout in migration semantic extraction; bounded workers passed that test and the full suite.
- Final focused Library tests include an additional resolver-provenance assertion added after the full run began.
- `npm run build` passed. Vite reports the existing large-bundle warning (bundle exceeds 500 kB).
- Targeted ESLint passed for the changed implementation files; `git diff --check` passed.

## Table presentation follow-up

- Navigation: Template Standards follows Canonical Review; Flows follows Pages; Features immediately precedes Content in both scopes.
- Clear filters is a filled secondary button at the far right of the filter row. It remains mounted and disabled when unused, and select fields have fixed widths to avoid movement. Exports remain small outlined buttons on their own row.
- IDs appear last; Path and Provided by are hidden. Migration source metadata is hidden in Patterns, Flags, Coverage amounts, and Product riders; standards documentation and canonical evidence remain available.
- Included is labeled Enabled. Page requirement retains actual Site behavior (required/optional/none); neither is migration metadata.
- Shared tags are small, filled and noninteractive, with consistent colors keyed by normalized tag label. Storybook uses standard text links; flow views use tabs with URL-preserved selection. Prototype page links use success color and Library links primary color.

Scope follow-up: Global omits Site-only Enabled, Page requirement, Resolution, Differences, resolver Notes, and Rule Site applicability columns. Effective branding previews the selected Site; the Demo theme playground and preset catalog remain Global-only. BrowseTable tags now require explicit categorical opt-in; descriptive requirements are plain text.

Missing required details use a small filled “Details needed” tag with theme error colors. Evidence gaps are explicitly marked rather than inferred from every blank or dash. Existing explanations remain visible and searchable. Current markers cover the three undocumented legacy equivalents in Template Standards, unclassified Rule types, missing Field component references, and unavailable separate Client provenance. Optional/inapplicable values are not automatically flagged.

## Relationship navigation correction

Links now identify their destination table with `table=`, so a field/page search does not empty the adjacent validation table. BrowseTable resets local controls on URL navigation and reserves Library context parameters (`scope`, `site`) rather than treating them as row filters. Explicit row filters for reserved names use `filter.*`.

Pages, Fields, and Rules share `getLibraryRules()` for identical Global/Site applicability. Pages show a counted “View related rules” link only for explicit relationships available in the destination scope; otherwise they state “No explicit rule relationships.” Pages without registered fields, excluded internal pages, unavailable Site fields, and empty coverage categories no longer generate misleading navigation links. Coverage sub-tables use the same category-filtered products as the product table.

Browser verification: WAEPA Membership → four related Rules → `waepa-declaration` returned the matching Field row, while Field validation remained populated. Regression tests cover round trips, scope restrictions, same-domain navigation, sibling-table isolation, and the Flags scope query collision.

## Implemented field inventory audit

See [field-inventory-audit.md](field-inventory-audit.md) for the page/component coverage, Site counts, conditional-input interpretation, and verification. Fields now includes page-owned and repeated inputs, Global combines all configured Site placements, and scope changes clear table filters. Shared definitions preserve existing form behavior.
