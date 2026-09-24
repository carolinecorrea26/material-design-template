// src/app/router.tsx

import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppShell, { type AppShellVariant } from "../components/layout/AppShell";
import InternalPageShell from "../components/layout/InternalPageShell";
import { getPagePath, pages } from "../config/pages";
import type { PageId } from "../types";
import Home from "../pages/Home";
import Membership from "../pages/Membership";
import Eligibility from "../pages/Eligibility";
import Coverage from "../pages/Coverage";
import Beneficiary from "../pages/Beneficiary";
import Contact from "../pages/Contact";
import Profile from "../pages/Profile";
import Review from "../pages/Review";
import DocuSign from "../pages/DocuSign";
import HealthSi from "../pages/HealthSi";
import HealthLi from "../pages/HealthLi";
import HealthQd from "../pages/HealthQd";
import HealthDi from "../pages/HealthDi";
import HealthCir from "../pages/HealthCir";
import Payment from "../pages/Payment";
import Receipt from "../pages/Receipt";
import Resume from "../pages/Resume";
import ResumeMethod from "../pages/ResumeMethod";
import ResumeCode from "../pages/ResumeCode";
import AdvisorLogin from "../pages/AdvisorLogin";
import AdvisorSendConfirmation from "../pages/AdvisorSendConfirmation";
import ApplicationEditConfirmation from "../pages/ApplicationEditConfirmation";
import MockEmailPreview from "../pages/MockEmailPreview";
import SiteDetails from "../pages/SiteDetails";
import SiteFeatures from "../pages/SiteFeatures";
import DesignSystem from "../pages/DesignSystem";
import PortalAdmin from "../pages/PortalAdmin";
import PortalTemplateProject from "../pages/PortalTemplateProject";
import PortalRequirementsProject from "../pages/PortalRequirementsProject";
import Cms from "../pages/Cms";

/**
 * Maps each page ID to its React component.
 * To add a new page: add its entry to config/pages.ts and add a mapping here.
 */
const pageComponents: Record<PageId, ComponentType> = {
  home: Home,
  membership: Membership,
  eligibility: Eligibility,
  coverage: Coverage,
  beneficiary: Beneficiary,
  contact: Contact,
  profile: Profile,
  review: Review,
  docusign: DocuSign,
  "health-si": HealthSi,
  "health-li": HealthLi,
  "health-qd": HealthQd,
  "health-di": HealthDi,
  "health-cir": HealthCir,
  payment: Payment,
  receipt: Receipt,
  resume: Resume,
  "resume-method": ResumeMethod,
  "resume-code": ResumeCode,
  "advisor-login": AdvisorLogin,
  "advisor-send-confirmation": AdvisorSendConfirmation,
  "application-edit-confirmation": ApplicationEditConfirmation,
  "mock-email-preview": MockEmailPreview,
  "site-features": SiteFeatures,
  "site-details": SiteDetails,
  "design-system": DesignSystem,
  "portal-admin": PortalAdmin,
  "portal-template-project": PortalTemplateProject,
  "portal-requirements-project": PortalRequirementsProject,
  cms: Cms,
};

/** Pages that get their own route. */
const routedPageIds: PageId[] = [
  "home",
  "membership",
  "eligibility",
  "coverage",
  "beneficiary",
  "contact",
  "profile",
  "review",
  "docusign",
  "health-si",
  "health-li",
  "health-qd",
  "health-di",
  "health-cir",
  "payment",
  "receipt",
  "resume",
  "resume-method",
  "resume-code",
  "advisor-login",
  "advisor-send-confirmation",
  "application-edit-confirmation",
  "mock-email-preview",
  "site-features",
  "site-details",
  "design-system",
  "portal-admin",
  "portal-template-project",
  "portal-requirements-project",
  "cms",
];

const pageTypeById = new Map(pages.map((page) => [page.id, page.type]));

const pageVariants: Partial<Record<PageId, AppShellVariant>> = {
  home: "homepage",
  resume: "resumeEmailCode",
  "resume-method": "resumeEmailCode",
  "resume-code": "resumeEmailCode",
  "advisor-login": "advisorLogin",
  "advisor-send-confirmation": "advisorSend",
  "application-edit-confirmation": "advisorSend",
};

export const router = createBrowserRouter(
  routedPageIds.map((pageId) => {
    const PageComponent = pageComponents[pageId];
    const variant = pageVariants[pageId] ?? "applicationForm";

    return {
      path: getPagePath(pageId),
      element:
        pageTypeById.get(pageId) === "internal" ? (
          <InternalPageShell pageId={pageId}>
            <PageComponent />
          </InternalPageShell>
        ) : (
          <AppShell variant={variant}>
            <PageComponent />
          </AppShell>
        ),
    };
  }),
  { basename: import.meta.env.BASE_URL },
);
