# Step 3: active Site adoption

Step 3 is in progress. Identity and applicability review now covers all 69 enabled Site/product assignments. The [generated crosswalk](step3-identity-crosswalk.md) links 56 business assignments to specific Main rows, keeps 11 demo assignments synthetic, and records the original identity/portfolio findings. The GI portfolio finding is now resolved in the reviewed candidate; CSEA has confirmed standard evidence with an ambiguous Main label. WAEPAGI's reviewed adoption now includes its fixed member offer, member-only life portfolio, no riders and Bank/Card Monthly payment policy. The remaining rules are required migration work, not optional because the prototype lacks them.

## Scope and precedence

Migrate applicable coverage amounts, applicant availability, eligibility, dependencies, riders, health-question rules, payment options and rate information for the active Sites. Keep unrelated old presentation/framework switches out of the Library. The old HTML's scripts, handlers and recommendations are evidence to translate, not instructions to execute. Retain exact approved ASCE decisions and the September 30 TPA reconciliation.

MCR supplies real amount/payment/rate evidence. Where MCR establishes a replacement, use it ahead of prototype estimates and stale legacy arithmetic. Use the authorized legacy arithmetic fallback only where there is no applicable replacement. A formula consuming service premiums does not supply the base premiums or authorize AMA fees for another client. Currency confirmation and missing base-rate inputs remain explicit publication checks.

Source-linked identity is deliberately separate from policy adoption. The crosswalk preserves literal multiline G-number/plan evidence and class/association conditions. XML/PDF/dummy identifier roles must be represented explicitly before submission; do not use the first G-number found as a universal identifier. Additional products established for an active Site must be reviewed for the migrated portfolio even if the prototype lacks them. Other client Sites and campaign variants remain deferred.

## WAEPAGI fixed offer

Caroline instructed that WAEPAGI amounts come from MCR/siteconfig. `Main!B386` identifies the general WAEPA GI Site, independent of upgrade, conference, new-hire and child-conversion campaigns. `Main!E386` gives `G-30280-0`, `Main!G386` gives plan `101`, and `Main!H386` establishes a fixed **$100,000** member offer. The scoped legacy default and certification agree. The legacy $250,000 spouse branch does not establish another offer.

`createReviewedMigrationDatabase()` applies the fixed offer and the subsequent portfolio/payment decision to normalized rows. Its member amount replaces inherited member/all-applicant amount assignments; Site-scoped identifiers preserve separation from standard WAEPA. The candidate carries cell-level targets, Site-limited source promotion and a semantic adoption record. Tests verify persisted JSON resolution, idempotence, source drift rejection, export integrity and unchanged standard WAEPA. Existing compatibility fixtures and live runtime are not switched.

The inherited disability product has no scoped GI source support and is disabled in the reviewed candidate. Age/military eligibility, residency, questions and authoritative premiums remain further adoption work. Existing prototype prices are not validated rates.

## WAEPAGI portfolio and payment decision

Caroline clarified on October 1: “take what is in GI source evidence, prototype probably has a lot of inaccurate coverage info as that was the most dummy info” and “waepaGI can have CC option”. This resolves the portfolio and card-method questions without further approval.

The candidate enables only member Group Term Life with the fixed $100,000 offer. It removes inherited disability/dependent amount assignments and disables inherited riders, including an explicit empty Site rider replacement so global/client defaults cannot restore them. The normalized underwriting band is GI for ages 18–39 at $100,000, from Main!O386/U386, replacing inherited QD bands. This does not certify full eligibility: military/residency restrictions still need executable predicates, and the candidate continues to report unimplemented eligibility. Other WAEPA Sites are unchanged.

Payment is required, with **Bank Account or Credit Card, Monthly only**, default Bank Account and locked frequency, synchronized across products. The literal source contradiction remains archived: `AE386` permits cards, while `AK386` prohibits them. The user decision supersedes that prohibition. The scoped legacy reference also explicitly supports cards and bank payments, default Bank and locked Monthly billing. The policy is typed and selectable choices are evaluated independently of processor execution. A live credit-card processor remains later integration work.

