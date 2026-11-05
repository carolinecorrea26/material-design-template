# Eligibility page section review

Current component/application ownership is defined by the [standalone boundary audit](standalone-component-boundaries.md). Section examples receive explicit inputs; whole-page and workflow examples retain application rules.

Documentation follows [application frame → page sections → shared pieces](component-documentation.md). Shared definitions retain one owner and canonical reference. Current Storybook examples use [global template capabilities](global-template-review.md); earlier Site-specific verification below is historical source evidence.

## Application frame

`AppShell` provides site chrome. `FormRoutePage` owns the form surface, progress, `PageHeader` (title, Back and description), validation feedback, transitions and Next. The former Introduction example repeated this frame and has been removed; review the heading through its shared reference. Shared references: [application page template](http://localhost:6006/?path=/story/application-patterns-application-page-template--standard-form-page), [PageHeader](http://localhost:6006/?path=/story/layout-pageheader--default).

## Page sections and shared pieces

Shared pieces and documentation proposals: [cross-page reuse review](page-reuse-review.md).

Review the page's sections under **Pages → Eligibility**, in page order and without numbering. Pieces remain inside their existing sections. Shared app header/footer, layout and navigation are reviewed through their existing component stories.

| Main section | Pieces | Storybook |
| --- | --- | --- |
| Your information | ZIP/postal code, State/Province, ZIP-derived state feedback, manual State selection, date of birth and field errors | [Default](http://localhost:6006/?path=/story/pages-eligibility-your-information--default), [ZIP-derived state](http://localhost:6006/?path=/story/pages-eligibility-your-information--zip-derived-state) |
| Covered applicants | Dependent-coverage choices; selection controls whether spouse and child sections appear | [Choices](http://localhost:6006/?path=/story/pages-eligibility-covered-applicants--default), [with dependent details](http://localhost:6006/?path=/story/pages-eligibility-covered-applicants--with-dependent-details) |
| Spouse information | Applicant divider, configured membership question, first/last name and date of birth | [Empty](http://localhost:6006/?path=/story/pages-eligibility-spouse-information--default), [completed](http://localhost:6006/?path=/story/pages-eligibility-spouse-information--completed) |
| Children information | Applicant divider, child eligibility note, child records, add/edit dialog and removal confirmation | [Empty](http://localhost:6006/?path=/story/pages-eligibility-children-information--empty), [with child](http://localhost:6006/?path=/story/pages-eligibility-children-information--with-child) |

## Reuse

The existing local Eligibility field/section renderer was moved into `src/components/eligibility/EligibilitySections.tsx`. Both the live page and its section stories use it. Each story selects from the page's real configured sections; no separate renderer was added for each section.

The frame owns `PageHeader`. Shared pieces within the sections are `EligibilityFields`, `FieldRenderer`, `FieldGrid`, `ApplicantSectionDivider`, and `DynamicList`, including its existing shared modal controls. Application Eligibility, the Home quote card and QuoteCalculator now render the same `forms/EligibilityFields` component. It owns the ZIP → State → Birthday group, ZIP-derived State message, manual-State behavior and reserved helper/error space. Application and quote adapters retain their existing value and validation ownership.

Stories use actual field definitions, section visibility, collection defaults and form validation. The Check required fields action belongs to the isolated review harness. Page-level validation and continuation remain owned by Eligibility and the shared application page template.

The examples use the active site's configuration. Without an installed saved prototype library, Storybook uses the registry fallback. Notice-only child sites and client-specific dependent wording remain configuration-driven; this review does not certify every site's requirements.

## Verification

- TypeScript and targeted ESLint checks passed.
- Storybook production build and source/build audit passed; nine Eligibility examples were indexed at the original review; eight section examples remain after removing the duplicate frame heading.
- Eleven existing tests passed across AMA dependent collection, CSEA child-notice collection, WAEPA spouse rules and ABE eligibility/child collection.
- Browser checks verified field errors, ZIP-derived State and its feedback, dependent sections appearing/hiding, child dialog validation, add/edit/remove behavior and prefilled spouse/child examples.
- Manual-State correction: two focused tests and eleven existing residency tests passed. Browser verification confirmed a California selection persists with a New York ZIP and after a DOB edit; changing ZIP to 19019 derives Pennsylvania.

State now follows the quote behavior: it derives when ZIP changes, and manual selections persist until the next ZIP change. The derived-State confirmation hides after a manual selection. The existing page-level validation, resume feedback and continuation behavior were preserved. No new lookup or verification flow was added. Visual and accessibility acceptance remain part of review.

The inferred-State message occupies the State field’s reserved helper area, with validation errors taking priority. The helper area remains present before messages, during validation and after the message expires. The separate expanding confirmation below State has been removed.

Spacing correction: the shared group uses one compact helper line and removes duplicate control margins; the earlier two-line reservation and extra inter-field spacing were reverted.

Browser verification of the compact correction measured identical input positions before validation, with the three required-field errors, and with the inferred-State message. The quote group also retained identical positions when its inferred-State message appeared. Manual-State preservation, ZIP re-derivation, residency, ABE eligibility and AMA/WAEPA dependent checks passed; application and Storybook production builds passed.
