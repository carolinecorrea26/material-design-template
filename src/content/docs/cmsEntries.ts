import {
  getLegacyClientConfigForSite,
  getLegacyClientIdForSite,
  siteEntities,
  type SiteId,
} from "../../data";
import { avmaClient } from "../../config/clients/avma";
import type { ProductContentBlock } from "../../config/clients/types";
import { getSiteDetailsPageOrder } from "../../config/resolvers";
import { buildContent } from "../index";
import type { SiteContent } from "../types";
import {
  homeDefaults,
  coverageDefaults,
  navigationDefaults,
  footerDefaults,
  reviewDefaults,
  receiptDefaults,
  helpDefaults,
  sharedDefaults,
  pagesDefaults,
  beneficiaryDefaults,
  dialogsDefaults,
  statusMessagesDefaults,
} from "../defaults";

// Generated from the complete managed-content tree so new copy automatically
// appears in the CMS reference instead of relying on a hand-picked inventory.
export type CmsContentType = "Text" | "Image" | "Video" | "Document" | "Link";
type CmsPageNoteType = `${string} page note`;

export type CmsComponentType =
  | "Page title"
  | "Page subtitle"
  | CmsPageNoteType
  | "Section note"
  | "Navigation label"
  | "Default homepage variant"
  | "Welcome-back homepage variant"
  | "Button"
  | "Section content"
  | "Drawer"
  | "Dialog"
  | "Applicant label"
  | "Form label"
  | "Validation message"
  | "Progress stepper"
  | "Loading message"
  | "Back navigation"
  | "Footer content"
  | "Legal document"
  | "Cookie dialog"
  | "Page alert"
  | "Status page"
  | "Image"
  | "Document"
  | "Branding";

export type CmsEntry = {
  id: string;
  type: CmsContentType;
  /** Controlled page and component values (not free-form CMS metadata). */
  page: string;
  componentType: CmsComponentType;
  component: string;
  /** Verified Storybook selection ID, resolved to a URL by the rendering UI. */
  storybookId: string;
  status: "Published";
  lastModified: null;
  globalValue: string;
  effectiveValue: (siteId: SiteId) => string;
  overridden: (siteId: SiteId) => boolean;
  /** Stable source sequence used after page and component-type grouping. */
  sourceOrder: number;
};

const globalContent: SiteContent = {
  home: homeDefaults,
  coverage: coverageDefaults,
  navigation: navigationDefaults,
  pages: pagesDefaults as SiteContent["pages"],
  footer: footerDefaults,
  review: reviewDefaults,
  receipt: receiptDefaults,
  help: helpDefaults,
  shared: sharedDefaults,
  beneficiary: beneficiaryDefaults,
  dialogs: dialogsDefaults,
  statusMessages: statusMessagesDefaults,
};

const contentBySite = new Map<SiteId, SiteContent>();
function contentFor(siteId: SiteId): SiteContent {
  let content = contentBySite.get(siteId);
  if (!content) {
    content = buildContent(siteId);
    contentBySite.set(siteId, content);
  }
  return content;
}

function resolveForDisplay(str: string, branding?: { name: string; acronym: string }): string {
  const name = branding?.name ?? "[Client Name]";
  const acronym = branding?.acronym ?? "[Acronym]";
  return str
    .replace(/\{\{clientName\}\}/g, name)
    .replace(/\{\{clientAcronym\}\}/g, acronym)
    .replace(/\{\{associationName\}\}/g, name);
}

function externalEntry(
  id: string,
  type: CmsContentType,
  location: string,
  componentType: CmsComponentType,
  globalValue: string,
  effectiveValue: (siteId: SiteId) => string,
  storybookId = "application-patterns-page-coverage-audit--all-routes",
  sourceOrder = Number.MAX_SAFE_INTEGER,
): CmsEntry {
  const { page, component } = splitLocation(location);
  return {
    id,
    type,
    page,
    componentType,
    component,
    storybookId,
    status: "Published",
    lastModified: null,
    globalValue,
    effectiveValue,
    overridden: (siteId) => effectiveValue(siteId) !== globalValue,
    sourceOrder,
  };
}

