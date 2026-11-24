# Review page final audit

November 13, 2026 — CHG-060/061. Scope: the global template and the ASCE effective
Site, covering components, rules, validations, configurations, content and storage.
The user approved implementing the IMPORTANT NOTICE viewer; its earlier deferral
is superseded. No Review policy question remains open.

## Ownership and source

`requirements/parked/review.json` owns the global route, component composition,
preview-page scope, acknowledgement/policy surfaces, content references and retired
decision identities. Review has no ordinary scalar page-field sections: its controls
are resolved policy surfaces, restored through the shared runtime-field contract.
This preserves the established source model without cloning fields for this page.

The shared `shared.review-policy` definition and default live in
`requirements/global/application.json`. The default owns premium, fraud,
authorization and consent wording, notice conditions and jurisdiction selection.
ASCE's `parked/sites/asce/application.json` explicitly inherits that default with
`{"$default": true}`. The generic compiler expands the reference from authored
global data; effective Site overrides remain independent. The captured ASCE/MCR
provenance does not make the shared definition Site-owned.

`global/content/review.json` owns headings, guidance and action labels;
`global/content/review-notices.json` owns the structured Important Notice documents.
`content-bindings.json` projects them into the common content contract. The base
Read & Sign content is empty by default: explicit policy segments assemble the
legal body once, without replacing duplicated wording inside a legacy paragraph.
An optional authored introduction remains separate from policy wording.

`global/rules/review.json` and the shared applicable-answer rule describe behavior;
`mappings/requirements/review.json` attaches rules and validations to the page.
Canonical fields remain in `parked/field-details.json`, with effective Site overrides
resolved through the same surfaces used by the prototype, Library and Storybook.

## Composition and reuse

| Area | Shared owners | Behavior |
|---|---|---|
| Application frame | AppShell, FormRoutePage, PageHeader, PageAlert, PageNav | Existing form state, feedback, required checks, Next/Back and submitted-state locking. |
| Guidance | ReviewSections native alerts and remaining-step list | Applicant-facing advisor guidance when applicable; remaining health, Payment and DocuSign come from actual effective routing. Multiple health pages produce one list item. |
| Application readout | ConfiguredApplicationDocumentPreview → ApplicationDocumentPreview | Global preview scope, effective page participation/order and visible source fields. SSNs are masked. Review has no signature section or PDF-download action. |
| Read & Sign | LegalReviewSection, ReviewStatement, native policy blocks, FieldRenderer | One assembled legal body. Source block slots preserve position, fields, lists, font size and emphasis; CT sits directly above the member checkbox. |
| Electronic Consent | LegalReviewSection | The second shared legal section, with its own Print target. |
| Acknowledgements | ApplicantSectionDivider, FieldRenderer | Member/application owner always acknowledges; an actively applying spouse independently acknowledges. |
| Important Notice | Existing AppModal, LegalDocList, PrintAction, configured MUI Link | Each IMPORTANT NOTICE reference opens the selected structured document. Close returns without changing acknowledgements. |
| Edit workflow | ConfirmationDialog, SendApplicationDialog | Consumer edit confirmation or advisor request-edit confirmation; submitted Review removes Edit actions. |

These are the existing two legal sections and shared dialog/document components;
there is no new error, notice or legal page implementation.

## Rules, applicability and validation

- The application readout includes only configured preview pages that participate
  in the effective Site/flow. Empty groups are omitted. Field visibility and labels
  use the effective definitions; restored hidden answers remain hidden.
- Coverage readout uses current product/applicant elections, reconciled riders and
  the same configured/featured category-product order used elsewhere. It does not
  infer a new election from a saved dependent or retain an unselected product.
- Beneficiaries require active positive-amount product/applicant participation,
  an applicable beneficiary policy and the same optional-page opt-in as Beneficiary.
  Declined, removed-product, removed-applicant and zero-amount saved records are
  omitted. Their readout follows the configured product order.
- Profile readout retains its shared QD, Life/DI, financial and conditional-answer
  evaluators. Contact's owner/address rules remain independent of coverage requests.
- Fraud notice selection uses residence and active coverage. NY accident-rider
  applicability is scoped to the actual product/applicant, not another person's
  stale rider key. Missing residence does not silently select a default state.
