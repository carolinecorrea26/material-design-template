import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import FeaturedBadge from "./FeaturedBadge";
import QuickDecisionIndicator from "./QuickDecisionIndicator";

/**
 * FeaturedBadge and QuickDecisionIndicator are the two small badges shown on
 * product cards (ProductCard, EstimatorProductCard, ProductCatalog). They're
 * documented together deliberately, not because they're related components,
 * but because they're visually inconsistent with each other in a way worth
 * flagging: FeaturedBadge is a filled text+icon Chip, QuickDecisionIndicator
 * is a bare, unlabeled icon relying only on its `titleAccess` tooltip text
 * for an accessible name. Neither has props/variants — this page exists to
 * show them side by side, not to exercise controls.
 */
const meta = {
  title: "Coverage & Commerce/Product Adornments",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const SideBySide: StoryObj = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">FeaturedBadge</Typography>
        <FeaturedBadge />
        <Typography variant="caption" color="text.secondary">
          Filled Chip with a label and icon — its own visible text is the
          accessible name.
        </Typography>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2">QuickDecisionIndicator</Typography>
        <QuickDecisionIndicator />
        <Typography variant="caption" color="text.secondary">
          A bare icon with no visible label — only a `titleAccess` tooltip
          ("QuickDecision") gives it an accessible name. Same underlying
          concept (a callout badge on a product card) rendered in two
          different visual languages.
        </Typography>
      </Stack>
    </Stack>
  ),
};
