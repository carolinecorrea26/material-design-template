# Platform conflict clarifications

Caroline clarified the migration scope and fallback decisions on October 1, 2026. This note supersedes broader legacy-feature recommendations in the platform review. Step 3 is now in progress; the [adoption register](step3-active-site-adoption.md) records the identity crosswalk and reviewed WAEPAGI amount slice.

## Scope and Site identity

Review candidates are limited to rates, coverage information, eligibility information, health-question rules and their direct dependencies. Check the existing new template and applicable MCR evidence before adding anything to the Library. Legacy presentation switches, unrelated operational features and template-specific mechanisms are not migration requirements merely because the reference lists them.

CSEA is the **standard** Site, corresponding to the legacy `csea` candidate, not `cseagi`. Product/plan crosswalk and actual policy values still need review; GI-only evidence must not be adopted as standard CSEA evidence. The old standard Site's included AD&D and rider behavior still require reconciliation against the intended current coverage.

The naming request concerns **Site filter dropdowns**, not stored Site keys or URLs. Each dropdown now uses its unique Site acronym: DEMO, ABE, AMA, ASCE, AVMA, CSEA, NSO, ISITRUST, WAEPA or WAEPAGI. The `-default` IDs remain intact. No renaming of stored identities was requested.

## Where the WAEPA GI branch comes from

The supplied HTML includes actual function text as data under `data.sites[id=waepagi].events[name=coverageSelectionViewRender]`, reported from `template_2.0/waepagi/js/siteconfig/siteconfig.js`. The [source evidence extract](platform-conflict-source-evidence.json) preserves that exact function.

It disables the member amount selector and initially hides spouse coverage. When the full-time-worker answer is Yes, it hides/unchecks spouse coverage for a member amount of 100000 and shows spouse coverage when the member is selected at 250000. It repeats this logic in amount and selection change listeners.

“Handler” means that old page-render function and its change listeners. The source proves the branch exists in the supplied code; it does not prove the backend offers 250000, that users can reach the branch, or that it belongs to the current GI offer. The reference also describes a 100000 default/locked offer and a 100000 certification. Record this as a possible obsolete or alternate-offer branch requiring applicability review, not evidence to add spouse coverage to the new Site.

## Legacy rate calculation fallback

Caroline authorizes retaining legacy calculations when no applicable replacement is provided by MCR or other evidence. Check for an existing equivalent before adding a new implementation. Keep formulas separate from labels and the actual rate-service inputs they require.

The copied AMA labels do not themselves impose AMA fees on other Sites. The preserved WAEPA GI formula selects a service-returned discount by membership and computes:

`totalNetAmt + coverageSelf.policyFee - premiumCredit`

The ISI Trust formula also uses provincial tax and product-specific family-plan handling before computing:

`adjustedTotalNetAmt + provincialTaxAmt + coverageSelf.policyFee - premiumCredit`

The original functions source these amounts from the rating response, with zero defaults for optional adjustments. They do not establish a fixed dollar fee or discount percentage for WAEPA GI or ISI Trust. The user-approved fallback applies to the existing arithmetic where no replacement exists; it does not invent unavailable base premiums or transfer AMA's product-specific amounts to another client. Clarify whether returned net amounts already include adjustments when defining the replacement rate-response contract, so totals are not double counted.

## AMA rate information in MCR

AMA does have rating information in the checked-in MCR snapshot. The earlier summary under-described that evidence. Exact cells are preserved in the source evidence extract:

| MCR location | Recorded rating information |
| --- | --- |
| `Main!AI117:AI126` | Modal factors: Annual 1.00, Semi-Annual .52, Quarterly .265, Monthly .083 |
| `Main!AR117` | Hospital Income: three plan types and an annual $45 non-member policy fee |
| `Main!AR118:AR119` | DI: annual $55 non-member fee, 35% member credit and state surcharge rules |
| `Main!AR120:AR122` | 10/15/20-year life: annual $50 non-member fee, 8% member credit, volume-discount thresholds, spouse membership treatment and $60 annual child coverage |
| `Main!AR123` | Term Life: annual $50 non-member fee, volume discounts and an explicit statement that premium credits do not apply; spouse text also mentions a member credit, requiring reconciliation |
| `Main!AR124` | Preferred Term: annual $50 non-member fee, 8% member credit, volume discounts and $30 annual child coverage |
| `Main!AR125` | Office Overhead: annual $45 non-member fee and 35% member credit |
| `Main!AR126` | Premier Accident: annual $45 non-member fee, 20% member credit and an additional 5% monthly EFT discount |
| `Main!AN117:AQ126` | Rating units, risk-class/age dimensions and band structure vary by product |
| `New UX Multi-page Requirements!AX43` | Product cost-breakdown instructions, membership-dependent credit labels and dependent grouping |

These are product-specific rules, not a single AMA fee or credit. They must be mapped to exact products and checked for applicability. The modal-factor notes refer to column AH, while the numeric factors are in AI; preserve the actual cells rather than following the prose pointer blindly.

This snapshot evidence establishes substantial rating rules. It does not, by itself, establish a complete executable base-premium table for every age/risk class/product/rider. The remaining work is to identify the required base-rate source or service inputs and apply the confirmed modifiers. The existing category-based prototype estimator is not those base rates.

There are concrete reconciliation points: the supplied legacy AMA quote summary describes DI credit/surcharges that differ from `AR118:AR119`; `AR123` is internally ambiguous about spouse credits; and the new template currently configures a single annual $45 policy-fee display and $12 child charge rather than MCR's product-specific amounts. Resolve the exact scope before adopting or changing calculations. A dated disclosure alone was insufficient reason to say AMA rate information was absent.

## Subsequent decisions: standard CSEA and WAEPAGI

The cross-sheet review found standard CSEA in URLs row 64, Attestation row 69, Single-Page Requirements row 27, Read & Sign row 122 and Associations row 60. Main 246 is a possible mislabeled row because its standard dependent behavior matches those sources, while Main 247 has N/A dependents. Preserve variant ambiguity; standard CSEA is not absent from MCR, and CSEAGI remains outside initial migration.

Caroline confirmed source-first WAEPAGI coverage and that credit cards are permitted. The reviewed candidate now contains the fixed $100,000 member life offer, no inherited disability/dependent coverage or riders, and required Bank/Card Monthly payment. The user decision overrides Main!AK386's contradictory card prohibition. See the [adoption register](step3-active-site-adoption.md#waepagi-portfolio-and-payment-decision).
