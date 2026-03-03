import * as React from "react";
import { AppShell } from "./AppShell";
import { AppRoutes } from "./router";
import ErrorBoundary from "./components/dev/ErrorBoundary";
import { SnackbarProvider } from "./components/feedback/SnackbarProvider";
import { useLayout } from "./state/LayoutContext";
import SinglePageLayout from "./deprecated/layouts/SinglePageLayout";

export default function App() {
  const { layoutMode } = useLayout();

  return (
    <AppShell>
      <SnackbarProvider>
        <ErrorBoundary>
          {layoutMode === "single-page" ? <SinglePageLayout /> : <AppRoutes />}
        </ErrorBoundary>
      </SnackbarProvider>
    </AppShell>
  );
}