function splitLocation(location: string): { page: string; component: string } {
  const separatorIndex = location.indexOf(" - ");
  if (separatorIndex === -1) return { page: location, component: "Page content" };
  return {
    page: location.slice(0, separatorIndex),
    component: location.slice(separatorIndex + 3),
  };
}

function flattenProductContent(blocks: ProductContentBlock[] | undefined): string {
  if (!blocks || blocks.length === 0) return "—";
  return blocks
    .map((block) => {
      if (block.type === "list") return block.items.join(" ");
      if (block.type === "section") return `${block.heading}: ${block.body.join(" ")}`;
      return block.text;
    })
    .join(" ");
}

function flattenLegalDocument(
  document: SiteContent["footer"]["termsOfUseContent"],
): string {
  const sections = document.sections.map((section) => {
    if (section.type === "list") return section.items.join("\n");
    if (section.type === "address") return section.lines.join("\n");
    return section.text;
  });

  return [
    document.title,
    ...sections,
    document.revision ? `Revision: ${document.revision}` : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");
}

const PUBLIC_PAGE_LABELS: Record<string, string> = {
  home: "Home",
  membership: "Membership",
  eligibility: "Eligibility",
  coverage: "Coverage",
  profile: "Profile",
  beneficiary: "Beneficiary",
  contact: "Contact",
  review: "Review",
  docusign: "E-Sign (DocuSign)",
  "health-si": "Health Questions (SI)",
  "health-li": "Health Questions (LI)",
  "health-qd": "Health Questions (QD)",
  "health-di": "Health Questions (DI)",
  "health-cir": "Health Questions (CIR)",
  payment: "Payment",
  receipt: "Receipt",
  resume: "Resume Application",
  "resume-method": "Resume Application",
  "resume-code": "Resume Application",
  "advisor-login": "Advisor Portal",
  "advisor-send-confirmation": "Advisor Portal",
  "application-edit-confirmation": "Advisor Portal",
};

const PAGE_COMPONENT_LABELS: Record<string, string> = {
  resume: "Resume Entry",
  "resume-method": "Verification Method",
  "resume-code": "Verification Code",
  "advisor-login": "Advisor Login",
  "advisor-send-confirmation": "Send Confirmation",
  "application-edit-confirmation": "Edit Confirmation",
};

// Page content belongs in the CMS only when the experience actually renders it.
// Home uses its hero content rather than pages.home, and navTitle is only read
// by the multi-page vertical-stepper breadcrumbs for these routes.
const DISPLAYED_NAV_TITLE_PAGE_IDS = new Set([
  "membership",
  "eligibility",
  "beneficiary",
  "contact",
  "profile",
  "review",
  "payment",
]);

// These pages render a different subhead source (or no subhead) in their page
// implementation, so their pages.*.subhead value is configuration metadata.
const NON_RENDERED_PAGE_SUBHEAD_IDS = new Set([
  "receipt",
  "resume-method",
  "resume-code",
]);

function titleCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pathSegments(path: string): string[] {
  return path.match(/[^.[\]]+/g) ?? [];
}

function valueAtPath(content: SiteContent, path: string): string | undefined {
  let current: unknown = content;
  for (const segment of pathSegments(path)) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function collectStringPaths(value: unknown, prefix: string, paths: Set<string>): void {
  if (typeof value === "string") {
    paths.add(prefix);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringPaths(item, `${prefix}[${index}]`, paths));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) =>
      collectStringPaths(child, prefix ? `${prefix}.${key}` : key, paths),
    );
  }
}

function isManagedPublicPath(path: string): boolean {
  const segments = pathSegments(path);
  if (segments.at(-1) === "type") return false;
  // Legal documents are represented as one CMS item apiece rather than one
  // item for every heading, paragraph, list item, address line, and revision.
  if (
    path.startsWith("footer.termsOfUseContent.") ||
    path.startsWith("footer.privacyNoticeContent.")
  ) {
    return false;
  }
  // These are legacy copies of the canonical shared applicant labels. They are
  // not read by the UI, but recursive collection used to expose all three
  // copies as separate CMS rows.
  if (path.startsWith("coverage.applicantLabels.")) return false;
  if (path.startsWith("shared.applicantSectionTitles.")) return false;
  if (segments[0] !== "pages") return true;

  const [, pageId, field] = segments;
  if (!PUBLIC_PAGE_LABELS[pageId]) return false;
  if (pageId === "home") return false;
  if (field === "navTitle") return DISPLAYED_NAV_TITLE_PAGE_IDS.has(pageId);
  if (field === "subhead") return !NON_RENDERED_PAGE_SUBHEAD_IDS.has(pageId);
  return true;
}

