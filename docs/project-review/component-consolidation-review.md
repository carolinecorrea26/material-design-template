# Component representation and consolidation review

Reviewed 110 canonical component records from public/catalog/components/components.json against their source modules and generated production placement references. Every component has an explicit family and review decision. This is a source review; source paths include conditional variants and do not prove that every variant has been visually reviewed or mounted. Review source hashes and regenerate with npm run components:review after changes.

Current implementation findings and scope are recorded in [the component-reuse audit](component-reuse-audit.md). A Keep decision preserves a meaningful boundary; it does not certify a complete state, policy or integration review.

## Component structure

Application frame → page sections → shared pieces describes primary ownership; Storybook category and reuse count are separate. Contains references direct registered source dependencies, including conditional paths; internal parts describe exports, native elements, actions and slots without inventing extra component identities. See [the documentation contract](component-documentation.md).

| Role | Components |
| --- | --- |
| Application frame | 15 |
| Page sections | 20 |
| Shared pieces | 75 |

| Component | Role | Contains components | Internal parts |
| --- | --- | --- | --- |
| ApplicationDocumentPreview | Shared pieces | — | — |
| ApplicationReviewDrawerContent | Shared pieces | QuickDecisionExplainer | — |
| LegalDocList | Shared pieces | — | — |
| PageHelp | Shared pieces | PageHelpChips, PageHelpDrawer | — |
| PageHelpChips | Shared pieces | — | HelpChip (native-element): Repeated native MUI chip bound to an explicit help item and the shared selection callback. |
| PageHelpDrawer | Shared pieces | AppDrawer | — |
| PrintAction | Shared pieces | Button | — |
| ReferenceRateTableLink | Shared pieces | AppDrawer, Link | — |
| AppDrawer | Shared pieces | — | — |
| AppModal | Shared pieces | Button | Staged header (slot): Optional stepper or context between the title and scrolling content.<br>Dialog content (slot): Supplied content; shell options control compact/mobile sizing, dividers and dismissal without owning the workflow.<br>Footer actions (slot): Supplied actions or configured action buttons with optional autofocus. |
| ConfirmationDialog | Shared pieces | AppModal | — |
| CookieDialog | Shared pieces | Link | — |
| CoveragePortfolioDrawer | Shared pieces | AppDrawer | — |
| MemberVerification | Shared pieces | AppModal, Button, FieldRenderer | — |
| SendApplicationDialog | Shared pieces | AppModal, PageAlert | — |
| VerificationAddress | Shared pieces | AddressFields, AppModal | — |
| EligibilitySections | Page sections | ApplicantSectionDivider, DynamicList, EligibilityFields, FieldGrid, FieldRenderer, SectionDivider | SectionNote (native-element): Inline MUI info Alert at the authored section-note placement. The adapter supplies the effective section wording; this is not a separate component. |
| PhysicianInformation | Shared pieces | AddressFields, FieldGrid, FieldRenderer, SectionDivider | — |
| ApplicationErrorState | Page sections | ApplicationRecoveryActions, FormShell, PageShell, SiteSupport | — |
| ApplicationRecoveryActions | Shared pieces | Button, Link | — |
| AppSnackbar | Shared pieces | — | Snackbar (native-element): MUI transient surface with responsive positioning, dismissal and the configured auto-hide duration. |
| CoverageSelectionFeedback | Shared pieces | AppDrawer, AppSnackbar | — |
| EmptyState | Shared pieces | — | — |
| ExpiringCodeAlert | Shared pieces | Link | — |
| InformationAlert | Shared pieces | — | Information content (slot): Supplied supporting content and actions below the heading and optional description. |
| PageAlert | Shared pieces | — | — |
| ProgressSavedSnackbar | Shared pieces | AppSnackbar | — |
| ResendCountdownRow | Shared pieces | Button | — |
| ResumeSessionWarning | Shared pieces | PageAlert | — |
| SessionExpiryAlert | Shared pieces | AppModal | — |
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
| PageShell | Application frame | PageAlert, PageHeader | — |
| PageTitle | Application frame | — | Back button (action): Optional back action rendered beside the heading; the page template owns navigation. |
| ProgressStep | Application frame | — | Breadcrumbs (export): Pages within the active main step, such as Membership, Eligibility, Beneficiary and Contact; shown when multiple applicable entries exist. |
| StandaloneFormPage | Application frame | FormShell, PageHeader, PageShell | Form content (slot): Explicit form fields, actions and messages. Callers own form/security state and workflow callbacks. |
| PaymentSections | Page sections | CategoryCard, FieldGrid, FieldRenderer, ProductCard, SectionDivider | Shared payment elections (slot): Explicit shared controls; page resolves common choices and policy.<br>Product costs (slot): Caller supplies rate summaries or reference tables within each ProductCard.<br>Payment notes (slot): Configured page-level notes, with per-product notes inside matching cards. Empty notes are hidden. Notes describe taxes or fees; this slot does not calculate or charge them. |
| SharedPaymentControls | Shared pieces | FieldGrid, FieldRenderer | Payment elections (slot): Explicit method/frequency definitions and resolved common-choice state. Updates canonical product bindings through the supplied setter. |
| ProfilePersonalInformation | Shared pieces | ConditionalGroup, FieldGrid, FieldRenderer | — |
| ProfileSections | Page sections | ApplicantSectionDivider, ConditionalGroup, DynamicList, FieldRenderer, PhysicianInformation, ProfilePersonalInformation, SectionDivider | Personal information (slot): Independent member/spouse fields and license, residence and travel follow-ups.<br>Other coverage (slot): Life and disability follow-ups, supplied replacement notice and repeated carrier records. DynamicList owns record dialogs.<br>Financial questionnaire (slot): Member financial details and local self-employment follow-ups; the page resolves policy participation. |
| QuickDecisionExplainer | Shared pieces | Link | — |
| QuickDecisionIndicator | Shared pieces | — | — |
| QuickDecisionInfoBox | Shared pieces | QuickDecisionExplainer | — |
| CoverageCart | Shared pieces | AppModal, EmptyState, EstimatedRate, ProductCard, RateFrequencyControl, TotalCostSummary | — |
| CoverageCategorySelector | Shared pieces | ControlledFieldRenderer, SectionDivider | — |
| CoverageNeedsCalculator | Shared pieces | FieldGrid, FieldRenderer | — |
| CoverageOptionsPanel | Shared pieces | QuickDecisionIndicator, QuickDecisionInfoBox | — |
| CoverageQuestions | Page sections | ApplicantSectionDivider, ConditionalGroup, CoverageCategorySelector, FieldGrid, FieldRenderer, SectionDivider | — |
| EligibilityFields | Shared pieces | ControlledFieldRenderer, FieldGrid, FieldRenderer | — |
| EstimatedRate | Shared pieces | ReferenceRateTableLink | — |
| EstimatorProductCard | Shared pieces | ControlledFieldRenderer, EstimatedRate, FeaturedBadge, FieldGrid, ProductCard | — |
| FeaturedBadge | Shared pieces | — | — |
| ProductCatalog | Page sections | ApplicantSectionDivider, CategoryCard, CategoryHeader, ControlledFieldRenderer, CoverageCart, EstimatedRate, FeaturedBadge, FieldGrid, ProductCard, ProductCostBreakdown, QuickDecisionInfoBox | — |
| ProductCostBreakdown | Shared pieces | EstimatedRate | — |
| QuoteCalculator | Shared pieces | AppDrawer, Button, CategoryHeader, CoverageCategorySelector, EmptyState, FieldGrid, FieldRenderer, PageHeader, RateFrequencyControl, SectionDivider | — |
| RateFrequencyControl | Shared pieces | RateFrequencyToggle | — |
| RateFrequencyToggle | Shared pieces | — | — |
| TotalCostSummary | Shared pieces | EstimatedRate | — |
| ReceiptConfirmation | Page sections | Button, InformationAlert | — |
| ReceiptCoverageDecision | Shared pieces | ApplicantSectionDivider, ProductCard | — |
| ReceiptDecisions | Page sections | — | — |
| BeneficiaryProductRecords | Page sections | Button, DynamicListItem, ProductCard | SectionNote (native-element): Inline MUI info Alert for the supplied product designation note; the page resolves the effective wording. |
| DynamicList | Shared pieces | AppModal, Button, DynamicListItem, FieldGrid, FieldRenderer | — |
| DynamicListItem | Shared pieces | Button | — |
| HealthQuestion | Shared pieces | DynamicList, FieldGrid, FieldRenderer | Record summary (slot): Supplied summary of mapped stored records. Default health pages share HealthDetailSummary; policy questionnaires retain their explicit field-label summaries.<br>Answer (slot): Explicit field definition rendered by FieldRenderer.<br>Follow-up details (slot): Caller resolves visibility, mapping, summary and explicit record bounds. Direct fields or DynamicList records use independent collection bindings. |
| HealthQuestionList | Shared pieces | ApplicantSectionDivider, SectionDivider | Questions and applicant answers (slot): Caller supplies question identities, order, applicant and content. Groups corresponding questions without merging answer bindings. |
| LegalReviewSection | Shared pieces | PrintAction | Disclosure content (slot): Supplied legal statement, native notice blocks or electronic disclosure.<br>Print (action): Shared PrintAction prints this disclosure only; an explicit caller override is available for previews. |
| ReviewSections | Page sections | AppModal, ApplicantSectionDivider, FieldGrid, FieldRenderer, LegalDocList, LegalReviewSection, Link, PrintAction, ReviewStatement | Document preview (slot): Caller supplies the application readout; its adapter resolves saved fields and edit targets. |
| ReviewStatement | Shared pieces | — | — |
| BusinessInformation | Page sections | AddressFields, FieldRenderer, SectionDivider | — |
| ContactSections | Page sections | ApplicantSectionDivider, BusinessInformation, FieldRenderer, ResidentialAddress, SectionDivider | — |
| ResidentialAddress | Page sections | AddressFields, FieldRenderer, SectionDivider | — |
| ApplicationPreview | Shared pieces | MobilePreviewFrame | — |
| AssociationIntroduction | Page sections | — | — |
| HomeCoverageSection | Page sections | CoverageOptionsPanel | — |
| HomeHero | Page sections | Button, EligibilityFields, Link | — |
| HowApplyingWorksPanel | Shared pieces | AppDrawer, ApplicationPreview, ApplicationReviewDrawerContent, QuickDecisionExplainer | — |
| MobilePreviewFrame | Shared pieces | — | — |
| UnderwriterCredentials | Page sections | — | — |
| AdditionalMembershipInformation | Page sections | FieldGrid, FieldRenderer, SectionDivider | — |
| MemberInformation | Page sections | FieldGrid, FieldRenderer | — |
| MembershipStatus | Page sections | FieldRenderer, Link | — |
| ApplicantSectionDivider | Shared pieces | — | — |
| CategoryCard | Shared pieces | CategoryHeader | — |
| CategoryHeader | Shared pieces | — | — |
| DetailsTable | Shared pieces | — | — |
| FieldGrid | Shared pieces | — | — |
| ProductCard | Shared pieces | Link, QuickDecisionIndicator | Product heading (native-element): Consistent product title at weight 800, optional brochure link, QD indicator and header action.<br>Product content (slot): Coverage, beneficiary, payment, quote or receipt content supplied by the caller. |
| SectionDivider | Shared pieces | — | FieldGroup (export): Named shared field surface exported by SectionDivider; used directly for untitled groups. It is a part of this owner, not another canonical component. |
| AppBody | Application frame | — | — |
| AppFooter | Application frame | AppModal, LegalDocList, Link, PrintAction | — |
| AppHeader | Application frame | AppDrawer, AppMenu, ClientHelpBanner | — |
| AppMenu | Application frame | AppDrawer, Button, HowApplyingWorksPanel, Link, QuickDecisionExplainer | — |
| AppShell | Application frame | AppBody, AppFooter, AppHeader, AppSnackbar, CookieDialog, OfflineBanner | — |
| ClientHelpBanner | Application frame | AppModal, Button | — |
| OfflineBanner | Application frame | — | — |
| PageTransitionSkeleton | Shared pieces | — | — |
| PrototypeHandoffPage | Shared pieces | FormRoutePage | Prototype screens (slot): Validated global defaults or effective-Site image assignments, with accessible alternative text and optional placeholder content.<br>Continue (action): Intermediate clicks advance the supplied sequence. The final click submits the shared form; pending navigation disables repeat activation.<br>Full-screen surface (native-element): Intentional full-screen image viewport, distinct from compact AppModal workflows. It retains save errors and image-load fallback. |

