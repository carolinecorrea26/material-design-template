import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import MobilePreviewFrame from "./MobilePreviewFrame";

const meta = {
  id: "layout-mobilepreviewframe",
  title: "Components/Content and data display/Application illustrations/Mobile frame",
  component: MobilePreviewFrame,
  parameters: { docs: { description: { component: "Presentation-only mobile viewport shared by previews with otherwise unrelated data and interaction models." } }, layout: "centered" },
} satisfies Meta<typeof MobilePreviewFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxWidth: 320,
    viewportHeight: 480,
    children: (
      <Box sx={{ p: 3, pt: 5 }}>
        <Typography variant="h5">Preview content</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The frame only provides mobile proportions, clipping, and device chrome.
        </Typography>
      </Box>
    ),
  },
};
