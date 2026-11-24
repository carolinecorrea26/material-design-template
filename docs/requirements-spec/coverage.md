# Coverage — global template and effective Site

The global template owns page structure, shared fields and components, reusable
rules, configuration definitions/defaults, content definitions and URL parameter
contracts. An **effective Site** combines that template with its assigned products,
values, content selections and overrides. The current migration is verified against
the ASCE effective Site; that rollout target does not make shared behavior ASCE-specific.

AMA, WAEPA and WAEPA GI were subsequently restored with their earlier assignments
and the same global pages; see [effective Site restoration](sites.md). ASCE-only
rollout statements in the historical checkpoints below describe those reviews.

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
| Term Life | Adults ages 17–75; minimum $10,000 for either adult with or without TPA-verified existing coverage (CHG-106); $10,000 increments; maximum $1 million, reduced to $500,000 at ages 70–72 and $350,000 at 73–75. | Main!H167:I167, O167:P167; reviewed minimum/caps. |
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
| Spouse Life guidance | On Term/10-Year/20-Year, show the configured spouse note. Enforce same-policy existing + requested spouse <= member totals only when member coverage is TPA-verified; otherwise note only. | User confirmation November 17, 2026, CHG-106 supersedes the prior note-only exception. |
| CIR participation | Optional rider on Term Life for member/spouse, ages 17–64; no child CIR. No CIR-only application in this prototype. | Main!L167; Riders!B43:H43; user removal of CIR-only supersedes MCR. |
| CIR amounts | Principal amount eligible for 50% acceleration: member $50,000–$1 million in $50,000 increments; spouse $25,000–$1 million in $25,000 increments. CIR cannot exceed applicable base Life. | Riders!C43:D43; current rider amount policies. Require at least $100,000 of this applicant’s verified existing matching Term Life plus requested Term Life (CHG-106); this also supplies the cap basis. |
| CIR residency | Additional exclusions: CT, ID, LA, MA, MN, MT, NC, OH, SD, UT and WA. | Riders!F43; separate from base-product residency. |
| Underwriting handoff | Preserve product/applicant age/amount processing bands and prior approved FUW exceptions. Coverage determines the handoff; underwriting, forms and medical integrations are later-page concerns. | Main, QD LI!J46:Q48; approved decision register and current underwriting policies. |
| TPA access | Existing member + active coverage + successful verification enables portfolio access. Failure/skip continues as manual review without the portfolio. | Confirmed `coverage-tpa-portfolio-access`; fictional fixtures, no live TPA. |
| In-force amounts | Deduct verified balances from each person's applicable product and shared Life capacity; preserve permitted increments. No positive remaining capacity gives no positive option. | Confirmed `coverage-tpa-inforce-amounts`; shared numeric portfolio fixture. |
| Amount controls | Configure amount-list direction, a specific initial amount instead of the current minimum, and whether a configured amount is locked. | Connected through global JSON bindings and the shared amount-control resolver. |
| Campaign amount controls | `amt` sets listed product amounts; `dprods` disables listed product amount dropdowns. Neither bypasses eligibility or limits. | Connected; campaign context persists through navigation and resume. |
| Product presentation | Configure category/product order; `featured_prod` prioritizes a product and its category. `category`, `prods` and `applicant` constrain participation as documented in the URL table. | Current Library URL table and product presentation readers. |
| Elections | Choosing a default amount is separate from Add coverage. Require an elected product, an applicant for each election and valid amounts/options. Stale selections use standard page validation. | `preselect=TRUE` initially elects all offered base products/applicants; optional riders remain separate. Apply once and preserve subsequent edits. |
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

## Coverage presentation messages and retired expansion (CHG-096)

`coverage-increase-note` selects one of the shared additional-coverage or total-coverage messages. It defaults globally to `applyForAdditional`; an effective Site may select `applyForTotal`. This changes only the message. Product/applicant rules continue to own calculations, eligibility, amount choices, in-force deductions and validation independently.

