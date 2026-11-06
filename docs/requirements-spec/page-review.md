# Page review: sections, then fields

One page at a time. **Order: sections first, then fields.** Words (content) are not reviewed yet.

| Page | Sections | Fields | Rolled out (prototype, Library, Storybook) |
|---|---|---|---|
| Home | **agreed: 4 section groups** | not yet reviewed | quote-entry fields only |
| Membership | **agreed: 2 sections** | **agreed** | **fields, ASCE (reviewed)** |
| Eligibility | **agreed: 3 sections** | **agreed** | **fields, answer keys and section notes, ASCE**; page structure **agreed** (runtime not yet) |
| Coverage, Beneficiary | written, not yet reviewed | not yet | no |

After a page's JSON is agreed it is rolled out: the prototype, Portal Library and
Storybook read its field definitions from the JSON, and the result is reviewed on all
three before the page is marked done.

How to read the tables:

- **Person** is who a section asks about: You (`self`), Spouse, Child or Beneficiary.
- **On by default** fields appear for every site. **Optional** fields appear only when a site
  turns them on.
- Field ids are in `code`. The label is what the applicant sees.

---

## Home

### Section grouping (agreed)

The four main groups below are agreed. This confirms grouping only, not content,
fields, required states, visibility, or ASCE-specific settings.

| # | Section ID | Name | Inventory to review |
|---|---|---|---|
| 1 | `hero` | Hero | Introduction, start/resume actions, and the variant-dependent quote-entry card or image. |
| 2 | `how-applying-works` | How applying works | Application steps and links to application-review and QuickDecision explanations. |
| 3 | `coverage-options` | Coverage options | Information about available coverage. |
| 4 | `about` | About | Association introduction, when configured, and insurer information and credentials. |

Section IDs and order are recorded in
[the Home section mapping](../../requirements/mappings/page-sections/home.json).
The inventory descriptions above come from
[the existing Home implementation](../../src/pages/Home.tsx), not approved
business requirements. Site and variant visibility remain unreviewed.

### Hero inventory (agreed)

Hero can contain a tagline, heading, description, Start application action,
Resume application action, and a configurable quote-entry card or hero image.
This approves the inventory only, not ASCE's variant, wording, visibility,
navigation behavior, or validation.

The existing implementation provides the following behavior for later review:

- Start application goes to Membership; a configured landing notice can appear first.
- Resume application opens the resume flow.
- The quote-entry card collects ZIP/postal code, state/province, and date of birth.
  Its quote action validates these entries and passes their values to the calculator
  internally; these fields are not displayed in the calculator opened from Home.
- Card/image participation depends on the Home variant and template.

### ASCE Home quote-entry fields (agreed)

| # | Field | Control | Required |
|---|---|---|---|
| 1 | `zip-postal-code` | Text input | Yes |
| 2 | `state-province` | Searchable list | Yes |
| 3 | `birth-date` | Date input | Yes |

This confirms ASCE's quote-entry fields, their order, control types, and required
states only. Geographic options, age limits, wording, automatic state derivation,
and card visibility remain unreviewed. The existing saved ASCE Home placements
mark these fields as not hidden in this order; this is placement evidence, not
proof that the card appears in every variant or template.

### Home quote-entry / calculator boundary (confirmed)

ZIP/postal code, state/province, and date of birth are collected in Home's quote-entry
card, not shown again as fields in the calculator opened from that card. Their values
are passed internally for calculation; this is not a prefilled calculator form.
This boundary does not approve the other proposed quote-entry interactions,
validation rules, or calculator fields.

The confirmed boundary is now authored in
[quoting workflows](../../requirements/global/workflows/quoting.json).
[Presentation configurations](../../requirements/global/configurations/presentation.json),
[address rules](../../requirements/global/rules/address.json),
[navigation workflows](../../requirements/global/workflows/navigation.json),
[field validations](../../requirements/global/validations/fields.json), and
[date validations](../../requirements/global/validations/dates.json)
contain implementation-derived drafts. Definitions are grouped by subject, not page.
[Home applicability](../../requirements/mappings/requirements/home.json) references
them for the page review command; it does not activate behavior in the prototype.

