# Coverage — global template and effective Site

The global template owns page structure, shared fields and components, reusable
rules, configuration definitions/defaults, content definitions and URL parameter
contracts. An **effective Site** combines that template with its assigned products,
values, content selections and overrides. The current migration is verified against
the ASCE effective Site; that rollout target does not make shared behavior ASCE-specific.

| Owner | Coverage examples |
|---|---|
| Global template | Amount ordering/default/lock definitions, `amt`/`dprods` contracts, product reveal, validation patterns, reusable eligibility/dependency/amount evaluators, and shared page/component/content definitions. |
| Effective Site | Enabled products, numeric amount/age/income bounds, jurisdictions, rider/applicant assignments, chosen content, TPA mode and configured exceptions. |

Global definitions live under `requirements/global/`; shared page/component mappings
remain reusable. `requirements/parked/sites/<site>/` supplies effective-site inputs.
The Library displays a global definition as global even when a Site filter is selected.
No shared capability is gated on the presence of ASCE policy assignments.

The product-policy inputs are fresh-start authored too: shared identities, policy
definitions/defaults and URL contracts are in `global/products.json`; effective-Site
assignments and policy values are in `parked/sites/<site>/products.json`. Existing
Life amounts, eligibility and residency/aggregate files remain authoritative for
their reviewed values. The compiler reconstructs the product graph without old
catalog records and preserves approved behavior. The aggregate note reads the
shared projection and formats the same configured Life maximum used by validation.

Rates are fictional prototype estimates; production rating accuracy is outside this review.

## Effective-site rule register: ASCE (CHG-031)

Sources are the supplied **MCR v78**, the Admin Center Library's **URL parameters**
table, and explicit user decisions in this ASCE review. User decisions take
precedence over conflicting MCR text. A recorded requirement is not a claim that
its runtime implementation is complete. The values below describe the current ASCE
effective Site, not universal template defaults or separate ASCE implementations.

