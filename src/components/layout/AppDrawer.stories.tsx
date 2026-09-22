import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ThemeProvider, Typography } from "@mui/material";
import AppDrawer from "./AppDrawer";
import { createAppTheme } from "../../app/theme";

/**
 * AppDrawer is the shared adaptive drawer shell: a right-side panel on
 * desktop, a bottom sheet on mobile. `swipeable` opts into `SwipeableDrawer`
 * on mobile instead of plain `Drawer` — but the cart (AppHeader) is the only
 * real consumer that passes it. AppMenu's 4 sub-drawers and every page-level
 * drawer (Beneficiary, Home, HealthDi, Payment, Membership, HealthSi,
 * Coverage) render as a plain, non-swipeable `Drawer` even on mobile, which
 * is an inconsistent mobile interaction pattern worth knowing about before
 * adding a new drawer, not a bug in this component itself.
 */
const meta = {
  title: "Overlays/AppDrawer",
  component: AppDrawer,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AppDrawer>;

export default meta;

function DrawerDemo(props: Omit<React.ComponentProps<typeof AppDrawer>, "open" | "onClose" | "children">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <AppDrawer {...props} open={open} onClose={() => setOpen(false)}>
        <Typography variant="body2" color="text.secondary">
          Drawer content goes here.
        </Typography>
      </AppDrawer>
    </>
  );
}

export const Default: StoryObj = {
  name: "Desktop — right panel",
  render: () => <DrawerDemo title="Drawer title" />,
};

export const MobileBottomSheet: StoryObj = {
  name: "Mobile — bottom sheet (forceMobileLayout)",
  render: () => (
    <ThemeProvider theme={createAppTheme("default", { forceMobileLayout: true })}>
      <DrawerDemo title="Drawer title" />
    </ThemeProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Uses the same forceMobileLayout theme technique as Foundations/Breakpoints to reliably force the mobile branch. Below md, the drawer anchors to the bottom instead of the right and this story renders a plain Drawer, not a SwipeableDrawer — see Swipeable below for the opt-in variant.",
      },
    },
  },
};

export const Swipeable: StoryObj = {
  name: "Mobile — swipeable (cart's opt-in)",
  render: () => (
    <ThemeProvider theme={createAppTheme("default", { forceMobileLayout: true })}>
      <DrawerDemo title="Cart" swipeable />
    </ThemeProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "swipeable={true} switches to MUI's SwipeableDrawer with disableSwipeToOpen — swipe-to-dismiss, but not swipe-from-edge-to-open. AppHeader's cart drawer is the only real call site that passes this prop today.",
      },
    },
  },
};

export const NoTitleAriaLabelOnly: StoryObj = {
  name: "No title (ariaLabel only)",
  render: () => <DrawerDemo ariaLabel="Untitled drawer example" />,
  parameters: {
    docs: {
      description: {
        story:
          "When content manages its own header (e.g. a sub-drawer with its own back button), omit title and pass ariaLabel instead so the drawer still has an accessible name.",
      },
    },
  },
};
