# Step 3 benefit and dependent rule adoption

This increment adds executable benefit policies for **16 disability/overhead products**, dependent policies for **24 Site/product assignments**, and explicit per-person life aggregate groups for **five Sites**. It uses the reviewed migration candidate and the same captured Library revision used by inspection. The live prototype remains on its existing data. Step 3 is still in progress.

## Benefit policies

| Site | Products | Executable dimensions |
| --- | --- | --- |
| ABE | LTD, LTD Plus, Mid-Term DI | $100 increments; individual and aggregate income formulas; explicit existing/other DI totals; spouse cap of nine times requested member benefit; spouse total no greater than member total; LTD/LTD Plus mutual exclusion; retirement benefit $1,000–$3,500 without income; applicant-specific waiting periods. |
| ABE | Office Overhead | $500–$10,000 in $100 increments, capped by eligible expenses times the applicant's responsible fraction; 30-day wait, 12-month benefit. |
| AMA | Level-Rated DI | Practicing/resident class selection; practicing age bands, 66 2/3% income limit less existing DI; resident $5,000 limit through 39 with no financial income requirement; $15,000 aggregate less existing coverage; 60/90/180/365-day waits; to-age67 benefit. |
| AMA | Office Overhead | $1,000–$20,000 in provisional $1,000 increments; 30/60/90-day waits; 6/12/24/36-month benefits. |
| ASCE | LTD | Member $150 increments, $8,550/$4,200 age caps and 60% income; first-year self-employed cap $1,050 with mandatory 90-day wait and five-year benefit; ordinary five-year/career choices; spouse fixed $500, 30-day wait/two-year benefit and required member coverage. The six previously approved ASCE age/underwriting targets are preserved. |
| AVMA | LTD | New-applicant $1,000 minimum; $12,500/$9,000/$6,000/$3,000 age caps and 60% income; member waiting choices; spouse fixed $500 with member coverage, 30-day wait/two-year benefit. |
| AVMA | Student Loan DI (`di-ltd-plus`) | $200–$2,000 in $100 increments, capped at required loan payment rounded up to the next $100; no income formula or ordinary DI aggregation; fixed 90-day wait and five/ten-year benefits. |
| AVMA | STD | $200 minimum; $5,000/$3,000/$1,500 age caps and 70% income; day1-accident/day8-sickness or 30-day waits; six-month benefit. Stored accident/sickness delays are zero/seven elapsed days for the former option. |
| AVMA | Office Overhead | $300 minimum; $45,000/$30,000/$10,000 age caps; eligible-expense formula; 15-day wait pairs with 12 months, 30 days with 24 months. |
| ISITRUST | LTD | $500 increments, $12,000/$10,000 age caps, provisional 70% monthly earnings formula; 60/90/180-day waits; two/five-year/to-age65 benefits. Association membership remains a separate eligibility gate. |
| ISITRUST | Office Overhead | $500 increments, $20,000/$10,000 age caps; 15/30-day waits. No selectable duration is invented where MainH280 supplies none. |
| ISITRUST | STD | Age-only $3,700/$1,300 caps in $100 increments; zero-day accident/seven-day sickness wait; 26-week benefit. |
| NSO | LTD | $500–$5,000 in $100 increments; 60% monthly earnings cap; provisional entry age 17–59; 30/60/90-day waits; two/five-year benefits. |
| WAEPA Standard | STD | $100–$6,500 in $100 increments; 60% earnings cap; Main entry ages 18–64; 14/30-day waits. Membership, work and application-role facts remain separate eligibility gates. |

`resolveNormalizedBenefit()` validates the persisted versioned contract before evaluating it. Missing income, existing coverage, age/class, employment, loan or expense facts produce `needs-information`, rather than invented zero inputs. A mathematical cap is rounded down to a selectable increment. Loan-payment rounding is the explicit exception: the required payment rounds up to the next $100 before the policy cap applies. Existing DI is not subtracted unless the applicable policy or aggregate requires it.

For aggregate inputs, `existingMonthlyBenefit` supplies existing/in-force DI included in the applicable group; `otherMonthlyBenefits` supplies complete totals for other grouped products, excluding the currently evaluated product. ABE retirement benefits are outside its ordinary aggregate. AMA's existing DI input includes its other in-force disability coverage, including plans outside the current enabled portfolio. An explicit empty map/zero value is a completed answer; an omitted field is unknown.

