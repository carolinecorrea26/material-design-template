# Profile component review

Current checkpoint: the November 16 non-copy configuration review (CHG-100)
uses the corrected global questionnaire/Other coverage boundaries. All user
decisions are resolved; verification results are recorded below.

November 13, 2026 — CHG-059. The global/ASCE Profile migration covers components,
fields, rules, validations, configuration, content and storage. No Profile policy
questions remain open. Production integration requirements remain documented;
the prototype does not send email or invoke underwriting services.

## Ownership and shared projection

The global template owns `requirements/parked/profile.json`: route, placement,
13 section definitions, 81 person-bound page fields, conditional field predicates,
one four-field disability dialog and two independent collections. Canonical field
properties live in `parked/field-details.json`, options in `global/option-lists.json`,
and applicability in `mappings/page-fields/profile.json`. The four dialog fields are
validated in their dialog, not registered as page inputs.

`global/content/profile.json`, the Profile rules in `global/rules/application.json`
and `global/rules/profile.json`, and `global/validations/profile.json` own shared
copy and requirements. `mappings/requirements/profile.json` connects them to the page.
Global configuration definitions/defaults in `global/application.json` own the NY
replacement notice and financial calculation policy; this text/formula data is not
copied into the renderer.

The global application contract fixes Profile participation and order. ASCE inherits
that contract through `parked/sites/asce/pages/profile.json`.
Its products, underwriting, questionnaire feature and any policy thresholds come
from its effective product assignments. ASCE keeps the financial questionnaire
**disabled**. ASCE's field assignment makes spouse SSN optional when every active
spouse election is `di-ltd`; an additional product retains required SSN. Member SSN
remains required. The MCR is policy provenance, not the owner of shared behavior.

Library, prototype and Storybook compile these same sources. Financial Storybook
variations compile isolated synthetic assignments through the real source pipeline;
they do not patch generated fields/configuration or enable another real Site.

## Composition in page order

| Area | Shared implementation | Participation and behavior |
|---|---|---|
| Application frame | AppShell, FormRoutePage, PageHeader, PageAlert, PageNav | Shared heading, progress, restoration, form feedback, Next/Back and transitions. |
| Member personal | ProfilePersonalInformation, FieldRenderer, FieldGrid, ConditionalGroup | Applying member only; height inputs share a row. Includes weight, SSN, marital status and applicable travel/underwriting questions. |
| Member follow-ups | ProfilePersonalInformation | Three placement sections keep driver number/state, intended-residence country and travel country beneath their parent Yes questions. There is no months-abroad field. |
| Member physician | PhysicianInformation, Name/address fields, AddressFields | Applying member only. Physician inputs are optional, physician phone has no phone-type selector, and third-party fields request no browser-owner autofill. |
| Member Other coverage | SectionDivider, info Alert, FieldRenderer, ConditionalGroup, DynamicList | Life questions require active Life; DI questions require active DI. Neither category hides the section and its note. |
| Member financial questionnaire | SectionDivider, FieldRenderer, ConditionalGroup, derived totals | Effective feature and policy must permit it. Threshold aggregates active member products only, with configured inclusive/exclusive comparison. |
| Spouse personal/follow-ups/physician | Same personal, physician and address components | Independent spouse bindings; only an actively applying spouse participates. No member personal/physician section for spouse-only coverage. |
| Spouse Other coverage | Same Other coverage composition and record dialog | Independent spouse Life/DI applicability and answers. No spouse financial questionnaire. |
| Advisor continuation | SendApplicationDialog | After validation, Cancel stays on Profile; Send continues to the existing advisor confirmation. Consumer flow continues normally. |

Removed products' saved applicant maps do not reveal personal/physician sections,
labels or summary entries. Contact's member owner-address and employment rules
remain independently applicable to dependent-only applications.

## Rules and validation

- Weight 12 months ago, driver's license and intended residence outside the US/Canada
  use the resolved QuickDecision outcome independently per applicant. General travel
  is a separate question. Follow-up countries appear for Yes only.
- Other coverage keeps existing Life, pending Life and disability independent. Yes
  reveals the corresponding fields. Disability replacement amount also requires
  replacement Yes. The NY Life replacement notice additionally requires the active
  applicant's applicable Life coverage, existing-Life Yes, replacement Yes and a
  configured notice jurisdiction; notice wording, font size and boldness are global
  configurable data.
- Existing DI Yes requires at least one carrier before Next, up to the configured
  maximum of ten. Restored arrays, record shape and every mapped field receive the
  same validation as the dialog. Hidden/inapplicable saved records do not block Next.