Category expansion is removed from the template. Global application retirement declarations remove its old configuration and descriptive rule, including aliases/values from stale catalogs. Category labels, ordering and the current page layout retain their existing owners. No accordion expansion setting is offered.

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
overrides use the existing Coverage assignment model. ASCE inherits the established global defaults; no additional Site-specific defaults are required.

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
| `dprods` | Disables the listed product/applicant amount control only with a currently valid `amt`. | Missing, malformed, duplicate or unavailable `amt` does not create a URL lock. Configured Site/product/applicant locks remain independent. |
| `category`, `categories` | Equivalent category restrictions, including comma-separated categories. | `category=li,di` or `categories=li,di`. If both appear, `category` wins, even when empty. `all` clears category scope. |
| `prods` | Restricts products by G-number. | `prods=G-0000-0,G-1111-1`; requires `category` or `categories`. |
| `featured_prod` | Featured chip; prioritize the listed product and its category. | `featured_prod=G-0000-0`. Presentation only. |
| `firstCategory` | Display the named category first wherever categories are presented. | Replaces legacy `ctg`; example `firstCategory=di`. Connected to the shared category/product ordering resolver; `featured_prod` retains precedence. |
| `applicant` | Restricts supported applicants/dependent choices. | Existing values: `member` or `member,spouse`; does not establish dependency satisfaction. |
| `preselect` | `TRUE` initially checks Add coverage for all offered base products and participating applicants on Coverage. | Optional riders stay separate; effective Site/entry scope, eligibility and normal validation apply. Persist the applied flag to preserve edits/resume. |
| `ctg`, `mrate`, `nc` | Removed; not supported in the new template. | Frequency controls are configured, and removed URL behavior is not reintroduced. |

Authoritative global records are `requirements/global/products.json` catalog
`urlParameters` / `urlParameterValues`. Library and the reference documentation
project those definitions; the documentation is not a second editable contract. A parameter's
“Migrated” table status describes the documented contract; it does not prove a
prototype parser exists. A missing effective-site `siteUrlParameters` assignment
does not turn the contract into a Site-specific feature. Category/product/featured
readers exist, including `amt` and `dprods`. `firstCategory` uses the same ordering resolver on Home, quote and Coverage. No external integration is introduced.

Product-only amount presets apply to each participating applicant only where that
amount is valid for the applicant. They do not force an adult amount onto a fixed
child benefit. Saved editable choices are retained; a locked amount is revalidated
and enforced against the currently permitted choices. Restoring an application
restores its own campaign context rather than reusing another application's link.
Both category names start the same new campaign and clear omitted old product,
applicant, ordering, amount, lock and preselection context. Save one canonical
`category` key; alias-shaped restored context is normalized to that key. Invalid or
empty restrictions offer no matching products; they do not expand the offering.
CHG-095 records the confirmed alias and valid-amount-lock decisions.

## Current effective-site review boundaries

- Verified existing required base coverage satisfies covered-person prerequisites without a new primary election. Term Life requests use a $10,000 minimum for either adult with or without TPA verification (CHG-106, superseding CHG-047).
- CIR-only remains removed. Spouse Life caps use verified matching member coverage as described in CHG-106; without it, guidance remains informational.
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
| New Term Life application | Adult minimum $10,000 with or without TPA-verified existing matching coverage (CHG-106); ages 70–72 maximum $500,000; ages 73–75 maximum $350,000. In-force coverage is not a new application. |
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
amount guidance follows the conditional verified-member rule in CHG-106. Earlier approved age, CIR-only and child-question
decisions remain in place. No email, TPA transmission or insurer integration is added.

## Fresh-start structure and content (CHG-026)

Coverage follows the same compiler as Membership and Eligibility. The complete
question-group order is in `parked/coverage.json`; the single self-employment
question appears once in member Work & Income, after hours and income. The source
question-participation map is `global/coverage-questions.json`. Generated product
controls use the compiled member, spouse and child control surfaces from that mapping.

Headers, categories, reveal/Next errors, product presentation, card/cart/rate copy,
dialogs, notes and shared help read fresh content. The compiler emits the existing
consumer shape for Library, prototype and Storybook; saved legacy headings,
placements or field definitions cannot override reviewed values. Superseded page,
field, content and ASCE eligibility records were removed from old authoring parts.
The generated deployment bundle remains a projection, not an editable second source.

The dependent-only dialog remains as before. Fictional portfolio records live in
`global/prototype-fixtures/portfolio.json`; access is defined below in CHG-029.
Existing-coverage prerequisites and Term Life minimum treatment are confirmed and implemented in CHG-046.
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
ceiling for its own explicit portfolio inputs. Verified existing coverage may satisfy dependent prerequisites. CHG-106 assigns the same $10,000 Term Life minimum to verified and unverified adults, superseding the CHG-047 distinction.

