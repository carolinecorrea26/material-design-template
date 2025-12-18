import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme/muiTheme";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { StepperProvider } from "./state/StepperContext";
import { AppDataProvider } from "./state/AppDataContext";
import { LayoutProvider } from "./state/LayoutContext";


// Start MSW only in development
async function prepareApp() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <LayoutProvider>
            <StepperProvider>
                <AppDataProvider>
                  <App />
                </AppDataProvider>
            </StepperProvider>
          </LayoutProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
});