- Global field contracts and supported effective overrides own requiredness, SSN/phone/postal formatting, authored
  options, numeric/length limits and helper text. Supplied optional SSN still receives
  the SSN format check. Dialog Save checks its own four required fields.
- Self-employed Yes reveals both source checkboxes; either or both may be selected.
  Source-specific inputs follow their checkbox. Years self-employed and work-from-home
  follow self-employed Yes independently of the checkboxes. Work outside the home
  requires work-from-home Yes; details additionally require outside-work Yes.
- Questionnaire currency inputs default to zero. Sole-proprietor net earned income
  is gross earnings before expenses/taxes minus business expenses. Corporate total
  sums salary, S-Corp distribution, dividends, bonus, commission and benefits,
  including one-time bonus/commission. A missing/invalid operand produces $0.00.
  Totals derive from current answers, including losses, and are never editable or
  independently persisted. The read-only application summary uses the same formulas.
- Compiled field predicates also suppress hidden restored follow-ups in the summary.
  Collapsing a group retains saved answers; it does not copy them to another person.

## Content and storage

Global Profile content keys identify page title/subhead/navigation title, all section
headings, the Other coverage note, Company and dialog labels, summary fallback labels,
calculated-total labels and page validation copy. Field definitions identify input
labels, options, help, requiredness and supported overrides. Effective Site content
assignments and field overrides follow the existing shared precedence; the renderer
contains no ASCE wording or identity gates.

Scalar answers retain their established keys: member fields use the canonical key;
spouse fields use `spouse-<field>`. Collections remain `selfDisabilityCompanies` and
`spouseDisabilityCompanies`. Both use one `disabilityCompany` surface mapping:

| Dialog field | Record value |
|---|---|
| di-company-name | company |
| di-company-monthly-benefit | monthlyBenefitAmount |
| di-company-benefit-period | benefitPeriod |
| di-company-waiting-period | waitingPeriod |

DynamicList owns record identity and Add/Edit/Save/Cancel/confirmed removal. Collection
limits and mappings are projected configuration, not parallel component defaults.
No saved-answer keys were renamed, reinterpreted or transferred between people.
Financial totals are derived display values; only their inputs are saved.

## Verification and review examples

Whole-page Storybook examples cover empty/restored states, disability records,
member and spouse, spouse-only disability, synthetic financial threshold reached/not
reached and advisor handoff. Standalone personal, physician, Other coverage, carrier
and financial examples use the supported components and real source fields.

Focused checks cover active/stale applicant elections, spouse SSN policy combinations,
carrier minimum/maximum and restored-record validation, QD follow-ups, NY notice,
financial arithmetic/zero defaults, parent-answer collapse, read-only summary and
advisor continuation. Fresh-start reconstruction removes superseded authored page,
field, product and workflow records and checks the Library/prototype/Storybook
projection, ownership and synthetic configuration isolation.

Final results: **124 focused checks and 49 fresh-start checks passed**. Application
and Storybook production builds, both TypeScript projects, targeted ESLint,
requirements mapping, generated catalog/component/icon/organization checks and
handoff checks passed. Source, application and Storybook catalog bundles match.
Browser verification confirmed spouse-only composition and the live $90,000 minus
$25,000 = $65,000 financial total. The shared standard-label field example and
standalone test fixtures were updated to current authored fields and explicit
presentation data; those checks pass without changing other page behavior.


## Client configuration and copy review (CHG-082)

User decision November 15, 2026. Profile has exactly two Site content slots: `page.profile.title` and `page.profile.subhead`, with global defaults. Effective values belong in `parked/sites/<site>/pages/profile.json` → `content`; ASCE inherits both.

| Profile item | Owner / configurability |
| --- | --- |
| Page title and introduction | Site wording overrides; global definitions/defaults |
| Personal information, Other coverage and Financial questionnaire headings | Global, reused for applicable member/spouse sections |
| Other coverage information note | Global; same note for applicable member/spouse sections |
| Physician wording, record controls, navigation/loading and validation | Existing global/shared component and field contracts; no Profile copy slots |
| Input labels/options/requiredness | CHG-100 keeps Financial questionnaire and Other coverage questions global. Supported personal overrides remain; physician fields are global with whole-section visibility; carrier labels retain their separately approved configuration |
| NY replacement notice and financial totals | Existing shared policy/calculation configuration; no free-form page copy override |
| Section participation, optional spouse SSN and questionnaire thresholds | Existing effective product/field/policy settings; ASCE financial questionnaire remains disabled |

This completes Profile's copy classification without changing wording, components, answer storage or field/policy behavior. Global-only strings are rejected as Site page content. The same fresh-start projection serves Library, prototype and Storybook.


