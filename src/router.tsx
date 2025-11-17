import * as React from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { LinearProgress, Box } from "@mui/material";
import RouteGuard from "./navigation/RouteGuard";

const Landing     = React.lazy(() => import("./pages/Landing"));
const Eligibility = React.lazy(() => import("./pages/Eligibility"));
const Coverage    = React.lazy(() => import("./pages/Coverage"));
const Contact     = React.lazy(() => import("./pages/Contact"));
const Profile     = React.lazy(() => import("./pages/Profile"));
const Preview     = React.lazy(() => import("./pages/Preview"));
const Payment     = React.lazy(() => import("./pages/Payment"));
const Consent     = React.lazy(() => import("./pages/Consent"));
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

    { path: "/preview", element:
      <SuspenseWrap>
        <RouteGuard require="preview">
          <Preview />
        </RouteGuard>
      </SuspenseWrap>
    },

    // keep Payment if you want it as a separate page; otherwise you can remove this route
    { path: "/payment", element:
      <SuspenseWrap>
        <RouteGuard require="preview">
          <Payment />
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
