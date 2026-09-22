import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import SendApplicationDialog from "./SendApplicationDialog";

/**
 * SendApplicationDialog is a second AppModal preset (alongside
 * ConfirmationDialog), confirming the recipient before an advisor↔applicant
 * handoff email is sent. Used from Profile (advisor sending to the
 * applicant) and Review (applicant sending an edit back to the advisor).
 * Missing from `componentInventory.ts` today — the same gap flagged in the
 * Phase 1 audit.
 */
const meta = {
  title: "Overlays/SendApplicationDialog",
  component: SendApplicationDialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SendApplicationDialog>;

export default meta;

function SendDialogDemo(
  props: Omit<React.ComponentProps<typeof SendApplicationDialog>, "open" | "onClose" | "onConfirm">,
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Trigger send confirmation
      </Button>
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
      recipientLabel="applicant"
      recipientName="Jordan Rivera"
      recipientEmail="jordan.rivera@example.com"
    />
  ),
};

export const ToAdvisor: StoryObj = {
  name: "To advisor (applicant edit return)",
  render: () => (
    <SendDialogDemo
      recipientLabel="advisor"
      showRecipientName={false}
      recipientEmail="advisor@example.com"
      introText="This edited application will be sent back to your advisor:"
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
