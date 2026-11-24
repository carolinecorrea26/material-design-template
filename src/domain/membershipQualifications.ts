import fieldDetails from '../../requirements/parked/field-details.json';
import { requirementText } from './requirementContent';
import type { FieldOption } from './fields';

/** Reusable qualification definitions. A Site opts into the shared field and
 * condition through stored placements; these choices are not a global default. */
export const waepaQualifications = fieldDetails.fields.find(field => field.id === 'waepa-attestation')!.options as FieldOption[];

export const associateQualificationValues = waepaQualifications.filter(option => option.value.endsWith("-associate")).map(option => option.value);

export function associatedMemberNotice(qualification: unknown, associationName = "WAEPA"): string | undefined {
  if (qualification === "spouse-associate") return requirementText('membership.associate-notices.spouse', { associationName });
  if (qualification === "child-associate") return requirementText('membership.associate-notices.child', { associationName });
  if (qualification === "parent-associate" || qualification === "sibling-associate") return requirementText('membership.associate-notices.other', { associationName });
  return undefined;
}
