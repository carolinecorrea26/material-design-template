import { createContext, useContext } from 'react';
import type { MockAuthStatus } from '../mock/client';
import type { PortalUser } from '../services/portalClient';
export type AccountSession = { status: MockAuthStatus; refresh: () => Promise<void>; signOut: () => void; changePassword: () => void };
export const AccountContext = createContext<AccountSession | null>(null);
export const useAccount = () => useContext(AccountContext);
export const PortalUserContext = createContext<PortalUser | null>(null);
export const usePortalUser = () => useContext(PortalUserContext);
export const useCanEdit = () => {
  const user = usePortalUser();
  const account = useAccount();
  if (user) return user.roleKey === 'portal-admin';
  return account ? account.status.canEdit === true : !import.meta.env.VITE_MOCK_PLATFORM_ENABLED;
};

export const useCanManageAccounts = () => useAccount()?.status.canManageAccounts === true;
