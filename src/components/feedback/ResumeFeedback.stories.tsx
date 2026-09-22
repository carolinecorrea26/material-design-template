import type { Meta } from "@storybook/react-vite";
import { Box, Stack } from "@mui/material";
import MailLockRounded from "@mui/icons-material/MailLockRounded";
import ExpiringCodeAlert from "./ExpiringCodeAlert";
import ResendCountdownRow from "./ResendCountdownRow";

const meta = {
  title: "Feedback/Resume Expiration",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const ActiveLink = () => (
  <Stack spacing={2} sx={{ maxWidth: 560 }}>
    <ExpiringCodeAlert
      secondsLeft={542}
      kind="link"
      onResend={() => {}}
      activeIcon={<MailLockRounded />}
    >
      A secure link has been sent to <strong>returning.user@example.com</strong>.
    </ExpiringCodeAlert>
    <ResendCountdownRow secondsLeft={542} kind="link" onResend={() => {}} />
  </Stack>
);

export const ExpiredCode = () => (
  <Stack spacing={2} sx={{ maxWidth: 560 }}>
    <ExpiringCodeAlert secondsLeft={0} kind="code" onResend={() => {}} />
    <ResendCountdownRow secondsLeft={0} kind="code" onResend={() => {}} />
  </Stack>
);

export const ResentConfirmation = () => (
  <Box sx={{ maxWidth: 560 }}>
    <ExpiringCodeAlert
      secondsLeft={300}
      kind="code"
      onResend={() => {}}
      showConfirmation
      confirmationMessage="A new verification code has been sent."
    />
  </Box>
);