## Standard CSEA evidence correction

Standard CSEA is present in MCR: `URLs!A64:B64` names CSEA and its standard URL separately from CSEAGI at row 63. `Attestation Online and PDF!A69/C69/E69` documents membership, active duties, clerical status, spouse Accident Disability amounts $500/$1,000 and child ER benefit. `New UX Single-Page Requirements!A27/D27/AA27` and `Read & Sign!B122/C122` document the disability Site and payroll authorization. `Associations!A60/C60/D60` provides its association/admin identity.

Main row 246 closely matches these standard dependent benefits, unlike row 247's N/A dependent entries, but both rows are labeled CSEA GI. Row 246 is therefore a possible mislabeled standard/shared product row requiring variant reconciliation, rather than proof that standard CSEA is absent. Preserve its literal label and candidate status; do not automatically adopt GI-only policy. CSEAGI, CSEACAP and California CSEA/CALSEA remain separate, outside this initial standard-Site mapping. The evidence is preserved in the generated identity review under `sourceDiscoveries`.

## Required migration queue

The exact MCR evidence for every linked assignment is retained in [active-site-identity-review.json](active-site-identity-review.json); the scoped legacy evidence remains in [legacy-platform-review-register.json](legacy-platform-review-register.json). The following work is mandatory where applicable to the active Site. Each item needs source adoption, an executable target, boundary/transition checks and a persisted revision check before activation.

| Site | Coverage and rule work | Definition or conflict that needs resolution |
| --- | --- | --- |
| ABE | Main 39–49 amounts, dependent eligibility, aggregate/income caps, LTD/LTD Plus exclusions, waiting periods, HI rider synchronization, payment/rating rules and financial/health questions | Product plans include `601-a`, `601-b` and `401`; generic prototype plans do not suffice. Resolve contradictory legacy Bill Me/Monthly defaults using MCR evidence. Income tiers/rounding need executable aggregation. |
| AMA | Main 117–126 applicant classes, amounts, family/dependent calculations, payment requirements, product-specific fees/credits/modal factors and health rules | Level-rated DI maps to row 119. Step-rated DI in row 118 is absent from the enabled prototype and must enter portfolio review. Row 121 plan is `103`, not prototype `115`. Term and Preferred identities differ despite shared category. Resolve the Term member-credit prose before adoption; do not reuse the generic $45 fee or $12 child price. |
| ASCE | Main 165–169 amounts, dependencies, aggregate/income caps, periods, CIR-only application mode, residency and question participation | Preserve the six exact approved age/underwriting targets. The CIR-only zero-base mode needs its own selection/validation contract; positive-base validation cannot stand in for it. |
| AVMA | Main 187–198 family/dependent availability, BPP/LTD prerequisites, Student Loan disability, FPO limits, income/age caps, coupled periods, CIR-only behavior, payment and rates | `di-ltd-plus` is the Student Loan product at row 193; `li-term` is BPP at row 197. These generic keys cannot imply generic product semantics. Preserve primary/dummy submission identities separately. Student/graduate/GI Sites are outside scope. |
| CSEA | Standard legacy clerical-answer amount choices, eligibility/residency, automatic AD&D, dependent riders and health rules | The user confirmed **standard CSEA**. Standard evidence is present across the workbook. Main 246 is a candidate because its dependent behavior matches standard attestation row 69 despite its GI label; row 247 is excluded. Reconcile that label and product identity before adopting its Main policy; the prototype's single FUW LTD product is not complete parity. |
| NSO | Main 318–323 amounts, fixed child amounts for 10/20-year life, dependencies, family AD&D semantics, QD/health rules, payment and unavailable-rate behavior | MCR identities differ from generic prototype plans; establish fixed dependent values from exact source cells, not inherited ranges. Do not copy duplicate tax rows. |
| ISITRUST | Main 278–287 association-specific availability, maximums, identifiers, dependent rules, DI/FPO limits, question/CIR skips, payment and authorized rate arithmetic | Graded Benefit life maps to row 287 despite prototype key `li-50plus`. Row 286 says Stage 2 requirements are incomplete. Association context must participate in evaluation. Monthly options and Quarterly copy need reconciliation. |
| WAEPA | Main 379/380 amounts, spouse/child calculations and caps, membership effects, CIR/ABI bounds and application modes, health participation, payment and dependent rating | Standard and GI remain separate. Current-policyholder CIR-only and payment skips need explicit facts and cleanup. Preserve the current no-LexisNexis TPA policy. |
| WAEPAGI | Main 386 fixed offer, member eligibility/military exclusions, membership certification, question participation, required Monthly payment and real rate results | $100,000 member-only life offer and Bank/Card Monthly payment are adopted in the review candidate. Inherited disability and riders are disabled. The user decision resolves conflicting card evidence. No other GI campaign is substituted. |

