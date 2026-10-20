# Phase 4B canonical MCR inventory

**Phase 4B is incomplete.** `phase5Ready: false`.

Counts are source evidence records, not counts of executable business rules. One evidence cell can support several facts; several cells can support one fact. MAPPED alone is not a claim of site behavior equivalence for non-prototype clients.

## Before and after

| Classification | Before | After |
|---|---:|---:|
| MAPPED | 6,634 | 13,899 |
| INTENTIONALLY_EXCLUDED | 19,462 | 19,462 |
| Generic UNRESOLVED | 19,224 | 0 |
| UNMAPPED_SEMANTIC | Not distinguished | 10,364 |
| PARSER_GAP | Not distinguished | 928 |
| MODEL_GAP | Not distinguished | 0 |
| IDENTITY_CONFLICT | Not distinguished | 314 |
| SOURCE_TBD | Not distinguished | 4 |
| SOURCE_CONFLICT | Not distinguished | 34 |
| REQUIRES_CLIENT_CONFIRMATION | Not distinguished | 40 |
| REQUIRES_AM_CONFIRMATION | Not distinguished | 1 |
| REQUIRES_UW_CONFIRMATION | Not distinguished | 96 |
| REQUIRES_CONTRACTS_CONFIRMATION | Not distinguished | 67 |
| REQUIRES_COMPLIANCE_CONFIRMATION | Not distinguished | 0 |
| IMAGE_REVIEW_REQUIRED | Not distinguished | 6 |
| NON_FUNCTIONAL_OR_REFERENCE | Not distinguished | 105 |

The before snapshot is the previous archived validation report. Replacing UNRESOLVED with explicit categories does not resolve the underlying requirements.

Blocking evidence records: **11,606**. Integrity errors: **0**.

Workbook SHA-256: `4ff085ca5c52102010e9ea061a630eda41c3347d28f2e3e7a8dba44ef9d8617e`

Checklist SHA-256: `f13fddee8fe6acf1938454cd4ce1472bc86c7bb71813017afadc2b872c47a638`

## Every sheet

| Sheet | Source cells | Mapped | Excluded / reference | Semantic gaps | Parser gaps | Model gaps | Identity conflicts | Source TBD | Source conflict | Confirmations | Images |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Main | 16683 | 9216 | 2657 | 4121 | 676 | 0 | 0 | 0 | 2 | 13 | 0 |
| QD LI | 2072 | 473 | 26 | 1193 | 153 | 0 | 80 | 1 | 17 | 129 | 0 |
| QD DI | 411 | 165 | 24 | 169 | 11 | 0 | 14 | 0 | 0 | 28 | 0 |
| Disability | 476 | 197 | 16 | 237 | 24 | 0 | 0 | 0 | 2 | 0 | 0 |
| Overhead Expense | 38 | 16 | 8 | 12 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| Riders | 1006 | 878 | 15 | 51 | 62 | 0 | 0 | 0 | 0 | 0 | 0 |
| New UX Multi-page Requirements | 18803 | 889 | 16428 | 1473 | 0 | 0 | 0 | 0 | 12 | 13 | 1 |
| New UX Single-Page Requirements | 1000 | 302 | 45 | 648 | 0 | 0 | 0 | 0 | 0 | 5 | 1 |
| Attestation Online and PDF | 655 | 0 | 227 | 427 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| SUP DI Health questions | 290 | 0 | 0 | 289 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| Financial questions | 10 | 9 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| Health Questions | 143 | 63 | 11 | 69 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| WAEPA CIR questions | 17 | 14 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| Read & Sign | 296 | 2 | 5 | 288 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| Smoker Question | 40 | 4 | 4 | 32 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Associations | 987 | 335 | 17 | 634 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| Beneficiary Note | 39 | 19 | 4 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| URLs | 2112 | 1228 | 41 | 617 | 0 | 0 | 220 | 0 | 0 | 6 | 0 |
| Order of Products Across Site | 43 | 0 | 0 | 43 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Standard Decision Wording | 36 | 26 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 5 | 0 |
| Underwriting | 29 | 1 | 4 | 24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ElectrConsent | 67 | 36 | 29 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| Legal Disclosures | 47 | 26 | 4 | 16 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |

