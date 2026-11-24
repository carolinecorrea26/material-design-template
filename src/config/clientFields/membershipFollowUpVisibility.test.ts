import { describe, expect, it } from 'vitest';
import { evaluateCondition } from '../conditions/evaluateConditions';
import { resolveAssociationMembershipField } from './getClientPageFields';
import { resolveMappedFields, defaultRequirementFieldSource } from '../../domain/requirementFields';
import type { ConditionDefinition } from '../../domain/rules';
import type { Site, Association, ActiveAssociationResolution } from '../../data';
import { isMembershipAttestationStop } from './membershipFollowUpVisibility';

const condition: ConditionDefinition = { id: 'condition-followup-test', match: 'all', conditions: [{ fieldId: 'membership', operator: 'outcome', value: ['member', 'new-member'] }] };
const configured = (configuration: string, options?: unknown) => {
  const source = structuredClone(defaultRequirementFieldSource());
  source.sites.synthetic = { fields: { membership: { configuration, ...(options ? { options } : {}) } } };
  return resolveMappedFields({ component: 'membership' }, { siteId: 'synthetic', page: 'membership', source });
};

describe('Membership follow-up visibility', () => {
  it('uses authored outcomes for yes/no and new/current configurations', () => {
    for (const [configuration, accepted, rejected] of [['yes-no', ['yes'], ['no', '', 'new']], ['new-or-current', ['new', 'current'], ['yes', 'no', '']]] as const) {
      const fields = configured(configuration);
      for (const membership of accepted) expect(evaluateCondition(condition, { membership }, fields)).toBe(true);
      for (const membership of rejected) expect(evaluateCondition(condition, { membership }, fields)).toBe(false);
    }
  });
  it('supports Site-defined saved values without guessing eligibility from their spelling', () => {
    const fields = configured('category', [
      { value: 'engineer', label: 'Professional member', outcome: 'member' },
      { value: 'joining', label: 'Joining', outcome: 'new-member' },
      { value: 'yes', label: 'Not eligible', outcome: 'not-eligible' },
    ]);
    for (const membership of ['engineer', 'joining']) expect(evaluateCondition(condition, { membership }, fields)).toBe(true);
    for (const membership of ['yes', 'unassigned']) expect(evaluateCondition(condition, { membership }, fields)).toBe(false);
    expect(() => configured('category', [{ value: 'engineer', label: 'Member' }])).toThrow('Missing site option outcome');
    const field = fields.find(field => field.id === 'membership')!;
    expect(isMembershipAttestationStop(field, 'yes')).toBe(false);
    expect(isMembershipAttestationStop(configured('yes-no').find(field => field.id === 'membership'), 'no')).toBe(true);
  });
  it('accepts only enabled association options', () => {
    const field = configured('yes-no').find(field => field.id === 'membership')!;
    field.configurations!.association.label = 'Choose your association';
    field.configurations!.association.placeholder = 'Find association';
    const association = { id: 'example', name: 'Example Association' } as Association;
    const resolved = resolveAssociationMembershipField(field, { associationSelection: { mode: 'select' } } as Site, [association], { status: 'resolved', association } as ActiveAssociationResolution);
    expect(evaluateCondition(condition, { membership: 'example' }, [resolved])).toBe(true);
    expect(evaluateCondition(condition, { membership: 'unassigned' }, [resolved])).toBe(false);
    expect(resolved).toMatchObject({ configuration: 'association', label: 'Choose your association', placeholder: 'Find association', optionSource: 'site-associations' });
  });
  it('uses projected yes/no options and shared association wording for a resolved URL association', () => {
    const field = configured('association').find(field => field.id === 'membership')!;
    field.label = 'Effective Site association label';
    field.configurations!['yes-no'].options![0].label = 'Confirmed';
    const association = { id: 'example', name: 'Example Association' } as Association;
    expect(resolveAssociationMembershipField(field, { associationSelection: { mode: 'select' } } as Site, [association], { status: 'resolved', association } as ActiveAssociationResolution).label).toBe('Effective Site association label');
    const resolved = resolveAssociationMembershipField(field, { associationSelection: { mode: 'url-parameter' } } as Site, [association], { status: 'resolved', association } as ActiveAssociationResolution);
    expect(resolved).toMatchObject({ configuration: 'yes-no', inputType: 'radio', label: 'Are you a member of Example Association?' });
    expect(resolved.options?.[0]).toMatchObject({ value: 'yes', label: 'Confirmed', outcome: 'member' });
    expect(resolved.optionSource).toBeUndefined();
  });
});
