import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from "@mui/material";
import AppBody from "./AppBody";

/**
 * AppBody is the main content wrapper AppShell places between AppHeader
 * and AppFooter: a `<main id="main-content" tabIndex={-1}>` landmark (the
 * skip-link target), responsive max-width/padding, and a scroll-to-top
 * effect keyed off pathname changes (via a patched history + a
 * useSyncExternalStore subscription, not react-router's own location).
 */
const meta = {
  title: "Layout/AppBody",
  component: AppBody,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppBody>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <AppBody>
      <Typography variant="body2" color="text.secondary">
        Page content goes here. In the real app, AppShell renders
        AppHeader above this and AppFooter below it.
      </Typography>
    </AppBody>
  ),
};