All individual categories by sheet are available in [mcr-coverage.json](mcr-coverage.json). Source totals additionally include checklist-only cells and embedded-image records.

## Typed semantic facts by domain

| Domain | Facts |
|---|---:|
| associations | 31 |
| benefit-formula | 21 |
| cir-questions | 14 |
| coverage-amount | 2 |
| coverage-period | 11 |
| decision-wording | 15 |
| disclosures | 15 |
| documents | 140 |
| electronic-consent | 6 |
| eligibility | 317 |
| financial-questions | 10 |
| flags | 1 |
| identity | 294 |
| nicotine | 1 |
| payment | 860 |
| product-configuration | 2152 |
| rates | 513 |
| riders | 586 |
| underwriting | 1837 |
| ux-configuration | 94 |
| ux-content | 1023 |

These facts supplement existing amount rules, bands, products, plans, questions, URLs, and relationships. Their counts are deliberately not added to source-cell counts.

## Identity reconciliation

| Strategy | Overlay rows |
|---|---:|
| exact | 5 |
| semantic-key | 7 |
| g-number | 22 |
| plan-code | 0 |
| g-number+plan-code | 55 |
| multi-match | 12 |
| no-match | 26 |

All candidate keys and matching explanations are in [canonical-identity-review.json](canonical-identity-review.json). URL owner conflicts are additional source-ledger blockers. QD identity resolution does not create base products or runnable Sites.

## Remaining engineering blockers by sheet

The examples below are work still needed, not stakeholder TBDs. The machine-readable report includes **every** blocking cell, category, source reference, and explanation.