## Definition and execution sequence

1. Extend the smallest typed contracts needed for applicant classes, conditional availability, derivations/lookup tables, aggregates and existing-versus-new coverage. Define precedence, missing facts and cleanup so changing an input cannot retain an invalid dependent amount or selection.
2. Define Site/product payment policies and authoritative rate result inputs/breakdowns. Separate billing frequency from display frequency. Represent absent premiums as unavailable; apply sourced fees, credits, taxes and modal factors without double-counting service totals.
3. Adopt scoped values and execute confirmed slices through the normalized candidate, including health/rider/exceptional-flow rules. Reconcile portfolios without enabling unrelated campaign Sites. Require exact provenance and meaningful boundary/transition tests.
4. Complete all acceptance domains before the later shared-Library runtime cutover, visual form builder, publication controls and admin username/TOTP work. Those later stages have not begun.

The identity/applicability pass is complete as an inventory; unresolved policy remains visible. Step 3 itself is not complete. Regenerate and check this stage's crosswalk with `npm run migration:adoption-review` and `npm run migration:adoption-review -- --check`. The existing scope audit remains the compatibility baseline and does not advertise this reviewed slice as complete Site parity.

## Validation for this increment

The migration suite passed 326 tests before the additional persisted-revision test; all seven Step 3 tests then passed, including that storage-to-shared-revision check. TypeScript, lint, deterministic scope/adoption artifact checks and whitespace validation passed. The full suite passed 760 tests with two PostgreSQL tests skipped and the same pre-existing standards-inventory failure in `libraryInspection.test.ts` (four `TS-SP-*` entries absent from its expected list). No database deployment was performed; the reviewed rows use existing schema and pass export integrity checks. Full Site parity remains pending.

Latest clarification validation: the reviewed candidate has 68 enabled assignments (the baseline remains 69); WAEPAGI contains one member-only life product. Tests cover CSEA cross-sheet evidence, GI portfolio/rider isolation, permitted/prohibited payment choices, serialized revision reads and repeatable adoption.

Clarification checks passed: 329 migration tests (two PostgreSQL tests skipped), the updated nine-test adoption suite, TypeScript and lint. The full suite was not rerun for this clarification; its previously recorded standards-inventory failure remains separate.

## NSO life amounts and payment

Main rows 318/319/322/323 replace the generic prototype life amounts and identifiers in the reviewed candidate:

| Product | Member and spouse range | Increment | Age constraints recorded | Child coverage |
| --- | --- | --- | --- | --- |
| Term Life | $25,000–$500,000 | $25,000 | 17–64 | Unavailable |
| Senior Term Life | $10,000–$100,000 | $10,000 | 50–74 | Unavailable |
| 10-Year Life | $50,000–$200,000 | $50,000 | 17–59 | Fixed $5,000 |
| 20-Year Life | $50,000–$200,000 | $50,000 | 17–54 | Fixed $5,000 |

Child age constraints are 15 days through age 18, extended through 25 for full-time students, from Q322/Q323. Their execution/certification remains separate from the numeric amount evaluator. No additional marital restriction is invented. The four Site-scoped G-number/plan pairs come from E/G cells, including Senior plan 153 and Term plan 101. Literal source cells and canonical targets retain NSO-only promotion.

