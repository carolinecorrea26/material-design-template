import type { FieldDefinition } from '../../domain/fields';

export function membershipOutcome(field: FieldDefinition | undefined, value: unknown) {
  return field?.options?.find(option => option.value === value)?.outcome;
}

/** The confirmed inline exception applies only to the yes/no attestation. */
export function isMembershipAttestationStop(field: FieldDefinition | undefined, value: unknown) {
  return field?.configuration === 'yes-no' && membershipOutcome(field, value) === 'not-eligible';
}
