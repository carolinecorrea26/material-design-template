import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm, type FieldValues } from 'react-hook-form';
import { expect, it, vi } from 'vitest';
import HealthQuestion from './HealthQuestion';
import { detailField, questionField } from '../../../.storybook/healthQuestionExample';

it('restores a mapped record and preserves its explicit limit and supplied summary', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  function Example({ maxItems }: { maxItems: number }) {
    const form = useForm<FieldValues>({ defaultValues: { answer: 'yes', records: [{ savedText: 'Restored condition' }] } });
    return <HealthQuestion control={form.control} errors={form.formState.errors} item={{
      question: questionField('answer'), fields: [detailField('condition')], repeated: true,
      collection: 'records', showDetails: true, maxItems, detailsLabel: 'Condition records',
      mapping: { fields: [detailField('condition')], fieldToKey: { condition: 'savedText' } },
      renderItem: row => <span>Saved: {row.savedText}</span>,
    }} />;
  }
  const add = () => [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Add'));
  try {
    await act(async () => root.render(<Example maxItems={1} />));
    expect(container.textContent).toContain('Saved: Restored condition');
    expect(add()).toBeUndefined();
    await act(async () => root.render(<Example maxItems={2} />));
    expect(add()).toBeDefined();
    const edit = [...container.querySelectorAll('button')].find(button => /edit/i.test(button.textContent ?? '') || /edit/i.test(button.getAttribute('aria-label') ?? ''))!;
    await act(async () => edit.click());
    expect(document.querySelector<HTMLInputElement>('input[name="condition"], textarea[name="condition"]')?.value).toBe('Restored condition');
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
