# Site requirements specification (redesignv6)

This describes the established fresh-start model: global template definitions
and effective-Site requirements are authored once, layered and projected to consumers.
The ten enrolled effective Sites are ABE, AMA, AMA-GI, ASCE, AVMA, CSEA, ISI Trust, NSO, WAEPA and WAEPA GI. Shared definitions remain global; each Site owns its assignments and overrides. See [Site enrollment and evidence](sites.md). Catalog inspection scope is explicit (`siteScope`); it propagates through Library and Storybook projections. Authored Site identities reconstruct missing saved rows within that scope. An unscoped complete catalog includes the enrolled Sites whose client identities are available.

## Keeping the model intact

Configuration resolution is one shared requirement in `global/rules/model.json`.
It applies to all pages without a separate page mapping. Owning definitions declare
permitted scopes, options, defaults and constraints; Site assignments supply values.
Do not repeat those declarations as page-specific configuration rules. Keep distinct
business behavior explicit, and show its page placements as usage references rather
than separate rule identities. Implementation progress and demonstration limitations
belong in project-review documentation, outside system requirement statements.

Rules and workflows may declare `templates: ["single"]` or `templates: ["multi"]`
for layout-specific behavior. Omission applies to both application layouts. This
is global definition metadata, independent of the effective Site's chosen layout.
The Library's **Applies to layouts** filter includes shared rules for either
selection and retains global definitions under Site filters. Executable routing
preserves this metadata and evaluates it against the effective application layout.
Do not create separate copies of a shared rule for each layout or Site.

`AGENTS.md` records this model as standing repository instructions. Every change
must identify whether it changes a global definition/default or an effective-site
assignment/override; reviewing ASCE does not change that ownership.

Run `npm run test:fresh-start` explicitly for ownership and inheritance changes.
Prototype and Storybook builds leave test execution to the test commands.
This check verifies that global Library definitions remain global even for
an unconfigured Site, two effective Sites share definitions while keeping values
independent, reviewed surfaces reconstruct without superseded authoring, and
Library/prototype/Storybook agree despite stale saved records. Other tests remain
scoped to the behavior being changed.

Use `npm run test:source-propagation` for the shared content-reader regression
batch: changed JSON, stale saved catalogs and late-installed revisions must agree
across Library, prototype, standalone defaults and Storybook. Add checks by data
family as remaining readers are migrated; this command is not a claim that every
surface has been audited. `global/navigation.json` owns shared progress placement,
Library step labels and legacy Library URL destinations. Example-only presentation
and supported configuration variations belong in `global/prototype-fixtures/`.

## Global template source ownership (CHG-026, CHG-032)

Membership, Eligibility and Coverage are authored in the fresh-start requirements.
Their page definitions, route/order, field placement, conditions, wording, notes,
question participation and approved eligibility settings are compiled before any
consumer resolves the site. A reviewed page does not inherit missing structure or
content from an old saved catalog.

- `requirements/parked/<page>.json` owns each reviewed page's definition and layout.
- Global field IDs, field details, option lists and component/page mappings own the
  reusable inputs; site field/page files select configuration and additional fields.
- `requirements/global/content/*.json` owns wording. `content-bindings.json` projects
  those keys into the existing consumer content contract without copying authoring.
- `global/content-inventory.json` identifies shared display locations, components,
  conditions and exact exclusions for Library-only metadata. Page placements remain
  in their page JSON. A binding alone does not establish a display location. The
  Content table derives each canonical item's JSON owner, groups all usages, and
  defaults to site wording; existing related Receipt email items have an Email channel.
  The fresh-start audit requires every authored content key to be accounted for.
- Global configuration definitions own reusable settings and defaults; each
  effective Site supplies its assigned values and overrides. ASCE currently supplies
  the reviewed example values, not a separate template implementation.
  `configuration-bindings.json` maps shared controls to the consumer contract.
- Category/product order is a cross-page template configuration, with
  `featured_prod` taking precedence. Its shared definitions/defaults are in
  `global/configurations/product-presentation.json`; the existing presentation
  resolver is shared by Home, quote tools, coverage panels/menu drawers and Coverage.
  Later-page lists inherit the same requirement during their rollout.
- `global/products.json` owns shared product/category/rider identities, policy
  definitions, defaults and URL contracts. Its `catalog` section uses the existing
  relational consumer vocabulary; it is authored input, not generated output.
  `parked/sites/<site>/products.json` owns product/applicant/rider assignments,
  identifiers, benefit formulas/periods, dependency/selection/journey policies,
  underwriting bands and remaining amount records. `{{site}}`/`{{siteId}}` in
  assignment identities bind to the effective Site. No shared definition is
  instantiated separately for ASCE. Reviewed Life amounts, eligibility values
  and residency/aggregate policies retain their existing fresh-start owners.
  Verification questions and the dummy portfolio are prototype fixtures.

Global component registrations, canonical Storybook bindings, roles, dependency identities and internal parts are authored together in `global/components.json` (CHG-069). `requirementComponents.mjs` reconstructs this inventory even without saved component definitions. Page placements identify named parts through `partOf`; they do not create separate component records. Build analysis verifies registrations/dependencies and generates source-usage/example annotations. Library, prototype and Storybook use the same projection.

`requirementCatalog.mjs` compiles these sources for both the Node catalog build and
the browser. Library, prototype and Storybook resolve the same projection, including
when loading an older saved snapshot. `public/catalog/portal.json` is a generated
deployment bundle. Superseded authored records for the transferred pages and their
`parked/legacy` files have been removed. Historical migration inspectors use
an explicit snapshot resolver so they can still compare captured evidence.

The underlying product-policy records for Membership through Coverage have also
been removed from the old authoring parts. `requirementProductCatalog.mjs` supplies
them from fresh start before page compilation; missing definitions/assignments
are errors. The ownership check removes the product graph as well as page records
and compares Library, prototype and Storybook. Coverage's aggregate-note display
uses that projection, and its displayed maximum derives from the one Life ceiling.

Home, the shared error/recovery pages (including 400, 404 and 500), and the existing
sent-for-signature/edit-request confirmation pages use this compiler too. Their
page files own definitions and layout, including explicit empty field layouts.
`consumerKey` preserves existing runtime route identities where an earlier draft
used a different requirement ID. Home owns its complete content object and quote
surface field aliases; quote controls derive from shared field definitions.
Shared wording is in `global/content/home.json`, `recovery.json` and
`confirmations.json`. Recovery states/actions are in `global/recovery.json`;
the existing confirmation retention display is a global configuration and the
dummy advisor recipient is a prototype fixture. This moves source ownership
without reviewing or changing the advisor, resume or submission workflows.