function contentTypeForPath(path: string): CmsContentType {
  if (/\.imageSrc$/.test(path)) return "Image";
  if (/\.learnMoreHref$/.test(path)) return "Link";
  if (/footer\.(termsOfUseContent|privacyNoticeContent)/.test(path)) return "Document";
  return "Text";
}

function componentTypeForPath(path: string): CmsComponentType {
  const [root, section, field] = pathSegments(path);

  if (root === "pages") {
    if (field === "title") return "Page title";
    if (field === "subhead") return "Page subtitle";
    if (field === "navTitle") return "Navigation label";
    if (field === "infoNote") {
      return `${PUBLIC_PAGE_LABELS[section] ?? titleCase(section)} page note`;
    }
    if (field === "sectionNotes") return "Section note";
    return "Section content";
  }

  if (root === "home") {
    if (section === "hero" && (field === "welcomeBackTitle" || field === "welcomeBackDescription")) {
      return "Welcome-back homepage variant";
    }
    if (
      (section === "hero" && ["ctaLabel", "secondaryCtaLabel", "resumeLinkLabel"].includes(field)) ||
      path === "home.reviewProcessLinkLabel"
    ) {
      return "Button";
    }
    if (section === "hero" || section === "quoteSection") return "Default homepage variant";
    return "Section content";
  }

  if (root === "help") return "Drawer";
  if (root === "dialogs") return "Dialog";
  if (root === "statusMessages") return "Status page";
  if (root === "beneficiary") return "Page alert";

  if (root === "coverage") {
    if (section === "applicantCheckboxLabels") return "Form label";
    if (section === "selectAtLeastOneCategoryError" || section === "correctErrorsMessage") {
      return "Validation message";
    }
    return "Section content";
  }

  if (root === "shared") {
    if (section === "cookieBanner") return "Cookie dialog";
    return "Applicant label";
  }

  if (root === "navigation") {
    if (section === "progressStepLabels") return "Progress stepper";
    if (section === "backMessage") return "Back navigation";
    return "Loading message";
  }

  if (root === "footer") {
    if (section === "termsOfUseContent" || section === "privacyNoticeContent") {
      return "Legal document";
    }
    return "Footer content";
  }

  if (root === "review") {
    if (section === "readAndSignTitle" || section === "readAndSignContent") return "Section content";
    if (section === "electronicConsentTitle" || section === "electronicConsentContent") {
      return "Legal document";
    }
    return "Page alert";
  }

  if (root === "receipt") {
    if (section === "decisionSteps") return "Progress stepper";
    if (section === "documentDownloadLabels") return "Button";
    return "Section content";
  }

  return "Section content";
}

