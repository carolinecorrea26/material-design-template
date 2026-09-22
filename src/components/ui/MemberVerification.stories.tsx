import { useState } from "react";
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
  title: "Coverage & Commerce/MemberVerification",
  component: MemberVerification,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MemberVerification>;

export default meta;

function MemberVerificationDemo() {
  const [open, setOpen] = useState(true);
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
        }}
      />
    </>
  );
}

export const Interactive: StoryObj = {
  render: () => <MemberVerificationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Try each path: "Send text code" or "Send voice code" jump straight to a passed result; "Answer security questions" has a real pass/fail outcome (answering any question with "None of the answers apply to me" fails verification); "Proceed without member verification" reports unverified immediately.',
      },
    },
  },
};
