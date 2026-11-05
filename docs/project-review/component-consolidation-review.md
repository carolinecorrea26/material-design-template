# Component representation and consolidation review

Reviewed 111 canonical component records from public/catalog/components/components.json against their source modules and generated production placement references. Every component has an explicit family and review decision. This is a source review; source paths include conditional variants and do not prove that every variant has been visually reviewed or mounted. Review source hashes and regenerate with npm run components:review after changes.

## Component structure

Application frame → page sections → shared pieces describes primary ownership; Storybook category and reuse count are separate. Contains references direct registered source dependencies, including conditional paths; internal parts describe exports, native elements, actions and slots without inventing extra component identities. See [the documentation contract](component-documentation.md).

| Role | Components |
| --- | --- |
| Application frame | 14 |
| Page sections | 24 |
| Shared pieces | 73 |

| Component | Role | Contains components | Internal parts |
| --- | --- | --- | --- |
| ApplicationDocumentPreview | Shared pieces | — | — |
| ApplicationReviewDrawerContent | Shared pieces | QuickDecisionExplainer | — |
| HealthInformationHelp | Shared pieces | AppDrawer, HelpChips | — |
| HelpChips | Shared pieces | — | — |
| LegalDocList | Shared pieces | — | — |
| ReferenceRateTableLink | Shared pieces | AppDrawer, Link | — |
| AppDrawer | Shared pieces | — | — |
| AppModal | Shared pieces | Button | — |
| ConfirmationDialog | Shared pieces | AppModal | — |
| CookieDialog | Shared pieces | Link | — |
| CoveragePortfolioDrawer | Shared pieces | AppDrawer | — |
| MemberVerification | Shared pieces | Button, FieldRenderer | — |
| SendApplicationDialog | Shared pieces | AppModal | — |
| EligibilitySections | Page sections | ApplicantSectionDivider, DynamicList, EligibilityFields, FieldGrid, FieldRenderer | — |
| PhysicianInformation | Shared pieces | AddressFields, FieldGrid, FieldRenderer, SectionDivider | — |
| ApplicationErrorState | Page sections | ApplicationRecoveryActions, FormShell, PageShell, SiteSupport | — |
| ApplicationRecoveryActions | Shared pieces | Button, Link | — |
| AppSnackbar | Shared pieces | — | — |
| CoverageSelectionFeedback | Shared pieces | AppDrawer, AppSnackbar | — |
| EmptyState | Shared pieces | — | — |
| ExpiringCodeAlert | Shared pieces | Link | — |
| PageAlert | Shared pieces | — | — |
| ProgressSavedSnackbar | Shared pieces | AppSnackbar | — |
| RecoveryAlert | Shared pieces | AppDrawer, ApplicationRecoveryActions, Button, Link, PageAlert, SiteSupport | — |
| ResendCountdownRow | Shared pieces | Button | — |
| SessionExpiryAlert | Shared pieces | Button | — |
| SiteSupport | Shared pieces | Link | — |
| AddressFields | Shared pieces | FieldGrid, FieldRenderer | — |
| Button | Shared pieces | — | — |
| ConditionalGroup | Shared pieces | — | — |
| ControlledFieldRenderer | Shared pieces | FieldRenderer | — |
| FieldRenderer | Shared pieces | Link, PhoneField, RadioSelectionGroup, SelectionGroup | — |
| Link | Shared pieces | — | — |
| PhoneField | Shared pieces | — | — |
| RadioSelectionGroup | Shared pieces | SelectionGroup | — |
| SelectionGroup | Shared pieces | — | — |
| FormRoutePage | Application frame | FormShell, PageAlert, PageHeader, PageNav, PageShell, PageTransitionSkeleton, ProgressSavedSnackbar, ProgressStep | Surface header (slot): Optional full-width header within FormShell, above the padded form body. Advisor login supplies its themed title banner.<br>Form (native-element): Owns form state, validation and submit handling; FormShell supplies the visual surface.<br>Page content (slot): The page supplies its sections and shared pieces. This slot is not a fixed list of sections.<br>Contextual help (slot): The page supplies help chips and their content; PageHeader places the help below the heading. |
| FormShell | Application frame | — | — |
| PageHeader | Application frame | PageTitle | — |
| PageNav | Application frame | Button | Next button (action): Submits the associated form with shared disabled and transition states. |
| PageShell | Application frame | PageTitle | — |
| PageTitle | Application frame | — | Back button (action): Optional back action rendered beside the heading; the page template owns navigation. |
| ProgressStep | Application frame | — | Breadcrumbs (export): Pages within the active main step, such as Membership, Eligibility, Beneficiary and Contact; shown when multiple applicable entries exist. |
| PaymentSections | Page sections | CategoryCard, FieldRenderer, ProductCard, SectionDivider | Payment feedback (slot): Caller supplies mock authorization and submission feedback.<br>Shared payment elections (slot): Explicit shared controls; page resolves common choices and policy.<br>Product costs (slot): Caller supplies rate summaries or reference tables within each ProductCard. |
| SharedPaymentControls | Shared pieces | FieldRenderer | Payment elections (slot): Explicit method/frequency definitions and resolved common-choice state. Updates canonical product bindings through the supplied setter. |
| ProfilePersonalInformation | Shared pieces | ConditionalGroup, FieldGrid, FieldRenderer | — |
| ProfileSections | Page sections | ApplicantSectionDivider, ConditionalGroup, DynamicList, FieldRenderer, PhysicianInformation, ProfilePersonalInformation, SectionDivider | Personal information (slot): Independent member/spouse fields and license, residence and travel follow-ups.<br>Other coverage (slot): Life and disability follow-ups, supplied replacement notice and repeated carrier records. DynamicList owns record dialogs.<br>Financial questionnaire (slot): Member financial details and local self-employment follow-ups; the page resolves policy participation. |
| QuickDecisionExplainer | Shared pieces | — | — |
| QuickDecisionIndicator | Shared pieces | — | — |
| QuickDecisionInfoBox | Shared pieces | QuickDecisionExplainer | — |
| ApplicationEstimate | Shared pieces | AppDrawer, Button, EstimatedRate | — |
| CoverageCart | Shared pieces | AppModal, EmptyState, EstimatedRate, ProductCard, RateFrequencyControl, TotalCostSummary | — |
| CoverageCategorySelector | Shared pieces | ControlledFieldRenderer | — |
| CoverageNeedsCalculator | Shared pieces | FieldRenderer | — |
| CoverageOptionsPanel | Shared pieces | QuickDecisionIndicator, QuickDecisionInfoBox | — |
| CoverageQuestions | Page sections | ApplicantSectionDivider, ConditionalGroup, CoverageCategorySelector, FieldRenderer, SectionDivider | — |
| EligibilityFields | Shared pieces | ControlledFieldRenderer, FieldRenderer | — |
| EstimatedRate | Shared pieces | ReferenceRateTableLink | — |
| EstimatorProductCard | Shared pieces | ControlledFieldRenderer, EstimatedRate, FeaturedBadge, ProductCard | — |
| FeaturedBadge | Shared pieces | — | — |
| ProductCatalog | Page sections | ApplicantSectionDivider, CategoryCard, CategoryHeader, ControlledFieldRenderer, CoverageCart, EstimatedRate, FeaturedBadge, ProductCard, ProductCostBreakdown, QuickDecisionInfoBox | — |
| ProductCostBreakdown | Shared pieces | EstimatedRate, Link | — |
| QuoteCalculator | Shared pieces | AppDrawer, Button, CategoryHeader, CoverageCategorySelector, EmptyState, FieldRenderer, PageHeader, RateFrequencyControl, SectionDivider | — |
| RateFrequencyControl | Shared pieces | RateFrequencyToggle | — |
| RateFrequencyToggle | Shared pieces | — | — |
| TotalCostSummary | Shared pieces | EstimatedRate | — |
| ReceiptApplicationSummary | Page sections | ApplicantSectionDivider | — |
| ReceiptConfirmation | Page sections | Button, ReceiptNextSteps | — |
| ReceiptCoverageDecision | Shared pieces | ApplicantSectionDivider, ProductCard | — |
| ReceiptDecisions | Page sections | — | — |
| ReceiptNextSteps | Page sections | — | — |
| BeneficiaryProductRecords | Page sections | Button, DynamicListItem, ProductCard | — |
| DynamicList | Shared pieces | AppModal, Button, DynamicListItem, FieldGrid, FieldRenderer | — |
| DynamicListItem | Shared pieces | Button | — |
| HealthQuestion | Shared pieces | DynamicList, FieldRenderer | Answer (slot): Explicit field definition rendered by FieldRenderer.<br>Follow-up details (slot): Caller resolves visibility. Direct fields or DynamicList records use independent collection bindings. |
| HealthQuestionList | Shared pieces | ApplicantSectionDivider | Questions and applicant answers (slot): Caller supplies question identities, order, applicant and content. Groups corresponding questions without merging answer bindings. |
| YesNoDetailList | Shared pieces | DynamicList, FieldRenderer | — |
| LegalReviewSection | Shared pieces | Button | Disclosure content (slot): Supplied legal statement, native notice blocks or electronic disclosure.<br>Print (action): Calls the supplied print action. The page currently prints the browser document. |
| ReviewSections | Page sections | ApplicantSectionDivider, Button, FieldRenderer, LegalReviewSection, ReviewStatement | Document preview (slot): Caller supplies the application readout; its adapter resolves saved fields and edit targets.<br>Download application PDF (action): Page supplies the PDF download callback; the view does not build application data. |
| ReviewStatement | Shared pieces | — | — |
| BusinessInformation | Page sections | AddressFields, FieldRenderer, SectionDivider | — |
| ContactSections | Page sections | ApplicantSectionDivider, BusinessInformation, FieldRenderer, ResidentialAddress, SpouseContact | — |
| ResidentialAddress | Page sections | AddressFields, FieldRenderer | — |
| SpouseContact | Page sections | FieldRenderer | — |
| ApplicationPreview | Shared pieces | MobilePreviewFrame | — |
| AssociationIntroduction | Page sections | — | — |
| HomeCoverageSection | Page sections | CoverageOptionsPanel | — |
| HomeHero | Page sections | Button, EligibilityFields | — |
| HowApplyingWorksPanel | Shared pieces | AppDrawer, ApplicationPreview, ApplicationReviewDrawerContent, QuickDecisionExplainer | — |
| MobilePreviewFrame | Shared pieces | — | — |
| UnderwriterCredentials | Page sections | — | — |
| AdditionalMembershipInformation | Page sections | FieldGrid, FieldRenderer, SectionDivider | — |
| MemberInformation | Page sections | FieldGrid, FieldRenderer | — |
| MembershipHelp | Page sections | AppDrawer, HelpChips | — |
| MembershipStatus | Page sections | FieldRenderer, Link | — |
| ApplicantSectionDivider | Shared pieces | — | — |
| CategoryCard | Shared pieces | CategoryHeader | — |
| CategoryHeader | Shared pieces | — | — |
| DetailsTable | Shared pieces | — | — |
| FieldGrid | Shared pieces | — | — |
| ProductCard | Shared pieces | Link, QuickDecisionIndicator | Product heading (native-element): Consistent product title at weight 800, optional brochure link, QD indicator and header action.<br>Product content (slot): Coverage, beneficiary, payment, quote or receipt content supplied by the caller. |
| SectionDivider | Shared pieces | — | — |
| AppBody | Application frame | — | — |
| AppFooter | Application frame | AppModal, LegalDocList, Link | — |
| AppHeader | Application frame | AppDrawer, AppMenu, Button, ClientHelpBanner, Link | — |
| AppMenu | Application frame | AppDrawer, Button, HowApplyingWorksPanel, Link, QuickDecisionExplainer | — |
| AppShell | Application frame | AppBody, AppFooter, AppHeader, CookieDialog, OfflineBanner | — |
| ClientHelpBanner | Application frame | Button | — |
| OfflineBanner | Application frame | — | — |
| PageTransitionSkeleton | Shared pieces | — | — |
| ProcessingStatusPage | Shared pieces | ApplicationErrorState, RecoveryAlert | — |