| Area | Requirement / configuration | Source / current state |
|---|---|---|
| Products | Offer Term Life, 10-Year Level Term, 20-Year Level Term, High-Limit AD&D and Disability Income. Enable products per site, with their own plan codes, G-numbers, brochures and applicant participation. | Main!D165:G169; current ASCE product assignments. |
| Categories and questions | Offer eligible Life, AD&D and Disability categories. Ask category-specific questions only for participating people; tobacco follow-ups require Yes. Member self-employment-under-one-year is one Yes/No question in Work & Income. | Fresh Coverage layout/question map; approved review. |
| Product reveal | Validate applicable questions before revealing products. AD&D may reveal without preliminary questions. Next validates the resulting elections. | Confirmed `coverage-page-stages`. |
| Term Life | Adults ages 17–75; new minimum $20,000; $10,000 increments; maximum $1 million, reduced to $500,000 at ages 70–72 and $350,000 at 73–75. | Main!H167:I167, O167:P167; reviewed minimum/caps. |
| 10-Year Level Term | Adults ages 18–69; $100,000–shared Life maximum; $10,000 increments. Ages 65–69 use FUW. | Main!H165:I165; approved age/UW overrides supersede summary ages. |
| 20-Year Level Term | Adults ages 18–59; $100,000–shared Life maximum; $10,000 increments. Ages 55–59 use FUW. | Main!H166:I166; approved age/UW overrides. |
| Combined Life | One $2 million ceiling per person across the three Life products. Coverage Next checks the combined elections plus configured verified in-force Life. No duplicate aggregate error on Review. | Main!H165:K167; `parked/sites/asce/coverage-policies.json`; approved timing. |
| Child Life | $10,000 under one Life plan only. Ages 14 days–22, extended through 24 for a full-time student. Require member Life; spouse alone does not satisfy it. | Main!J165:J167, Q165:Q167; member dependency confirmed by user. Unmarried eligibility is a note, not a collected answer. |
| AD&D | Adult ages 17–69. Member $50,000–$500,000; spouse $50,000–$250,000, in $50,000 increments. Child $10,000, ages 15 days–24. Member coverage is required for dependent AD&D; retain its existing spouse/member amount constraint. | Main!H168:J168, O168:T168. |
| AD&D residency | Exclude FL, NC, VT and WA; apply the product's configured residency scope. | Main!N168. |
| Disability participation | Member ages 17–69, spouse 17–59; both work at least 30 hours/week. Member annual gross income minimum $20,000, derived from monthly income. | Main!O169:S169; Multi-page!AC21; reviewed values. |
| Disability amount | Member maximum is the lesser of 60% of average monthly income and the applicable cap: $8,550, or $4,200 at ages 65–69. $150 minimum/increments. Spouse benefit is fixed at $500/month. | Disability!D11:D12. Verified in-force benefits reduce remaining capacity. |
| Short self-employment | Less than one year: $1,050 cap, mandatory five-year benefit period and 90-day waiting period. | Disability!D11; approved single Yes/No question. |
| Disability periods | Member five-year or Career Plan; waiting periods 30/90/180/365 days. Spouse two years and 30 days. Fixed/mandatory options use configured controls. | Disability!D11:D12. Multi-page!AE21 describes the Career option as to-age-65; keep wording as source documentation, not a new prototype decision. |
| Disability residency | US states/DC except NC/VT/WA, Puerto Rico and Canada except Quebec; spouse also excludes NH. | Multi-page!AC21 and Main!N169; confirmed combined scope. |
| Joint spouse Disability | Keep spouse selectable. On Next, alert when both elect positive benefits and member benefit is below $600. | User exception to Multi-page!AD21. |
| Spouse Life guidance | Show “Spouse coverage can’t exceed member coverage” as a note only; do not add Life amount filtering or validation for that note. | Explicit user exception; MCR otherwise allows joint spouse Life to exceed member. |
| CIR participation | Optional rider on Term Life for member/spouse, ages 17–64; no child CIR. No CIR-only application in this prototype. | Main!L167; Riders!B43:H43; user removal of CIR-only supersedes MCR. |
| CIR amounts | Principal amount eligible for 50% acceleration: member $50,000–$1 million in $50,000 increments; spouse $25,000–$1 million in $25,000 increments. CIR cannot exceed applicable base Life. | Riders!C43:D43; current rider amount policies. Source includes in-force plus requested Life; current comparison to requested base does not settle the pending existing-policy treatment. |
| CIR residency | Additional exclusions: CT, ID, LA, MA, MN, MT, NC, OH, SD, UT and WA. | Riders!F43; separate from base-product residency. |
| Underwriting handoff | Preserve product/applicant age/amount processing bands and prior approved FUW exceptions. Coverage determines the handoff; underwriting, forms and medical integrations are later-page concerns. | Main, QD LI!J46:Q48; approved decision register and current underwriting policies. |
| TPA access | Existing member + active coverage + successful verification enables portfolio access. Failure/skip continues as manual review without the portfolio. | Confirmed `coverage-tpa-portfolio-access`; fictional fixtures, no live TPA. |
| In-force amounts | Deduct verified balances from each person's applicable product and shared Life capacity; preserve permitted increments. No positive remaining capacity gives no positive option. | Confirmed `coverage-tpa-inforce-amounts`; shared numeric portfolio fixture. |
| Amount controls | Configure amount-list direction, a specific initial amount instead of the current minimum, and whether a configured amount is locked. | Connected through global JSON bindings and the shared amount-control resolver. |
| Campaign amount controls | `amt` sets listed product amounts; `dprods` disables listed product amount dropdowns. Neither bypasses eligibility or limits. | Connected; campaign context persists through navigation and resume. |
| Product presentation | Configure category/product order; `featured_prod` prioritizes a product and its category. `category`, `prods` and `applicant` constrain participation as documented in the URL table. | Current Library URL table and product presentation readers. |
| Elections | Choosing a default amount is separate from Add coverage. Require an elected product, an applicant for each election and valid amounts/options. Stale selections use standard page validation. | Current Coverage submission behavior; `preselect` URL behavior remains TBD. |
| Estimates | Display fictional estimates, selected riders, totals and the configured frequency controls. Do not require real rate calculations or integrations for this prototype. | User-confirmed prototype scope. |
| Continue/save | Successful Next follows shared save-before-advance behavior. Membership submission has already established the saved application. | Shared form workflow; Membership lifecycle rules. |

