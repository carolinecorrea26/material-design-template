# ASCE MCR to template check

October 8, 2026. Authority: the stored `04-MCR-new-version-full.xlsx` transcription in `src/migration/sources/mcr.json`, plus the six user-approved age/FUW corrections. This review compares the persisted mock template, not just the historical authored ASCE configuration.

| MCR reference | Check | Result in this increment |
|---|---|---|
| Main!G165:G169 | Product codes | Effective codes match: 10-Year 102, 20-Year 121, Term 101, AD&D 999, DI 601. No additional plan-code decision needed. |
| Riders!C43:D43 | CIR $50,000–$1,000,000 in $50,000 steps for member; $25,000–$1,000,000 in $25,000 steps for spouse | Fixed the displayed rider amount steps, which incorrectly used $10,000. Normalized selection policy already used the MCR steps; both now agree. |
| Main!H168:I168 | AD&D $50,000 member/spouse increments | Fixed historical $10,000 display steps to $50,000. |
| Main!W165:W168 | Children have no medical underwriting | Fixed the persisted fallback that inherited adult QD. A scoped, source-derived `NA` pathway now preserves the MCR No answer without invoking QD for children. |
| Main!J165:J167 | Child Life $10,000, one Life plan | Existing fixed child amount and one-plan constraint retained. Regression checks confirm the constraint in the effective persisted template. |
| Main!Q165:Q167/T165:T167 | Child age, unmarried/student requirements | Existing shared child collection/eligibility checks retained. Children are collected as application facts; no new separate pricing or verification service was introduced. |
| QD LI age/amount bands plus approved ASCE decisions | Member/spouse QD/FUW routing | Existing approved ages 18–69 (10-Year), 18–59 (20-Year) and older-age FUW bands retained. QD remains an external iframe/loading placeholder. |
| SUP DI Health questions!A19:F19 | ASCE has DI; QD DI No; mutual exclusive No; TELE-Supp No; SUP DI No | The general shared catalog does not authorize adding Tele-Supp or supplemental DI to ASCE. Their absence is consistent with this MCR row. |
| Main!H167:I167/L167 and Riders row 43 | CIR amount cap, age and residency (CIR-only election removed by ASCE update, CHG-007) | Existing normalized election policy carries these MCR rules; CIR is a normal rider only. No real-time policy service is required. Browser parity between that policy and the displayed controls remains part of the page-by-page comparison. |

The new health catalog is shared globally. MCR Site/product applicability determines whether a specific questionnaire is relevant. Do not request additional application forms, real rates, underwriting decision services or document providers to complete this prototype.

## Scope and remaining comparison

This increment verifies the entries above and fixes the concrete mismatches found. Existing coverage runtime tests exercise DI work/age/income caps, required periods, spouse package, child eligibility, dependency and maximum-plan rules; the broader journey suite checks persisted mappings. That evidence does not substitute for a complete page-by-page field/content comparison of every MCR entry. The remaining review should list only exact MCR cell-to-template differences, especially CIR controls, field visibility/requiredness, exclusions and Review wording. Synthetic quote/payment consistency and component extraction are ordinary refactoring work, not requests for additional business sources.

See [the revised execution register](../asce-follow-up-execution.md), [save/resume](applicant-save-resume.md), and [shared health comparison](global-health-form-migration.md).
