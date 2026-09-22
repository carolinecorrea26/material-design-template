import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import TotalCostSummary from "./TotalCostSummary";

/**
 * TotalCostSummary is the shared "Total Estimated Cost" panel used by both
 * the Coverage page's estimated-cost panel and CoverageCart — already a
 * good single-component/multiple-consumer precedent. RateFrequencyControl is
 * the separate canonical owner of the labeled Monthly/Annual switch row.
 * `role="status"`/`aria-live="polite"` on the wrapping Box means any prop
 * change re-announces the whole panel to assistive tech, including
 * per-item recalculation spinners.
 */
const meta = {
  title: "Coverage & Commerce/TotalCostSummary",
  component: TotalCostSummary,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TotalCostSummary>;

export default meta;

const sampleItems = [
  { id: "li", name: "Life Insurance", amount: 42.5 },
  { id: "di", name: "Disability Insurance", amount: 18.75 },
];

export const Default: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <TotalCostSummary items={sampleItems} total={61.25} />
    </Box>
  ),
};

export const AnnualSuffix: StoryObj = {
  name: 'totalSuffix="/yr"',
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <TotalCostSummary items={sampleItems} total={735} totalSuffix="/yr" />
    </Box>
  ),
};

export const Calculating: StoryObj = {
  name: "isCalculating (recalculating spinner)",
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <TotalCostSummary
        items={[
          { id: "li", name: "Life Insurance", amount: 42.5 },
          { id: "di", name: "Disability Insurance", amount: 18.75, isCalculating: true },
        ]}
        total={61.25}
        isCalculating
      />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Per-item isCalculating swaps that row's amount for a spinner; the top-level isCalculating does the same for the Total row. A consumer can show one without the other — e.g. one product recalculating while the grand total still reflects the last-known value.",
      },
    },
  },
};

export const WithDisclaimer: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <TotalCostSummary
        items={sampleItems}
        total={61.25}
        disclaimer={
          <Typography component="span" variant="caption" color="text.secondary">
            1. Estimated rates are subject to underwriting review.
          </Typography>
        }
      />
    </Box>
  ),
};

export const SingleItem: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <TotalCostSummary items={[{ id: "li", name: "Life Insurance", amount: 42.5 }]} total={42.5} />
    </Box>
  ),
};
