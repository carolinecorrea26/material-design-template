import { Box, Stack, Typography } from '@mui/material';
import PageShell from '../layout/PageShell';
import FormShell from '../layout/FormShell';
import ApplicationRecoveryActions from './ApplicationRecoveryActions';
import SiteSupport from '../layout/SiteSupport';
import { applicationRecovery, recoveryPresentation, type ApplicationErrorStatus } from '../../content/applicationRecovery';
import type { RecoveryIncident } from '../../domain/recoveryIncident';
import { recoveryIcons } from './recoveryIcons';
export type { ApplicationErrorStatus } from '../../content/applicationRecovery';

/** One page template for 404/500, session timeout, maintenance, unavailable applications and technical/payment/submission failures. */
export default function ApplicationErrorState({ status = 500, incident, onStartNew }: { status?: ApplicationErrorStatus; incident?: RecoveryIncident; onStartNew?: () => void }) {
  const presentation = incident ? recoveryPresentation(incident) : undefined;
  const { title, message, guidance, actions, icon } = presentation ?? applicationRecovery[status];
  const reference = presentation?.incident.reference;
  const number = presentation ? typeof presentation.state === 'number' ? presentation.state : undefined : typeof status === 'number' ? status : undefined;
  const Icon = recoveryIcons[icon];
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={title} maxWidth={720} noTitle>
      <FormShell sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5} alignItems="flex-start">
          {number !== undefined
            ? <Typography component="p" sx={{ fontSize: { xs: '4.5rem', sm: '6rem' }, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.06em', color: 'primary.main' }}>{number}</Typography>
            : <Icon aria-hidden="true" data-testid="recovery-state-icon" sx={{ fontSize: { xs: 64, sm: 80 }, color: 'primary.main' }} />}
          <Typography component="h1" variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>{title}</Typography>
          <Stack spacing={1} sx={{ maxWidth: 560 }}>
            <Typography color="text.secondary">{message}</Typography>
            {guidance && <Typography color="text.secondary">{guidance}</Typography>}
          </Stack>
          <ApplicationRecoveryActions actions={actions} onStartNew={onStartNew} appearance="links" />
          <SiteSupport reference={reference} applicationId={presentation?.incident.applicationId} confirmationId={presentation?.incident.confirmationId} />
        </Stack>
      </FormShell>
    </PageShell>
  </Box>;
}
