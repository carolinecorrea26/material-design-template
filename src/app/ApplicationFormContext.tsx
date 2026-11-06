import { requirementAnswerKey } from "../domain/requirementFields";
import { FieldDefinitionsContext } from "../components/forms/FieldDefinitionsContext";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { activeCoverageCategoryRestriction } from "../config/client/coverageCategoryScope";
import { activeFeaturedProduct, activeCoverageProductRestriction, withCapturedCoverageEntryScope, restoreCoverageEntryScope } from "../config/client/coverageProductScope";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { withApplicantsApplying } from "../utils/applicantsApplying";
import { generateFormDataUpToPage } from "../dev/utils/generateFormData";
import type { PageId } from "../types";
import type { AssociationId } from "../data/model";
import { resolveSiteId } from "../data/activeSite";
import { resolveActiveAssociationFromApplication } from "../data/activeAssociation";
import { createApplicantSaveClient, forgetSavedApplication, readSavedApplication, rememberSavedApplication, type RecoveredApplication, type SavedApplication } from '../services/applicantSaveService';
import { Alert } from '@mui/material';
import { isApplicationSessionExpired, resetApplicationTimeout } from './applicationTimeout';
import { applicationRecovery } from '../content/applicationRecovery';

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
  activeAssociationId?: AssociationId | null;
  setActiveAssociationId?: (associationId: AssociationId | null) => void;
  saveApplication?: (values: ApplicationFormValues, validatedPage?: 'coverage' | 'review') => Promise<SavedApplication | null>;
  restoreApplication?: (application: RecoveredApplication) => void;
  requiresRevalidation?: boolean;
};

export const STORAGE_KEY = "applicationFormValues";
export const applicationStorageKey = (siteKey: string) => `${STORAGE_KEY}:${siteKey}`;

// Exported (not just the hook) so Storybook stories for consumers like
// ProgressStep can supply fixed demo values without going through the real
// provider's sessionStorage-backed persistence.
export const ApplicationFormContext =
  createContext<ApplicationFormContextValue | null>(null);

type ApplicationFormProviderProps = {
  children: ReactNode;
};

export function normalizeChildValues<T extends Record<string, unknown>>(values: T): T {
  if (!Array.isArray(values.children)) return values;
  const keys: Record<string, string> = {
    firstName: requirementAnswerKey("first-name", "child"), lastName: requirementAnswerKey("last-name", "child"), birthDate: requirementAnswerKey("birth-date", "child"),
    gender: requirementAnswerKey("gender", "child"), fullTimeStudent: requirementAnswerKey("full-time-student", "child"),
    honorablyDischargedServiceMember: requirementAnswerKey("honorably-discharged-service-member", "child"),
  };
  return { ...values, children: values.children.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const child = { ...(item as Record<string, unknown>) };
    for (const [oldKey, newKey] of Object.entries(keys)) {
      if (Object.hasOwn(child, oldKey)) {
        if (!Object.hasOwn(child, newKey)) child[newKey] = child[oldKey];
        delete child[oldKey];
      }
    }
    return child;
  }) } as T;
}

