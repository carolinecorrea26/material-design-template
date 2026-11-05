import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import DynamicList from './DynamicList';
import CoverageNeedsCalculator from '../../app/sections/ConfiguredCoverageNeedsCalculator';
import { createReviewedMigrationDatabase } from '../../migration/fixtures';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { getFieldSurface } from '../../config/fields/storedSurfaces';
import type { FieldSurfaceDefinition } from '../../migration/fieldSurfaceDefaults';
import type { DatabaseSchema } from '../../persistence/types';

let baseline: DatabaseSchema;
beforeAll(() => { baseline = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it('renders and edits health rows from saved bindings and enforces authored limits', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const data = structuredClone(baseline);
  const definitions = data.configurationValues.find(row => row.configurationKey === 'field-surfaces')!.value as unknown as Record<string, FieldSurfaceDefinition>;
  definitions.healthSiDetails.maxItems = 1;
  definitions.healthSiDetails.fields = definitions.healthSiDetails.fields.slice(1, 2);
  definitions.healthSiDetails.fields[0].valueKey = 'history';
  data.fields.find(row => row.key === 'health-si-detail-conditionsDetails')!.definition.label = 'Saved medical history';
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  let readValues: (() => unknown) | undefined;
  function Form() {
    const { control, getValues } = useForm({ defaultValues: { details: [{ history: 'Existing saved details', retainedHiddenDetail: 'Preserved' }] } });
    useEffect(() => { readValues = getValues; }, [getValues]);
    const surface = getFieldSurface('healthSiDetails');
    return <DynamicList control={control as never} name="details" label={surface.label} maxItems={surface.maxItems} mapping={surface.mapping} renderItem={item => item.history} />;
  }
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<Form />));
    expect(container.textContent).toContain('Existing saved details');
    expect(container.textContent).not.toContain('Add details');
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Edit')!.click());
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Saved medical history');
    expect(dialog.querySelector('textarea')?.value).toBe('Existing saved details');
    expect(dialog.querySelectorAll('textarea').length).toBe(2); // visible MUI input and sizing mirror
    await act(async () => [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Save')!.click());
    expect(readValues!()).toEqual({ details: [{ history: 'Existing saved details', retainedHiddenDetail: 'Preserved' }] });
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('renders calculator input membership and order from stored data', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const data = structuredClone(baseline);
  const definitions = data.configurationValues.find(row => row.configurationKey === 'field-surfaces')!.value as unknown as Record<string, FieldSurfaceDefinition>;
  definitions.needsCalculator.fields = [definitions.needsCalculator.fields[2], definitions.needsCalculator.fields[0]];
  data.fields.find(row => row.key === 'needs-outstanding-debts')!.definition.label = 'Saved debts';
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<CoverageNeedsCalculator />));
    expect([...container.querySelectorAll('label')].map(label => label.textContent)).toEqual(['Saved debts', 'Annual household income']);
    expect(container.querySelectorAll('input')).toHaveLength(2);
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('uses authored verification method and question labels through the real dialog flow', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const data = structuredClone(baseline);
  data.fields.find(row => row.key === 'verification-method')!.definition.label = 'Saved verification methods';
  data.fields.find(row => row.key === 'sq-1')!.definition.label = 'Saved security question';
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  const { default: MemberVerification } = await import('../verification/MemberVerification');
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<MemberVerification open onClose={() => undefined} />));
    let dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Saved verification methods');
    await act(async () => (dialog.querySelector('input[value="security-questions"]') as HTMLInputElement).click());
    await act(async () => [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Next')!.click());
    dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Saved security question');
    expect(dialog.querySelectorAll('input[type="radio"]')).toHaveLength(15);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