- The November 13 user decision supersedes the earlier ASCE health-question
  exception. Medical introduction, authorization, consent and CT warning follow
  the MCR underwriting flag: active member/spouse Life, DI or Overhead. Child-only
  Life, AD&D and supplemental-health-only do not set it. Jurisdiction variants
  precede processing variants, then defaults; VA QD includes its own consent.
  The CT warning is directly above the member checkbox, with production placement
  above the member e-signature also required. The global SH attestation is 14pt
  above the signature/acknowledgement area; ASCE has no enabled SH product.
  See the [MCR matrix](review-mcr-audit.md) for source cells and conditions.
- The owner acknowledgement remains required on dependent-only applications;
  spouse acknowledgement appears only for an actively applying spouse. Removed
  product maps cannot introduce a spouse acknowledgement. Requiredness and labels
  come from the effective source surfaces, not parallel page constants.
- Shared registered field checks and active policy-control checks apply before Next,
  alongside existing coverage/aggregate validation, residence and applicant-type
  prerequisites. Optional supplied dates receive the valid-calendar-date check.
  Hidden/inapplicable policy fields do not block Next. Unsupported policy fields,
  malformed policies, invalid default references and missing notice documents fail
  configuration validation rather than silently losing content.

## Important Notice decision and content

The November 13 decision implements the previously deferred viewer. The compiler
retires the old `business-decision.rules-review.important-notice-viewer-deferral`
record from the current projection while preserving historical migration evidence.

| Residence | Global document source |
|---|---|
| Standard | MCR v78, Read & Sign!B142:B154 and B162 |
| New Mexico | Standard notice plus B156, B158 and B160 protected-person/confidential-abuse paragraphs |
| Virginia | MCR v78, Read & Sign!B187 |

The shared policy owns section-specific link tokens, the default document and
jurisdiction-to-document selection. Electronic Consent references to Important Notice
open the same selected notice; its New York Life Online Privacy Notice references
open the existing shared Footer Privacy Notice in that same viewer. The generic
IMPORTANT NOTICE warning heading remains plain text. Privacy wording is not copied. The same viewer supports each selection. Documents use structured
headings, paragraphs and address lines, never injected HTML. Their supported shape
and referenced document keys are validated. Print uses the existing isolated print
helper so unrelated application answers are excluded. Opening/closing the notice
adds no stored read-tracking field, additional checkbox or service call.

## Editing, storage and prototype boundary

Consumer Edit confirms before returning to the owning page or single-page section;
Cancel stays on Review. Advisor-prepared Edit opens the configured request-edit
dialog and continues to the existing confirmation. The prototype uses the shared
fictional advisor fixture and performs local UI/navigation; production advisor
notification requirements do not imply a delivered prototype email. The existing
`flow=advisor` context is now registered in the global URL contract and read through
the supported-value resolver; unsupported values do not activate it. An already
restored advisor session persists independently. This parameter provides UI context,
not authentication or authorization.

Persist only the established `review-self-consent`, `review-spouse-consent` and
applicable canonical policy-field answers (`dividend-acknowledgement`, optional
`dividend-first-name`, `dividend-last-name`, `dividend-birth-date`). The two adult
acknowledgements are independent. Policy controls can restore without scalar page
placement. Session state owns Review-submitted/advisor flow flags; the notice dialog
open state is local. Document groups, selected legal text and notice selection are
projections, not another editable application record.

## Verification and examples

Whole-page examples cover empty/restored consent, both adults, spouse-only,
source-compiled synthetic policy blocks/applicant prerequisites, advisor edit,
submitted lock, omitted health steps, standard/NM/VA Important Notice content,
CT DI-only placement and NY AD-only/child-only Life legal differences.
Every variation compiles source assignments; none patches generated policy fields
or enables another real Site. Shared component examples remain canonical.

Focused checks cover restoration, active/stale elections, readout ordering and
participation, legal composition/variants, notice links/selection/close, scoped
printing, source configuration isolation and existing document behavior. Fresh-start
checks reconstruct the page after removing superseded records and compare Library,
prototype and Storybook ownership/projection.

