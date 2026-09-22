import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import CoverageNeedsCalculator from "./CoverageNeedsCalculator";

/**
 * CoverageNeedsCalculator is an income-replacement needs calculator with no
 * props — it's self-contained, only reachable via the AppMenu drawer. The
 * result box only appears once income or debts are entered (hasInput), and
 * uses role="status"/aria-live="polite" so the recalculated estimate is
 * announced as the user types, without a separate loading state.
 */
const meta = {
  title: "Coverage & Commerce/CoverageNeedsCalculator",
  component: CoverageNeedsCalculator,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CoverageNeedsCalculator>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <CoverageNeedsCalculator />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Empty on first render — the result box doesn't appear until income or debts are entered. Try typing an annual income to see it appear live.",
      },
    },
  },
};
