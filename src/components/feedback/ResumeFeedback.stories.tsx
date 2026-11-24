import ResumeSessionWarning from './ResumeSessionWarning';
import { getResumePolicy } from '../../config/resumePolicy';
import { requirementText } from '../../domain/requirementContent';
import type { Meta } from "@storybook/react-vite";
import { Box, Stack } from "@mui/material";
import MailLockRounded from "@mui/icons-material/MailLockRounded";
import ExpiringCodeAlert from "./ExpiringCodeAlert";
import ResendCountdownRow from "./ResendCountdownRow";

const meta = {
  id: "feedback-resume-expiration",
  title: "Components/Feedback and overlays/Alerts/Verification-code expiry",
  component: ExpiringCodeAlert,
  subcomponents: { ResendCountdownRow, ResumeSessionWarning },
  parameters: { docs: { description: { component: "Expiry alerts and resend controls for application recovery links and security codes." } }, layout: "padded" },
} satisfies Meta;

export default meta;

export const ActiveLink = () => (
  <Stack spacing={2} sx={{ maxWidth: 560 }}>
    <ExpiringCodeAlert
      secondsLeft={getResumePolicy().linkValiditySeconds}
      kind="link"
      onResend={() => {}}
      activeIcon={<MailLockRounded />}
    >
      {requirementText('application.ui.a-secure-link-has-been-sent-to')}<strong>returning.user@example.com</strong>{requirementText('application.ui.open-your-email-and-click-the-link-to-continue')}
    </ExpiringCodeAlert>
    <ResendCountdownRow secondsLeft={getResumePolicy().linkValiditySeconds} kind="link" onResend={() => {}} />
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
      secondsLeft={getResumePolicy().codeValiditySeconds}
      kind="code"
      onResend={() => {}}
      showConfirmation
      confirmationMessage={requirementText('application.ui.a-new-verification-code-has-been-sent')}
    />
  </Box>
);

export const MfaWarning = () => <Box sx={{ maxWidth: 560 }}><ResumeSessionWarning secondsLeft={getResumePolicy().mfaWarningSeconds} /></Box>;
