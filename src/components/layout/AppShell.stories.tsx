import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from "@mui/material";
import AppShell from "./AppShell";
import {
  ApplicationFormContext,
  type ApplicationFormValues,
} from "../../app/ApplicationFormContext";

/**
 * AppShell is the top-level layout composing AppHeader + AppBody +
 * AppFooter + the skip-link + CookieDialog + DevTools, selecting header/
 * footer chrome via `variant` — see the 5 variants documented on
 * AppShellVariant. It calls getActiveClient() internally (no client prop),
 * so every story here uses the real active client, same as AppHeader's
 * own stories. The cookie banner shows on first render unless
 * localStorage.cookieConsent is already "accepted" in this browser.
 */
const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;

function LocalFormProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState<ApplicationFormValues>({});
  return (
    <ApplicationFormContext.Provider
      value={{
        values,
        setPageValues: (pageValues) =>
          setValues((current) => ({ ...current, ...pageValues })),
        resetValues: () => setValues({}),
      }}
    >
      {children}
    </ApplicationFormContext.Provider>
  );
}

function useSetPathname(pathname: string) {
  useEffect(() => {
    window.history.pushState({}, "", pathname);
  }, [pathname]);
}

export const ApplicationFormVariant: StoryObj = {
  render: () => {
    function Demo() {
      useSetPathname("/coverage");
      return (
        <AppShell variant="applicationForm">
          <Typography variant="body2" color="text.secondary">
            Form page content goes here.
          </Typography>
        </AppShell>
      );
    }
    return (
      <LocalFormProvider>
        <Demo />
      </LocalFormProvider>
    );
  },
};

export const HomepageVariant: StoryObj = {
  render: () => {
    function Demo() {
      useSetPathname("/");
      return (
        <AppShell variant="homepage">
          <Typography variant="body2" color="text.secondary">
            Homepage content goes here.
          </Typography>
        </AppShell>
      );
    }
    return (
      <LocalFormProvider>
        <Demo />
      </LocalFormProvider>
    );
  },
};

export const AdvisorLoginVariant: StoryObj = {
  name: 'variant="advisorLogin" (utility chrome — logo only)',
  render: () => {
    function Demo() {
      useSetPathname("/advisor-login");
      return (
        <AppShell variant="advisorLogin">
          <Typography variant="body2" color="text.secondary">
            Advisor login page content goes here.
          </Typography>
        </AppShell>
      );
    }
    return (
      <LocalFormProvider>
        <Demo />
      </LocalFormProvider>
    );
  },
};