`reconcileBenefitSelection()` clears invalid or incomplete amounts/periods after facts change. Fixed amounts and single available waiting/benefit choices lock automatically. The ASCE self-employed restriction releases at one year; an employee is represented by `selfEmployed: false`, rather than an invented employment duration.

## Dependent rules and life aggregates

Dependent policies execute applicable member-coverage prerequisites, member/spouse/child caps and one-life-plan restrictions. They distinguish a member applying now from a member already insured. AVMA's child-only life request may rely on either member or spouse coverage under the requested plan. Context arrays refer to that product and that one dependent person; multiple children must be evaluated separately.

AMA hospital spouse/child benefits mirror the physician amount and are locked included benefits. AMA Premier Accident uses spouse 50% with no child /40% with child, and child 15% with no spouse /10% with spouse. Family changes and changes to the member amount recalculate dependent benefits. ISI AD&D and NSO family AD&D also use explicit included-benefit roles; their missing percentages are provisional as recorded below. Numeric base choices and derived-only dependent choices are persisted separately from independent applicant elections.

ISI sources explicitly label certain spouse caps “message only.” Those produce notices while preserving source-supported choices; they do not become new blocking validations. WAEPA's dependent spouse limit of50% of member coverage is blocking. WAEPA's full child lookup schedule and existing-policyholder exception remain outstanding.

Life aggregates use explicit product groups and the supplied existing amount for that group/person:

| Site | Maximum | Included products |
| --- | --- | --- |
| ABE | $2,000,000 | Term, 10-Year, 20-Year, Senior Life. |
| AMA | $4,000,000 | Term, 10-Year, 15-Year, 20-Year, Preferred Life. |
| ASCE | $2,000,000 | Term, 10-Year, 20-Year Life. |
| AVMA | $2,000,000 | Group Term, 10-Year, 20-Year Life. 45+ and Basic Protection are explicitly excluded by H/I187–190, which take precedence over the general K190 label. |
| NSO | $800,000 | Term, Senior, 10-Year, 20-Year Life. |

AD&D/Premier Accident benefits are excluded from these insured-life groups. `validateNormalizedLifeAggregate()` uses the persisted groups when present and refuses malformed or ambiguous authored policies. The compatibility baseline retains its prior evaluator; absence of a candidate rule does not certify another product's aggregate behavior.

## Storage, provenance and outstanding work

The policies are typed configuration targets (`product-benefit-policy`, `product-dependent-policy`, `site-life-aggregate`) stored in existing normalized configuration tables. Each adopted dimension has literal source references, requirement targets and a semantic adoption record. The migration integrity check validates executable contracts and Site/product ownership. These targets use the same snapshot allowlist and do not need separate service reads or schema changes.

The [provisional register](../step3-provisional-decisions.md) records newly encountered precision, minimum, income-basis and family-percentage choices under the user's October 2 instruction. Their saved decisions include the authority, working policy, exact destination, deferred reconciliation and revisit marker. Literal source evidence is preserved.

These are benefit/dependent dimensions, not complete product or application approval. Outstanding Step 3 work includes CSEA's clerical/non-clerical benefit model and included riders; WAEPA/ASCE/AVMA rider-only and existing-policy modes; WAEPA child schedules; ISI association-specific choices and identifier roles; remaining applicant classes/eligibility/residency; rider caps/FPO/CAT/ABI/CIR and cleanup; health/financial/tobacco/attestation participation; complete payment/skip/rating rules and remaining exact submission mappings. The generated report retains `step3Complete: false`. Builder/publication/authentication/live cutover remain later steps.

Validation: **396 migration tests passed**; the two PostgreSQL tests are skipped by that ordinary unit command and both passed separately against the actual reviewed candidate. The domain/repository suite passed 57 tests. PostgreSQL verification includes exact canonical readback, all ten Site snapshots, ASCE employment/period cleanup, NSO income limits, AMA dependent recalculation and explicit life-group exclusions. Its [recorded result](step3-postgres-validation.json) also confirms repeatable seeding, twelve invalid writes rejected, five invalid snapshot requests rejected, RLS on 101 Library tables and concurrent snapshot consistency. TypeScript, lint, generated-report drift and whitespace checks passed. The full application suite was not rerun for this increment; its previously documented standards-inventory expectation failure remains separate.

## Client-specific aggregate inspection and residency continuation (October 2)