Final verification: **153 focused checks and 50 fresh-start checks passed**.
Application and Storybook production builds, application/Storybook TypeScript,
targeted ESLint, requirements mapping and generated catalog/component/icon/handoff
checks passed. Source, application and Storybook catalog bundles are byte-identical.
The built CT DI-only example visibly places the warning directly above the member
checkbox, with authorization present despite no online health step. Earlier browser
checks confirmed the shared Important Notice/Privacy viewer, New Mexico content,
Close focus and configured links without underlines. Real signature capture and
production document generation remain documented requirements, not prototype services.


## Client configuration and copy review (CHG-082)

User decision November 15, 2026. Review has exactly two Site content slots: `page.review.title` and `page.review.subhead`, inheriting global defaults. Effective values belong in `parked/sites/<site>/pages/review.json` → `content`; ASCE inherits both.

| Review item | Owner / configurability |
| --- | --- |
| Page title and introduction | Site wording overrides; global definitions/defaults |
| Preview your application / Read and consent headings and descriptions | Global |
| Advisor alerts, remaining-step guidance/labels, edit-dialog/navigation/loading and validation copy | Existing global/shared behavior and component contracts |
| Read & Sign, Electronic Consent, fraud/authorization/consent notices and Important Notice documents | Existing shared approved legal content and Review-policy configuration, inherited or overridden by the effective Site; not free-form page-copy slots |
| Acknowledgement and policy-field labels/options/requiredness | Global definitions; CHG-101 rejects Site field overrides and retains optional dividend identity defaults |
| State/product applicability, notice placement, signer roles and preview scope | Existing global rules and effective policy assignments; copy does not change behavior |

This completes Review's copy classification. No legal wording, selection rule, consent answer, viewer or shared component changes. Global-only section strings are rejected as Site page content. Library, prototype and Storybook retain the same projection.


CHG-082 verification: **73 fresh-start checks passed**, including effective header inheritance and rejection of global-only Profile, Review, Payment and Health copy overrides. TypeScript, focused ESLint, requirements mapping, component/reuse/icon/handoff checks and prototype/Storybook production builds pass. Public, application and Storybook catalog artifacts match. No runtime page composition or Site assignment changed in this checkpoint.


## Non-copy configuration review (CHG-101)

November 16, 2026. All Review configuration decisions are resolved. Global
fields remain distinct from effective Site legal-policy assignments. ASCE inherits
its existing policy and header defaults; no ASCE values or MCR wording changed.

| Configuration | Global default / supported effective Site value |
| --- | --- |
| Page participation/order and preview pages | Fixed globally; preview scope is Membership, Eligibility, Coverage, Beneficiary, Contact and Profile. Preview uses effective participation, shared order and visible answers |
| Title/introduction | Existing two Site content slots with global defaults |
| Other page copy | Global section headings/descriptions, workflow guidance, actions, loading and validation messages |
| Acknowledgements | Global labels and required checkboxes; owner always, spouse only when actively applying. No Site field overrides |
| Conditional policy fields | Global labels, inclusion, formats and requiredness. Applicable dividend acknowledgement required; dividend first/last name and DOB remain optional. The policy controls whether a block applies, not its field definitions |
| Shared legal policy | `shared.review-policy`, a global definition/default with effective Site overrides. ASCE uses the explicit `$default` reference |
| Fraud | Default/jurisdiction text, optional override text and configured accident-Life products through the legal policy. ASCE preserves its NY Life-only exception |
| Authorization and consent | Existing supported policy conditions, product/applicant underwriting flag, jurisdiction and processing variants, and optional applicant-type prerequisite. ASCE keeps the reviewed MCR product flag independently of online health participation |
| Notice blocks | Existing placement slots, paragraphs/lists, field references, emphasis, info appearance and font size. ASCE keeps the CT warning above the owner checkbox and global SH attestation capability |
| Important Notice / Privacy viewer | Global document definitions and shared modal/print components; policy selects existing authored documents and section-specific link tokens. ASCE retains standard/NM/VA selections |
| Association scope | Enabled canonical Association keys; resolved through the shared fixed/select/URL Association contract, independently of membership attestation and retained unrelated answers |
| Product/applicant scope | Explicit product IDs and pairs must be assigned to the effective Site; active URL-filtered elections determine displayed legal blocks. Category predicates retain global canonical values |
| Stored mode predicates | Existing optional saved coverage-mode context, default `new`; this adds no new/additional coverage question and ASCE assigns no mode-scoped block |
| Editing/advisor/submitted state | Existing global confirmation, request-edit and submitted-lock rules; supported `flow=advisor` context. No new Site switch or delivery implementation |