`validateNormalizedCoverageAmount()` checks the captured Library ranges, increments and fixed values, preferring specific applicant/class rules and refusing unresolved or unsupported derived/nonnumeric patterns. It has no prototype price/amount fallback. This checks the amount dimension, not full application eligibility. `validateNormalizedLifeAggregate()` enforces the $800,000 per-person life limit from the H/I cells, including an explicitly supplied existing life amount; missing portfolio information yields needs-information rather than zero existing coverage. Caller context is one person, so separate children must be evaluated separately. Dependencies, maximum-plan rules and health underwriting remain their own gates.

Payment is required and synchronized. Bill Me allows Quarterly, Semiannual and Annual; Bank Account additionally allows Monthly, from AG318/319/322/323. The old Bill Me/Monthly defaults contradict both those MCR choices and the legacy option lists. Preserve the supported Bill Me method and clear the invalid frequency to require selection, instead of inventing a replacement default. The typed payment contract permits an unset frequency for unlocked policies; locked WAEPAGI remains Monthly. `reconcilePaymentSelection()` preserves a valid frequency and clears an invalid one when the method changes. Source AH318/AI318 requests confirmation of the Direct Bill fee, so no fee is adopted or fabricated.

DI income/age rules, AD&D family coverage, dependencies/riders, question sets, residency and authoritative premiums remain pending NSO work. DI points to Disability!D35/F35 and includes ambiguous corrected age text in O321; these are not silently folded into the four life plans. Montana rating inputs are retained as evidence, not a base-premium table. Other Sites and the NSO DI/AD&D configuration are unchanged by this increment. The live prototype remains on its existing data pending the later cutover.

NSO increment validation: 340 migration tests passed, with two PostgreSQL tests skipped. The 11 NSO tests cover amount boundaries/increments, fixed dependent benefits, aggregate boundaries and missing existing coverage, unsupported conditional rules, payment choice cleanup, source drift, Site isolation, repeatable compilation and shared revision reads. TypeScript, lint, generated adoption drift checks and whitespace checks passed.

## October 2 increment: active numeric dimensions, scalar identities and GI military eligibility

Step 3 remains **incomplete**. The reviewed compiler now additionally adopts numeric choices/applicant presence for 21 products across ABE, AMA, ASCE and AVMA (57 applicant-specific amount assignments), plus 78 exact scalar Site identifiers. The generated crosswalk retains the exact adopted patterns, bands, list options, applicant assignments, identifiers, age constraints and GI additional eligibility configuration. These records are reviewed dimensions, not certification of their products' entire policy.

The amount slice covers ABE's four life products, AD&D, Critical Illness and Hospital Money; AMA's four term lengths/types and Preferred Life; ASCE's 10/20-year Life and AD&D; AVMA's 10/20-year Life, 45+ Life, AD&D, Critical Illness and Hospital Indemnity. It replaces inherited amount choices with source-backed ranges, increments, fixed benefits or exact lists. In particular AMA child life is $25,000, ASCE child benefits in this slice are $10,000, and AVMA child 10/20-year choices are $5,000 or $10,000. Amount validation remains a numeric-dimension check; it must not be treated as acceptance of outstanding dependent caps, existing-coverage requirements, applicant classes or eligibility.

Scalar identities preserve literal G-number/plan strings, including AMA 15-year plan `103`, Term `101-a`, Preferred `101-b`, and ISI Graded Benefit plan `101`. Multiline dummy/XML/PDF/class/association identities remain pending role mapping; the compiler does not pick the first code. Simple unqualified inclusive entry-age cells are adopted for ABE, AMA, ASCE, AVMA and ISI. Exact ASCE approval targets take precedence. Contradictory ages, day/month age calculations and conditional extensions are deliberately outside this parser. Separately retained prototype work/student/marital constraints are identified as such in combined provenance; this increment does not recertify them from an age cell.