The same site policy file owns the complete reviewed Disability residency scope:
US states/DC except NC, VT and WA; Puerto Rico; Canada except Quebec; spouse-only
NH exclusion. This follows New UX Multi-page Requirements!AC21 and Main!N169.
It replaces the provisional mainland-only rule. The former additional NC assignment
is removed so exclusions have one authoritative policy. Form province codes such
as ON are normalized to CA-ON instead of US-ON. The Library and both runtime
surfaces resolve the compiled policy.

The shared ZIP/state/date-of-birth component uses the normal 16px field gap.
The Eligibility audit (CHG-044) reserves feedback space consistently in application
and quote contexts; helper text, inferred-state feedback and errors use that space.

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
Portfolio policies remain fictional prototype data. They supply configured amount reductions (CHG-030) and, following CHG-046, satisfy matching covered-person prerequisites.
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

Existing-policy dependency and minimum decisions were resolved in CHG-046.
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
deductions. No live integration is introduced. CHG-046 adds verified existing-policy prerequisite satisfaction; CHG-047 adds the verified-existing Term Life minimum without changing increments or maxima.

Focused checks cover the rule and Library assignments, prototype/Storybook parity,
per-person/product deductions, age/income caps, increment rounding, exhausted
capacity, stale selections, combined Life submission and real-App dropdowns after
passed/failed/skipped verification. Test runs should target affected paths; unrelated
site/migration suites are not required for each Coverage change.


## Coverage audit checkpoint (CHG-045)

| Aspect | Fresh-start source and behavior |
|---|---|
| Composition | `parked/coverage.json` declares all ordered placements and dialog ownership; `mappings/page-sections/coverage.json` is the exact order. Explicit roles identify category/questions, portfolio, reveal, products and inline summary. Page regions and question groups consume this projection. No section-ID classification determines question participation. |
| Fields and controls | Category requirements are global in `global/coverage-questions.json`; effective additions/removals apply to declared question groups. Tobacco follow-ups require Yes, spouse questions require participating spouse products, and unrendered questions cannot force a reveal step. Member/spouse/child generated controls use page-owned compiled surfaces with effective field overrides. Runtime product options narrow those definitions. The Library, installed prototype and detached Storybook examples read these same fields. |
| Ownership | All category choices and default control labels/types remain global; ASCE selects LI/AD/DI and its effective labels/configurations. Definitions reconstruct without superseded page/field/policy records. No other real Site is enabled. |
| Reveal validation | Validate registered applicable question fields on See my coverage options; preserve inline errors and the page alert. Successful reveal saves current answers to application context before loading products. A category with no applicable preliminary questions reveals automatically. |
| Next validation | Validate participating registered fields, require products/applicants/amounts, then run the shared product policy acceptance, configured submit alerts, combined Life maximum and relationships. Add coverage remains usable for correction. Dependent-only confirmation occurs after the shared validation/save step; Cancel remains on Coverage and Continue advances. Thresholds and exceptions stay in their existing policy sources. |
| Saved answers | Scalar question answers retain canonical field IDs. `selectedCategoryChips` and `coverageSelections` are category/product ID arrays; `productApplicants` maps product IDs to applicant arrays. `coverageAmounts`, `coverageWaitingPeriods` and `coverageMaxBenefitPeriods` use `product:applicant` keys; `coverageRiders` and `coverageRiderAmounts` use `product:rider:applicant`. `coverageEntryScope` retains campaign, category-order and preselection context; `coveragePreselectionApplied` records completion of the one-time election. Generated control field aliases identify definitions, not additional scalar answers. Product defaults do not elect coverage. |
| Transient state | Reveal/loading flags, displayed rate frequency (initialized from the effective default), rate-request generations, open drawers/dialogs and feedback remain UI state. Existing product/rider reconciliation and explicit unavailable-selection removal retain their reviewed behavior. Rate responses are fictional and do not establish production pricing. |
| Examples and execution | Supported examples use the five assigned products. A synthetic effective rate configuration demonstrates reference tables through the source compiler. Removed examples depended on absent products, OO/SH assignments, superseded unresolved policies or removed CIR-only behavior. Actual system rules remain documented; the prototype simulates integrations rather than executing real services. |
| Retained decisions | CHG-046 resolves existing-policy prerequisite satisfaction, settles the initial Term Life minimum decision (superseded by CHG-047), and connects `preselect=TRUE`. Spouse Life maximum guidance is enforced with matching verified member coverage under CHG-106; otherwise it remains informational. Other confirmed exceptions, definition statuses and later-page responsibilities remain intact. |


