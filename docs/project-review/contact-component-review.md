# Contact — fresh-start review

Reviewed November 13, 2026 (CHG-058), for the global template and effective ASCE
Site. Existing shared address/phone presentation is retained. The dependent-only
address question was resolved during this review: collect the member address even
when the member requests no coverage. The corrected second decision retains the
member employer section for spouse-only DI because spouse disability coverage
is based on member employment. There is no separate spouse employer collection.
Both questions are resolved; none is deferred or remains open.


## Ownership and composition

| Aspect | Authoritative source / behavior |
|---|---|
| Page, route, position and sections | `requirements/parked/contact.json`: Contact, `/contact`, application position 5; residential, member business/employer and spouse contact sections. |
| Effective ASCE assignment | `requirements/parked/sites/asce/pages/contact.json`: required, position 5. ASCE inherits global definitions/defaults; no Site-specific renderer. |
| Shared inputs | `global/fields.json`, `parked/field-details.json`, `global/option-lists.json` and `mappings/page-fields/contact.json`; 19 scalar field bindings including phone-type companions. |
| Components | FormRoutePage, progress/breadcrumbs, PageHeader, PageAlert, PageNav; ConfiguredContactSections selects participation; ContactSections composes ResidentialAddress and BusinessInformation; supplied spouse fields use its generic FieldGroup/FieldRenderer path. Shared AddressFields, FieldRenderer and PhoneField render the inputs. |
| Content | `global/content/contact.json` owns title, description, breadcrumb and employer heading. Shared person labels and navigation have their own global content sources. Field labels, help, options and requiredness belong to shared field definitions and supported Site overrides. `content-bindings.json` projects wording without another editable copy. |
| Rules | `global/rules/contact.json`, linked by `mappings/requirements/contact.json`, owns address participation, business/correspondence rules, copying, spouse participation, carry-forward and storage/validation. Superseded captured Contact rules and associations are retired. |

## Fields and participation

| Group | Fields / behavior |
|---|---|
| Member residential address | `street-address`, `apt-suite`, `city`, `state`, `zip-code`, `correspondence-to`. Collect the owner address even for spouse/child-only coverage. Street, city, state and ZIP/postal code are globally included and required; apartment/suite defaults optional. Enabled correspondence follows its effective definition; hidden correspondence saves Home. No duplicate member email/phone fields: those remain on Membership. |
| Business/employer | `business-name`, `business-type`, `business-address-same-as-home`, `business-street-address`, `business-apt-suite`, `business-city`, `business-state`, `business-zip-code`, `business-phone`, `business-phone-type`. Selected member/spouse DI/OO shows the member employer section, including spouse-only DI. Business correspondence for other categories shows the business address alone. Site hiding and product-scope settings apply before rendering. |
| Spouse contact | `spouse-phone`, `spouse-phone-type`, `spouse-email`, only for a spouse selected on Eligibility and participating in a currently selected product. Old elections on removed products do not reveal this section. Phone/type and email are independent of the member/business values; default phone type is Mobile. No child contact fields. |

`applicantParticipation: always` is a shared section contract for owner/household
sections. Contact's member address and business placement use it; normal applying-
applicant participation remains the default elsewhere. Labels still describe the
person whose data is collected, independently of who elects coverage.

## Configuration

All definitions/defaults are global; effective Sites may assign supported values.
ASCE inherits the Contact defaults below.

| Setting | Default and effect |
|---|---|
| `contact-hide-business-address` | false; when effectively hidden, omit business controls and the correspondence question and save Home. An explicit selected assigned product scope can enable an exception. |
| `contact-hide-correspondence` | false; omits the correspondence control and validation and saves Home. Automatic product-driven business collection remains independent. |
| `contact-business-address-products` | empty list: use normal category/correspondence policy. A nonempty list controls automatic collection and hide-business exceptions for selected assigned products. Outside complete hiding, Business correspondence independently reveals address-only fields, including products outside this list. Unknown/unassigned/disabled product IDs are rejected. |
| `eligible-states-only`, `eligible-states` | Existing shared definitions and ASCE Eligibility assignments govern Contact state options too; their retained draft statuses are unchanged. |
| Field inclusion/overrides | Core member street/city/state/ZIP remain included and required; labels and supported state options remain configurable. Conditional spouse/business fields retain supported inclusion/requiredness overrides. Postal/email/phone formats remain global. Apartment/suite defaults optional. |

