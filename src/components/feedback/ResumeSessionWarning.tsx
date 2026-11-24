import { AlertTitle, Box } from '@mui/material';
import { getResumePolicy } from '../../config/resumePolicy';
import { requirementText } from '../../domain/requirementContent';
import { formatCountdown } from '../../utils/formatCountdown';
import PageAlert from './PageAlert';

/** Shared page alert for a fixed MFA deadline, with no extension action. */
export default function ResumeSessionWarning({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft === null || secondsLeft <= 0 || secondsLeft > getResumePolicy().mfaWarningSeconds) return null;
  return <PageAlert severity="warning" message={<>
    <AlertTitle>{requirementText('resume.mfa.warning-title')}</AlertTitle>
    {requirementText('resume.mfa.warning-message')}
    <Box role="timer" aria-live="off" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>{requirementText('resume.mfa.remaining', { time: formatCountdown(secondsLeft) })}</Box>
  </>} />;
}
