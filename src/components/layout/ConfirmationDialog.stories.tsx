import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import ConfirmationDialog from "./ConfirmationDialog";

/**
 * ConfirmationDialog is a thin Yes/Cancel preset over AppModal
 * (role="alertdialog", maxWidth 480). Used by Review and Coverage for
 * destructive/consequential confirmations.
 */
const meta = {
  title: "Overlays/ConfirmationDialog",
  component: ConfirmationDialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ConfirmationDialog>;

export default meta;

function ConfirmationDemo(
  props: Omit<React.ComponentProps<typeof ConfirmationDialog>, "open" | "onClose" | "onConfirm">,
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Trigger confirmation
      </Button>
      <ConfirmationDialog
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Default: StoryObj = {
  render: () => (
    <ConfirmationDemo
      title="Remove this beneficiary?"
      message="This action can't be undone."
    />
  ),
};

export const DestructiveColor: StoryObj = {
  name: 'confirmColor="error"',
  render: () => (
    <ConfirmationDemo
      title="Delete this record?"
      message="This action can't be undone."
      confirmColor="error"
    />
  ),
};

export const CustomLabels: StoryObj = {
  render: () => (
    <ConfirmationDemo
      title="Leave without saving?"
      message="Your changes to this page haven't been saved yet."
      confirmLabel="Leave page"
      cancelLabel="Stay here"
    />
  ),
};
