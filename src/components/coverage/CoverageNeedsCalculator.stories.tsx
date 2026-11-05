import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import CoverageNeedsCalculator from "./CoverageNeedsCalculator";
import { getSurfaceFields, getFieldSurface } from "../../config/fields/storedSurfaces";

/**
 * CoverageNeedsCalculator is an income-replacement needs calculator using
 * saved field definitions and bindings, reached through the AppMenu drawer. The
 * result box only appears once income or debts are entered (hasInput), and
 * uses role="status"/aria-live="polite" so the recalculated estimate is
 * announced as the user types, without a separate loading state.
 */
const meta = {
  id: "coverage-commerce-coverageneedscalculator",
  title: "Components/Coverage and pricing/Coverage-needs calculator",
  component: CoverageNeedsCalculator,
  parameters: { docs: { description: { component: "Estimates life insurance needs from financial obligations and available resources, using the application's configured fields and bindings." } }, layout: "padded" },
} satisfies Meta<typeof CoverageNeedsCalculator>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <CoverageNeedsCalculator fields={getSurfaceFields("needsCalculator")} bindings={getFieldSurface("needsCalculator").mapping.fieldToKey} />
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