## Global category and product ordering

These configurations belong to the template wherever categories or products are
displayed. They are not Coverage-page settings and are distinct from numeric
amount-dropdown ordering.

| Definition | Effective-site value | Shared fallback |
|---|---|---|
| `category-order` | Existing `coverages.categoryOrder`, an ordered category-code list | LI, AD, DI, OO, SH. Existing `coverages.categories` order remains a compatibility fallback when no explicit categoryOrder is assigned. |
| `product-order` | Existing `coverages.productOrder`, an ordered product-ID list within categories | The explicit registered-product sequence in global JSON; omitted overrides inherit that list. |

The definitions and defaults are in `global/configurations/product-presentation.json`.
The runtime ordering resolver reads both default lists; effective-site values keep
the existing paths. No ASCE-specific order is assigned. Defaults are not inferred
from product labels, so renaming/localizing a product does not reorder it.

The established category sequence is **Life, AD&D, Disability, Office Overhead,
Supplemental Health**. Within Life, Term Life and Group Term precede 10-, 15- and
20-Year Level Term, then the remaining Life products. Disability uses Long-Term,
Long-Term Plus, Mid-Term and Short-Term, then step/level-rated products. The full
registered-product sequence, including AD&D, Office Overhead and Supplemental
Health, is explicit in the JSON. Unlisted products follow the defaults in their
incoming order until a global default is assigned.

**Precedence:** a valid `featured_prod` moves its category first and its product
first within that category. The remaining categories/products retain effective-site
ordering, followed by shared fallbacks for omitted entries. An unknown or filtered-out
featured product changes neither availability nor order. It never overrides eligibility.

| Surface | Current shared reader / implementation |
|---|---|
| Home product/category content | `ConfiguredHomeCoverageSection` → `CoverageOptionsPanel`, using the shared resolver. |
| About Coverage page sections and drawers, including panels opened from the application menu | `ConfiguredCoverageOptionsPanel` → `CoverageOptionsPanel`; the panel applies both category and product order itself. |
| Quote tools | `QuoteCalculator` and `getActiveClientCoverages` use the shared resolver. |
| Coverage category selector and product lists | `useCoverageState` / `ProductCatalog`; the list applies both category and product order even when its caller supplies unsorted products. |
| Other product/category lists and selected-product summaries | The same global requirement applies. Later-page adoption is checked in those page reviews; current summary/decision helpers have independent sorting and are not marked migrated by this change. |

The rule `category-product-presentation-order` is mapped to Home, quote tools,
Coverage and the shared application-menu contexts. It is one global definition,
not copied page policies or effective-site-specific behavior.

## Global amount ordering and initial selection

These are global template settings. Effective Sites may supply values or overrides
at the appropriate site/product/applicant scope:

| Setting | Values / meaning | Current prototype |
|---|---|---|
| `coverage-amount-order` | `minimum-to-maximum` or `maximum-to-minimum` | Supported; inherited ascending default retained. |
| `coverage-amount-default-mode` | `minimum` or `specified` | Supported; minimum remains the inherited default. |
| `coverage-amount-default-value` | A numeric amount when mode is `specified` | No override assigned. The JSON zero placeholder is not a zero-coverage election. |
| `coverage-amount-locked` | Whether a configured fixed amount disables its dropdown | Supported; a valid fixed target is enforced on Coverage Next. |

The fresh definitions live in `global/configurations/coverage-amount-controls.json`;
the shared Coverage mapping exposes them in every Library scope as **Global template**
definitions, with their implementation status. Site values are separate assignments.
They do not introduce a second set of product minimums, maxima or increments.
Defaults must be among the eligible choices after policy and in-force reductions.
They must not silently select an unavailable benefit or elect coverage by themselves.
Global/effective-site settings use `coverages.amountSelection`; product/applicant
overrides use the existing Coverage assignment model. New site defaults remain
deferred; this rollout retains the established global defaults.