## Confirmed Coverage decisions (CHG-046)

All policy questions raised in this Coverage review are resolved. Shared evaluators
and URL behavior remain global; ASCE supplies its product/rider assignments and values.

- **Dependent-only applications:** verified existing required member/base coverage can satisfy a covered-person prerequisite without a new member election. Matching category/same-product requirements and applicant ownership still apply. AD&D uses verified existing plus newly requested matching member amounts for its existing dependent cap. Failed/skipped verification and unrelated coverage do not qualify. Selected-only requirements retain their meaning.
- **Term Life minimum (superseded by CHG-047):** the initial $20,000-for-all decision was replaced after confirming the MCR distinction. Use $10,000 with TPA-verified existing matching Term Life coverage for the applicant and $20,000 otherwise.
- **CIR:** the configured supporting base is the same applicant’s verified existing matching Term Life plus newly requested Term Life. Requested CIR remains within its own age, residency, increment and maximum rules. CIR-only stays removed.
- **Preselection:** `preselect=TRUE` selects all offered base products and participating applicants on the initial Coverage product reveal. It selects applicable categories first, validates the preliminary questions normally, and uses configured/campaign amount defaults. Optional riders are not elected by this parameter. No eligibility, dependent-plan or amount validation is bypassed; selections requiring correction remain subject to Next checks. Persist `coveragePreselectionApplied` so later removals and restored edits are respected.
- **URL ordering:** the already-defined `firstCategory` contract now has a shared runtime reader and persists in entry context. `featured_prod` keeps precedence. Unsupported values do not change availability or ordering.

Future migration questions must be raised during the review and answered before
calling the page complete; they must not be silently deferred. Integration rules
describe the actual system, while the prototype uses simulated service outcomes.


## Historical TPA-based Term Life minimum (CHG-047; superseded by CHG-106)

The historical values below are superseded: current ASCE Term Life minimum is $10,000 for both adults regardless of TPA verification.

The user confirmed **$10,000 for existing Term Life insureds and $20,000 for new**,
selected only through the TPA integration. No new-versus-additional question is
collected or inferred from other application answers.

- The global template defines `coverage-verified-existing-minimum-amount` and the shared evaluator. Its default means no exception without an effective assignment. ASCE assigns $10,000 for Term Life member/spouse and retains $20,000 under `coverage-new-application-minimum-amount`.
- Use the lower minimum only when the configured TPA integration has successful existing-member, active-coverage, identity-verification and portfolio outcomes **and** its portfolio confirms positive matching Term Life coverage for that same applicant. Association membership, another person's policy, another product, self-reported insurance and an application-mode answer do not qualify. Failed/skipped verification and no matching coverage retain $20,000.
- Amount choices, initial/campaign defaults, submitted amounts and the combined Life check use the same evaluator and effective assignment. Existing capacity deductions, age limits, $10,000 increments and aggregate maxima still apply. Zero remains unavailable for base coverage; CIR-only remains removed. Level Term and child fixed amounts are unchanged.
- Library exposes the global definition and ASCE assignment. Prototype and Storybook use the same source projection and simulated TPA portfolio. No actual service execution or additional saved answer is introduced.

This supersedes the minimum treatment recorded in CHG-046.

Verification: fresh-start and focused minimum/journey checks pass. The historical
`effectiveConfiguration` fixture suite fails before amount evaluation on superseded
Membership field ownership; the same failure was reproduced with the previous
minimum evaluator. This is separate from the verified minimum behavior above.


## ASCE Coverage confirmation (CHG-106, November 17, 2026)

The current ASCE minimum is $10,000 Term Life for either adult, regardless of TPA
verification. CIR retains $50,000 member / $25,000 spouse minima and requires at
least $100,000 of that same applicant's verified existing plus selected Term Life.
Term, 10-Year and 20-Year remain QD products. ASCE uses the inherited apply for
additional instruction; this note does not change calculations.

Each Life product now has the supplied spouse note and a conditional same-policy
cap. Only verified positive existing member coverage activates that cap; compare
existing + selected amounts for each person, preserving available capacity and
rejecting excess amounts. Without verification the note remains informational.
The prior unconditional note-only exception and CHG-047 minimum distinction are
superseded. Product descriptions, the bold level-Term notice and the High-Limit
Accident Insurance name are recorded in the [current component checkpoint](../project-review/coverage-component-review.md#asce-coverage-values-and-product-notes-chg-106).
