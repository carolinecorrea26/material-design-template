import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { applicationRecovery } from '../../../content/applicationRecovery';
import ApplicationStateLibrary from './ApplicationStateLibrary';

export default function RecoveryStatesLibrary() {
  const rows = Object.entries(applicationRecovery).map(([key, definition]) => ({ key, ...definition }));
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Recovery and processing states use the existing application messages and actions.</Typography>
    <BrowseTable label="Recovery states" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.key} columns={[
      { id: 'state', label: 'State', width: 230, value: row => `${row.title}\n${row.key}` },
      { id: 'placement', label: 'Placement', width: 130, value: row => row.placement, filter: true },
      { id: 'severity', label: 'Severity', width: 120, value: row => row.severity, filter: true },
      { id: 'message', label: 'Message', width: 350, value: row => row.message },
      { id: 'guidance', label: 'Recovery guidance', width: 400, value: row => row.guidance || '—' },
      { id: 'actions', label: 'Actions', width: 200, value: row => row.actions.join(', ') || 'None' },
    ]} />
    <details><summary>Application state definitions</summary><ApplicationStateLibrary /></details>
  </Stack>;
}
