# Step 3 provisional source decisions

On October 2, 2026 the user authorized deferring the outstanding source gaps: “these can all be ignored for now (take whatever value if a value is needed and note in docs it needs to be revisited).” This instruction supersedes the earlier requirement to obtain confirmation of these values before continuing the migration candidate. It does not establish which conflicting source value is correct. All choices below are provisional and must be revisited when authoritative evidence is available.

| Issue | Working choice | Evidence / revisit |
| --- | --- | --- |
| Standard CSEA identity | Use Main row 246 for `csea-default.di-ltd`, G-number `G-11628-0`, plan `601`; member ages 17–65. | Main B246 remains literally `CSEA GI`. Revisit the standard/GI distinction and full dependent/included-benefit representation. No campaign Site is created. |
| NSO disability age | Ages 17–59 inclusive. Work requirement 20 hours/week from R321. | O321 contains both 64 and 59. Revisit maximum entry age; numeric DI, income, periods and health migration remain separate work. |
| AVMA 20-year entry age | Member and spouse ages 17–59 inclusive. | O189/P189 contain both 69 and 59. Revisit the final approved age range. |
| AMA Preferred child age | Minimum 14 days, through age 26 inclusive, with no full-time student requirement. | Prefer Q124 provisionally over J124's six-month/18-year/student wording. Existing unrelated eligibility constraints remain separate; revisit both cells. |
| NSO Direct Bill fee | $0. | AH318/AI318 require fee confirmation. Zero is a working assumption, not a source-confirmed fee. Revisit fee amount and frequency/basis. |
| AMA Term member credit | $0. | Ambiguous credit prose is deferred. No credit from another product is substituted. Revisit amount, membership eligibility and calculation basis. |
| ISI Critical Illness Stage 2 | Keep the existing enabled product. Member/spouse $5,000–$100,000 in $5,000 increments; ages 18–64; no child assignment. Preserve other existing candidate terms provisionally. | Main D286 marks Stage 2 incomplete. Revisit underwriting, association context, spouse caps, questions and other missing requirements. |
| Missing/unverified base premiums | Explicit **rates unavailable**, with `amount: null` and price display suppressed for business Sites in the migration candidate. | Preserve rate source material. Revisit base premiums, input dimensions, service/calculation behavior and applicable pricing adjustments. No zero premium or generic prototype estimate is displayed as an authoritative price. Demo remains a synthetic fixture. |

`applyProvisionalSourceDecisions()` changes the reviewed compiler only, after its existing adopted slices. It persists an individual `provisional-source-decision` record with the user authority, selected values, source references, exact destinations and a `revisit: true` marker. Adopted defaults use this document as provenance. Literal source cells and their extraction classifications remain unchanged; source reconciliation is recorded as deferred.

CSEA's candidate identity review recognizes the provisional decision and exact selected identifiers; the original compatibility-baseline identity review continues to show its historical ambiguous label. The generated report separates deferred source conflicts from outstanding implementation. It does not mark Step 3 complete simply because source decisions have been deferred.

`resolveEffectiveSite()` exposes the Site's provisional decision records from the same captured revision as its coverage data. `resolveNormalizedRate()` consumes the persisted rate outcome and returns no displayable price while authoritative base premiums are unavailable. Fee/credit assumptions are persisted as separate rating adjustments; they do not supply a base premium and do not currently turn an unavailable rate into a quoted price.

The live prototype is not switched by these decisions. Step 3's outstanding rule implementation and acceptance checks continue. The visual Builder, publication, authentication and runtime activation remain later stages.

## Additional working choices during benefit/dependent implementation

The same authorization applies to gaps encountered while continuing Step 3. These choices are stored with the executable policies and separate revisit records:

