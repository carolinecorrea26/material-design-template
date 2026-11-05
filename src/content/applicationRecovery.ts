import { recoveryIncident, type RecoveryCode, type RecoveryIncident } from '../domain/recoveryIncident';

export type RecoveryAction = 'home' | 'resume' | 'start-new' | 'retry' | 'payment';
export type ApplicationErrorStatus = 404 | 500 | 'session-expired' | 'technical-error' | 'maintenance' | 'application-unavailable' | 'outcome-unknown';
export type RecoveryIcon = 'not-found' | 'error' | 'expired' | 'maintenance' | 'unavailable' | 'pending' | 'complete';
type RecoveryDefinition = { title: string; message: string; guidance: string; actions: readonly RecoveryAction[]; placement: 'field' | 'alert' | 'page' | 'status'; severity: 'error' | 'warning' | 'info' | 'success'; icon: RecoveryIcon };
const technicalRecoveryHeading = 'We ran into an issue';

/** Approved presentation copy and actions; local fixtures exercise this contract without service calls. */
export const applicationRecovery = {
  404: { title: 'Page not found', message: 'The page you’re looking for may have moved or is no longer available.', guidance: 'Check the address, return to the home page, or resume an application in progress.', actions: ['home', 'resume'], placement: 'page', severity: 'error', icon: 'not-found' },
  500: { title: 'Something went wrong', message: 'We’re unable to load this page right now.', guidance: 'Resume your application to continue from your last saved progress.', actions: ['resume', 'start-new'], placement: 'page', severity: 'error', icon: 'error' },
  'session-expired': { title: 'Your session has timed out', message: 'Your session has expired due to inactivity.', guidance: 'Resume from your last saved progress or start a new application. Your most recent unsaved changes may not be available.', actions: ['resume', 'start-new'], placement: 'page', severity: 'error', icon: 'expired' },
  'technical-error': { title: technicalRecoveryHeading, message: 'There was a technical error.', guidance: 'Resume your application to continue from your last saved progress.', actions: ['resume', 'start-new'], placement: 'page', severity: 'error', icon: 'error' },
  maintenance: { title: 'We’ll be back soon', message: 'This site is temporarily unavailable while we perform maintenance.', guidance: 'Please try again later. If you have an application in progress, resume it when the site is available.', actions: [], placement: 'page', severity: 'info', icon: 'maintenance' },
  'application-unavailable': { title: 'Application unavailable', message: 'We ran into a technical issue when trying to resume your application.', guidance: 'Please try again or contact the administrator for help.', actions: ['resume', 'start-new'], placement: 'page', severity: 'error', icon: 'unavailable' },
  'outcome-unknown': { title: technicalRecoveryHeading, message: 'The result of this payment or submission has not been confirmed.', guidance: 'Please don’t submit it again or start a new application. Contact the administrator for help confirming the result.', actions: [], placement: 'page', severity: 'warning', icon: 'error' },
  validation: { title: 'Check your answers', message: 'Please correct the errors below before continuing.', guidance: '', actions: [], placement: 'field', severity: 'error', icon: 'error' },
  offline: { title: 'You’re offline', message: 'Any changes you make may not be saved.', guidance: 'Check your internet connection.', actions: [], placement: 'alert', severity: 'warning', icon: 'error' },
  'save-failed': { title: 'Progress could not be saved', message: 'We couldn’t save your latest changes.', guidance: 'Keep your answers on this page and try saving again before continuing.', actions: ['retry'], placement: 'alert', severity: 'error', icon: 'error' },
  'save-conflict': { title: 'A newer version is available', message: 'A newer version of this application has been saved.', guidance: 'Keep this page open and contact the administrator before replacing either version.', actions: [], placement: 'alert', severity: 'warning', icon: 'error' },
  'processing-pending': { title: 'Working on your application', message: 'Please wait while this step completes.', guidance: '', actions: [], placement: 'status', severity: 'info', icon: 'pending' },
  'processing-timeout': { title: 'This step is taking longer than expected', message: 'We couldn’t confirm that this step completed.', guidance: 'Your form has not been cleared. Resume your application or contact the administrator for help.', actions: ['resume'], placement: 'alert', severity: 'warning', icon: 'pending' },
  'processing-complete': { title: 'This step is complete', message: 'You can continue with your application.', guidance: '', actions: [], placement: 'status', severity: 'success', icon: 'complete' },
} as const satisfies Record<string | number, RecoveryDefinition>;
export type RecoveryState = keyof typeof applicationRecovery;

const codeStates = {
  PAGE_NOT_FOUND: 404, PAGE_LOAD_FAILED: 'technical-error', SESSION_EXPIRED: 'session-expired', TECHNICAL_ERROR: 'technical-error', MAINTENANCE: 'maintenance',
  VALIDATION_FAILED: 'validation', OFFLINE: 'offline', SAVE_FAILED: 'save-failed', SAVE_CONFLICT: 'save-conflict', APPLICATION_UNAVAILABLE: 'application-unavailable',
  OPERATION_PENDING: 'processing-pending', OPERATION_TIMED_OUT: 'processing-timeout', OUTCOME_UNKNOWN: 'outcome-unknown', OPERATION_COMPLETE: 'processing-complete',
} as const satisfies Record<RecoveryCode, RecoveryState>;

/** Presentation only: stable local codes select copy. Exception text never determines a state. */
export function recoveryPresentation(value: RecoveryIncident) {
  const incident = recoveryIncident(value);
  const financialOperation = incident.operation === 'payment' || incident.operation === 'submission';
  const technicalFailure = ['TECHNICAL_ERROR', 'PAGE_LOAD_FAILED', 'OPERATION_TIMED_OUT', 'OUTCOME_UNKNOWN'].includes(incident.code);
  const financialOutcomeUnknown = financialOperation && technicalFailure && ['unknown', 'pending'].includes(incident.outcome);
  const financialFailure = financialOperation && technicalFailure && ['failed', 'not-started'].includes(incident.outcome);
  if (financialFailure) return {
    ...applicationRecovery['technical-error'], incident, state: 'technical-error' as const,
    message: incident.operation === 'payment' ? 'We couldn’t complete your payment.' : 'We couldn’t submit your application.',
    guidance: incident.operation === 'payment'
      ? 'Return to Payment and try again, or contact the administrator for help.'
      : 'Return to Payment and try submitting your application again, or contact the administrator for help.',
    actions: ['payment'] as readonly RecoveryAction[],
  };
  const state: RecoveryState = financialOutcomeUnknown ? 'outcome-unknown' : incident.code === 'OUTCOME_UNKNOWN' ? 'processing-timeout' : codeStates[incident.code];
  const definition = applicationRecovery[state];
  const message = state === 'outcome-unknown' && financialOperation
    ? `We can’t confirm the result of your ${incident.operation} yet.`
    : state === 'technical-error' && incident.operation === 'page' ? 'We couldn’t load the next page of your application.' : definition.message;
  return { incident, state, ...definition, message };
}
