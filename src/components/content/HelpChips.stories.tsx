import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, Box, Typography } from "@mui/material";
import FormHelpChips from "./HelpChips";

/**
 * FormHelpChips is the most broadly reused component found in the Phase 1
 * audit — a horizontally scrollable row of clickable "help topic" chips
 * that open contextual help drawers. Used on Beneficiary, Coverage,
 * Membership, HealthDi, HealthSi, and Payment.
 */
const meta = {
  title: "Content/HelpChips",
  component: FormHelpChips,
  parameters: { layout: "padded" },
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
      <Typography variant="caption" color="text.secondary">
        No chips, no wrapper markup — the component returns{" "}
        <code>null</code> when <code>items.length === 0</code>.
      </Typography>
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
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        The right-edge fade only renders below the <code>md</code>{" "}
        breakpoint and only once the row actually overflows — resize the
        viewport to see it appear/disappear.
      </Typography>
    </Box>
  ),
};

export const AccessibilityNote: StoryObj = {
  render: () => (
    <Alert severity="warning" sx={{ maxWidth: 700 }}>
      The scroll container hides its native scrollbar (
      <code>scrollbarWidth: "none"</code>) on every browser. On mobile this
      is compensated for by the fade affordance above; on desktop, with no
      fade and no visible scrollbar, a user relying on a visible scrollbar
      has no indication the row scrolls. Flagged in the Phase 1 audit, not
      fixed here.
    </Alert>
  ),
};