| Issue | Working choice / revisit |
| --- | --- |
| ABE D17 precision and currency | Use calculation rows' `.6666`; preserve individual `<=7500` and aggregate `<7500` separately. Main44–46 still reference D17 although older Disability rows21/23 were marked removed. Revisit source currency, fractional precision and the differing threshold boundaries. |
| AMA Office Overhead increment | Use MainH125's $1,000 rather than Overhead Expense C2's $100. Revisit approved increment. |
| AVMA LTD new-applicant minimum | Use $1,000 from D29 and MainH192's new-applicant note, rather than its general $500 figure. Existing-policy increases need a separate mode. |
| ISI LTD income basis | Use 70% of average monthly earnings from the explicit E69 formula; MainH279/E69 prose also says annual income. Revisit basis and issued-benefit calculation. |
| WAEPA STD entry versus continuation ages | Apply MainO380's entry ages 18–64; D58 describes benefits through 69. Revisit existing-policy increase/continuation mode. |
| ISI family AD&D child with spouse | Use 10% of member benefit provisionally. Its spouse 50%/40% and child-only15% are explicit; the 10% branch is missing in Main282. |
| NSO family AD&D percentages | Use spouse 50% without child /40% with child; child 15% without spouse /10% with spouse. Main320 establishes family coverage without the percentage schedule. All four percentages are provisional and need the NSO coverage-detail schedule. |

See [the benefit/dependent adoption record](archive/step3-benefit-dependent-adoption.md) for executable scope, inputs and outstanding acceptance work.

Validation: 358 migration tests passed (two PostgreSQL tests skipped in that ordinary unit command); both PostgreSQL tests passed separately against the reviewed candidate, including exact row readback and all ten Site snapshots. The domain/repository suite passed 57 tests. After fixing deterministic ordering of decision records, the affected domain/provisional suite passed 47 tests and the PostgreSQL gate passed again. TypeScript, lint and generated-report drift checks passed. The [PostgreSQL result](step3-postgres-validation.json) also confirms repeatable seeding, constraint rejection, RLS and concurrent snapshot consistency. The full application suite was not rerun for this increment; its previously documented standards-inventory expectation failure remains separate.

### Residency working choices (October 2 continuation)

- CSEA Main M246 explicitly permits NY/NJ/VT/PA/CT while N246 repeats these states as exclusions. Use M246's allowlist provisionally; revisit both the contradiction and standard/GI label.
- WAEPA uses pinned current filing exclusions, without anticipating approvals. Use country-qualified jurisdictions, US-only base availability, and the literal US territory exclusions for disability. Treat military exclusion as applying to the evaluated applicant provisionally; revisit dependent applicability and foreign/military address handling with the authoritative filing schedule. CIR is a separate unresolved rider rule.
- These choices are persisted as `provisional-source-decision` records targeting each reviewed residency configuration value; all have `revisit: true` and pending runtime activation.

### Selection, occupation and rider continuation (October 2)

The existing authorization now also covers persisted selection contracts for the
active portfolio. These are candidate working rules; full Step 3 acceptance is
still pending.

- Increases use **resulting total coverage**, which must exceed the supplied
  existing amount. Existing-policy modes require a verified-policy fact. There
  is no policy-verification service yet; supplying that fact is an input to the
  candidate engine, not evidence that a real policy was verified.
- WAEPA Standard life supports an explicit member/spouse **rider-only** mode,
  with zero new base life coverage and rider eligibility based on existing life
  coverage. Beneficiary is skipped, health remains required, and existing-policy
  payment collection is skipped. No extra Site is created. ASCE/AVMA rider-only
  experiences remain unimplemented; their legacy workarounds remain evidence.
- WAEPA's missing child attachment is replaced provisionally by $1,000 for
  ages 0–182 days and $10,000 for 183–9,496 days, capped at 50% of member life
  coverage. This is an engineering placeholder, **not the authoritative WAEPA
  schedule**. Spouse-linked schedules and individual child anniversary semantics
  still need implementation when replacing this placeholder.
- WAEPA CIR uses $50,000 minimum underlying life, ages through 64, and the
  listed jurisdiction exclusions. ABI uses $100,000 minimum, $1,750,000 maximum,
  ages through 49. Main L379 and Riders C20/G20/C40/F40/G40/H40 provide those
  dimensions; the CIR filing-approval caveat remains deferred.
