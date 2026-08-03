// src/app/router.tsx

import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppShell, {
  type AppShellVariant,
} from "../components/layout/AppShell";
import { getPagePath } from "../config/pages";
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
import ResumeCode from "../pages/ResumeCode";
import AdvisorLogin from "../pages/AdvisorLogin";
import AdvisorSendConfirmation from "../pages/AdvisorSendConfirmation";
import MockEmailPreview from "../pages/MockEmailPreview";
import InformationArchitecture from "../pages/InformationArchitecture";

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
  "resume-code": ResumeCode,
  "advisor-login": AdvisorLogin,
  "advisor-send-confirmation": AdvisorSendConfirmation,
  "mock-email-preview": MockEmailPreview,
  "information-architecture": InformationArchitecture,
};

/** Pages that get their own route. Internal-only pages are excluded. */
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
  "resume-code",
  "advisor-login",
  "advisor-send-confirmation",
  "mock-email-preview",
  "information-architecture",
];

const pageVariants: Partial<Record<PageId, AppShellVariant>> = {
  home: "homepage",
  resume: "resumeEmailCode",
  "resume-code": "resumeEmailCode",
  "advisor-login": "advisorLogin",
  "advisor-send-confirmation": "advisorSend",
};

export const router = createBrowserRouter(
  routedPageIds.map((pageId) => {
    const PageComponent = pageComponents[pageId];
    const variant = pageVariants[pageId] ?? "applicationForm";

    return {
      path: getPagePath(pageId),
      element:
        pageId === "mock-email-preview" ? (
          <PageComponent />
        ) : (
          <AppShell variant={variant}>
            <PageComponent />
          </AppShell>
        ),
    };
  }),
);
