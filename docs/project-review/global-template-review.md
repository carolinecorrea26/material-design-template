# Global template capability review

Storybook documents the global application template. A feature used by one deployed Site is still a reusable template capability; a deployed Site is an assignment of those capabilities, policies and content.

## Scope and accounting

Compared all ten saved configurations across Home, Membership, Eligibility, Coverage, Beneficiary and Contact, including included page fields and repeatable collection fields. The union of the global capability fixtures matches that complete source union. The machine-readable [capability register](global-template-capabilities.json) keeps source provenance for verification; source identity is not a Storybook control or review grouping.

| Template area | Accounted-for capabilities |
| --- | --- |
| Home | Quote/image hero, association introduction, application explanation, coverage options, insurer credentials, configurable application entry notice |
| Membership | Standard Yes/No; association selection; professional/member-role choices; title; required and optional member reference; professional education/occupation; nurse type; occupation class; new/current member status; declaration; active employee agency/start date; former employee; spouse/adult-child/parent/sibling associate references; military restriction; referral |
| Eligibility | ZIP/State/Birthday and manual State behavior; configured residency options; covered applicants; spouse membership/details; child records, student/marital-status and service eligibility; notice-only children |
| Coverage | Category-specific questions; life/disability/overhead/supplemental-health products; work/income facts; mutually exclusive plans; member/spouse eligibility; riders and rider-only elections; required-information/unresolved states; loading/recalculation/unavailable estimates; entry scope; dependent-only confirmation; generic image/PDF/HTML/link/XML reference formats |
| Beneficiary | Required/optional participation; independent applicant/product allocation; individual/trust; primary/contingent; add/edit/remove/copy; empty and populated states |
| Contact | Residential/business correspondence; employer details; same-as-home; spouse contact; product-scoped business collection; suppressed business/correspondence |
| Shared frame | Main steps and breadcrumbs, their current/completed/upcoming, hidden, locked, pending and mobile states |

Retained retirement agency/date definitions are accounted for in the global field inventory, but are not activated by the approved six qualification choices. Former employee intentionally has no qualification follow-ups. This review does not add an annuitant choice or re-enable an inactive legacy branch.

## Implementation

`src/dev/storybook/globalTemplate.ts` discovers saved capability definitions by their fields/policies, then creates detached fixtures under one synthetic `storybook-template` identity. Branding, association copy, support and reference assets are generic. Field/product identifiers, stored conditions, requirements and values remain stable. These are capability demonstrations, not copies of named customer sites or edits to their saved assignments.

The global decorator prevents stories from inheriting a browser-selected Site. Page and section harnesses accept a capability, not a Site ID. Existing specialized Membership/Eligibility additions have explicit generic examples, and actual Membership follow-up orchestration uses configured choices instead of a client-name branch. Associated-member notices use the configured association name.

Generic reference assets live under `public/storybook/`. Contact’s conditional examples use capability names. Existing customer-specific tests remain integration evidence for their deployments; they are not the Storybook organization.

## Repeatable checks and boundary

Run `npm run storybook:template:check`. It compares the complete earlier-page field/collection union, verifies the register has not drifted, confirms each capability has source Storybook references, and rejects Site selectors in applicant stories. Use `GLOBAL_TEMPLATE_REVIEW_WRITE=1 npx vitest run src/dev/storybook/capabilityInventory.test.ts` to refresh the evidence after an intentional capability change.

Source/component and build audits verify references. They do not certify every conditional field has been visually accepted, every business policy is resolved, or every Site has completed accessibility acceptance. Remaining inactive/legacy definitions are explicitly accounted for rather than silently enabled.

Verification: the capability gate accounts for ten saved configurations, ten capability groups and 34 linked examples across the six earlier pages. All 353 Storybook exports are present in the clean build, with zero source-audit errors or invalid saved component references. Focused template, coverage, Membership, dependent, Contact, Beneficiary and navigation regressions passed. The existing Membership evidence fingerprints were refreshed after bounded behavior verification; a missing jsdom scroll stub was fixed in the validation test harness.