/** Maps every managed path into a finite set of specific CMS location tags. */
function locationForPath(path: string): string {
  const p = pathSegments(path);
  const [root, section, field] = p;

  if (root === "pages") {
    const page = PUBLIC_PAGE_LABELS[section] ?? titleCase(section);
    const componentPrefix = PAGE_COMPONENT_LABELS[section];
    if (field === "title") return `${page} - ${componentPrefix ? `${componentPrefix} ` : ""}Page Title`;
    if (field === "subhead") {
      return `${page} - ${componentPrefix ? `${componentPrefix} ` : ""}Page Subtitle`;
    }
    if (field === "navTitle") {
      return `${page} - ${componentPrefix ? `${componentPrefix} ` : ""}Navigation Label`;
    }
    if (field === "infoNote") return `${page} - Page Information Note`;
    if (field === "sectionNotes") return `${page} - ${titleCase(p[3] ?? "Section")} Note`;
    return `${page} - Page Content`;
  }

  if (root === "home") {
    if (section === "reviewProcessLinkLabel") return "Home - Review Process Link";
    if (section === "hero") {
      if (field === "ctaLabel") return "Home - Primary Hero Button";
      if (field === "secondaryCtaLabel") return "Home - Secondary Hero Button";
      if (field === "resumeLinkLabel") return "Home - Resume Application Link";
      return "Home - Hero Section";
    }
    if (section === "howApplyingWorks") return "Home - 'How does applying work?' Section";
    if (section === "applyingSteps") return `Home - 'How does applying work?' Step ${Number(field) + 1}`;
    if (section === "coverageOptions") return "Home - 'Your coverage options' Section";
    if (section === "nylCredentials") return "Home - New York Life Credentials Section";
    if (section === "quoteSection") return "Home - 'Get an instant quote' Section";
    if (section === "clientSection") return "Home - Client Introduction Section";
    return "Home - Coverage Options Section";
  }

  if (root === "receipt") {
    if (section === "decisionSteps") return "Receipt - Decision Progress Stepper";
    if (section === "decisionStatuses") return `Receipt - '${titleCase(field)}' Decision Status`;
    if (section === "summaryLabels") return "Receipt - Application Summary";
    if (section === "coverageCardLabels") return "Receipt - Coverage Decision Card";
    if (section === "documentDownloadLabels") {
      return `Receipt - ${titleCase(field)} PDF Download Button`;
    }
    if (section === "confirmationNumberLabel") return "Receipt - Confirmation Number";
    if (section === "coverageDecisions") return "Receipt - Coverage Decisions Section";
    if (section === "whatHappensNext") return "Receipt - 'What happens next?' Section";
    if (section === "support") return "Receipt - Support Section";
    return "Receipt - Documents Section";
  }

  if (root === "review") {
    if (section === "alertTitle" || section === "alertItems") return "Review - Important Information Alert";
    if (section === "healthQuestionsNote") return "Review - Health Questions Note";
    if (section === "readAndSignTitle" || section === "readAndSignContent") return "Review - Read & Sign Section";
    return "E-Sign (DocuSign) - Electronic Consent";
  }

  if (root === "help") {
    if (section === "beneficiary" && field === "whatIs") {
      return "Beneficiary - What Is a Beneficiary Drawer";
    }
    if (section === "beneficiary" && field === "percentageShare") {
      return "Beneficiary - Percentage Share Drawer";
    }
    const locations: Record<string, string> = {
      howApplyingWorks: "Home - 'How does applying work?' Drawer",
      applicationReview: "Home - Application Review Drawer",
      groupInsurance: "Home - Group Insurance Drawer",
      coverageOptions: "Coverage - Coverage Options Drawer",
      beneficiary: "Beneficiary - Help Drawers",
      whyAsked: "Coverage - 'Why is this asked?' Drawer",
      paymentHandling: "Payment - Payment Handling Drawer",
      quickDecision: "Health Questions - QuickDecision Drawer",
      coveragePortfolio: "Home - Coverage Portfolio Drawer",
    };
    return locations[section] ?? "Global - Help Drawer";
  }

  if (root === "coverage") {
    if (section === "categoryDescriptions") return `Coverage - ${field} Category Description`;
    if (section === "applicantLabels") return "Coverage - Applicant Labels";
    if (section === "applicantCheckboxLabels") return "Coverage - Applicant Selection Labels";
    return "Coverage - Validation Message";
  }

  if (root === "navigation") {
    if (section === "progressStepLabels") return "Global - Progress Stepper";
    if (section === "backMessage") return "Global - Back Navigation";
    if (section === "transitionMessages") {
      return `Global - ${titleCase(field)} Page Transition Messages`;
    }
    if (section === "transitionDefaults") return "Global - Default Page Transition Messages";
    return "Global - Page Transition Messages";
  }

  if (root === "footer") {
    if (section === "termsOfUseContent") return "Global - Terms of Use Document";
    if (section === "privacyNoticeContent") return "Global - Privacy Notice Document";
    if (section === "ratings" || section === "ratingsAsOf") return "Global - Footer Ratings";
    if (section === "links") return "Global - Footer Links";
    if (section === "underwrittenBy") return "Global - Footer Underwriter";
    return "Global - Footer";
  }

  if (root === "shared") {
    if (section === "cookieBanner") return "Global - Cookie Banner";
    return "Global - Applicant Labels";
  }

  if (root === "beneficiary") return "Beneficiary - Page Message";

  if (root === "dialogs") {
    const dialogName = p.slice(1, -1).map(titleCase).join(" - ");
    return `Global - ${dialogName} Dialog`;
  }

  if (root === "statusMessages") {
    const locations: Record<string, string> = {
      docusign: "E-Sign (DocuSign) - Redirect Status",
      healthQd: "Health Questions (QD) - Redirect Status",
      healthCir: "Health Questions (CIR) - Placeholder Status",
    };
    return locations[section] ?? "Global - Status Message";
  }

  return `${titleCase(root)} - ${titleCase(section ?? "Content")}`;
}

