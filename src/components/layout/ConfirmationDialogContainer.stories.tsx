import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import ConfirmationDialog from "./ConfirmationDialog";
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';

/**
 * ConfirmationDialog is a thin Yes/Cancel preset over AppModal
 * (role="alertdialog", maxWidth 480). Used by Review and Coverage for
 * destructive/consequential confirmations.
 */
const meta = {
  id: "overlays-confirmationdialog",
  title: "Components/Feedback and overlays/Dialogs and drawers/Containers/Confirmation dialog",
  component: ConfirmationDialog,
  parameters: { docs: { description: { component: "Requests confirmation before continuing a consequential application action." } }, layout: "centered" },
} satisfies Meta<typeof ConfirmationDialog>;

export default meta;

function ConfirmationDemo(
  props: Omit<React.ComponentProps<typeof ConfirmationDialog>, "open" | "onClose" | "onConfirm">,
) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {!open && <Button variant="outlined" onClick={() => setOpen(true)}>Reopen dialog</Button>}
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
  render: () => <ComponentFixture>{fixture => <ConfirmationDemo {...fixture.content.dialogs.confirmation.editApplication} />}</ComponentFixture>,
};
