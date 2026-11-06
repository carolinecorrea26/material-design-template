# Beneficiary (ASCE)

| File | Holds |
|---|---|
| [global/pages/beneficiary.json](../../requirements/global/pages/beneficiary.json) | The page: sections, the two dialogs, the behavior |
| [global/fields.json](../../requirements/global/fields.json) | The fields (each says which pages it is on) |
| [global/content/beneficiary.json](../../requirements/global/content/beneficiary.json) | The words |
| [global/content/help.json](../../requirements/global/content/help.json) | The help drawer text |
| [sites/asce/pages/beneficiary.json](../../requirements/sites/asce/pages/beneficiary.json) | ASCE: which note shows on which product |

**Breadcrumb:** Beneficiary, in the step **Your application details**. **Path:** `/beneficiary`.
**Title:** Add your beneficiaries
**Subhead:** Tell us who should receive benefits if a claim is paid.
**While saving:** "Saving beneficiary information..." then "Checking that the next section has what it needs..."
**Help chips:** What is a beneficiary? · What is the % share?

**Requirement:** required by default, and required for ASCE. ABE makes it optional.

## Two sections and two dialogs

| | What it is | Shown when |
|---|---|---|
| **Opt-in** (section) | "Do you want to add beneficiary information?" Yes / No | the page is optional for the site (not ASCE) |
| **Records** (section) | One card per covered product and applicant, listing the beneficiaries (primary, then contingent), with Edit, Remove and **Add Beneficiary** | the page is required, or the applicant answered Yes |
| **Beneficiary** (dialog) | Adds or edits one beneficiary | Add Beneficiary or Edit is pressed |
| **Apply to Other Coverages** (dialog) | Offers to copy a new beneficiary to the applicant's other coverages | a new beneficiary was saved and other coverages exist |

Each card in **Records** holds up to ten primary and ten contingent beneficiaries.

## The Beneficiary dialog

| Field | Type | Required | Shown when |
|---|---|---|---|
| Designation | Primary / Contingent | | always |
| Beneficiary Type | Individual / Trust | | always |
| First Name | Text | Yes | Individual |
| Last Name | Text | Yes | Individual |
| Relationship | Spouse, Child, Parent, Sibling, Other Relative, Other | Yes | Individual |
| % Share | Percent | Yes | Individual |
| Name of Trust | Text | Yes | Trust |
| Date of Trust | Date | Yes | Trust |

Titles: **Add Beneficiary** and **Edit Beneficiary**.

## What ASCE shows

For each Life and AD&D product selected for the applicant or spouse, a card with one of two notes:

| Products | Note |
|---|---|
| Group Term Life, High-Limit Death and Dismemberment | "I make the following beneficiary designation with respect to all life insurance under this insurance plan and, if I am already covered under the plan, I hereby revoke any prior beneficiary designation." |
| 10-Year and 20-Year Level Term Life | "I make the following beneficiary designation with respect to new insurance issued on the basis of this application. If you currently have insurance and wish to change your beneficiary, contact the Plan Administrator for the proper form" |

**Messages**
- "Please add beneficiary information before continuing."
- "No self or spouse Life/AD product selections were found."
- "No more beneficiaries can be added online for this coverage."

**Apply dialog:** "Would you like to apply this beneficiary to other coverages?" [Apply to Selected] [Skip]

**Help drawers** (text in `help.json`): the six paragraphs explaining what a beneficiary is, and the
four explaining the % share.

## Behavior on this page

Stated plainly here; they become Rules later:

- Beneficiaries are collected for each Life and AD&D product selected for the applicant or spouse.
  For a covered child, the beneficiary is the member.
- The shares of the individual beneficiaries in a designation must total 100%. A trust receives
  100%.
- When the page is required, at least one beneficiary must be added before continuing.

## Open

- **The notes are tied to products** (`li-term`, `li-10yr`, and so on). They are in the ASCE file
  for now and move with the Products aspect.
- **Which products collect beneficiaries** is stated as "Life and AD&D." It belongs with the
  products' rules.
- **Help drawer text for Membership** (coverage options, how applying works, cost) is not in
  `help.json` yet. It goes there when we return to Membership's help.