## Findings

- Consolidated now: SiteSupport replaces the receipt's local Questions block and appears on maintenance and every error page. Email and site share contact resolution/copy. Existing email transport markup remains separate.
- Aligned now: shared recovery copy/actions prevent different recovery wording and duplicate alerts on the full page; local incident context carries safe support references without service calls. The controlled field adapter is documented under Forms. Configured name groups share a responsive row on larger screens and stack on mobile, with no extra vertical grid gap.
- R1–R7 complete: shared rendering/frame/dialog changes are implemented; global component registrations, composition and parts are the source for the Library and Storybook projection. PrototypeHandoffPage has one canonical owner. Superseded component placeholders are removed; named exports and native elements remain documented parts.
- Already shared: radio rows use SelectionGroup; controlled fields use FieldRenderer; yes/no detail records use DynamicList; frequency control uses its styled switch; modal workflows use shared shells; price surfaces use EstimatedRate. These are layers of composition, not independent duplicate implementations.
- Preserve distinctions: help-ribbon contact vs administrator support; quote card vs full applicant/rider catalog; transient snackbar vs persistent page alert; skeleton vs external processing; business policy vs visual surface. Merge only repeated markup/data that has the same meaning.
- ApplicationPreview and MobilePreviewFrame represent decorative Home artwork. Their simulated fields are not application answers or actual applicant screen layouts.
- Home, Membership, Eligibility and Coverage have reviewed section examples. Coverage also has whole-page scenarios and reference-rate format examples. Beneficiary has real whole-page scenarios with local section ownership documented in its page review. Contact has both isolated section examples and real whole-page scenarios using ContactSections. Profile now has seven whole-page scenarios and standalone section examples with its own page review. Review now has standalone document/legal pieces, section examples and real whole-page policy scenarios. Later application pages still require the planned page-by-page review; source references alone are not completed section/state coverage.