The shared amount resolver runs after eligibility, age/income and in-force filtering.
A valid `amt` takes precedence for each eligible product/applicant. Invalid or
ambiguous amounts cannot expand the choice list or lock an unavailable amount.
Editable saved choices are preserved; defaults seed only unanswered controls.
Locking enforces its valid amount, independently of the Add coverage election.

## Global URL parameter contract

URL parameter definitions belong to the global template. Effective Sites resolve
their G-numbers and eligible products using the same contract. Use the Library's
existing names and formats; do not invent Site-specific parameters.

| Parameter | Coverage behavior | Example / notes |
|---|---|---|
| `amt` | Presets amount dropdowns for the listed G-number products. | `amt=G-0000-0_200000,G-1111-1_300000`. Illustrative G-numbers; pairs are comma-separated and amounts contain no currency signs or thousands separators. |
| `dprods` | Disables the listed products' amount dropdowns. | `dprods=G-0000-0`; the table says to use with `prods` and `amt`. A default alone does not imply this lock. |
| `category` | Restricts available categories, including comma-separated categories. | `category=li,di`. |
| `prods` | Restricts products by G-number. | `prods=G-0000-0,G-1111-1`; requires `category`. |
| `featured_prod` | Featured chip; prioritize the listed product and its category. | `featured_prod=G-0000-0`. Presentation only. |
| `firstCategory` | Display the named category first wherever categories are presented. | Replaces legacy `ctg`; example `firstCategory=di`. Documented in the Library table; no current prototype reader. |
| `applicant` | Restricts supported applicants/dependent choices. | Existing values: `member` or `member,spouse`; does not establish dependency satisfaction. |
| `preselect` | Still TBD in the Library. | Do not treat it as approval to pre-elect every product/person. |
| `mrate`, `nc` | Removed; not supported in the new template. | Frequency controls are configured, and removed URL behavior is not reintroduced. |

Authoritative existing records are the Library `urlParameters` / `urlParameterValues`
entries, currently sourced from `src/content/docs/urlParameters.ts`. A parameter's
“Migrated” table status describes the documented contract; it does not prove a
prototype parser exists. A missing effective-site `siteUrlParameters` assignment
does not turn the contract into a Site-specific feature. Category/product/featured
readers exist, including `amt` and `dprods`. `firstCategory` remains a separate
cross-page rollout item. No external integration is introduced.

Product-only amount presets apply to each participating applicant only where that
amount is valid for the applicant. They do not force an adult amount onto a fixed
child benefit. Saved editable choices are retained; a locked amount is revalidated
and enforced against the currently permitted choices. Restoring an application
restores its own campaign context rather than reusing another application's link.

## Current effective-site review boundaries

- Existing-policy dependency satisfaction and lower existing Term Life minimums
  remain on hold. The MCR evidence is recorded; current runtime is not silently changed.
- CIR-only remains removed, and spouse Life amount guidance remains a note only.
- Amount ordering/default/locking and `amt`/`dprods` are connected for the reviewed
  Coverage stage. No additional site default values are chosen by this rollout.
- Real rates, TPA calls, email/XML transmission and insurer services are outside
  the prototype. No rate-accuracy review is pending.

## Agreed structure

Coverage is a required form page at `/coverage`, in Choose your coverage. Its JSON
component tree uses FormRoutePage, progress, header, page alerts, portfolio action,
CoverageQuestions, product reveal action, ProductCatalog with an inline CoverageCart,
and PageNav. Related surfaces are CoveragePortfolioDrawer, the dependent-only
confirmation dialog, and CoverageSelectionFeedback (cart drawer and Added snackbar).

| Area | ASCE participation |
|---|---|
| Existing coverage | Portfolio action/drawer only for a successfully verified existing member with active coverage in the configured TPA coverage-verification flow. |
| Categories | Eligible Life, AD&D and Disability choices, subject to application-link restrictions. |
| Your questions | Applicable personal and work/income questions. |
| Spouse questions | Applicable personal and work/income questions when spouse coverage is offered and selected. |
| Products | Eligible products, covered people, amounts and riders. |
| Estimates | Product estimates, combined estimate and cart summary. |
| Navigation | Shared submission validation, save-before-advance and Next. |

