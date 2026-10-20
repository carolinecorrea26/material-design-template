import { getConfiguredPages } from '../config/pages';
import { getAnalyticsInventory } from '../analytics/inventory';
import { emitPageAnalytics } from '../analytics/runtime';
import { resolveSiteId } from '../data/activeSite';
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { useEffect } from "react";
import { setAnalyticsSink } from "../analytics/runtime";
import { mockRequest } from "../mock/client";
// src/app/App.tsx

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { RouterProvider } from "react-router-dom";
import { ApplicationFormProvider } from "./ApplicationFormContext";
import { ApplicationSessionProvider } from "./ApplicationSessionContext";
import { createAppTheme } from "./theme";
import { router } from "./router";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getActiveClient } from "../config/client/getActiveClient";
import { getFormTemplate } from "../config/template/resolveTemplate";

const client = getActiveClient();
const template = getFormTemplate();
const theme = createAppTheme(client.theme, {
  forceMobileLayout: template === "single",
});

export default function App() {
  useEffect(() => {
    if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    setAnalyticsSink(payload => { void mockRequest("/analytics/event", payload).catch(() => {}); });
    const track = () => {
      const page = getConfiguredPages().find(p => p.path === router.state.location.pathname && p.type !== 'internal');
      const library = getPrototypeLibrary();
      if (page && library) emitPageAnalytics(page.id, 'view', { siteKey: resolveSiteId(), template: getFormTemplate(), revision: library.revision }, getAnalyticsInventory(resolveSiteId()));
    };
    track();
    const unsubscribe = router.subscribe(track);
    return () => { unsubscribe(); setAnalyticsSink(null); };
  }, []);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ApplicationFormProvider>
          <ApplicationSessionProvider>
            <RouterProvider router={router} />
          </ApplicationSessionProvider>
        </ApplicationFormProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
