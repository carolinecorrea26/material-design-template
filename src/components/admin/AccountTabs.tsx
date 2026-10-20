import { Tabs, Tab } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useCanManageAccounts } from '../../admin/AccountContext';
export default function AccountTabs({ value }: { value: 'profile' | 'settings' | 'management' }) {
  const canManage = useCanManageAccounts();
  return <Tabs value={value} aria-label="Account sections" variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
    <Tab label="Profile" value="profile" component={RouterLink} to="/admin-center/account/profile" />
    <Tab label="Settings" value="settings" component={RouterLink} to="/admin-center/account/settings" />
    {canManage && <Tab label="Account Management" value="management" component={RouterLink} to="/admin-center/administration" />}
  </Tabs>;
}