### Related surfaces to review (not yet agreed)

- Quote calculator, including the ZIP/postal code, state/province, and date-of-birth
  entry fields that Home passes into it.
- Application-review and QuickDecision help drawers.
- Configured landing notice and its effect on starting an application.
- Shared header/footer participation; their shared definitions should be reviewed once.

### Quote question and product review

The following decisions are confirmed for the Home quote (the Membership quote
helper was later removed; see [CHG-003](../../requirements/changelog.json)):

- Collect tobacco follow-up questions in the quote and on Coverage.
- For applicable categories, show the applicant's tobacco follow-ups when the
  tobacco-use answer is Yes, using the same condition as Coverage
  ([existing condition](../../src/config/conditions/conditions.ts)).
- Quote questions and product coverage are for the applicant, not dependents.
- Ask a question only once even when multiple selected categories need it.
- Let applicants select available product riders in the quote, using product policy.
- Use configured rider amounts where applicable and include selected riders in
  the displayed estimate.
- On Apply, carry the collected tobacco answers and selected riders into the
  application so they do not need to be entered again.
- On Coverage, show previously answered quote questions with their answers
  prefilled and editable.
- Require at least one product selection before Apply from the quote.
- At Apply, revalidate currently applicable quote answers and selections; remain
  with errors if invalid.

The shared calculator field mapping includes the existing tobacco follow-up and
rider fields for `self`. Coverage already maps the tobacco fields for `self` and
`spouse`; the decision above does not change dependent participation on Coverage.
For ASCE, both quote entry paths and the library's quote field usage resolve the
quote input definitions through the generic field loader (`quote-calculator` mapping), options and applicant participation from the fresh-start
JSON: gender, tobacco use, the two tobacco follow-ups (included even when the
legacy quote surface lacks them), average monthly income, hours worked, active at
work, and monthly business expenses/responsibility. Applicant-facing labels,
types, options and formats are unchanged; the library now shows the JSON catalog
names "Tobacco use" (was "Smoker") and "Tobacco products used" (was "Tobacco
products"). ASCE's current products ask only the first six. Existing category
requirements, Home hides, the tobacco condition and field validators still
determine when and how they apply. Quote eligibility inputs, product
selection/amount controls, other fields and sites remain on their existing paths. Coverage's saved field definitions have not yet moved to
the fresh-start JSON. The estimator offers each product's member riders (not
dependent-attached riders) for all sites, prices selected riders with the shared
[pricing formulas](../../requirements/global/formulas/pricing.json) (mock, draft), and carries them into Coverage's rider keys on Apply (CHG-002). The
library lists them as quote rider rows with their carry-forward keys.
Other carry-forward details and the precise validation/error presentation require review.
The broader Apply workflow remains a draft; confirming these two carry-forward
items and the product-selection check does not approve every detail of that workflow.
The [product-selection validation](../../requirements/global/validations/quoting.json)
is enforced by both drawer and inline quote Apply. Apply also revalidates the
current quote answers, contextual eligibility facts and selected coverage before
carrying them into the application; invalid input stays in the quote with an error.