The default employer categories (DI/OO) and correspondence value live in Contact's
global `businessPolicy`; runtime helpers read that source. Product-scoped and hidden
Storybook examples compile synthetic assignments through the same source pipeline,
using real fresh-start product keys. They do not select another customer's fields.

## Rules, validation and storage

- On entry, Eligibility `state-province` and `zip-postal-code` fill empty Contact
  `state` and `zip-code`. Restored Contact edits are preserved. Changing Contact
  does not rewrite Eligibility. Contact has no live ZIP-to-state lookup or address
  verification service.
- Same-as-home copies all five residential address values, including empty strings,
  into separate member business keys and follows subsequent edits while checked. Separate
  business address and phone controls are hidden while checked. Unchecking retains
  copied values for independent editing; it does not copy phone/email. The checkbox
  refers to the collected member/household home address. A hidden retained checkbox
  cannot copy over a correspondence-only address.
- Next checks rendered active fields: effective requiredness, offered dropdown/radio
  values, shared US ZIP/ZIP+4/Canadian postal format, email syntax and exactly ten
  phone digits. Business phone is optional; its visible companion uses the shared
  authored type definition. Hidden employer/spouse/address controls do not block
  submission. Errors use the shared field/page feedback.
- Answers are persisted as the scalar keys above; the same-as-home flag is boolean.
  Separate business values are saved, rather than a pointer to residential data.
  Hidden drafts are retained and do not reactivate their sections, except that hidden
  correspondence is normalized to the global Home value (`residential`). Phone companions are each stored once under their
  own namespace. Member address supports browser autofill; spouse personal contact does not. State
  filtering applies to residential and member business addresses.
- Existing save, Back/Next and session behavior is inherited. No real address,
  email-delivery or other integration is introduced by this review.

Current ASCE MCR v78 Main rows 165–169 supply product/applicant provenance; they do
not introduce a separate Contact implementation. Existing accepted first-page
phone/email placement remains intact. The user decision above resolves dependent-
only owner address collection.

## Verification and consumers

Fresh-start checks reconstruct Contact without superseded page/field/content
records, retain shared definitions under Site filtering, isolate synthetic Site
configuration, retire old Contact rules and reject invalid scope/participation.
Contact tests cover conditional sections, correspondence-only validation, dependent-
only address validation/submission, member employer submission for spouse-only DI,
retired spouse-employer bindings, stale spouse elections, independent phone types,
carry-forward and live same-as-home copying. Storybook checks render the real page
for residential, restored, business, spouse, hidden/product-scoped and dependent-only
and spouse-DI cases without mutating the source catalog. Library, prototype and Storybook read the
same projection. No other real Site rollout is included.

Next application page: Profile.

Superseded `spouse-business-*` field identities are explicitly retired by the global Contact page source. Older draft values are not reassigned to the member employer record.


## Client configuration and copy review (CHG-081)

User decision November 15, 2026. Contact exposes three string slots in `requirements/parked/contact.json#contentSlots`, inheriting global definitions/defaults. Effective values use `parked/sites/<site>/pages/contact.json` → `content`. ASCE supplies no copy override.

