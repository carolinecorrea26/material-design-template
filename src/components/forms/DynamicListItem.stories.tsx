import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import DynamicListItem from "./DynamicListItem";

/**
 * DynamicListItem is the bordered row DynamicList renders per item — content
 * on the left, Edit/Remove buttons on the right. It's usable on its own for
 * any add/edit/remove-style list, not just DynamicList's own field-array
 * dialog flow.
 */
const meta = {
  title: "Forms/DynamicListItem",
  component: DynamicListItem,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DynamicListItem>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <DynamicListItem onEdit={() => {}} onRemove={() => {}} itemLabel="Jordan Lee (60%)">
        <Typography variant="body2">
          <strong>Jordan Lee</strong> — spouse, 60% share
        </Typography>
      </DynamicListItem>
    </Box>
  ),
};

export const WithoutAccessibleLabel: StoryObj = {
  name: "Without itemLabel (not recommended)",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <DynamicListItem onEdit={() => {}} onRemove={() => {}}>
        <Typography variant="body2">
          <strong>Jordan Lee</strong> — spouse, 60% share
        </Typography>
      </DynamicListItem>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        Without <code>itemLabel</code>, Edit/Remove fall back to generic
        accessible names ("Edit", "Remove") — indistinguishable from a
        second item's identical buttons for screen reader users. Always pass{" "}
        <code>itemLabel</code> when a list can have more than one item.
      </Typography>
    </Box>
  ),
};

export const LongContent: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <DynamicListItem onEdit={() => {}} onRemove={() => {}} itemLabel="Dr. Alexandra Montgomery-Whitfield (Primary Care Physician)">
        <Typography variant="body2">
          <strong>Dr. Alexandra Montgomery-Whitfield</strong>
          <br />
          123 Long Street Name, Suite 4500, Springfield, IL 62704 — Primary
          Care Physician
        </Typography>
      </DynamicListItem>
    </Box>
  ),
};
