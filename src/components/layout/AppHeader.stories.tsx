import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import AppHeader from "./AppHeader";
import { getActiveClient } from "../../config/client/getActiveClient";
import {
  ApplicationFormContext,
  type ApplicationFormValues,
} from "../../app/ApplicationFormContext";

/**
 * AppHeader determines which page it's on via `window.location.pathname`
 * through its own history-patched subscription — not react-router's
 * `useLocation()` — so Storybook's MemoryRouter decorator alone can't drive
 * its progress-bar/cart-icon visibility. Every story below sets the real
 * browser URL via `window.history.pushState()` before rendering, which is
 * exactly the API AppHeader's own patch listens to, rather than faking the
 * behavior some other way.
 */
const meta = {
  title: "Layout/AppHeader",
  component: AppHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppHeader>;

export default meta;

function LocalFormProvider({
  initialValues = {},
  children,
}: {
  initialValues?: ApplicationFormValues;
  children: React.ReactNode;
}) {
  const [values, setValues] = useState<ApplicationFormValues>(initialValues);
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

export const HomepageVariant: StoryObj = {
  render: () => {
    function Demo() {
      useSetPathname("/");
      return <AppHeader client={getActiveClient()} variant="homepage" />;
    }
    return (
      <LocalFormProvider>
        <Demo />
      </LocalFormProvider>
    );
  },
};

export const ApplicationFormVariant: StoryObj = {
  name: "applicationForm variant, mid-flow with coverage in cart",
  render: () => {
    function Demo() {
      useSetPathname("/coverage");
      return <AppHeader client={getActiveClient()} variant="applicationForm" />;
    }
    return (
      <LocalFormProvider
        initialValues={{
          coverageSelections: ["li-term"],
          productApplicants: { "li-term": ["member"] },
          coverageAmounts: { "li-term:member": 100000 },
        }}
      >
        <Demo />
      </LocalFormProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "On the coverage page with one product already added: the progress bar reflects real getFormProgressPercent() output for this page, and the cart icon shows a real badge count from the seeded coverageSelections.",
      },
    },
  },
};

export const UtilityVariant: StoryObj = {
  name: 'variant="advisorLogin" (logo only, no menu/progress/cart)',
  render: () => {
    function Demo() {
      useSetPathname("/advisor-login");
      return <AppHeader client={getActiveClient()} variant="advisorLogin" />;
    }
    return (
      <LocalFormProvider>
        <Demo />
      </LocalFormProvider>
    );
  },
};
