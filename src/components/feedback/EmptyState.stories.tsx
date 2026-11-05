import type { Meta, StoryObj } from "@storybook/react-vite";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import EmptyState from "./EmptyState";

/**
 * EmptyState is the generic centered icon + title + optional-body block used
 * wherever a section or panel has nothing to show yet (CoverageCart,
 * QuoteCalculator, error states).
 */
const meta = {
  id: "feedback-emptystate",
  title: "Components/Feedback and overlays/Empty states",
  component: EmptyState,
  parameters: { docs: { description: { component: "Explains why a section has no items and offers a next action." } }, layout: "padded" },
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
      icon={ShoppingCartRoundedIcon}
      title="Your cart is empty."
      body="Select coverage to see your estimated cost here."
    />
  ),
};
