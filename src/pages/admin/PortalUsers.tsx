import { Alert, Typography } from '@mui/material';
import { usePortalUser } from '../../admin/AccountContext';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import BrowseTable from '../../components/docs/BrowseTable';
import { useServiceData } from '../../hooks/useServiceData';
import { portalRequest, type PortalUser } from '../../services/portalClient';

const readUsers = () => portalRequest<PortalUser[]>('/users');

function UserDirectory() {
  const { data, loading, error } = useServiceData(readUsers);
  if (loading) return <Typography role="status">Loading users…</Typography>;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  return <BrowseTable label="Portal users" tableName="portal-users" rows={data ?? []} rowKey={user => user.id} columns={[
    { id: 'name', label: 'Name', value: user => user.displayName },
    { id: 'email', label: 'Email', value: user => user.email },
    { id: 'role', label: 'Role', value: user => user.roleKey === 'portal-admin' ? 'Portal Admin' : 'Account Manager' },
    { id: 'sites', label: 'Site access', value: user => user.roleKey === 'portal-admin' ? 'All Sites' : user.siteKeys.join(', ') },
  ]} />;
}

export default function PortalUsers() {
  const user = usePortalUser();
  return <Workspace>
    <WorkspaceHeader title="Portal users" description="Demo accounts and Site access." />
    {user?.roleKey === 'portal-admin' ? <UserDirectory /> : <Alert severity="info">Portal Admin access is required.</Alert>}
  </Workspace>;
}
