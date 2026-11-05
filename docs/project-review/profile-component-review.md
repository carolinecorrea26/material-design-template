# Profile component review

October 28, 2026. Profile now follows the [component documentation contract](component-documentation.md#required-review-format): application frame first, sections in page order, canonical shared pieces, whole-page acceptance scenarios and optional standalone inspection. This prepares Profile for wording/layout review; it does not record user acceptance or close Site-wide visual/accessibility review.

## Application frame

`AppShell` and `FormRoutePage` own the application surfaces, main steps/breadcrumbs, heading/Back, form state, required-field feedback, saved values, Next and transitions. Use the [application page template](http://localhost:6010/?path=/story/application-patterns-application-page-template--standard-form-page) and [navigation state review](navigation-state-review.md) for shared behavior. Profile adds an advisor-only before-Next handoff through the existing `SendApplicationDialog`; the page holds the pending continuation, Cancel clears it, and Send resumes navigation. The dialog is a shared piece, not a Profile section. This example verifies local continuation, not delivery of an email.

## Sections in page order

`ProfileSections` is one production page-section composition. It receives the visible configured sections and renders them in supplied order. `src/pages/Profile.tsx` resolves section participation, active coverage categories/amounts, questionnaire policy, applicant labels and stored notice/collection configuration before passing inputs. The view uses local answers for field follow-ups, with no active Site lookup or application provider. See the [standalone boundary contract](standalone-component-boundaries.md).

| Section | Shared pieces | Page-specific behavior and states |
| --- | --- | --- |
| Member personal information | ApplicantSectionDivider, SectionDivider, ProfilePersonalInformation → FieldRenderer, FieldGrid, ConditionalGroup | Supplied height, weight, SSN, marital status and license/residence/travel questions. Yes reveals license number/state, months/country abroad or travel country. Follow-up placement records remain saved configuration; their fields appear beneath the owning question, not as duplicate sections. Height inputs currently stack using the shared FieldGrid default. |
| Member physician information | PhysicianInformation → SectionDivider, FieldRenderer, FieldGrid, AddressFields | Supplied physician name, phone and facility/address fields. FieldGrid owns the name row; AddressFields owns the same responsive address rows used by Contact, with explicit physician field mappings. |
| Member Other coverage | SectionDivider, FieldRenderer, ConditionalGroup, DynamicList | Active Life shows existing and pending policy questions/amounts/company and replacement Yes/No. Active DI shows existing carriers, replacement question and conditional amount. The informational coverage note belongs to this section. |
| Member financial questionnaire, when policy requires it | SectionDivider, FieldRenderer, ConditionalGroup | Net worth, unearned income and self-employment. Sole proprietor and professional corporation reveal their own income/expense fields; either source reveals years, work-from-home and outside-location questions/details. Member selected-product policy resolves participation. |
| Spouse personal information | Same personal-information shared pieces | Independent `spouse-*` identities and local follow-ups; no member values or bindings are reused. |
| Spouse physician information | PhysicianInformation | Independent spouse physician/facility definitions and responsive rows. |
| Spouse Other coverage | Same Other coverage shared pieces | Spouse Life/DI flags and records are independent of member coverage. There is no spouse financial questionnaire in this composition. |

The first rendered major section for each adult carries its configured applicant label when required. Unknown configured sections retain the existing FieldRenderer fallback. Native alerts, replacement text and helper render functions remain internal parts of ProfileSections; they do not become separate component identities.

## Rules, bindings and overlays

- The page retains saved section visibility and coverage amount interpretation, including member/self aliases and both supported coverage/applicant key orders. Life and DI flags come from selected products with positive amounts.
- The financial questionnaire uses saved product aggregation policies. The authored threshold pair demonstrates combined member DI at $7,000 (included) and $6,900 (excluded). Spouse amounts and office-overhead products do not contribute to the reviewed policy. Stale financial answers alone do not activate it.
- Saved Life replacement wording, jurisdiction list, point size and bold flag remain configurable. The notice appears only under an active adult's existing-Life Yes and replacement Yes in a configured jurisdiction. The restored-follow-ups scenario exercises NY; runtime regressions cover suppression and changed saved wording.
- Disability records use the supplied `selfDisabilityCompanies` / `spouseDisabilityCompanies` collection names, labels, limits, field mappings and definitions. The template fallback is unchanged. DynamicList owns Add/Edit/Save/Cancel and confirmed removal; its dialogs are not new Profile components.
- `SendApplicationDialog` remains owned by the advisor workflow in Profile's controller. Shared validation runs before the before-Next hook. Review its [canonical dialog](http://localhost:6010/?path=/story/overlays-sendapplicationdialog--default) once, then inspect Profile's trigger and continuation.

Field IDs and saved storage bindings remain unchanged. The catalog records one canonical ProfileSections identity with generated dependencies, usages and examples, and corrects PhysicianInformation's former spouse-only description to cover both adults.

## Whole-page examples

Start at **Pages → Profile → Whole page**. These render the production page, shared frame and saved template rules with fictional local answers. Navigation ends at a local completion message using the same harness as Contact and Beneficiary.

| Scenario | Review focus |
| --- | --- |
| [Empty](http://localhost:6010/?path=/story/pages-profile-whole-page--empty) | Initial composition, wording, section order and required-field feedback |
| [Restored follow-ups](http://localhost:6010/?path=/story/pages-profile-whole-page--restored-followups) | License, residence/travel, existing/pending Life and NY replacement notice; collapse Yes answers to No |
| [Disability records](http://localhost:6010/?path=/story/pages-profile-whole-page--disability-records) | Restored carrier, Add/Edit/Cancel, confirmed removal and replacement amount |
| [Member and spouse](http://localhost:6010/?path=/story/pages-profile-whole-page--member-and-spouse) | Applicant labels, independent adult fields and carrier scopes |
| [Financial threshold](http://localhost:6010/?path=/story/pages-profile-whole-page--financial-threshold) | Inclusive aggregate member DI threshold and self-employment follow-ups |
| [Below financial threshold](http://localhost:6010/?path=/story/pages-profile-whole-page--below-financial-threshold) | Questionnaire suppression despite restored answers |
| [Advisor handoff](http://localhost:6010/?path=/story/pages-profile-whole-page--advisor-handoff) | Complete required fields, then Next; verify recipient, Cancel and Send continuation |

## Canonical pieces and optional inspection

Unchanged shared presentation and local behavior carry forward from [FieldRenderer](http://localhost:6010/?path=/story/forms-fieldrenderer--playground), [ConditionalGroup](http://localhost:6010/?path=/story/forms-conditionalgroup--hidden-and-revealed), [DynamicList](http://localhost:6010/?path=/story/forms-dynamiclist--populated), the application frame and [PhysicianInformation](http://localhost:6010/?path=/story/coverage-commerce-physicianinformation--default). PhysicianInformation preserves its existing story ID and now uses explicit static definitions without an active Site.

**Pages → Profile → Sections** contains Personal information, Personal followups, Other coverage, Existing disability records, Financial questionnaire, Self employment and Spouse information. These are local-form examples of the actual ProfileSections renderer, with explicit coverage flags/sections and no Site installation. They are optional inspection tools, not additional approval gates. Review guidance sits outside the production UI. The shared physician example remains in Profile's sidebar with its canonical component identity.

## Verification and review boundary

All 47 focused checks passed across Profile, replacement-notice/collection migration coverage, standalone rendering, actual story rendering, component graph/Library integrity and source/usage analysis. Application and Storybook TypeScript checks, targeted ESLint, application/Storybook production builds and generated catalog/handoff checks passed. The source/build audit contains all 377 non-admin exports with zero audit errors and zero invalid catalog examples. Browser verification confirmed questionnaire inclusion at $7,000 and suppression at $6,900, plus the standalone carrier example and restored Edit dialog values. Structural checks establish composition and runtime behavior; they do not certify every Site scenario or visual/accessibility acceptance. Profile wording/layout and the advisor interaction remain available for user review through the whole-page scenarios.

## Reuse follow-through

Both adult personal sections now use the shared `ProfilePersonalInformation` component. Its applicant input selects the existing member or spouse field IDs; field definitions, values and local follow-ups stay independent. The canonical [personal-information example](http://localhost:6010/?path=/story/pages-profile-personal-information--independent-applicants) demonstrates both adults in one local form. Existing section and whole-page story IDs remain stable.

`AddressFields` accepts optional explicit field-role mappings as well as its existing prefix API. `PhysicianInformation` supplies its actual member/spouse street, apartment, city, state and ZIP IDs and uses the shared address implementation. This intentionally adopts Contact's wide/narrow street row and wider city row; the physician name row remains two equal columns. The [mapped physician addresses example](http://localhost:6010/?path=/story/forms-field-groups-address-fields--mapped-physician-addresses) shows independent restored addresses. Physician phone inputs continue through FieldRenderer to the existing number-only PhoneField.

The new mapping/layout variation and personal-field composition have canonical examples for review. Page wording, policy outcomes and advisor handoff remain page-specific review concerns; shared controls retain their canonical review references.

Reuse verification: all 39 focused Profile, Contact, standalone/actual-story, component graph and Library checks passed. TypeScript (application and Storybook), targeted ESLint, both production builds and generated catalog/handoff checks passed. The refreshed source/build audit includes all 381 non-admin story exports and 95 saved components, with zero audit errors or invalid catalog examples. Browser inspection confirmed the physician layout uses shared address proportions and the mapped example restores distinct member/spouse street values.
