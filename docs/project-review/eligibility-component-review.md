# Eligibility page review

The [Eligibility checkpoint](../requirements-spec/page-review.md#eligibility-step-getting-started-required) records the global/ASCE audit (CHG-044). Ownership follows the [fresh-start model](../requirements-spec/README.md).

| Area | Canonical owner and implementation |
|---|---|
| Frame | Shared `FormRoutePage`: header, progress, error alert, Next validation, save and transitions. |
| Your information | Authored composition renders the shared ZIP/State/Birthday group and dependent choices. ZIP-derived State feedback and manual-State preservation are shared with Home and quote tools. The shared group uses one standard gap and renders real helper/error feedback without blank reserved paragraphs (CHG-088). The member/You heading is always hidden on Eligibility; only applicable dependent section headings appear (CHG-071). |
| Spouse | Offered and selected spouse participation controls the note, attestation, name grid and DOB. The source owns field placement; normal submission validation applies. |
| Children | Offered and selected child participation controls the note and repeatable list. Generic section compilation owns bindings, field inclusion and maximum; Add/Edit and restored-row submission checks use the effective definitions. Notice-only mode displays the configured section note without collecting or validating child rows. |
| Verification | Page-owned compiled surfaces supply the address, method and fictional security questions. Effective Site lookup fields and address settings control the existing flow. Failure/skip retains manual review and disables portfolio access; none mode cannot accept stale verification. |
| ASCE assignments | All three people are offered. Student status is enabled and required for child rows; the maximum remains 10. Existing name/DOB/Member-ID/State matching and address-before-verification values remain Site-owned. |
| Examples | Whole-page member/spouse/child, notice-only and applicant-only examples; three section families. Synthetic residency and student variations use the compiler. Dialog examples use the same detached projection. |
| Storage | Page and shared mappings own order, composition and placement. Shared fields/content/configuration defaults remain global. Site files own assignments and fictional matching records. Generated catalog data is not an authoring source. |
| Execution boundary | These requirements describe actual system behavior. Prototype lookup, security questions and text/voice outcomes are simulated; no live service or code delivery is performed. No external service implementation is outstanding prototype work. |

The source reconstruction and inheritance checks, focused page/field/collection/verification tests, Home and Membership regressions, Library parity checks, requirements validation, TypeScript and production/Storybook builds verify the audit. Existing draft statuses, product eligibility policy values and confirmed exceptions retain their status. Other real-Site rollouts remain outside this review.


## Client configuration and copy review (CHG-078)

User decisions November 15, 2026. The global Eligibility definition declares five copy slots, all inheriting `global/content/eligibility.json` defaults. ASCE inherits them and adds no copy override. Effective Site values use `parked/sites/<site>/pages/eligibility.json` → `content` → the exact source key.

| Eligibility item | Client configurable | Source / boundary |
| --- | --- | --- |
| Page title and introduction | Yes | `eligibility.title`, `eligibility.subhead` |
| Member eligibility note | Yes | `eligibility.note.self`; global default empty. Renders in the existing member section only when populated, without adding a member/You heading |
| Spouse-definition note | Yes | `eligibility.note.spouse`; existing global default retained; displayed only for an offered, selected spouse |
| Child-eligibility note | Yes | `eligibility.note.children`; existing global default retained; displayed only for an offered, selected child. Notice-only mode requires nonblank text and retains no child collection controls |
| Field labels/options, requiredness and configured field inclusion | Through the shared field contract | Existing global field definitions and Site page/field assignments; no Eligibility-specific duplicate field copy |
| Applicant section labels | Through existing shared applicant presentation | The member heading remains suppressed on Eligibility; spouse/child headings retain their participation rules |
| Breadcrumbs, loading/navigation labels, field/page validation and ZIP-derived-state feedback | Global | No new Site text slots |
| Member-verification/address dialog wording, controls and result messages | Global | Existing shared source and field surfaces; copy overrides do not change verification or TPA outcomes |
| Eligibility, residency, covered people, child details/notice-only mode and maximum, TPA lookup/address settings | Existing shared configurations/policies | Their effective values continue to determine behavior independently of copy |

The existing SectionNote placement, shared Alerts, EligibilitySections and configured section adapter render the notes. No new component or separate member-note implementation is added. The compiler resolves Site content when projecting section notes, the source adapter uses the same override values, and the default page adapter imports global Eligibility content instead of repeating strings. Library Configurations uses the declared slot key even when a section note has no separate content-binding alias, so effective note values and their conditional requirement are inspectable.

Overrides must keep the declared string shape. Omission inherits the global default; a blank member note is hidden. Nonblank child wording in notice-only mode is an existing requirement now enforced before rendering through the shared conditional-content contract. Unsupported copy keys, non-string values and blank required child notices are rejected. Existing section-note selections remain supported and resolve their selected key against effective Site content. Copy never changes eligibility, validation, dependent selection, collection, verification, saving or navigation.

CHG-078 verification: 69 fresh-start checks and 39 focused page/field/validation/parity/actual-story checks pass. TypeScript, focused lint, requirements/component checks and both production builds pass. Configured notes render in their existing shared sections, dependent notes retain selection conditions, the member heading stays absent, and notice-only children keep one required notice without collection controls.


CHG-088 follow-through, November 15, 2026: shared EligibilityFields no longer requests blank reserved feedback rows. One normal gap separates ZIP/state/DOB controls; real date-format guidance, inferred-state feedback and validation still render. Both controlled quote and application form adapters use this same group and canonical answer keys. No page-specific spacer or field definition is added.


## Non-copy configuration review

November 15, 2026. Global definitions/defaults are in `global/configurations/{people,address}.json`, canonical field details and the shared Eligibility mapping. Effective Site values are in `parked/sites/<site>/pages/eligibility.json`, `fields.json` and `eligibility.json`. Product eligibility stays with the global product definition plus Site product assignments; no duplicate page thresholds are added.

| Setting | Global default / supported values | Effective ASCE / boundary |
| --- | --- | --- |
| Page list, inclusion and order | Fixed global page list; Eligibility required at position 2 | Inherits; no Site skip/reorder option (CHG-091) |
| People offered | Self, spouse, child; self must remain present; unique supported values | All three; offered/selected dependents govern sections and validation |
| Member collection | ZIP, state and DOB always included and required globally | Inherits. Supported field settings, including eligible-state filtering and field labels, remain available; Site inclusion/requiredness overrides cannot remove these global member requirements |
| Dependent collection | Spouse attestation/name/DOB and child name/DOB/gender are defaults; supported inclusion/requiredness overrides remain Site configurable | Defaults retained. Person-scoped selections can change spouse/child fields independently without changing member collection |
| Postal/date validation properties | Global format, input mode and length properties | Inherits. Mapped postal and birth-date constraints reject conflicting values; valid present answers still undergo shared format checks |
| Field labels/options | Existing shared field override contract; option subsets must be authored, nonempty and compatible with any default | ASCE spouse-membership label/yes-no configuration; other labels/options inherit |
| Spouse membership, child gender | Included and required by default; Site inclusion/requiredness remain configurable | Inherits; spouse attestation uses the shared membership field and does not gain the Membership inline-stop exception |
| Additional child questions | Student status and active duty in the Armed Forces are globally defined, default-off questions; required when enabled unless configured otherwise | ASCE enables student status only. Armed Forces is supported for synthetic/other future Site assignments and is not enabled for ASCE. No eligibility denial is inferred from enabling a field |
| Residency filtering | `eligible-states-only = false`, `eligible-states = []`; enabled filtering requires a nonempty valid list | False / empty. List values must be unique supported state/province codes. Product residency restrictions still apply independently |
| Child collection | `details` or `notice-only`, default details | Details. Selected children require at least one validated row; notice-only uses the required configured note and does not collect/validate rows |
| Child maximum | 10; supported whole numbers 1–100 | 10; effective maximum governs Add/Edit and restored-record submission checks |
| TPA integration mode | none (default), member-lookup, membership-auto-approval | member-lookup projects to runtime coverage-verification. None does no lookup/verification/portfolio approval. Auto-approval mode remains separate from verified portfolio access |
| TPA lookup inputs | First name, last name, DOB; nonempty unique owner-field IDs available by Eligibility submission | ASCE adds Member ID and state. Active lookup cannot depend on hidden, future, dependent or verification-address fields; none mode permits dormant settings |
| Address before verification | False | True; existing shared residential-address fields/validation are used after lookup and before identity verification |
| Verification methods | Shared required selector; Text, Voice, Security questions, Skip; no preselected method | Inherits. Existing authored-option subset configuration is supported. Copy, steps and outcomes remain global; questions/phone/code screens here are fictional prototype fixtures |
| Prototype lookup records | No global member records; Site supplies fictional facts and active-coverage flag | Existing ASCE record retained. Configured facts must exist and normalize to a unique match; extra record facts never expand the configured lookup list |
| Verification results / portfolio access | Existing global policy; actual result facts are application data | Existing+active coverage and identity pass are required for portfolio access. Failed/skipped verification retains manual review; input changes require renewed verification |
| Eligibility thresholds / disqualifying answers | Existing shared Site/product policy contracts | ASCE assignments unchanged; note wording and field display do not redefine age, residency, membership or underwriting policy |
| Content / headings | Five approved copy slots; global member-heading suppression and conditional dependent headings | Previous copy/header decisions retained; no new copy setting or question |
| URL scope | Existing shared applicant/context contracts | Effective restrictions are reused; no Eligibility-only URL switch |

Component reuse: `EligibilitySections` retains the distinct composition of the three applicant areas and repeating children. It reuses `EligibilityFields`, `FieldGroup`, `FieldGrid`, `FieldRenderer`, `SectionNote` and `DynamicList`. Verification reuses `AppModal`, `AddressFields` and `FieldRenderer`; its distinct method/security-question/result workflow is the reason to retain its coordinator. No page-specific help or duplicate field group is introduced. Existing section, page and dialog examples exercise the compiled source; synthetic Membership examples that omit Member ID also omit that input from their active lookup configuration.

Implementation: the shared mapping declares fixed postal/date properties and global member inclusion/requiredness constraints. The DOB constraint targets self only, so dependent DOB selection remains configurable. Active TPA input availability and fixture integrity are checked during compilation. Prototype matching reads only the effective lookup list. Existing configuration/rule status values and production-versus-prototype boundaries are retained; no actual service, code delivery or new error routing is implemented. All user configuration questions in this review are answered.

Page-context correction: the shared field resolver applies the explicit page context before person/default values for component mappings as well as page mappings. The later CHG-093 clarification fixes member DOB requiredness globally; dependent-specific DOB overrides remain possible and do not change the member or Home/quote defaults. Membership’s separately declared core constraints also remain intact. No parallel page field or fallback value is added.

CHG-092 verification: 82 fresh-start checks and 64 focused field, TPA, Membership/Eligibility Storybook, Eligibility page/section and verification checks pass. The source cases remove superseded records, verify page-scoped requiredness, reject unavailable/incomplete/ambiguous active lookup configurations and retain hidden-field settings with TPA disabled. Existing ASCE values are unchanged. TypeScript, focused lint, requirements/component/icon/organization checks and prototype/Storybook builds pass; Library, prototype and Storybook catalog hashes match. The stale Eligibility section test now checks only real ZIP/state/DOB feedback instead of requiring blank helper rows. Component reuse and all current configuration questions are accounted for.

Separate legacy-suite finding: `src/domain/tpaIntegration.test.ts` has two unrelated WAEPA/WAEPA-GI branding assertions expecting the old theme. The lookup/approval assertions pass; no WAEPA implementation or branding value was changed for this ASCE/global review. Those failures are outside the 64 passing focused checks above and are not an open Eligibility policy decision.


CHG-093 supersedes the prior member-field permission interpretation in CHG-092. `fieldParticipation` in a Site page file scopes canonical include/hide selections to self/spouse/child; mapping constraints still prevent any self ZIP/state/DOB removal. For example, a synthetic Site may use:

```json
{
  "fieldParticipation": {
    "spouse": { "hide": ["membership", "birth-date"] },
    "child": { "hide": ["gender"], "include": ["active-military"] }
  }
}
```

The existing unscoped include/hide lists remain supported for mapped fields that may change. Scoped lists use canonical IDs, not duplicated spouse/child definitions. The compiler derives primary-page mapping metadata so these selections do not affect verification dialog surfaces. Invalid people, unmapped fields and unsupported include/hide choices reject. `included`/`required` mapping constraints accept true for every mapped person or a list of mapped people (DOB uses self). Field options, eligible-state settings and shared format checks retain their existing owners.

Student and Armed Forces answers use `child-full-time-student` and `child-active-military` inside each stored child row. The generic child dialog, restored-row validator, applicant-fact adapter and shared Library field inventory consume those same definitions. The existing child Storybook family has one additional-fields variation; there is no new page component or separate Name example. ASCE’s authored page assignment stays exactly `include: ["full-time-student"]` with no hidden dependent defaults.

CHG-093 verification: 83 fresh-start checks, 45 focused field/page/TPA/Storybook checks and two requirements-checker cases pass. They cover locked member collection, independent dependent hiding/requiredness, scoped-selection validation, optional additional fields, child-row storage/fact conversion, ASCE defaults plus student only, unchanged verification surfaces and reconstruction without superseded records. Requirements, TypeScript, focused lint, component/icon/organization checks and prototype/Storybook builds pass. All three catalog hashes match. No current decision remains open.
