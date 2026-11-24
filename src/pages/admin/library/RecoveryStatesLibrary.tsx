import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { applicationRecovery, recoveryFamilies, recoveryTemplate } from '../../../content/applicationRecovery';
import ApplicationStateLibrary from './ApplicationStateLibrary';

export default function RecoveryStatesLibrary() {
  const rows = Object.entries(applicationRecovery).filter(([, definition]) => definition.placement === 'page').map(([key, definition]) => ({ key, ...definition }));
  return <Stack spacing={2}>
    <Typography variant="body2">One global redirect-page component (ApplicationErrorState) with content cases: minimal Site header, centered content card, code or icon, title, explanation, guidance, permitted actions and shared Site support. Structure: {recoveryTemplate.sections.join(' → ')}. Site branding and contacts use the effective Site.</Typography>
    <BrowseTable label="Redirect-page content groups" hiddenColumns={['displayId']} rows={Object.entries(recoveryFamilies).map(([key, definition]) => ({ key, ...definition }))} rowKey={row => row.key} columns={[
      { id: 'name', label: 'Content group', value: row => row.name },
      { id: 'description', label: 'Use', value: row => row.description },
    ]} />
    <BrowseTable label="Redirect-page content cases" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.key} columns={[
      { id: 'state', label: 'State', width: 230, value: row => `${row.title}\n${row.key}` },
      { id: 'family', label: 'Content group', value: row => row.family ? recoveryFamilies[row.family].name : 'In-page feedback/status' },
      { id: 'placement', label: 'Placement', width: 130, value: row => row.placement, filter: true },
      { id: 'message', label: 'Message', width: 350, value: row => row.message },
      { id: 'guidance', label: 'Recovery guidance', width: 400, value: row => row.guidance || '—' },
      { id: 'actions', label: 'Actions', width: 200, value: row => row.actions.join(', ') || 'None' },
    ]} />
    <details><summary>Application state definitions</summary><ApplicationStateLibrary /></details>
  </Stack>;
}
