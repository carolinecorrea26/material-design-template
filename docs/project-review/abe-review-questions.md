# ABE review — decisions applied

October 22, 2026. All seven questions have been answered and implemented. **No unanswered ABE business questions remain.** The optional Membership ID is now on Membership.

## 1. Medical authorization and consent

Approved: use the MCR standard, Minnesota and Virginia QD authorization/consent versions and medical authorization for participating health questions or required adult FUW/TELE underwriting. The October 23 correction keeps authorization and underwritten consent even without online questions.

Source: `Read & Sign!B35`, `Read & Sign!B36`, `Read & Sign!B40`, `Read & Sign!B41`, `Read & Sign!B43`, `Read & Sign!C43`, `Read & Sign!B48`, `Read & Sign!C48`, `Read & Sign!B52`, `Read & Sign!C52`, `Read & Sign!B77`, `Read & Sign!B78`, `Read & Sign!B90`, `Read & Sign!C90`, `Read & Sign!B92`, `Read & Sign!B93`, `Legal Disclosures!A3`, `Legal Disclosures!A5`.

## 2. State-specific signature warnings

Approved: CT/VA notices and all fraud notices belong within Read and Sign. Globally only Read and Sign and Electronic Consent are legal Review sections; existing dividend controls also render within Read and Sign.

Source: `Read & Sign!B118`, `Read & Sign!B119`, `Legal Disclosures!A9`, `Legal Disclosures!B9`, `Health Questions!B44`, `Health Questions!B84`.

## 3. Hospital Money Read and Sign note

Approved: the 14pt supplemental-health attestation applies to both CI and Hospital Money inside Read and Sign, without another answer.

Source: `Read & Sign!B115`, `Read & Sign!B116`, `Legal Disclosures!A8`, `Legal Disclosures!B8`, `Legal Disclosures!D8`, `Order of Products Across Site!A23`.

## 4. Critical Illness medical questions

Approved with correction: use the supplied CI-2014 forms on a separate CI Health page, omit the tobacco item and retain the existing Coverage smoker question. Both source variants have 16 answer items after excluding tobacco and grouping headings.

Source: `Main!AA47`, `Main!AC47`, `Main!AO47`, `Main!AP47`, `Health Questions!A41`, `Health Questions!B41`, `Health Questions!B42`, `Health Questions!B43`, `Health Questions!B44`, `Health Questions!A81`, `Health Questions!B81`, `Health Questions!B82`, `Health Questions!B83`, `Health Questions!B84`.

## 5. Hospital Money tobacco questions

Conditional decision: retain the configurable SH-category smoker question because CI requires it. Do not remove or move it based on the Hospital Money-only No source flag. No duplicate smoker collection is added.

Source: `Main!AC49`, `Main!AD49`, `Main!AO49`, `Main!AP49`, `Main!AR49`.

## 6. ABE supplemental Disability medical form

Use health_forms_questions.xlsx: its Supp DI form supplies eight mandatory answer items and their source conditional details. Apply to the same adult requesting QD Life and DI; use existing Health DI after the external QD step. FUW is post-submission underwriting and does not activate a generic online questionnaire. Online TELE collection follows its separate configured form; existing TELE routes and forms are preserved.

Source: `SUP DI Health questions!A7`, `SUP DI Health questions!E7`, `SUP DI Health questions!F7`, `SUP DI Health questions!A50`, `SUP DI Health questions!D50`, `SUP DI Health questions!N50`, `SUP DI Health questions!O50`, `SUP DI Health questions!T50`, `SUP DI Health questions!X50`, `Health Questions!A101`.

## 7. $7,000 Disability financial questionnaire

Approved placement correction: member-only Financial questionnaire remains on Profile, section profileFinancialQuestionnaireSelf below Other coverage. Configure ABE for combined selected DI >= $7,000 excluding OO per U50, without a QD Life or health-completion prerequisite. No new page or spouse financial questionnaire.

Source: `SUP DI Health questions!O50`, `SUP DI Health questions!U50`, `SUP DI Health questions!V50`, `Financial questions!A2`, `Financial questions!B2`, `Financial questions!B3`, `Financial questions!B4`, `Financial questions!B5`, `Financial questions!B6`, `Financial questions!B7`, `Financial questions!B8`, `Financial questions!B9`, `Financial questions!B10`.

The [complete item-by-item assessment](abe-final-review.json) retains the original review inventory, exact source cells, accepted deferrals, decisions and code/native fingerprints. The [approved-decision checks](../../src/migration/abeApprovedDecisions.test.ts), rendered Membership/Profile/Review tests and shared navigation/payment regressions verify the implementation. Production integrations, authoritative rates and detailed PDF/XML retain their existing explicit deferrals. No other Site has started.
