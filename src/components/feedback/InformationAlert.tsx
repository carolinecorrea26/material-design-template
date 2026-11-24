import type { ReactNode } from 'react';
import { Alert, AlertTitle, Stack, Typography } from '@mui/material';
/** Shared information panel, with optional document actions supplied by the caller. */
export default function InformationAlert({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  if (!title.trim() && !description && !children) return null;
  return <Alert severity="info" role="status" sx={{ '& .MuiAlert-message': { width: '100%', minWidth: 0 } }}>
    <Stack spacing={2}>
      <AlertTitle sx={{ mb: 0 }}>{title}</AlertTitle>
      {description && <Typography variant="body2">{description}</Typography>}
      {children}
    </Stack>
  </Alert>;
}