## Findings

- Consolidated now: SiteSupport replaces the receipt's local Questions block and appears on maintenance and every error page. Email and site share contact resolution/copy. Existing email transport markup remains separate.
- Aligned now: shared recovery copy/actions prevent different recovery wording and duplicate alerts on the full page; local incident context carries safe support references without service calls. The controlled field adapter is documented under Forms. Configured name groups share a responsive row on larger screens and stack on mobile, with no extra vertical grid gap.
- Highest-value next consolidation: PageHeader/PageTitle/PageShell header APIs and legacy grid metadata/address layout naming. LoadingOverlay was deleted because it had no production usage; catalog generation now rejects unused components. ProcessingStatusPage has bounded pending, complete and timeout variants.
- Already shared: radio rows use SelectionGroup; controlled fields use FieldRenderer; yes/no detail records use DynamicList; frequency control uses its styled switch; modal workflows use shared shells; price surfaces use EstimatedRate. These are layers of composition, not independent duplicate implementations.
- Preserve distinctions: help-ribbon contact vs administrator support; quote card vs full applicant/rider catalog; transient snackbar vs persistent page alert; skeleton vs external processing; business policy vs visual surface. Merge only repeated markup/data that has the same meaning.
- ApplicationPreview and MobilePreviewFrame represent decorative Home artwork. Their simulated fields are not application answers or actual applicant screen layouts.
- Home, Membership, Eligibility and Coverage have reviewed section examples. Coverage also has whole-page scenarios and reference-rate format examples. Beneficiary has real whole-page scenarios with local section ownership documented in its page review. Contact has both isolated section examples and real whole-page scenarios using ContactSections. Profile now has seven whole-page scenarios and standalone section examples with its own page review. Review now has standalone document/legal pieces, section examples and real whole-page policy scenarios. Later application pages still require the planned page-by-page review; source references alone are not completed section/state coverage.

