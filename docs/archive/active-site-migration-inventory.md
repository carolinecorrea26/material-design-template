# Active Site migration inventory

This generated inventory implements the scope and acceptance register in [the migration contract](active-site-migration-contract.md). It inventories the current checked-in compiler output. It does not verify a hosted database, establish MCR parity, or activate runtime data.

There are **10 scoped Sites**, **69 enabled Site/product assignments**, and **897 open product/domain reviews**. Demo is synthetic; the other nine Sites require MCR review. Each assignment has thirteen acceptance domains. Missing records remain review work; optionality is not inferred from absence.

## Site inventory

| Site | Client | Enabled products | Main source review candidates | Candidate resolver issues |
| --- | --- | ---: | ---: | ---: |
| demo-default | demo | 11 | Not applicable | 123 |
| abe-default | abe | 11 | 11 | 123 |
| ama-default | ama | 9 | 10 | 122 |
| asce-default | asce | 5 | 5 | 118 |
| avma-default | avma | 12 | 12 | 124 |
| csea-default | csea | 1 | 0 | 114 |
| nso-default | nso | 6 | 6 | 118 |
| isitrust-default | isitrust | 10 | 10 | 122 |
| waepa-standard | waepa | 2 | 2 | 112 |
| waepa-gi | waepa | 2 | 2 | 108 |

WAEPA Standard and GI remain separate Sites sharing one client. Their source catalog counts overlap and must not be summed. AVMA LIFE and ISI source rows enter this review through explicit identity hints, not adopted ownership. CSEA GI is excluded as identity evidence for the confirmed standard CSEA Site. Candidate issues are resolver findings, not counts of MCR defects or independently verified production failures.

## Enabled products

Candidate source matches use an existing extracted client relationship or an explicit client identity hint, plus an exact primary G-number/plan-code pair or exact product name. Matches are suggestions for review. Scoped identifier variants and category equivalence still require review. A single candidate is not an adopted identity.

