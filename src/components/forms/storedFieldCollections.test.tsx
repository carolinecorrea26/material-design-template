import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { beforeAll, expect, it, vi } from 'vitest';
import DynamicList from './DynamicList';
import { createReviewedMigrationDatabase } from '../../migration/fixtures';
import { resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import type { FieldCollectionDefinition } from '../../domain/fieldCollections';
import type { DatabaseSchema } from '../../persistence/types';

let baseline: DatabaseSchema;
beforeAll(() => { baseline = createReviewedMigrationDatabase(); }, 120000);
it('renders saved child labels and layout, restores bound values and enforces the stored item limit', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const data = structuredClone(baseline);
  data.fields.find(row => row.key === 'child-first-name')!.definition.label = 'Saved child given name';
  const policies = data.configurationValues.find(row => row.configurationKey === 'field-collections')!.value as unknown as Record<string, FieldCollectionDefinition>;
  policies.children.label = 'Dependent'; policies.children.maxItems = 1;
  policies.children.fields = policies.children.fields.slice(0, 2);
  const collection = resolvePrototypeLibrary(data, 'asce', 'test').fieldCollections.children;
  function Form() {
    const { control } = useForm({ defaultValues: { children: [{ 'child-first-name': 'Existing child', 'child-last-name': 'Example' }] } });
    return <DynamicList control={control as never} name={collection.name} label={collection.label} maxItems={collection.maxItems} mapping={collection.mapping} renderItem={item => item['child-first-name']} />;
  }
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<Form />));
    expect(container.textContent).toContain('Existing child');
    expect(container.textContent).not.toContain('Add Dependent');
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Edit')!.click());
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Edit Dependent');
    expect(dialog.textContent).toContain('First Name');
    expect(dialog.querySelectorAll('input').length).toBeGreaterThan(2);
    expect([...dialog.querySelectorAll<HTMLInputElement>('input')].slice(0, 2).map(input => input.value)).toEqual(['Existing child', 'Example']);
    expect(collection.mapping.gridFields).toEqual(['child-first-name', 'child-last-name']);
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
