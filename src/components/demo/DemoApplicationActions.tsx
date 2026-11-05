import { Alert, Button, Stack, Typography } from '@mui/material';
import type { SavedApplication } from '../../services/applicantSaveService';

/** Demonstration shortcuts belong only to the demo applicant Site. */
export default function DemoApplicationActions({ application, siteKey }: { application: SavedApplication; siteKey: string }) {
  if (siteKey !== 'demo') return null;
  const resumeUrl = new URL(`${import.meta.env.BASE_URL}resume`, window.location.origin);
  resumeUrl.searchParams.set('site', siteKey);
  resumeUrl.searchParams.set('applicationId', application.applicationId);
  return <Alert severity="info">
    <Stack spacing={1}>
      <Typography variant="subtitle2">Demo actions</Typography>
      <Typography variant="body2">Try resuming this saved application. Reference: {application.applicationId}</Typography>
      <Button size="small" href={resumeUrl.toString()} sx={{ alignSelf: 'flex-start' }}>Resume application</Button>
    </Stack>
  </Alert>;
}
