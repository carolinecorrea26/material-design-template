import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import AppMenu from "./AppMenu";
import { getActiveClient } from "../../config/client/getActiveClient";

/**
 * AppMenu is the full-screen hamburger nav drawer (opened from AppHeader),
 * with 4 nested sub-drawers: How Applying Works (see
 * Coverage & Commerce/HowApplyingWorksPanel), About Coverage (see
 * Coverage & Commerce/CoverageOptionsPanel), Coverage Needs Calculator
 * (see Coverage & Commerce/CoverageNeedsCalculator), and QuickDecision℠
 * (see Content/QuickDecision). Renders as a plain right-side `Drawer`
 * (not `AppDrawer`), unlike its own nested sub-drawers which do use
 * AppDrawer.
 */
const meta = {
  title: "Layout/AppMenu",
  component: AppMenu,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppMenu>;

export default meta;

function AppMenuDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Reopen menu
      </Button>
      <AppMenu open={open} onClose={() => setOpen(false)} client={getActiveClient()} />
    </Box>
  );
}

export const Default: StoryObj = {
  render: () => <AppMenuDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Try opening each of the 4 sub-drawer links — How Applying Works, About Coverage, Coverage Needs Calculator, and the QuickDecision℠ link inside How Applying Works' step text.",
      },
    },
  },
};
