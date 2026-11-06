# Coverage (ASCE)

| File | Holds |
|---|---|
| [global/pages/coverage.json](../../requirements/global/pages/coverage.json) | The page: sections, when each shows, the question for each category |
| [global/fields.json](../../requirements/global/fields.json) | The fields (each says which pages it is on) |
| [global/option-lists.json](../../requirements/global/option-lists.json) | Option lists: coverage categories, tobacco products |
| [global/content/coverage.json](../../requirements/global/content/coverage.json) | The words |
| [sites/asce/fields.json](../../requirements/sites/asce/fields.json) | ASCE offers three categories: Life, AD&D, Disability |

**Breadcrumb:** Coverage, in the step **Choose your coverage**. **Path:** `/coverage`.
**Title:** Your coverage options
**Subhead:** Explore and customize your coverage options. Please note that available options are
based on eligibility information.
**While saving:** "Saving your coverage selections..." then "Preparing questions for the coverage you selected..."

## How the page works

1. The applicant picks the coverage categories they want.
2. They answer the questions those categories need, for themselves and, if selected, a spouse.
3. They press **See my coverage options**. The products appear.
4. For each product they choose who it covers, an amount and any riders, and see the estimated
   cost and a combined total.

## Ten sections

| Section | What it holds | Shown when |
|---|---|---|
| **Portfolio** | "View coverage portfolio" button, opening the applicant's existing coverage | the TPA found existing coverage |
| **Categories** | "Which coverage are you interested in?" | the site offers more than one category |
| **You: Personal Details** | Gender, tobacco use, and (if tobacco) last used and products | by category |
| **You: Work & Income** | Hours per week, monthly income, self employed for less than 1 year | by category |
| **You: Business Details** | Monthly business expenses, % responsible, average employees | by category |
| **Spouse: Personal Details** | The same personal questions for a spouse | Spouse is selected |
| **Spouse: Work & Income** | Hours per week, monthly income | Spouse is selected |
| **Reveal** | The "See my coverage options" button | a category is selected and products are not yet shown |
| **Products** | Product cards for each selected category | products are shown |
| **Summary** | Combined estimated cost, monthly or annual, and the cart summary | products are shown |

## Questions by category

Each question lists the coverage categories that need it. It appears when any selected category
is one of them.

| Question | Needed for |
|---|---|
| Gender | Life, Disability |
| Tobacco use (and last used, products) | Life, Supplemental Health |
| Hours worked per week | Disability, Office Overhead |
| Monthly income · Self employed for less than 1 year | Disability |
| Monthly business expenses · % responsible · Average employees | Office Overhead |
| Accidental Death and Dismemberment | none |

This matches today's rules for Life and Disability exactly. A site that does not offer a category
never shows that category's questions, so ASCE needs no extra settings for Office Overhead or
Supplemental Health.

## What ASCE offers

The three categories above, with these five products (their amounts, riders, rates and
eligibility are defined in Products and Rules, later):

| Product | Category | Covers |
|---|---|---|
| Group Term Life Insurance | Life | You, spouse, child |
| Group 10-Year Level Term Life Insurance | Life | You, spouse, child |
| Group 20-Year Level Term Life Insurance | Life | You, spouse, child |
| High-Limit Death and Dismemberment Insurance | AD&D | You, spouse, child |
| Group Disability Income Insurance | Disability | You, spouse |

## Words on the page

- **Category descriptions:** "Life coverage can help provide financial protection for the people
  who depend on you." (and one each for AD&D, Disability, Office Overhead, Supplemental Health)
- **Who it covers:** Select for myself · Select for my spouse · Select for my child
- **Product card:** Add coverage · Est. cost¹ · Total Estimated Cost
- **Errors:** "Please select at least one coverage category." · "Please correct the errors below
  before continuing."
- **Notices:** "No coverage is available through this link. Please contact your plan
  administrator for help." and a warning, with a **Remove unavailable selections** button, when
  earlier selections are no longer available.
- **Dialog (dependent coverage):** "To apply for dependent coverage, the member must be insured
  with this group coverage." [Continue] [Cancel]

## Behavior on this page

Stated plainly here; they become Rules later:

- Products show only after at least one category is selected and **See my coverage options** is
  pressed. Changing an answer hides them again.
- Next is hidden while products load and while **See my coverage options** is showing.
- The first product added opens the cart summary; later additions show a short "Added" message.
- Costs are estimates; the combined cost can be shown monthly or annually.
- If only dependent coverage is selected, the dependent coverage dialog asks to continue.

## Open

- **Product controls** (amount, waiting period, benefit period, riders) belong to Products.
- **Components** for each section (parked).
