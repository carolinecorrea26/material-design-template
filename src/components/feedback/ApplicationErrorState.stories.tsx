import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import ApplicationErrorState, { type ApplicationErrorStatus } from './ApplicationErrorState';
import type { RecoveryIncident } from '../../domain/recoveryIncident';

const technicalIncidents = {
  navigation: { code: 'TECHNICAL_ERROR', operation: 'page', outcome: 'failed', applicationId: 'APP-12345678' },
  paymentFailed: { code: 'TECHNICAL_ERROR', operation: 'payment', outcome: 'failed', applicationId: 'APP-12345678' },
  submissionFailed: { code: 'TECHNICAL_ERROR', operation: 'submission', outcome: 'failed', applicationId: 'APP-12345678' },
  paymentUnknown: { code: 'OUTCOME_UNKNOWN', operation: 'payment', outcome: 'unknown', applicationId: 'APP-12345678' },
  submissionUnknown: { code: 'OUTCOME_UNKNOWN', operation: 'submission', outcome: 'unknown', applicationId: 'APP-12345678' },
} satisfies Record<string, RecoveryIncident>;

const recoveryScenarios: { label: string; status?: ApplicationErrorStatus; incident?: RecoveryIncident }[] = [
  { label: 'Page not found (404)', status: 404 },
  { label: 'Server error (500)', status: 500 },
  { label: 'Session timed out', status: 'session-expired' },
  { label: 'Maintenance', status: 'maintenance' },
  { label: 'Application unavailable', incident: { code: 'APPLICATION_UNAVAILABLE', operation: 'resume', outcome: 'failed', applicationId: 'APP-12345678' } },
  { label: 'Page or navigation failure', incident: technicalIncidents.navigation },
  { label: 'Payment confirmed unsuccessful', incident: technicalIncidents.paymentFailed },
  { label: 'Submission confirmed unsuccessful', incident: technicalIncidents.submissionFailed },
  { label: 'Payment result unconfirmed', incident: technicalIncidents.paymentUnknown },
  { label: 'Submission result unconfirmed', incident: technicalIncidents.submissionUnknown },
];

function SharedErrorPageDemo() {
  const [scenario, setScenario] = useState(0);
  return <>
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="recovery-scenario-label">Error page scenario</InputLabel>
        <Select labelId="recovery-scenario-label" label="Error page scenario" value={scenario} onChange={event => setScenario(Number(event.target.value))}>
          {recoveryScenarios.map(({ label }, index) => <MenuItem key={label} value={index}>{label}</MenuItem>)}
        </Select>
      </FormControl>
    </Box>
    <ApplicationErrorState status={recoveryScenarios[scenario].status} incident={recoveryScenarios[scenario].incident} />
  </>;
}

const meta = { id: "pages-error-pages",
  title: "Components/Pages/Error pages/Whole page", component: ApplicationErrorState, parameters: { layout: 'fullscreen', catalog: { pages: { NotFound: 'error-404', ServerError: 'error-500', SessionExpired: 'session-expired', TechnicalError: 'technical-error', Maintenance: 'maintenance', ApplicationUnavailable: 'application-unavailable', PaymentOutcomeUnknown: 'outcome-unknown' } } } } satisfies Meta<typeof ApplicationErrorState>;
export default meta;
export const NotFound: StoryObj<typeof meta> = { args: { status: 404 } };
export const ServerError: StoryObj<typeof meta> = { args: { status: 500 } };
export const SessionExpired: StoryObj<typeof meta> = { args: { status: 'session-expired' } };
export const TechnicalError: StoryObj<typeof meta> = { name: 'Shared error page — all states', render: () => <SharedErrorPageDemo /> };
export const Maintenance: StoryObj<typeof meta> = { args: { status: 'maintenance' } };
export const ApplicationUnavailable: StoryObj<typeof meta> = { args: { incident: { code: 'APPLICATION_UNAVAILABLE', operation: 'resume', outcome: 'failed', applicationId: 'APP-12345678' } } };
export const PaymentOutcomeUnknown: StoryObj<typeof meta> = { args: { incident: technicalIncidents.paymentUnknown } };
export const PaymentFailed: StoryObj<typeof meta> = { args: { incident: technicalIncidents.paymentFailed } };
export const SubmissionFailed: StoryObj<typeof meta> = { args: { incident: technicalIncidents.submissionFailed } };
export const SubmissionOutcomeUnknown: StoryObj<typeof meta> = { args: { incident: technicalIncidents.submissionUnknown } };
