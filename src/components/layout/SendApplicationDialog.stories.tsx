import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import SendApplicationDialog from "./SendApplicationDialog";
import { getContent } from "../../content";

/**
 * SendApplicationDialog is a second AppModal preset (alongside
 * ConfirmationDialog), confirming the recipient before an advisor↔applicant
 * handoff email is sent. Used from Profile (advisor sending to the
 * applicant) and Review (applicant sending an edit back to the advisor).
 * Canonical shared dialog; the page examples review its placement and supplied
 * recipient rather than duplicating this component.
 */
const meta = {
  id: "overlays-sendapplicationdialog",
  title: "Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Send application",
  component: SendApplicationDialog,
  parameters: { standalone: true, review: { scope: 'shared-component', focus: 'Recipient details, applicant/advisor variants, missing values, Send and Cancel. Example callbacks only close the dialog.' }, docs: { description: { component: "Lets advisors send an application or request an edit from an applicant." } }, layout: "centered" },
} satisfies Meta<typeof SendApplicationDialog>;

export default meta;

function SendDialogDemo(
  props: Omit<React.ComponentProps<typeof SendApplicationDialog>, "open" | "onClose" | "onConfirm">,
) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {!open && <Button variant="outlined" onClick={() => setOpen(true)}>Reopen dialog</Button>}
      <SendApplicationDialog
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Default: StoryObj = {
  name: "To applicant (advisor → applicant handoff)",
  render: () => (
    <SendDialogDemo
      {...getContent().dialogs.sendApplication.sendToApplicant}
      recipientLabel="applicant"
      recipientName="Jordan Rivera"
      recipientEmail="jordan.rivera@example.com"
    />
  ),
};

export const ToAdvisor: StoryObj = {
  name: "Request application edits — send to advisor",
  render: () => (
    <SendDialogDemo
      {...getContent().dialogs.sendApplication.requestEditToApplication}
      recipientLabel="advisor"
      showRecipientName={false}
      recipientEmail="advisor@example.com"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "showRecipientName={false} hides the Name row — used when only the recipient's email is known/relevant, as in the applicant → advisor return flow.",
      },
    },
  },
};

export const MissingRecipientData: StoryObj = {
  name: "Missing name/email (em dash fallback)",
  render: () => <SendDialogDemo recipientEmail="" />,
  parameters: {
    docs: {
      description: {
        story:
          "Both the name and email rows fall back to an em dash (—) rather than rendering empty, so the dialog never shows a blank-looking row.",
      },
    },
  },
};
