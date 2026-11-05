// Preview notes are documentation only; the canvas contains application UI.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import FeaturedBadge from "./FeaturedBadge";
import QuickDecisionIndicator from "./QuickDecisionIndicator";

/** Product heading indicators composed from the actual coverage components. */
const meta = {
  id: "coverage-commerce-product-adornments",
  title: "Components/Coverage and pricing/Product labels",
  component: FeaturedBadge,
  subcomponents: { QuickDecisionIndicator },
  parameters: { standalone: true, docs: { description: { component: "Featured and QuickDecision indicators composed into product headings." } }, layout: "padded" },
} satisfies Meta;

export default meta;

export const SideBySide: StoryObj = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">FeaturedBadge</Typography>
        <FeaturedBadge />

      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2">QuickDecisionIndicator</Typography>
        <QuickDecisionIndicator />

      </Stack>
    </Stack>
  ),
};
