import type { CoverageCategoryId } from "../config/coverageCategories";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { PageId } from "../types";

// ─── Home Page ────────────────────────────────────────────────────────────────

export type HomeContent = {
  hero: {
    tagline: string;
    title: string;
    description: string;
    welcomeBackTitle: string;
    welcomeBackDescription: string;
    ctaLabel: string;
    secondaryCtaLabel: string;
    resumePrompt: string;
    resumeLinkLabel: string;
  };
  howApplyingWorks: {
    title: string;
    description: string;
  };
  applyingSteps: Array<{
    title: string;
    body: string;
    imageSrc: string;
    imageAlt: string;
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
};

// ─── Coverage ─────────────────────────────────────────────────────────────────

export type CoverageContent = {
  categoryDescriptions: Record<CoverageCategoryId, string>;
  applicantLabels: Record<CoverageApplicantId, string>;
  applicantCheckboxLabels: {
    member: string;
    spouse: string;
    child: string;
  };
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
  title: string;
  subhead?: string;
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
  alertTitle: string;
  alertItems: Array<{ title: string; description: string }>;
  healthQuestionsNote: { title: string; description: string };
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
  decisionSteps: string[];
  decisionStatuses: {
    fullyUnderwritten: DecisionStatusContent;
    conditionallyApproved: DecisionStatusContent;
    referred: DecisionStatusContent;
    softDeclined: DecisionStatusContent;
    databaseUnavailable: DecisionStatusContent;
  };
};

// ─── Help / Drawer ────────────────────────────────────────────────────────────

export type HelpContent = {
  howApplyingWorks: {
    intro: string;
    steps: Array<{ title: string; body: string }>;
  };
  applicationReview: {
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
};

// ─── Shared ───────────────────────────────────────────────────────────────────

export type SharedContent = {
  applicantLabels: Record<CoverageApplicantId, string>;
  applicantSectionTitles: Record<"self" | "spouse" | "child", string>;
  cookieBanner: {
    message: string;
    learnMoreLabel: string;
    learnMoreHref: string;
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
};