Next: review the remaining quote behavior, then ASCE's Hero participation and the
rest of Home. Content wording remains unreviewed. The initial separate
requirements record structure is documented in
[the specification](README.md#configurations-rules-validations-presentation-and-workflows).

---

## Membership (step: Getting started, required)

What ASCE shows, top to bottom:

1. The membership question.
2. If the answer is No: a message that only members can apply.
3. If the answer is Yes: first name, last name, email, phone.
4. Then the membership follow-up question: Membership ID.

### Sections (agreed)

| # | Section | Person | Shown when | What it holds |
|---|---|---|---|---|
| 1 | **membership** | You | always | The membership question, then the applicant's title, name, email and phone. Those wait until the answer is Yes or the applicant is joining. The "only members can apply" message appears here when the answer is No. |
| 2 | **follow-up** | You | the answer is Yes, or the applicant is joining | Follow-up questions about membership. Empty unless a site turns one on. |

### Fields

| Section | Field | Type | Required | Shown when | Default |
|---|---|---|---|---|---|
| membership | Are you currently a member? (`membership`) | Yes / No | Yes | always | on |
| membership | Title (`title`) | Dropdown | No | member or joining | on |
| membership | First Name (`first-name`) | Text | Yes | member or joining | on |
| membership | Last Name (`last-name`) | Text | Yes | member or joining | on |
| membership | Email (`email`) | Text | Yes | member or joining | on |
| membership | Phone Number (`phone`) | Text | Yes | member or joining | on |
| membership | Phone Type (`phone-type`) | Dropdown: Mobile / Home / Business, starts on Mobile | Yes | member or joining | on |
| follow-up | Membership ID (`member-id`) | Text | No | member or joining | **optional**: a site turns it on |

### ASCE

- Title is **hidden**.
- Membership ID is **turned on** and **required**.
- The question reads "Are you a member of the American Society of Civil Engineers?"

### Confirmed

- Field ids: `membership`, `title`, `first-name`, `last-name`, `email`, `phone`, `phone-type`, `member-id`.
- Membership ID is optional by default and **required for ASCE**.
- If the applicant answers the way the site's membership rule accepts (Yes for ASCE), they see
  name, email, phone and the follow-up section. Otherwise they see only the first question.
- Phone Type is its own field, shown next to the phone number.

### Membership question configurations (agreed)

The membership question is one field (`membership`, "Membership attestation"). It has four **configurations**.
The default is Yes / No. A site picks a configuration and may re-word the label. Each answer maps to an
outcome (member, new member, not eligible).

| Configuration | Control | Default label | Answers (outcome) |
|---|---|---|---|
| **yes-no** (default) | Radio | Are you currently a member? | Yes (member), No (not eligible) |
| **new-or-current** | Radio | Are you a current member, or are you becoming a new member? | New Member (new member), Current Member (member) |
| **category** | Dropdown | I am a (select one) | the site lists its categories; each maps to an outcome |
| **association** | Search | I am a member of: | the site's associations (all members) |

ASCE uses the **yes-no** configuration, re-worded to "Are you a member of the American Society of Civil Engineers?"

---

## Eligibility (step: Getting started, required)

What ASCE shows, top to bottom: the applicant's ZIP, state and date of birth; the question
about adding dependents; spouse details if Spouse is chosen; children (added one at a time) if
Child is chosen. ASCE's old data has the same four blocks.

### Sections (agreed)

| # | Section | Person | Shown when | What it holds |
|---|---|---|---|---|
| 1 | **self** | You | always | ZIP or postal code, state or province, date of birth, and the question "Would you like to add dependent coverage?" (spouse, child). |
| 2 | **spouse** | Spouse | Spouse chosen | The spouse's membership question, name and date of birth. |
| 3 | **children** | Child | Child chosen | Children added one at a time (up to 10): name, date of birth, gender. |

ASCE turns on one extra child question: full-time student. There is no child unmarried
question or rule on any site; the child section's note ("Only unmarried children are eligible
for coverage.") is the only mention.

### Fields (agreed)

Checked against ASCE's old data: same labels, types and required values. The old data also
had "Is the child unmarried?"; it was removed for every site (CHG-013).

How these are set, the same way as every field on every page:

- A field is on by default; the mapping marks it `"default": "off"` when most sites do not ask it.
  A site's page file (`parked/sites/<site>/pages/eligibility.json`) `include`s an off field or
  `hide`s an on one. ASCE includes `full-time-student`.
- Field IDs come from the JSON: one field asked of a person (`first-name` for spouse and child),
  not a spouse copy. Saved answer keys follow one kebab-case rule: the field ID for you, and
  `<person>-<field ID>` for anyone else (`spouse-first-name`, `child-first-name`,
  `child-full-time-student`; later `beneficiary-first-name`).

| Section | Field | Type | Required | Shown when | Default |
|---|---|---|---|---|---|
| self | Zip / Postal Code (`zip-postal-code`) | Text | Yes | always | on |
| self | State / Province (`state-province`) | Searchable list of 67: states, DC, territories and Canadian provinces | Yes | always | on |
| self | Date of Birth (`birth-date`) | Date | Yes | always | on |
| self | Would you like to add dependent coverage? (`dependents`) | Checkboxes: Spouse, Child | No | always | on |
| spouse | Is your spouse also an active member? (`membership`, spouse label; ASCE: "Is your spouse also a member of the American Society of Civil Engineers?") | Yes / No | Yes | Spouse chosen | on |
| spouse | First Name (`first-name`) | Text | Yes | Spouse chosen | on |
| spouse | Last Name (`last-name`) | Text | Yes | Spouse chosen | on |
| spouse | Date of Birth (`birth-date`) | Date | Yes | Spouse chosen | on |
| children (each) | First Name (`first-name`) | Text | Yes | Child chosen | on |
| children (each) | Last Name (`last-name`) | Text | Yes | Child chosen | on |
| children (each) | Date of Birth (`birth-date`) | Date | Yes | Child chosen | on |
| children (each) | Gender (`gender`) | Male / Female | Yes | Child chosen | on |
| children (each) | Is the child a full-time student? (`full-time-student`, saved as `child-full-time-student`) | Yes / No | Yes | Child chosen | **off**: ASCE includes it |

### Section notes (CHG-015)

Info alerts are content keys in `global/content/eligibility.json`, set per section in the page
file (`note`); a site page file can override them under `notes`.

| Section | Content key | ASCE text |
|---|---|---|
| self | `eligibility.note.member-profession` (ASCE only, via `notes.self`) | Throughout this site you will be referred to as a Member of the Civil Engineering profession. |
| spouse | `eligibility.note.spouse` (all sites) | Domestic Partnership/Civil Union is determined by State Law and they will be referred to as "Spouse" throughout the application. |
| children | `eligibility.note.children` (all sites) | Only unmarried children are eligible for coverage. |

### Page structure (agreed)

| Aspect | Where | Eligibility draft |
|---|---|---|
| Configuration | `parked/pages.json` | `type: form`, `step: getting-started`; order within the type follows `global/pages.json` (after Membership, before Coverage). |
| Components | `parked/eligibility.json` `components` | FormRoutePage › ProgressStep, PageHeader, PageAlert, EligibilitySections (self/spouse FieldGroup + SectionNote, children DynamicList + SectionNote), PageNav; MemberVerification, VerificationAddress, Snackbar. |
| Configurations | `global/configurations/people.json` | `site-people` (self, spouse, child), `child-list-maximum` (10), `tpa-integration` (none / member-lookup / membership-auto-approval); eligible states stay in `address.json`. |
| Rules | `global/rules/eligibility.json` | repeating-entry-list, dependents-from-site-people, applicant-disqualifying-answer, tpa-member-lookup, applicant-product-eligibility (age limits per product). Autosave on Next is the existing `form-next-save`. |
| Validations | `global/validations/eligibility.json` | Page level, on Next: eligible-state-required, child-required, spouse-details-required, each with a content message and code `VALIDATION_FAILED`. Inline (before Next): only format checks, ZIP (`postal-code-format`) and dates of birth (`date-value-format`). Everything else on Next. |
| Error codes | `global/error-codes.json` | The 14 established recovery codes (`src/domain/recoveryIncident.ts`, Storybook's Error pages); a validation `code` must be one of them. |
| Ineligible | rule `applicant-disqualifying-answer` | The reason shows when Next is clicked and the page does not continue; Next is no longer disabled (CHG-017). |