WAEPAGI's age range 18–39 and active-military exclusion now execute against persisted normalized rows. A typed Site configuration requires the explicit `activeMilitary` fact to equal `false`; a missing or malformed fact cannot establish eligibility. The GI underwriting resolver accepts the same applicant facts. It requires adopted GI evidence, so the compatibility fixture is not evaluated as migrated GI data. Membership certification, residency, health/question participation and rates remain separate acceptance work.

### Actual PostgreSQL candidate verification

`npm run migration:postgres -- --reviewed` now exports **createReviewedMigrationDatabase()**, rather than testing only the compatibility fixture. It applies the seven migrations to an isolated disposable database, seeds twice, checks exact canonical readback, resolves all ten Sites through the PostgreSQL snapshot, and checks amount boundaries and GI military/missing-fact behavior directly from that snapshot. The run also validates constraints, snapshot request rejection, RLS and concurrent snapshot consistency. It does not install or activate data in the live prototype or a hosted database.

The [recorded PostgreSQL result](step3-postgres-validation.json) confirms PostgreSQL 16.15, two identical seed applications, both readback tests passing, twelve invalid writes rejected, five invalid snapshot requests rejected, RLS on 101 Library tables and a passing concurrent snapshot check. The default `migration:postgres` command still checks the compatibility baseline.

Validation: **353 migration tests passed**; the two PostgreSQL tests are skipped by the ordinary unit command and both pass in the separate real-database command. TypeScript, lint, generated adoption drift checks and whitespace checks pass. The final full suite passed 787 tests with only the previously documented `libraryInspection.test.ts` standards-inventory expectation failure (it still omits four existing `TS-SP-*` standards); the PostgreSQL tests were skipped in that unit run and executed separately. No Step 4–6 implementation or live data switch was performed.

### Remaining completion work

The generated report explicitly records `step3Complete: false`. CSEA Main 246's GI label, NSO DI's 64/59 entry-age text, AVMA 20-year's 69/59 age text, AMA Preferred child-age conflicts, ISI Critical Illness's incomplete Stage 2 requirements and missing authoritative base premiums remain source gaps. The subsequent user authorization below supplies provisional working choices and defers reconciliation of those gaps.

Engineering work also remains: full conditional applicant/class/association availability; dependent and existing-coverage derivations and caps; income/aggregate limits and exclusions; coupled waiting/benefit periods; rider-only selection and cleanup; health/financial/tobacco/attestation execution; applicable residency; complete payment/skip and rate arithmetic. Numeric adoption, scalar identifiers, an age check or a successful PostgreSQL round trip cannot substitute for these per-product acceptance gates. Deferred source conflicts are recorded for revisit and no longer require answers before implementation continues.

## October 2 source-gap deferral

The user's subsequent instruction authorizes provisional working values and documentation of every item requiring revisit. [The provisional decision register](step3-provisional-decisions.md) supersedes the source-confirmation blockers listed above for this migration candidate: CSEA uses row 246 provisionally; NSO DI and AVMA 20-year maximum entry ages use 59; AMA Preferred child ages use 14 days through 26 without FTS; NSO Direct Bill fees and AMA Term member credits use zero; ISI Critical Illness keeps provisional candidate terms; missing base premiums return an unavailable rate with price display suppressed.

Each choice is applied in the reviewed candidate and persisted with authority, selected values, exact destinations and a revisit marker. The source contradictions remain visible as deferred reconciliation, not source-confirmed policy. They no longer require another confirmation before implementation can continue. Remaining engineering and per-Site acceptance work is still outstanding; this change does not by itself complete Step 3 or activate the candidate.

## Continued benefit and dependent implementation

The [benefit/dependent adoption record](step3-benefit-dependent-adoption.md) supersedes the earlier pending statements for its specific dimensions. The candidate now executes benefit policies for 16 disability/overhead products, dependent policies for 24 Site/product assignments, and explicit life aggregate groups for five Sites. It adds income/age/class/expense/loan caps, existing-coverage calculations, period coupling, dependent derivations and cleanup. Source ambiguities found during implementation follow the existing provisional-decision authorization. Remaining health/rider/eligibility/residency/payment and special-mode acceptance work is still required before Step 3 completion.
