import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import ProductCostBreakdown from "./ProductCostBreakdown";

/**
 * ProductCostBreakdown is the itemized premium + rider + policy-fee
 * line-item list shown inside ProductCatalog's inline card (client-config
 * gated). It's stateless/pure — every value comes from props — and switches
 * its displayed numbers between monthly and annual via the shared
 * getDisplayedPremium() helper (the same one CoverageCart/QuoteCalculator
 * use), not its own math.
 */
const meta = {
  title: "Coverage & Commerce/ProductCostBreakdown",
  component: ProductCostBreakdown,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProductCostBreakdown>;

export default meta;

export const Monthly: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <ProductCostBreakdown
        premiumCost={42.5}
        riderItems={[{ label: "Accidental Death Rider", amount: 3.25 }]}
        policyFee={{ label: "Policy Fee", amount: 2 }}
        rateFrequency="monthly"
      />
    </Box>
  ),
};

export const Annual: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <ProductCostBreakdown
        premiumCost={42.5}
        riderItems={[{ label: "Accidental Death Rider", amount: 3.25 }]}
        policyFee={{ label: "Policy Fee", amount: 2 }}
        rateFrequency="annual"
      />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Every row (including riders and the policy fee) is converted to annual via getDisplayedPremium — not just the total — so per-line and total figures stay internally consistent.",
      },
    },
  },
};

export const NoRidersOrFee: StoryObj = {
  name: "No riders, no policy fee",
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <ProductCostBreakdown premiumCost={28} riderItems={[]} rateFrequency="monthly" />
    </Box>
  ),
};

export const MultipleRiders: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <ProductCostBreakdown
        premiumCost={65}
        riderItems={[
          { label: "Accidental Death Rider", amount: 3.25 },
          { label: "Waiver of Premium Rider", amount: 4.1 },
          { label: "Child Term Rider", amount: 1.5 },
        ]}
        policyFee={{ label: "Policy Fee", amount: 2 }}
        rateFrequency="monthly"
      />
    </Box>
  ),
};