function storybookIdForPath(path: string): string {
  const [root, section] = pathSegments(path);

  if (root === "pages") return "layout-pageheader--default";
  if (root === "home") {
    if (section === "howApplyingWorks" || section === "applyingSteps") {
      return "coverage-commerce-howapplyingworkspanel--page-variant";
    }
    if (section === "coverageOptions") {
      return "coverage-commerce-coverageoptionspanel--page-variant";
    }
    if (section === "quoteSection") {
      return "coverage-commerce-quotecalculator--collects-eligibility";
    }
    if (section === "nylCredentials" || section === "clientSection") {
      return "layout-appbody--default";
    }
    return "application-patterns-page-coverage-audit--all-routes";
  }
  if (root === "receipt") {
    return "application-patterns-page-coverage-audit--all-routes";
  }
  if (root === "review") {
    if (section === "alertTitle" || section === "alertItems" || section === "healthQuestionsNote") {
      return "feedback-pagealert--error";
    }
    return "content-applicationdocumentpreview--default";
  }
  if (root === "help") {
    if (section === "howApplyingWorks") {
      return "coverage-commerce-howapplyingworkspanel--page-variant";
    }
    if (section === "coverageOptions") {
      return "coverage-commerce-coverageoptionspanel--page-variant";
    }
    if (section === "coveragePortfolio") {
      return "coverage-commerce-coverageportfoliodrawer--member-only";
    }
    if (section === "quickDecision") {
      return "content-quickdecision--info-box-inline-collapse";
    }
    return "overlays-appdrawer--default";
  }
  if (root === "coverage") {
    if (section === "categoryDescriptions") {
      return "coverage-commerce-coveragecategoryselector--default";
    }
    return "coverage-commerce-productcatalog--interactive";
  }
  if (root === "navigation") {
    if (section === "progressStepLabels") {
      return "navigation-progressstep--collapsed-steps";
    }
    if (section === "backMessage") return "navigation-pagenav--default";
    return "feedback-pagetransitionskeleton--with-message";
  }
  if (root === "footer") {
    if (section === "termsOfUseContent" || section === "privacyNoticeContent") {
      return "content-legaldoclist--terms-of-use";
    }
    return "layout-appfooter--default";
  }
  if (root === "shared") {
    if (section === "cookieBanner") return "overlays-cookiedialog--default";
    return "layout-applicantsectiondivider--member-section";
  }
  if (root === "beneficiary") return "feedback-pagealert--error";
  if (root === "dialogs") {
    if (section === "confirmation") return "overlays-confirmationdialog--default";
    if (section === "sendApplication") {
      return "overlays-sendapplicationdialog--default";
    }
    return "overlays-appmodal--default";
  }
  if (root === "statusMessages") {
    return "feedback-processingstatuspage--external-service";
  }
  return "application-patterns-page-coverage-audit--all-routes";
}

