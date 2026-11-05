# Membership implementation map

Page key: `membership`. Entry point: [Membership.tsx](../../src/pages/Membership.tsx). Reviewed sections and state examples: [Membership component review](../project-review/membership-component-review.md).

## Page composition

| Review section | Implementation |
| --- | --- |
| Introduction and help | Shared page header and [MembershipHelp](../../src/components/membership/MembershipHelp.tsx), including its actual help/calculator drawers |
| Membership status | [MembershipStatus](../../src/components/membership/MembershipStatus.tsx): question, association selection and ineligibility feedback |
| Member information | [MemberInformation](../../src/components/membership/MemberInformation.tsx): configured name/contact fields |
| Additional membership information | [AdditionalMembershipInformation](../../src/components/membership/AdditionalMembershipInformation.tsx): professional/member identifiers and conditional information |

These are review/composition sections. They do not imply a one-to-one replacement of stored `pageSections` rows. The page uses [FormRoutePage](../../src/app/RoutePage.tsx) for shared form lifecycle and navigation.

## Catalog path

Use the `membership` entry in [page-maps.json](page-maps.json) for exact saved keys and files: page definition and Site participation → configured sections → field placements/definitions → scoped field overrides and validations. Recorded component usages and examples link to the shared component definitions. Flow references identify transitions touching this page; they do not bypass routing rules.

Association context comes from `overview/sites.json` and `overview/associations.json`. Follow explicit Site relationships and [association resolution](../../src/data/resolvers.ts). Configurations can also govern applicant experience and membership requirements; use the [effective configuration resolver](../../src/domain/effectiveConfiguration.ts) and [Library ownership classifier](../../src/domain/libraryOwnership.ts), rather than assuming every Membership policy is a row in `rules.json`.

Review the `rule-membership-*` rules, `rule-persistence-membership-starts-autosave-mock-communication`, and their scoped assignments in `rules/rules.json`. These named rule families are entry points, not an exhaustive dependency list. Use [follow-up visibility](../../src/config/clientFields/membershipFollowUpVisibility.ts), [applicant experience](../../src/domain/applicantExperience.ts), and [WAEPA field reset](../../src/components/membership/membershipFieldReset.ts) for the actual conditional behavior.

## Implementation and acceptance

- Preserve the selected association and dependent follow-up visibility. Unresolved URL-driven association context prevents continuation as defined by the page.
- Preserve configured member/non-member gating and WAEPA answer clearing when membership changes.
- AMA continues through the normal form flow. The removed AMA record-lookup dialog and extra DOB step must not be reintroduced from historical lookup documentation.
- Verify standard member/non-member, association selector, AMA physician/spouse and WAEPA new/current/associate variants using the linked review examples. Required fields and help drawers use the actual shared components.

Relevant regression references: [basic collection](../../src/pages/Membership.basicCollection.test.tsx), [lookup-removal behavior](../../src/pages/Membership.lookup.test.tsx), and [page tests](../../src/pages/Membership.test.tsx). Section examples do not certify every Site variant or full navigation/accessibility acceptance; use the complete page and applicable Site configuration for final acceptance.
