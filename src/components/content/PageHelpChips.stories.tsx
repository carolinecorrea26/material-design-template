// Preview notes are documentation only; the canvas contains application UI.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import PageHelpChips from "./PageHelpChips";

/** Shared page-help chip row, independent of page identity and drawer content. */
const meta = {
  id: "content-helpchips",
  title: "Components/Content and data display/Help and support/Page help chips",
  component: PageHelpChips,
  parameters: { docs: { description: { component: "Opens contextual help and reference content from labeled chips." } }, layout: "padded" },
} satisfies Meta<typeof PageHelpChips>;

export default meta;

const items = [
  { id: "how-much", label: "How much does it cost?" },
  { id: "quick-decision", label: "About QuickDecision" },
  { id: "coverage-options", label: "Coverage options" },
];

export const Default: StoryObj = {
  render: () => <PageHelpChips items={items} onSelect={() => {}} />,
};

export const Empty: StoryObj = {
  name: "Empty (renders null)",
  render: () => (
    <>
      <PageHelpChips items={[]} onSelect={() => {}} />

    </>
  ),
};

export const NarrowContainerWithOverflow: StoryObj = {
  name: "Narrow container (overflow-fade, mobile-only)",
  render: () => (
    <Box sx={{ maxWidth: 280, border: "1px dashed", borderColor: "divider", p: 1 }}>
      <PageHelpChips
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
