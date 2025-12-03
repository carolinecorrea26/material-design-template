import * as React from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { LinearProgress, Box } from "@mui/material";
import RouteGuard from "./navigation/RouteGuard";

const Landing     = React.lazy(() => import("./pages/Landing"));
const AdvisorLogin = React.lazy(() => import("./pages/AdvisorLogin"));
const Membership  = React.lazy(() => import("./pages/Membership"));
const Eligibility = React.lazy(() => import("./pages/Eligibility"));
const Coverage    = React.lazy(() => import("./pages/Coverage"));
const Contact     = React.lazy(() => import("./pages/Contact"));
const Profile     = React.lazy(() => import("./pages/Profile"));
const HealthHistory = React.lazy(() => import("./pages/HealthHistory"));
const Preview     = React.lazy(() => import("./pages/Preview"));
const Consent     = React.lazy(() => import("./pages/Consent"));
const DocuSign    = React.lazy(() => import("./pages/DocuSign"));
const Decision    = React.lazy(() => import("./pages/Decision"));
const Receipt     = React.lazy(() => import("./pages/Receipt"));
const Resume      = React.lazy(() => import("./pages/Resume"));
const Styleguide  = React.lazy(() => import("./pages/Styleguide"));
const ProjectStructure = React.lazy(() => import("./pages/ProjectStructure"));


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
  const routes = [
    { path: "/", element: <SuspenseWrap><Landing /></SuspenseWrap> },
    { path: "/advisor", element: <SuspenseWrap><AdvisorLogin /></SuspenseWrap> },

    { path: "/membership", element:
      <SuspenseWrap><Membership /></SuspenseWrap>
    },

    { path: "/eligibility", element:
      <SuspenseWrap><Eligibility /></SuspenseWrap>
    },

    { path: "/coverage", element:
      <SuspenseWrap>
        <RouteGuard require="coverage">
          <Coverage />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/contact", element:
      <SuspenseWrap>
        <RouteGuard require="contact">
          <Contact />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/profile", element:
      <SuspenseWrap>
        <RouteGuard require="profile">
          <Profile />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/health-history", element:
      <SuspenseWrap>
        <RouteGuard require="profile">
          <HealthHistory />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/preview", element:
      <SuspenseWrap>
        <RouteGuard require="preview">
          <Preview />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/consent", element:
      <SuspenseWrap>
        <RouteGuard require="consent">
          <Consent />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/docusign", element:
      <SuspenseWrap>
        <RouteGuard require="docusign">
          <DocuSign />
        </RouteGuard>
      </SuspenseWrap>
    },

    { path: "/decision", element:
      <SuspenseWrap>
        <Decision />
      </SuspenseWrap>
    },

    { path: "/receipt", element:
      <SuspenseWrap>
        {/* You can require consent here once that page captures a checked box */}
        <Receipt />
      </SuspenseWrap>
    },

    { path: "/resume", element: <SuspenseWrap><Resume /></SuspenseWrap> },
    { path: "*", element: <Navigate to="/" replace /> },

    { path: "/styleguide", element: <SuspenseWrap><Styleguide /></SuspenseWrap> },
    { path: "/project-structure", element: <SuspenseWrap><ProjectStructure /></SuspenseWrap> },

  ];

  return useRoutes(routes);
}