function loadStoredValues(): ApplicationFormValues {
  const storageKey = applicationStorageKey(resolveSiteId());
  // Historical unscoped values cannot safely be assigned to a household or Site.
  const storedValues = window.sessionStorage.getItem(storageKey);
  let parsedValues: ApplicationFormValues = {};

  if (storedValues) {
    try {
      parsedValues = JSON.parse(storedValues) as ApplicationFormValues;
    } catch {
      window.sessionStorage.removeItem(storageKey);
      parsedValues = {};
    }
  }

  const entryParams = new URLSearchParams(window.location.search), siteKey = resolveSiteId();
  if (entryParams.has("category") || entryParams.has("prods")) {
    activeFeaturedProduct(siteKey); activeCoverageCategoryRestriction(siteKey); activeCoverageProductRestriction(siteKey);
  } else {
    restoreCoverageEntryScope(siteKey, parsedValues.coverageEntryScope);
    if (entryParams.has("featured_prod")) activeFeaturedProduct(siteKey);
  }
  parsedValues = withCapturedCoverageEntryScope(siteKey, normalizeChildValues(parsedValues));

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
    window.sessionStorage.setItem(storageKey, JSON.stringify(parsedValues));

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
  const [siteKey] = useState(resolveSiteId);
  const saveClient = useMemo(() => createApplicantSaveClient(siteKey), [siteKey]);
  const [savedApplication, setSavedApplication] = useState(() => readSavedApplication(siteKey));
  const [saveError, setSaveError] = useState('');
  const [initialValues] = useState<ApplicationFormValues>(loadStoredValues);
  const [values, setValues] = useState<ApplicationFormValues>(initialValues);
  const [activeAssociationId, setActiveAssociationId] = useState<AssociationId | null>(
    () =>
      resolveActiveAssociationFromApplication(resolveSiteId(), initialValues)
        .association?.id ?? null,
  );

  useEffect(() => {
    try { window.sessionStorage.setItem(applicationStorageKey(siteKey), JSON.stringify(values)); }
    catch { setSaveError('Application changes could not be cached in this browser.'); }
    if (!values.email || isApplicationSessionExpired(siteKey)) return;
    let current = true;
    void saveClient.save(values).then(application => {
      if (current && application) { setSavedApplication(application); setSaveError(''); }
    }).catch(() => { if (current) setSaveError(`${applicationRecovery['save-failed'].message} ${applicationRecovery['save-failed'].guidance}`); });
    return () => { current = false; };
  }, [values, siteKey, saveClient]);

  const setPageValues = useCallback((pageValues: ApplicationFormValues) => {
    if (Object.hasOwn(pageValues, "membership")) {
      setActiveAssociationId(
        resolveActiveAssociationFromApplication(resolveSiteId(), pageValues)
          .association?.id ?? null,
      );
    }
    setValues(
      (currentValues) =>
        withApplicantsApplying(withCapturedCoverageEntryScope(siteKey, {
          ...currentValues,
          ...pageValues,
        })) as ApplicationFormValues,
    );
  }, [siteKey]);

  const resetValues = useCallback(() => {
    saveClient.cancelPending();
    resetApplicationTimeout(siteKey);
    setValues(withCapturedCoverageEntryScope(siteKey, {}));
    setActiveAssociationId(
      resolveActiveAssociationFromApplication(resolveSiteId()).association?.id ?? null,
    );
    window.sessionStorage.removeItem(applicationStorageKey(siteKey));
    forgetSavedApplication(siteKey);
    setSavedApplication(null);
    setSaveError('');
  }, [siteKey, saveClient]);

  const contextValue = useMemo<ApplicationFormContextValue>(
    () => ({
      values,
      setPageValues,
      resetValues,
      activeAssociationId,
      setActiveAssociationId,
      requiresRevalidation: savedApplication?.requiresRevalidation ?? false,
      saveApplication: async (nextValues, validatedPage) => {
        try {
          const saved = await saveClient.save(nextValues, validatedPage);
          if (saved) setSavedApplication(saved);
          setSaveError('');
          return saved;
        } catch (error) {
          setSaveError('Progress could not be saved. Retry before continuing.');
          throw error;
        }
      },
      restoreApplication: application => {
        if (application.siteKey !== siteKey) throw new Error('Cannot restore an application from another Site');
        resetApplicationTimeout(siteKey);
        saveClient.cancelPending();
        rememberSavedApplication(application);
        setSavedApplication(application);
        restoreCoverageEntryScope(siteKey, application.values.coverageEntryScope);
        const restored = withApplicantsApplying(withCapturedCoverageEntryScope(siteKey, normalizeChildValues(application.values))) as ApplicationFormValues;
        setValues(restored);
        setActiveAssociationId(resolveActiveAssociationFromApplication(siteKey, restored).association?.id ?? null);
        setSaveError('');
      },
    }),
    [activeAssociationId, values, savedApplication, saveClient, siteKey, resetValues, setPageValues],
  );

  return (
    <ApplicationFormContext.Provider value={contextValue}>
      <FieldDefinitionsContext value={getPrototypeLibrary()?.fields}>
      {saveError && <Alert severity="error">{saveError}</Alert>}
      {children}
    </FieldDefinitionsContext>
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
