# Portal Library field inventory audit

Audited the current frontend implementations and configured Site adapters on 2026-09-29. The Library previously indexed only the flat field registry. This omitted page-owned questions and repeated record editors, and left client-added placements out of Global.

## What changed

- Eligibility now includes each child's first name, last name, birth date, and gender under the children collection. Requirement-driven unmarried/student questions retain their nested storage keys.
- Health SI, LI, and DI questions and their repeated detail inputs are shared with the actual page renderers. Applicant and product participation gates determine which Site can expose them.
- Beneficiary individual/trust inputs, optional opt-in, and beneficiary type appear with per-product/applicant collection context.
- Existing disability company records, review consents, payment method/frequency per product, optional payment opt-in, and paired phone-type selectors are indexed.
- Coverage applicant/amount/period/rider controls, Home quote controls, member verification sample questions, and the shared needs calculator are included by area. Temporary component state is explicitly distinguished from saved application keys.
- Global is the union of current Site placements and canonical baseline definitions. Different effective labels/options/requirements remain separate variants, with their applicable Sites listed. The global baseline remains inspectable when every Site overrides it.
- Effective Site resolves the selected Site's fields, configured products, page requirements, and category-specific questions. Excluded pages and unsupported health flows are omitted.
- Page-to-Fields links and Rule-to-Fields availability checks use the same inventory as the destination table.
- Scope changes discard table search/filters while remembering the chosen Site. Global no longer retains Effective Site filtering.

## Scope and interpretation

This is an inventory of possible inputs in the **current local implementations**, not a snapshot of inputs visible for one completed application and not certification of external vendor forms. Conditional questions require the indicated applicant/product/answer. Repeated records use one definition per collection member rather than an arbitrary number of child/beneficiary records.

The audit covers applicant, resume, and advisor-login forms. Internal Admin Center/CMS/demo controls are outside the applicant field inventory. Navigation buttons, disclosures, print actions, copy shortcuts, cookie dismissal, and dev controls are not application fields. Shared needs-calculator inputs are counted once on every applicable page, so a page such as Receipt or DocuSign can have menu inputs without a native page form. Health QD/CIR and signing handoffs do not gain invented vendor inputs. Home uses the configured Site variant; developer URL variant overrides are not a separate Site configuration.

Page-defined field definitions were moved into shared pure modules; rendering, validation, form field order, and saved collection shapes were preserved. The new inventory is inspection-only and does not feed runtime forms or migration readiness gates. Supplemental component placements are explicit mappings and must be maintained if new custom controls are introduced.

## Configured Site coverage

Counts include conditional inputs and shared tools. A placement is a field within one page/area; unique keys may be reused across pages. Counts do not mean that all these fields render simultaneously.

Global: **618 distinct field keys**, **921 definition/placement variants**.

| Client | Site | Field keys | Placements | Pages/areas with inputs |
| --- | --- | ---: | ---: | ---: |
| demo | demo-default | 231 | 272 | 15 |
| abe | abe-default | 499 | 569 | 20 |
| ama | ama-default | 238 | 292 | 16 |
| asce | asce-default | 226 | 284 | 17 |
| avma | avma-default | 254 | 299 | 16 |
| csea | csea-default | 141 | 178 | 14 |
| nso | nso-default | 212 | 257 | 16 |
| isitrust | isitrust-default | 248 | 298 | 15 |
| waepa | waepa-standard | 191 | 246 | 17 |
| waepa | waepa-gi | 177 | 226 | 17 |

For the actual field lists, use Library → Fields → Page and Area; Global additionally offers Sites filtering. Effective Site retains the organization/client/site selector. CSV/XML exports include the displayed inventory columns.

## Verification

- All 10 configured Sites have inventory coverage assertions for children, applicable health questions/detail records, payment products, optional/excluded pages, and Global union membership.
- Navigation tests verify child collection fields and Effective → Global filter reset.
- Browser verified WAEPA Eligibility children and the Global scope reset (search empty, Page/Area/Sites all reset).
- Full suite: 687 passed, 1 skipped; 50 test files passed, 1 skipped.
- Production build passed; existing large-bundle warning remains.
