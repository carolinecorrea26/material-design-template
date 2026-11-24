# Shared form applicant rules

November 13, 2026 — CHG-062. Global definitions and behavior, reviewed with ASCE.
This closes the approved shared applicant-display and URL-scope gaps without
restarting the individual page reviews or adding another real Site rollout.

## One shared contract

| Area | Rule |
|---|---|
| Member/Self headings | Always hidden on Eligibility. On later pages, hidden in a member-only application; shown on existing member/owner sections when a spouse or child actively participates anywhere in the application. The condition is application-wide rather than per product or per page. |
| Section existence | A heading never creates a section. Product/category/underwriting and page participation still determine which person has questions there. Empty sections are omitted. |
| Spouse | Appears only in applicable adult sections for current selected coverage. A spouse selected only on Eligibility, a removed-product map or saved spouse answers cannot activate a later section. |
| Child | Supported Eligibility details/notice, Coverage product controls, cart, application preview and Receipt. No generic child Contact, Profile, adult health or Review-acknowledgement section. |
| Owner exceptions | Dependent-only applications still collect the member Contact address/correspondence and member Review acknowledgement. Applicable spouse DI/OO continues to use member employer information. Other member applicant sections require their own participation. |
| Initial questions | Eligibility collects intended people before product selection and shows only applicable dependent section headings, never You/Member. Initial Coverage questions use that supported intent; product controls identify available people. Post-selection sections use current elections. |
| Active elections | Selected offered product plus current person election; dependents must remain selected on Eligibility and supported by Site/URL scope. Explicit empty maps remain empty. Missing initial per-product maps preserve established supported defaults. |
| Attached benefits | An elected, reconciled dependent rider contributes dependent heading/summary context. Its owner retains the application decision; it does not create independent child/spouse adult questions or an independent base-product election. |
| Hidden drafts | Retain stable answer keys and separate person/record storage. Hidden values do not activate sections, block Next or appear in summaries. Do not store another editable participation model. |
| Shared validation/navigation | Existing effective field checks, applicable-page routing, submitted-Review navigation lock and shared feedback remain authoritative. This change does not add an autosave-specific error or service behavior. |

## Coverage Information and URL scope

Coverage Information describes the effective Site's assigned offering, including
the configured general amount range/fixed amount for each supported person.
Changing Eligibility or requested coverage does not narrow these informational rows.
Personal age, residency, income and verified-portfolio constraints still run during
coverage selection. Existing zero-exclusion and configured minimum behavior remains.

| Entry parameter | Offering/application scope |
|---|---|
| No applicant restriction | People supported by the effective Site and each product/rider assignment. |
| `applicant=member` | Member rows/controls only; hide the Eligibility dependent question. |
| `applicant=member,spouse` | Member/spouse where supported; omit Child from Eligibility and availability rows. |

The restriction cannot enable a person or product absent from Site assignments.
Excluded dependent riders and products with no remaining applicants are omitted.
The common category/product order and featured-product behavior remain in effect.
Unknown applicant values clear the URL restriction while retaining Site/product
limits. A new category/product campaign without applicant clears an older applicant
restriction, following the existing campaign-context pattern.

## Ownership and implementation

- `requirements/global/rules/applicants.json` owns the four confirmed rules;
  shared form/Home/menu requirement mappings expose them in the Library.
- `requirements/global/products.json` owns the existing URL contract and supported
  values. Global people defaults remain in `configurations/people.json`.
- Effective Site covered people and product/rider assignments retain their owners.
  URL context narrows their runtime projection without editing the Site or Library.
- `selectedProductApplicants` is the common election resolver for forms, selected
  coverage readouts and the cart. Heading context additionally includes reconciled
  attached benefits. Profile, Contact, Review, Beneficiary and health compositions
  use this context while retaining their own section participation.
- The cart preserves member headings when another product has a dependent. Preview
  coverage labels follow the same rule; Receipt already uses application-wide
  dependent context and now receives the common filtered elections.
- Applicant entry scope uses the existing Site-scoped `coverageEntryScope` storage
  contract, captured with the application and restored on resume. An ordinary
  route change retains it; a different application's restored scope replaces it.
- The compiler retires the four superseded captured display rules and associations.
  Current documentation projects the new source definitions instead of repeating
  editable prose. Historical migration evidence remains unchanged.

Storybook adds meaningful member-only and member/spouse URL-scope variations to the
existing Coverage Information page/drawer component. They use real fresh-start
products and the same scope resolver; there is no separate component implementation.

## Verification

Focused checks cover current/removed product elections, deselected people, empty
maps, dependent-only owner fields, member-plus-child headings across three pages,
attached benefits, cross-product cart headings, both URL values, general offering
independence, scope persistence/reset/isolation and existing page/story behavior.
Fresh-start checks verify global Library scope, source reconstruction without the
superseded display records and isolated effective people overrides.

Verification passed: 51 fresh-start ownership/reconstruction checks; focused
shared/ASCE participation, page, cart, preview, receipt, persistence, Coverage and
Storybook checks; application and Storybook builds; TypeScript, targeted ESLint,
requirements mapping and generated catalog/component/icon/handoff checks.
Browser inspection confirmed the member-only and member/spouse amount rows.
Source, application and Storybook catalog bundles are byte-identical.

A wider legacy-fixture probe also identified two parked ABE ProductCatalog tests
that fail before page rendering (ambiguous Review policy and unavailable Site).
The earlier Contact audit found a parked WAEPA phone-placement assertion. These
are recorded as other-client fixture findings, outside this global/ASCE rollout;
no other real Site was enabled or migrated. Shared/ASCE checks above pass.


November 14 correction (CHG-071): Eligibility keeps its member fields without a member section heading even when dependents are selected. Later pages retain all applicable applicant headings under the shared participation rules. Applicant-specific rider notes use source-owned `applicantDescriptions`; member and spouse controls do not repeat one another’s amount limits.
