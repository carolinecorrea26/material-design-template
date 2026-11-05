// Preview notes are documentation only; the canvas contains application UI.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import FormHelpChips from "./HelpChips";

/**
 * FormHelpChips is the most broadly reused component found in the Phase 1
 * audit — a horizontally scrollable row of clickable "help topic" chips
 * that open contextual help drawers. Used on Beneficiary, Coverage,
 * Membership, HealthDi, HealthSi, and Payment.
 */
const meta = {
  id: "content-helpchips",
  title: "Components/Content and data display/Help and support/Help chips",
  component: FormHelpChips,
  parameters: { docs: { description: { component: "Opens contextual help and reference content from labeled chips." } }, layout: "padded" },
} satisfies Meta<typeof FormHelpChips>;

export default meta;

const items = [
  { id: "how-much", label: "How much does it cost?" },
  { id: "quick-decision", label: "About QuickDecision" },
  { id: "coverage-options", label: "Coverage options" },
];

export const Default: StoryObj = {
  render: () => <FormHelpChips items={items} onSelect={() => {}} />,
};

export const Empty: StoryObj = {
  name: "Empty (renders null)",
  render: () => (
    <>
      <FormHelpChips items={[]} onSelect={() => {}} />

    </>
  ),
};

export const NarrowContainerWithOverflow: StoryObj = {
  name: "Narrow container (overflow-fade, mobile-only)",
  render: () => (
    <Box sx={{ maxWidth: 280, border: "1px dashed", borderColor: "divider", p: 1 }}>
      <FormHelpChips
        items={[
          { id: "1", label: "How much does it cost?" },
          { id: "2", label: "About QuickDecision" },
          { id: "3", label: "Coverage options" },
          { id: "4", label: "Application review" },
          { id: "5", label: "Need help?" },
        ]}
        onSelect={() => {}}
      />

    </Box>
  ),
};
