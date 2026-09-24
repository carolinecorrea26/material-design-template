import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applicationSessionStorage,
  type ApplicationSessionState,
} from "./applicationSessionStorage";

export type ApplicationSessionContextValue = ApplicationSessionState & {
  markReviewSubmitted: () => void;
  setAdvisorApplicantFlow: (enabled: boolean) => void;
  resetApplicationSession: () => void;
};

export const ApplicationSessionContext =
  createContext<ApplicationSessionContextValue | null>(null);

export function ApplicationSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<ApplicationSessionState>(() =>
    applicationSessionStorage.read(),
  );

  const markReviewSubmitted = useCallback(() => {
    applicationSessionStorage.writeReviewSubmitted(true);
    setState((current) => ({ ...current, reviewSubmitted: true }));
  }, []);

  const setAdvisorApplicantFlow = useCallback((enabled: boolean) => {
    applicationSessionStorage.writeAdvisorApplicantFlow(enabled);
    setState((current) => ({ ...current, advisorApplicantFlow: enabled }));
  }, []);

  const resetApplicationSession = useCallback(() => {
    applicationSessionStorage.clear();
    setState({ reviewSubmitted: false, advisorApplicantFlow: false });
  }, []);

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
