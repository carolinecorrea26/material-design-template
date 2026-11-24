import type { CoverageCategoryId } from "../config/coverageCategories";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { PageId } from "../types";

// ─── Home Page ────────────────────────────────────────────────────────────────

export type HomeContent = {
  landingNotice: { title: string; text: string };
  hero: {
    image: { src: string; alt: string };
    tagline: string;
    title: string;
    description: string;
    ctaLabel: string;
    secondaryCtaLabel: string;
  };
  howApplyingWorks: {
    title: string;
    description: string;
  };
  applyingSteps: Array<{
    title: string;
    body: string;
  }>;
  coverageOptions: {
    title: string;
    description: string;
  };
  nylCredentials: {
    name: string;
    tagline: string;
    description: string;
    ratingsNote: string;
    ratings: Array<{ grade: string; source: string }>;
  };
  /** Optional client-specific section (e.g., AMA org description on homepage) */
  clientSection?: {
    tagline: string;
    paragraphs: string[];
  };
  quoteSection: {
    title: string;
    description: string;
  };
  reviewProcessLinkLabel: string;
  quickDecisionAvailableSuffix: string;
  noCoverageCategoriesMessage: string;
  availableForLabel: string;
};

// ─── Coverage ─────────────────────────────────────────────────────────────────

export type CoverageContent = {
  needsCalculator: Record<string, string>;
  categoryDescriptions: Record<CoverageCategoryId, string>;
  applicantLabels: Record<CoverageApplicantId, string>;
  applicantCheckboxLabels: {
    member: string;
    spouse: string;
    child: string;
  };
  selectAtLeastOneCategoryError: string;
  correctErrorsMessage: string;
};

// ─── Navigation ───────────────────────────────────────────────────────────────

export type TransitionMessagePair = [string, string];

export type NavigationContent = {
  progressStepLabels: Record<string, string>;
  transitionMessages: Partial<Record<PageId, TransitionMessagePair>>;
  transitionDefaults: TransitionMessagePair;
  backMessage: string;
};

// ─── Pages ────────────────────────────────────────────────────────────────────

export type PageContent = {
  /** Source-bound page guidance read by shared page sections. */
  messages?: Record<string, string>;
  /** Entry loading copy is independent of the forward-transition message pair. */
  loading?: string;
  title: string;
  subhead?: string;
  /** Optional guidance in the shared redirect-page template. */
  recoveryGuidance?: string;
  navTitle: string;
  /** Optional info note displayed below page title/subhead/help and above form questions. */
  infoNote?: string;
  /** Optional info notes for specific sections, keyed by section id. Displayed below section titles. */
  sectionNotes?: Partial<Record<string, string>>;
};

export type PagesContent = Record<PageId, PageContent>;

// ─── Footer ───────────────────────────────────────────────────────────────────

export type LegalDocSection =
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "address"; lines: string[] }
  | { type: "note"; text: string };

export type LegalDocContent = {
  title: string;
  sections: LegalDocSection[];
  revision?: string;
};

export type FooterContent = {
  administeredByLabel: string;
  underwrittenBy: {
    label: string;
    name: string;
    policyForm: string;
    address: string;
  };
  ratings: Array<{ grade: string; source: string }>;
  ratingsAsOf: string;
  legal: string[];
  links: { termsOfUse: string; privacyNotice: string };
  /** Global legal documents — not client-configurable. */
  termsOfUseContent: LegalDocContent;
  privacyNoticeContent: LegalDocContent;
};

// ─── Review ───────────────────────────────────────────────────────────────────

export type ReviewContent = {
  importantNotices?: Record<string, LegalDocContent>;
  readAndSignTitle: string;
  readAndSignContent: string;
  electronicConsentTitle: string;
  electronicConsentContent: string;
};

// ─── Receipt ──────────────────────────────────────────────────────────────────

export type DecisionStatusContent = {
  label: string;
  description: string;
};

export type ReceiptContent = {
  underwritingNote: { title: string; text: string };
  email: { subject: string; title: string; intro: string; summary: string; closing: string; signature: string };
  paymentNotice?: string;
  decisionStatuses: {
    fullyUnderwritten: DecisionStatusContent;
    conditionallyApproved: DecisionStatusContent;
    referred: DecisionStatusContent;
    softDeclined: DecisionStatusContent;
    databaseUnavailable: DecisionStatusContent;
  };
  documentsNote: string;
  confirmationNumberLabel: string;
  documentDownloadLabels: {
    application: string;
    payment: string;
  };
  coverageDecisions: {
    title: string;
    description: string;
    noSelectionsMessage: string;
  };
  whatHappensNext: {
    title: string;
  };
};

