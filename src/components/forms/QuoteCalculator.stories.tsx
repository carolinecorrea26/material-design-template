import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import QuoteCalculator from "./QuoteCalculator";

/**
 * QuoteCalculator is a self-contained drawer quote tool (it wraps its own
 * AppDrawer, unlike ProductCatalog which is fully prop-driven) — category
 * selection → eligibility → coverage questions → per-product estimate →
 * "Apply" hands off to the Membership page through ApplicationFormContext. Triggered
 * from the Home page and Membership page. `collectEligibility` toggles
 * whether DOB/ZIP/State fields are collected inside the drawer itself
 * (Membership trigger) versus assumed already known and passed via
 * `initialEligibility` (Home page trigger, where a card collects them
 * first).
 */
const meta = {
  title: "Coverage & Commerce/QuoteCalculator",
  component: QuoteCalculator,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof QuoteCalculator>;

export default meta;

function QuoteCalculatorDemo(
  props: Omit<React.ComponentProps<typeof QuoteCalculator>, "open" | "onClose">,
) {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Reopen quote calculator
      </Button>
      <QuoteCalculator {...props} open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

export const CollectsEligibility: StoryObj = {
  name: "collectEligibility=true (Membership page trigger)",
  render: () => <QuoteCalculatorDemo collectEligibility />,
};

export const EligibilityAlreadyKnown: StoryObj = {
  name: "collectEligibility=false + initialEligibility (Home page trigger)",
  render: () => (
    <QuoteCalculatorDemo
      initialEligibility={{ birthday: "1990-05-14", zipCode: "10001", state: "NY" }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "DOB/ZIP/State fields aren't shown at all in this mode — they were already collected by the Home page's own quote-entry card before the drawer opened.",
      },
    },
  },
};

export const CustomTitle: StoryObj = {
  render: () => <QuoteCalculatorDemo collectEligibility title="Get a quick quote" />,
};

export const InlineHomepage: StoryObj = {
  name: "Inline progressive flow (quote-first homepage)",
  render: () => (
    <Box sx={{ maxWidth: 840, mx: "auto", p: { xs: 2, sm: 4 } }}>
      <QuoteCalculator
        open
        onClose={() => undefined}
        collectEligibility
        displayMode="inline"
      />
    </Box>
  ),
};
