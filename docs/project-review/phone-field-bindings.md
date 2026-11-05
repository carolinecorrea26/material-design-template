# Unique phone fields and reusable phone rendering

October 27, 2026. User decision: separate self, spouse and business phone/type answers; fields have unique identities while their UI components are reusable.

| Contact | Number field | Type field |
| --- | --- | --- |
| Self | `phone` | `phone-type` |
| Spouse | `spouse-phone` | `spouse-phone-type` |
| Business | `business-phone` | `business-phone-type` |

`PhoneField` is a controlled standalone component. Its caller supplies separate number/type definitions, values and change handlers. It owns phone formatting and the inline selector's presentation. `FieldRenderer` supplies the React Hook Form bindings, authored defaults and independent validation for each field. Both reuse the same internal text presentation; the phone component does not install a Site or choose application answers.

Companion lookup now defaults to `<number-field-id>-type`, with an explicit `phoneTypeFieldId` available for authored bindings. There is no universal fallback to the member's `phone-type`. Business has its own saved field definition, choices, default and validation record. Restored self/spouse/business selections remain separate; an absent new business type receives its own authored default rather than copying the member's answer.

Physician phone inputs are number-only. The shared source physician-detail definition now makes that explicit too, so it cannot inherit an applicant contact type. Repeated/questionnaire instances retain their existing applicant/question/record scopes.

Catalog loading rejects duplicate field definition IDs, missing phone companions, a number used as its own type, and a type binding shared by two different phone answers. Effective page overrides are checked before a prototype renders. Existing field surface and collection validation also rejects duplicate value bindings within each scope. Reusing a definition for the same answer on another page is different from assigning one binding to two distinct answers.

The Fields and Pages projections use the same companion resolver and list business type beside business number. Phone type selectors also expose their own analytics field identity. Existing FieldRenderer phone story IDs remain usage references; Forms → PhoneField supplies standalone examples for number/type, number-only, disabled, error and three independent contacts.

Verification covers editing both parts independently, restored values/defaults, type validation, disabled controls, the actual standalone stories, saved field edits, all saved Sites and rejection of conflicting catalog/Site bindings. Contact, shared text/control, Eligibility and quote regressions exercise the common rendering extraction.
