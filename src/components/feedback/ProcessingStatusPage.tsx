import { requirementText } from "../../domain/requirementContent";
import { useEffect, useState, type ReactNode } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RecoveryAlert from './RecoveryAlert';
import ApplicationErrorState from './ApplicationErrorState';
import { recoveryIncident, supportReference, type RecoveryOperation } from '../../domain/recoveryIncident';
import { applicationRecovery, recoveryPresentation } from '../../content/applicationRecovery';
import type { ApplicationSupportIds } from '../../domain/applicationSupportReference';
import prototypeDefaults from '../../../requirements/global/prototype-fixtures/application.json';

type ProcessingStatusPageProps = ApplicationSupportIds & {
  heading: ReactNode;
  body: ReactNode;
  mark?: ReactNode;
  operation?: RecoveryOperation;
  phase?: 'pending' | 'complete' | 'timeout';
  // null keeps an explicit external loading preview pending until unmounted.
  timeoutMs?: number | null;
  reference?: string;
};

/** Bounded prototype processing state; local completion/timeout variants share the recovery components. */
export default function ProcessingStatusPage({
  heading,
  body,
  mark,
  operation = 'decision',
  phase = 'pending',
  timeoutMs = prototypeDefaults.processingTimeoutMs,
  reference,
  applicationId,
  confirmationId,
}: ProcessingStatusPageProps) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (phase !== 'pending' || timeoutMs === null) return;
    const duration = Number.isFinite(timeoutMs) ? Math.min(60000, Math.max(1000, timeoutMs)) : prototypeDefaults.processingTimeoutMs;
    const timer = window.setTimeout(() => setTimedOut(true), duration);
    return () => clearTimeout(timer);
  }, [phase, timeoutMs, operation]);
  const safeReference = supportReference(reference);
  if (phase !== 'complete' && (phase === 'timeout' || timedOut)) {
    const incident = recoveryIncident({ code: 'OPERATION_TIMED_OUT', operation, outcome: 'unknown', reference: safeReference, applicationId, confirmationId });
    return recoveryPresentation(incident).placement === 'page' ? <ApplicationErrorState incident={incident} /> : <RecoveryAlert incident={incident} />;
  }
  const complete = phase === 'complete';
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 3,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 400 }}>
        {complete ? <CheckCircleRounded sx={{ fontSize: 48, color: 'success.main' }} aria-hidden="true" /> : <CircularProgress size={48} thickness={4} aria-hidden />}
        <Stack spacing={1} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {!complete && mark}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {complete ? applicationRecovery['processing-complete'].title : heading}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", lineHeight: 1.6 }}
          >
            {complete ? applicationRecovery['processing-complete'].message : body}
          </Typography>
          {safeReference && <Typography variant="caption">{requirementText("application.ui.support-reference")}{safeReference}</Typography>}
        </Stack>
      </Stack>
    </Box>
  );
}
