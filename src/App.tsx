import * as React from "react";
import { AppShell } from "./AppShell";
import { AppRoutes } from "./router";
import ErrorBoundary from "./components/dev/ErrorBoundary";
import { SnackbarProvider } from "./components/feedback/SnackbarProvider";

export default function App() {
  return (
    <AppShell>
      <SnackbarProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </SnackbarProvider>
    </AppShell>
  );
}
