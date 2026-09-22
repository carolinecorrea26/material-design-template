import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import CoverageCart from "./CoverageCart";
import AppDrawer from "../layout/AppDrawer";
import {
  ApplicationFormContext,
  type ApplicationFormValues,
} from "../../app/ApplicationFormContext";

/**
 * CoverageCart has two variants sharing one component — `drawer` (opened
 * from AppHeader's cart icon; reads raw values directly via its own
 * useApplicationForm() hook, so no props beyond onClose are needed) and
 * `inline` (rendered at the bottom of ProductCatalog, fully controlled via
 * props derived from useCoverageState — see Coverage & Commerce/ProductCatalog
 * for that variant in its real composition, adding a product through the
 * real catalog UI). This file covers the `drawer` variant specifically,
 * seeded with real coverageSelections/productApplicants/coverageAmounts
 * shapes rather than the full interactive flow, since the drawer reads that
 * state directly rather than through handler props.
 */
const meta = {
  title: "Coverage & Commerce/CoverageCart",
  component: CoverageCart,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CoverageCart>;

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

function DrawerDemo({ initialValues }: { initialValues?: ApplicationFormValues }) {
  const [open, setOpen] = useState(true);
  return (
    <LocalFormProvider initialValues={initialValues}>
      <Box sx={{ p: 2 }}>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Reopen cart drawer
        </Button>
      </Box>
      <AppDrawer open={open} onClose={() => setOpen(false)} ariaLabel="Coverage cart">
        <CoverageCart variant="drawer" onClose={() => setOpen(false)} />
      </AppDrawer>
    </LocalFormProvider>
  );
}

export const EmptyDrawer: StoryObj = {
  name: "Empty (no coverage selected)",
  render: () => <DrawerDemo />,
};

export const PopulatedDrawer: StoryObj = {
  name: "Populated (real coverage config)",
  render: () => (
    <DrawerDemo
      initialValues={{
        coverageSelections: ["li-term", "li-10yr"],
        productApplicants: { "li-term": ["member"], "li-10yr": ["member"] },
        coverageAmounts: { "li-term:member": 100000, "li-10yr:member": 250000 },
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Seeded with real coverage IDs (li-term, li-10yr) from the default client's actual product catalog — the same IDs ProductCatalog's own story adds through the real UI — so premiums, names, and totals are real, not placeholder text.",
      },
    },
  },
};
