import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
/** Decision letters on the main page; the application receipt and help sit alongside them. */
export default function ReceiptDecisions({ title, description, children, support, receipt }: { title: string; description: string; children: ReactNode; support?: ReactNode; receipt?: ReactNode }) {
  return <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
    <Box component="section" aria-labelledby="receipt-decisions-heading" sx={theme => ({ flex: 1, minWidth: 0, width: '100%', p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) })}>
      <Typography id="receipt-decisions-heading" variant="h6" component="h2">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>
      <Stack spacing={2.5} sx={{ mt: 2.5 }}>{children}</Stack>
    </Box>
    {(receipt || support) && <Stack spacing={3} sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>{receipt}{support}</Stack>}
  </Stack>;
}
