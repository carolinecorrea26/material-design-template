import definitions from '../../requirements/global/recovery.json';
import { requirementText } from '../domain/requirementContent';
import { recoveryIncident, type RecoveryCode, type RecoveryIncident } from '../domain/recoveryIncident';

export type RecoveryAction = 'home' | 'resume' | 'start-new' | 'retry' | 'payment';
export type ApplicationErrorStatus = 404 | 500 | 'session-expired' | 'technical-error' | 'maintenance' | 'application-unavailable' | 'outcome-unknown';
export type RecoveryIcon = 'not-found' | 'error' | 'expired' | 'maintenance' | 'unavailable' | 'pending' | 'complete';
type RecoveryDefinition = { title: string; message: string; guidance: string; actions: readonly RecoveryAction[]; placement: 'field' | 'alert' | 'page' | 'status'; severity: 'error' | 'warning' | 'info' | 'success'; icon: RecoveryIcon };
type AuthoredRecoveryState = keyof typeof definitions.states;
export type RecoveryState = Exclude<AuthoredRecoveryState, '404' | '500'> | 404 | 500;
type AuthoredDefinition = Omit<RecoveryDefinition, 'title' | 'message' | 'guidance'> & { content: { title: string; message: string; guidance: string } };

/** Global fresh-start presentation shared by Library, applicant and stories. */
export const applicationRecovery = Object.fromEntries(Object.entries(definitions.states).map(([key, raw]) => {
  const { content, ...definition } = raw as AuthoredDefinition;
  return [key, { ...definition, title: requirementText(content.title), message: requirementText(content.message), guidance: requirementText(content.guidance) }];
})) as Record<RecoveryState, RecoveryDefinition>;
const codeStates = definitions.codeStates as Record<RecoveryCode, RecoveryState>;
export const recoveryActions = definitions.actions;

/** Presentation only: stable local codes select copy. Exception text never determines a state. */
export function recoveryPresentation(value: RecoveryIncident) {
  const incident = recoveryIncident(value);
  const financialOperation = incident.operation === 'payment' || incident.operation === 'submission';
  const technicalFailure = ['TECHNICAL_ERROR', 'PAGE_LOAD_FAILED', 'OPERATION_TIMED_OUT', 'OUTCOME_UNKNOWN'].includes(incident.code);
  const financialOutcomeUnknown = financialOperation && technicalFailure && ['unknown', 'pending'].includes(incident.outcome);
  const financialFailure = financialOperation && technicalFailure && ['failed', 'not-started'].includes(incident.outcome);
  if (financialFailure) return {
    ...applicationRecovery['technical-error'], incident, state: 'technical-error' as const,
    message: requirementText(`recovery.${incident.operation}.failed`),
    guidance: requirementText(`recovery.${incident.operation}.guidance`),
    actions: ['payment'] as readonly RecoveryAction[],
  };
  const state: RecoveryState = financialOutcomeUnknown ? 'outcome-unknown' : incident.code === 'OUTCOME_UNKNOWN' ? 'processing-timeout' : codeStates[incident.code];
  const definition = applicationRecovery[state];
  const message = state === 'outcome-unknown' && financialOperation
    ? requirementText("recovery.operation.unknown", { operation: incident.operation })
    : state === 'technical-error' && incident.operation === 'page' ? requirementText('recovery.page.failed') : definition.message;
  return { incident, state, ...definition, message };
}
