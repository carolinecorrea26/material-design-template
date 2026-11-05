import { applicationSupportId, type ApplicationSupportIds } from './applicationSupportReference';

/** Local presentation contract for prototype scenarios. Service integration is deferred to the rules review. */
export const recoveryCodes = ['PAGE_NOT_FOUND', 'PAGE_LOAD_FAILED', 'SESSION_EXPIRED', 'TECHNICAL_ERROR', 'MAINTENANCE', 'VALIDATION_FAILED', 'OFFLINE', 'SAVE_FAILED', 'SAVE_CONFLICT', 'APPLICATION_UNAVAILABLE', 'OPERATION_PENDING', 'OPERATION_TIMED_OUT', 'OUTCOME_UNKNOWN', 'OPERATION_COMPLETE'] as const;
export const recoveryOperations = ['page', 'save', 'resume', 'rating', 'signature', 'decision', 'payment', 'submission'] as const;
export const recoveryOutcomes = ['not-started', 'pending', 'failed', 'succeeded', 'unknown'] as const;
export type RecoveryCode = typeof recoveryCodes[number];
export type RecoveryOperation = typeof recoveryOperations[number];
export type RecoveryOutcome = typeof recoveryOutcomes[number];
export type RecoveryIncident = ApplicationSupportIds & { code: RecoveryCode; operation: RecoveryOperation; outcome: RecoveryOutcome; reference?: string };

/** Only a deliberately narrow, opaque reference format enters support copy/links. Never accept free-form diagnostics. */
export function supportReference(value: unknown): string | undefined {
  return typeof value === 'string' && /^(?:REQ|REF|SUP)-[A-F0-9]{8,32}$/i.test(value) ? value.toUpperCase() : undefined;
}

/** Whitelist public incident fields. Discard messages, answers, tokens and all other payload properties. */
export function recoveryIncident(value: unknown): RecoveryIncident {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const code = recoveryCodes.find(code => code === input.code) ?? 'TECHNICAL_ERROR';
  const operation = recoveryOperations.find(operation => operation === input.operation) ?? 'page';
  const outcome = recoveryOutcomes.find(outcome => outcome === input.outcome) ?? 'unknown';
  const reference = supportReference(input.reference);
  const applicationId = applicationSupportId(input.applicationId);
  const confirmationId = applicationSupportId(input.confirmationId);
  return { code, operation, outcome, ...(reference ? { reference } : {}), ...(applicationId ? { applicationId } : {}), ...(confirmationId ? { confirmationId } : {}) };
}

export const defaultTechnicalIncident: RecoveryIncident = { code: 'TECHNICAL_ERROR', operation: 'page', outcome: 'failed' };
