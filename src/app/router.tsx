import { lazy } from "react";
import { recoveryTemplate } from '../content/applicationRecovery';
import Home from "../pages/Home";
import ErrorPage from "../pages/ErrorPage";
// src/app/router.tsx

import { applicationPageComponents } from "./pageComponents";
import MockEmailPreview from "../pages/MockEmailPreview";
import SiteFeatures from "../pages/SiteFeatures";
import SiteDetails from "../pages/SiteDetails";
import DesignSystem from "../pages/DesignSystem";
import PortalAdmin from "../pages/PortalAdmin";
import PortalTemplateProject from "../pages/PortalTemplateProject";
import PortalRequirementsProject from "../pages/PortalRequirementsProject";
import Cms from "../pages/Cms";

import { createBrowserRouter, createHashRouter, replace, type LoaderFunctionArgs } from "react-router-dom";
import AppShell, { type AppShellVariant } from "../components/layout/AppShell";
import InternalPageShell from "../components/layout/InternalPageShell";
import { getPagePath, getConfiguredPages } from "../config/pages";
import type { PageId } from "../types";
import AdminCenterShell from "../components/admin/AdminCenterShell";
import { getFormTemplate } from "../config/template/resolveTemplate";
import { getResolvedFormFlow } from "../config/formFlow";
import { portalDatabaseEnabled } from '../services/portalClient';
import { acceptsCoverageEntry, coverageEntryRedirect } from './coverageEntryNavigation';

/**
 * Maps each page ID to its React component.
 * To add a new page: add its entry to config/pages.ts and add a mapping here.
 */


const pageComponents = { ...applicationPageComponents, "mock-email-preview": MockEmailPreview, "site-features": SiteFeatures, "site-details": SiteDetails, "design-system": DesignSystem, "portal-admin": PortalAdmin, "portal-template-project": PortalTemplateProject, "portal-requirements-project": PortalRequirementsProject, "cms": Cms };

const IssueLogWorkspace = lazy(() => import("../pages/admin/IssueLogWorkspace"));
const AdminPlaceholder = lazy(() => import("../pages/admin/AdminPlaceholder"));
const AccountSettings = lazy(() => import("../pages/admin/AccountSettings"));
const AdminHome = lazy(() => import("../pages/admin/AdminHome"));
const MigrationScheduleWorkspace = lazy(() => import("../pages/admin/MigrationScheduleWorkspace"));
const SitesWorkspace = lazy(() => import("../pages/admin/SitesWorkspace"));
const PortalLibrary = lazy(() => import("../pages/admin/PortalLibrary"));
const ChangesWorkspace = lazy(() => import("../pages/admin/ChangesWorkspace"));
const ReleasesWorkspace = lazy(() => import("../pages/admin/ReleasesWorkspace"));
const ApplicantAdminWorkspace = lazy(() => import("../pages/admin/ApplicantAdminWorkspace"));
const TutorialsWorkspace = lazy(() => import("../pages/admin/TutorialsWorkspace"));
const SiteBuilderWorkspace = lazy(() => import("../pages/admin/SiteBuilderWorkspace"));
const ApplicationsWorkspace = lazy(() => import("../pages/admin/ApplicationsWorkspace"));
const AnalyticsWorkspace = lazy(() => import("../pages/admin/AnalyticsWorkspace"));
const AccessibilityWorkspace = lazy(() => import("../pages/admin/AccessibilityWorkspace"));
const AdministrationWorkspace = lazy(() => import("../pages/admin/AdministrationWorkspace"));
const PortalPortfolio = lazy(() => import('../pages/admin/PortalPortfolio'));
const PortalBuilderWorkspace = lazy(() => import('../pages/admin/PortalBuilderWorkspace'));
const PortalUsers = lazy(() => import('../pages/admin/PortalUsers'));

const configuredPages = getConfiguredPages();
const pageTypeById = new Map(configuredPages.map(page => [page.id, page.type]));

const pageVariants: Partial<Record<PageId, AppShellVariant>> = {
  home: "homepage",
  resume: "resumeEmailCode",
  "resume-method": "resumeEmailCode",
  "resume-code": "resumeEmailCode",
  "advisor-login": "advisorLogin",
  "advisor-send-confirmation": "advisorSend",
  "application-edit-confirmation": "advisorSend",
};

const createRouter = import.meta.env.VITE_STANDALONE_HTML ? createHashRouter : createBrowserRouter;
const validateCoverageEntry = ({ request }: LoaderFunctionArgs) => {
  const destination = coverageEntryRedirect(new URL(request.url).searchParams);
  return destination ? replace(destination) : null;
};
export const router = createRouter(
  [
    { path: "*", element: <AppShell variant={recoveryTemplate.header as AppShellVariant}><ErrorPage status={404} /></AppShell> },
    ...configuredPages.map(page => {
    const { id: pageId, type, flow } = page;
    const PageComponent = pageComponents[pageId];
    if (!PageComponent) throw new Error(`No renderer registered for stored page: ${pageId}`);
    const variant = type === "error" ? recoveryTemplate.header as AppShellVariant : pageVariants[pageId] ?? "applicationForm";
    const isSingleApplication = getFormTemplate() === "single" && getResolvedFormFlow().includes(pageId);

    return {
      path: getPagePath(pageId),
      ...(acceptsCoverageEntry(page) && { loader: validateCoverageEntry }),
      errorElement: <AppShell variant={recoveryTemplate.header as AppShellVariant}><ErrorPage status="technical-error" /></AppShell>,
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
        { path: "sites", element: portalDatabaseEnabled ? <PortalPortfolio /> : <SitesWorkspace /> },
        { path: "library", element: <PortalLibrary /> },
        { path: "library/:domainId", element: <PortalLibrary /> },
        { path: "changes", element: <ChangesWorkspace /> },
        { path: "changes/:changeId", element: <ChangesWorkspace /> },
        { path: "releases", element: <ReleasesWorkspace /> },
        { path: "releases/:releaseId", element: <ReleasesWorkspace /> },
        { path: "applicant-admin", element: <ApplicantAdminWorkspace /> },
        { path: "tutorials", element: <TutorialsWorkspace /> },
        { path: "tutorials/:tutorialId", element: <TutorialsWorkspace /> },
        { path: "site-builder", element: portalDatabaseEnabled ? <PortalBuilderWorkspace /> : <SiteBuilderWorkspace /> },
        { path: "applications", element: <ApplicationsWorkspace /> },
        { path: "applications/:applicationId", element: <ApplicationsWorkspace /> },
        { path: "analytics", element: <AnalyticsWorkspace /> },
        { path: "issue-log", element: <IssueLogWorkspace /> },
        { path: "accessibility", element: <AccessibilityWorkspace /> },
        { path: "administration", element: portalDatabaseEnabled ? <PortalUsers /> : <AdministrationWorkspace /> },
      ],
    },
  ],
  { basename: import.meta.env.VITE_STANDALONE_HTML ? '/' : import.meta.env.BASE_URL },
);
