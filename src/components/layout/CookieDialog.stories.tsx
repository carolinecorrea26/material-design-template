import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button, Typography } from "@mui/material";
import CookieDialog from "./CookieDialog";

/**
 * Despite the "Dialog" name, this is a fixed-position banner, not a true
 * MUI Dialog — no backdrop, no focus trap, no role="dialog". It's rendered
 * globally by AppShell, gated on a localStorage cookie-consent flag, not
 * mounted/unmounted like AppModal's children. Documented here as a
 * clarification of that naming mismatch, not a bug to fix.
 */
const meta = {
  title: "Overlays/CookieDialog",
  component: CookieDialog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CookieDialog>;

export default meta;

export const Default: StoryObj = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <Box sx={{ position: "relative", height: 320 }}>
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Page content behind the banner. The banner is fixed to the
            viewport corner (bottom-left on desktop, full-width bottom on
            mobile), not positioned relative to this box.
          </Typography>
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
