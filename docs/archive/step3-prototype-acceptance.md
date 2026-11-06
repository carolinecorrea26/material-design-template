# Step 3 prototype migration acceptance

October 5, 2026. **Complete for the agreed provisional prototype candidate scope**, with real PRASE excluded and persisted-Library activation kept separate. This is acceptance of the working contracts and recorded provisional choices, not certification of exact source parity or production readiness.

The October 2 instruction authorizes working values for source gaps, provided they remain documented for revisit. The October 5 instructions exclude actual PRASE, retain the mock service, and confirm required ABE dividend acknowledgement with always-visible identity fields. Source reconciliation and actual insurer destination certification remain deferred under that scope rather than additional prerequisites for this prototype acceptance.

## Completed candidate work

- Captured contracts for ten Sites and 68 products, including all 1,838 stored applicant/class/association/period/application-mode mappings; invalid and incomplete inputs cannot produce a submission.
- Eligibility, residency, amount/benefit, aggregate, dependent, rider and payment policies resolve from one persisted snapshot. Retained rider elections and emitted codes are exercised after JSON serialization. Unknown/stale rider choices are cleaned.
- Question, financial, tobacco and attestation participation retains the documented template defaults where source-specific forms are unresolved. Candidate validation collects required answers, rejects invalid options and removes inactive answers. Dedicated source questionnaires and exact insurer signatures remain recorded fidelity follow-ups.
- Household acceptance derives primary/dependent amounts from accepted primary requests or mock-service-verified in-force primary policies. Separate children retain separate limits; household exclusions and synchronized payment choices are enforced.
- Review policies persist state-specific fraud wording and ABE dividend sections with standard Fields. Acknowledgement is required; first name, last name and date of birth are always visible and optional in the member section. The additional opt-out checkbox was removed per the later user correction.
- Quote field participation supports per-page inclusion/exclusion. WAEPA nicotine suppression remains in place. Product rate dimensions are independently tracked as required, ignored or provisional, including ASCE Montana's unisex override.
- Mock PRASE contracts validate required inputs, synthetic annual premiums, response expiry, fees/credits, modal factors, rounding and unavailable/error cases. AMA source modifiers are captured; unknown volume/child-rating details retain explicit provisional defaults. CSEA does not show a calculated price.
- Configurations and Fields Library inspection document the additional schema options, values, applicability and source references. Candidate migration uses typed configuration targets in the existing normalized storage schema.

## What completion does and does not activate

The requested Review/exclusion/field improvements are implemented in the source-controlled compatibility prototypes. The reviewed candidate is independently executable after storage. Ordinary applicant pages and Library inspection still use their curated source-controlled catalogs; they **do not automatically consume the persisted reviewed Library**. Cutover is the separate next phase explicitly deferred by the user.

Publication remains disabled. Exact medical forms, unresolved rider/document exceptions, authoritative rate tables, current insurer/legal approval, and actual XML/PDF/service destinations remain documented source-fidelity follow-ups. Mock prices and submissions retain their synthetic/provisional labels. No actual PRASE integration is required or claimed.

## Evidence

- [All stored mapping acceptance](step3-exception-acceptance.json)
- [Review and mock rate acceptance](step3-review-rate-acceptance.json)
- [PostgreSQL readback and integrity](step3-exception-postgres-validation.json)
- [Schema, sources and runtime details](step3-review-and-rating.md)
- [ABE corrected Review inspection](step3-abe-review-corrected.png)

Prior PostgreSQL validation preceded the follow-up Review/rate-class changes; the updated contracts are checked after JSON serialization.

Validation: all 1,838 stored mappings passed acceptance; all 68 product rating contracts were exercised (56 priced with synthetic rates and 12 suppressed by configuration). The nine updated Review/rating tests passed. The focused runtime, household, configuration and rider checks passed. PostgreSQL passed all four candidate tests plus idempotent seeding, exact readback, 12 rejected invalid writes, five rejected snapshot requests, snapshot access controls and concurrent snapshot checks. The isolated validation container was stopped afterward.

Production build, repository lint, generated adoption-report consistency and whitespace checks passed. The build retains its existing large-bundle warning.

Historical Step 3 documents retain earlier findings; this record defines the current completion scope without changing provisional source approval or publication gates.

## October 5 follow-up corrections

A sole available category is selected before question/product rules run on Quote and Coverage, and the category prompt is hidden. `?category=DI` (or another canonical category ID) restricts the available portfolio across application routes for that Site; `?category=all` clears the session restriction. Invalid restrictions expose no products.

Rate policies now separate class catalogs and quote selection (`single`, `fixed`, `tobacco`, `unresolved`) from field visibility and per-state dimensions. MCR AO/AP/AR evidence is retained, including AMA fixed Preferred Plus quotes, ASCE Preferred/Standard mappings and single-class products. Complex QD, age/amount and lookback exceptions remain provisional. The user supplied WAEPA documentation identifying ART G-30280-0 as “Std only rateclass.” Both active term-life assignments use that G-number (Main E379/E386), so they now capture a single Standard class, independently of the hidden tobacco question. This establishes the class choice, not authoritative rate amounts. No persisted Library cutover is activated.
