import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import CookieDialog from "./CookieDialog";

/**
 * Despite the "Dialog" name, this is a fixed-position banner, not a true
 * MUI Dialog — no backdrop, no focus trap, no role="dialog". It's rendered
 * globally by AppShell, gated on a localStorage cookie-consent flag, not
 * mounted/unmounted like AppModal's children. Documented here as a
 * clarification of that naming mismatch, not a bug to fix.
 */
const meta = {
  id: "overlays-cookiedialog",
  title: "Components/Feedback and overlays/Banners/Cookie notice",
  component: CookieDialog,
  parameters: { docs: { description: { component: "Informational cookie banner with Learn more and Close actions. The story demonstrates local dismissal; AppShell owns the saved dismissal flag." } }, layout: "fullscreen" },
} satisfies Meta<typeof CookieDialog>;

export default meta;

export const Default: StoryObj = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <Box sx={{ position: "relative", height: 320 }}>
          {!visible && (
            <Button sx={{ position: "absolute", top: 8, right: 8 }} onClick={() => setVisible(true)}>
              Show again
            </Button>
          )}
          {visible && <CookieDialog onClose={() => setVisible(false)} />}
        </Box>
      );
    }
    return <Demo />;
  },
};
