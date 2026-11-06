# Membership (ASCE)

The pilot page, built end to end: sections, fields and content.

| File | Holds |
|---|---|
| [global/pages/membership.json](../../requirements/global/pages/membership.json) | The page: its sections and when each shows |
| [global/fields.json](../../requirements/global/fields.json) | The fields (each says which pages it is on) |
| [global/content/membership.json](../../requirements/global/content/membership.json) | The words |
| [sites/asce/pages/membership.json](../../requirements/sites/asce/pages/membership.json) | ASCE: hide Title, turn on Member ID |
| [sites/asce/fields.json](../../requirements/sites/asce/fields.json) | ASCE: membership question wording, and Membership ID is required |

**Breadcrumb:** Membership, in the step **Getting started**. **Path:** `/membership`.
**Title:** Your application for ASCE-sponsored insurance
**Subhead:** Progress saves as you go, so you can stop anytime and finish later.
**Help chips:** What are my coverage options? · How does applying work? (The "How much does it cost?" quote chip was removed; see [CHG-003](../../requirements/changelog.json).)

The application record is created on this page and autosave starts. Next is not available when
the outcome is not eligible.

## Two sections

| Section | What it holds | Shown when |
|---|---|---|
| **Membership** | The membership question, then the applicant's title, name, email and phone. The name and contact fields wait until the outcome is member or new member. Feedback appears here for an outcome. | always |
| **Follow-up** | Follow-up questions about membership. None are on by default; a site turns on the ones it uses (here: Membership ID) | the outcome is member or new member |

A field can narrow when it shows (for example, only for a new member).

## Outcomes

The membership question differs on each site, but each answer means one of three things. The
sections react to the outcome, never to a site's own answer values.

| Outcome | Meaning |
|---|---|
| **member** | An existing member |
| **new member** | Someone becoming a member as part of applying |
| **not eligible** | Cannot apply. Next is blocked, and the feedback for this outcome is shown. |

| Site | Question | Answer → outcome |
|---|---|---|
| ASCE (the global default) | Are you a member of …? | Yes → member · No → not eligible |
| WAEPA | Current member, or becoming a new member? | Current → member · New → new member |

## Follow-up questions across sites

Every site's extra membership questions fit in Follow-up. Checked against the current pages:

| Site | Follow-up questions |
|---|---|
| ASCE | Membership ID |
| ABE | Membership ID |
| AVMA | Veterinary college, year of graduation, occupation |
| CSEA | Occupation group |
| NSO | Nurse type (only when the answer is Yes) |
| WAEPA | Declaration, eligibility category, employer, start date, retired employer, retirement date, associated-member name and ID, active-duty question, referral source (several only for a new member) |

## What ASCE shows

**Status:** *Are you a member of the American Society of Civil Engineers?* Yes / No (required).

**Feedback if No (not eligible):**
> We're sorry, but only members are eligible to apply for this coverage.
> **Not yet a member?** You can apply for membership with your association to become eligible
> for coverage. Contact American Society of Civil Engineers or visit your association's website
> to learn about membership options and how to join.
> For more information, visit asceinsurance.com.

**If Yes (member):**

| Section | Field | Type | Required |
|---|---|---|---|
| Membership | First Name | Text | Yes |
| | Last Name | Text | Yes |
| | Email | Text | Yes |
| | Phone Number | Text | Yes |
| Follow-up | Membership ID | Text | Yes |

Email helper text: "Provide a valid email address where you can receive important updates about
your application." ASCE hides **Title**, which other sites show. Membership ID is the field
ASCE, ABE and WAEPA each name separately today; it is now one field, `member-id`. It is **not
required by default** (ABE and WAEPA do not require it); ASCE makes it required.

## Not covered yet

- The component behind each section (Components, parked).
- Rules such as the membership lookup against the TPA, conditions between fields (WAEPA's
  attestation choices), and the association-link error some sites use.
- AMA's membership question (a category, with a spouse case). Not needed for ASCE.