| Contact item | Client configurable | Boundary |
| --- | --- | --- |
| Page title and introduction | Yes | `contact.title`, `contact.subhead`; shared application-header contract |
| Business / Employer Information heading | Yes | `contact.section.business`; global default retained. The shared BusinessInformation reads the effective content binding for the page and standalone examples |
| Address, correspondence, employer and spouse-contact field labels/options/requirements | Shared field contract, constrained by CHG-098 | Core member address remains included/required; conditional spouse/business overrides remain supported. Formats stay global; stable member/business/spouse answer keys |
| Applicant section labels | Existing shared applicant presentation | Independent of the business heading; labels continue to identify the person whose information is collected |
| Business section hiding/product scope and correspondence hiding | Existing Site configurations | `contact-hide-business-address`, `contact-business-address-products`, `contact-hide-correspondence` |
| State options/residency configuration | Existing shared contract | Inherited effective residency settings; no duplicate Contact-only location policy |
| Navigation, loading, validation and other system wording | Global/shared | No new free-form Contact content slots |
| Member address collection, member employment ownership, same-as-home and spouse participation | Global rules with existing effective settings | Copy never changes who supplies data, which keys store it, visibility, copying or validation |

The business heading is bound into `pages.contact.messages.businessHeading`. The default adapter imports its global definition; the existing component reads ComponentContentContext rather than a parallel string. ContactSections no longer forces the global section-definition description over the effective value. Shared section definitions remain global and unchanged. No Site-specific component, additional employer section or spouse-employer binding is introduced.

Omitted strings inherit defaults. Unsupported keys/types are rejected by the existing content contract. Custom business-heading text is displayed only when existing business participation permits that section. In spouse-only DI, the existing member business fields still appear beneath the member/owner section; spouse phone/email remain separate.


CHG-081 verification: **72 fresh-start and 13 focused page/standalone/Storybook checks passed**. TypeScript, focused lint, requirements and component-reuse evidence pass. Prototype and Storybook production builds pass; public, application and Storybook catalog artifacts are identical.


## Non-copy configuration review (CHG-098)

User decisions November 16, 2026 close the Contact configuration review. No open
questions remain for this page. All definitions, defaults and constraints are
global; ASCE retains its inherited Contact settings and existing product policies.

| Item | Global contract / effective Site permission |
| --- | --- |
| Core member residential address | Street, city, state and ZIP/postal code always included and required, including dependent-only applications. Labels and supported state options remain configurable. Apartment/suite defaults optional. |
| Conditional spouse/business fields | Supported inclusion and requiredness overrides remain available. Fields participate only within applicable sections; hidden fields do not validate. |
| Formats | Postal, email and phone format properties remain global; Site wording and allowed option subsets retain their supported contracts. |
| Automatic business collection | Default DI/OO categories, or selected products in an assigned product list. Spouse-only DI still uses member employment. Only current URL-filtered product/applicant elections count. |
| Business correspondence | When business addresses are available, the question remains available even if the selected product does not require employer details. Choosing Business reveals address-only fields independently of automatic product scope. |
| Complete business hiding | No business controls or correspondence question. Persist Home (`residential`), replacing retained Business; preserve separate business-address drafts. Existing matching product exceptions still enable business collection. |
| Independently hidden correspondence | Also persists Home; automatic product-driven employer collection can remain visible. The global `businessPolicy.hiddenCorrespondenceValue` owns the stored value. |
| Same-as-home | Copies only when its control and employer section are available. Retained hidden checkbox values cannot suppress or overwrite separate business addresses. |

The existing shared Contact/address/phone components are reused. The hidden-business
Storybook example now enables only complete business hiding, demonstrating that
correspondence hides automatically. No duplicate field/component or ASCE branch
was added. The global source reconstructs Contact without superseded records;
Library, prototype and Storybook project the same definitions and assignments.

CHG-098 verification: **87 Fresh-start and 29 focused checks passed** (Contact page, synthetic configuration, Storybook and requirements validation). TypeScript, focused lint, requirements, component, icon and handoff checks passed. Prototype and Storybook production builds passed; public, application and Storybook catalog artifacts have identical SHA-256 hashes.