Children's details stay on Eligibility. Office Overhead, Supplemental Health and
Business Details are outside this ASCE review; their older template evidence is
retained without adopting it for ASCE.

## Agreed two-stage flow

1. Select categories and answer their applicable questions.
2. If preliminary questions are required, click See my coverage options. Validate
   on click and show a page error alert on failure. Success reveals products.
3. Categories with no preliminary questions (AD&D) may reveal products automatically.
4. Select products, covered people, amounts and riders; review the estimates.
5. Click Next for the shared submission validation and save-before-advance behavior.

Next is hidden during product loading and while the reveal action is displayed.
This is staged navigation. Membership attestation remains the sole field-answer
inline stopping exception.

`coverage-page-stages` is confirmed in `global/workflows/coverage.json` and assigned
only to Coverage in `mappings/requirements/coverage.json`. Shared quote/product
workflows retain their existing review status. The component tree is authored in
`parked/coverage.json`; React still renders the page.

## Coverage question inventory

The table follows current question policies and the existing shared field definitions.
Fields are required when they participate. Spouse questions also require a selected,
participating spouse. Product controls are reviewed after these preliminary questions.

| Question / field | Control | Person | Applicable selection / condition |
|---|---|---|---|
| Coverage categories (`coverage-categories`) | Checkbox group | Self | Category selector when more than one category is available. |
| Gender (`gender`) | Radio | Self, spouse | Life or Disability. |
| Tobacco use (`smoker`) | Yes/No radio | Self, spouse | Life. |
| Last Used (`tobacco-last-used`) | Date | Self, spouse | Life and that person's tobacco-use answer is Yes. |
| Product(s) Used (`tobacco-products`) | Multiple selection | Self, spouse | Life and that person's tobacco-use answer is Yes. |
| Hours worked per week (`hours-worked-per-week`) | Number | Self, spouse | Disability. |
| Average Monthly Income (`average-monthly-income`) | Currency text input | Self, spouse | Disability. |
| Are you self-employed for less than 1 year? (`self-employed-under-one-year`) | Yes/No radio | Self | Disability; one question replaces the employment flag and years inputs on this page. |

## Approved policy decisions (CHG-025)

| Setting | ASCE decision |
|---|---|
| Disability work hours | Member and spouse must each work at least 30 hours weekly. |
| Spouse Disability age | 17 through 59, inclusive. |
| Member Disability income | Gross annual income at least $20,000, calculated from monthly income × 12. |
| Disability residency | US states/DC excluding NC/VT/WA; Puerto Rico; Canada excluding Quebec. Spouse-only NH exclusion remains. Other products retain their existing policies. |
| Short self-employment | A Yes answer uses the existing $1,050 maximum, mandatory 90-day waiting period and five-year benefit period. Old saved employment/years answers cannot satisfy the new question. |
| Joint spouse Disability application | Keep spouse selectable when member benefit is below $600. On Next, the standard page error alert applies when both apply with positive benefits and the member benefit is below $600. The check is not an inline field stop. |
| New Term Life application | Adult minimum $20,000; ages 70–72 maximum $500,000; ages 73–75 maximum $350,000. In-force coverage is not a new application. |
| AD&D child age | At least 15 days old and no older than 24 completed years. |
| Child Life dependency | Require member Life coverage; spouse coverage alone does not satisfy it. |
| Spouse guidance | Additional spouse-section note: “Spouse coverage can’t exceed member coverage.” This note introduces no validation or amount filtering. Existing AD&D constraints remain. |

## Sources and shared readers