| Site | Product | Name | Main identity candidates | Candidate decision capabilities |
| --- | --- | --- | ---: | --- |
| demo-default | di-ltd | Long-Term Disability | Not applicable | member: eligibility |
| demo-default | di-ltd-plus | Long-Term Disability Plus | Not applicable | member: eligibility |
| demo-default | di-mtd | Mid-Term Disability | Not applicable | member: eligibility |
| demo-default | li-10yr | 10-Year Level Term | Not applicable | Not advertised |
| demo-default | li-20yr | 20-Year Level Term | Not applicable | Not advertised |
| demo-default | li-50plus | 50+ Life | Not applicable | Not advertised |
| demo-default | li-add | Accidental Death and Dismemberment | Not applicable | Not advertised |
| demo-default | li-term | Term Life | Not applicable | Not advertised |
| demo-default | oo-professional | Office Overhead | Not applicable | member: eligibility |
| demo-default | sh-critical-illness | Critical Illness | Not applicable | Not advertised |
| demo-default | sh-hospital-money | Hospital Money | Not applicable | Not advertised |
| abe-default | di-ltd | Long-Term Disability | 0 | member: eligibility |
| abe-default | di-ltd-plus | Long-Term Disability Plus | 0 | member: eligibility |
| abe-default | di-mtd | Mid-Term Disability | 0 | member: eligibility |
| abe-default | li-10yr | 10-Year Level Term | 0 | Not advertised |
| abe-default | li-20yr | 20-Year Level Term | 0 | Not advertised |
| abe-default | li-50plus | 50+ Life | 0 | Not advertised |
| abe-default | li-add | Accidental Death and Dismemberment | 0 | Not advertised |
| abe-default | li-term | Term Life | 0 | Not advertised |
| abe-default | oo-professional | Office Overhead | 0 | member: eligibility |
| abe-default | sh-critical-illness | Critical Illness | 1 | Not advertised |
| abe-default | sh-hospital-money | Hospital Money | 0 | Not advertised |
| ama-default | di-level-rated | Disability Insurance with Level Rated Premiums | 0 | member: eligibility |
| ama-default | li-10yr | 10-Year Level Term Life Insurance | 1 | Not advertised |
| ama-default | li-15yr | 15-Year Level Term Life Insurance | 1 | Not advertised |
| ama-default | li-20yr | 20-Year Level Term Life Insurance | 1 | Not advertised |
| ama-default | li-preferred | Preferred Term Life Insurance | 0 | Not advertised |
| ama-default | li-premier-accident | Premier Accident Insurance | 0 | Not advertised |
| ama-default | li-term | Term Life Insurance | 0 | Not advertised |
| ama-default | oo-office-overhead | Office Overhead Expense Insurance | 1 | member: eligibility |
| ama-default | sh-hospital-income | Hospital Income Insurance | 0 | Not advertised |
| asce-default | di-ltd | Group Disability Income Insurance | 0 | member: eligibility; spouse: eligibility |
| asce-default | li-10yr | Group 10-Year Level Term Life Insurance | 1 | member: eligibility, underwriting; spouse: eligibility, underwriting; child: eligibility |
| asce-default | li-20yr | Group 20-Year Level Term Life Insurance | 1 | member: eligibility, underwriting; spouse: eligibility, underwriting; child: eligibility |
| asce-default | li-add | High-Limit Death and Dismemberment Insurance | 0 | Not advertised |
| asce-default | li-term | Group Term Life Insurance | 1 | child: eligibility |
| avma-default | di-ltd | Long-Term Disability Insurance | 0 | member: eligibility |
| avma-default | di-ltd-plus | Student Loan Disability Insurance (Supplemental Disability) | 0 | member: eligibility |
| avma-default | di-short-term | Short-Term Disability Insurance | 0 | member: eligibility |
| avma-default | li-10yr | 10-Year Level Term Life Insurance | 1 | Not advertised |
| avma-default | li-20yr | 20-Year Level Term Life Insurance | 1 | Not advertised |
| avma-default | li-50plus | 45+ Term Life Advanced Insurance | 1 | Not advertised |
| avma-default | li-add | Large Scale Accidental Death and Dismemberment Insurance | 1 | Not advertised |
| avma-default | li-group-term | Family Group Life Insurance | 1 | Not advertised |
| avma-default | li-term | Basic Protection Package | 1 | Not advertised |
| avma-default | oo-professional | Professional Overhead Expense Insurance | 0 | member: eligibility |
| avma-default | sh-critical-illness | Critical Illness Insurance | 1 | Not advertised |
| avma-default | sh-hospital-income | Hospital Indemnity Insurance | 0 | Not advertised |
| csea-default | di-ltd | Disability Income Insurance | 0 | member: eligibility |
| nso-default | di-ltd | Long-Term Disability | 0 | member: eligibility |
| nso-default | li-10yr | 10-Year Level Term | 0 | Not advertised |
| nso-default | li-20yr | 20-Year Level Term | 0 | Not advertised |
| nso-default | li-50plus | 50+ Life | 0 | Not advertised |
| nso-default | li-add | Accidental Death and Dismemberment | 1 | Not advertised |
| nso-default | li-term | Term Life | 0 | Not advertised |
| isitrust-default | di-ltd | Group Long Term Disability Insurance | 0 | member: eligibility |
| isitrust-default | di-short-term | Group Short Term Disability Insurance | 0 | member: eligibility |
| isitrust-default | li-10yr | Group 10-Year Level Term Life Insurance | 1 | Not advertised |
| isitrust-default | li-20yr | Group 20-Year Level Term Life Insurance | 1 | Not advertised |
| isitrust-default | li-50plus | Group Graded Benefit Term Life Insurance | 0 | Not advertised |
| isitrust-default | li-add | Group Accidental Death & Dismemberment Insurance | 1 | Not advertised |
| isitrust-default | li-group-term | Group Term Life Insurance | 1 | Not advertised |
| isitrust-default | oo-professional | Business Overhead Insurance | 1 | member: eligibility |
| isitrust-default | sh-critical-illness | Critical Illness | 0 | Not advertised |
| isitrust-default | sh-hospital-income | Hospital Indemnity Insurance | 1 | Not advertised |
| waepa-standard | di-short-term | Group Short-Term Disability Income Insurance | 0 | member: eligibility |
| waepa-standard | li-group-term | Group Term Life Insurance | 0 | Not advertised |
| waepa-gi | di-short-term | Short-Term Disability | 0 | member: eligibility |
| waepa-gi | li-group-term | Group Term Life | 0 | Not advertised |

Candidate capabilities describe the existing partial persisted resolver. They do not establish full product execution, source validation, or publication readiness.

## Source triage

56 distinct Main catalog products are queued for the eight scoped business clients, including 22 through identity hints requiring review. 223 other catalog products have extracted ownership outside this review set. 90 more lack extracted ownership and still require applicability triage. Those counts do not certify that extraction identified every applicable row.

Other clients stay in the source archive for a later scope version. The full workbook is retained; current work is prioritized by explicit scoped ownership and reviewed shared applicability. Client-level source rows do not create new Sites or enable extra products.

## Detailed review register

[active-site-coverage-audit.json](active-site-coverage-audit.json) records every enabled Site/product, its thirteen acceptance domains, normalized evidence references, existing candidate capabilities, unresolved prototype requirements, identity suggestions, and same-client Main source issues. All validation stages remain pending until actual review evidence is recorded. Demo only exempts source validation; it still requires behavior and publication checks.

Regenerate with `npm run migration:scope-audit`. Check for drift with `npm run migration:scope-audit -- --check`. Neither command writes database configuration or changes the running prototype.