// ─── Beneficiary ──────────────────────────────────────────────────────────────

export type BeneficiaryContent = {
  noMoreOnlineMessage: string;
  noApplicantProductsMessage: string;
  missingBeneficiaryError: string;
};

// ─── Help / Drawer ────────────────────────────────────────────────────────────

export type HelpContent = {
  howApplyingWorks: {
    intro: string;
    steps: Array<{ title: string; body: string }>;
    /** Titles for the nested sub-drawers opened from within the "How applying works" drawer. */
    subDrawerTitles: {
      applicationReview: string;
      quickDecision: string;
    };
  };
  applicationReview: {
    /** Title used when this drawer is opened directly (e.g. from the Home page). */
    title: string;
    intro: string;
    whatToExpectTitle: string;
    whatToExpectItems: string[];
    closingNote: string;
  };
  groupInsurance: {
    intro: string;
    exploreTitle: string;
    exploreItems: string[];
  };
  coverageOptions: {
    intro: string;
  };
  beneficiary: {
    whatIs: {
      paragraphs: string[];
    };
    percentageShare: {
      paragraphs: string[];
    };
  };
  whyAsked: {
    intro: string;
    sections: Array<{
      title: string;
      description: string;
    }>;
  };
  paymentHandling: {
    intro: string;
    sections: Array<{
      title: string;
      description: string;
    }>;
  };
  quickDecision: {
    availability: string;
    showMore: string;
    showLess: string;
    /** Text preceding the "QuickDecision" mark in the drawer title, e.g. "What is". */
    titlePrefix: string;
    /** Text following the QuickDecision mark in the intro paragraph. */
    intro: string;
    whatToExpectTitle: string;
    whatToExpectItems: string[];
    importantToKnowTitle: string;
    /** First item is plain text; the second item's text follows an inline QuickDecision mark. */
    importantToKnowItems: string[];
  };
  coveragePortfolio: {
    title: string;
    intro: string;
  };
};

// ─── Shared ───────────────────────────────────────────────────────────────────

export type SharedContent = {
  interfaceMessages: Record<string, string>;
  emailMessages: Record<string, string>;
  emailPurge: Record<string, string>;
  emailSenderName: string;
  emailAdvisor: Record<string, string>;
  emailSalutation: string;
  emailApplicantFallback: string;
  insurerLogo: { src: string; alt: string };
  support: {
    title: string;
    technicalTitle: string;
    technicalEmailLabel: string;
    technicalEmailAddress: string;
    administratorSuffix: string;
    callLabel: string;
    emailLabel: string;
    websiteLabel: string;
    emailSubject: string;
    applicationReference: string;
    confirmationReference: string;
  };
  applicantLabels: Record<CoverageApplicantId, string>;
  applicantSectionTitles: Record<"self" | "spouse" | "child", string>;
  cookieBanner: {
    message: string;
    learnMoreLabel: string;
    learnMoreHref: string;
  };
};

// ─── Dialogs ──────────────────────────────────────────────────────────────────

export type DialogMessage = {
  title: string;
  message: string;
};

export type SendApplicationDialogVariant = {
  title: string;
  introText: string;
};

export type DialogsContent = {
  confirmation: {
    editApplication: DialogMessage;
    dependentCoverage: DialogMessage;
  };
  sendApplication: {
    sendToApplicant: SendApplicationDialogVariant;
    requestEditToApplication: SendApplicationDialogVariant;
  };
  beneficiary: {
    addTitle: string;
    editTitle: string;
    applyToOthersTitle: string;
    applyToOthersPrompt: string;
  };

};

// ─── Root ─────────────────────────────────────────────────────────────────────

export type SiteContent = {
  home: HomeContent;
  coverage: CoverageContent;
  navigation: NavigationContent;
  pages: Partial<PagesContent>;
  footer: FooterContent;
  review: ReviewContent;
  receipt: ReceiptContent;
  help: HelpContent;
  shared: SharedContent;
  beneficiary: BeneficiaryContent;
  dialogs: DialogsContent;
};
