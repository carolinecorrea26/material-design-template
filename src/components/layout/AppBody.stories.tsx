// Preview notes are documentation only; the canvas contains application UI.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from '@mui/material';
import AppBody from "./AppBody";

/**
 * AppBody is the main content wrapper AppShell places between AppHeader
 * and AppFooter: a `<main id="main-content" tabIndex={-1}>` landmark (the
 * skip-link target), responsive max-width/padding, and a scroll-to-top
 * effect keyed off pathname changes (via a patched history + a
 * useSyncExternalStore subscription, not react-router's own location).
 */
const meta = {
  id: "layout-appbody",
  title: "Components/Layout/Application body",
  component: AppBody,
  parameters: { docs: { description: { component: "Provides the main application content container and responsive spacing." } }, layout: "fullscreen" },
} satisfies Meta<typeof AppBody>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <AppBody>
      <Typography>Choose the coverage you would like to apply for.</Typography>
    </AppBody>
  ),
};
