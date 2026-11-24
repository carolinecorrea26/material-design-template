import { Box, Stack, Typography } from '@mui/material';
import PageShell from '../layout/PageShell';
import FormShell from '../layout/FormShell';
import ApplicationRecoveryActions from './ApplicationRecoveryActions';
import SiteSupport from '../layout/SiteSupport';
import { useComponentContent } from '../content/ComponentContentContext';
import { applicationRecovery, recoveryPresentation, recoveryTemplate, type ApplicationErrorStatus } from '../../content/applicationRecovery';
import type { RecoveryIncident } from '../../domain/recoveryIncident';
import { recoveryIcons } from './recoveryIcons';
export type { ApplicationErrorStatus } from '../../content/applicationRecovery';

/** One global redirect-page component; source-defined cases vary content, icon and actions. */
export default function ApplicationErrorState({ status = 500, incident, onStartNew }: { status?: ApplicationErrorStatus; incident?: RecoveryIncident; onStartNew?: () => void }) {
  const content = useComponentContent();
  const presentation = incident ? recoveryPresentation(incident) : undefined;
  const definition = presentation ?? applicationRecovery[status];
  const isMaintenance = (presentation?.state ?? status) === 'maintenance';
  const maintenance = content.pages.maintenance;
  if (isMaintenance && (!maintenance || typeof maintenance.title !== 'string' || typeof maintenance.subhead !== 'string' || typeof maintenance.recoveryGuidance !== 'string')) throw new Error('Missing fresh-start Maintenance content');
  const { title, message, guidance, actions, icon, family } = isMaintenance
    ? { ...definition, title: maintenance!.title, message: maintenance!.subhead!, guidance: maintenance!.recoveryGuidance! }
    : definition;
  const number = presentation ? typeof presentation.state === 'number' ? presentation.state : undefined : typeof status === 'number' ? status : undefined;
  const Icon = recoveryIcons[icon];
  const sections = {
    indicator: <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'primary.main' }}>
      <Icon aria-hidden="true" data-testid="recovery-state-icon" sx={{ fontSize: recoveryTemplate.indicatorSize }} />
      {number !== undefined && <Typography component="p" sx={{ fontSize: recoveryTemplate.indicatorSize, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.06em' }}>{number}</Typography>}
    </Stack>,
    title: <Typography component="h1" variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>{title}</Typography>,
    message: <Typography color="text.secondary" sx={{ maxWidth: recoveryTemplate.messageMaxWidth }}>{message}</Typography>,
    guidance: guidance ? <Typography color="text.secondary" sx={{ maxWidth: recoveryTemplate.messageMaxWidth }}>{guidance}</Typography> : null,
    actions: actions.length ? <ApplicationRecoveryActions actions={actions} onStartNew={onStartNew} appearance="links" /> : null,
    support: <SiteSupport reference={presentation?.incident.reference} applicationId={presentation?.incident.applicationId} confirmationId={presentation?.incident.confirmationId} />,
  };
  return <Box data-recovery-family={family} sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={title} maxWidth={recoveryTemplate.maxWidth} noTitle>
      <FormShell sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack alignItems="flex-start">
          {recoveryTemplate.sections.filter(section => sections[section as keyof typeof sections] !== null).map((section, index) => <Box key={section} sx={{ width: '100%', mt: index === 0 ? 0 : section === 'guidance' ? 1 : 2.5 }}>{sections[section as keyof typeof sections]}</Box>)}
        </Stack>
      </FormShell>
    </PageShell>
  </Box>;
}
