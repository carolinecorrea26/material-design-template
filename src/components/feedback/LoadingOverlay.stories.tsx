import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import LoadingOverlay from "./LoadingOverlay";

/**
 * LoadingOverlay has 4 size variants for 4 different contexts — sm (inline,
 * e.g. inside a button), md (section-level), lg (page-level), and
 * fullscreen (blocks the whole viewport for external-redirect/global-
 * submission flows). Rich spinner+mark+heading+body processing screens use
 * ProcessingStatusPage instead.
 */
const meta = {
  title: "Feedback/LoadingOverlay",
  component: LoadingOverlay,
  parameters: { layout: "padded" },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;

export const Small: StoryObj = {
  name: 'size="sm" (inline, e.g. inside a button)',
  render: () => <LoadingOverlay size="sm" />,
};

export const Medium: StoryObj = {
  name: 'size="md" (default — section-level)',
  render: () => <LoadingOverlay message="Loading your coverage options…" />,
};

export const Large: StoryObj = {
  name: 'size="lg" (page-level)',
  render: () => <LoadingOverlay size="lg" message="Loading…" />,
};

export const Fullscreen: StoryObj = {
  name: 'size="fullscreen" (blocks the viewport)',
  render: () => (
    <Box sx={{ position: "relative", height: 320, border: "1px dashed", borderColor: "divider" }}>
      <Typography variant="body2" sx={{ p: 2 }}>
        Page content behind the overlay (for demo purposes this story
        contains the overlay in a bounded box instead of a real{" "}
        <code>position: fixed</code> full-viewport takeover).
      </Typography>
      <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <LoadingOverlay size="fullscreen" message="Redirecting to DocuSign…" />
      </Box>
    </Box>
  ),
};

export const NoMessage: StoryObj = {
  render: () => <LoadingOverlay />,
};