## Consolidation queue

| Component | Decision | Next step |
| --- | --- | --- |
| ReferenceRateTableLink | Composition; aligned | One shared drawer supports saved image, PDF, HTML table, link and XML reference formats; preserve reference pricing separately from calculated estimates. |
| ApplicationErrorState | Composition; aligned | One card-contained utility-page layout renders large primary-colored error codes or state icons, messages, plain recovery links and the standard SiteSupport card. Maintenance has no navigation actions; 404 Home/Resume links preserve application state. |
| ApplicationRecoveryActions | Composition; aligned | One compact responsive action row. Maintenance has no navigation actions. Only explicit Start new invokes the reset callback; retries require an explicit local callback. |
| CoverageSelectionFeedback | Composition; aligned | Shared AppDrawer/CoverageCart for the first addition and AppSnackbar for subsequent additions; keep selection state and feedback timing at the caller. |
| RecoveryAlert | Composition; aligned | One RecoveryAlert uses stable local codes and approved copy, preserves answers/focus, and carries the same opaque support reference into the full page and support drawer. |
| SiteSupport | Consolidated now | Receipt, maintenance and errors share the standard support card. Emails share its resolver/copy while retaining table markup suitable for email clients. |
| ControlledFieldRenderer | Adapter; aligned | Moved to Forms with its own adapter example. It already calls FieldRenderer; keep one field/control implementation. |
| PageHeader | Consolidate next | Make PageHeader the single title/subtitle/back/help composition used by PageShell and FormRoutePage. |
| PageShell | Consolidate next | Delegate its duplicate header/error/help arrangement to PageHeader and PageAlert; keep width/actions/layout ownership here. |
| PageTitle | Consolidate next | Retain as an internal heading primitive if needed; avoid two public header APIs with overlapping title/back/subhead props. |
| QuickDecisionInfoBox | Consolidate selectively | Already reuses the explainer/mark, but its promotional lead sentence is local. Put shared explanation copy in one content source when the Coverage page is reviewed. |
| EligibilityFields | Composition; aligned | The application Eligibility page and quote tools share ZIP/State/Birthday rendering and manual-State behavior; their adapters retain value and validation ownership. |
| EstimatorProductCard | Consolidate selectively | Share the product surface, stored field controls and EstimatedRate. Keep its member-only quote behavior distinct from ProductCatalog. |
| ProductCatalog | Consolidate selectively | Owns applicant/rider/product policy. Extract repeated view fragments only; do not turn the quote card into the full business-policy orchestrator. |
| ProductCostBreakdown | Consolidate selectively | Line items and fees differ from a grand-total summary. Share label/value/amount rows if their markup drifts; retain fee/disclosure semantics. |
| TotalCostSummary | Consolidate selectively | Keep its product/grand-total role. EstimatedRate is already shared with breakdown/card prices. |
| DynamicList | Keep; grouping aligned | The add/edit dialog retains configured first/last-name rows on larger screens and stacks them on mobile. Other fields remain stacked. Retain one list editor and existing remove confirmation. |
| ApplicationPreview | Illustration | Decorative simulated controls do not collect answers. Keep separate from real form controls and do not count them as field coverage. |
| MobilePreviewFrame | Illustration infrastructure | Used inside the Home illustration. It is not the applicant viewport or form layout; group its examples with decorative Home content. |
| ProductCard | Composition; aligned | Owns the shared product title, weight 800, optional brochure link/QD mark, description and content slot across Coverage, Beneficiary, Payment, quote estimates and Receipt. |
| AppFooter | Consolidate selectively | Keep legal/underwriter identity and address content. Share contact resolution for any Questions card, without merging the complete footer into that card. |
| ProcessingStatusPage | Composition; aligned | A bounded local status now leads to completion or recovery feedback. Unconfirmed payment/submission examples use the full recovery page without repeat actions. |

