import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { withApplicantsApplying } from "../utils/applicantsApplying";
import { generateFormDataUpToPage } from "../dev/utils/generateFormData";
import type { PageId } from "../types";

const AUTOFILL_QUERY_PARAM = "autofill";

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
  let parsedValues: ApplicationFormValues = {};

  if (storedValues) {
    try {
      parsedValues = JSON.parse(storedValues) as ApplicationFormValues;
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      parsedValues = {};
    }
  }

  // Some links (e.g. the Information Architecture "Pages" table) need to
  // switch the active client to reach a gated page, which requires a full
  // reload. They pass ?autofill=<pageId> so that, once the app has booted
  // with the right client active, dummy data can be generated here — after
  // getActiveClient() reflects the new client, but before the first render.
  const autofillPageId = new URLSearchParams(window.location.search).get(
    AUTOFILL_QUERY_PARAM,
  ) as PageId | null;

  if (autofillPageId) {
    parsedValues = {
      ...parsedValues,
      ...generateFormDataUpToPage(autofillPageId),
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsedValues));

    const url = new URL(window.location.href);
    url.searchParams.delete(AUTOFILL_QUERY_PARAM);
    window.history.replaceState({}, "", url.toString());
  }

  return Object.keys(parsedValues).length > 0
    ? (withApplicantsApplying(parsedValues) as ApplicationFormValues)
    : parsedValues;
}

export function ApplicationFormProvider({
  children,
}: ApplicationFormProviderProps) {
  const [values, setValues] = useState<ApplicationFormValues>(loadStoredValues);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  function setPageValues(pageValues: ApplicationFormValues) {
    setValues(
      (currentValues) =>
        withApplicantsApplying({
          ...currentValues,
          ...pageValues,
        }) as ApplicationFormValues,
    );
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