function managedEntry(path: string, sourceOrder: number): CmsEntry {
  const rawGlobal = valueAtPath(globalContent, path);
  const { page, component } = splitLocation(locationForPath(path));
  return {
    id: `managed-${path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}`,
    type: contentTypeForPath(path),
    page,
    componentType: componentTypeForPath(path),
    component,
    storybookId: storybookIdForPath(path),
    status: "Published",
    lastModified: null,
    globalValue: rawGlobal === undefined ? "—" : resolveForDisplay(rawGlobal),
    effectiveValue: (siteId) => {
      const value = valueAtPath(contentFor(siteId), path);
      return value === undefined
        ? "—"
        : resolveForDisplay(value, getLegacyClientConfigForSite(siteId).branding);
    },
    overridden: (siteId) => valueAtPath(contentFor(siteId), path) !== rawGlobal,
    sourceOrder,
  };
}

const managedPaths = new Set<string>();
collectStringPaths(globalContent, "", managedPaths);
siteEntities.forEach((site) => collectStringPaths(contentFor(site.id), "", managedPaths));

const managedEntries = Array.from(managedPaths)
  .filter(isManagedPublicPath)
  .map(managedEntry);

const legalDocumentEntries: CmsEntry[] = [
  externalEntry(
    "managed-footer-terms-of-use-content",
    "Document",
    "Global - Terms of Use Document",
    "Legal document",
    flattenLegalDocument(globalContent.footer.termsOfUseContent),
    (siteId) => flattenLegalDocument(contentFor(siteId).footer.termsOfUseContent),
    "content-legaldoclist--terms-of-use",
    0,
  ),
  externalEntry(
    "managed-footer-privacy-notice-content",
    "Document",
    "Global - Privacy Notice Document",
    "Legal document",
    flattenLegalDocument(globalContent.footer.privacyNoticeContent),
    (siteId) => flattenLegalDocument(contentFor(siteId).footer.privacyNoticeContent),
    "content-legaldoclist--privacy-notice",
    1,
  ),
];

const externalEntries: CmsEntry[] = [
  externalEntry(
    "home-hero-image",
    "Image",
    "Home - Hero Section",
    "Default homepage variant",
    "—",
    (siteId) => {
      const legacyClientId = getLegacyClientIdForSite(siteId);
      const variant = getLegacyClientConfigForSite(siteId).features?.homePageVariant ?? "default";
      return variant === "hero-image" || variant === "welcome-back"
        ? `/client/${legacyClientId}/hero.png`
        : "—";
    },
    "application-patterns-page-coverage-audit--all-routes",
  ),
  externalEntry(
    "global-client-logo",
    "Image",
    "Global - Header & Footer Branding",
    "Branding",
    "—",
    (siteId) => {
      const { logo, logoAlt } = getLegacyClientConfigForSite(siteId).branding;
      return `${logo} (alt: "${logoAlt}")`;
    },
    "foundations-branding--branding",
  ),
  externalEntry(
    "footer-license-info",
    "Text",
    "Global - Footer",
    "Footer content",
    "—",
    (siteId) => {
      const info = getLegacyClientConfigForSite(siteId).licenseInfo;
      return info && info.length > 0 ? info.join(" / ") : "—";
    },
    "layout-appfooter--default",
  ),
  externalEntry(
    "coverage-avma-hospital-indemnity-disclosure",
    "Text",
    "Coverage - AVMA Hospital Indemnity Product",
    "Section content",
    "—",
    (siteId) =>
      getLegacyClientIdForSite(siteId) === "avma"
        ? flattenProductContent(avmaClient.coverages.overrides?.["sh-hospital-income"]?.productContent)
        : "—",
    "coverage-commerce-productcatalog--interactive",
  ),
  externalEntry(
    "coverage-brochure",
    "Document",
    "Coverage - Coverage Options Drawer",
    "Document",
    "—",
    (siteId) => {
      const legacyClientId = getLegacyClientIdForSite(siteId);
      if (legacyClientId === "avma") {
        return "https://avmainsuranceservices.com/Downloads/AVMA/Applications/AVMA-SC-APP-LOAN-FORM.pdf";
      }
      if (legacyClientId === "csea") return "/client/csea/li-clerical.pdf";
      return `/client/${legacyClientId}/brochure.pdf`;
    },
    "coverage-commerce-coverageoptionspanel--page-variant",
  ),
  externalEntry(
    "coverage-brochure-csea-di-clerical",
    "Document",
    "Coverage - Coverage Options Drawer",
    "Document",
    "—",
    (siteId) =>
      getLegacyClientIdForSite(siteId) === "csea"
        ? "/client/csea/di-clerical.pdf"
        : "—",
    "coverage-commerce-coverageoptionspanel--page-variant",
  ),
  externalEntry(
    "coverage-quote-cost-footnote",
    "Text",
    "Coverage - Quote Tool",
    "Coverage page note",
    "Quoted cost is the best rate available based on the information you provided. Final cost may be based upon factors such as gender, health status, and use of tobacco/nicotine. Rates current as of 2026.",
    () => "Quoted cost is the best rate available based on the information you provided. Final cost may be based upon factors such as gender, health status, and use of tobacco/nicotine. Rates current as of 2026.",
    "coverage-commerce-quotecalculator--collects-eligibility",
  ),
];