## Full component review

Consumers counts distinct production source compositions, not rendered instances or unconditional routes. Open the canonical Storybook example from each component's saved story ID. Machine-readable evidence, source hashes and consumer paths are recorded in component-consolidation-review.json.

| Component | Family | Consumers | Decision | Assessment / next step |
| --- | --- | --- | --- | --- |
| [ApplicationDocumentPreview](../../src/components/content/ApplicationDocumentPreview.tsx) | Content and documents | 1 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [ApplicationReviewDrawerContent](../../src/components/content/ApplicationReviewDrawerContent.tsx) | Content and documents | 1 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [HealthInformationHelp](../../src/components/health/HealthInformationHelp.tsx) | Content and documents | 6 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [HelpChips](../../src/components/content/HelpChips.tsx) | Content and documents | 5 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [LegalDocList](../../src/components/content/LegalDocList.tsx) | Content and documents | 1 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [ReferenceRateTableLink](../../src/components/coverage/ReferenceRateTableLink.tsx) | Content and documents | 2 | Composition; aligned | One shared drawer supports saved image, PDF, HTML table, link and XML reference formats; preserve reference pricing separately from calculated estimates. |
| [AppDrawer](../../src/components/layout/AppDrawer.tsx) | Dialogs and drawers | 15 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [AppModal](../../src/components/layout/AppModal.tsx) | Dialogs and drawers | 6 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [ConfirmationDialog](../../src/components/layout/ConfirmationDialog.tsx) | Dialogs and drawers | 2 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [CookieDialog](../../src/components/layout/CookieDialog.tsx) | Dialogs and drawers | 1 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [CoveragePortfolioDrawer](../../src/components/coverage/CoveragePortfolioDrawer.tsx) | Dialogs and drawers | 1 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [MemberVerification](../../src/components/verification/MemberVerification.tsx) | Dialogs and drawers | 1 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [SendApplicationDialog](../../src/components/layout/SendApplicationDialog.tsx) | Dialogs and drawers | 2 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [EligibilitySections](../../src/components/eligibility/EligibilitySections.tsx) | Eligibility and physician sections | 1 | Keep | Keep page-specific policy and applicant structure above shared fields; PhysicianInformation has canonical member/spouse fields; Profile composition and scenarios are documented in profile-component-review.md. |
| [PhysicianInformation](../../src/components/forms/PhysicianInformation.tsx) | Eligibility and physician sections | 1 | Keep | Keep page-specific policy and applicant structure above shared fields; PhysicianInformation has canonical member/spouse fields; Profile composition and scenarios are documented in profile-component-review.md. |
| [ApplicationErrorState](../../src/components/feedback/ApplicationErrorState.tsx) | Feedback and recovery | 2 | Composition; aligned | One card-contained utility-page layout renders large primary-colored error codes or state icons, messages, plain recovery links and the standard SiteSupport card. Maintenance has no navigation actions; 404 Home/Resume links preserve application state. |
| [ApplicationRecoveryActions](../../src/components/feedback/ApplicationRecoveryActions.tsx) | Feedback and recovery | 2 | Composition; aligned | One compact responsive action row. Maintenance has no navigation actions. Only explicit Start new invokes the reset callback; retries require an explicit local callback. |
| [AppSnackbar](../../src/components/feedback/AppSnackbar.tsx) | Feedback and recovery | 3 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [CoverageSelectionFeedback](../../src/components/coverage/CoverageSelectionFeedback.tsx) | Feedback and recovery | 1 | Composition; aligned | Shared AppDrawer/CoverageCart for the first addition and AppSnackbar for subsequent additions; keep selection state and feedback timing at the caller. |
| [EmptyState](../../src/components/feedback/EmptyState.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [ExpiringCodeAlert](../../src/components/feedback/ExpiringCodeAlert.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [PageAlert](../../src/components/feedback/PageAlert.tsx) | Feedback and recovery | 3 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [ProgressSavedSnackbar](../../src/components/feedback/ProgressSavedSnackbar.tsx) | Feedback and recovery | 1 | Internal primitive | A semantic AppSnackbar preset. Keep confirmed-save timing at callers; do not show Saved for an unacknowledged request. |
| [RecoveryAlert](../../src/components/feedback/RecoveryAlert.tsx) | Feedback and recovery | 2 | Composition; aligned | One RecoveryAlert uses stable local codes and approved copy, preserves answers/focus, and carries the same opaque support reference into the full page and support drawer. |
| [ResendCountdownRow](../../src/components/feedback/ResendCountdownRow.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [SessionExpiryAlert](../../src/components/feedback/SessionExpiryAlert.tsx) | Feedback and recovery | 1 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [SiteSupport](../../src/components/layout/SiteSupport.tsx) | Feedback and recovery | 3 | Consolidated now | Receipt, maintenance and errors share the standard support card. Emails share its resolver/copy while retaining table markup suitable for email clients. |
| [AddressFields](../../src/components/forms/AddressFields.tsx) | Generic form controls | 3 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| Button | Generic form controls | 31 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [ConditionalGroup](../../src/components/forms/ConditionalGroup.tsx) | Generic form controls | 3 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [ControlledFieldRenderer](../../src/components/forms/ControlledFieldRenderer.tsx) | Generic form controls | 5 | Adapter; aligned | Moved to Forms with its own adapter example. It already calls FieldRenderer; keep one field/control implementation. |
| [FieldRenderer](../../src/components/forms/FieldRenderer.tsx) | Generic form controls | 29 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| Link | Generic form controls | 14 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [PhoneField](../../src/components/forms/PhoneField.tsx) | Generic form controls | 1 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [RadioSelectionGroup](../../src/components/forms/RadioSelectionGroup.tsx) | Generic form controls | 1 | Composition; already shared | Already composes SelectionGroup. Keep radio semantics, labels and helper/error state separate from the visual row. |
| [SelectionGroup](../../src/components/forms/SelectionGroup.tsx) | Generic form controls | 2 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [FormRoutePage](../../src/app/RoutePage.tsx) | Page layout and navigation | 18 | Keep | Preserve layout, application state and navigation boundaries. |
| [FormShell](../../src/components/layout/FormShell.tsx) | Page layout and navigation | 6 | Internal primitive | A styled Paper with width only. Keep internal to the page composition rather than implying a second form engine. |
| [PageHeader](../../src/components/layout/PageHeader.tsx) | Page layout and navigation | 5 | Consolidate next | Make PageHeader the single title/subtitle/back/help composition used by PageShell and FormRoutePage. |
| [PageNav](../../src/components/navigation/PageNav.tsx) | Page layout and navigation | 1 | Keep | Preserve layout, application state and navigation boundaries. |
| [PageShell](../../src/components/layout/PageShell.tsx) | Page layout and navigation | 6 | Consolidate next | Delegate its duplicate header/error/help arrangement to PageHeader and PageAlert; keep width/actions/layout ownership here. |
| [PageTitle](../../src/components/layout/PageTitle.tsx) | Page layout and navigation | 2 | Consolidate next | Retain as an internal heading primitive if needed; avoid two public header APIs with overlapping title/back/subhead props. |
| [ProgressStep](../../src/components/navigation/ProgressStep.tsx) | Page layout and navigation | 1 | Keep | Preserve layout, application state and navigation boundaries. |
| [PaymentSections](../../src/components/payment/PaymentSections.tsx) | Payment composition | 1 | Keep | Page resolves collection, product policy, field definitions, rate display and submission. Standalone sections and shared controls receive explicit inputs; canonical per-product bindings remain independent. |
| [SharedPaymentControls](../../src/components/forms/SharedPaymentControls.tsx) | Payment composition | 1 | Keep | Page resolves collection, product policy, field definitions, rate display and submission. Standalone sections and shared controls receive explicit inputs; canonical per-product bindings remain independent. |
| [ProfilePersonalInformation](../../src/components/profile/ProfilePersonalInformation.tsx) | Profile personal fields | 1 | Keep | Shared adult personal-field composition with independent member/spouse IDs and local license/residence/travel follow-ups. |
| [ProfileSections](../../src/components/profile/ProfileSections.tsx) | Profile sections | 1 | Keep | One production composition for personal, physician, Other coverage and financial questionnaire sections. Page resolves participation and coverage policy; standalone examples receive explicit inputs. |
| [QuickDecisionExplainer](../../src/components/content/QuickDecisionExplainer.tsx) | QuickDecision content and marks | 5 | Keep | Shared explainer/brand mark with distinct compact indicator, expandable panel and full explanation. |
| [QuickDecisionIndicator](../../src/components/coverage/QuickDecisionIndicator.tsx) | QuickDecision content and marks | 2 | Internal primitive | Thin preset around QuickDecisionIcon. Keep one configured artwork source; this is a useful compact semantic preset, not a new brand implementation. |
| [QuickDecisionInfoBox](../../src/components/content/QuickDecisionInfoBox.tsx) | QuickDecision content and marks | 2 | Consolidate selectively | Already reuses the explainer/mark, but its promotional lead sentence is local. Put shared explanation copy in one content source when the Coverage page is reviewed. |
| [ApplicationEstimate](../../src/components/coverage/ApplicationEstimate.tsx) | Quote and coverage | 1 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageCart](../../src/components/coverage/CoverageCart.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageCategorySelector](../../src/components/coverage/CoverageCategorySelector.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageNeedsCalculator](../../src/components/coverage/CoverageNeedsCalculator.tsx) | Quote and coverage | 1 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageOptionsPanel](../../src/components/coverage/CoverageOptionsPanel.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageQuestions](../../src/components/coverage/CoverageQuestions.tsx) | Quote and coverage | 1 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [EligibilityFields](../../src/components/forms/EligibilityFields.tsx) | Quote and coverage | 3 | Composition; aligned | The application Eligibility page and quote tools share ZIP/State/Birthday rendering and manual-State behavior; their adapters retain value and validation ownership. |
| [EstimatedRate](../../src/components/coverage/EstimatedRate.tsx) | Quote and coverage | 8 | Composition; already shared | Already handles amount/unavailable/calculating across cards and totals, including reserved dimensions. Reuse this instead of local price spinners. |
| [EstimatorProductCard](../../src/components/coverage/EstimatorProductCard.tsx) | Quote and coverage | 1 | Consolidate selectively | Share the product surface, stored field controls and EstimatedRate. Keep its member-only quote behavior distinct from ProductCatalog. |
| [FeaturedBadge](../../src/components/coverage/FeaturedBadge.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [ProductCatalog](../../src/components/coverage/ProductCatalog.tsx) | Quote and coverage | 1 | Consolidate selectively | Owns applicant/rider/product policy. Extract repeated view fragments only; do not turn the quote card into the full business-policy orchestrator. |
| [ProductCostBreakdown](../../src/components/coverage/ProductCostBreakdown.tsx) | Quote and coverage | 1 | Consolidate selectively | Line items and fees differ from a grand-total summary. Share label/value/amount rows if their markup drifts; retain fee/disclosure semantics. |
| [QuoteCalculator](../../src/app/workflows/QuoteCalculator.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [RateFrequencyControl](../../src/components/coverage/RateFrequencyControl.tsx) | Quote and coverage | 2 | Composition; already shared | Already owns labels/options and delegates to RateFrequencyToggle. Keep as the public coverage-frequency control. |
| [RateFrequencyToggle](../../src/components/coverage/RateFrequencyToggle.tsx) | Quote and coverage | 1 | Internal primitive | Styled switch inside RateFrequencyControl; expose monthly/annual examples through the labeled control rather than treating both as separate workflows. |
| [TotalCostSummary](../../src/components/coverage/TotalCostSummary.tsx) | Quote and coverage | 2 | Consolidate selectively | Keep its product/grand-total role. EstimatedRate is already shared with breakdown/card prices. |
| [ReceiptApplicationSummary](../../src/components/receipt/ReceiptApplicationSummary.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [ReceiptConfirmation](../../src/components/receipt/ReceiptConfirmation.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [ReceiptCoverageDecision](../../src/components/receipt/ReceiptCoverageDecision.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [ReceiptDecisions](../../src/components/receipt/ReceiptDecisions.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [ReceiptNextSteps](../../src/components/receipt/ReceiptNextSteps.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [BeneficiaryProductRecords](../../src/components/beneficiary/BeneficiaryProductRecords.tsx) | Repeated records | 1 | Keep | YesNoDetailList already composes DynamicList; DynamicList already composes DynamicListItem and FieldRenderer. |
| [DynamicList](../../src/components/forms/DynamicList.tsx) | Repeated records | 4 | Keep; grouping aligned | The add/edit dialog retains configured first/last-name rows on larger screens and stacks them on mobile. Other fields remain stacked. Retain one list editor and existing remove confirmation. |
| [DynamicListItem](../../src/components/forms/DynamicListItem.tsx) | Repeated records | 2 | Internal primitive | Already used by DynamicList. Keep as its record-summary/action row instead of another list manager. |
| [HealthQuestion](../../src/components/forms/HealthQuestion.tsx) | Repeated records | 1 | Keep | YesNoDetailList already composes DynamicList; DynamicList already composes DynamicListItem and FieldRenderer. |
| [HealthQuestionList](../../src/components/forms/HealthQuestionList.tsx) | Repeated records | 1 | Keep | YesNoDetailList already composes DynamicList; DynamicList already composes DynamicListItem and FieldRenderer. |
| [YesNoDetailList](../../src/components/forms/YesNoDetailList.tsx) | Repeated records | 3 | Composition; already shared | Already uses FieldRenderer and DynamicList for yes/no follow-up records. Do not reimplement medical list controls. |
| [LegalReviewSection](../../src/components/content/LegalReviewSection.tsx) | Review composition | 1 | Keep | Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface. |
| [ReviewSections](../../src/components/review/ReviewSections.tsx) | Review composition | 1 | Keep | Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface. |
| [ReviewStatement](../../src/components/forms/ReviewStatement.tsx) | Review composition | 1 | Keep | Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface. |
| [BusinessInformation](../../src/components/contact/BusinessInformation.tsx) | Reviewed Contact sections | 1 | Keep | Standalone residential, business/employer and spouse views share AddressFields. ContactSections composes supplied sections; application adapters resolve participation. |
| [ContactSections](../../src/components/contact/ContactSections.tsx) | Reviewed Contact sections | 1 | Keep | Standalone residential, business/employer and spouse views share AddressFields. ContactSections composes supplied sections; application adapters resolve participation. |
| [ResidentialAddress](../../src/components/contact/ResidentialAddress.tsx) | Reviewed Contact sections | 1 | Keep | Standalone residential, business/employer and spouse views share AddressFields. ContactSections composes supplied sections; application adapters resolve participation. |
| [SpouseContact](../../src/components/contact/SpouseContact.tsx) | Reviewed Contact sections | 1 | Keep | Standalone residential, business/employer and spouse views share AddressFields. ContactSections composes supplied sections; application adapters resolve participation. |
| [ApplicationPreview](../../src/components/home/ApplicationPreview.tsx) | Reviewed Home sections | 1 | Illustration | Decorative simulated controls do not collect answers. Keep separate from real form controls and do not count them as field coverage. |
| [AssociationIntroduction](../../src/components/home/AssociationIntroduction.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [HomeCoverageSection](../../src/components/home/HomeCoverageSection.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [HomeHero](../../src/components/home/HomeHero.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [HowApplyingWorksPanel](../../src/components/home/HowApplyingWorksPanel.tsx) | Reviewed Home sections | 2 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [MobilePreviewFrame](../../src/components/layout/MobilePreviewFrame.tsx) | Reviewed Home sections | 1 | Illustration infrastructure | Used inside the Home illustration. It is not the applicant viewport or form layout; group its examples with decorative Home content. |
| [UnderwriterCredentials](../../src/components/home/UnderwriterCredentials.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [AdditionalMembershipInformation](../../src/components/membership/AdditionalMembershipInformation.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [MemberInformation](../../src/components/membership/MemberInformation.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [MembershipHelp](../../src/components/membership/MembershipHelp.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [MembershipStatus](../../src/components/membership/MembershipStatus.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [ApplicantSectionDivider](../../src/components/layout/ApplicantSectionDivider.tsx) | Section surfaces | 10 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [CategoryCard](../../src/components/layout/CategoryCard.tsx) | Section surfaces | 3 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [CategoryHeader](../../src/components/layout/CategoryHeader.tsx) | Section surfaces | 3 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [DetailsTable](../../src/components/layout/DetailsTable.tsx) | Section surfaces | 2 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [FieldGrid](../../src/components/layout/FieldGrid.tsx) | Section surfaces | 8 | Composition; approved exceptions | Stack fields by default; address and name groups may use explicit responsive rows. Preserve other intentional groups as they are reviewed; do not enforce an address-only exception. |
| [ProductCard](../../src/components/layout/ProductCard.tsx) | Section surfaces | 7 | Composition; aligned | Owns the shared product title, weight 800, optional brochure link/QD mark, description and content slot across Coverage, Beneficiary, Payment, quote estimates and Receipt. |
| [SectionDivider](../../src/components/layout/SectionDivider.tsx) | Section surfaces | 7 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [AppBody](../../src/components/layout/AppBody.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [AppFooter](../../src/components/layout/AppFooter.tsx) | Site chrome | 1 | Consolidate selectively | Keep legal/underwriter identity and address content. Share contact resolution for any Questions card, without merging the complete footer into that card. |
| [AppHeader](../../src/components/layout/AppHeader.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [AppMenu](../../src/components/layout/AppMenu.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [AppShell](../../src/components/layout/AppShell.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [ClientHelpBanner](../../src/components/layout/ClientHelpBanner.tsx) | Site chrome | 1 | Keep distinct | Compact global help ribbon may use a help-specific number, chat or scheduling; SiteSupport uses the administrator contact. Do not replace one contact role with another. |
| [OfflineBanner](../../src/components/feedback/OfflineBanner.tsx) | Site chrome | 1 | Keep distinct | AppShell owns the full-width connection bar above the header. Initial browser connectivity, online/offline events and reported OFFLINE incidents control visibility; no support reference or navigation actions. |
| [PageTransitionSkeleton](../../src/components/feedback/PageTransitionSkeleton.tsx) | Transitions | 1 | Keep distinct | Preserves form layout during navigation. It serves a different purpose from a generic spinner or long-running operation status. |
| [ProcessingStatusPage](../../src/components/feedback/ProcessingStatusPage.tsx) | Transitions | 2 | Composition; aligned | A bounded local status now leads to completion or recovery feedback. Unconfirmed payment/submission examples use the full recovery page without repeat actions. |

## Next review sequence

1. Continue the remaining state matrix in recovery-state-plan.md using the implemented shared recovery contract.
2. Consolidate page header APIs with focused before/after examples, preserving catalog identities or providing explicit aliases.
3. Review the prepared Review whole-page scenarios, then continue Health, Payment, E-sign and Receipt. Beneficiary examples and the prior-page structure checkpoint are documented in their page reviews. Capture empty, populated, invalid, loading, unavailable and recovery variants where meaningful for each page.
4. Promote a new shared component only when repeated production markup/behavior establishes the need. A small semantic preset or an adapter can remain internal to its family.
