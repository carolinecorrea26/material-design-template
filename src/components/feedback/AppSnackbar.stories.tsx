import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import AppSnackbar from "./AppSnackbar";
import ProgressSavedSnackbar from "./ProgressSavedSnackbar";

/**
 * AppSnackbar is the base transient-feedback snackbar: bottom-center on
 * small screens, top-center on large screens, with severity mapped to the
 * correct ARIA live-region role (alert for error/warning, status for
 * info/success — matching PageAlert's own mapping). ProgressSavedSnackbar
 * is a one-line preset built on top of it.
 */
const meta = {
  title: "Feedback/AppSnackbar",
  component: AppSnackbar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AppSnackbar>;

export default meta;

function SnackbarDemo({ severity, message }: { severity: "error" | "warning" | "info" | "success"; message: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Show {severity} snackbar
      </Button>
      <AppSnackbar open={open} onClose={() => setOpen(false)} message={message} severity={severity} />
    </>
  );
}

export const Success: StoryObj = {
  render: () => <SnackbarDemo severity="success" message="Saved successfully." />,
};

export const Error: StoryObj = {
  render: () => <SnackbarDemo severity="error" message="Something went wrong." />,
};

export const Warning: StoryObj = {
  render: () => <SnackbarDemo severity="warning" message="This may take a moment." />,
};

export const Info: StoryObj = {
  render: () => <SnackbarDemo severity="info" message="Your session will expire soon." />,
};

export const ProgressSavedPreset: StoryObj = {
  name: "ProgressSavedSnackbar (preset)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Show "Progress saved"
        </Button>
        <ProgressSavedSnackbar open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
};
