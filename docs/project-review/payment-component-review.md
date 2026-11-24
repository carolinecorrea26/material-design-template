# Payment final fresh-start review

November 14, 2026 · CHG-070. Complete for the global template and effective ASCE Site. This checkpoint replaces the October 28 component-only review. No Payment policy question remains open. DocuSign and Receipt retain their separate final reviews.

## Ownership and source

The global page at `requirements/parked/payment.json` owns three ordered sections: optional collection, payment elections and banking information. `mappings/page-sections/payment.json` owns their order. Global field definitions, `paymentControls`/`paymentBank` surfaces, content, rules, validation messages and configuration defaults compile into the same projection for Library, prototype and Storybook. Runtime product fields use those shared surfaces; they are not duplicate static page fields.

An effective Site supplies its page requirement, assigned product payment policies and optional note content. ASCE values belong under `requirements/parked/sites/asce/`; MCR references are provenance for those values. No additional real Site is enabled. Standalone examples project source fields/sections; whole-page configuration variations compile detached source assignments through the real compiler.

## MCR and confirmed policy

Evidence: extracted MCR v78, `Main!AE165`, `AH165`, `AJ165` and `New UX Multi-page Requirements!AT21`. User decisions November 14, 2026, updated November 17, 2026 (CHG-105), resolve the conflicts below.

| Item | Effective ASCE rule |
| --- | --- |
| Collection | Optional, confirmed November 17, 2026. Show the shared Yes/No opt-in; No continues without payment details, Yes uses the applicable required fields. This supersedes the earlier required exception. |
| Methods | Bank account (ACH) or Bill me (Direct Bill); no card-entry form. |
| Frequencies | Monthly, Quarterly, Semiannually, Annually for both methods; not locked. |
| Defaults | Preselect configured Bank account + Monthly when answers are absent. Preserve explicit saved choices. |
| Product scope | Independent choices per product. Member/spouse/child entries within a product share that product's election. ASCE synchronization is false. |
| Premium taxes | Shared Payment note: Ontario/Manitoba 8%; Saskatchewan 6%. Wording is conditional on residence. Do not add tax to displayed estimates. |
| Fees | MCR fee cell is N/A; no ASCE fee note or new fee calculation. Other Sites can supply shared or product notes using the same global slot. |
| Next | Collect and validate details, use the normal save/navigation path and continue to DocuSign. No authorization, declined-payment test or application submission on Payment. |

`Main!AK165` is the credit-card-processor column, not tax-application instructions. No processing rule is inferred from that cell.

## Structure, components and content

| Area | Owner and behavior |
| --- | --- |
| Frame | FormRoutePage owns title, Back, progress, field/page feedback, restore/save and Next. PageHelp/PageHelpChips/PageHelpDrawer use the shared source-defined payment-handling topic. |
| Optional collection | FieldRenderer shows the required Yes/No opt-in only for optional collection. No hides the collection controls; Yes uses the same required controls. A `none` requirement collects nothing. |
| Elections | PaymentSections renders supplied section order, standard MUI info alerts, shared controls and CategoryCard/ProductCard compositions. It reads no Site policy. No applied product shows return-to-Coverage guidance and blocks Next. |
| Payment controls | Shared FieldRenderer controls use effective allowed methods and method-specific frequencies. A method change retains an allowed frequency; otherwise it selects an allowed configured default or clears it. Frequency is disabled before a method and when locked. Locked policy defaults replace incompatible saved frequencies so a disabled field cannot trap the applicant. |
| Shared-choice capability | Independently configurable method/frequency flags default off. If enabled, offer only the intersection accepted by all collecting products and update canonical product answers. Product-policy synchronization requires both shared controls. Empty intersections show global guidance and block Next. |
| Ordering | Active entries use the shared effective category/product order, including the shared featured-product ordering. Removed/deselected products and people do not participate. |
| Costs | TotalCostSummary/EstimatedRate preserve loading, missing-information, unavailable and reference-table states. Rates use the selected product frequency and include selected attached-rider charges through the shared rate hook. One total per product; applicable applicant rows appear only when dependents participate. Labels come from effective applicant labels. Prototype rates are fictional. |
| Banking | One SectionDivider contains shared bank fields when any current collecting product selects Bank account. All Bill me hides it. The same bank details apply across products using ACH. |
| Footnote | Global quoted-cost wording remains below the sections, including optional deferral. |

PaymentSections remains a justified page composition of existing shared components. Notes and timing explanations use standard MUI alerts; no new tax, fee or page-help component is introduced. Native alerts/footnotes are registered parts of their owner, not separate component identities. TotalCostSummary's optional breakdown is a shared capability.

