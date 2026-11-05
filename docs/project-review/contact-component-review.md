# Contact page component review

Prepared October 27, 2026, following [application frame → page sections → shared pieces](component-documentation.md). Review **Pages → Contact → Whole page**. These examples render `src/pages/Contact.tsx` directly with global template capabilities and fictional local answers.

## Application frame

`AppShell` owns site chrome. `FormRoutePage` supplies the form surface, progress/breadcrumbs, `PageHeader`, Back, validation, restoration, transitions and Next. The heading and navigation keep their [application template](http://localhost:6010/?path=/story/application-patterns-application-page-template--standard-form-page) and [PageHeader](http://localhost:6010/?path=/story/layout-pageheader--default) references.

## Page sections and shared pieces

`ContactSections` composes three standalone production sections: `ResidentialAddress`, `BusinessInformation` and `SpouseContact`. The residential and business views share `AddressFields`, which owns the approved responsive address rows. `ConfiguredContactSections` in `src/app/sections` resolves applicant visibility and labels before the views render. Contact's page controller resolves the business/product/correspondence policy.

| Section in page order | Shared pieces | Explicit inputs and local interactions |
| --- | --- | --- |
| Residential address | AddressFields, FieldRenderer | Supplied address/correspondence fields and local required-field feedback. No selected product or applicant answer is needed in the standalone example. |
| Business / Employer information | SectionDivider, AddressFields, FieldRenderer → PhoneField | Supplied fields, employer-detail flag and same-as-home state. Copies home values while checked; unchecking exposes copied fields for separate editing. |
| Spouse contact information | FieldRenderer → PhoneField | Supplied independent phone/email bindings. Applicant participation and labels are decided by the composition adapter. |

Address and name groups remain approved row exceptions. The [standalone boundary audit](standalone-component-boundaries.md) covers Contact and the previously reviewed pages. Local validation and copying remain in the components; Site participation remains in the application.

## Shared component references

Review shared presentation and local interactions in their canonical examples:

- [AddressFields](http://localhost:6010/?path=/story/forms-field-groups-address-fields--default): the responsive address rows used by residential and business addresses, with independent field definitions and values.
- [PhoneField](http://localhost:6010/?path=/story/forms-phonefield--independent-contacts): one number/type UI with independent self, spouse and business bindings.

Contact acceptance covers wording, order, correspondence, copying and applicant/product participation. It does not require another approval of shared address/phone presentation. Existing shared-layout acceptance carries forward; a changed shared contract or new variation is reviewed where needed.

## Optional section examples

Whole page appears first in the Contact sidebar and is the page review entry point. These isolated examples remain available for development and focused inspection, using the actual renderer and saved field definitions:

- [Residential address](http://localhost:6010/?path=/story/pages-contact-residential-address--default)
- [Business and employer information](http://localhost:6010/?path=/story/pages-contact-business-and-employer-information--default)
- [Spouse contact information](http://localhost:6010/?path=/story/pages-contact-spouse-contact-information--default)

Each example renders its standalone production section with explicit fields and local form state. It does not install a Site or require coverage/applicant answers. They are not separate approval gates. Storybook guidance links to the shared controls and relevant whole-page scenario; all existing story IDs remain stable.

## Whole-page examples

| Example | Review focus |
| --- | --- |
| [Empty](http://localhost:6010/?path=/story/pages-contact-whole-page--empty) | Residential fields, required errors on Next and business correspondence reveal |
| [Restored address](http://localhost:6010/?path=/story/pages-contact-whole-page--restored-address) | Saved values and editing |
| [Business same as home](http://localhost:6010/?path=/story/pages-contact-whole-page--business-same-as-home) | DI business details, copied address and separate edits |
| [Member and spouse](http://localhost:6010/?path=/story/pages-contact-whole-page--member-and-spouse) | Separate applicant labels and contact fields |
| [Product-scoped business information](http://localhost:6010/?path=/story/pages-contact-whole-page--product-scoped-business-information) | Product-scoped business section with hidden correspondence |
| [Business information hidden](http://localhost:6010/?path=/story/pages-contact-whole-page--business-information-hidden) | Business/correspondence suppression despite stale correspondence values |

The shared `.storybook/applicationPageExample.tsx` harness installs/restores the selected saved Site library and stops navigation at a local completion message. Beneficiary uses the same harness through its existing import. Whole page is an example grouping, not another content section or component record.

## Verification

The six existing Contact tests passed after extracting ContactSections, along with TypeScript, targeted ESLint, the clean Storybook build and source/build audit. The build includes all 334 audited story exports with zero invalid catalog examples. Browser verification confirmed the isolated business section preserves copied address values and the whole-page business example renders the shared application frame, unchecking same-as-home reveals the copied address, and Standard WAEPA shows business fields with correspondence hidden, and WAEPA GI suppresses both despite stale business correspondence.

## Review boundary

The earlier fixture-only repair is superseded by the standalone section/application-adapter separation above. Whole-page examples continue to verify real Site rules.

Prepared for page review. Page wording and Site-wide visual/accessibility acceptance remain open; shared behavior and presentation are governed by the common form contract. Existing Contact regression tests cover WAEPA Standard/GI product scope, saved policy overrides, adoption isolation and same-as-home copying. Extracting the section renderer preserves Contact’s field requirements, conditional policies and same-as-home behavior. Shared navigation states are reviewed in [the frame state matrix](navigation-state-review.md).

Next application page: Profile. Related: [prior-page structure checkpoint](reviewed-page-structure.md), [Beneficiary](beneficiary-component-review.md).

Phone number/type pairs now use the shared standalone PhoneField with independent self, spouse and business definitions/bindings. See the [phone binding audit](phone-field-bindings.md).