const cmsPageOrder = Array.from(
  new Set(
    getSiteDetailsPageOrder()
      .map((pageId) => PUBLIC_PAGE_LABELS[pageId])
      .filter((label): label is string => Boolean(label)),
  ),
);
const lastHealthPageIndex = cmsPageOrder.findLastIndex((label) =>
  label.startsWith("Health Questions"),
);
cmsPageOrder.splice(lastHealthPageIndex + 1, 0, "Health Questions");
cmsPageOrder.push("Global");

function cmsPageRank(page: string): number {
  const index = cmsPageOrder.indexOf(page);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

const COMPONENT_TYPE_ORDER: CmsComponentType[] = [
  "Page title",
  "Page subtitle",
  "Coverage page note",
  "Section note",
  "Navigation label",
  "Default homepage variant",
  "Welcome-back homepage variant",
  "Button",
  "Section content",
  "Applicant label",
  "Form label",
  "Validation message",
  "Progress stepper",
  "Loading message",
  "Back navigation",
  "Drawer",
  "Dialog",
  "Cookie dialog",
  "Page alert",
  "Status page",
  "Image",
  "Document",
  "Branding",
  "Footer content",
  "Legal document",
];

function cmsComponentTypeRank(componentType: CmsComponentType): number {
  if (componentType.endsWith(" page note")) {
    return COMPONENT_TYPE_ORDER.indexOf("Coverage page note");
  }
  return COMPONENT_TYPE_ORDER.indexOf(componentType);
}

const INDEPENDENT_COMPONENT_TYPES = new Set<CmsComponentType>([
  "Button",
  "Applicant label",
  "Form label",
  "Validation message",
  "Progress stepper",
]);

function consolidateCmsEntries(entries: CmsEntry[]): CmsEntry[] {
  const groups = new Map<string, CmsEntry[]>();

  for (const entry of entries) {
    const key = [
      entry.type,
      entry.page,
      entry.componentType,
      entry.component,
      entry.storybookId,
      INDEPENDENT_COMPONENT_TYPES.has(entry.componentType) ? entry.id : "",
    ].join("\u0000");
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  const joinValues = (values: string[]) => {
    const displayedValues = values.filter((value) => value !== "—");
    return (displayedValues.length > 0 ? displayedValues : ["—"]).join("\n\n");
  };

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    if (group.length === 1) return first;

    return {
      ...first,
      globalValue: joinValues(group.map((entry) => entry.globalValue)),
      effectiveValue: (siteId) =>
        joinValues(group.map((entry) => entry.effectiveValue(siteId))),
      overridden: (siteId) => group.some((entry) => entry.overridden(siteId)),
      sourceOrder: Math.min(...group.map((entry) => entry.sourceOrder)),
    };
  });
}

export const cmsEntries: CmsEntry[] = consolidateCmsEntries([
  ...managedEntries,
  ...legalDocumentEntries,
  ...externalEntries,
]).sort(
  (a, b) =>
    cmsPageRank(a.page) - cmsPageRank(b.page) ||
    cmsComponentTypeRank(a.componentType) - cmsComponentTypeRank(b.componentType) ||
    a.sourceOrder - b.sourceOrder,
);
