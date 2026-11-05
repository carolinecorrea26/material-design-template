# Beneficiary page component review

Current component/application ownership is defined by the [standalone boundary audit](standalone-component-boundaries.md). Section examples receive explicit inputs; whole-page and workflow examples retain application rules.

Documentation follows [application frame → page sections → shared pieces](component-documentation.md). Shared definitions retain one owner and canonical reference. Current Storybook examples use [global template capabilities](global-template-review.md); earlier Site-specific verification below is historical source evidence.

## Application frame

`AppShell` provides site chrome. `FormRoutePage` owns the form surface, progress, `PageHeader` (title, Back and help slot), validation feedback, transitions and Next. Beneficiary supplies help content, participation and applicant/product records. Its local section renderer remains owned by `src/pages/Beneficiary.tsx`; it is not a second shared component definition. Shared references: [application page template](http://localhost:6006/?path=/story/application-patterns-application-page-template--standard-form-page), [PageHeader](http://localhost:6006/?path=/story/layout-pageheader--default).

## Page sections and shared pieces

Next after Coverage in the application order. Review **Pages → Beneficiary → Whole page** using the real page with saved Site configuration and fictional answers held in local React state.

| Section | Pieces | Shared reference / owner | Review behavior |
| --- | --- | --- | --- |
| Optional beneficiary information | Yes/No question and conditional divider | `FieldRenderer`; saved page requirement and beneficiary-controls surface | Appears on optional Sites such as ABE. Yes reveals applicable coverage cards; No allows continuation without beneficiary records. |
| Beneficiaries by applicant and coverage | Member/spouse labels, category groups, product title and designation note, Primary/Contingent lists, beneficiary rows and Add action | `ApplicantSectionDivider`, `CategoryCard`, `ProductCard`, `DynamicListItem`; page owns grouping and records | Only selected, positive-amount products/applicants allowed by the saved participation policy appear. Each product/applicant has independent records. No applicable products shows the existing notice. |

The shared `PageHeader`, help chips/drawers, form frame, progress navigation and Next action keep their existing references. The help chips open the actual beneficiary and percentage-share explanations. Member and spouse use the same section renderer; their records and product keys differ.

Approved during review: designation notes use an info alert. Product containers and names use the shared `ProductCard` header, also used by Coverage, quote estimates, Payment and Receipt. The shared header owns title typography (weight 800), the QD indicator for QuickDecision products, optional description/brochure link and badge slots; page-specific forms remain in the card body. Linked and plain names use the same typography. [Shared title example](http://127.0.0.1:6008/?path=/story/layout-productcard--shared-title).

## Interactions within the beneficiary section

| Piece | Existing implementation and behavior |
| --- | --- |
| Add/edit beneficiary | `AppModal`, Primary/Contingent tabs, Individual/Trust selector, configured fields through `ControlledFieldRenderer`, and `FieldGrid`. Individual records collect name, relationship and share; trusts collect trust name/date. |
| Allocation and limits | Remaining slots and percentage, percentage shortcut buttons, type restrictions and configured maximum. Primary and contingent allocations are tracked separately. |
| Apply to other coverages | Existing second `AppModal` after adding a new record when the same applicant has other products. Incompatible targets are disabled, compatible targets receive independent copies with new IDs. Editing does not trigger copying. |
| Edit/remove | Existing `DynamicListItem` actions; Edit restores the selected record. Remove updates only its product and returns focus to the Add action. |
| Continue | Actual `FormRoutePage` validation checks applicable products and beneficiary records before local navigation. |

These are pieces of the beneficiary flow, not additional top-level page sections. The existing shared DynamicList example does not replace the actual page's product allocation and copy behavior.

## Review examples

- [Empty](http://127.0.0.1:6008/?path=/story/pages-beneficiary-whole-page--empty): ASCE two-product entry, real editor and copy flow.
- [Individuals and trust](http://127.0.0.1:6008/?path=/story/pages-beneficiary-whole-page--individuals-and-trust): saved primary individuals and contingent trust, edit/remove and full-designation states.
- [Member and spouse](http://127.0.0.1:6008/?path=/story/pages-beneficiary-whole-page--member-and-spouse): AMA independent applicant cards.
- [Optional participation](http://127.0.0.1:6008/?path=/story/pages-beneficiary-whole-page--optional-participation): ABE's saved optional requirement.
- [No applicable coverage](http://127.0.0.1:6008/?path=/story/pages-beneficiary-whole-page--no-applicable-coverage): actual empty-products notice.

The stories compose `src/pages/Beneficiary.tsx` directly. They install and restore the saved Site library without changing its rules, use the global Storybook router/theme/session providers, and stop navigation at a local completion message. They do not persist application answers or send real applications.

## Verification and review boundary

TypeScript, targeted ESLint and the Storybook production build passed. Four existing suites passed all 14 tests covering record restoration/edit/removal, designation limits, trust editing, copying and incompatible targets, optional participation, stored field bindings, participation policy and product-specific notes.

Browser checks confirmed the empty two-product page, actual Add dialog and required-field errors, separate AMA member/spouse cards, and ABE's optional question revealing its product card after Yes.

Layout, wording, Site-wide scenarios and visual/accessibility acceptance remain open for review. No applicant implementation or business rule was changed in preparing these examples.

Related: [Coverage](coverage-component-review.md), [cross-page reuse](page-reuse-review.md).
