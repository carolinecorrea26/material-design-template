import { Paper, Stack, Typography, Chip } from '@mui/material';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
export default function AdminPlaceholder({ title }: { title: string }) {
  return <Workspace><WorkspaceHeader title={title} description={`${title} workspace`} /><Paper variant="outlined" sx={{ p: 4 }}><Stack spacing={2} alignItems="flex-start"><Chip label="Coming soon" color="primary" variant="outlined" /><Typography component="h2" variant="h6">This workspace is planned</Typography><Typography color="text.secondary">{title} tools will be available here in a future release.</Typography></Stack></Paper></Workspace>;
}
