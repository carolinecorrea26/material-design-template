import definitions from '../../requirements/global/recovery.json';
import { requirementText } from '../domain/requirementContent';
import { recoveryIncident, type RecoveryCode, type RecoveryIncident } from '../domain/recoveryIncident';

export type RecoveryAction = keyof typeof definitions.actions;
export type ApplicationErrorStatus = 400 | 404 | 500 | 'session-expired' | 'technical-error' | 'maintenance';
export type RecoveryIcon = 'not-found' | 'error' | 'expired' | 'maintenance' | 'pending' | 'complete';
type RecoveryDefinition = { title: string; message: string; guidance: string; actions: readonly RecoveryAction[]; family?: 'error' | 'maintenance' | 'expired'; placement: 'field' | 'alert' | 'page' | 'status'; severity: 'error' | 'warning' | 'info' | 'success'; icon: RecoveryIcon };
type AuthoredRecoveryState = keyof typeof definitions.states;
export type RecoveryState = Exclude<AuthoredRecoveryState, '400' | '404' | '500'> | 400 | 404 | 500;
type AuthoredDefinition = Omit<RecoveryDefinition, 'title' | 'message' | 'guidance'> & { content: { title: string; message: string; guidance: string } };

/** Global fresh-start presentation shared by Library, applicant and stories. */
export const applicationRecovery = Object.fromEntries(Object.entries(definitions.states).map(([key, raw]) => {
  const { content, ...definition } = raw as AuthoredDefinition;
  return [key, { ...definition, title: requirementText(content.title), message: requirementText(content.message), guidance: requirementText(content.guidance) }];
})) as Record<RecoveryState, RecoveryDefinition>;
const codeStates = definitions.codeStates as Record<RecoveryCode, RecoveryState>;
export const recoveryActions = definitions.actions;
export const recoveryTemplate = definitions.template;
export const recoveryFamilies = definitions.families;

/** Presentation only: stable local codes select copy. Exception text never determines a state. */
export function recoveryPresentation(value: RecoveryIncident) {
  const incident = recoveryIncident(value);
  if (incident.operation === 'resume') { delete incident.applicationId; delete incident.confirmationId; }
  const state = codeStates[incident.code];
  return { incident, state, ...applicationRecovery[state] };
}
