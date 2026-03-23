import * as React from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { LinearProgress, Box } from "@mui/material";
import RouteGuard from "./navigation/RouteGuard";
import { getClientFeatures } from "./config/clients";
import ApplicationLayout from "./layouts/ApplicationLayout";

const Landing = React.lazy(() => import("./pages/Landing"));
const AdvisorLogin = React.lazy(() => import("./pages/AdvisorLogin"));
const AdvisorSuccess = React.lazy(() => import("./pages/AdvisorSuccess"));
const Membership = React.lazy(() => import("./pages/Membership"));
const Eligibility = React.lazy(() => import("./pages/Eligibility"));
const AddCoverage = React.lazy(() => import("./pages/AddCoverage"));
const CoverageQuestions = React.lazy(() => import("./pages/CoverageQuestions"));
const GetStarted = React.lazy(() => import("./pages/GetStarted"));
const CoverageOptions = React.lazy(() => import("./pages/CoverageOptions"));
const Beneficiary = React.lazy(() => import("./pages/Beneficiary"));
const Contact = React.lazy(() => import("./pages/Contact"));
const PersonalInformation = React.lazy(
  () => import("./pages/PersonalInformation"),
);
const FinancialInformation = React.lazy(
  () => import("./pages/FinancialInformation"),
);
const PaymentInformation = React.lazy(
  () => import("./pages/PaymentInformation"),
);
const HealthHistory = React.lazy(() => import("./pages/HealthHistory"));
const Preview = React.lazy(() => import("./pages/Preview"));
const DocuSign = React.lazy(() => import("./pages/DocuSign"));
const Decision = React.lazy(() => import("./pages/Decision"));
const Receipt = React.lazy(() => import("./pages/Receipt"));
const Resume = React.lazy(() => import("./pages/Resume"));
const Styleguide = React.lazy(() => import("./pages/Styleguide"));
const ProjectStructure = React.lazy(() => import("./pages/ProjectStructure"));
const SiteSetup = React.lazy(() => import("./pages/SiteSetup"));
const SiteRequirements = React.lazy(() => import("./pages/SiteRequirements"));

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <Box sx={{ width: "100%", mt: 1 }}>
          <LinearProgress />
        </Box>
      }
    >
      {children}
    </React.Suspense>
  );
}

export function AppRoutes() {
  const features = getClientFeatures();

  const routes = [
    {
      path: "/",
      element: (
        <SuspenseWrap>
          <Landing />
        </SuspenseWrap>
      ),
    },
    {
      path: "/advisor",
      element: (
        <SuspenseWrap>
          <AdvisorLogin />
        </SuspenseWrap>
      ),
    },
    {
      path: "/advisor-success",
      element: (
        <SuspenseWrap>
          <AdvisorSuccess />
        </SuspenseWrap>
      ),
    },

    // Conditionally include membership page based on client configuration
    ...(features.showMembershipPage
      ? [
          {
            path: "/membership",
            element: (
              <SuspenseWrap>
                <ApplicationLayout>
                  <Membership />
                </ApplicationLayout>
              </SuspenseWrap>
            ),
          },
        ]
      : []),

    {
      path: "/eligibility",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <Eligibility />
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/add-coverage",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="coverage">
              <AddCoverage />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/coverage-questions",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="coverage">
              <CoverageQuestions />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/get-started",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <GetStarted />
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/coverage-options",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="coverage">
              <CoverageOptions />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/beneficiary",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="contact">
              <Beneficiary />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/contact",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="contact">
              <Contact />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/personal-information",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="personal">
              <PersonalInformation />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/financial-information",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="financial">
              <FinancialInformation />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/application-review",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="review">
              <Preview />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/health-information",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="health">
              <HealthHistory />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/health-information-quickdecision",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="health">
              <HealthHistory />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/health-information-disability",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="health">
              <HealthHistory />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/health-information-chronic-illness-rider",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="health">
              <HealthHistory />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/payment-information",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="payment">
              <PaymentInformation />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/docusign",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <RouteGuard require="docusign">
              <DocuSign />
            </RouteGuard>
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    {
      path: "/decision",
      element: (
        <SuspenseWrap>
          <ApplicationLayout>
            <Decision />
          </ApplicationLayout>
        </SuspenseWrap>
      ),
    },

    // Backward-compatible redirects for deprecated paths
    {
      path: "/preview",
      element: <Navigate to="/application-review" replace />,
    },
    {
      path: "/consent",
      element: <Navigate to="/application-review" replace />,
    },
    {
      path: "/health-history",
      element: <Navigate to="/health-information" replace />,
    },

    {
      path: "/receipt",
      element: (
        <SuspenseWrap>
          {/* You can require consent here once that page captures a checked box */}
          <Receipt />
        </SuspenseWrap>
      ),
    },

    {
      path: "/resume",
      element: (
        <SuspenseWrap>
          <Resume />
        </SuspenseWrap>
      ),
    },
    { path: "*", element: <Navigate to="/" replace /> },

    {
      path: "/styleguide",
      element: (
        <SuspenseWrap>
          <Styleguide />
        </SuspenseWrap>
      ),
    },
    {
      path: "/project-structure",
      element: (
        <SuspenseWrap>
          <ProjectStructure />
        </SuspenseWrap>
      ),
    },
    {
      path: "/site-requirements",
      element: (
        <SuspenseWrap>
          <SiteRequirements />
        </SuspenseWrap>
      ),
    },
  ];

  return useRoutes(routes);
}
