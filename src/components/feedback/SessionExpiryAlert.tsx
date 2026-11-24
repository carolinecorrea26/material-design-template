import { useInterfaceText } from '../content/useInterfaceText';
import AppModal from "../layout/AppModal";
import { useId } from 'react';
import { Box, Stack, Typography } from '@mui/material';

/** Warning before application inactivity expiry. The countdown is not announced each second. */
export default function SessionExpiryAlert({ secondsLeft, onKeepActive }: { secondsLeft: number; onKeepActive: () => void }) {
  const text = useInterfaceText();
  const titleId = useId();
  const descriptionId = useId();
  const remaining = Math.max(0, Math.ceil(secondsLeft));
  const countdown = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  return <AppModal open onClose={onKeepActive} role="alertdialog" dismissible={false} showCloseIcon={false}
    title={<Typography component="span" variant="h6">{text('session-title')}</Typography>} titleId={titleId} descriptionId={descriptionId}
    maxWidth={444} minHeight="auto" fullScreenOnMobile={false}
    actions={[{ label: text('session-keep-active'), onClick: onKeepActive, autoFocus: true }]}>
      <Stack spacing={2}>
        <Typography id={descriptionId} variant="body2">{text('session-description')}</Typography>
        <Box role="timer" aria-live="off" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{text('session-time-remaining', { countdown })}</Box>
      </Stack>
  </AppModal>;
}
