# Eligibility implementation map

Page key: `eligibility`. Entry point: [Eligibility.tsx](../../src/pages/Eligibility.tsx). Reviewed sections and state examples: [Eligibility component review](../project-review/eligibility-component-review.md).

## Page composition

| Review section | Implementation |
| --- | --- |
| Introduction | Shared page header |
| Your information | [EligibilityFields](../../src/components/forms/EligibilityFields.tsx): ZIP/State/Birthday group, shared by the page and quote surfaces |
| Covered applicants | Dependent choices rendered through [EligibilitySections](../../src/components/eligibility/EligibilitySections.tsx) |
| Spouse information | Configured spouse fields and applicant divider in EligibilitySections |
| Children information | [DynamicList](../../src/components/forms/DynamicList.tsx), configured child mapping, edit/add dialogs and removal confirmation |

The same EligibilitySections renderer serves live and section examples. [FormRoutePage](../../src/app/RoutePage.tsx) and the page retain page-level validation, values and continuation. The isolated story's Check required fields action is a review harness control.

## Catalog path

Use the `eligibility` entry in [page-maps.json](page-maps.json) for exact direct page, Site, section, field, override, validation, component and flow keys. Additional repeated child fields are resolved through [field collections](../../src/domain/fieldCollections.ts), including stored `fieldCollections` configuration; they are not all ordinary direct page placements.

Use `configurations/configurations.json` for applicable `fields`, `fieldCollections`, `applicantExperience` and `tpaIntegration` definitions and values. Resolve their scope/ownership through [effective configuration](../../src/domain/effectiveConfiguration.ts). Review `rule-eligibility-*`, `rule-tpa-*`, and their assignments in `rules/rules.json`; the page and [applicant-experience policies](../../src/domain/applicantExperience.ts) own additional validation. Product eligibility constraints are resolved for the relevant product/applicant; a field list is not itself an eligibility decision.

## Implementation and acceptance

- ZIP changes can derive State. A manual State selection persists through unrelated edits and changes only when ZIP changes again. Derived-State feedback uses reserved helper space and yields to validation errors.
- Dependent selection controls spouse/child sections. Required spouse details, child records and notice-only child Sites retain their configured behavior.
- Preserve configured eligibility disqualifications, resume-loaded feedback, and TPA verification/continuation handling. [TPA integration](../../src/domain/tpaIntegration.ts) currently supplies prototype behavior; production services need an implementation contract.
- Verify empty/invalid fields, derived and manual State, dependent section visibility, child add/edit/remove, and prefilled dependent cases from the review.

Relevant regression references: [shared EligibilityFields](../../src/components/forms/EligibilityFields.test.tsx), [AMA dependent collection](../../src/migration/amaDependentCollectionAdoption.test.tsx), [CSEA dependent collection](../../src/migration/cseaDependentCollectionDecision.test.tsx), and [WAEPA spouse membership](../../src/migration/waepaSpouseMembershipAdoption.test.tsx). Full Site visual/accessibility acceptance remains separate from section documentation.
