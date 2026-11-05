import HealthCi from "../pages/HealthCi";
import ErrorPage from "../pages/ErrorPage";
import IssueLogWorkspace from "../pages/admin/IssueLogWorkspace";
import AdminPlaceholder from "../pages/admin/AdminPlaceholder";
import AccountSettings from "../pages/admin/AccountSettings";
// src/app/router.tsx

import type { ComponentType } from "react";
import { createBrowserRouter, createHashRouter } from "react-router-dom";
import AppShell, { type AppShellVariant } from "../components/layout/AppShell";
import InternalPageShell from "../components/layout/InternalPageShell";
import { getPagePath, getConfiguredPages } from "../config/pages";
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
import AdminCenterShell from "../components/admin/AdminCenterShell";
import AdminHome from "../pages/admin/AdminHome";
import MigrationScheduleWorkspace from "../pages/admin/MigrationScheduleWorkspace";
import SitesWorkspace from "../pages/admin/SitesWorkspace";
import PortalLibrary from "../pages/admin/PortalLibrary";
import ChangesWorkspace from "../pages/admin/ChangesWorkspace";
import ReleasesWorkspace from "../pages/admin/ReleasesWorkspace";
import SiteBuilderWorkspace from "../pages/admin/SiteBuilderWorkspace";
import ApplicationsWorkspace from "../pages/admin/ApplicationsWorkspace";
import AnalyticsWorkspace from "../pages/admin/AnalyticsWorkspace";
import AccessibilityWorkspace from "../pages/admin/AccessibilityWorkspace";
import { getFormTemplate } from "../config/template/resolveTemplate";
import { getResolvedFormFlow } from "../config/formFlow";
import AdministrationWorkspace from "../pages/admin/AdministrationWorkspace";

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
  "health-ci": HealthCi, "health-cir": HealthCir,
  payment: Payment,
  receipt: Receipt,
  resume: Resume,
  "resume-method": ResumeMethod,
  "resume-code": ResumeCode,
  "error-404": () => <ErrorPage status={404} />,
  "error-500": () => <ErrorPage status={500} />,
  "session-expired": () => <ErrorPage status="session-expired" />,
  "technical-error": () => <ErrorPage status="technical-error" />,
  maintenance: () => <ErrorPage status="maintenance" />,
  "application-unavailable": () => <ErrorPage status="application-unavailable" />,
  "outcome-unknown": () => <ErrorPage status="outcome-unknown" />,
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

const configuredPages = getConfiguredPages();
const pageTypeById = new Map(configuredPages.map(page => [page.id, page.type]));

const pageVariants: Partial<Record<PageId, AppShellVariant>> = {
  home: "homepage",
  resume: "resumeEmailCode",
  "resume-method": "resumeEmailCode",
  "resume-code": "resumeEmailCode",
  "error-404": "recovery",
  "error-500": "recovery",
  "session-expired": "recovery",
  "technical-error": "recovery",
  maintenance: "recovery",
  "application-unavailable": "recovery",
  "outcome-unknown": "recovery",
  "advisor-login": "advisorLogin",
  "advisor-send-confirmation": "advisorSend",
  "application-edit-confirmation": "advisorSend",
};

const createRouter = import.meta.env.VITE_STANDALONE_HTML ? createHashRouter : createBrowserRouter;
export const router = createRouter(
  [
    { path: "*", element: <AppShell variant="recovery"><ErrorPage status={404} /></AppShell> },
    ...configuredPages.map(({ id: pageId, type, flow }) => {
    const PageComponent = pageComponents[pageId];
    if (!PageComponent) throw new Error(`No renderer registered for stored page: ${pageId}`);
    const variant = pageVariants[pageId] ?? "applicationForm";
    const isSingleApplication = getFormTemplate() === "single" && getResolvedFormFlow().includes(pageId);

    return {
      path: getPagePath(pageId),
      errorElement: <AppShell variant="recovery"><ErrorPage status="technical-error" /></AppShell>,
      element:
        pageTypeById.get(pageId) === "internal" ? (
          <InternalPageShell pageId={pageId}>
            <PageComponent />
          </InternalPageShell>
        ) : (
          <AppShell variant={isSingleApplication ? "homepage" : variant} sessionActive={flow === 'application' && (type === 'form' || pageId === 'home' && getFormTemplate() === 'single')}>
            {isSingleApplication ? <Home initialFormPageId={pageId} /> : <PageComponent />}
          </AppShell>
        ),
    };
    }),
    {
      path: "/admin-center",
      element: <AdminCenterShell />,
      children: [
        { index: true, element: <AdminHome /> },
        { path: "account", element: <AccountSettings /> },
        { path: "account/profile", element: <AccountSettings /> },
        { path: "account/settings", element: <AccountSettings /> },
        ...['TPA Admin', 'Customer Admin', 'Advisor Admin', 'Adobe Analytics', 'Contentsquare'].map(title => ({ path: title.toLowerCase().replaceAll(' ', '-'), element: <AdminPlaceholder title={title} /> })),
        { path: "migration-schedule", element: <MigrationScheduleWorkspace /> },
        { path: "sites", element: <SitesWorkspace /> },
        { path: "library", element: <PortalLibrary /> },
        { path: "library/:domainId", element: <PortalLibrary /> },
        { path: "changes", element: <ChangesWorkspace /> },
        { path: "changes/:changeId", element: <ChangesWorkspace /> },
        { path: "releases", element: <ReleasesWorkspace /> },
        { path: "releases/:releaseId", element: <ReleasesWorkspace /> },
        { path: "site-builder", element: <SiteBuilderWorkspace /> },
        { path: "applications", element: <ApplicationsWorkspace /> },
        { path: "applications/:applicationId", element: <ApplicationsWorkspace /> },
        { path: "analytics", element: <AnalyticsWorkspace /> },
        { path: "issue-log", element: <IssueLogWorkspace /> },
        { path: "accessibility", element: <AccessibilityWorkspace /> },
        { path: "administration", element: <AdministrationWorkspace /> },
      ],
    },
  ],
  { basename: import.meta.env.VITE_STANDALONE_HTML ? '/' : import.meta.env.BASE_URL },
);
