import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Typography } from "@mui/material";
import AppModal from "./AppModal";

/**
 * AppModal is the base dialog primitive underneath ConfirmationDialog and
 * SendApplicationDialog (see Overlays/ConfirmationDialog,
 * Overlays/SendApplicationDialog) — fullScreen below md, a configurable
 * maxWidth on desktop, and a role prop for switching between "dialog" and
 * "alertdialog" semantics.
 */
const meta = {
  title: "Overlays/AppModal",
  component: AppModal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AppModal>;

export default meta;

function ModalDemo({
  children,
  ...props
}: Omit<React.ComponentProps<typeof AppModal>, "open" | "onClose" | "children"> & {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <AppModal {...props} open={open} onClose={() => setOpen(false)}>
        {children ?? (
          <Typography variant="body2" color="text.secondary">
            Modal content goes here.
          </Typography>
        )}
      </AppModal>
    </>
  );
}

export const Default: StoryObj = {
  render: () => <ModalDemo title="Modal title" />,
};

export const SingleAction: StoryObj = {
  name: "Single action (Dismiss)",
  render: () => (
    <ModalDemo
      title="Terms of use"
      actions={[{ label: "Dismiss", onClick: () => {} }]}
    />
  ),
};

export const TwoActions: StoryObj = {
  name: "Two actions (confirm + cancel)",
  render: () => (
    <ModalDemo
      title="Discard changes?"
      role="alertdialog"
      minHeight="auto"
      maxWidth={480}
      actions={[
        { label: "Discard", onClick: () => {}, color: "error" },
        { label: "Keep editing", onClick: () => {}, variant: "text" },
      ]}
    />
  ),
};

export const NoCloseIcon: StoryObj = {
  name: "showCloseIcon={false}",
  render: () => (
    <ModalDemo
      title="No close icon"
      showCloseIcon={false}
      minHeight="auto"
      maxWidth={480}
      actions={[{ label: "OK", onClick: () => {} }]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When the × icon is hidden, an action button becomes the only way to close the dialog via the mouse — always pair this with at least one action.",
      },
    },
  },
};

export const ForceFullScreen: StoryObj = {
  name: "forceFullScreen (desktop)",
  render: () => (
    <ModalDemo title="Always full screen" forceFullScreen>
      <Typography variant="body2" color="text.secondary">
        Used for content meant to fill the entire viewport regardless of
        screen size, e.g. documentation section browsers.
      </Typography>
    </ModalDemo>
  ),
};