| Sheet | Category | Count | Examples |
|---|---|---:|---|
| associations | UNMAPPED_SEMANTIC | 634 | D2: AAFP Insurance Services, Inc. Suite 430 11400 Tomahawk Creek Parkway Leawood, KS 66211  Call: (800)3; D3: Lockton Affinity, LLC PO Box 410679, Kansas City, MO 64141-0679 Phone: (844)983-9888   Email: info@A; D4: Lockton Affinity, LLC.  PO Box 410679 Kansas City, MO 64141-0679  Website: https://www.aao-insurance |
| attestation-online-and-pdf | UNMAPPED_SEMANTIC | 427 | A1: Site; B1: Person; C1: ONLINE |
| beneficiary-note | UNMAPPED_SEMANTIC | 16 | A2: Most Sites; B2: 10YTL, 15 YLT, 20 YTL; A3: Most Sites |
| disability | PARSER_GAP | 24 | E5:  Max Benefit Calculation:      Monthly Earnings * .6 >  (see amounts based on age)?  (see amounts ba; E6:  Max Benefit Calculation: Monthly Earnings* .6 > (see amounts based on age) ? (see amounts based on ; E15:   For all ages (17 - through 59) Monthly Earnings * .6  > $7,500 ? $7,500 : Monthly Earnings * .6 |
| disability | UNMAPPED_SEMANTIC | 237 | B2: 1. Uniformed Service Chapter:      Are you a member of the Uniformed Services Chapter? Y/N      Are ; H2: R20; I2: Remove request for additional disability coverage if you are unable to work |
| health-questions | UNMAPPED_SEMANTIC | 69 | B4: Jet Issue State Variations Updated Sep,2018.docx; B5: None; B6: a.) Are you now taking any prescribed medications or receiving or contemplating any medical attentio |
| legal-disclosures | UNMAPPED_SEMANTIC | 16 | D3: There is a link to the 'Important Notice' which may link to either a file for New Mexico or Non-New ; B4: Underwriting = True and Site is Compass Rose; D4: Note: this is a unique authorization which only displays on this site. So far this has not been seen |
| main | PARSER_GAP | 676 | H2: $50,000 - $1,000,000 Increment: $50,000 Max aggregate across all life: $1,000,000 Blue Box Note: "Th; I2: $50,000 - $1,000,000 Increment: $50,000 Max aggregate across all life: $1,000,000 Blue Box Note: The; H3: $50,000 - $1,000,000 Increment: $50,000 Max aggregate across all life: $1,000,000 Blue Box Note: "Th |
| main | UNMAPPED_SEMANTIC | 4121 | A2: American Academy of Dermatology (Michele Masotti); K2: Yes (Max aggregate $1,000,000); M2: "U.S. Armed Forces Pacific, U.S. Armed Forces Americas, Guam, Guantanamo Bay, U.S. Virgin Islands, A |
| new-ux-multi-page-requirements | UNMAPPED_SEMANTIC | 1473 | A7: Example Site; B7: 1; C7: Safeguard your family's future. |
| new-ux-single-page-requirements | UNMAPPED_SEMANTIC | 648 | A6: Example Site; B6: 1; C6: Safeguard your family's future. |
| order-of-products-across-site | UNMAPPED_SEMANTIC | 43 | A1: Order of Products Across Sites; A2: just a sampling of product names across different clients; A3: Life Products: |
| overhead-expense | PARSER_GAP | 2 | D3: Pop Up Message for Maximum Monthly Benefit  (See OTHER CUSTOM tab for popup message); D5: Max Benefit Calculation Eligible Monthly Business Expenses * Percent Eligible > Policy Max (based on |
| overhead-expense | UNMAPPED_SEMANTIC | 12 | G2: n/a; B3: Member  The maximum monthly benefit available through this policy is $10,000; G3: n/a |
| qd-di | IDENTITY_CONFLICT | 14 | C2: Disability Insurance   LTD PLUS; D2:  G-29900-0; F2: 601-b |
| qd-di | PARSER_GAP | 11 | J6: 5000 Standard/Standard Smoker  smoker lookback 24m; J8: $500- $7,500  QD eligible waiting period for LTD DI is 60/90/180/365 day  Members: 60% of gross inco; J9: $500 -  $7,500 increments $500 |
| qd-di | UNMAPPED_SEMANTIC | 169 | A2: ABE; B2: DI; E2: IL |
| qd-li | IDENTITY_CONFLICT | 80 | C6: 5-Year Banded Term Life insurance (Jet Issue); D6: G-2766-3; F6: 101 |
| qd-li | PARSER_GAP | 153 | J4: Core QD	17-54: <=$500,000 Expanded QD Fluidless Eligible	17-54: >=$510,000 - <=$1,500,000 Expanded Q; K4: Core QD	17-54: <=$500,000 Expanded QD Fluidless Eligible	17-54: >=$510,000 - <=$1,500,000 Expanded Q; J5: 500000 |
| qd-li | UNMAPPED_SEMANTIC | 1193 | A2: AANA; B2: LI; E2: AL |
| read-sign | UNMAPPED_SEMANTIC | 288 | A1: READ AND SIGN ; A2: Important Information before Testing; A5: Screen Notes and Edits |
| riders | PARSER_GAP | 62 | C2: Type of Coverage: New or Change in Coverage   $100,000-$500,000 Increment: $10,000 (AD&D not include; C4: Yes/No if Yes - AD&D Benefit Amount should be the same as selected TL Benefit Amount (as Static Text; C5: Majesco: Should not render online and pdf Old Affinium: Include $15000 of AD&D (Static Text) NA |
| riders | UNMAPPED_SEMANTIC | 51 | G7: 17 through 65.ﾠ COLA Rider should be restricted for ages 66 and older.; F16: N; G25: 17 thru 39 |
| smoker-question | UNMAPPED_SEMANTIC | 32 | A2: Smoker 1 (Portal verbiage) Required*; C2: If  'Yes", indicate how long you used tobacco products or tobacco cessation products  How long  If "; A5: Smoker 2 (Jet Issue verbiage NYL-2186) Required* |
| standard-decision-wording | UNMAPPED_SEMANTIC | 5 | A1: Standard Decision Wording Verification; A6: AAFP ; A11: AMA QD Decision Wording Verification |
| sup-di-health-questions | UNMAPPED_SEMANTIC | 289 | A1: Note: for the scenarios QD Life + FUW DI coverage - render Supp DI health questions.    ﾠ  ; A2: Application should be split in QD (with QD health history) and FUW app with QD health questions + Su; A3: Sites that do not have TELE-SUPP health history - do not render Supp-DI question and do not print QD |
| underwriting | UNMAPPED_SEMANTIC | 24 | A4: Standard; B4: Height; D4: Member, Spouse |
| urls | IDENTITY_CONFLICT | 220 | A6: AAOGI; A10: AAPGI; A18: AFA |
| urls | UNMAPPED_SEMANTIC | 617 | G2: TEST URL should include a 5 digit campaign code for Aon to test XML uploads; M10: N/A; F11: Rate quote URL  https://abe.nylinsure2.com/?quotes=li https://abe.nylinsure2.com/?quotes=di     |

## True source unknowns and stakeholder review

| Category | Reference | Reason |
|---|---|---|
| REQUIRES_AM_CONFIRMATION | main!AC10 | Tobacco requirement says AM to confirm with TPA. |
| REQUIRES_UW_CONFIRMATION | main!U27 | SI/GI underwriting and TPA approval behavior contains unresolved analysis/confirmation language. |
| REQUIRES_UW_CONFIRMATION | main!U28 | SI/GI underwriting and TPA approval behavior contains unresolved analysis/confirmation language. |
| REQUIRES_CLIENT_CONFIRMATION | main!AJ74 | Canadian sales tax information needed. |
| REQUIRES_CLIENT_CONFIRMATION | main!AJ76 | Canadian sales tax information needed. |
| REQUIRES_CLIENT_CONFIRMATION | main!AJ78 | Canadian sales tax information needed. |
| REQUIRES_CLIENT_CONFIRMATION | main!AJ80 | Canadian sales tax information needed. |
| REQUIRES_CLIENT_CONFIRMATION | main!I99 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | main!J99 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | main!AM291 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | main!AH318 | Billing fee details require confirmation. |
| REQUIRES_CLIENT_CONFIRMATION | main!AI318 | Billing fee details require confirmation. |
| REQUIRES_CLIENT_CONFIRMATION | main!AQ356 | Face band structure needs confirmation from rate charts/brochure. |
| REQUIRES_UW_CONFIRMATION | qd-li!G1 | Headers explicitly call for UW/contracts confirmation; provenance should be captured via Provided by. |
| REQUIRES_UW_CONFIRMATION | qd-li!N1 | Headers explicitly call for UW/contracts confirmation; provenance should be captured via Provided by. |
| REQUIRES_UW_CONFIRMATION | qd-li!G2 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N2 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G3 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| SOURCE_CONFLICT | qd-li!J3 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!K3 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N3 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| SOURCE_CONFLICT | qd-li!O3 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!P3 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| REQUIRES_UW_CONFIRMATION | qd-li!G4 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N4 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G5 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N5 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G7 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N7 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G9 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N9 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G10 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N10 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G11 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N11 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G12 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N12 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G13 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| SOURCE_CONFLICT | qd-li!L13 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N13 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G17 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N17 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G18 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N18 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G19 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N19 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G20 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N20 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G21 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N21 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G22 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N22 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G23 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N23 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G26 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N26 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G27 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N27 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G28 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N28 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G29 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N29 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G30 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N30 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G31 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G32 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G33 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N33 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G37 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N37 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G38 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N38 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G39 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N39 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G40 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N40 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G41 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N41 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G42 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G43 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N43 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G44 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N44 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G45 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G47 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N47 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G51 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N51 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G52 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G53 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G54 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N54 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G57 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N57 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G60 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N60 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G62 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G63 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G64 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N64 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G65 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G66 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G67 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N67 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G68 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N68 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G71 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N71 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G72 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G73 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G77 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G78 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G79 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G80 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G81 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G82 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N82 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G86 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N86 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G88 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G89 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_UW_CONFIRMATION | qd-li!G90 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N90 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G92 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N92 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G96 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N96 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G97 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N97 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G98 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N98 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G99 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| SOURCE_TBD | qd-li!I99 | Value is TBD. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N99 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| SOURCE_CONFLICT | qd-li!J101 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!K101 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!O101 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!P101 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!J102 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!K102 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!O102 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!P102 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!J103 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!K103 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!O103 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| SOURCE_CONFLICT | qd-li!P103 | Malformed monetary grouping in QD schedule; source amount is not silently corrected. |
| REQUIRES_UW_CONFIRMATION | qd-li!G104 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N104 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G105 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N105 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G106 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N106 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G107 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N107 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G108 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N108 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G109 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N109 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-li!G110 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-li!N110 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G1 | Headers explicitly call for UW/contracts confirmation; provenance should be captured via Provided by. |
| REQUIRES_UW_CONFIRMATION | qd-di!N1 | Headers explicitly call for UW/contracts confirmation; provenance should be captured via Provided by. |
| REQUIRES_UW_CONFIRMATION | qd-di!G4 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N4 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G5 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N5 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G6 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N6 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G7 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N7 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G8 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N8 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G9 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N9 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G10 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N10 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G12 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N12 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G14 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N14 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G15 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N15 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G16 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N16 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G17 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N17 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| REQUIRES_UW_CONFIRMATION | qd-di!G18 | Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity. |
| REQUIRES_CONTRACTS_CONFIRMATION | qd-di!N18 | Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions. |
| SOURCE_CONFLICT | disability!E3 | Unbalanced source parentheses; original expression remains in source evidence. |
| SOURCE_CONFLICT | disability!E4 | Unbalanced source parentheses; original expression remains in source evidence. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AU14 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AU15 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AT18 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AU21 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AG27 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AN27 | Supplemental health notice says confirmation needed. |
| REQUIRES_UW_CONFIRMATION | new-ux-multi-page-requirements!AU27 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_UW_CONFIRMATION | new-ux-multi-page-requirements!AU30 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_UW_CONFIRMATION | new-ux-multi-page-requirements!AU31 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AZ43 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!Z48 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AU52 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-multi-page-requirements!AU55 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-single-page-requirements!AB7 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-single-page-requirements!AB17 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-single-page-requirements!AB18 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-single-page-requirements!AB24 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | new-ux-single-page-requirements!AB26 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | attestation-online-and-pdf!C111 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_UW_CONFIRMATION | sup-di-health-questions!G46 | Mobility item says check with UW. |
| SOURCE_TBD | financial-questions!B10 | Source explicitly leaves the explanation text-area maximum character count as a question; no limit invented. |
| SOURCE_CONFLICT | waepa-cir-questions!B2 | Source references optional question numbers 9 and 10, but the supplied CIR sheet only includes questions 1–7. |
| REQUIRES_CLIENT_CONFIRMATION | read-sign!C126 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | associations!E299 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | urls!F179 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | urls!G179 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | urls!I179 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | urls!F274 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | urls!G274 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | urls!I274 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | standard-decision-wording!B2 | Checklist flags unresolved follow-up language; retain as source content but mark verification status until confirmed. |
| REQUIRES_CLIENT_CONFIRMATION | standard-decision-wording!B5 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | standard-decision-wording!B7 | Checklist flags unresolved follow-up language; retain as source content but mark verification status until confirmed. |
| REQUIRES_CLIENT_CONFIRMATION | standard-decision-wording!B10 | Source explicitly requires confirmation; no value inferred. |
| REQUIRES_CLIENT_CONFIRMATION | standard-decision-wording!B13 | Checklist flags unresolved follow-up language; retain as source content but mark verification status until confirmed. |
| SOURCE_TBD | electrconsent!A71 | Custom consent reference is supplied, but its content is absent from the supplied workbook. |
| SOURCE_TBD | electrconsent!A72 | Custom consent reference is supplied, but its content is absent from the supplied workbook. |
| REQUIRES_CLIENT_CONFIRMATION | legal-disclosures!A11 | Source explicitly requires confirmation; no value inferred. |
| IMAGE_REVIEW_REQUIRED | new-ux-multi-page-requirements!embedded-images | Embedded images require visual review and asset extraction; checklist omits image-only content. |
| IMAGE_REVIEW_REQUIRED | new-ux-single-page-requirements!embedded-images | Embedded images require visual review and asset extraction; checklist omits image-only content. |
| IMAGE_REVIEW_REQUIRED | attestation-online-and-pdf!embedded-images | Embedded images require visual review and asset extraction; checklist omits image-only content. |
| IMAGE_REVIEW_REQUIRED | health-questions!embedded-images | Embedded images require visual review and asset extraction; checklist omits image-only content. |
| IMAGE_REVIEW_REQUIRED | read-sign!embedded-images | Embedded images require visual review and asset extraction; checklist omits image-only content. |
| IMAGE_REVIEW_REQUIRED | associations!embedded-images | Embedded images require visual review and asset extraction; checklist omits image-only content. |
| SOURCE_CONFLICT | main!2026-04-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | main!2026-08-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-04-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-08-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-12-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-02-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-01-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-07-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-06-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-03-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-05-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-11-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-10-01 00:00:00 | Checklist reference absent from supplied source workbook. |
| SOURCE_CONFLICT | new-ux-multi-page-requirements!1962-09-01 00:00:00 | Checklist reference absent from supplied source workbook. |

## Canonical table inventory

| Table | Rows |
|---|---:|
| provenanceTags | 9 |
| sourceWorkbooks | 1 |
| sourceSheets | 23 |
| sourceRequirements | 45320 |
| patterns | 5 |
| flagDefinitions | 7 |
| flagValues | 4 |
| flagAssignments | 0 |
| flagRules | 0 |
| ruleFlags | 3 |
| rulePredicates | 5 |
| structuredRuleActions | 8 |
| productConfigurationValues | 5204 |
| productClients | 267 |
| coveragePlanDefinitions | 69 |
| coveragePlanVariants | 75 |
| productCoveragePlans | 27 |
| planBenefitPeriods | 82 |
| patternAssignments | 6 |
| patternRules | 5 |
| patternConditions | 0 |
| patternFlagDefinitions | 12 |
| patternFlows | 0 |
| patternProducts | 369 |
| patternCoverageCategories | 0 |
| patternConfigurationDefinitions | 3 |
| coverageAmountPatterns | 963 |
| amountOptions | 48 |
| amountBands | 399 |
| productAmountRules | 792 |
| productApplicantEligibility | 1150 |
| riderAmountRules | 150 |
| aggregateLimits | 1 |
| underwritingBands | 344 |
| residencyRules | 0 |
| residencyJurisdictions | 0 |
| benefitPeriodOptions | 43 |
| eligibilityConstraints | 638 |
| coverageDependencies | 3 |
| maximumPlanRules | 3 |
| benefitCaps | 2 |
| questionSets | 30 |
| questionDefinitions | 226 |
| questionSetQuestions | 347 |
| questionSetFields | 0 |
| rateTables | 0 |
| productRateTables | 0 |
| rateTablePresentations | 0 |
| urlParameters | 19 |
| siteUrlParameters | 0 |
| clientEnvironmentLinks | 253 |
| urlParameterValues | 38 |
| pageSectionFields | 133 |
| requirementTargets | 22708 |
| semanticRequirements | 7943 |
| identityResolutions | 127 |
| urlDefinitions | 969 |
| urlUsages | 1166 |
| productQuestionSets | 1 |
| planAmountRules | 6 |
| patternQuestionSets | 0 |
| organizationProfiles | 9 |
| associations | 127 |
| pages | 30 |
| pageSections | 30 |
| fields | 181 |
| pageFields | 151 |
| coverageCategories | 25 |
| products | 389 |
| riders | 88 |
| productRiders | 137 |
| productIdentifiers | 764 |
| applicantTypes | 3 |
| conditions | 17 |
| rules | 102 |
| ruleConditions | 17 |
| ruleActions | 95 |
| flows | 7 |
| flowSteps | 62 |
| flowTransitions | 62 |
| features | 16 |
| configurationDefinitions | 245 |
| contentEntries | 666 |
| emailTemplates | 10 |
| documentDefinitions | 8 |
| validationRules | 181 |
| siteAssociations | 30 |
| sitePages | 300 |
| siteFieldConfigurations | 145 |
| siteProductApplicants | 413 |
| siteFeatures | 160 |
| siteFlows | 7 |
| ruleAssignments | 94 |
| configurationValues | 402 |
| contentValues | 673 |
| brandingProfiles | 10 |
| supportProfiles | 9 |
| siteEmailTemplates | 100 |
| siteDocuments | 70 |
| sitePolicies | 10 |
| siteEnvironmentLinks | 7 |
| organizations | 41 |
| clients | 96 |
| sites | 10 |
| siteCoverages | 200 |
| siteProducts | 200 |
| siteRiders | 18 |
| siteConfigurations | 2 |
| applications | 4 |
| applicationParticipants | 0 |
| applicationEvents | 0 |
| changeRequests | 5 |
| changeItems | 5 |
| releases | 2 |
| releaseChanges | 5 |
| siteBuilderDrafts | 2 |
| users | 1 |
| roles | 1 |
| userRoles | 1 |
| userScopes | 1 |
| auditEvents | 0 |
| analyticsMetrics | 4 |
| analyticsMeasurements | 40 |
