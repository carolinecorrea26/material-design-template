import { createContext, useContext } from 'react';
import type { MockAuthStatus } from '../mock/client';
export type AccountSession = { status: MockAuthStatus; refresh: () => Promise<void>; signOut: () => void; changePassword: () => void };
export const AccountContext = createContext<AccountSession | null>(null);
export const useAccount = () => useContext(AccountContext);
export const useCanEdit = () => {
  const account = useAccount();
  return account ? account.status.canEdit === true : !import.meta.env.VITE_MOCK_PLATFORM_ENABLED;
};

export const useCanManageAccounts = () => useAccount()?.status.canManageAccounts === true;