- `global/configurations/coverage-policy.json`: reusable typed setting definitions.
- `global/rules/coverage-policy.json`: reusable behavior statements, assigned by `mappings/requirements/coverage.json`.
- `parked/sites/asce/coverage.json`: ASCE-only product/applicant assignments, age bands and MCR/user-decision provenance. These approved dimensions are compiled into the shared consumer contract before eligibility resolution.
- `global/content/coverage-notes.json` and `parked/sites/asce/pages/coverage.json`: shared wording and the site’s spouse-section note selection.
- `mappings/page-fields/coverage.json`: shared field participation and replacement of the obsolete two-field question, scoped to Coverage. Profile and unconfigured sites retain their own definitions.
- `src/domain/requirementCoveragePolicy.ts`: shared product, eligibility, amount and submission adapters. `requirementCoverageValidation.mjs` checks assignment types, product/applicant scopes and nonoverlapping age bands from both runtime and requirements validation.

The Library shows the same effective settings and source files, including compiled
eligibility bounds. The approved new-application minimum is also checked by normalized amount evaluators.
The prototype and Storybook template use the same product projection, field loader
and section notes. Standalone Coverage question stories use a detached fixture from
that projection instead of legacy field constants.

New-application amount filtering is the prototype’s current mode. The reusable
amount adapter also supports increases and rider-only modes without reclassifying
existing low amounts as new applications; this change does not connect an in-force
policy service or add a new application-mode flow.

The attached MCR v78 workbook was checked before implementation. Confirmed user
exceptions take precedence where its sheets disagree: spouse age stays 17–59;
the $600 threshold runs on Next; child Life requires member coverage; spouse
amount guidance is informational. Earlier approved age, CIR-only and child-question
decisions remain in place. No email, TPA transmission or insurer integration is added.

## Fresh-start structure and content (CHG-026)

Coverage follows the same compiler as Membership and Eligibility. The complete
question-group order is in `parked/coverage.json`; the single self-employment
question appears once in member Work & Income, after hours and income. The source
question-participation map is `global/coverage-questions.json`. Generated product
controls resolve their field labels/types from the Coverage field mapping.

Headers, categories, reveal/Next errors, product presentation, card/cart/rate copy,
dialogs, notes and shared help read fresh content. The compiler emits the existing
consumer shape for Library, prototype and Storybook; saved legacy headings,
placements or field definitions cannot override reviewed values. Superseded page,
field, content and ASCE eligibility records were removed from old authoring parts.
The generated deployment bundle remains a projection, not an editable second source.

The dependent-only dialog remains as before. Fictional portfolio records live in
`global/prototype-fixtures/portfolio.json`; access is defined below in CHG-029.
Existing-coverage dependencies and lower existing Term Life amounts remain pending.
CIR and Disability period requirements are now recorded in the CHG-031 register.
Estimates remain fictional; no rate-accuracy review is required for the prototype.

## Combined Life maximum and MCR residency (CHG-027)

The per-person Life ceiling is authored once in
`parked/sites/asce/coverage-policies.json`. The MCR confirms $2,000,000 across
Traditional Term Life, 10-Year Level Term Life and 20-Year Level Term Life
(Main!H165:K167 and New UX Multi-page Requirements!X21). Member and spouse totals
are checked independently. Global product amount definitions reference this ceiling
where it is the product upper bound; Traditional Term Life retains its separate
$1,000,000 product upper bound and previously approved age caps.

The standard page error appears only on Coverage Next when the selected Life
amounts for that person exceed the ceiling. Products remain selectable beforehand.
The check uses selections in the current application plus verified TPA in-force
Life when configured (CHG-030), does not require later Profile answers and does
not run again on Review. The domain portfolio validator uses the same normalized
ceiling for its own explicit portfolio inputs. Existing-policy dependencies and
lower existing Term Life minimums remain pending.

The same site policy file owns the complete reviewed Disability residency scope:
US states/DC except NC, VT and WA; Puerto Rico; Canada except Quebec; spouse-only
NH exclusion. This follows New UX Multi-page Requirements!AC21 and Main!N169.
It replaces the provisional mainland-only rule. The former additional NC assignment
is removed so exclusions have one authoritative policy. Form province codes such
as ON are normalized to CA-ON instead of US-ON. The Library and both runtime
surfaces resolve the compiled policy.

