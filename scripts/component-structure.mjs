/** Reviewed ownership, independent of where a story is filed or how often it is reused. */
const roles = {
  'application-frame': [
    'AppShell', 'AppBody', 'AppHeader', 'AppFooter', 'AppMenu', 'ClientHelpBanner', 'OfflineBanner',
    'FormRoutePage', 'ProgressStep', 'PageShell', 'FormShell', 'PageHeader', 'PageTitle', 'PageNav',
  ],
  'page-section': [
    'ReceiptConfirmation', 'ReceiptNextSteps', 'ReceiptDecisions', 'ReceiptApplicationSummary',
    'HomeHero', 'HomeCoverageSection', 'AssociationIntroduction', 'UnderwriterCredentials',
    'MembershipHelp', 'MembershipStatus', 'MemberInformation', 'AdditionalMembershipInformation',
    'PaymentSections', 'ReviewSections', 'ProfileSections', 'BeneficiaryProductRecords', 'ContactSections', 'ResidentialAddress', 'BusinessInformation', 'SpouseContact', 'EligibilitySections', 'CoverageQuestions', 'ProductCatalog', 'ApplicationErrorState',
  ],
  'shared-piece': [
    'ReceiptCoverageDecision',
    'SharedPaymentControls', 'HealthInformationHelp', 'HealthQuestion', 'HealthQuestionList', 'ReviewStatement', 'LegalReviewSection', 'ApplicationReviewDrawerContent', 'DetailsTable', 'YesNoDetailList', 'EstimatedRate', 'ApplicationDocumentPreview', 'HelpChips',
    'LegalDocList', 'QuickDecisionExplainer', 'QuickDecisionIndicator', 'QuickDecisionInfoBox',
    'CoverageCart', 'CoverageCategorySelector', 'CoverageNeedsCalculator', 'CoverageOptionsPanel',
    'CoveragePortfolioDrawer', 'EligibilityFields', 'EstimatorProductCard', 'FeaturedBadge',
    'HowApplyingWorksPanel', 'MemberVerification', 'VerificationAddress', 'PhysicianInformation', 'ProductCostBreakdown',
    'QuoteCalculator', 'RateFrequencyControl', 'RateFrequencyToggle', 'TotalCostSummary',
    'AppSnackbar', 'EmptyState', 'ExpiringCodeAlert', 'PageAlert', 'PageTransitionSkeleton',
    'ProcessingStatusPage', 'ProgressSavedSnackbar', 'ResendCountdownRow', 'ConditionalGroup',
    'ProfilePersonalInformation', 'PhoneField', 'AddressFields', 'DynamicList', 'DynamicListItem', 'FieldRenderer', 'RadioSelectionGroup', 'SelectionGroup',
    'ApplicationPreview', 'ApplicantSectionDivider', 'CategoryCard', 'CategoryHeader', 'FieldGrid',
    'MobilePreviewFrame', 'ProductCard', 'SectionDivider', 'AppDrawer', 'AppModal',
    'ConfirmationDialog', 'CookieDialog', 'SendApplicationDialog', 'ControlledFieldRenderer', 'Button', 'Link',
    'ApplicationRecoveryActions', 'SessionExpiryAlert', 'SiteSupport', 'RecoveryAlert',
    'CoverageSelectionFeedback', 'ReferenceRateTableLink',
  ],
};
const parts = {
  PaymentSections: [
    { name: 'Payment feedback', kind: 'slot', sourceSymbol: 'feedback', description: 'Caller supplies mock authorization and submission feedback.' },
    { name: 'Shared payment elections', kind: 'slot', sourceSymbol: 'sharedControls', description: 'Explicit shared controls; page resolves common choices and policy.' },
    { name: 'Product costs', kind: 'slot', sourceSymbol: 'costs', description: 'Caller supplies rate summaries or reference tables within each ProductCard.' },
  ],
  SharedPaymentControls: [
    { name: 'Payment elections', kind: 'slot', sourceSymbol: 'methodField', description: 'Explicit method/frequency definitions and resolved common-choice state. Updates canonical product bindings through the supplied setter.' },
  ],
  HealthQuestion: [
    { name: 'Answer', kind: 'slot', sourceSymbol: 'question', description: 'Explicit field definition rendered by FieldRenderer.' },
    { name: 'Follow-up details', kind: 'slot', sourceSymbol: 'fields', description: 'Caller resolves visibility. Direct fields or DynamicList records use independent collection bindings.' },
  ],
  HealthQuestionList: [
    { name: 'Questions and applicant answers', kind: 'slot', sourceSymbol: 'entries', description: 'Caller supplies question identities, order, applicant and content. Groups corresponding questions without merging answer bindings.' },
  ],
  ReviewSections: [
    { name: 'Document preview', kind: 'slot', sourceSymbol: 'documentPreview', description: 'Caller supplies the application readout; its adapter resolves saved fields and edit targets.' },
  ],
  LegalReviewSection: [
    { name: 'Disclosure content', kind: 'slot', sourceSymbol: 'children', description: 'Supplied legal statement, native notice blocks or electronic disclosure.' },
    { name: 'Print', kind: 'action', sourceSymbol: 'onPrint', description: 'Calls the supplied print action. The page currently prints the browser document.' },
  ],
  ProfileSections: [
    { name: 'Personal information', kind: 'slot', sourceSymbol: 'ProfilePersonalInformation', description: 'Independent member/spouse fields and license, residence and travel follow-ups.' },
    { name: 'Other coverage', kind: 'slot', sourceSymbol: 'renderFinancialFields', description: 'Life and disability follow-ups, supplied replacement notice and repeated carrier records. DynamicList owns record dialogs.' },
    { name: 'Financial questionnaire', kind: 'slot', sourceSymbol: 'renderFinancialQuestionnaireFields', description: 'Member financial details and local self-employment follow-ups; the page resolves policy participation.' },
  ],
  FormRoutePage: [
    { name: 'Surface header', kind: 'slot', sourceSymbol: 'formHeader', description: 'Optional full-width header within FormShell, above the padded form body. Advisor login supplies its themed title banner.' },
    { name: 'Form', kind: 'native-element', sourceSymbol: 'form', description: 'Owns form state, validation and submit handling; FormShell supplies the visual surface.' },
    { name: 'Page content', kind: 'slot', sourceSymbol: 'children', description: 'The page supplies its sections and shared pieces. This slot is not a fixed list of sections.' },
    { name: 'Contextual help', kind: 'slot', sourceSymbol: 'help', description: 'The page supplies help chips and their content; PageHeader places the help below the heading.' },
  ],
  ProgressStep: [
    { name: 'Breadcrumbs', kind: 'export', sourceSymbol: 'Breadcrumbs', description: 'Pages within the active main step, such as Membership, Eligibility, Beneficiary and Contact; shown when multiple applicable entries exist.' },
  ],
  PageTitle: [
    { name: 'Back button', kind: 'action', sourceSymbol: 'onBack', description: 'Optional back action rendered beside the heading; the page template owns navigation.' },
  ],
  PageNav: [
    { name: 'Next button', kind: 'action', sourceSymbol: 'formId', description: 'Submits the associated form with shared disabled and transition states.' },
  ],
  ProductCard: [
    { name: 'Product heading', kind: 'native-element', sourceSymbol: 'h4', description: 'Consistent product title at weight 800, optional brochure link, QD indicator and header action.' },
    { name: 'Product content', kind: 'slot', sourceSymbol: 'children', description: 'Coverage, beneficiary, payment, quote or receipt content supplied by the caller.' },
  ],
};

export function componentStructure(row, rows, analyzer) {
  const matches = Object.entries(roles).filter(([, names]) => names.includes(row.name));
  if (matches.length !== 1) throw new Error(`Assign one reviewed component role: ${row.name}`);
  const trace = row.packageImport ? { components: [], elements: [] } : analyzer.trace(row.source, analyzer.module(row.source).ast);
  const contains = rows.filter(child => child.source !== row.source && (child.packageImport
    ? trace.elements.some(element => element.kind === 'package-component' && (element.origin === child.packageImport.module && element.symbol === child.packageImport.symbol || element.origin === `${child.packageImport.module}/${child.packageImport.symbol}` && element.symbol === 'default'))
    : trace.components.some(component => component.source === child.source))).map(child => child.id).sort();
  return { role: matches[0][0], contains, parts: parts[row.name] ?? [] };
}