CHG-082 verification: **73 fresh-start checks passed**, including effective header inheritance and rejection of global-only Profile, Review, Payment and Health copy overrides. TypeScript, focused ESLint, requirements mapping, component/reuse/icon/handoff checks and prototype/Storybook production builds pass. Public, application and Storybook catalog artifacts match. No runtime page composition or Site assignment changed in this checkpoint.


## Non-copy configuration review (CHG-099 / CHG-100)

November 16, 2026. The corrected user decision makes Financial questionnaire and
Other coverage questions global. This supersedes the initial broad permission
answer; there is no pending policy for hiding financial inputs because Sites cannot
hide those inputs. Personal fields retain supported Site controls. Physician fields stay global, with only whole-section visibility configurable.
All decisions for this checkpoint are resolved.

| Item | Global definition / effective Site permission |
| --- | --- |
| Page participation/order | Fixed global application contract; no Profile skip/reorder override |
| Personal fields | Supported Site inclusion, requiredness, label and option overrides remain. Existing underwriting and applicant applicability still apply |
| Physician section | Identical global fields, wording, choices, optionality and validation. `physician-information` defaults true; a Site may hide the whole section, never individual fields. Both adult sections use the same setting and existing applicant participation |
| SSN | Global format; default required, with supported Site field collection and product-scoped optionality. ASCE retains spouse DI-only optionality and required member SSN |
| Other coverage questions | Global wording, fields, choices, inclusion, requiredness and format; no Site question overrides. Active Life/DI applicability and Yes follow-ups remain global |
| Disability carrier records | All four fields included and required. Carrier labels retain the separately approved overrides. One through ten records for each active DI applicant answering Yes; independent member/spouse storage |
| Financial questionnaire fields | Global wording, inclusion, requiredness, choices, formats and defaults, including optional source checkboxes; no Site field overrides |
| Financial calculations | Global-only formulas, operands, labels and currency in `shared.profile.financialCalculations`. Scoped replacements are rejected; captured replacements cannot survive reconstruction |
| Questionnaire applicability | Global `shared.profile-financial-questionnaire` definition. Existing effective Site feature and product/amount thresholds remain configurable; ASCE keeps the feature disabled and has no new policy assignment |
| Format validation | Supplied SSN, phone, postal, currency and license values follow global format/input definitions. Hidden/inapplicable controls do not validate |
| NY replacement notice | Existing shared legal-policy configuration and global display conditions remain; it is separate from the question override contract |
| Title/introduction | Existing two Site content slots, global defaults. Section headings, Other coverage note, generic actions and validation wording remain global |
| URL scope | Current product/applicant scope affects adult participation, categories, SSN optionality and financial applicability. Retained out-of-scope elections/records cannot activate sections or block Next |

The global applicability definition remains visible in the Library under Global
and Site filters without an assignment. Effective assignments configure member
product groups, nonnegative thresholds and inclusive/exclusive comparisons. With
no policy assignment, existing assigned financial question sets retain applicability.
An enabled feature and active matching member product are required, even at an
inclusive zero threshold. Storybook uses this definition directly.

Profile opts into the shared `hideFollowupsWhenQuestionHidden` page contract.
The compiler derives same-page `visibilityDependencies` from the existing global
predicates. Shared field resolution removes unavailable follow-ups transitively,
including after underwriting filtering; it never deletes saved drafts or requires
an earlier-page field to render again. The page and read-only summary use those
same resolved fields. Empty personal sections are omitted. A physician section is omitted when the shared visibility setting is off, while its saved drafts remain retained and absent from the preview. Global field
placement now uses shared definitions, so a field hidden by all effective Sites
still exists in the Library and its dependency references remain valid.

The page reuses FieldRenderer/FieldGrid, ConditionalGroup,
PhysicianInformation/AddressFields, DynamicList and SendApplicationDialog.
ProfilePersonalInformation composes paired height fields and ordered personal
follow-ups for both adults; ProfileSections composes the distinct page areas,
carrier records, legal notice and derived totals. These composition boundaries do
not duplicate shared inputs or dialog interactions. No new component was introduced. One meaningful physician-hidden Storybook variation demonstrates the shared visibility setting; it does not copy fields or add a second physician component. Global defaults and existing examples use the
same source/projection as the prototype and Library. No ASCE assignment changed.

CHG-100 verification: **89 Fresh-start and 80 focused checks passed**, covering default/hidden physician sections, immutable physician/questionnaire fields, personal controls, SSN policy, carrier validation, URL restrictions, retained drafts, preview consistency, Storybook and shared Contact/field regressions. TypeScript, focused lint, requirements, component, icon, organization and handoff checks passed. Application and Storybook production builds passed; public, application and Storybook catalog bundles have identical SHA-256 hashes. Profile configuration review is complete with no open questions.
