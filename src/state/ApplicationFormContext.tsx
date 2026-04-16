import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ApplicationFormValues = Record<
  string,
  | string
  | boolean
  | string[]
  | number
  | Record<string, number>
  | Record<string, boolean>
  | Record<string, string>
  | Record<string, unknown[]>
>;

type ApplicationFormContextValue = {
  values: ApplicationFormValues;
  setPageValues: (pageValues: ApplicationFormValues) => void;
  resetValues: () => void;
};

export const STORAGE_KEY = "applicationFormValues";

const ApplicationFormContext =
  createContext<ApplicationFormContextValue | null>(null);

type ApplicationFormProviderProps = {
  children: ReactNode;
};

function loadStoredValues(): ApplicationFormValues {
  const storedValues = window.sessionStorage.getItem(STORAGE_KEY);

  if (!storedValues) {
    return {};
  }

  try {
    return JSON.parse(storedValues) as ApplicationFormValues;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function ApplicationFormProvider({
  children,
}: ApplicationFormProviderProps) {
  const [values, setValues] = useState<ApplicationFormValues>(loadStoredValues);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  function setPageValues(pageValues: ApplicationFormValues) {
    setValues((currentValues) => ({
      ...currentValues,
      ...pageValues,
    }));
  }

  function resetValues() {
    setValues({});
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  const contextValue = useMemo<ApplicationFormContextValue>(
    () => ({
      values,
      setPageValues,
      resetValues,
    }),
    [values],
  );

  return (
    <ApplicationFormContext.Provider value={contextValue}>
      {children}
    </ApplicationFormContext.Provider>
  );
}

export function useApplicationForm() {
  const context = useContext(ApplicationFormContext);

  if (!context) {
    throw new Error(
      "useApplicationForm must be used within an ApplicationFormProvider",
    );
  }

  return context;
}
