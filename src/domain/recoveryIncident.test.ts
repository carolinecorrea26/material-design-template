import { expect, it } from 'vitest';
import { recoveryIncident, supportReference } from './recoveryIncident';
import { applicationRecovery, recoveryPresentation } from '../content/applicationRecovery';

it('uses stable codes without exposing diagnostics or private payloads', () => {
  const incident = recoveryIncident({ code: 'unrecognized', operation: 'save', outcome: 'failed', message: 'SESSION_EXPIRED', answers: { email: 'private@example.invalid' }, token: 'private-token' });
  expect(incident).toEqual({ code: 'TECHNICAL_ERROR', operation: 'save', outcome: 'failed' });
  expect(recoveryPresentation(incident).state).toBe('technical-error');
  expect(JSON.stringify(recoveryPresentation(incident))).not.toContain('private');
});
it.each([
  ['PAGE_NOT_FOUND', 'page', 404], ['PAGE_LOAD_FAILED', 'page', 'technical-error'],
  ['VALIDATION_FAILED', 'field', 'validation'], ['OFFLINE', 'alert', 'offline'],
  ['TECHNICAL_ERROR', 'page', 'technical-error'], ['OPERATION_TIMED_OUT', 'page', 'technical-error'],
  ['OUTCOME_UNKNOWN', 'page', 'technical-error'],
  ['OPERATION_PENDING', 'status', 'processing-pending'], ['OPERATION_COMPLETE', 'status', 'processing-complete'],
] as const)('maps %s without introducing an operation-specific page', (code, placement, state) => {
  const result = recoveryPresentation({ code, operation: 'save', outcome: 'failed' });
  expect(result.placement).toBe(placement);
  expect(result.state).toBe(state);
});
it.each(['page', 'save', 'resume', 'rating', 'payment', 'submission'] as const)('uses identical generic technical-error content for %s', operation => {
  const result = recoveryPresentation({ code: 'TECHNICAL_ERROR', operation, outcome: 'unknown' });
  expect(result.family).toBe('error');
  expect(result.title).toBe(applicationRecovery['technical-error'].title);
  expect(result.message).toBe(applicationRecovery['technical-error'].message);
  expect(result.guidance).toBe(applicationRecovery['technical-error'].guidance);
  expect(result.actions).toEqual(applicationRecovery['technical-error'].actions);
});
it('carries only approved support references and never invents one', () => {
  expect(recoveryIncident({ code: 'TECHNICAL_ERROR', reference: 'req-7c2f91ab' }).reference).toBe('REQ-7C2F91AB');
  for (const unsafe of ['person@example.invalid', 'token=private', '123-45-6789', 'REQ-<script>']) expect(supportReference(unsafe)).toBeUndefined();
  expect(recoveryIncident({ code: 'TECHNICAL_ERROR' })).not.toHaveProperty('reference');
});
it('does not expose application identifiers in a pre-verification resume incident', () => {
  const result = recoveryPresentation({ code: 'TECHNICAL_ERROR', operation: 'resume', outcome: 'failed', applicationId: 'APP-12345678', confirmationId: 'CONF-87654321' });
  expect(result.incident).not.toHaveProperty('applicationId');
  expect(result.incident).not.toHaveProperty('confirmationId');
  expect(result.guidance).not.toContain('saved progress');
});
