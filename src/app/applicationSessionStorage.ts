import { resolveSiteId } from '../data/activeSite';
import { readSavedApplication } from '../services/applicantSaveService';
import { applicationLifecycle, applicationStateChanged } from '../domain/applicationLifecycle.mjs';

export type ApplicationSessionState = { reviewSubmitted: boolean; advisorApplicantFlow: boolean };
type Scope = { siteKey: string; applicationId?: string };
const currentScope = (): Scope => {
  const siteKey = resolveSiteId();
  return { siteKey, applicationId: readSavedApplication(siteKey)?.applicationId };
};
const key = (scope: Scope) => `applicationSession:${JSON.stringify([scope.siteKey, scope.applicationId ?? 'draft'])}`;
export const emptyApplicationSession = (): ApplicationSessionState => ({ reviewSubmitted: false, advisorApplicantFlow: false });
function local(scope: Scope): ApplicationSessionState {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(scope)) ?? 'null');
    return { reviewSubmitted: value?.reviewSubmitted === true, advisorApplicantFlow: value?.advisorApplicantFlow === true };
  } catch { return emptyApplicationSession(); }
}
function write(patch: Partial<ApplicationSessionState>, scope: Scope) {
  sessionStorage.setItem(key(scope), JSON.stringify({ ...local(scope), ...patch }));
  window.dispatchEvent(new Event(applicationStateChanged));
}

/** Transient progress belongs to one Site/application. Saved workflow state
 * remains authoritative for signing locks and the recovered actor. Unscoped
 * historical flags cannot safely be assigned to an application. */
export const applicationSessionStorage = {
  read(scope = currentScope()): ApplicationSessionState {
    const state = local(scope), saved = readSavedApplication(scope.siteKey);
    if (!saved?.workflowStage || saved.applicationId !== scope.applicationId) return state;
    const lifecycle = applicationLifecycle(saved.workflowStage, saved.advisorFlow);
    return { reviewSubmitted: lifecycle.reviewSubmitted || state.reviewSubmitted, advisorApplicantFlow: lifecycle.advisorApplicantFlow };
  },
  writeReviewSubmitted(enabled: boolean, scope = currentScope()) { write({ reviewSubmitted: enabled }, scope); },
  writeAdvisorApplicantFlow(enabled: boolean, scope = currentScope()) { write({ advisorApplicantFlow: enabled }, scope); },
  clear(scope = currentScope()) {
    sessionStorage.removeItem(key(scope));
    window.dispatchEvent(new Event(applicationStateChanged));
  },
  subscribe(listener: () => void) {
    window.addEventListener(applicationStateChanged, listener);
    window.addEventListener('storage', listener);
    return () => { window.removeEventListener(applicationStateChanged, listener); window.removeEventListener('storage', listener); };
  },
};

/** The same session contract with state local to one preview owner. */
export type ApplicationSessionStore = {
  read: () => ApplicationSessionState;
  writeReviewSubmitted: (enabled: boolean) => void;
  writeAdvisorApplicantFlow: (enabled: boolean) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
  resetTimeout?: () => void;
};
export function createMemoryApplicationSessionStore(): ApplicationSessionStore {
  let state = emptyApplicationSession();
  const listeners = new Set<() => void>();
  const update = (patch: Partial<ApplicationSessionState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };
  return {
    read: () => state,
    writeReviewSubmitted: reviewSubmitted => update({ reviewSubmitted }),
    writeAdvisorApplicantFlow: advisorApplicantFlow => update({ advisorApplicantFlow }),
    clear: () => update(emptyApplicationSession()),
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
