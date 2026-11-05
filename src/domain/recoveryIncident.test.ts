import { expect, it } from 'vitest';
import { recoveryIncident, supportReference } from './recoveryIncident';
import { recoveryPresentation } from '../content/applicationRecovery';

it('uses stable codes and never classifies by diagnostic text', () => {
  const incident = recoveryIncident({ code: 'unrecognized', operation: 'save', outcome: 'failed', message: 'SESSION_EXPIRED', answers: { email: 'private@example.invalid' }, token: 'private-token' });
  expect(incident).toEqual({ code: 'TECHNICAL_ERROR', operation: 'save', outcome: 'failed' });
  expect(recoveryPresentation(incident).state).toBe('technical-error');
  expect(JSON.stringify(recoveryPresentation(incident))).not.toContain('private');
});
it.each([
  ['VALIDATION_FAILED', 'field', 'validation'], ['OFFLINE', 'alert', 'offline'], ['SAVE_FAILED', 'alert', 'save-failed'],
  ['SAVE_CONFLICT', 'alert', 'save-conflict'], ['APPLICATION_UNAVAILABLE', 'page', 'application-unavailable'],
  ['OPERATION_PENDING', 'status', 'processing-pending'], ['OPERATION_COMPLETE', 'status', 'processing-complete'],
] as const)('maps %s to its approved presentation', (code, placement, state) => {
  const result = recoveryPresentation({ code, operation: 'save', outcome: code === 'OPERATION_COMPLETE' ? 'succeeded' : 'failed' });
  expect(result.placement).toBe(placement);
  expect(result.state).toBe(state);
});
it.each(['payment', 'submission'] as const)('never offers repeat or start-new actions for an unconfirmed %s', operation => {
  const result = recoveryPresentation({ code: 'TECHNICAL_ERROR', operation, outcome: 'unknown', reference: 'REQ-7C2F91AB' });
  expect(result.state).toBe('outcome-unknown');
  expect(result.title).toBe('We ran into an issue');
  expect(result.icon).toBe('error');
  expect(result.actions).toEqual([]);
  expect(result.message).toContain(operation);
  expect(result.incident.reference).toBe('REQ-7C2F91AB');
});

it.each(['payment', 'submission'] as const)('returns to Payment only after a confirmed unsuccessful %s', operation => {
  const result = recoveryPresentation({ code: 'TECHNICAL_ERROR', operation, outcome: 'failed' });
  expect(result.title).toBe('We ran into an issue');
  expect(result.placement).toBe('page');
  expect(result.actions).toEqual(['payment']);
  expect(result.message).toContain(operation === 'payment' ? 'payment' : 'submit');
});

it('keeps validation and pending processing out of technical failure pages', () => {
  expect(recoveryPresentation({ code: 'VALIDATION_FAILED', operation: 'payment', outcome: 'unknown' }).placement).toBe('field');
  expect(recoveryPresentation({ code: 'OPERATION_PENDING', operation: 'submission', outcome: 'pending' }).placement).toBe('status');
});

it('uses the shared recovery page for navigation failures', () => {
  const result = recoveryPresentation({ code: 'PAGE_LOAD_FAILED', operation: 'page', outcome: 'failed' });
  expect(result.state).toBe('technical-error');
  expect(result.title).toBe('We ran into an issue');
  expect(result.message).toBe('We couldn’t load the next page of your application.');
  expect(result.actions).toEqual(['resume', 'start-new']);
});
it('only carries an explicitly supplied opaque reference and never invents one', () => {
  expect(recoveryIncident({ code: 'TECHNICAL_ERROR', reference: 'req-7c2f91ab' }).reference).toBe('REQ-7C2F91AB');
  for (const unsafe of ['person@example.invalid', 'token=private', '123-45-6789', 'REQ-<script>', 'REQ-medical-answer']) expect(supportReference(unsafe)).toBeUndefined();
  expect(recoveryIncident({ code: 'TECHNICAL_ERROR' })).not.toHaveProperty('reference');
});

it('carries application and confirmation identifiers while discarding unsafe payloads', () => {
  expect(recoveryIncident({ code: 'APPLICATION_UNAVAILABLE', applicationId: 'APP-12345678', confirmationId: 'CONF-87654321', token: 'private-token' })).toEqual({ code: 'APPLICATION_UNAVAILABLE', operation: 'page', outcome: 'unknown', applicationId: 'APP-12345678', confirmationId: 'CONF-87654321' });
  const unsafe = recoveryIncident({ applicationId: 'APP-123?token=private-token', confirmationId: 'person@example.invalid' });
  expect(unsafe).not.toHaveProperty('applicationId');
  expect(unsafe).not.toHaveProperty('confirmationId');
});
