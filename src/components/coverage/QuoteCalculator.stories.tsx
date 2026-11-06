import { useLayoutEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import QuoteCalculator from "../../app/workflows/QuoteCalculator";
import { ApplicationFormContext, type ApplicationFormValues } from "../../app/ApplicationFormContext";
import { candidateMockRatingService } from "../../mock/client";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { monthlyPremium, pricingFormulas } from "../../domain/pricingFormulas.mjs";
import pricingDocument from "../../../requirements/global/formulas/pricing.json";

function QuoteStoryForm({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<ApplicationFormValues>({});
  useLayoutEffect(() => {
    const previousQuote = candidateMockRatingService.quote;
    candidateMockRatingService.quote = async request => {
      const product = getPrototypeLibrary()?.products.find(product => product.id === request.productKey);
      if (!product) throw new Error(`Missing Storybook quote product: ${request.productKey}`);
      const monthly = monthlyPremium(pricingFormulas(pricingDocument), product.categoryId, request.amount, request.riders);
      return { mode: "mock", premiumCents: Math.round(monthly * 12 * 100), expiresAt: Date.now() + 60000, authority: "Synthetic Storybook estimate; not an insurance quote" };
    };
    return () => { candidateMockRatingService.quote = previousQuote; };
  }, []);
  return <ApplicationFormContext.Provider value={{
    values,
    setPageValues: next => setValues(current => ({ ...current, ...next })),
    resetValues: () => setValues({}),
  }}>{children}</ApplicationFormContext.Provider>;
}

/**
 * QuoteCalculator is a self-contained drawer quote tool (it wraps its own
 * AppDrawer, unlike ProductCatalog which is fully prop-driven) — category
 * selection → eligibility → coverage questions → per-product estimate →
 * "Apply" hands off to the Membership page through ApplicationFormContext. Triggered
 * from the Home page. `collectEligibility` toggles
 * whether DOB/ZIP/State fields are collected inside the drawer itself
 * (standalone or inline quote) versus assumed already known and passed via
 * `initialEligibility` (Home page trigger, where a card collects them
 * first).
 */
const meta = {
  id: "coverage-commerce-quotecalculator",
  title: "Components/Coverage and pricing/Quote calculator",
  component: QuoteCalculator,
  decorators: [(Story) => <QuoteStoryForm><Story /></QuoteStoryForm>],
  parameters: { docs: { description: { component: "Collects eligibility and coverage choices to estimate an applicant's cost." } }, layout: "fullscreen" },
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
  name: "Standalone quote with eligibility inputs",
  render: () => <QuoteCalculatorDemo collectEligibility />,
};

export const MultipleTermProducts: StoryObj = {
  name: "Multiple term products",
  parameters: {
    templateCapability: "multipleTerms",
    docs: { description: { story: "Uses the saved multiple-term catalog configuration, including its eligibility, underwriting, rider options and required member reference. Apply requires a selected product and valid current answers." } },
  },
  render: () => (
    <QuoteCalculatorDemo
      initialEligibility={{ birthday: "1990-05-14", zipCode: "10001", state: "NY" }}
    />
  ),
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