The policy definition declares `reviewPolicyFields` as its supported field surface.
Validation rejects unknown field references even in currently inactive blocks,
uncollectable applicant-type prerequisites, unsupported options, unavailable scopes,
malformed/ambiguous filters and overlapping active field bindings. Mutually exclusive
notice variants can reuse a field without rendering it twice. Historical intermediate
migration data predating this declared contract remains separate from the Fresh-start
runtime; reviewed consumers always receive the declared global surface.

Jurisdiction selectors use one normalized residence code for fraud, authorization,
consent, blocks and documents. Canonical Association resolution replaces raw
membership/Association-answer matching. Tests preserve the exact MCR legal matrix,
including CT placement, MN ordering, VA variants, NY exceptions and adult/child-only
coverage differences. Readout/preview rules continue to come from reviewed pages,
including Profile's shared physician visibility setting.

ReviewSections remains the meaningful page composition. It reuses the canonical
ApplicationDocumentPreview, LegalReviewSection, ReviewStatement, FieldRenderer,
ApplicantSectionDivider, AppModal, LegalDocList, PrintAction and shared dialogs.
No new page component, duplicated legal viewer or extra example was introduced;
the existing 17 whole-page examples already cover the structural/policy variations.

Build verification also updates the existing component-usage inventory reader to follow imported/shared page-registry object spreads and later overrides. This preserves component attribution after the router registry extraction; it does not change routes or introduce components. Focused inventory tests verify imported bindings, shared chrome and override precedence.

CHG-101 verification: **89 Fresh-start and 103 focused checks passed**, including the exact MCR legal matrix, global field constraints, canonical Association/current URL scope, jurisdiction normalization, inactive field/prerequisite/scope rejection, duplicate-control handling, restoration, 17 real-page Storybook examples and component-inventory registry resolution. TypeScript, focused lint, requirements, component, icon, organization and handoff checks passed. Application and Storybook production builds passed; public, application and Storybook catalog bundles have identical SHA-256 hashes. Review configuration audit is complete with no open questions.


## Disclosure presentation and advisor context (CHG-102)

November 16, 2026. Global `definition.legalSections` in the Review page source owns
presentation: Read & Sign is fully expanded; Electronic Consent has a 240px screen
scroll limit. The existing LegalReviewSection supplies the rich-text region,
keyboard focus, legal links and full-print styling. Page, Library and Storybook
consume the same definition; no Site-specific layout or textarea copy is added.

The redundant “Steps completed by your advisor…” banner and its content binding
are removed. Its content key is retired so a superseded catalog cannot restore it.
The underlying workflow remains:

| Context | Messages, actions and destination |
| --- | --- |
| Advisor preparing/editing | Profile validation opens SendApplicationDialog. Cancel stays on Profile; Send opens Advisor Send Confirmation. The advisor does not normally continue into applicant Review/signing |
| Verified applicant, advisor-prepared application | Resume restores the advisor-applicant context and opens Review. The remaining advisor information explains reviewing/requesting corrections. Edit requests corrections using the saved advisor email; confirm opens Application Edit Confirmation |
| Ordinary consumer applicant | Edit opens the normal confirmation and returns to the owning page/section |
| Either applicant context continuing Review | Required acknowledgements and validation apply; continue to the applicable health, Payment and signing steps. Submitted Review retains the shared edit/back restrictions |

The supported advisor query/restored session selects the Review UI context; it
is not authorization. Existing production access and notification requirements
remain separate from the prototype’s local UI routing. No routing behavior or
access restriction is removed with the banner.

CHG-102 verification: **89 Fresh-start and 63 focused checks passed**. Tests verify expanded Read & Sign, keyboard-scrollable Electronic Consent with complete text and working document links, full-print isolation, banner retirement, consumer edit navigation, advisor-applicant request-edit routing (query and restored context), applicant continuation, advisor Profile handoff and preserved stepper locks. TypeScript, focused lint, requirements, component/icon/organization/handoff checks and both production builds passed. Public, application and Storybook catalog artifacts match.
