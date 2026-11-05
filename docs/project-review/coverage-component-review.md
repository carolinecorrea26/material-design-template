# Coverage page section review

Current component/application ownership is defined by the [standalone boundary audit](standalone-component-boundaries.md). Section examples receive explicit inputs; whole-page and workflow examples retain application rules.

Documentation follows [application frame → page sections → shared pieces](component-documentation.md). Shared definitions retain one owner and canonical reference. Current Storybook examples use [global template capabilities](global-template-review.md); earlier Site-specific verification below is historical source evidence.

## Application frame

`AppShell` provides site chrome. `FormRoutePage` owns the form surface, progress, `PageHeader` (title, Back and help slot), validation feedback, transitions and Next. Coverage supplies its contextual help and the two sections below. Shared references: [application page template](http://localhost:6006/?path=/story/application-patterns-application-page-template--standard-form-page), [PageHeader](http://localhost:6006/?path=/story/layout-pageheader--default).

## Page sections and shared pieces

Eligibility's section review and approved manual-State behavior are implemented. Coverage component documentation includes both page sections and complete-page scenarios. Visual and accessibility acceptance for every Site remains open.

Review **Pages → Coverage** in page order. The page uses the existing application template and shared controls; each shared component retains one catalog definition.

| Main section | Pieces and behavior | Storybook |
| --- | --- | --- |
| Coverage questions | The category question plus any follow-up questions for the selected categories and additional product facts. Uses the real `CoverageQuestions` section, `CoverageCategorySelector`, configured fields, applicant groups and conditional sections | [Start with the category question](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--no-category-selected), [life](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--life-insurance-selected), [disability](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--disability-selected), [office overhead](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--office-overhead-selected), [supplemental health](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--supplemental-health-selected), [with spouse](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--with-spouse) |
| Product reveal | Product boxes containing coverage and rider notes/options for each applicant, followed by the total cost of all selected products. `ProductCatalog` composes the actual product boxes, applicant controls, notes, riders, estimated rates and inline `CoverageCart`/`TotalCostSummary` | [Interactive reveal](http://127.0.0.1:6007/?path=/story/coverage-commerce-productcatalog--interactive) |

The page header is already reviewed as a reusable `PageHeader`; it is not a Coverage section. The category question is a piece of Coverage questions, not a separate section called “Coverage choices.” Applicant notes/options, riders and the combined cost stay within Product reveal. Shared cart-drawer, rate-control and calculator examples keep their shared references rather than adding top-level Coverage sections.

## Conditional pieces

| Piece | Trigger and ownership | Shared reference |
| --- | --- | --- |
| Existing coverage portfolio | The page shows its trigger only when both `tpa-portfolio-enabled` and `tpa-verified` are true. Member/spouse portfolios use the existing drawer. Its contents are prototype demonstration data | [Member](http://localhost:6006/?path=/story/coverage-commerce-coverageportfoliodrawer--member-only), [with spouse](http://localhost:6006/?path=/story/coverage-commerce-coverageportfoliodrawer--with-spouse) |
| Additional product facts | The shared Coverage questions section derives extra fields from `coverageFactFieldIds(categoryProducts, watchedValues)` and renders their actual definitions. These can include work hours, self-employment duration and normalized product requirements | `FieldRenderer` inside the same section used by the page and its stories |
| Unavailable products | A restricted entry link can leave saved selections outside the current portfolio. A shared `PageAlert` offers explicit removal; the page does not silently delete saved selections | Existing Coverage entry-scope integration test |
| Dependent-only confirmation | Next pauses when selected coverage includes dependents and no member coverage. The existing `ConfirmationDialog` allows cancel or continuation | Existing shared dialog reference; verify with dependent-only selections in the Site journey |
| Added feedback | The first product addition opens the Coverage added drawer; later additions use the shared success `AppSnackbar` | Shared `CoverageSelectionFeedback` |

## Configuration and reuse findings

- The Library and prototype read the same generated JSON revision. Coverage fields and placements live in `fields.json` and `pages.json`; product definitions live in `products.json`; eligibility, amounts, rates and assignments remain in their existing rule/configuration owners.
- Coverage has exactly two reviewed sections, Coverage questions and Product reveal, in page order. Existing category/follow-up, product and cart story IDs are preserved; the redundant Coverage Introduction example has been removed in favor of the shared PageHeader reference.
- The category-question examples now resolve fields against current watched values and pass the active Site's `coverageQuestions` configuration. Their validation button belongs only to the review harness.
- The interactive product example uses the hook's available categories and the same `resolveApplicationCoverage` callback as the live page, with explicit fictional eligibility inputs. It demonstrates product shopping; it does not certify a Site's eligibility rules or execute the page's question-validation/Next flow.
- The standalone category question remains a shared reference for selection and error states. Product reveal starts with a fictional category selection so its review does not duplicate the category question.
- Page-owned orchestration retains question validation, product reveal, restricted-link warnings and dependent-only continuation. CoverageQuestions owns category selection, category follow-ups and extra fact rendering; the page continues to supply the same state and configuration.

Related: [Eligibility](eligibility-component-review.md), [cross-page reuse](page-reuse-review.md), [JSON catalog](../../public/catalog/README.md).

## Verification

- 47 focused tests passed across identity validation/part files, shared catalog consumption, Coverage products and restricted-entry handling, coverage question requirements and Eligibility manual-State behavior.
- TypeScript, targeted ESLint, the application build and the Storybook production build passed. Catalog/document checks passed after regenerating the saved component references and ABE reference tables.
- Browser checks against the clean Storybook build verified required-field errors for member/spouse questions, tobacco follow-ups appearing, the product loading state, available product controls, adding a coverage and the requested-coverage summary.
- The source/build audit found every current story ID in the build and no invalid saved component examples. Its broader verdict remains incomplete: two foundations stories lack traced source renders, and the legacy FieldGrid inventory references a missing story. These are outside this Coverage section review.
- The existing development preview returned a stale indexing error/blank frame during verification. The clean static build on port 6007 rendered correctly; no existing preview process was stopped.

## Component accounting audit

All 35 referenced component modules have Storybook references (34 direct, 1 through a parent). Every referenced story ID exists in the current build. This establishes component accounting, not complete Coverage scenario coverage.

| Component source | Reference | Example |
| --- | --- | --- |
| `app/RoutePage.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/application-patterns-application-page-template--standard-form-page) |
| `content/HelpChips.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/content-helpchips--default) |
| `content/QuickDecisionExplainer.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/content-quickdecision--drawer-explainer-content) |
| `content/QuickDecisionInfoBox.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/content-quickdecision--info-box-inline-collapse) |
| `coverage/CoverageSelectionFeedback.tsx` | direct-story-reference | [First add](http://127.0.0.1:6007/?path=/story/coverage-commerce-productcatalog--first-product-from-empty-cart), [later add](http://127.0.0.1:6007/?path=/story/coverage-commerce-productcatalog--additional-product-with-existing-cart) |
| `coverage/CoverageCart.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragecart--empty-drawer) |
| `coverage/CoverageCategorySelector.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragecategoryselector--default) |
| `coverage/CoveragePortfolioDrawer.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-coverageportfoliodrawer--member-only) |
| `coverage/CoverageQuestions.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragequestions--no-category-selected) |
| `coverage/EstimatedRate.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/components-estimated-rate--available) |
| `coverage/FeaturedBadge.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-product-adornments--side-by-side) |
| `coverage/ProductCatalog.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-productcatalog--interactive) |
| `coverage/ProductCostBreakdown.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-productcostbreakdown--monthly) |
| `coverage/QuickDecisionIcon.tsx` | composition-reference-only | [Story](http://127.0.0.1:6007/?path=/story/content-quickdecision--info-box-inline-collapse) |
| `coverage/QuickDecisionIndicator.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/content-quickdecision--mark-variants) |
| `coverage/RateFrequencyControl.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-ratefrequencycontrol--interactive) |
| `coverage/RateFrequencyToggle.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-ratefrequencytoggle--unchecked) |
| `coverage/ReferenceRateTableLink.tsx` | direct-story-reference | [Image](http://127.0.0.1:6007/?path=/story/coverage-reference-rate-table--image), [PDF](http://127.0.0.1:6007/?path=/story/coverage-reference-rate-table--pdf), [table](http://127.0.0.1:6007/?path=/story/coverage-reference-rate-table--html-table), [link](http://127.0.0.1:6007/?path=/story/coverage-reference-rate-table--link), [XML](http://127.0.0.1:6007/?path=/story/coverage-reference-rate-table--xml) |
| `coverage/TotalCostSummary.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/components-estimated-rate--cost-summaries) |
| `feedback/AppSnackbar.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/feedback-appsnackbar--success) |
| `feedback/EmptyState.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/feedback-emptystate--default) |
| `feedback/PageAlert.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/feedback-pagealert--error) |
| `forms/ConditionalGroup.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/forms-conditionalgroup--hidden-and-revealed) |
| `forms/ControlledFieldRenderer.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/feedback-technical-error--save-failure-preserves-answers) |
| `forms/FieldRenderer.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/application-patterns-application-page-template--standard-form-page) |
| `forms/RadioSelectionGroup.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/forms-radioselectiongroup--interactive) |
| `forms/SelectionGroup.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/forms-selectiongroup--checkbox-row-unselected) |
| `layout/AppDrawer.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/coverage-commerce-coveragecart--empty-drawer) |
| `layout/ApplicantSectionDivider.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/layout-applicantsectiondivider--member-section) |
| `layout/AppModal.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/overlays-appmodal--default) |
| `layout/CategoryCard.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/layout-categorycard--default) |
| `layout/CategoryHeader.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/layout-categoryheader--with-icon) |
| `layout/ConfirmationDialog.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/overlays-confirmationdialog--default) |
| `layout/ProductCard.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/layout-productcard--unselected) |
| `layout/SectionDivider.tsx` | direct-story-reference | [Story](http://127.0.0.1:6007/?path=/story/layout-sectiondivider--subsection-preset) |

The table counts source modules once; named exports are preserved in [the JSON audit](coverage-storybook-audit.json). MUI layout, inputs and stock icons remain package primitives demonstrated inside these compositions. The shared application frame is an explicit boundary; its existing layout/template stories own navigation and chrome.

### Complete-page and conditional examples

The requested Coverage scenario gaps are covered by real page examples under **Pages → Coverage → Whole page**. These examples compose the same two page sections; Whole page is a review entry, not an additional page section.

| Example | Behavior |
| --- | --- |
| [Interactive](http://127.0.0.1:6007/?path=/story/pages-coverage-whole-page--interactive) | Real category/question validation, product reveal, selection, cost summary, overlays and Next gating |
| [Entry link without products](http://127.0.0.1:6007/?path=/story/pages-coverage-whole-page--entry-link-without-products) | No product matches the captured campaign scope; the page shows its unavailable-link notice |
| [Entry link with unavailable selections](http://127.0.0.1:6007/?path=/story/pages-coverage-whole-page--entry-link-with-unavailable-selections) | A restored selection falls outside the AMA campaign scope; explicit removal preserves the permitted selection |
| [Dependent-only confirmation](http://127.0.0.1:6007/?path=/story/pages-coverage-whole-page--dependent-only-confirmation) | Fictional AVMA spouse-only Group Life selection passes validation; Next opens the actual Coverage confirmation, Cancel remains on the page, Continue finishes local navigation |
| [Reference rate table](http://127.0.0.1:6007/?path=/story/pages-coverage-whole-page--reference-rate-table) | Saved CSEA configuration supplies reference rates on the complete Coverage page |

**Pages → Shared → Reference rate table** separately demonstrates image, PDF, HTML-table, link and XML drawer formats. Image/PDF examples use existing CSEA assets; tabular/XML data is explicitly fictional. The examples use the existing component without changing rate policy.

Whole-page examples use saved catalog definitions, in-memory answers and the existing synthetic rate transport. Entry scope is installed per example and restored when it unmounts. They stop at a local completion message after real forward navigation rather than opening another applicant page.

**QD icon terminology:** There is one shared QD icon. A client can override it through `branding.icons.quickDecision`; if the image fails, the shared icon renders. The earlier phrase “configured QuickDecision artwork” referred to that override, not another Coverage component. Dedicated override/failure examples are an optional shared-icon follow-up and are outside the four requested Coverage gaps.

The subsequent section-organization correction moved category selection and extra fact rendering into the existing CoverageQuestions component, using the same state and field definitions. Its stories now include OO and SH examples. Product/rider behavior and pricing calculations are unchanged. The global audit still reports the two foundations tracing gaps and the stale legacy FieldGrid story reference outside Coverage.

The Library groups each page section once and lists the shared components demonstrated there. Coverage has only Coverage questions and Product reveal; the product review does not repeat the category question as a separate control.

Section-organization verification: the built Storybook index contains exactly `Pages/Coverage/Coverage questions` and `Pages/Coverage/Product reveal`. The Library regression check lists those two sections once each. Targeted page, question-requirement, Library and Storybook tracing checks passed, along with TypeScript, targeted ESLint and both production builds. Browser checks verified category selection revealing its follow-ups and the independent product reveal/loading flow.

## Product reveal state review

Product reveal now has 20 named examples, using saved catalog definitions and fictional applicant data. All scenarios run the real coverage hook and resolver. Prices use an explicitly local synthetic transport; the examples make no rate-service requests and do not modify saved catalog rules.

| State family | Examples |
| --- | --- |
| First and later additions | Empty cart → first product opens the Coverage added drawer; an existing cart → another product uses Added; clearing and re-adding within the same session retains later-add feedback |
| Eligibility | DI below work hours; missing hours; missing income; mixed eligible/ineligible categories; spouse eligibility differing from the member |
| Conflicts | One mutually exclusive product selected; restored application with conflicting selections; remove one selection to resolve validation |
| Applicant options | Selected waiting/benefit periods; WAEPA rider options; a zero-base CIR-only election |
| Estimates | Unavailable selected-product estimate; configured CSEA reference presentation; persistent loading; persistent recalculation |
| Other boundaries | Unresolved saved product requirements; no category selected |

Add coverage remains usable, preserving the recorded project decision. Eligibility and exclusivity continue to block continuation through the existing validator; the review harness has a Check selection requirements action to demonstrate it. Ineligible applicants/products are filtered by the same live presentation rules.

CoverageSelectionFeedback is the shared owner of the first-add cart drawer and later-add snackbar. Both the page and these examples mount it. A restored nonempty cart counts as already established. The selected-product summary remains visible for unavailable or zero estimates; unavailable is never rendered as a zero premium.

Browser verification confirmed DI unavailable at 20 hours and available at the saved 30-hour threshold, first-add drawer feedback, later-add snackbar feedback and both products appearing in the combined summary. Unit/integration checks cover the same transitions, restored carts, conflicts, preserved incomplete-eligibility Add behavior and unavailable/zero totals. The application and Storybook production builds passed.

The exclusivity review also caught a normalization issue: a temporarily empty amount-choice list could overwrite saved benefit amounts with zero. Normalization now preserves those amounts until a valid replacement exists, and conflict validation takes precedence over its derivative no-amount message. A regression test verifies both saved amounts survive the conflict and remain intact after one plan is removed. A newly selected product with no supplied benefit amount shows the missing-information rate state, without a zero quote or a technical-failure message.

Final focused verification: 74 tests passed across product cards/feedback, saved-catalog scenario inputs, cart totals and Coverage runtime integration. The separate Library/page checks passed as well. Browser review verified the work-hour threshold and first/later addition surfaces; catalog/story references remain in sync. The broader source audit retains its three unrelated foundations/legacy-reference gaps.

## Shared rate display states

The shared rate display (`src/components/coverage/EstimatedRate.tsx`, shown as **Pages → Shared → Rate display**) is driven by the typed `RateDisplayState` union in `src/domain/rateDisplay.ts`.

| State | Presentation |
| --- | --- |
| Available | Price and billing suffix, including a valid returned zero premium |
| Loading/recalculating | Reserved price space with an accessible loading indicator |
| Unavailable | Explicit technical failure fetching or validating a mock-rate response |
| Reference table | The shared View rate table link and its drawer |
| Needs information | A prompt to complete the inputs required for an estimate |
| Provided separately | A separately-priced product/rider or total that cannot be calculated from the shown numeric prices |
| Hidden | No rate display when pricing is suppressed/disabled by configuration |

Mock rates are requested for displayed eligible applicant/product options before selection. A missing number alone does not indicate a technical failure. Stale results cannot replace a newer input generation. Configured reference/hidden modes avoid calculated-rate requests. Product cards, the quote tool, cart rows and totals use the same renderer and state model, preserving Association-specific price suppression.

Storybook examples include each state plus cost summaries. The mock boundary retains the failure category so missing inputs and pricing configuration do not become technical-unavailable UI. Mixed numeric and reference/separately-provided costs do not produce a misleading partial numeric total.

Rate-display verification: 74 focused tests passed across the state model, mock-rate hook, shared renderer, product cards, cart, quote tool, Coverage, payment policy and work-hour collection. TypeScript, targeted ESLint and both production builds passed. Browser review confirmed prices on unselected product cards and the reference-table link opening its rate drawer. The broader Storybook source audit still reports the three previously recorded foundations/legacy-reference gaps.

## October 27 scenario completion

Added the five whole-page stories and five shared reference-rate format examples. Integration checks exercise empty entry scope and cleanup, removal of unavailable selections, whole-page validation, dependent-only Next/Cancel/Continue and the saved reference-rate drawer. The Library still lists exactly Coverage questions and Product reveal as page sections. Site-wide visual/accessibility acceptance remains a separate open review boundary.

Current verification: 46 focused tests passed across complete-page scenarios, restricted entry handling, reference-rate formats, saved scenario rules, Library grouping and Storybook source tracing. TypeScript, targeted ESLint, catalog/document checks and the application and Storybook production builds passed. Browser review confirmed the actual dependent-only dialog/Cancel, the empty-link notice and the image/HTML reference drawers. The in-app browser leaves the PDF iframe blank; the Open PDF link remains available, so inline PDF visual acceptance is browser-dependent. The three previously recorded foundations/legacy-reference audit gaps remain outside Coverage.

## October 27 checkpoint cleanup

The three audit errors recorded above are resolved: the analyzer now recognizes the existing foundations documentation components while keeping them outside applicant component accounting, and the historical FieldGrid reference uses its current stacked-fields story. The clean Storybook build contains all 306 non-admin story IDs, with zero source/reference audit errors. The component consolidation register also includes CoverageSelectionFeedback and ReferenceRateTableLink. This cleanup does not close the remaining page/state, visual or accessibility review boundaries.
