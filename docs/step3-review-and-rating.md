# Step 3 Review, field participation and mock rating

October 5, 2026. The user's scope excludes real PRASE and keeps the persisted Library cutover separate. These additions use the existing fields, checkboxes, text/date controls and page layout primitives.

## Configuration ownership

| Concern | Canonical ownership | Behavior |
| --- | --- | --- |
| Additional Review sections | `ReviewPolicy.blocks` in Site configuration, with canonical Fields IDs and source references | Ordered before Next; applicant/product/mode applicability; standard controls and existing field overrides |
| Fraud notices | `ReviewPolicy.fraud` | MCR Read & Sign B53:C76; member residence selects text, New York life-only exception, accident rider/included accident products, CSEA override |
| ABE dividends | ABE Review policy and canonical Fields | Screenshot explanation plus MCR dividend/election copy; required acknowledgement; identity fields always visible and optional in the member section; no additional election checkbox; product dates use a standard MUI unordered list |
| Mutually exclusive products | Coverage `requirements.exclusiveProducts`; captured Benefit policies | ABE LTD/LTD Plus cannot coexist, across applicant roles; selection and final validation enforce the same rule |
| Quote field participation | `fields.home.extra / hidden` | Quote-only suppression; WAEPA's retained nicotine suppression; ignored answers are cleared when copying quote inputs to an application |
| Rate input participation | Per-product `RateInputPolicy` | Required, ignored or provisional dimensions; independently persisted, validated and sourced; conditional jurisdiction overrides cover ASCE Montana unisex rates |
| Rate modifiers | Per-product `RateModifierPolicy` | Ordered multiplicative adjustments and annual fees, explicit predicates and source references; captured billing applies modal factors and final cent rounding |
| Joint life limits | Captured aggregate policies and explicit aggregate participation | Established limits remain enforced; missing joint caps retain individual product checks under the user's provisional authority and cannot establish publication readiness |

Portal Library Configurations includes Review, exclusions and rate-input schema entries. Its Fields inspection includes the additional ABE controls with applicability and source references. The reviewed compiler stores typed configuration targets and field relationships in the existing normalized Library tables. Candidate consumers resolve these from a captured snapshot; they do not reconstruct a ClientConfig or use a static fallback.

## Source and provisional boundary

Fraud wording is copied from the pinned MCR cells, including state exceptions. ABE's longer charitable-giving explanation is transcribed from the user screenshot; the election/dividend wording retains the MCR source. The user confirmed: “Required acknowledgement; always show identity fields.” The later correction makes those identity inputs optional and removes the additional election checkbox.

AMA's source AR117/119:126 supplies nonmember annual fees, member percentage credits, disability state surcharges and Premier Accident monthly EFT discount. The modifier policy preserves these amounts and predicates. Source percentages for volume discounts and several child/family rating details remain under the earlier provisional decisions; no missing percentage is invented. Modifier ordering and generic synthetic base premiums remain explicitly provisional.

Known unisex/unismoker evidence establishes ignored dimensions. Other dimensions are marked provisional when the source does not conclusively establish participation. Those working choices are retained for mock acceptance and listed for source reconciliation. Actual underwriting questionnaires, unresolved rider/document exceptions, insurer XML/PDF certification and current legal/filing approval are not established by these tests.

## Acceptance and runtime

`reviewAndRateAcceptance.test.ts` checks serialized policies for all ten Sites/68 products; state and New York fraud branches; required acknowledgement, optional identity and date validity; removal of the additional election checkbox; scoped Review fields; ABE exclusions; quote-only suppression; ASCE Montana override; sourced AMA modifiers; mock rating errors, expiry and CSEA suppression. `coverageHouseholdAcceptance.test.ts` verifies member/dependent reconciliation, distinct children, service-verified child-only primary coverage, household exclusions and invalid identities. The existing 1,838-mapping matrix continues to exercise captured applicant/class/association/period/mode contracts.

The new `quoteCandidateWithMock()` contract calls the existing `/api/mock/rates/quote` service through `candidateMockRatingService`, passes active rate dimensions, validates a synthetic annual response and applies captured modifiers/billing. CSEA returns no calculated price. The ordinary applicant quote renderer still uses its existing source-controlled estimate behavior until the separately requested cutover.

The live compatibility prototypes receive the specifically requested Review/exclusion/quote-field improvements. They still do **not** read the persisted reviewed Library automatically. The agreed provisional/mock prototype scope is accepted in `step3-prototype-acceptance.md`; broader source-fidelity reconciliation remains deferred. These additions do not certify exact source completeness or activate publication.

## October 5 follow-up corrections

A sole available category is selected before question/product rules run on Quote and Coverage, and the category prompt is hidden. `?category=DI` (or another canonical category ID) restricts the available portfolio across application routes for that Site; `?category=all` clears the session restriction. Invalid restrictions expose no products.

Rate policies now separate class catalogs and quote selection (`single`, `fixed`, `tobacco`, `unresolved`) from field visibility and per-state dimensions. MCR AO/AP/AR evidence is retained, including AMA fixed Preferred Plus quotes, ASCE Preferred/Standard mappings and single-class products. Complex QD, age/amount and lookback exceptions remain provisional. The user supplied WAEPA documentation identifying ART G-30280-0 as “Std only rateclass.” Both active term-life assignments use that G-number (Main E379/E386), so they now capture a single Standard class, independently of the hidden tobacco question. This establishes the class choice, not authoritative rate amounts. No persisted Library cutover is activated.

Follow-up validation: nine Review/rating tests, three category-scope tests and two configuration-documentation tests passed. Of 145 migration equivalence tests, 144 passed initially; the ABE coverage comparison exposed a missing inherited requirements merge in the independent resolver. The resolver was corrected and that targeted test passed. Production build, final TypeScript, lint and whitespace checks passed. Browser inspection verified ABE optional fields/list styling, CSEA question-first entry and URL-restricted AD product-first entry on both Quote and Coverage.