The shared ZIP/state/date-of-birth component also uses the normal 16px field gap.
It no longer reserves blank feedback rows. Real helper text, inferred-state
feedback and errors still render when applicable on Home, Eligibility and shared
Storybook examples.

## Verified existing-member portfolio (CHG-029)

The confirmed `coverage-tpa-portfolio-access` rule is defined once in
`global/rules/coverage-policy.json` and mapped to Eligibility and Coverage. The
Library shows one shared rule with both pages. ASCE selects the TPA member-lookup
configuration in `parked/sites/asce/eligibility.json`; the shared reader resolves
this to coverage verification. Both the Coverage action and open drawer require
that mode plus true existing-member, active-coverage, verified and portfolio-enabled
outcomes. Missing outcomes, unmatched/new members, no active coverage and failed
or skipped verification cannot open the portfolio.

The lookup record and verification questions are fresh-start prototype fixtures.
Portfolio policies remain fictional prototype data. They now supply configured
amount reductions (CHG-030); they do not satisfy dependent coverage requirements.
No live TPA call is made.

### Reproducible prototype case

1. Start a new ASCE application and attest to membership. Use **Taylor Morgan**,
   Member ID **00123456**, and any valid fictional email/phone with a Phone Type.
2. On Eligibility, enter ZIP **10001**, state **NY**, and birth date **08/26/1990**.
   Click Next.
3. Complete the address prompt, for example **100 Example Avenue, New York**.
4. Choose security questions. Select **Albany**, **Honda Civic**, and **Oak Street**,
   then continue after the successful verification result.
5. On Coverage, open **View coverage portfolio**.

Storybook also has **Pages / Coverage / Whole Page → Verified existing member with
existing coverage**, which starts after successful verification. The actual App
journey test performs Home, Membership, Eligibility, address and verification
before opening the drawer. Failed/skipped verification cases verify that portfolio
access is withheld. Failed or skipped verification continues from Eligibility to
Coverage as manual review without the portfolio, as confirmed in this review.

Existing-policy dependencies and lower existing Term Life amounts remain on hold.
The CHG-031 register records CIR, Disability periods and the prototype estimate scope.

## In-force amounts reduce available coverage (CHG-030)

`coverage-tpa-inforce-amounts` is the shared rule. The boolean setting
`coverage-deduct-inforce-amount` defaults off and is assigned to ASCE's adult
Term Life, 10/20-Year Level Life, AD&D and LTD in `parked/sites/asce/coverage.json`.
The Library exposes both the behavior and these product/person assignments.

After successful verification, use the structured portfolio's numeric amounts and
product IDs. Deduct each person's matching in-force coverage from the applicable
product maximum, including age and Disability benefit limits, and their in-force
Life total from the existing combined Life ceiling. Keep only permitted dropdown
increments within the remaining capacity; never round upward or create a new
increment. No positive capacity means no positive amount choice. Spouse amounts,
other products and riders do not reduce a member's base-product capacity.

The existing fixture therefore leaves member Term Life at **$750,000** available
($1 million less $250,000 in force), spouse Term Life at **$900,000**, and member
combined Life capacity at **$1.75 million**. The member LTD fixture's **$3,500/month**
reduces its available benefit after applicable income, age and employment limits.
The spouse's existing Short Term Disability is not the offered Long Term Disability
product. The drawer formats the same numeric JSON that the calculations use.

New elections across Life products remain independent dropdown choices. Coverage
Next checks their sum plus verified in-force Life against the same single ceiling.
Stale selections outside the remaining product choices fail normal page validation.
Failed/skipped verification retains manual review without portfolio access or these
deductions. No live integration, existing-policy dependency or lower-minimum behavior
is introduced.

Focused checks cover the rule and Library assignments, prototype/Storybook parity,
per-person/product deductions, age/income caps, increment rounding, exhausted
capacity, stale selections, combined Life submission and real-App dropdowns after
passed/failed/skipped verification. Test runs should target affected paths; unrelated
site/migration suites are not required for each Coverage change.
