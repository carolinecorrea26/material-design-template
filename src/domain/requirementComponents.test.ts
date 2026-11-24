import { expect, it } from 'vitest';
import { compileRequirementComponents, requirementComponentDefinitions, validateRequirementComponentParts } from './requirementComponents.mjs';

it('reconstructs all global canonical owners without old catalog records and preserves owned parts', () => {
  const definitions = requirementComponentDefinitions();
  const rows = compileRequirementComponents([], definitions);
  expect(rows).toHaveLength(definitions.length);
  const handoff = rows.find(row => row.definition.name === 'PrototypeHandoffPage')!;
  expect(handoff.definition).toMatchObject({ source: 'src/components/feedback/PrototypeHandoffPage.tsx', role: 'shared-piece', storybookPath: '?path=/story/feedback-prototype-handoff--multiple-screens' });
  expect(rows.find(row => row.definition.name === 'SectionDivider')?.definition.parts).toContainEqual(expect.objectContaining({ name: 'FieldGroup', kind: 'export' }));
  expect(rows.some(row => row.definition.name === 'FieldGroup')).toBe(false);
  const sourceBefore = JSON.stringify(definitions);
  rows.find(row => row.definition.name === 'SectionDivider')!.definition.parts[0].description = 'Edited projected value';
  expect(JSON.stringify(definitions)).toBe(sourceBefore);
});

it('replaces stale metadata, removes undeclared records and carries only generated usage annotations forward', () => {
  const definitions = structuredClone(requirementComponentDefinitions());
  const rows = compileRequirementComponents([], definitions);
  const header = rows.find(row => row.definition.name === 'PageHeader')!;
  header.definition.description = 'Stale description';
  header.position = 999;
  header.definition.parts = [];
  header.definition.usages = [{ source: 'src/app/RoutePage.tsx', label: 'Page title' }];
  rows.push({ ...header, key: 'component-esign-instructions', definition: { ...header.definition, name: 'ESignInstructions' } });
  definitions.find(row => row.name === 'PageHeader')!.description = 'Current global description';
  const projected = compileRequirementComponents(rows, definitions);
  expect(projected.find(row => row.definition.name === 'PageHeader')?.definition).toMatchObject({ description: 'Current global description', usages: header.definition.usages });
  expect(projected.some(row => row.key === 'component-esign-instructions')).toBe(false);
  expect(projected.find(row => row.definition.name === 'PageHeader')?.position).toBe(definitions.findIndex(row => row.name === 'PageHeader'));
  expect(new Set(projected.map(row => row.position)).size).toBe(projected.length);
});

it('requires explicit part ownership and rejects unknown parts or pretending a part is an owner', () => {
  expect(() => validateRequirementComponentParts([{ type: 'FieldGroup', partOf: 'SectionDivider' }])).not.toThrow();
  expect(() => validateRequirementComponentParts([{ type: 'SectionNote', partOf: 'EligibilitySections' }])).not.toThrow();
  expect(() => validateRequirementComponentParts([{ type: 'FieldGroup' }])).toThrow('Unknown fresh-start component owner');
  expect(() => validateRequirementComponentParts([{ type: 'SectionNote', partOf: 'SectionDivider' }])).toThrow('Invalid fresh-start component part');
});

it('rejects incomplete registrations, unknown dependencies, invalid parts and composition cycles', () => {
  for (const edit of [
    (rows: ReturnType<typeof requirementComponentDefinitions>) => { rows[0].registration.storyId = ''; },
    (rows: ReturnType<typeof requirementComponentDefinitions>) => { rows[0].contains = ['MissingOwner']; },
    (rows: ReturnType<typeof requirementComponentDefinitions>) => { rows[0].contains = [rows[0].name]; },
    (rows: ReturnType<typeof requirementComponentDefinitions>) => { rows[0].parts = [{ name: '', kind: 'slot', sourceSymbol: 'children', description: 'Invalid' }]; },
  ]) {
    const definitions = structuredClone(requirementComponentDefinitions()); edit(definitions);
    expect(() => compileRequirementComponents([], definitions)).toThrow();
  }
});