Home's final-audit source/documentation and storage gaps are recorded in CHG-040/041. Its
[current checkpoint](page-review.md#home) records all four section groups, effective
ASCE defaults, fields, rules, validations, configurations and content. Home's
applicability includes applying-steps and template configuration plus effective
field-definition checks. The Hero example uses the same compiled eligibility
presentation as the prototype, the notice overlay reuses the explicitly configured
scenario, and QuickDecision panel copy is global shared content. Retained draft
settings and deferred product policies keep their existing statuses. Its four-group
composition and complete tool placements now compile from Home-owned definitions.
Notice enablement/content, Hero assets, template/artwork and URL values have explicit
global sources and Site assignment paths. Shared insurer data has one owner; the
confirmed QuickDecision panel rule uses assigned products. Global definitions/defaults
also reconstruct without an enrolled Site.

Membership's follow-up normalization (CHG-042) reuses the same nested composition
projector as Home. Component field placement and semantic choice outcomes compile
into shared section/field conditions, including the Phone Type companion. Synthetic
new/current, category and association examples use the same compiler rather than replacing
projected fields. Optional content requirements now declare their enabling
configuration and required properties, removing Home's notice-specific branch.
The [Membership checkpoint](page-review.md#membership-step-getting-started-required)
records effective ASCE assignments and actual lifecycle rules, distinguishing
them from behavior executed by the prototype. Email delivery and nightly batch
processing are confirmed system requirements; the prototype does not execute them.

Eligibility's audit (CHG-044) uses the same ordered composition projector. Repeated
sections now compile record storage generically, and page-owned surfaces describe
address, verification method and fictional security-question fields. Global defaults
also reconstruct without an enrolled Site. Effective Site people, residency,
collection and TPA values use the shared projection; snapshots cannot restore old
surface/collection containers. The [Eligibility checkpoint](page-review.md#eligibility-step-getting-started-required)
records participation, validation, source ownership and the prototype execution boundary.

All 30 page definitions now compile from fresh start. The remaining application,
health, payment/signature/receipt, resume and advisor-login pages were transferred
as one batch, preserving their existing participation, layouts and behavior.
`field-details.json` binds stable runtime field IDs to shared definitions;
`global/application.json` owns shared rules, flows, document/email definitions
and configuration records. `sites/<site>/application.json` assigns Site values,
flows, documents and email templates. Application wording and prototype timings
also have shared JSON owners. Installed field consumers read the compiled library.
The reconstruction check removes legacy fields, workflow and policy inputs, then
compares all page projections across Library, prototype and Storybook.

This completes page source transfer; it does not mark all business rules reviewed.
The six flow graphs are also authored once in `global/application.json` (CHG-118).
Consumer's Library overview (CHG-130) uses the existing application progress
placements in `global/navigation.json` and the actual `navigation.progress-step-labels.*`
content, not abbreviated Library table labels. Its flow definition references those
progress stages and places only entry, Receipt and non-page steps explicitly.
Stage diagrams project existing transitions; the edit selector's return choices
remain in the shared step inspector. This is global documentation metadata, not
new application routing. Advisor uses the same stage renderer (CHG-131), adding
actor labels and the existing handoff/access stages. Recovery, edit requests and
notification lifecycle records appear as related processes, outside the numbered
application sequence. Stage-specific alternate edges can remain in the canonical
step inspector, with an explicit notice in the diagram view; they are not removed
from the graph or Steps table. Existing email references supply recipient-labelled
previews in stages, the step inspector and the Steps table, using the shared email
view and canonical JSON-driven builders. Other flows retain their existing presentation.
Library and compatibility diagrams project those records through `flowDefinitions.mjs`.
Page/component, shared-subflow, rule/workflow, email and configuration-path references
are validated before compilation. Effective Sites supply configuration values and
assignments; they do not duplicate shared topology. `retiredFlowKeys` removes the
superseded ASCE TPA graph from saved projections. `global/health-routing.json` indexes
the five current Health routes. These declarative graphs describe the existing
runtime policies and service boundaries; they do not introduce a graph execution engine.
Beneficiary has since been normalized individually: it uses canonical field
mappings and page-owned dialog surfaces through the shared resolver, with stable
saved-answer aliases at the consumer boundary. Its Site page selects product-note
content keys; the compiler supplies the note policy from shared wording. The
other transferred pages retain their transitional bindings until their own review.
Contact now also uses canonical mappings for residential, business and spouse
groups. Phone-type companions belong to their owning group/person; contextual
defaults preserve Contact's existing defaults without changing Membership.
Its wording and Eligibility-location carry-forward mapping are shared page
sources, and business/correspondence visibility flags have global defaults with
effective-Site overrides.
CHG-046 confirms verified existing coverage for dependent prerequisites, uses the TPA-only $10,000 existing / $20,000 new Term Life minimum (CHG-047), uses existing plus requested Life for CIR,
and connects one-time base-product/applicant preselection. The Coverage
register records CIR and Disability period evidence; fictional estimates require
no production-rate review. CHG-027 confirms the combined Life maximum on Coverage
Next and the Disability residency scope; CHG-030 adds verified in-force deductions.
Recorded amount ordering/default/lock and `amt`/`dprods` controls are connected to
the shared projection. The
dependent-only dialog remains in place pending review.

The remaining design sections below include earlier drafts and describe the target
model for areas still to be reviewed.

> **Earlier design draft:** The sections below await review for remaining pages. Reviewed ASCE pages use the source ownership described above.
> Field IDs are in `requirements/global/fields.json`, page components are in
> `requirements/parked/<page>.json`, and page-section mappings are in
> `requirements/mappings/page-sections/<page>.json`. Each field mapping lists a field once
> and names its people in a non-empty `people` array; it does not place the field in a
> section or dialog. Section mappings list section IDs in order, independently of fields.
> During migration, fields belong either to a component in
> `requirements/mappings/components/<component>.json` or to a not-yet-migrated
> page in `requirements/mappings/page-fields/<page>.json`. Field definitions and
> mappings are still incomplete. These mappings do not
> decide site membership or visibility. A missing section mapping
> means the sections have not yet been defined, not that the page has no sections.
> Shared component IDs are in `requirements/global/shared-components.json`, and
> `requirements/mappings/components/<component>.json` lists its direct fields and
> related pieces by component kind (`calculators`, `drawers`, or `menus`), alongside
> direct `fields`. These kinds do not limit what can be a Storybook component.
> Home and Eligibility each map their entry fields
> directly; the fields themselves have shared global IDs. Eligibility also uses member
> verification; external security questions are not application fields. The app
> header uses the app menu, which provides
> the needs calculator. These links describe possible use, not visibility, rendering
> order, or which pages have the header. The checker derives possible page fields by
> following component relationships, displaying their source component; this does not
> establish site visibility, or that a field appears in every entry point. Page fields
> not yet transferred remain drafts. App-header availability by page is not mapped.

## What this is

The requirements are the complete statement of what a site must do: its pages, fields,
components, flows, configurations, rules, validations, content and analytics. Teams read and
(later) edit them in Admin Center. The applicant site, Storybook and generated documents
all read the same requirements. Nothing is stored twice.

This is a proof of concept: no database, no backend, no authoring workflow. Files in git,
read-only consumers.

## Fresh start, not a migration

ASCE is written from scratch in the new structure, using today's ASCE data only as a
reference. Each aspect below is reviewed and agreed before it is written. Where today's data
is wrong, redundant or generated, it is not carried over. The golden files under `golden/`
are a **reference for comparison**, not a target to match: differences must be explained and
accepted, not suppressed.

## Principles

1. **One home per fact.** A fact (a page's path, a field's label, an ASCE age limit) is stored
   in exactly one file. Everything else derives from it.
2. **Authored vs derived.** Only authored facts live in `requirements/`. Lists that can be
   computed (component inventory from Storybook, analytics tag rows from pages and fields,
   documentation tables) are generated and never edited.
3. **Definitions once, differences per site.** What exists is defined once in `global/`. A site
   folder holds only how that site differs.
4. **Every requirement is traceable.** Authored items may carry a `source` (workbook cell,
   decision, ticket). Source evidence is metadata and is never shipped to applicants.
5. **Readable by non-developers.** Plain keys (`membership`, `member-id`), no UUIDs or
   numeric display ids, nested where an item owns its parts, referenced where it is shared.
6. **Only the applicant-facing site.** Admin Center pages, design-system pages and internal
   tools are not site requirements.
7. **Global and generic by default.** Everything is defined globally under a name with no
   client details (`member-id`, not `asce-member-id`). A site opts in and overrides labels,
   options and values. A client name appears only in a site folder.

## Layers

Order of precedence, lowest to highest: **global → site**.

The model leaves room for TPA, client and association layers between them. They are not built
until a second site needs them. Site identity (name, TPA, client, associations) lives in the
site's own `site.json` for now.

## Naming: one word per job

The same words mean the same thing in every file.

| Word | Job | Who reads it |
|---|---|---|
| `id` | Machine key. Lowercase with hyphens, such as `member-id`. The five coverage category codes (LI, AD, DI, OO, SH) keep their standard capitals. | nobody |
| `name` | What the team calls it, such as "Membership attestation". | team |
| `title` | The heading the applicant sees on a page or section. | applicant |
| `label` | The text next to an input, an option or a button. | applicant |
| content key | Any other applicant wording: intros, messages, help, errors. | applicant |

Where applicant wording lives:

- **A field's own wording stays with the field:** its `label`, `helperText`, `placeholder` and
  each option's `label`.
- **All other applicant wording is content**, in `global/content/<area>.json`, referred to by
  key. Content keys are `<area>.<element>` or `<area>.<element>.<part>`, lowercase with hyphens,
  for example `membership.not-member.message`.

A content key owns an independently maintained message or a cohesive block.
Headings and action labels can have separate keys; multiple paragraphs use
ordered arrays, and repeated steps/cards use named parts such as title and body.
Keep dynamic messages complete with `{{variable}}` placeholders rather than
assembling sentence fragments. Layout and styling stay in components. Prototype
facts such as a masked test destination belong to fixtures, supplied to those
placeholders when rendered. Equal wording alone does not make two different
content roles the same authored fact.

Validation follows the same ownership: field definitions supply required flags,
formats, options and limits; `global/validations` describes the checks and refers
to message keys; `global/content/validation.json` owns the shared wording once.
Required messages interpolate the effective field label. The Library's Validations
view resolves these references rather than maintaining a second copy. Missing or
malformed answers use inline field errors with the standard page summary;
eligibility decisions use one shared ineligibility page alert. Resume-loaded
feedback belongs to the shared recovery flow and can appear on any resumed page.

## Defaults: global states them, a site overrides

Everything global states its own default. A site file only says what it does differently, and
anything it does not mention is inherited. The same rule applies to every kind of thing:

| Thing | Default is stated in | Values | A site overrides in |
|---|---|---|---|
| **Page** | `parked/pages.json`, `requirement` (until Rules are reviewed) | required · optional · none | `sites/<site>/pages.json` |
| **Section** | the page file; on unless marked `"default": "off"` | on · off | the site's page file, `"show": true` or `false` |
| **Field on a page** | the component or page mapping: on, or `"default": "off"` | on · off | the site's page file (`sites/<site>/pages/<page>.json`): `include` or `hide` |
| **Section note** (info alert under the section header) | the page file, the section's `note` (a content key) | text or none | the site's page file, `notes: { <section>: <content key> }` |
| **Field required or not** | the field list, `required` | true · false | `sites/<site>/fields.json` |
| **Field wording and options** | the field list | | `sites/<site>/fields.json` |
| **Field format and length** | the field list: `format`, `minLength`, `maxLength` | shared format and positive integer limits; omitted limits impose no restriction | `sites/<site>/fields.json` |

For example, Membership ID is not required by default, because ABE and WAEPA do not require it.
ASCE overrides it to required. The five Health pages are SI, TELE, QD, DI SUPP and CIR. ASCE assigns only QD to participate; TELE owns LI/DI/CI telesupplement variants and there is no standalone CI page.

The effective site is the global defaults with the site's overrides applied. The section default
(`"default": "off"`) is not used yet; it arrives with the first page that needs it, such as
Contact's business address.

## Fields: definitions once, participation in mappings

`requirements/global/fields.json` lists field IDs. Definitions currently live once in
`requirements/parked/field-details.json` while they are reviewed. Component mappings
reference those IDs and people; page-field mappings retain not-yet-migrated participation.
The checker derives possible page participation from these references, not an authored
`pages` array on each field.

Sections, the order of fields, which fields are off by default, and conditions are not part of
this link. They are parked in `requirements/parked/<page>.json` (`layout`, `shownWhen`) until
they are reviewed.

To see one page, run `npm run requirements:check -- --page eligibility`.

**`option-lists.json`** holds the option sets that fields share: states and provinces, coverage
categories, and tobacco products. A field says `"options": { "list": "states-provinces" }`
instead of repeating the options.

## People: a question is defined once and asked of a person

Four people can be asked or described: **`self`** (the person applying), **`spouse`**,
**`child`** and **`beneficiary`**. On the screen they read "You," "Your Spouse," "Your
Child(ren)" (words in `content/people.json`).

- A field has `people`: who it can be asked of. If it is left out, the field is for `self`.
  `first-name` is for all four, so there is one first-name field, not four.
- A section or dialog has `for`: the person it is asking about. If it is left out, it is `self`.
  A field's answer belongs to that person.
- A condition on a field refers to the same person's answer. To refer to another person's, it
  says `"of": "self"`, for example `{ "field": "dependents", "of": "self", "includes": "spouse" }`.
- Wording that differs by person is set per person on the same field: `label` and `helperText` can
  be an object keyed by person, such as `"label": { "self": "...", "spouse": "..." }`. There is
  no separate spouse field.
- Value derivation and cross-field copying are rules. Draft evidence remains in
  `requirements/parked/fields.json`; the reviewed fresh-start structure authors them
  under subject-based `global/rules/` files with separate applicability mappings.
- Browser autofill (`autoComplete`) applies to `self` only.
  The shared `browser-autofill-self-only` rule records this requirement. The generic
  loader keeps authored tokens for self (including `bday`) and sets them to `off`
  for spouse and child fields.

The checker rejects a field mapping for a person its definition does not allow.

## Placing fields on a page

Component/page mappings record possible participation. Section placement, field
rendering order, and default visibility remain parked layout evidence until reviewed.

A mapping row is on by default; `"default": "off"` marks a field most sites do not ask. A site's
page file says only what it does differently: **`include`** an off field or **`hide`** an on one,
for example ASCE's `pages/eligibility.json` includes `full-time-student`. Wording and
required changes go in the site's `fields.json`. A site never needs to repeat what it inherits,
and the checker rejects an `include` of a field that is already on (or a `hide` of one already off).

## Page structure (draft, Eligibility first)

- **Page type and step**: `parked/pages.json` gives each page a `type` (form, entry, resume,
  advisor, error); form pages also have a `step`. Order within a type follows `global/pages.json`.
- **Component tree**: a page file's `components` nests PascalCase types from
  `global/components.json`. A node can name a `mapping` (a known component) or a layout `section`.
- **Section notes**: a section's `note` is a content key; a site page file overrides it under `notes`.
- **Page notes**: the page's optional `note` is a content key; a site page file can
  choose its own `note`. ASCE's profession note belongs to Membership.
- **Validations**: `level` is `field` or `page`; `message` is a content key; `code` is an optional
  error code from `global/error-codes.json`. When a validation runs comes from the mapping binding's `trigger` (next, inline, change).
- **Configuration types** also include `number` and a `string-list` with fixed `options`.

## Checking

`npm run requirements:check` reads every file and fails if a field, content key, list, page,
section or person does not resolve, if a field is defined twice or appears nowhere, if a site
overrides something that does not exist, or if a name breaks the naming rule.
`-- --page <id>` prints one page's sections, possible fields, and mapped configurations,
rules, and validations. `-- --map` prints where each field may be used.

## Folder layout

```text
requirements/
  global/                          what exists, defined once (the template)
    pages.json                     the list of page ids, and nothing else
    fields.json                    field IDs; definitions are currently in parked/field-details.json
    option-lists.json              option sets that fields share (states, categories, tobacco products)
    content/<area>.json            the words (people.json holds You / Your Spouse / Your Child(ren))
    components.json                (parked) frame and section definitions
    configurations/presentation.json    presentation settings and draft defaults
    configurations/quoting.json     estimate frequency settings
    configurations/address.json    full-list/eligible-only settings and eligible state codes
    rules/address.json             conditional location decisions
    rules/coverage.json            category, question and product policy decisions
    presentation/                  display requirements, including rate states
    workflows/                     quote entry, coverage, navigation and form behavior
    validations/fields.json        reusable required-field check
    validations/dates.json         reusable date-format check
    validations/forms.json         field-definition and page callback checks
    validations/quoting.json        inline quote category check
    formulas/pricing.json          mock base, rider and payment-frequency pricing
    flows/ analytics/              (later)
  mappings/
    components/<component>.json    component fields and related components
    page-sections/<page>.json      section IDs in order
    requirements/<component>.json requirement applicability, validation bindings, and shared page usage
  parked/<page>.json               layout (sections, field order, off by default), content links, help,
                                   behavior notes and conditions; placed when they are reviewed
  sites/
    asce/                          only what is different for ASCE
      pages/<page>.json            include or hide a field in a section
      fields.json                  re-word or re-option a field
      ...                          (content, rules and so on, later)
```

Pages are currently IDs only. Component/page mappings establish possible field
participation; they do not define field rendering order. Words live in `content/`.

## Configurations, rules, validations, presentation and workflows

Files are grouped by **subject**, not by page. Definitions are authored once;
applicability is recorded separately. The first subjects are
[presentation settings](../../requirements/global/configurations/presentation.json),
[address rules](../../requirements/global/rules/address.json),
[coverage rules](../../requirements/global/rules/coverage.json),
[quote workflows](../../requirements/global/workflows/quoting.json),
[coverage presentation](../../requirements/global/presentation/coverage.json),
[field validations](../../requirements/global/validations/fields.json), and
[date validations](../../requirements/global/validations/dates.json).
These are declarative requirements, not an executable engine. Field definitions
are the exception: one generic loader (`src/domain/requirementFields.ts`) resolves
the fields of any page or component mapping for one person — global definition,
field details, option lists, page/person-specific labels, required and helper text —
then applies the site's overrides from `parked/sites/<site>/fields.json`
(configuration, label, required, option subset). A site loads its fields from JSON
when it has a `parked/sites/<site>` folder (the ten enrolled Sites); there is no site list in
code. The page or surface still decides which fields appear and in what order, and
names any follow-ups it places after a parent (the quote places the two tobacco
follow-ups after tobacco use). Choice fields must name their options, an option
list, or a runtime source such as `product-defined`. The quote calculator and Home
card consume the compiled field surfaces; applicability records do not by themselves
execute runtime behavior.

**Rolling out a reviewed page.** The fresh-start compiler supplies page definitions,
layout, field placement, definitions and content before consumer resolution; saved
page records cannot supply missing reviewed structure. Site page include/hide
settings and field overrides apply through that same projection. Library,
prototype and Storybook consume the compiled definitions. All 30 page definitions
now compile from fresh start; source transfer and reviewed behavior are distinct.
Saved answer keys are the JSON field ID for self and `<person>-<field ID>` for others,
using kebab-case. Use `requirementAnswerKey` and `parseRequirementAnswerKey` to convert
between keys and mapped fields.

- **Configurations** hold selectable settings and defaults. Enum records use `type: "enum"`,
  authored `options`, and a `default` that must be one of those options. Boolean records
  use `type: "boolean"` and a boolean `default`, without an options list.
  State-code lists use `type: "string-list"`, `format: "state-code"` and a
  unique array of two-letter uppercase codes as `default`. An empty default means
  no list has been assigned, not that every jurisdiction is ineligible.
- **Rules** describe conditional or business decisions in a concise `statement`.
- **Presentation** records display requirements; **workflows** record ordinary
  actions, handoffs and state transitions. A conditional branch alone does not
  turn a workflow into a business rule.
- **Validations** describe checks in a `statement` and identify the check with `check`.
  Checks currently include `required-fields`, `date-format`, `field-definition`,
  `page-check`, `category-selection`, and `product-selection`. They are documentation,
  not an executable validation engine.
- **Formulas** are typed calculation records with a `statement`, a `type` and
  that type's values: `category-rates` (per-$1,000 or percent-of-amount rate by
  coverage category, a default rate and a monthly minimum), `rider-factor`
  (rider amount or base amount, times the rider's premium factor) and
  `frequency-factors` (months per payment). `authority` is `mock` until an actual
  rate requirement replaces the values, then `requirement`.
  [`pricingFormulas.mjs`](../../src/domain/pricingFormulas.mjs) evaluates them for
  both the prototype and the mock rating server, so every screen and the server
  price the same way. Library rate modifiers, billing (annual credit, fees, annual
  factors) and reference rate tables still apply on top; PRASE is not connected.
- Each definition has a stable `id`, team-facing `name`, `status` (`draft` or
  `confirmed`), and implementation evidence in `source`. IDs are unique within
  the entire inventory across its subject files and categories. Neither `page` nor `component`
  belongs on a definition.
- Rules and workflows may reference field IDs as their intrinsic inputs/outputs in `fields`;
  other records need not name fields. Reusable validations bind to fields
  at their usage site rather than hard-coding Home's fields in the definition.
- Field definitions remain the owner of unconditional `required` settings.
  The required-fields check reads those settings rather than duplicating them.
- Imported behavior and defaults remain `draft` until reviewed. The Home
  entry/calculator separation, entry checks and Apply handoff are confirmed;
  the current page review records their implementation and retained draft settings.
- Deferred age/geographic policy questions remain separate from confirmed Site
  values; no new eligibility policies are inferred. Home entry and the calculator
  use shared field validation for calendar-date validity. Product age and geographic
  eligibility are separate effective-policy checks.

### Applicability mappings and page review

[Home applicability](../../requirements/mappings/requirements/home.json) and
[Eligibility applicability](../../requirements/mappings/requirements/eligibility.json)
reference the same address rule without duplicating it. A mapping names its component,
lists configuration, rule, presentation and workflow IDs, and binds validation IDs to the fields being checked:

```json
{
  "component": "home",
  "configurations": ["home-variant"],
  "workflows": ["home-quote-entry-handoff"],
  "validations": [
    { "validation": "date-value-format", "trigger": "get-quote", "fields": ["birth-date"] }
  ]
}
```

The checker rejects unknown/duplicate references and fields not mapped to the
component or its related components. `npm run requirements:check -- --page home`
expands requirements for that page's reachable components and shows the originating
component, bound fields, validation trigger, status, and evidence. Trigger IDs describe
the usage event (such as `get-quote`); they are not wired runtime handlers.
Missing applicability is reported as
`not yet mapped`, not interpreted as disabled or not required. Reachability is a
review aid, not proof of runtime visibility. A validation can be bound at multiple
distinct triggers on the same component, but not repeated at the same trigger.
Repeating a reference across usage sites is allowed; repeating the definition is not.

Shared wrappers can declare a non-empty `pages` list in their applicability mapping.
[Form wrapper applicability](../../requirements/mappings/requirements/form-route-page.json)
records the reviewed application-page usage of the wrapper once, without adding
its fields or business requirements to every component definition. This page list is
usage evidence, not application flow order or a claim that Next is always visible.
It does not inventory every internal/hidden-action use of the wrapper.

Validation bindings declare **either** explicit `fields` **or** a contextual `scope`:

- `registered-fields`: checks registered in the current form, including nested controls.
- `visible-fields`: displayed quote inputs participating in its question step;
  not a claim that all later contextual product controls block Apply.
- `page`: the page-specific validation callback.
- `quote-entry-fields`: ZIP/state/date entry only when the calculator collects entry
  itself; it does not put Home's entry fields back in the Home-opened calculator.
  Date-format checks select the date field within this scope.
- `applicable-quote-fields`: current applicable quote field values at Apply,
  including entry values handed in by Home. This is a confirmed requirement, not
  an implemented runtime scope; product and rider selection policies also apply.

Scopes describe existing runtime contexts, not an executable new resolver.

### Quoting and shared Next: inventory cleanup

[Quoting configurations](../../requirements/global/configurations/quoting.json) hold
estimate frequency settings. [Quoting workflows](../../requirements/global/workflows/quoting.json) contain
`home-quote-entry-handoff`, `quote-entry-open-calculator`, and
`quote-apply-carry-forward`. The Home handoff remains confirmed; the other two
remain drafts. Shared category, question and coverage-policy decisions are
[coverage rules](../../requirements/global/rules/coverage.json); product reveal
and selection are [coverage workflows](../../requirements/global/workflows/coverage.json),
and rate display is [presentation](../../requirements/global/presentation/coverage.json).
[Calculator applicability](../../requirements/mappings/requirements/quote-calculator.json)
expands through its existing Home and Membership component references.
Display mode and collecting entry inside the calculator are call-site behavior,
not newly invented site settings.

[Form workflows](../../requirements/global/workflows/forms.json),
[navigation workflows](../../requirements/global/workflows/navigation.json), and
[form validations](../../requirements/global/validations/forms.json) record Next:
registered checks -> page check -> await configured save -> optional intermediate
step -> resolve destination -> route/section transition.
Field and page validation failures stay on the current page with errors. Save
failures preserve the form and show recovery guidance without success feedback.
These shared failures do not automatically redirect to a dedicated error page.
Page-load/session/payment/submission recovery remains a separate subject to inventory.

Record statuses distinguish confirmed behavior from retained drafts. Home entry and
quote Apply validate effective fields and selections as recorded in
[the current Home checkpoint](page-review.md#home). Unresolved business policies,
missing-destination handling and workflow-engine activation remain separate
decisions. The current Payment-to-Receipt fallback is documented as existing
behavior, not newly approved.

### Eligible-state presentation and shared quoting review

[Address configurations](../../requirements/global/configurations/address.json)
define `eligible-states-only` (default false) and `eligible-states` (default empty).
[Address presentation](../../requirements/global/presentation/address.json) uses the
full authored list when the toggle is off and the configured codes when on, preserving
labels and order and comparing codes without a leading `US-`. The intended configuration
requires a non-empty list when enabled; it is separate from product geographic eligibility.
The checker validates definition shapes. ASCE's effective values are authored in
`parked/sites/asce/eligibility.json` and compiled into applicant-experience settings;
the shared settings validator rejects an enabled filter with no configured list.
The configuration definitions retain their draft status.

Home, calculator entry, Eligibility, and Contact reference these requirements.
Application controls and quote-entry controls now use the same eligible-state
option filter. It applies to Home entry and entry inside the calculator, without
changing the stored field definitions. Filtering and ZIP feedback do not establish
product geographic eligibility or guarantee submission rejection. Home entry remains
outside the Home-opened calculator; Home's inline (quote-first) variant collects it
inside the calculator.

[Coverage applicability](../../requirements/mappings/requirements/coverage.json)
and calculator applicability reference the same shared decisions, workflows and
presentation. Usage belongs in mappings, not in another duplicate rule. The redundant
`quote-rate-presentation` and `calculator-question-and-reveal-details` records were
removed. Entry and Apply-to-Membership navigation remain separate contextual behavior;
they are not applied to Coverage.
Membership no longer offers the quote calculator ([CHG-003](../../requirements/changelog.json)):
its help chip, drawer, helper mappings and the `membership-estimate-helper`
workflow were removed. Home is the only quote entry point. The current Home
checkpoint supersedes the initial quoting-rollout status below; retained draft
settings and deferred policy values are identified separately. Shared Next drafts
remain outside this Home reconciliation.

Current implementation differences remain review evidence, not new shared rules:
the calculator auto-selects a sole category, uses self-only questions plus Home
field additions/hides, defers unanswered membership, and presents member product
cards. The review requires tobacco
follow-ups and selection of available product riders in both quote entry points, no dependents in the
quote, and no duplicate questions. Rider amount choices follow product policy and
selected riders are included in the estimate. For applicable categories the tobacco
follow-ups use Coverage's existing tobacco-use-Yes condition. For ASCE, the
library's quote usage and both prototype quote entry paths resolve the quote
input definitions (gender, tobacco use and its two follow-ups, income, hours,
active at work, and business expenses/responsibility), their options and
applicant mapping from fresh-start JSON. The site's quote surface still sets
which of these inputs exist and their order, with the tobacco follow-ups after
tobacco use. Existing category policy and Home hides still control participation;
the mapping is not display order or an unconditional visibility rule. Quote
eligibility inputs (ZIP, state, birth date) and product selection/amount controls
now compile from fresh start too. Other real-site rollout remains out of scope. ASCE Coverage now resolves its
reviewed fields, single self-employment question and policy overrides from the
fresh-start JSON layer (CHG-025); see [coverage.md](coverage.md). Quote riders are
implemented for all sites (CHG-002): each product card offers the product's member riders (riders
attached to a dependent are not offered), using the Coverage page's rider policy for included and
default selections and amount choices. Selected riders use Coverage's rider pricing in the estimate
and total, and Apply carries them into Coverage's existing rider keys. Coverage can include dependents,
tobacco follow-ups and restored
elections. Amount initialization/reset and category-edit behavior differ between
the implementations. Inline entry/question steps and demonstration pricing without
an installed library are also implementation details. These differences must be
reviewed as configuration/usage or parity decisions before runtime wiring; the
context-neutral core definitions do not assert identical current implementations.

The compact records do not establish an executable rule language. Existing
[conditions](../../src/domain/rules.ts) use `conditions` with field/operator/value
clauses and `match: all | any`; product choices use existing
[selection policies](../../src/domain/coverageSelectionPolicy.ts), and checks use
the existing field/page validators. Those shapes are evidence to reuse if concrete
policy data is reviewed; no unreviewed thresholds or synthetic clauses have been
authored here. Definitions are subject-based; applicability stays in mappings.

Review evidence and unresolved behavior, not additional confirmed decisions:

- Category order is configured. Question participation depends on category and
  applicant. Product reveal validates applicable questions, shows errors on failure,
  reveals automatically when no questions apply, and returns to questions when
  changed answers require it. Implementations differ as described above.
- Product elections require selectable product/applicant combinations and policy
  amounts. Rate responses must correspond to current product/applicant, amount,
  facts and frequency; stale responses must not price changed elections.
  [RateDisplayState](../../src/domain/rateDisplay.ts) already defines available,
  loading, technical unavailable, reference-table, needs-information,
  provided-separately and hidden states. Missing prices are not zero, combined
  totals preserve non-price states, and estimates are not final premiums.
- Apply carries entry values, collected answers and contextual facts, categories,
  products, applicants and selected amounts. Empty scalar inputs do not erase
  existing answers; canonical quote answers take precedence over contextual facts.
  Tobacco follow-ups and selected riders (with amounts) now carry forward for the
  selected products; the broader Apply workflow remains draft.
  Previously answered quote questions remain visible on Coverage with answers
  prefilled and editable.
  Apply requires at least one selected product and revalidates current quote
  answers, contextual eligibility facts, amounts and coverage options in both
  drawer and inline modes. Invalid input stays in the quote with an error.
  Entry collected inside the calculator is also revalidated before continuation.
  Get an instant quote validates Home entry first and shows loading before opening;
  age and geographic decisions remain separate.
- Current template precedence is a valid URL parameter (saved to session), valid
  stored template, site/client setting, then multi-page default; preview is separate.
  Home's configured landing notice can interrupt Start and resume opens its own flow.
  Next runs registered checks, then the page check, then an optional save and
  intermediate hold before resolving the destination. Validation errors stay on
  the page and scroll to the first invalid field or page top; the page check uses
  current form values merged with application values. Failed saves preserve answers
  and show recovery guidance, without success feedback. No save callback means durable persistence is not guaranteed. Coverage
  and Review identify successful completion for revalidation. Payment currently
  falls back to Receipt for a null destination; other missing destinations do not
  navigate. Single-page mode opens the destination section without changing route;
  multi-page mode navigates and requests progress-saved feedback. This is not an
  approved missing-destination policy.
- Quote dropdown filtering matches application field filtering. Home entry checks
  the selected value against effective options independently of location inference;
  feedback alone does not establish product eligibility. The shared settings
  validator checks the toggle/list dependency. Broader back navigation, restoration
  and recovery decisions are not newly approved by this Home reconciliation.

### Order and scope

Page IDs are an inventory, not a flow. Flow definitions will own default page order
with optional breadcrumb step membership; not every page has a step or belongs to
a journey. Page-section mappings already own section order. Field rendering order
and conditional transitions remain separate, unfinished aspects. Neither subject
file order nor requirement mapping order establishes runtime execution precedence.

Related entries are grouped in files rather than stored one per file. Future ASCE
differences belong under `sites/asce/configurations`, `rules`, and `validations`;
site override shapes and execution are not implemented in this initial pass. Only
subjects with actual reviewed evidence are created; no empty subject files are needed.
The Home-specific draft files have been replaced by the subject files above; the
shared IDs are `state-province-from-postal-code`, `required-fields`,
`date-value-format` and `field-definition-checks`; their current records hold status. The confirmed `home-quote-entry-handoff` ID is unchanged.
Earlier parked behavior remains unreviewed evidence, not an additional authoritative
definition. Applicant wording and error messages continue to belong in content.

## Where we are

Four pages are drafted. They are reviewed **one page at a time, sections first, then fields**, in
[page-review.md](page-review.md). Content (the words) is not reviewed yet. New pages wait until
the drafted ones are agreed.

## Plan

1. **Pages**: the list. Done.
2. **Review each drafted page** (Membership, Eligibility, Coverage, Beneficiary): sections, then
   fields. [page-review.md](page-review.md). **Membership is in review.**
3. Then the next pages (Contact, Profile, and so on), in application order, each reviewed the same way.
4. Then the aspects that cut across pages: Content, Components, Products, Flows, Configurations,
   Rules, Validations, Analytics.

Components are parked: [components.md](components.md) is a draft list and is not final.

Per-page notes written so far (drafts, not yet reviewed): [membership.md](membership.md),
[eligibility.md](eligibility.md), [coverage.md](coverage.md), [beneficiary.md](beneficiary.md).

Cross-cutting decisions (resolver, `EffectiveSite` shape, how consumers read it) are settled
after the aspects, because they follow from them.

## Vocabulary

- **Requirement**: an authored fact about the site.
- **Global**: the template every site starts from.
- **Site override**: a requirement that differs for one site.
- **Effective site**: the result of applying a site's overrides to global.
- Retired words: "catalog", "snapshot", "table", "row".

## Application entry regression coverage (CHG-028)

The standard ASCE suite now mounts the actual application, providers, router and
session guard for Home entry. It covers a clean browser, expired previous sessions
in both Home variants, expired-session recovery, preserving Continue application's
resume path, and submitting Membership and Eligibility to reach Coverage. Existing
quote-handoff tests also begin with expired prior applications and verify current
quote answers survive while old application answers are cleared. Timeout-guard
tests remain responsible for warning, expiry and refusing renewal by field activity.

`useStartApplication` owns the explicit new-entry reset used by Home and quote
Apply. Initializing a new application is separate from resuming an expired one.
The inactivity duration remains provisional. These are application integration
checks, not a claim of automated browser coverage through final submission.
The Home → Membership → Eligibility → Coverage path was also verified in the live
prototype browser. Full submission paths remain separate work from this entry fix.


Shared error-page review (CHG-052): [the current checkpoint](../project-review/recovery-state-plan.md)
records one component for HTTP-code errors, generic technical error, Maintenance,
Session expired content. Magic-link expiry is inline feedback on Resume (CHG-057). This is prototype and Library/Storybook presentation/documentation;
no new service or business-flow failure wiring is included.

Redirect-page clarification (CHG-057): one global component serves specific HTTP errors, an unmapped generic technical error, maintenance and session-countdown expiry. Expired/invalid magic links land on Resume with an inline page error and the email request form; there is no separate magic-link expiry page. See the [current checkpoint](../project-review/recovery-state-plan.md) for ownership and implemented versus documented behavior.

Contact final audit (CHG-058): [the reviewed checkpoint](../project-review/contact-component-review.md) records global/effective-Site ownership, complete content/field placement, rules, validation, configuration and storage. Owner sections use the shared always-participating section contract so dependent-only applications still collect the member address. Product-scoped Contact examples use supported synthetic fresh-start assignments.


Profile final audit (CHG-059): [the Profile checkpoint](../project-review/profile-component-review.md)
records the shared composition, 81 person-bound page fields, four-field carrier dialog,
source-owned visibility, validation, calculations, content and storage. Global default
SSN requiredness supports effective-Site optional-product assignments; ASCE spouse DI
is optional. Synthetic financial examples compile source assignments, while ASCE's
financial questionnaire remains disabled.


Review final audit (CHG-060): [the Review checkpoint](../project-review/review-component-review.md)
records one shared global legal-policy default, ASCE's explicit default inheritance,
active source surfaces and application preview, and source-compiled Storybook variants.
The generic `$default` configuration reference resolves from authored global data;
it never falls back to a captured value. A nested `{ "$default": true }` inherits
the corresponding global property while other explicitly assigned properties remain
Site-owned. Review overrides use this for shared underwriting applicability.
Important Notice uses the existing shared
modal, legal-document renderer and scoped printing with standard/NM/VA MCR wording.
The November 13 user decision supersedes the earlier viewer deferral.


Review MCR reconciliation (CHG-061): [the source matrix](../project-review/review-mcr-audit.md)
records product/state-dependent Read & Sign assembly. The November 13 decision
supersedes the earlier ASCE health-question gate with the MCR adult Life/DI/Overhead
flag. VA QD consent and all notice placements use the same global policy projection;
CT warning appears directly above the member Review acknowledgement and remains
required above the production member signature.


Shared form applicants (CHG-062): [the checkpoint](../project-review/shared-form-applicants.md)
records global heading/participation rules and effective Site/URL scope. One active
election resolver feeds shared forms, cart, preview, Receipt and derived applicant
state. Coverage Information remains general offering information and honors the
existing `applicant` URL restriction.


Advisor and Resume final audit (CHG-063): [Advisor ownership and handoff](../project-review/advisor-component-review.md)
and [Resume policy, privacy and storage](../project-review/resume-component-review.md)
record the completed six-page migration. Global defaults own retention and recovery
limits; ASCE inherits them. Advisor restart retains identity while clearing the
applicant; confirmation uses the original saved deadline. Uniform link-request
confirmation, safe inline errors and verification-before-restoration preserve the
confirmed privacy contract. Production delivery/authorization/batch rules are
recorded without real-service implementation. No policy question is deferred.


Resume workbook reconciliation (CHG-064): [the current Resume checkpoint](../project-review/resume-component-review.md)
maps all 18 Rules - Resume rows and six confirmed clarifications. Global source
owns one-use email entry, separate fixed MFA sessions, phone-only verification,
shared request windows, fixed cooldowns and application recovery locks. The pages,
Library flow and Storybook use that model. This supersedes CHG-063 recovery defaults
and its link-bound session; ten-day application retention and settled return routes
remain unchanged. No decision is deferred and no real delivery/batch service is added.


Health final audit (CHG-065): [Health ownership, rules and storage](../project-review/health-component-review.md) records all six global templates and the effective ASCE external-QD assignment. Internal examples compile source policies; QD uses the assigned image sequence. Shared handoff validation, pending protection and image fallback are implemented without external services. No current Health decision is deferred. Payment final review is recorded in CHG-070 below; DocuSign final review is recorded in CHG-073 below; Receipt remains for final page review.


Health taxonomy correction (CHG-066): [the current Health checkpoint](../project-review/health-component-review.md) supersedes CHG-065’s six-page list. The final five pages are SI, TELE, QD, DI SUPP and CIR. TELE resolves LI/DI/CI variants; self/spouse share each page while retaining independent answers and records. CI is not a separate page. Superseded page identities are removed by compilation, and ordinary DI TELE does not automatically show DI SUPP. ASCE remains QD-only.


Shared page help (CHG-067): [the global help contract](../project-review/shared-page-help.md) replaces page-specific help wrappers and repeated drawer state with PageHelp, PageHelpChips and PageHelpDrawer. Membership, Beneficiary and Payment use compiled topic metadata and effective content. Health pages and source-form previews have no help chips; removed components/copy cannot return from old catalogs.

Payment final audit (CHG-070): [Payment ownership, MCR reconciliation and storage](../project-review/payment-component-review.md) records the shared sections/surfaces, defaults, independent product choices, configurable shared/product notes and active payment document filtering. ASCE Payment is optional following the November 17 correction (CHG-105); Canadian taxes remain informational notes. Payment collects and saves details before DocuSign without authorizing or submitting. No Payment decision is deferred. DocuSign final review is recorded in CHG-073 below; Receipt remains for final page review.

DocuSign final audit (CHG-073): [DocuSign ownership, signing rules and storage](../project-review/docusign-component-review.md) records the shared handoff, inherited ASCE page requirement, Site image assignment, common legal-document source and production boundary. The member always signs; an applying spouse also signs, with no separate child signature. Completed required signing submits and proceeds to Receipt without another portal Submit. The prototype uses its existing final-image simulation. No DocuSign decision is deferred. Receipt remains for final page review.


Conditional content requirements (CHG-078): a declared content slot may specify `requiredWhen` with a global configuration ID and an optional `equals` value (default `true`). A string slot requires nonblank text when the effective configuration matches. A structured slot lists its required string `properties`. The same source contract drives compiler/checker validation and Library metadata. Home entry-notice title/text uses its enablement boolean; Eligibility child note uses `child-collection-mode = notice-only`. Effective content and configuration values remain Site-owned overrides of the global definitions/defaults.


Application header copy (CHG-079): Membership, Eligibility, Coverage, Beneficiary, Contact, Profile, Review, Payment and the five Health pages share `application-header-client-copy`. Their page files declare title/introduction slots pointing to existing global content definitions/bindings. Effective Sites can override those strings without changing page assignment or behavior; ASCE inherits defaults. This permission excludes breadcrumbs, navigation, validation/verification and legal statements. The existing shared frame renders the effective header. Health QD’s full-screen image handoff overlays that frame, so its host-header values do not edit provider screens or add another header. Other copy continues to receive its page-specific review.


Membership configuration boundaries (CHG-090): shared field mappings may declare `constraints` keyed by mapped field ID. `included: true` prevents Site hiding, `required: true` requires applicable values and disallows optional-product exceptions, and `fixedProperties` keeps listed properties equal to the global field definition for that placement. Membership applies these to its six core fields, with global email/phone validation properties fixed. Other placements keep their existing contracts. CHG-091 extends the page boundary globally: public page definitions and positions are fixed by the template. Only Beneficiary/Payment declare `siteRequirementOptions` (none, optional, required) in `parked/pages.json`; all other page requirements inherit globally. Site position changes and unsupported requirement values reject. This replaces CHG-090’s Membership-only entry flag. These declarations are enforced by the shared resolver/compiler and requirements checker and documented through the global Library rule. See [Membership audit](../project-review/membership-component-review.md).


Person-scoped field participation (CHG-093): a Site page file may declare `fieldParticipation: { spouse: { hide: ["birth-date"] }, child: { include: ["active-military"] } }`. The IDs remain canonical; the scope supplies the person, and stored answer keys keep the existing person prefix. Selections validate against the primary page mapping and do not hide verification-dialog fields. Mapping `constraints.included` and `constraints.required` accept true or an explicit list of mapped people. Eligibility fixes member ZIP/state/DOB collection and requiredness; its DOB constraint targets self, leaving spouse/child selection configurable. Child student/Armed Forces questions default off; ASCE enables student only. Shared field option and eligible-state configurations are preserved.

Coverage configuration boundaries (CHG-094): [Coverage audit](../project-review/coverage-component-review.md) inventories shared defaults, Site/product/applicant scopes, question overrides and policy checks. Shared policy definitions explicitly declare product/applicant override support. The optional cost breakdown defaults off and uses reconciled quote components; pricing policies own fees/credits rather than display amounts. Declared configuration `replaces` paths retire captured parent/descendant settings while preserving current canonical bindings. Library, prototype and synthetic Storybook assignments consume the same source.

Coverage URL boundaries (CHG-095): `category` and `categories` share parsing, campaign resets and one canonical saved category key; explicit `category` takes precedence if both are present. URL `dprods` locking requires a valid product/applicant `amt`, independently of configured locks. Global URL records in `requirements/global/products.json` own Library/reference behavior and values, including supported `firstCategory` and removed `ctg`. See [Coverage URL review](../project-review/coverage-component-review.md#coverage-url-review-chg-095).

Coverage presentation cleanup (CHG-096): `coverage-increase-note` selects a shared additional/total message only; it does not change amount calculations or policy. Category expansion is retired globally. Optional `retiredRuleKeys` and `retiredConfigurationKeys` under `global/application.json` remove superseded rules/associations and configuration definitions/values by key or path, including aliased saved records, while rejecting active conflicting authoring. Retirement metadata is global and cannot be supplied as a Site setting. See [Coverage presentation cleanup](../project-review/coverage-component-review.md#coverage-presentation-cleanup-chg-096).

Beneficiary configuration boundaries (CHG-097): applicable core record/opt-in fields remain globally included and required; labels and canonical relationship subsets retain Site overrides. Structural choices and share/date format contracts stay global. Optional Site product/applicant/Association participation uses a shared global definition and resolved Association context. Current URL applicant scope governs page records as well as routing while inactive saved records are preserved. See [Beneficiary configuration audit](../project-review/beneficiary-component-review.md#non-copy-configuration-audit-chg-097).

Contact non-copy configuration review (CHG-098): [reviewed boundaries](../project-review/contact-component-review.md#non-copy-configuration-review-chg-098) keep core member address collection required, retain conditional spouse/business overrides and preserve global formats. Business correspondence independently reveals address-only fields when available. Effective complete business hiding omits correspondence and persists Home; all hidden correspondence uses the global Home value. Current URL-filtered elections and available controls govern business participation and same-as-home copying. ASCE inherits shared defaults.

Profile non-copy configuration review (CHG-099 / CHG-100): [corrected boundaries](../project-review/profile-component-review.md#non-copy-configuration-review-chg-099--chg-100) keep Financial questionnaire and Other coverage questions global, retain supported personal controls, keep physician fields global with a whole-section visibility setting (shown by default), and require all four carrier fields. Financial calculations are global-only; questionnaire enablement and product thresholds retain their existing Site policy. Hidden personal questions suppress retained follow-ups through shared compiled dependencies, and global field definitions remain present even if every Site hides them. ASCE retains existing values and its disabled financial questionnaire.

Review non-copy configuration review (CHG-101): [configuration boundaries](../project-review/review-component-review.md#non-copy-configuration-review-chg-101) keep acknowledgement/policy fields global while preserving approved header slots and shared legal-policy assignments. Canonical Association selection, consistent jurisdiction normalization, explicit scope/reference validation and duplicate-control checks close configuration gaps. ASCE retains its existing MCR policy, notice placements and documents.

Review disclosure presentation (CHG-102): Read & Sign remains expanded; Electronic Consent uses the shared 240px scroll region with full printing and legal links. Presentation is projected from the global Review page definition. The redundant advisor locked-steps banner is retired; existing advisor Profile handoff, applicant Review/request-edit context and ordinary applicant continuation remain documented and verified in the [Review checkpoint](../project-review/review-component-review.md#disclosure-presentation-and-advisor-context-chg-102).


Payment non-copy configuration review (CHG-103): [reviewed boundaries](../project-review/payment-component-review.md#non-copy-configuration-review-chg-103) keep applicable collection fields and validation global while retaining Site labels, approved content slots and effective payment policies. Page collection, method-specific choices/defaults/locking and shared controls retain their existing definitions. ASCE assignments and active-answer storage are unchanged.


Health non-copy configuration review (CHG-104): [reviewed boundaries](../project-review/health-component-review.md#non-copy-configuration-review-chg-104) keep medical question/follow-up definitions questionnaire-controlled and reject ordinary Site field overrides. Effective questionnaire/product/state/applicant participation, approved title/introduction slots and QD prototype image assignments retain their existing contracts. Source optionality and ASCE QD-only participation remain unchanged.


ASCE Payment correction (CHG-105, November 17, 2026): ASCE now assigns Payment optional, superseding its earlier required exception; Beneficiary remains optional. The global Payment default remains required. Existing shared opt-in, active-answer filtering and required/optional Storybook examples use the same Fresh-start projection. See [Payment checkpoint](../project-review/payment-component-review.md#asce-optional-payment-correction-chg-105).


ASCE Coverage confirmation (CHG-106, November 17, 2026): [effective values and copy](../project-review/coverage-component-review.md#asce-coverage-values-and-product-notes-chg-106) record the $10,000 adult Term minimum, $100,000 same-applicant existing-plus-selected CIR threshold, retained QD products/additional instruction, supplied product descriptions/notices/name and verified same-policy spouse caps. Shared presentation/cap schema is global; ASCE owns the values. This supersedes CHG-047 and the earlier unconditional note-only spouse exception.


Advisor non-copy configuration review (CHG-107, November 17, 2026): [reviewed boundaries](../project-review/advisor-component-review.md#non-copy-configuration-review-chg-107) protect global mode/core entry requirements and validation. Advisor code is globally nonblank with no Site format/length override. Approved entry header and identity-label overrides remain; confirmation copy/actions and handoff/reset rules remain global. Shared Send dialog/default copy now derives from Fresh-start. ASCE inherits these contracts.

Resume configuration checkpoint (CHG-108, November 17, 2026): [reviewed field boundaries](../project-review/resume-component-review.md#non-copy-configuration-review-chg-108) keep email, Text/Call and six-digit code collection, labels, choices and validation global. Shared feedback examples use Fresh-start copy. All thirteen retention/recovery timing and limit values are fixed globally at the confirmed values. Authored Site overrides are rejected and captured scoped values cannot supersede the global projection. ASCE inherits the contracts.

DocuSign non-copy configuration review (CHG-109, November 17, 2026): [configuration boundaries](../project-review/docusign-component-review.md#non-copy-configuration-review-chg-109) keep page participation/order, portal copy, signer/completion and shared document rules global. Effective Sites retain prototype image-sequence assignments only. The external-screen configuration now has an authored global Library definition; captured semantic aliases cannot replace it. ASCE retains its current image and no production service is added.

Receipt non-copy configuration review (CHG-110, November 17, 2026): [configuration boundaries](../project-review/receipt-component-review.md#non-copy-configuration-review-chg-110) retain the eighteen approved Site copy slots and global outcome, reference, privacy, document and medical-note rules. The nonempty payment notice now follows the shared active-payment projection, including Bill me; disabled/declined/stale/incomplete/invalid payment suppresses it. ASCE inherits this rule without a new setting or service.

Shared redirect-template non-copy review (CHG-111, November 17, 2026): [configuration boundaries](../project-review/recovery-state-plan.md#non-copy-configuration-review-chg-111) retain one global component, fixed mapping/layout/actions and three Maintenance wording slots. Application inactivity is confirmed globally at 45 minutes with a two-minute warning; Fresh-start configuration definitions replace provisional constants/rules. The separate fixed Resume MFA session remains thirty minutes; both session expiries use the shared page, while link/code expiry stays inline. ASCE inherits the definitions without new services or routing.

Content/flow audit (CHG-112, November 17, 2026): [current review](../project-review/content-library-review.md) records the approved sequence and per-page inventory format. Unreferenced workbook content is internal archived evidence, with its old content root retired from active projections. The Admin Library reconstructs authored Fresh-start global/enrolled-Site records instead of browsing captured imports as global definitions, and workbook provenance remains internal. ASCE behavior/content/fields are preserved. Confirmed Advisor/Resume identity and signing-lifecycle decisions are recorded in the review, with the tutorial linking to the defined flow and correction requests remaining optional. The other flow reviews and page content inventories remain in progress.


Unified Content and shared-copy ownership (CHG-115, November 17, 2026): [reviewed model](../project-review/content-library-review.md#unified-content-and-shared-wording-chg-115) presents content and documents in one inventory, with Emails as its own Library destination. Global authored values live under `requirements/global/content/`; `requirements/global/content-references.json` owns shared wording references, and `content-bindings.json` declares their consumer placements. Generated binding rows are usages, not separately authored text. Applicant labels are owned once in `content/people.json`. The same resolver/compiler supplies Library, prototype and Storybook; ASCE inherits it. Existing independent Site wording controls are retained.

Content/flow presentation (CHG-116, November 17, 2026): [reviewed changes](../project-review/content-library-review.md#content-and-flow-readability-chg-116) order Content by shared topic and fixed page sequence, with readable page placements. Preview-only timestamp and Yes/No copy records are retired; boolean readouts use shared field choices. Flow steps expand canonical Components examples and link configured Emails, with alternatives grouped per step. Global ownership and ASCE inheritance are unchanged; no additional workflow behavior is implemented.

AMA-GI enrollment (CHG-140) extends the same source model: its identity/association assignments live in its Site application source, startup and the mock service recognize catalog enrollment, and default-enabled whole-section Profile settings include Other coverage alongside physician information. AMA-GI selects SSN-only Profile through these settings and existing field participation. See [AMA-GI assignments and evidence](sites.md#ama-gi--november-19-2026-chg-140).