- CSEA office-work yes/no maps to `clerical`/`non-clerical`. Both classes use
  $1,100–$3,400 in $100 increments, 180-day waiting and two/five-year benefits
  provisionally, borrowing Disability D45/F45/G45 pending program identity
  reconciliation. A 60% monthly income cap less existing disability is an
  explicit working assumption. Class-specific differences remain for revisit.
- CSEA R25 provides an included $5,000 AD&D election and upgrade choices
  $10,000/$30,000/$50,000/$100,000 from Riders C29. The candidate replaces the
  product rider set with R25; its pricing remains unavailable. Optional spouse
  accident and child outpatient benefits and their preselected elections are
  still open. No CSEA reference-table asset was invented.
- Other rider assignments retain their existing candidate definitions. Missing
  caps, dependencies and incompatibilities use explicit empty working lists,
  with revisit records. The engine supports dependency chains, incompatibility
  cleanup, fixed/multiplier caps, and choice preservation; this does not certify
  every product's default list against current product documents.

Every business-product selection policy has a persisted provisional decision
with exact configuration destination and `revisit: true`. Demo selection policies
are synthetic regression definitions and do not create business approval records.

### Journey continuation (October 5)

The [journey adoption record](archive/step3-journey-adoption.md) documents subsequent working values and executable slices. It supersedes the historical statements above that there is no mock policy service, ASCE/AVMA rider-only contracts are unimplemented, spouse-linked individual child schedules are absent, and CSEA dependent elections remain unimplemented. The live prototype remains unchanged.

The user explicitly answered **“continue with reference table”** for CSEA. The candidate now stores a provisional HTML benefit reference with rates unavailable, rather than waiting for an insurer asset. It does not invent premium amounts. The authoritative table remains a source revisit item. Product journey decisions continue to record exact destinations and provisional status; completing these slices does not close the full Step 3 exception matrix.

### ABE eligibility supersession — October 21, 2026

The Site-by-Site review explicitly replaces the captured provisional 18–64 adult limits for ABE 10-/20-year Life with the later effective workbook limits, respectively 17–69 and 17–59, for both member and spouse. Life child ages become 14 completed days through age 26; AD&D child ages become birth through 26. Hospital Money retains its ordinary upper age 25 and adds the approved honorable-discharge extension through 29, with a distinct per-child fact. Age 30 is outside the extension.

The user clarified that unmarried-child eligibility is communicated by the existing child-section note, **not a new unmarried answer**. The user also explicitly retained the DI spouse 30-hour minimum. These decisions are recorded by `business-decision.rules-review.abe-eligibility-ages` in [the ABE adoption](../src/migration/abeEligibilityAdoption.ts) and verified in [the ABE tests](../src/migration/abeEligibilityAdoption.test.ts). They supersede only those precise facets; the existing D17 precision/threshold, mock-rate, residency, rider and processing decisions retain their separate dispositions. Further prototype changes require checking with the user first.

### ABE processing and Read and Sign clarification — October 21, 2026

The user subsequently confirmed that limits and amounts must come from **Master Client Requirements_09_28_2026_v78 (1)**, with otherwise eligible requests outside QD limits routed to FUW. The named workbook's SHA-256 matches the captured v78 source; 38 processing and attestation cells were also compared directly with the workbook XML without differences.

[The processing adoption](../src/migration/abeProcessingAdoption.ts) supersedes the six provisional Life/DI processing defaults using QD LI rows 6–8 and QD DI rows 2–4. General coverage amounts, approved entry ages and applicant availability retain their Main/approved owners. The QD age/amount bands and literal state exclusions govern processing. Ten-/20-year QD also use the $500,000 per-person Life aggregate and member/spouse guards. Children retain their explicit non-underwritten override. QD retains the external loading page; FUW uses the appropriate Life or Disability health page. Missing Profile facts do not block Coverage prematurely, but are required for final validation.

The CI attestation from Read & Sign B116 is appended **inside the existing Read and Sign content**, at 14pt, with no separate section, answer or checkbox. The accepted dividend policy is otherwise byte-for-byte unchanged. Other source collection conflicts, insurer services, rate classes, rider/residency assumptions and detailed-output deferrals remain separate review items. This clarification does not certify that the remaining ABE review is complete or that only three questions exist.
