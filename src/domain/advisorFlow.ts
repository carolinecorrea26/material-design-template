import advisorPage from '../../requirements/parked/advisor-login.json';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';

/** Retain only the confirmed advisor identity fields from the global page definition. */
export function advisorEntryValues(values: Record<string, unknown>, mode: 'new' | 'saved' = 'new'): ApplicationFormValues {
  const keys = advisorPage.layout.sections['advisor-login-new'].fields;
  return { ...Object.fromEntries(keys.flatMap(key => typeof values[key] === 'string' ? [[key, values[key]]] : [])),
    'advisor-flow-type': mode,
    ...(mode === 'saved' && typeof values['applicant-email'] === 'string' ? { 'applicant-email': values['applicant-email'] } : {}),
  } as ApplicationFormValues;
}
export function advisorRecipient(values: Record<string, unknown>) {
  return typeof values['advisor-email'] === 'string' && values['advisor-email'].trim() ? values['advisor-email'].trim() : '';
}
