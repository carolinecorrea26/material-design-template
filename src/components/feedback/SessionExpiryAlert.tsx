import { useId } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

/** Warning before application inactivity expiry. The countdown is not announced each second. */
export default function SessionExpiryAlert({ secondsLeft, onKeepActive }: { secondsLeft: number; onKeepActive: () => void }) {
  const titleId = useId();
  const descriptionId = useId();
  const remaining = Math.max(0, Math.ceil(secondsLeft));
  const countdown = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  return <Dialog open slotProps={{ paper: { role: 'alertdialog' } }} aria-labelledby={titleId} aria-describedby={descriptionId} maxWidth="xs" fullWidth disableEscapeKeyDown>
    <DialogTitle id={titleId}>Your session is about to expire</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Typography id={descriptionId} variant="body2">Keep your session active to continue your application. If your session expires, you can resume from your last saved progress.</Typography>
        <Box role="timer" aria-live="off" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>Time remaining: {countdown}</Box>
      </Stack>
    </DialogContent>
    <DialogActions><Button autoFocus variant="contained" onClick={onKeepActive}>Keep session active</Button></DialogActions>
  </Dialog>;
}