Global wording lives in `global/content/payment.json`, shared application UI/help content and field definitions. Fixed labels, validation text and help are not implicitly Site-editable. The declared `payment.notes` content slot is Site-configurable and defaults to `[]`. Each note has a stable unique `id`, nonempty plain `text` and `productKeys`: empty means display once above the product cards; a product list means display inside each applicable selected product card. Mixed shared and product notes are supported. The compiler rejects malformed, duplicate-id and unassigned-product notes. Notes do not affect pricing. No HTML or page-specific implementation is stored in a Site.

## Validation and storage

| Active input | Check and saved representation |
| --- | --- |
| Method/frequency | Required for each collecting selected product; must be an offered effective combination. `payment-method:<product>` / `payment-frequency:<product>` are canonical. Saved `annually`/`semiannually` map to policy `annual`/`semiannual`. |
| Optional opt-in | Required Yes/No when optional; stored as `payment-information-opt-in`. No prevents hidden product/bank validation. |
| Account holder / institution | Required nonempty strings when bank collection is active: `bank-name-on-account`, `bank-institution`. |
| Routing number | Required nine-digit string, including leading zeroes: `bank-routing-number`. |
| Account number | Required digit string of at most 17 characters, including leading zeroes: `bank-account-number`. |
| Bank authorization | Required checked boolean when bank collection is active: `bank-authorization`. |
| Shared controls | `payment-method:all` / `payment-frequency:all` are UI synchronization state; canonical product answers remain the payment inputs. |

Draft restoration may retain hidden product, optional-payment or bank answers. They do not reactivate hidden sections or block Next. `activePaymentAnswers` filters generated payment/document output to active selected collecting products and includes bank details only for a current allowed bank method. Removed-product, shared-UI and hidden bank answers are excluded. Save persistence retains draft answers; it is not an authorization or charge. Content/configuration and applicant answers remain separate records.

No live bank validation, hosted-card implementation, payment processor, tax calculation, charging or delivery is added. Production billing/processing is outside this page. Technical failures follow the shared error/session model; validation/business feedback stays on the page. There is no separate payment-issue page.

## Verification

Focused checks cover defaults/restoration, locked-frequency recovery, optional and disabled collection, stale product/applicant exclusion, supported method/frequency validation, shared-choice propagation, shared/product note isolation, banking visibility, active document filtering and normal Next to DocuSign without payment service calls. Fresh-start checks reconstruct the page without superseded records and compare Library, prototype and Storybook sections, controls, policies, content and configuration. Application/Storybook builds, catalog checks and component-reuse evidence are the release verification gates for this checkpoint.

Verified: 47 focused checks and all 62 fresh-start checks pass. Prototype and Storybook production builds, both TypeScript configurations, focused ESLint, requirements mapping, component/icon/handoff checks and whitespace checks pass. Built-browser checks confirm configured defaults, ASCE tax copy, Bill me hiding banking, and shared/product note placement. Component evidence still resolves 110 canonical owners with no unmatched declarations or uncovered sources. The public, prototype and Storybook catalogs have identical SHA-256: `66247db14acbd0e5a77a1db6431d0f5ea8311eb7b45284fcfa3c8b011f7d7ac0`.


## Client configuration and copy review (CHG-082)

User decision November 15, 2026. Payment retains three Site content slots: `page.payment.title`, `page.payment.subhead` and `payment.notes`. Global definitions/defaults own all three; effective values belong in `parked/sites/<site>/pages/payment.json` → `content`. ASCE inherits the header defaults and retains its shared tax note.

| Payment item | Owner / configurability |
| --- | --- |
| Page title and introduction | Site wording overrides with global defaults |
| Shared/product billing, fee or tax notes | Existing configurable `payment.notes` list; global default empty |
| You will not be charged yet heading/explanation and estimate disclaimer | Global system wording; not Site page-copy slots |
| Section labels, generic help, navigation/loading and validation messages | Existing global/shared component contracts |
| Field labels/options/requiredness, available methods/frequencies/defaults, collection requirement and shared-choice settings | Existing shared field and effective payment-policy/configuration contracts |

This completes Payment's copy classification. No calculation, pricing, authorization, charge, collection rule or shared component changes. Protected timing/estimate overrides are rejected; existing shared/product notes remain independently configurable across Library, prototype and Storybook.


CHG-082 verification: **73 fresh-start checks passed**, including effective header inheritance and rejection of global-only Profile, Review, Payment and Health copy overrides. TypeScript, focused ESLint, requirements mapping, component/reuse/icon/handoff checks and prototype/Storybook production builds pass. Public, application and Storybook catalog artifacts match. No runtime page composition or Site assignment changed in this checkpoint.


