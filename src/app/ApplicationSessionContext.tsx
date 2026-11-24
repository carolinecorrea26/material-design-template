import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applicationSessionStorage,
  emptyApplicationSession,
  type ApplicationSessionStore,
  type ApplicationSessionState,
} from "./applicationSessionStorage";
import { resetApplicationTimeout } from './applicationTimeout';
import { resolveSiteId } from '../data/activeSite';

export type ApplicationSessionContextValue = ApplicationSessionState & {
  markReviewSubmitted: () => void;
  setAdvisorApplicantFlow: (enabled: boolean) => void;
  resetApplicationSession: () => void;
};

export const ApplicationSessionContext =
  createContext<ApplicationSessionContextValue | null>(null);

const browserSessionStore: ApplicationSessionStore = {
  ...applicationSessionStorage,
  resetTimeout: () => resetApplicationTimeout(resolveSiteId()),
};

export function ApplicationSessionProvider({ children, store = browserSessionStore }: { children: ReactNode; store?: ApplicationSessionStore }) {
  const snapshot = useSyncExternalStore(store.subscribe,
    () => JSON.stringify(store.read()),
    () => JSON.stringify(emptyApplicationSession()));
  const state = useMemo(() => JSON.parse(snapshot) as ApplicationSessionState, [snapshot]);
  const markReviewSubmitted = useCallback(() => store.writeReviewSubmitted(true), [store]);
  const setAdvisorApplicantFlow = useCallback((enabled: boolean) => store.writeAdvisorApplicantFlow(enabled), [store]);
  const resetApplicationSession = useCallback(() => {
    store.clear();
    store.resetTimeout?.();
  }, [store]);

  const value = useMemo<ApplicationSessionContextValue>(
    () => ({
      ...state,
      markReviewSubmitted,
      setAdvisorApplicantFlow,
      resetApplicationSession,
    }),
    [markReviewSubmitted, resetApplicationSession, setAdvisorApplicantFlow, state],
  );

  return (
    <ApplicationSessionContext.Provider value={value}>
      {children}
    </ApplicationSessionContext.Provider>
  );
}

export function useApplicationSession() {
  const context = useContext(ApplicationSessionContext);

  if (!context) {
    throw new Error(
      "useApplicationSession must be used within an ApplicationSessionProvider",
    );
  }

  return context;
}