## Consolidation queue

| Component | Decision | Next step |
| --- | --- | --- |


## Full component review

Consumers counts distinct production source compositions, not rendered instances or unconditional routes. Open the canonical Storybook example from each component's saved story ID. Machine-readable evidence, source hashes and consumer paths are recorded in component-consolidation-review.json.

| Component | Family | Consumers | Decision | Assessment / next step |
| --- | --- | --- | --- | --- |
| [ApplicationDocumentPreview](../../src/components/content/ApplicationDocumentPreview.tsx) | Content and documents | 1 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [ApplicationReviewDrawerContent](../../src/components/content/ApplicationReviewDrawerContent.tsx) | Content and documents | 1 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [LegalDocList](../../src/components/content/LegalDocList.tsx) | Content and documents | 2 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [PageHelp](../../src/components/content/PageHelp.tsx) | Content and documents | 3 | Shared; aligned | CHG-067 unified page-help state and source-compiled topics across Membership, Beneficiary and Payment. Health has no help chips. |
| [PageHelpChips](../../src/components/content/PageHelpChips.tsx) | Content and documents | 1 | Shared; aligned | One source-driven chip-row owner with explicit items and callbacks, independent of page/person/Site identity. |
| [PageHelpDrawer](../../src/components/content/PageHelpDrawer.tsx) | Content and documents | 1 | Shared; aligned | One controlled title/content wrapper over AppDrawer; pages supply topic data rather than another help component. |
| [PrintAction](../../src/components/content/PrintAction.tsx) | Content and documents | 3 | Keep | Distinct preview, contextual-help and disclosure-list tasks. |
| [ReferenceRateTableLink](../../src/components/coverage/ReferenceRateTableLink.tsx) | Content and documents | 2 | Composition; aligned | One shared drawer supports saved image, PDF, HTML table, link and XML reference formats; preserve reference pricing separately from calculated estimates. |
| [AppDrawer](../../src/components/layout/AppDrawer.tsx) | Dialogs and drawers | 9 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [AppModal](../../src/components/layout/AppModal.tsx) | Dialogs and drawers | 12 | Shared; R3 complete | Home notices, header coverage details, scheduling, verification and session warnings share the shell. Generic slots and dismissal/focus/mobile options preserve their contracts. |
| [ConfirmationDialog](../../src/components/layout/ConfirmationDialog.tsx) | Dialogs and drawers | 2 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [CookieDialog](../../src/components/layout/CookieDialog.tsx) | Dialogs and drawers | 1 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [CoveragePortfolioDrawer](../../src/components/coverage/CoveragePortfolioDrawer.tsx) | Dialogs and drawers | 1 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [MemberVerification](../../src/components/verification/MemberVerification.tsx) | Dialogs and drawers | 1 | Shared; R3 complete | Composes AppModal with a generic staged-header slot; its own verification state, validations and callbacks remain independent. |
| [SendApplicationDialog](../../src/components/layout/SendApplicationDialog.tsx) | Dialogs and drawers | 2 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [VerificationAddress](../../src/components/verification/VerificationAddress.tsx) | Dialogs and drawers | 1 | Keep | Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants. |
| [EligibilitySections](../../src/components/eligibility/EligibilitySections.tsx) | Eligibility and physician sections | 1 | Keep | Keep page-specific policy and applicant structure above shared fields; PhysicianInformation has canonical member/spouse fields; Profile composition and scenarios are documented in profile-component-review.md. |
| [PhysicianInformation](../../src/components/forms/PhysicianInformation.tsx) | Eligibility and physician sections | 1 | Keep | Keep page-specific policy and applicant structure above shared fields; PhysicianInformation has canonical member/spouse fields; Profile composition and scenarios are documented in profile-component-review.md. |
| [ApplicationErrorState](../../src/components/feedback/ApplicationErrorState.tsx) | Feedback and recovery | 2 | Composition; aligned | One card-contained utility-page layout renders large primary-colored error codes or state icons, messages, plain recovery links and the standard SiteSupport card. Maintenance has no navigation actions; 404 Home/Resume links preserve application state. |
| [ApplicationRecoveryActions](../../src/components/feedback/ApplicationRecoveryActions.tsx) | Feedback and recovery | 1 | Composition; aligned | One compact responsive action row. Maintenance has no navigation actions. Only explicit Start new invokes the reset callback; retries require an explicit local callback. |
| [AppSnackbar](../../src/components/feedback/AppSnackbar.tsx) | Feedback and recovery | 5 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [CoverageSelectionFeedback](../../src/components/coverage/CoverageSelectionFeedback.tsx) | Feedback and recovery | 1 | Composition; aligned | Shared AppDrawer/CoverageCart for the first addition and AppSnackbar for subsequent additions; keep selection state and feedback timing at the caller. |
| [EmptyState](../../src/components/feedback/EmptyState.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [ExpiringCodeAlert](../../src/components/feedback/ExpiringCodeAlert.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [InformationAlert](../../src/components/feedback/InformationAlert.tsx) | Feedback and recovery | 1 | Shared; R5 complete | Generic supplied heading, description and content; ReceiptConfirmation owns receipt rules and text selection. |
| [PageAlert](../../src/components/feedback/PageAlert.tsx) | Feedback and recovery | 8 | Shared; R6 complete | PageShell, Resume request/sent, ResumeMethod and CIR load failures use PageAlert. Inline and overlay alerts retain their distinct placement. |
| [ProgressSavedSnackbar](../../src/components/feedback/ProgressSavedSnackbar.tsx) | Feedback and recovery | 1 | Internal primitive | A semantic AppSnackbar preset. Keep confirmed-save timing at callers; do not show Saved for an unacknowledged request. |
| [ResendCountdownRow](../../src/components/feedback/ResendCountdownRow.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [ResumeSessionWarning](../../src/components/feedback/ResumeSessionWarning.tsx) | Feedback and recovery | 2 | Keep | Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope. |
| [SessionExpiryAlert](../../src/components/feedback/SessionExpiryAlert.tsx) | Feedback and recovery | 1 | Shared; R3 complete | Composes AppModal with non-dismissal, alertdialog, labelled description and autofocus; inactivity-extension behavior remains separate from fixed MFA expiry. |
| [SiteSupport](../../src/components/layout/SiteSupport.tsx) | Feedback and recovery | 2 | Shared; aligned | Receipt and redirect templates share the configured MUI info alert. Email keeps appropriate table markup while sharing contact/copy resolution. |
| [AddressFields](../../src/components/forms/AddressFields.tsx) | Generic form controls | 4 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| Button | Generic form controls | 24 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [ConditionalGroup](../../src/components/forms/ConditionalGroup.tsx) | Generic form controls | 3 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [ControlledFieldRenderer](../../src/components/forms/ControlledFieldRenderer.tsx) | Generic form controls | 5 | Adapter; aligned | Moved to Forms with its own adapter example. It already calls FieldRenderer; keep one field/control implementation. |
| [FieldRenderer](../../src/components/forms/FieldRenderer.tsx) | Generic form controls | 27 | Shared; R1 complete | Date and month-year use TextLikeField with independent format/storage adapters, validation and unchanged answer bindings. |
| Link | Generic form controls | 15 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [PhoneField](../../src/components/forms/PhoneField.tsx) | Generic form controls | 1 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [RadioSelectionGroup](../../src/components/forms/RadioSelectionGroup.tsx) | Generic form controls | 1 | Composition; already shared | Already composes SelectionGroup. Keep radio semantics, labels and helper/error state separate from the visual row. |
| [SelectionGroup](../../src/components/forms/SelectionGroup.tsx) | Generic form controls | 2 | Keep | Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions. |
| [FormRoutePage](../../src/app/RoutePage.tsx) | Page layout and navigation | 14 | Keep | Preserve layout, application state and navigation boundaries. |
| [FormShell](../../src/components/layout/FormShell.tsx) | Page layout and navigation | 4 | Internal primitive | Shared styled Paper with responsive radius/padding. Preserve it as a view surface, separate from form-state engines. |
| [PageHeader](../../src/components/layout/PageHeader.tsx) | Page layout and navigation | 4 | Shared; R2 complete | PageShell and standalone/application form frames share the title, help and feedback owner; PageTitle remains its internal primitive. |
| [PageNav](../../src/components/navigation/PageNav.tsx) | Page layout and navigation | 1 | Keep | Preserve layout, application state and navigation boundaries. |
| [PageShell](../../src/components/layout/PageShell.tsx) | Page layout and navigation | 4 | Shared; R2 complete | Uses PageHeader and PageAlert. StandaloneFormPage shares Resume layout without application autosave/security effects. |
| [PageTitle](../../src/components/layout/PageTitle.tsx) | Page layout and navigation | 1 | Internal primitive | Shared heading/back/subtitle primitive beneath PageHeader; keep this layering. Do not create person/page copies. |
| [ProgressStep](../../src/components/navigation/ProgressStep.tsx) | Page layout and navigation | 1 | Keep | Preserve layout, application state and navigation boundaries. |
| [StandaloneFormPage](../../src/components/layout/StandaloneFormPage.tsx) | Page layout and navigation | 3 | Shared; R2 complete | Pure PageShell/FormShell/PageHeader layout. Resume request/method/code controllers keep independent state, callbacks and security policies. |
| [PaymentSections](../../src/components/payment/PaymentSections.tsx) | Payment composition | 1 | Keep | Page resolves collection, product policy, field definitions, rate display, configurable notes and normal form continuation. Standalone sections and shared controls receive explicit inputs; canonical per-product bindings remain independent. |
| [SharedPaymentControls](../../src/components/forms/SharedPaymentControls.tsx) | Payment composition | 1 | Keep | Page resolves collection, product policy, field definitions, rate display, configurable notes and normal form continuation. Standalone sections and shared controls receive explicit inputs; canonical per-product bindings remain independent. |
| [ProfilePersonalInformation](../../src/components/profile/ProfilePersonalInformation.tsx) | Profile personal fields | 1 | Keep | Shared adult personal-field composition with independent member/spouse IDs and local license/residence/travel follow-ups. |
| [ProfileSections](../../src/components/profile/ProfileSections.tsx) | Profile sections | 1 | Keep | One production composition for personal, physician, Other coverage and financial questionnaire sections. Page resolves participation and coverage policy; standalone examples receive explicit inputs. |
| [QuickDecisionExplainer](../../src/components/content/QuickDecisionExplainer.tsx) | QuickDecision content and marks | 5 | Keep | Shared explainer/brand mark with distinct compact indicator, expandable panel and full explanation. |
| [QuickDecisionIndicator](../../src/components/coverage/QuickDecisionIndicator.tsx) | QuickDecision content and marks | 2 | Internal primitive | Thin preset around QuickDecisionIcon. Keep one configured artwork source; this is a useful compact semantic preset, not a new brand implementation. |
| [QuickDecisionInfoBox](../../src/components/content/QuickDecisionInfoBox.tsx) | QuickDecision content and marks | 2 | Shared; aligned | Current content comes from the shared content context; assigned-product availability and expand/collapse distinguish this view from the full explainer and compact mark. |
| [CoverageCart](../../src/components/coverage/CoverageCart.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageCategorySelector](../../src/components/coverage/CoverageCategorySelector.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageNeedsCalculator](../../src/components/coverage/CoverageNeedsCalculator.tsx) | Quote and coverage | 1 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageOptionsPanel](../../src/components/coverage/CoverageOptionsPanel.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [CoverageQuestions](../../src/components/coverage/CoverageQuestions.tsx) | Quote and coverage | 1 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [EligibilityFields](../../src/components/forms/EligibilityFields.tsx) | Quote and coverage | 3 | Composition; aligned | The application Eligibility page and quote tools share ZIP/State/Birthday rendering and manual-State behavior; their adapters retain value and validation ownership. |
| [EstimatedRate](../../src/components/coverage/EstimatedRate.tsx) | Quote and coverage | 7 | Composition; already shared | Already handles amount/unavailable/calculating across cards and totals, including reserved dimensions. Reuse this instead of local price spinners. |
| [EstimatorProductCard](../../src/components/coverage/EstimatorProductCard.tsx) | Quote and coverage | 1 | Keep distinct; shared primitives | Already uses ProductCard, ControlledFieldRenderer and EstimatedRate. Quote selection/rider callbacks differ from full application policy orchestration. |
| [FeaturedBadge](../../src/components/coverage/FeaturedBadge.tsx) | Quote and coverage | 2 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [ProductCatalog](../../src/components/coverage/ProductCatalog.tsx) | Quote and coverage | 1 | Keep distinct; shared primitives | Owns product/applicant/rider selection composition while reusing shared product surfaces, fields and prices. No reason to merge it with quote or receipt controllers. |
| [ProductCostBreakdown](../../src/components/coverage/ProductCostBreakdown.tsx) | Quote and coverage | 1 | Keep distinct; shared prices | Fee/rider breakdown rows use EstimatedRate. Their line-item semantics differ from a grand total; no additional consolidation established. |
| [QuoteCalculator](../../src/app/workflows/QuoteCalculator.tsx) | Quote and coverage | 1 | Keep | Preserve quote/full-application differences; share field, price and summary primitives. |
| [RateFrequencyControl](../../src/components/coverage/RateFrequencyControl.tsx) | Quote and coverage | 2 | Composition; already shared | Already owns labels/options and delegates to RateFrequencyToggle. Keep as the public coverage-frequency control. |
| [RateFrequencyToggle](../../src/components/coverage/RateFrequencyToggle.tsx) | Quote and coverage | 1 | Internal primitive | Styled switch inside RateFrequencyControl; expose monthly/annual examples through the labeled control rather than treating both as separate workflows. |
| [TotalCostSummary](../../src/components/coverage/TotalCostSummary.tsx) | Quote and coverage | 2 | Keep distinct; shared prices | Aggregate cost presentation already uses EstimatedRate and frequency primitives. Do not merge its policy or total semantics with individual product cards. |
| [ReceiptConfirmation](../../src/components/receipt/ReceiptConfirmation.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [ReceiptCoverageDecision](../../src/components/receipt/ReceiptCoverageDecision.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [ReceiptDecisions](../../src/components/receipt/ReceiptDecisions.tsx) | Receipt sections | 1 | Keep | Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks. |
| [BeneficiaryProductRecords](../../src/components/beneficiary/BeneficiaryProductRecords.tsx) | Repeated records | 1 | Keep | HealthQuestion renders direct and repeated details for configured/default questionnaires; DynamicList composes DynamicListItem and FieldRenderer. Independent policies, bindings, mappings, summaries and limits stay explicit. |
| [DynamicList](../../src/components/forms/DynamicList.tsx) | Repeated records | 3 | Keep; grouping aligned | The add/edit dialog retains configured first/last-name rows on larger screens and stacks them on mobile. Other fields remain stacked. Retain one list editor and existing remove confirmation. |
| [DynamicListItem](../../src/components/forms/DynamicListItem.tsx) | Repeated records | 2 | Internal primitive | Already used by DynamicList. Keep as its record-summary/action row instead of another list manager. |
| [HealthQuestion](../../src/components/forms/HealthQuestion.tsx) | Repeated records | 2 | Shared; R4 complete | One renderer handles configured/default answers, direct/repeated details, mappings, summaries and explicit record bounds. ConfiguredHealthPage shares SI/TELE/DI SUPP composition while policy resolution and participation remain independent. |
| [HealthQuestionList](../../src/components/forms/HealthQuestionList.tsx) | Repeated records | 1 | Keep | HealthQuestion renders direct and repeated details for configured/default questionnaires; DynamicList composes DynamicListItem and FieldRenderer. Independent policies, bindings, mappings, summaries and limits stay explicit. |
| [LegalReviewSection](../../src/components/content/LegalReviewSection.tsx) | Review composition | 1 | Keep | Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface. |
| [ReviewSections](../../src/components/review/ReviewSections.tsx) | Review composition | 1 | Keep | Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface. |
| [ReviewStatement](../../src/components/forms/ReviewStatement.tsx) | Review composition | 1 | Keep | Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface. |
| [BusinessInformation](../../src/components/contact/BusinessInformation.tsx) | Reviewed Contact sections | 1 | Keep | Residential and business views share AddressFields; supplied spouse fields use the generic ContactSections field-section path. ContactSections composes supplied sections; application adapters resolve participation. |
| [ContactSections](../../src/components/contact/ContactSections.tsx) | Reviewed Contact sections | 1 | Keep | Residential and business views share AddressFields; supplied spouse fields use the generic ContactSections field-section path. ContactSections composes supplied sections; application adapters resolve participation. |
| [ResidentialAddress](../../src/components/contact/ResidentialAddress.tsx) | Reviewed Contact sections | 1 | Keep | Residential and business views share AddressFields; supplied spouse fields use the generic ContactSections field-section path. ContactSections composes supplied sections; application adapters resolve participation. |
| [ApplicationPreview](../../src/components/home/ApplicationPreview.tsx) | Reviewed Home sections | 1 | Illustration | Decorative simulated controls do not collect answers. Keep separate from real form controls and do not count them as field coverage. |
| [AssociationIntroduction](../../src/components/home/AssociationIntroduction.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [HomeCoverageSection](../../src/components/home/HomeCoverageSection.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [HomeHero](../../src/components/home/HomeHero.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [HowApplyingWorksPanel](../../src/components/home/HowApplyingWorksPanel.tsx) | Reviewed Home sections | 2 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [MobilePreviewFrame](../../src/components/layout/MobilePreviewFrame.tsx) | Reviewed Home sections | 1 | Illustration infrastructure | Used inside the Home illustration. It is not the applicant viewport or form layout; group its examples with decorative Home content. |
| [UnderwriterCredentials](../../src/components/home/UnderwriterCredentials.tsx) | Reviewed Home sections | 1 | Keep | Match actual Home composition and clearly identify illustrative content. |
| [AdditionalMembershipInformation](../../src/components/membership/AdditionalMembershipInformation.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [MemberInformation](../../src/components/membership/MemberInformation.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [MembershipStatus](../../src/components/membership/MembershipStatus.tsx) | Reviewed Membership sections | 1 | Keep | These are sections of one page, not competing form libraries. |
| [ApplicantSectionDivider](../../src/components/layout/ApplicantSectionDivider.tsx) | Section surfaces | 9 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [CategoryCard](../../src/components/layout/CategoryCard.tsx) | Section surfaces | 3 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [CategoryHeader](../../src/components/layout/CategoryHeader.tsx) | Section surfaces | 3 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [DetailsTable](../../src/components/layout/DetailsTable.tsx) | Section surfaces | 2 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [FieldGrid](../../src/components/layout/FieldGrid.tsx) | Section surfaces | 19 | Composition; approved exceptions | Stack fields by default; address and name groups may use explicit responsive rows. Preserve other intentional groups as they are reviewed; do not enforce an address-only exception. |
| [ProductCard](../../src/components/layout/ProductCard.tsx) | Section surfaces | 7 | Composition; aligned | Owns the shared product title, weight 800, optional brochure link/QD mark, description and content slot across Coverage, Beneficiary, Payment, quote estimates and Receipt. |
| [SectionDivider](../../src/components/layout/SectionDivider.tsx) | Section surfaces | 13 | Keep | Use shared surfaces and data-driven labels; retain applicant/category semantics. |
| [AppBody](../../src/components/layout/AppBody.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [AppFooter](../../src/components/layout/AppFooter.tsx) | Site chrome | 1 | Keep distinct; shared contact data | Footer legal identity and compact links differ from support alerts and menu tools. Preserve shared contact resolution without treating matching MUI Stack markup as the same composition. |
| [AppHeader](../../src/components/layout/AppHeader.tsx) | Site chrome | 1 | Shared; R3 complete | Coverage details use AppModal; product content, selection and navigation remain owned by the header. |
| [AppMenu](../../src/components/layout/AppMenu.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [AppShell](../../src/components/layout/AppShell.tsx) | Site chrome | 1 | Keep | Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions. |
| [ClientHelpBanner](../../src/components/layout/ClientHelpBanner.tsx) | Site chrome | 1 | Shared; R3 complete | Scheduling composes AppModal with supplied iframe content; sales/help contact behavior remains independent. |
| [OfflineBanner](../../src/components/feedback/OfflineBanner.tsx) | Site chrome | 1 | Keep distinct | AppShell owns the full-width connection bar above the header. Initial browser connectivity, online/offline events and reported OFFLINE incidents control visibility; no support reference or navigation actions. |
| [PageTransitionSkeleton](../../src/components/feedback/PageTransitionSkeleton.tsx) | Transitions | 1 | Keep distinct | Preserves form layout during navigation. It serves a different purpose from a generic spinner or long-running operation status. |
| [PrototypeHandoffPage](../../src/components/feedback/PrototypeHandoffPage.tsx) | Transitions | 2 | Keep | Distinguish layout-preserving navigation placeholders from external-operation processing. |

## Next review sequence

1. Close the seven source-confirmed reuse/model findings in component-reuse-audit.md; retain existing rules, field IDs and effective-Site assignments.
2. Verify each shared change through its canonical example and affected page integrations; run fresh-start/source/build checks when required by the repository contract.
3. Receipt final page review is complete in CHG-074. Preserve shared owners and do not enable other real Sites.
4. Keep meaningful workflow controllers, binding adapters and semantic presets. Shared MUI primitives alone do not justify a new abstraction or another approval round.
