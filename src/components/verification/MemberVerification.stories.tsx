import { useEffect, useState, type ComponentProps } from "react";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import MemberVerification from "./MemberVerification";

/**
 * MemberVerification is a multi-step identity-verification modal shown on
 * the Eligibility page for TPA-verified members — dummy LexisNexis-style
 * security questions, not a real identity-verification integration.
 * Full-screen on mobile, centered dialog on desktop. The "text"/"voice"
 * code paths skip straight to a passed result (no real code delivery
 * exists in this prototype); only "security-questions" has a real
 * pass/fail branch, and "skip" reports unverified without asking anything.
 */
const meta = {
  id: "coverage-commerce-memberverification",
  title: "Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Member verification",
  component: MemberVerification,
  args: { open: true, onClose: fn() },
  argTypes: {
    open: { control: "boolean", description: "Shows the verification dialog." },
    onClose: { action: "verification completed", description: "Receives true only when the prototype verification passes." },
  },
  parameters: { docs: { description: { component: "Collects a verification method and security answers using FieldRenderer. Text and voice outcomes are simulated; closing reports whether verification passed." } }, layout: "fullscreen" },
} satisfies Meta<typeof MemberVerification>;

export default meta;

function MemberVerificationDemo(args: ComponentProps<typeof MemberVerification>) {
  const [open, setOpen] = useState(args.open);
  useEffect(() => setOpen(args.open), [args.open]);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)} sx={{ m: 2 }}>
        Reopen verification
      </Button>
      {lastResult !== null && (
        <span style={{ marginLeft: 8 }}>Last result: verified = {String(lastResult)}</span>
      )}
      <MemberVerification
        open={open}
        onClose={(verified) => {
          setOpen(false);
          setLastResult(verified);
          args.onClose(verified);
        }}
      />
    </>
  );
}

export const Interactive: StoryObj<typeof meta> = {
  render: args => <MemberVerificationDemo {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Try each path: "Send text code" or "Send voice code" jump straight to a passed result; "Answer security questions" has a real pass/fail outcome (answering any question with "None of the answers apply to me" fails verification); "Skip member verification and apply" reports unverified immediately.',
      },
    },
  },
};
