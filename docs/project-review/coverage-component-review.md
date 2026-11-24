# Coverage page review

Fresh-start audit checkpoint: **CHG-045 / CHG-046**. Scope is the shared global template and
ASCE effective Site. Policy values, exceptions and resolved decisions are in
[the Coverage requirements](../requirements-spec/coverage.md#coverage-audit-checkpoint-chg-045).

| Area | Ownership and implementation |
|---|---|
| Application frame | Shared `FormRoutePage` owns progress, header, standard alerts, validation/save-before-advance and Next. Coverage supplies its page checks and dependent-only confirmation. |
| Coverage questions | `CoverageQuestions` composes the category selector, authored personal/tobacco/work-income groups, applicant dividers, conditional groups and additional product facts. Canonical fields, section order/roles, selected categories and participating applicants determine the result. Tobacco follow-ups require Yes. Child details remain on Eligibility. |
| Product reveal | `ProductCatalog` composes product cards, applicant controls, policy-resolved amounts/options, riders, rate states and the inline `CoverageCart`. The estimate remains within product reveal. Add coverage is separate from amount defaults. |
| Supporting surfaces | Verified portfolio action/drawer, dependent-only confirmation, first-add cart drawer and later-add feedback are explicitly placed in the page source. They reuse shared components. Portfolio access also requires the configured verification mode and current successful outcomes. |
| Source | `requirements/parked/coverage.json` owns composition, dialogs and generated-control surfaces; `mappings/page-sections/coverage.json` owns its exact order. Global category requirements and field definitions/defaults remain shared. `parked/sites/asce/` owns assignments, values and overrides. Generated catalog/build outputs are projections. |
| Validation | Reveal validates registered applicable questions and shows inline/page errors. Next validates registered fields and product/applicant/amount/policy acceptance, configured submit alerts and combined Life limits. Confirmation follows successful validation/save. No new inline field-answer stopping rule was added. |
| Storage | Canonical question IDs and product/applicant/rider keyed answer maps retain their bindings. Generated field aliases are definitions, not extra scalar answers. Display frequency, loading, drawers and feedback remain transient. Full contracts are recorded in the requirements checkpoint. |
| Storybook | Whole-page examples cover interactive progression, campaign amounts, verified portfolio, unavailable/restricted entries, dependent-only confirmation and reference rates. Product examples use assigned products and supported options. Detached sections/cards receive compiled fields. A source-compiled synthetic rate assignment supplies reference-table presentation. Unsupported absent-product, OO/SH, obsolete unresolved and CIR-only examples were removed. |
| Execution | Business rules describe the actual system. The prototype uses fictional rates and simulated integration outcomes; live delivery, lookup and batch execution are outside its execution scope. |

CHG-046 resolves all raised Coverage decisions: verified existing coverage supports
dependent-only applications, the Term Life minimum is $10,000 for both adults regardless of TPA verification (CHG-106, superseding CHG-047), CIR uses existing
plus requested matching Life, and `preselect=TRUE` initially elects offered base
products/applicants without optional riders. Its applied flag preserves edits/resume.
The defined `firstCategory` ordering reader is also connected. Spouse Life maximum
guidance is enforced only with TPA-verified matching member coverage (CHG-106); otherwise it remains informational.
Existing confirmed exceptions and draft statuses are preserved.

Verification covers source reconstruction without superseded records, global and
effective ownership, Library/prototype/Storybook agreement, question participation,
ASCE policy regressions and the real page's entry/validation/confirmation/reference
flows. Site-wide visual/accessibility acceptance is a separate review boundary;
this checkpoint does not claim production service or rating execution.


## Client configuration and copy review (CHG-079)

User decisions November 15, 2026. Coverage uses the shared global header contract. Its declared content slots are `coverage.title` and `coverage.subhead`, with global defaults and optional effective-Site overrides under `parked/sites/<site>/pages/coverage.json` → `content`. ASCE adds no header override. Library Configurations discovers the same slots that the shared application frame, prototype and Storybook consume.

| Coverage copy/configuration | Ownership / client boundary |
| --- | --- |
| Page title and introduction | Client-overridable strings; global defaults inherit |
| Category/product/rider names and descriptions | Existing shared product definitions, effective product data and supported presentation overrides; no separate Coverage copy model |
| Coverage limit and eligibility warnings | Global wording, effective policy values/substitutions and existing applicable content selections; no free-form Site page-copy overrides |
| Total-versus-additional coverage instructions | Shared global messages selected by effective Site `coverage-increase-note`. Message selection does not affect calculations, eligibility, allowed amounts or in-force deductions (CHG-096). |
| Estimate disclaimers and rate-state messages | Global shared copy; rate availability, frequency and display remain configuration-driven |
| Other section, selector, button, dialog, cart, loading and validation wording | Existing global definitions; no new Site copy permission |
| Applicant section labels and field labels/options | Existing shared applicant/field contracts |
| Coverage amounts, defaults/locks, category/product/featured order, available applicants/riders, benefit/waiting periods, eligibility and integration | Existing product/configuration/URL contracts, independently of page wording |
| Existing spouse note | ASCE retains its approved selection of the global the retired general spouse note (replaced by effective product applicantNotes in CHG-106) text. Existing content-key selections remain supported; this does not grant arbitrary warning wording overrides |

The client copy review adds no component, product, Site implementation, real rating/integration or additional behavior. Field/product answer bindings and shared estimate presentation are unchanged. Compiler tests reject attempted Site overrides of the amount instructions, combined-limit error, estimate disclaimer and breadcrumb. Product and policy content remains under its existing shared owners.

CHG-079 verification: all 70 fresh-start checks pass, including isolated overrides across all 11 newly approved header pages, default-adapter parity, unchanged page enablement and rejection of Coverage policy-copy overrides. TypeScript, focused lint, requirements/component checks and prototype/Storybook builds pass; all three catalog artifacts match.


## Non-copy configuration audit (CHG-094)

November 15, 2026. Global definitions/defaults remain under `global/configurations`, canonical fields/questions and global product policies. Site assignments/overrides remain under `parked/sites/<site>/{products,coverage,coverage-policies}.json`, `fields.json` and `pages/coverage.json`. The following inventory supplements the completed copy review; it does not reopen approved ASCE values or exceptions.

| Configuration | Global default / supported scope | Effective ASCE / boundary |
| --- | --- | --- |
| Page/flow structure | Coverage required at global position 3; shared section order, stages and dialogs | Inherits; no Site page skip or reorder option |
| Assigned products | Global product definitions; Site assigns enabled products and applicants | Term Life, 10-Year Level Term, 20-Year Level Term, AD&D and LTD. Disabled products are not made available by presentation settings |
| Available categories/applicants | Assigned products, Site-covered people, eligibility, active elections and URL scope intersect | LI/AD/DI and their assigned member/spouse/child scopes; only applicable applicants appear |
| Category/product order | Explicit global JSON order; Site ordering overrides; omitted entries follow defaults | Inherits. `featured_prod` prioritizes its available product/category, followed by valid `firstCategory`, then shared ordering. Stored legacy featured flags are not a second owner |
| Product/category/rider content | Existing shared product and content ownership | Effective values reused across Home, Coverage, quote and About Coverage. Header overrides and approved spouse-note selection retain their separate contracts |
| Question composition | Global category-to-question map plus product/applicant participation and tobacco conditions | Supported Site show/hide/requiredness overrides are retained, as confirmed. Missing required eligibility/rating facts still block the relevant checks or rate; hiding a question does not waive policy |
| Additional facts / self-employment | Global canonical fields; effective product policies select applicable facts | Member DI uses the approved single self-employed-under-one-year question; spouse DI retains its applicable facts. Obsolete employment/years answers do not replace the approved answer |
| Eligibility thresholds | Product/applicant scoped supported overrides; omitted override retains product policy | Existing work hours, income, adult/child age and student values remain as recorded in `sites/asce/coverage.json` and the product assignments. No page-only duplicate limits |
| Residency | Assigned product residency policies plus supported excluded-state overrides | ASCE DI exclusions and spouse NH restriction remain recorded in `coverage-policies.json`; note wording does not change eligibility |
| Amount choices | Product/applicant amount patterns, increments, income/age limits and verified in-force reductions | Existing effective choices retained; no presentation setting creates a benefit outside them |
| Amount dropdown order | Ascending or descending; default ascending. Site or product/applicant override | Inherits ascending; order is independent of the initial amount |
| Initial amount mode/value | Minimum (default) or specified value; zero default value is unassigned | Inherits minimum. Valid campaign `amt` overrides the initial target. Invalid/unavailable targets follow the already-confirmed valid-target/minimum fallback |
| Amount lock | Default false; Site or product/applicant override; valid `dprods` campaign lock | Inherits unlocked. Locks enforce valid permitted targets and never elect coverage or expand limits; saved editable choices remain authoritative |
| TPA/in-force behavior | Existing shared integration/verification contract; per-product/applicant deduction flag defaults false | ASCE enables deductions for its assigned adult products. Only verified matching amounts affect capacity, dependent prerequisites and the existing-Term minimum |
| New/existing Term minimum | Global rule with explicit product/applicant values; no new-versus-additional question | $10,000 for either adult with or without verified matching existing coverage; November 17 confirmation supersedes the earlier distinction |
| Combined Life limit | Shared per-person policy and product references | $2,000,000 across assigned Term/10-/20-Year Life; requested plus configured verified in-force, checked on Coverage Next, excluding rider amounts |
| Dependent prerequisites/caps | Effective dependent and relationship policies; supported additional category-member dependency flag | Existing verified member coverage may satisfy covered-person prerequisites; child Life one-plan rule, caps and approved spouse behavior retained. A false additional flag does not cancel an independent product-policy prerequisite |
| Riders and rider amounts | Assigned parent/applicant, age/residency/dependency rules, amount patterns/defaults | CIR remains a normal rider on Term Life, with separate applicant amounts/wording. It uses verified existing plus requested matching base Life as approved; rider-only is not enabled for ASCE |
| Waiting/benefit periods | Product/applicant options and policy-selected requirements/defaults | Existing DI choices and short self-employment restrictions retained; amount/default configuration does not replace them |
| Estimate frequency | Monthly default; annual supported; frequency selector defaults hidden | Inherits monthly/hidden selector. Feature inventory indicates capability and does not independently turn on the selector |
| Rate presentation | Shared product/Site rating presentation; fictional prototype rate data | PRaSE presentation and quote/Coverage estimates enabled; supported reference-rate examples use detached source assignments. No real rating service is implied |
| Cost display | Shared product-card/cart estimate components and reviewed global typography | Shared `coverage-cost-breakdown` boolean defaults false; ASCE inherits total-only. Sites can enable reconciled base/rider/fee itemization from the same quote result. Pricing policies own amounts, modifiers, credits and fees; display settings do not add charges |
| Entry/campaign controls | Existing global category/prods/applicant/featured/firstCategory/amt/dprods/preselect contract | Restrict/present existing offerings only. `preselect=TRUE` elects base products/applicants once without optional riders; resume preserves edits/context |
| Global policy definitions vs values | Reusable definitions remain visible under every Site filter; Site values are separate rows | Product/applicant overrides require declared capability, confirmed definitions and enabled assigned product/applicant scope. Numeric policy zeros are placeholders, not applied zero limits |
| Other shared behavior | Applicant headings, portfolio privacy, reveal/submit validation, save, drawers and action states | Existing global contracts and ASCE exceptions retained; no new configurable page-specific versions |

Implemented gap closure: `productApplicantOverrides` is an explicit global definition capability, reused by the shared parser. The compiler now checks assignments against enabled Site products and assigned applicants. Age minimum/maximum validation checks every applicant, avoiding the previous first-overlap-only result. The checker reads authored Site product scope rather than the generated deployment bundle. Library Configurations and Rules list shared policy definitions even when the selected Site has no corresponding override. ASCE values are unchanged.

Component reuse remains intact: the shared form frame, question/field groups, ProductCatalog, CoverageInformation, product/applicant/rider controls, rate states, CoverageCart, portfolio and common drawers own their existing distinct behavior. No duplicate page component or redundant Name story is added. Product/applicant/rider policy values are not copied into page-owned fields. Existing canonical source-compiled variations cover the supported structural/rate/entry differences.

Both configuration decisions are resolved. The optional breakdown reuses ProductCostBreakdown and EstimatedRate. Its labels are global content, and source-compiled Storybook examples use fictional itemized quotes. Missing or inconsistent optional itemization retains the valid total estimate without fabricating component amounts. Captured parent/fee/child display-pricing settings are retired by declared replacement paths; they cannot restore pricing through an old display setting. ASCE inherits the global false default. No new real integration is added.

Verification: 85 Fresh-start checks and 65 focused policy, quote-itemization, Coverage page/Storybook and mock/checker cases pass. Checks cover reconstruction without superseded records, independent Site question overrides, product/applicant scope rejection, per-applicant age bounds, global Library definitions, reconciled monthly/annual base/rider/fee/credit amounts and total-only fallback. Requirements, TypeScript, focused lint, component/Storybook organization, refreshed icon inventory and handoff checks pass. Prototype and Storybook builds pass; Library/public, prototype and Storybook catalog hashes match. No Coverage configuration decision remains open. Prototype rates and integrations remain simulated.


## Coverage URL review (CHG-095)

November 16, 2026. Definitions, formats, precedence and readers belong to the global template; ASCE supplies its assigned G-numbers, applicants and policy values. Neither a URL nor a missing Site URL assignment enables an unavailable product/person or overrides eligibility, dependency, benefit or rating policies.

| Entry control | Coverage application and edge cases |
| --- | --- |
| `category` / `categories` | Same comma-separated category restriction. Explicit `category` wins if both appear, including empty input. Trim/case-insensitive category matching; `all` clears category scope. Empty/unknown scopes cannot expand the offering. A single available category is selected normally. |
| `prods` | G-number product intersection with effective Site/category/applicant availability. Requires nonempty `category` or `categories` on entry; a product-only link cannot inherit another campaign's stored category. Unsupported IDs never enable products. |
| `applicant` | Shared member or member/spouse restriction governs questions, product/applicant/rider controls and available amount rows. Form dependent choices do not narrow general Coverage Information availability; URL scope does. Site/product assignments remain authoritative. |
| `featured_prod` | Prioritizes its available product and category, with Featured chip; no automatic election. It takes precedence over `firstCategory`, then effective/global ordering. Unmatched products cannot become available. |
| `firstCategory` | Supported global parameter with bare category values. Prioritizes a valid available category after featured precedence; unknown/unavailable values do not expand scope. Legacy `ctg` is explicitly removed/ignored. |
| `amt` | Product G-number amount presets, independently validated per applicant against current allowed positive choices. No election or rider selection. Invalid/duplicate amounts use the approved valid-configured-default/minimum fallback; saved editable choices remain authoritative. |
| `dprods` | User-confirmed: URL locking requires a valid `amt` for that product/applicant. Missing, malformed, duplicate or unavailable amounts cannot lock. An adult amount cannot lock a fixed child amount. Existing configured locks are independent. |
| `preselect` | TRUE elects offered base products and participating applicants once after normal question validation/reveal. No optional riders or waived policy checks. Preserve later edits and the applied flag through resume. |
| Entry lifecycle | Both category names reset omitted prior campaign product/applicant/order/amount/lock/preselection controls. Save one canonical category key. Plain routes retain scope; resume restores the saved application's own scope, isolated by Site. Existing out-of-scope elections are preserved for explicit correction; no silent removal. |
| Other URL context | Association and template/advisor/navigation context retain their global contracts; tracking values do not change Coverage elections or eligibility. Removed `mrate`/`nc`/`ctg` do not restore rate, calculator or ordering behavior. CIR-only remains removed. |

Library and reference documentation now read reviewed URL names, behaviors and values from `global/products.json`; no parallel editable behavior text remains for these entries. `firstCategory` is registered under its actual runtime name; retired `ctg` is identified as removed. No Site-specific URL implementation or configuration value is introduced. The existing restricted-entry Storybook example uses `categories` through the common parser, alongside canonical-category and campaign-amount examples. Shared components and page structure remain unchanged.

Both user decisions are resolved. Explicit all-category scope is retained when paired with a product restriction so resume cannot lose that offering.

CHG-095 verification: 85 Fresh-start checks and 48 focused entry, amount, applicant, saved-context and Coverage page/Storybook checks pass. Source reconstruction replaces stale ctg records/values and proves Library/reference parity for all nine reviewed URL entries. Alias precedence, empty/unknown input, campaign resets, all-plus-product resume, per-applicant lock validity and independent configured locks are covered. Requirements, TypeScript, scoped lint, component/Storybook organization, icon and handoff checks pass. Prototype and Storybook builds pass; Library/public, prototype and Storybook catalog hashes match. No Coverage URL decision remains open.


## Coverage presentation cleanup (CHG-096)

User decisions November 16, 2026:

- Category expansion is removed. It has no configuration, default, type property, active rule or Library control. Canonical category labels/order and the existing Coverage layout remain shared capabilities. The obsolete global rule, assignment and action are removed from authoring. Root `retiredRuleKeys` and `retiredConfigurationKeys` in `global/application.json` prevent older catalogs, aliased paths and the combined legacy label/expansion description from restoring the capability. These retirement declarations are global metadata, not Site settings; requirements validation and the compiler reject conflicting active authoring.
- `coverage-increase-note` is a confirmed shared enum: `applyForAdditional` (global default) or `applyForTotal`. Effective Sites select the message, and ASCE inherits the additional-coverage message. Global approved content owns both strings. This is message selection only: it does not change benefit calculations, maxima, eligibility, saved amounts, in-force deductions or validation. Those retain their product/applicant policy ownership.

Library descriptions, type comments and the prototype default adapter follow the same source. Existing source-compiled page examples support either message for regression checks; no new component or duplicate story is introduced. A historical unused flag is removed from the legacy data adapter without changing another Site's rollout or policies.

CHG-096 verification: 86 Fresh-start checks and 30 focused page/example/checker cases pass. Coverage reconstructs without retired records; semantic-key, aliased-path and legacy combined-description configurations/values cannot restore expansion. Both configured messages render with the same selected benefit; product policies and current allowed amounts remain identical. Active conflicting retirement authoring rejects. Requirements, TypeScript, scoped lint, component/Storybook organization, icon/handoff checks and prototype/Storybook builds pass. Library/public, prototype and Storybook catalog hashes match. Both decisions are resolved; no Coverage configuration question remains open.


## ASCE Coverage values and product notes (CHG-106)

User confirmations November 17, 2026. Effective ASCE values are authored under
`requirements/parked/sites/asce/`; shared schema, presentation and evaluation
remain global. This supersedes the ASCE CHG-047 minimum distinction and the
unconditional spouse-Life note-only exception.

| Item | Confirmed effective behavior |
| --- | --- |
| Term minimum | $10,000 for member and spouse, whether or not existing coverage is TPA-verified. No new-versus-additional question. Existing increments, age caps, in-force deductions and combined maxima remain. |
| CIR | Member minimum $50,000; spouse minimum $25,000. Available only when that applicant's verified existing matching Term Life plus selected Term Life is at least $100,000, inclusive. Other products and the other person's coverage do not count. Retain existing amount caps, increments, age/residency rules and no CIR-only application. |
| QD products | Term, 10-Year and 20-Year retain their existing QD assignments and existing underwriting bands. |
| Coverage instruction | ASCE inherits the global applyForAdditional note. Its wording selection still changes no calculations. |
| Spouse maximum | For each of Term, 10-Year and 20-Year, enforce spouse existing + selected requested coverage <= member existing + selected requested coverage under that same policy only when positive existing member coverage is TPA-verified. Otherwise show the note without that cap. Inactive requested amounts do not count. Existing spouse amounts reduce available additional capacity; zero remaining capacity offers no positive amount. |
| Shared rendering | ProductCard accepts a plain-text descriptionNotice, rendered bold on a separate line. Coverage and quote cards and the offering overview read the same effective property; applicantNotes stay scoped to their applicant. No page-specific note component or HTML copy is stored. |

| Product | ASCE description |
| --- | --- |
| Term | The simple, economical way to help financially protect your loved ones should they unexpectedly lose you. |
| 10-Year | Family financial protection at an exclusive-member group rate guaranteed not to increase for 10 years. |
| 20-Year | Family financial protection at an exclusive-member group rate guaranteed not to increase for 20 years. |
| High-Limit Accident Insurance (li-add) | Unexpected accidents happen every day. This insurance can help to provide some financial security should a covered accident happen to you. |

10-Year and 20-Year both add this bold separate-line notice: **Please note: If you
are already insured under this policy, a new application will be based on your
current age and amount of coverage requested.** Each of the three Life products
uses this spouse-only note: “Spouse benefit amount may not exceed the member
benefit amount (whether already insured or applying now).” The former general
spouse question-section note is removed to avoid duplicate or overbroad guidance.

Global product presentation declarations and Library rows expose descriptions,
separate notices and applicant notes; effective ASCE supplies the above values.
Canonical presentation definitions replace captured aliases for the same target,
so stale records cannot compete. The verified-member cap is a shared optional
DependentRule capability, disabled unless assigned by policy. Prototype amount
choices, validation and household reconciliation use the same policy, with
verified values kept distinct from requested values. No live TPA service is added.
Other product notes were not supplied in this update and retain their current
values; they are not inferred from this copy.

CHG-106 verification: **90 Fresh-start and 61 focused ASCE checks passed**. Checks cover both adult Term minima without verification, inclusive CIR support thresholds and rider minima, same-policy verified spouse caps and exhausted capacity, quote rider behavior, household accumulation of verified/new amounts, effective product copy and bold notices, three QD products, the additional instruction, Library visibility and stale presentation-alias replacement. TypeScript, scoped lint, requirements, component/reuse/icon/organization/handoff checks and application/Storybook builds passed. The three deployment catalog artifacts match. An additional historical multi-client household suite passed seven cases but its ABE cross-person case remains blocked before household evaluation by duplicate Review policy configuration; it is outside the current ASCE rollout and no ABE source was changed.

## Unselected product-card tint (CHG-134)

The existing shared ProductCard surface uses the effective primary color at 4%
opacity for explicitly unselected cards. Quote and Coverage inherit this treatment
through their existing card composition; selected cards retain the green treatment.
Cards without a selectable state retain the neutral surface. The opacity is owned
by the global presentation tokens, with no Site-specific colors or new wrappers.

## Effective question participation (CHG-135)

The self-employment-under-one-year field remains a global definition, but only
ASCE assigns it through the existing Disability question override. It is no longer
a global category default inherited by WAEPA or future Sites. AMA retains its own
existing Disability question selection.

The shared category question reader now honors the effective hideSmokerQuestion
setting unless a caller explicitly supplies another value. Coverage uses that same
reader as Quote, so WAEPA's existing setting suppresses both adult smoking questions
and tobacco follow-ups in both surfaces. WAEPA GI assigns that setting as well.
No Site-specific renderer or duplicate question definitions are introduced.

The restored-Site regression cases compare Quote and Coverage participation for
both WAEPA Sites and verify that ASCE retains its separate assignments.

## Cart summary boundary (CHG-136)

The shared cart no longer evaluates application selectability, classifies incomplete
answers as ineligibility, or displays an eligibility warning. Its obsolete warning
prop, copy and special Office Overhead warning calculation are removed globally.
Fresh-start retirement removes the old content keys from saved projections too.
Selections, pricing, removal and navigation continue through the existing adapter.

The intended product availability and no-eligible-products Eligibility-page error
are recorded separately in `requirements/global/planned/eligibility-product-availability.json`.
No new filtering or Eligibility-page behavior is implemented by this correction.
