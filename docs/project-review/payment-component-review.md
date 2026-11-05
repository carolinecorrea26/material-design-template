# Payment component and documentation review

October 28, 2026. Continues [Health](health-component-review.md) using the [component documentation contract](component-documentation.md). Health's six routes, 18 source sections and shared question/help/editor components are accounted for; missing source wording and external service boundaries remain documented there. This pass prepares Payment for page review without recording user acceptance.

## Application frame

FormRoutePage owns PageShell/FormShell, main steps and breadcrumbs, heading/Back/help placement, form state, restoration, validation, persistence and Next. Payment supplies its contextual help through HelpChips and AppDrawer using the existing paymentHandlingHelpItem. The page retains collection requirements, product/payment policy, coverage prerequisites, quote requests and mock authorization/submission. No payment transport moves into a display component.

Payment supplies its resolved visible controls through runtimeFields as well as development fill. Product method/frequency IDs keep the existing `payment-method:<product>` / `payment-frequency:<product>` bindings; shared elections use the existing `:all` bindings. Banking fields retain their existing single application-level bindings. This explicitly includes generated controls in restoration without relying on the development-field filter.

## Sections in page order

PaymentSections is the standalone production content composition. It receives explicit fields, category/product display data and slots for shared controls, cost summaries and mock feedback. It reads no active Site and chooses no payment policy.

| Section | Shared owners | Behavior and states |
| --- | --- | --- |
| Authorization/submission feedback, when mock platform is enabled | Native actions and alerts supplied by the controller | Approved/declined test tokens, busy state, stale-election feedback and errors remain in Payment. These are prototype actions. |
| Optional payment election | FieldRenderer | Optional collection asks whether to add payment information. No hides collection and allows the existing deferred-submission path; Yes reveals the same required controls. |
| Payment timing explanation | Native warning within PaymentSections | Existing “You will not be charged yet” wording remains above the product elections. |
| Shared elections, when enabled | SharedPaymentControls → FieldRenderer | Uses the intersection of collecting products' options. Method/frequency changes synchronize canonical product bindings; incompatible frequencies clear. Empty intersections show existing guidance. |
| Category/product payment cards | CategoryCard → ProductCard → FieldRenderer | Saved product methods and method-specific frequencies; frequency disabled before choosing a method. Per-product controls hide only where the corresponding shared control applies. No products renders existing return-to-Coverage guidance. |
| Product costs | TotalCostSummary / EstimatedRate / ReferenceRateTableLink | Controller supplies applicant rows, resolved rate states or a reference table. Member/spouse amounts and rows stay separate even though the product payment choice is shared. Existing non-Library estimate presentation remains in the caller's cost slot. |
| Banking Information | SectionDivider → FieldRenderer | One bank section appears when any applied product selects Bank account. It uses the saved banking surface, including account-holder/institution/routing/account/authorization fields. Bill me does not show it. |
| Quoted-cost footnote | Native text within PaymentSections | Existing wording remains visible even when optional collection is deferred. |

Title, Back, help position, required feedback and Next belong to the frame reference. Native warnings, buttons and footnotes are parts of their owners, not additional component identities.

## Canonical components and reuse

| Owner | Role and internal parts | Placements and examples |
| --- | --- | --- |
| PaymentSections | Page section; optional collection, warning, product categories, banking fields and footnote; caller supplies shared controls, feedback and product costs | Production Payment and Pages → Payment → Sections: Default, No products, Optional collection. Optional inspection examples use explicit data and local form state. |
| SharedPaymentControls | Shared piece; method/frequency fields, common-choice guidance and effect applying resolved binding updates | Production Payment. Forms → Shared payment controls: shared method/frequency, method only, restricted intersection and no common method. Explicit field definitions replace its prior active-Library lookup. |
| FieldRenderer / RadioSelectionGroup / SelectionGroup | Existing shared controls and required/error feedback | Product, shared and optional elections plus bank fields retain their existing field identities. Canonical field stories carry their control review forward. |
| CategoryCard / ProductCard / SectionDivider | Existing shared surfaces | Category grouping, product heading/QD mark and Banking Information heading; no Payment-specific card implementation. |
| TotalCostSummary / EstimatedRate / ReferenceRateTableLink | Existing shared cost and rate-state surfaces | Payment now passes resolved rate display states into summary rows, preserving pending, missing-information and unavailable states rather than reducing every nonnumeric result to the same NaN display. |
| HelpChips / AppDrawer | Existing shared contextual help | Existing payment explanation and local drawer state remain in Payment; presentation is reused. |

The shared-control view reads no active Library after this change. The page resolves authored field labels/options and narrows them with saved policy before passing them in. All standalone examples use local form state. No new field identities or payment policy values were added.

## Whole-page scenarios

Start at **Pages → Payment → Whole page**. Examples use production Payment and detached global-template fixtures derived from saved capabilities; fictional answers stay in React state. They remount by story ID and restore the previously installed fixture on unmount. Navigation stops at the shared local destination message.

| Scenario | Focus |
| --- | --- |
| Empty | Required collection, product elections and Next validation |
| Restored bank account | Restored method/monthly frequency and fictional bank details |
| Bill me | Saved monthly-only policy without banking fields |
| Optional deferred | No hides collection; switching Yes reveals the required controls |
| Optional opted in | Same collection controls after choosing Yes |
| Member and spouse | Separate adult coverage/cost rows with one product payment election |
| Multiple products | Independent elections for multiple products under saved settings |
| No products | Existing return-to-Coverage guidance |
| Shared choices | Explicit detached capability override enabling shared method/frequency; saved Site settings are untouched |

The saved fixture used by Multiple products does not enable shared collection. Shared choices demonstrates the supported capability explicitly rather than describing it as current saved Site behavior.

## Validation and service boundaries

Page validation checks all collecting products and rejects missing or unavailable method/frequency combinations. Shared elections must agree with each collecting product. FieldRenderer supplies required banking and optional-election validation. Inactive collection does not block optional deferral. Existing policy tests retain the ABE optional decision and ISITrust monthly ACH/Bill me constraints.

With VITE_MOCK_PLATFORM_ENABLED, Next requires current authorized elections or explicit optional deferral and checks Library revalidation first. Authorization quotes and authorizes each applicant entry with test tokens; submission uses the existing mock service and idempotency behavior. These page stories do not establish live payment authorization, charging, tokenization or production submission. The existing mock service boundary remains unchanged.

## Verification and remaining review

Focused verification covers the Health checkpoint, Payment policy/revalidation, shared binding propagation, every whole-page scenario, restored bank/product controls, optional reveal, canonical standalone examples and catalog integrity. The Payment/component/catalog suite passes all 55 checks across eight files. The Health route/source-form checkpoint separately passes all 39 checks. Application and Storybook TypeScript, scoped ESLint, both production builds, generated catalog/handoff consistency and whitespace checks pass. The built source audit resolves all 476 non-admin examples with zero errors or invalid catalog examples; all 103 saved components have production placements. A browser check of the built restored-bank example confirmed the selected bank method, monthly frequency, account-holder/institution/routing/account values and checked authorization. Visual wording/layout acceptance, all-Site accessibility review and live payment integration remain separate.

Next page in the application flow: E-sign / DocuSign.

## October 29 shared price presentation

EstimatedRate owns the default bold (700), primary-color, 1.25rem numeric price presentation across product cards, Payment, cost summaries, breakdowns and cart totals. Removed the summary’s text-color/green-total overrides and repeated caller price styling. Loading uses the same typography; missing information and technical errors retain their shared feedback presentation. The existing inline appearance remains an explicit compact variation.
