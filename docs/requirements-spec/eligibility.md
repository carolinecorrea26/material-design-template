# Eligibility (ASCE)

| File | Holds |
|---|---|
| [global/pages/eligibility.json](../../requirements/global/pages/eligibility.json) | The page: its sections and when each shows |
| [global/fields.json](../../requirements/global/fields.json) | The fields (each says which pages it is on) |
| [global/option-lists.json](../../requirements/global/option-lists.json) | Shared option lists (states and provinces) |
| [global/content/eligibility.json](../../requirements/global/content/eligibility.json) | The words |
| [sites/asce/pages/eligibility.json](../../requirements/sites/asce/pages/eligibility.json) | ASCE: turns on two child questions |

**Breadcrumb:** Eligibility, in the step **Getting started**. **Path:** `/eligibility`.
**Title:** Confirm your eligibility
**Subhead:** Answer a few questions to check eligibility and see your coverage options.
**While saving:** "Saving your eligibility information..." then "Confirming which coverage options may apply..."

## Three sections

| Section | What it holds | Shown when |
|---|---|---|
| **You** | ZIP / postal code, state / province, date of birth, and "Would you like to add dependent coverage?" (Spouse, Child) | always |
| **Your Spouse** | Spouse membership, first name, last name, date of birth | Spouse is selected |
| **Your Child(ren)** | A list of children, added one at a time, up to 10 | Child is selected |

**Your Child(ren)** is a *repeating* section: each child is one record, added and edited in a
dialog. The fields listed are the fields of one child.

## What ASCE shows

| Section | Field | Type | Required |
|---|---|---|---|
| You | Zip / Postal Code | Text | Yes |
| | State / Province | Searchable list (67 states, provinces and territories) | Yes |
| | Date of Birth | Date | Yes |
| | Would you like to add dependent coverage? | Spouse, Child (checkboxes) | No |
| Your Spouse | Is your spouse also an active member? | Yes / No | Yes |
| | First Name, Last Name, Date of Birth | Text, Text, Date | Yes |
| Your Child(ren), per child | First Name, Last Name, Date of Birth | Text, Text, Date | Yes |
| | Gender | Male / Female | Yes |
| | **Is the child a full-time student?** | Yes / No | Yes |

The full-time student question is optional in the library. ASCE turns it on.

## How sites differ (checked against all nine current sites)

| Site | Difference |
|---|---|
| ASCE | Turns on full-time student for each child |
| NSO | Turns on full-time student for each child |
| ABE | Turns on "honorably discharged service member" for each child |
| ISI Trust | Hides the spouse membership question |
| Others | None |

## Behavior on this page

These are stated plainly here and become Rules later:

- Entering a ZIP or postal code fills in the state or province.
- Next is not available when an answer makes the applicant ineligible; the reason is shown.
- If Spouse is selected, spouse details are required. If Child is selected, at least one child
  must be added.
- **On Next, the applicant is checked against the TPA's member records.** For ASCE the check uses
  first name, last name, date of birth and membership ID. When the match needs identity
  verification, a verification dialog opens before the page continues.
- When a saved application has just been resumed, a notice confirms: "Saved application loaded
  successfully."

## Not covered yet

- The component behind each section (Components, parked).
- The verification dialog's own questions and wording, and the error wording for the dependent
  rules (Rules and Validations).
- Whether a child qualifies by age, marital status and student status (Rules).