## Non-copy configuration review (CHG-103)

User decision November 16, 2026. The Payment page retains its global position and
structure; Site page requirement is one of none, optional or required. Global
mapping constraints now enforce the collection/validation boundary in the same
field resolver/compiler used by Library, prototype and Storybook.

| Configuration | Ownership and supported variation |
| --- | --- |
| Applicable opt-in, product/shared method and frequency, bank details and authorization | Globally included and required. Site hiding, optionality and product-specific optional-field exceptions reject. Runtime conditions still determine which fields apply. |
| Field formats and canonical choice definitions | Global. Site field overrides cannot alter formats/lengths or narrow the canonical Yes/No, method or frequency lists. Effective product policy supplies the available method/frequency combinations. |
| Field labels | Site overrides retained with global defaults. |
| Page collection | Site none/optional/required; ASCE is optional by the November 17 confirmation (CHG-105). Optional No and none suppress collection and its validation. |
| Product payment policy | Effective allowed methods, method-specific frequencies, defaults, frequency lock and product synchronization remain configurable through the shared policy definition. Missing defaults are allowed; provided defaults must be available. Explicit saved choices are preserved and validated; locked frequency follows policy. |
| Sharing | Global boolean definitions default off, with Site values for shared method and shared frequency independently. Product synchronization enables both. Intersections govern offered choices; no common choice blocks progression. Canonical answers remain per product. |
| Header and billing notes | Approved Site title/introduction and shared/product notes retained. Notes do not change pricing. Timing, estimate, validation and action wording remain global. |
| Costs, ordering and applicants | Shared effective product/category order, active applicant scope and rate presentation; no Payment-specific ordering, applicant or price implementation. |

The existing PaymentSections composition is retained: it composes FieldRenderer,
shared payment controls, standard MUI alerts, CategoryCard/ProductCard,
TotalCostSummary and SectionDivider. It has distinct page composition duties;
no duplicate field, help, alert or rate component is introduced. Whole-page
Storybook examples already cover independent/shared choices, optional collection,
locked frequency, notes, restoration and dependent costs through detached
Fresh-start assignments.

Storage remains unchanged: bank numbers are strings retaining leading zeroes;
only active selected products and an active allowed bank election contribute to
payment documents. Hidden draft answers remain restorable. ASCE retains Bank
account + Monthly defaults, independent elections, optional collection and its
Canadian-tax note. The credit-card hosted form remains a recorded production
capability with no local card-entry implementation; this review adds no service,
charge, submission or routing behavior. No Payment policy question remains open.

CHG-103 verification: **89 Fresh-start and 69 focused checks passed**. Checks cover required-field and fixed-format/choice override rejection with retained label overrides, Library/prototype/Storybook field agreement without superseded records, optional/disabled collection, configured defaults and locks, shared choices, notes, banking visibility, active payment storage and normal continuation to DocuSign. TypeScript, focused lint, requirements, component/reuse/icon/organization/handoff checks and both production builds passed. Public, application and Storybook catalog artifacts match.


## ASCE optional Payment correction (CHG-105)

November 17, 2026. ASCE Payment is optional, superseding the November 14 required
exception. Beneficiary remains optional. This is an effective-Site assignment in
`requirements/parked/sites/asce/pages/payment.json`; the global Payment default
remains required, with optional/required/none still supported.

The existing shared Yes/No question controls collection. No permits continuation
to DocuSign without product elections or banking fields; Yes preselects the
configured product defaults and requires applicable choices/details. Retained
hidden payment data stays out of active payment documents and Receipt's Payment
PDF action. Existing methods, frequencies, independent product elections and
billing notes are unchanged. Library, prototype and Storybook compile the same
assignment. The required Storybook variation now explicitly selects required
collection through a detached source assignment.

The shared form frame also applies existing configured defaults when runtime controls first become applicable after opt-in. It preserves restored and explicitly cleared values. Receipt examples that include payment now explicitly record Yes; No still suppresses retained payment data and Payment PDF.

CHG-105 verification: **89 Fresh-start and 62 focused checks passed**. ASCE projects both Payment and Beneficiary optional across the shared consumers while the global Payment default stays required. Real Payment controls verify opt-in Yes with configured defaults and bank consent, and No continuing to DocuSign without details. Focused checks also verify restored choices, Receipt payment-document applicability, required/optional Storybook variations and shared frame persistence. TypeScript, focused lint, requirements and all catalog/component/icon/organization/handoff gates passed; application and Storybook builds passed, and their catalog artifacts match the public bundle.
