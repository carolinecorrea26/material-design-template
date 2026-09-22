import type { Meta, StoryObj } from "@storybook/react-vite";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import EmptyState from "./EmptyState";

/**
 * EmptyState is the generic centered icon + title + optional-body block used
 * wherever a section or panel has nothing to show yet (CoverageCart,
 * QuoteCalculator, error states).
 */
const meta = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
} satisfies Meta<typeof EmptyState>;

export default meta;

export const Default: StoryObj = {
  name: "Default icon (PrivacyTipIcon)",
  render: () => <EmptyState title="Nothing to show yet." />,
};

export const WithBody: StoryObj = {
  render: () => <EmptyState title="No coverage selected yet." body="Choose a category above to get started." />,
};

export const CustomIcon: StoryObj = {
  render: () => (
    <EmptyState
      icon={ShoppingCartOutlinedIcon}
      title="Your cart is empty."
      body="Select coverage to see your estimated cost here."
    />
  ),
};