Library → Coverage now replaces the universal $2 million category display with a read-only view of the reviewed candidate. Effective scope follows the selected Site; global scope compares Sites. Life limits, included/excluded product groups, applicant scope, monthly disability aggregates, income conditions, retirement exclusions and source references all come from the same captured Library revision used by candidate validators. Missing policies show “Not yet migrated”; individual product maxima are not treated as aggregates. Malformed policies and transport failures show an error with no default value. The candidate is explicitly unpublished and isolated from live localStorage. Existing product/relationship tables remain prototype inspection until their corresponding migrations are complete.

Four residency dimensions are now executable via `product-residency-policy` configuration values and `resolveNormalizedResidency()`:

| Site/product | Working residency restrictions | Evidence |
| --- | --- | --- |
| CSEA disability | Only NY, NJ, VT, PA, CT allowed. Prefer the explicit Main M246 allowlist over the contradictory N246 exclusion list; provisional. | Main M246/N246 |
| WAEPA standard life | Exclude VI, DE, MT, NC, NY, OH, OR, LA and all Canadian provinces/territories. Active military excluded. | Main M379/N379 |
| WAEPA standard disability | Exclude all US territories, LA, NV, OR, NH, VT and all Canadian provinces/territories. Active military excluded. | Main M380/N380 |
| WAEPAGI life | Exclude VI, LA and all Canadian provinces/territories. Active military excluded. | Main M386/N386 |

Jurisdictions use country-qualified codes (`US-NY`, `CA-ON`). Missing residency/military facts cannot become defaults. Unknown codes, malformed contracts and duplicate policies remain unresolved. WAEPA filing approvals are provisional and require revisit; the working model supports US states/DC, territories and military postal jurisdictions, excludes unlisted foreign residence, and applies the military exclusion to the applicant being evaluated. Revisit dependent military applicability and foreign/address handling with the filing schedule before publication. Chronic Illness Rider approval/restrictions from N379 remain a separate outstanding rider domain; passing base-product residency does not certify rider availability.

The policies retain literal source cells, destination references and user-authorized deferred reconciliation records. Residency adoption validates all source evidence and enabled Site/product assignments before writing, and repeated adoption is idempotent. Other Sites' residency, CSEA occupation/benefits, rider participation, health and remaining billing/rate/submission rules remain outstanding. Step 3 is still incomplete and the live prototype remains unchanged.

Validation for this continuation: **402 migration tests passed** (the two PostgreSQL tests are skipped by the ordinary command), **60 aggregate UI/domain/repository tests passed**, and **both PostgreSQL tests passed separately** against real PostgreSQL with exact persisted readback and all ten Site snapshots. The PostgreSQL checks additionally exercise client-specific aggregate inspection and CSEA/WAEPA residency decisions. TypeScript, lint, generated-report drift and whitespace checks passed. The comprehensive PostgreSQL tests use an explicit 30-second integration timeout; one initial run exceeded the default five seconds while other suites were running. The successful rerun also passed the existing idempotent-seeding, invalid-write, RLS and concurrent-snapshot checks.

## Rate presentation clarification

The [major outstanding items register](step3-major-outstanding-items.md) supersedes the compressed outstanding-work list as the clarification checklist. It separates CIR-only selection from existing-policy changes and explains the information required for each remaining domain.

The reviewed candidate now stores a global PRASE default of No, a CSEA client setting of No, and Yes for the other active business clients under the October 2 user clarification. Quote-tool and Coverage-estimate choices are separate booleans; working defaults enable both for PRASE-capable clients and remain configurable. PRASE capability does not confirm an actual rate response. `resolveRatePresentation()` forces hero-image/no calculated rates whenever PRASE is off, even if quote toggles remain enabled. A configured reference PDF, image or structured HTML table replaces the rate area with a drawer link. Missing assets yield no link; invalid configuration hides pricing and remains unresolved. Client and Site settings use the same captured revision and existing scope precedence.

`ReferenceRateTableLink` uses the existing `AppDrawer`; HTML table cells render as escaped text, images have alt text, and PDFs have an embedded view plus an open-PDF link. Reference assets must use site asset paths or HTTPS URLs. The Library Coverage candidate view now exposes rate settings and can preview configured reference tables. No CSEA rate asset was invented, no base price was supplied, and the live applicant router remains on its original data. Applicant pricing-area integration, draft editing and real PRASE service validation remain later work.

Rate-presentation validation: **407 migration tests passed**, four drawer/Library UI tests passed, and both real PostgreSQL checks passed with client-scoped PRASE settings read from the captured snapshot. TypeScript, lint, generated-report drift and whitespace checks passed. The CSEA reference asset and real PRASE integration remain pending.
