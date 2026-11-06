# Site requirements specification (redesignv6)

Status: **draft for review**. This replaces the "catalog" model. It describes how the
requirements of a site are authored, layered and consumed. ASCE is the only site in scope;
other sites are added later, bringing any new rules or configurations they need.

> **Current draft:** The sections below describe an earlier model and are awaiting review.
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

## Defaults: global states them, a site overrides

Everything global states its own default. A site file only says what it does differently, and
anything it does not mention is inherited. The same rule applies to every kind of thing:

| Thing | Default is stated in | Values | A site overrides in |
|---|---|---|---|
| **Page** | `parked/pages.json`, `requirement` (until Rules are reviewed) | required · optional · none | `sites/<site>/pages.json` |
| **Section** | the page file; on unless marked `"default": "off"` | on · off | the site's page file, `"show": true` or `false` |
| **Field on a page** | `parked/<page>.json` layout: on, or `optional` for off | on · off | the site's page file: `include` or `hide` |
| **Field required or not** | the field list, `required` | true · false | `sites/<site>/fields.json` |
| **Field wording and options** | the field list | | `sites/<site>/fields.json` |

For example, Membership ID is not required by default, because ABE and WAEPA do not require it.
ASCE overrides it to required. Health: Critical Illness is `none` by default, because nine of ten
sites do not use it, so ASCE overrides nothing.

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

The checker rejects a field mapping for a person its definition does not allow.

## Placing fields on a page

Component/page mappings record possible participation. Section placement, field
rendering order, and default visibility remain parked layout evidence until reviewed.

A site file only says what it does differently: **`include`** an optional field, **`hide`** a
default one, or re-word a field. A site never needs to repeat what it inherits.

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
when it has a `parked/sites/<site>` folder (today ASCE); there is no site list in
code. The page or surface still decides which fields appear and in what order, and
names any follow-ups it places after a parent (the quote places the two tobacco
follow-ups after tobacco use). Choice fields must name their options, an option
list, or a runtime source such as `product-defined`. The quote calculator and Home
card use the loader today; other records do not by themselves change runtime behavior.

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
  entry/calculator separation and the quote product-selection check are confirmed;
  other confirmed partial decisions are recorded in the page review.
- Age eligibility and geographic restrictions remain unresolved; no new limits or
  eligibility policies are inferred. The quote-entry helper checks date format,
  while shared field validation checks calendar-date validity. Both are recorded
  distinctly; making their behavior consistent is an unapproved future decision.

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

New records remain drafts, supported by implementation sources and focused tests.
Open decisions include the detailed Apply validation/error presentation,
exact business amount/eligibility policies, missing-destination handling, and
activation of this declarative requirements model. The current Payment-to-Receipt
fallback is documented as existing behavior, not newly approved.

### Eligible-state presentation and shared quoting review

[Address configurations](../../requirements/global/configurations/address.json)
define `eligible-states-only` (default false) and `eligible-states` (default empty).
[Address presentation](../../requirements/global/presentation/address.json) uses the
full authored list when the toggle is off and the configured codes when on, preserving
labels and order and comparing codes without a leading `US-`. The intended configuration
requires a non-empty list when enabled; it is separate from product geographic eligibility.
The current checker validates
the definition shapes; applying site values and enforcing the toggle/list dependency
are not implemented in the fresh-start resolver.

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
workflow were removed. Home is the only quote entry point. All new records remain draft.
Quoting is still under review; shared Next drafts are parked for the subsequent
low-hanging-fruit review.

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
eligibility inputs (ZIP, state, birth date), product selection/amount controls,
other sites, and Coverage's saved definitions remain on their existing paths. Quote riders are
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
  Current Apply revalidates eligibility only when entry was collected inside the
  calculator. Revalidating applicable answers and selections on Apply is confirmed
  but not yet implemented. Requiring at least one
  selected product on Apply is confirmed but not yet enforced in the quote.
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
- Quote dropdown filtering now matches application field filtering. This change
  does not add a submission-rejection policy; location feedback alone does not
  establish one. The toggle/list dependency is not enforced by a fresh-start
  resolver. Back navigation, restoration, and standard loading and recovery states
  remain for the subsequent review, not newly approved requirements.

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
generalized draft IDs are now `state-province-from-postal-code`, `required-fields`,
and `date-value-format`. The confirmed `home-quote-entry-handoff` ID is unchanged.
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
