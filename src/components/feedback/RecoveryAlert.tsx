import { useState } from 'react';
import { Button, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageAlert from './PageAlert';
import { getPagePath } from '../../config/pages';
import { resolveSiteId } from '../../data/activeSite';
import { recoveryPresentation } from '../../content/applicationRecovery';
import { defaultTechnicalIncident, type RecoveryIncident } from '../../domain/recoveryIncident';
import AppDrawer from '../layout/AppDrawer';
import SiteSupport from '../layout/SiteSupport';
import ApplicationRecoveryActions from './ApplicationRecoveryActions';

/** Shared persistent recovery alert with approved local copy, safe actions and contextual Site support. */
export default function RecoveryAlert({ incident = defaultTechnicalIncident, onRetry }: { incident?: RecoveryIncident; onRetry?: () => void }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const state = recoveryPresentation(incident);
  if (state.state === 'offline') return null; // AppShell owns the global connection bar.
  if (state.placement === 'field') return null; // FieldRenderer owns specific field feedback and Next owns its summary.
  const search = new URLSearchParams({ site: resolveSiteId() });
  const inlineActions = state.actions.filter(action => action !== 'start-new');
  return <>
    <PageAlert severity={state.severity} message={<Stack spacing={1}>
      <Typography variant="body2" fontWeight={700}>{state.title}</Typography>
      <Typography variant="body2">{state.message} {state.guidance}</Typography>
      {state.incident.reference && <Typography variant="body2">Support reference: <strong>{state.incident.reference}</strong></Typography>}
      {state.placement !== 'page' && <ApplicationRecoveryActions actions={inlineActions} onRetry={onRetry} />}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Link component={RouterLink} to={`${getPagePath('technical-error')}?${search}`} state={{ recoveryIncident: state.incident }}>View recovery page</Link>
        <Button size="small" onClick={() => setSupportOpen(true)}>Get help</Button>
      </Stack>
    </Stack>} />
    <AppDrawer open={supportOpen} onClose={() => setSupportOpen(false)} title="Application support"><SiteSupport reference={state.incident.reference} applicationId={state.incident.applicationId} confirmationId={state.incident.confirmationId} /></AppDrawer>
  </>;
}
