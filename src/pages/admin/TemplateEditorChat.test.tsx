import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import TemplateEditorChat from './TemplateEditorChat';

beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => vi.unstubAllGlobals());

const assigned = { assigned: null, effective: 'Your preferred contact' };
const data = {
  sites: [{ key: 'asce', name: 'ASCE' }, { key: 'ama', name: 'AMA' }],
  values: {
    continue: { global: { assigned: 'Continue', effective: 'Continue' } },
    'contact-title': { global: assigned, asce: assigned, ama: assigned },
    'beneficiary-dialog': { global: { assigned: 'Add Beneficiary', effective: 'Add Beneficiary' } },
  },
};

const click = (node: HTMLElement, label: string) => act(async () => {
  [...node.querySelectorAll('button')].find(button => button.textContent === label)!.click();
});

const type = (node: HTMLElement, value: string) => act(async () => {
  const input = node.querySelector('input[type="text"]')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

it('confirms Site selection and wording before saving a multi-Site draft', async () => {
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  const onSave = vi.fn().mockResolvedValue(true);
  try {
    await act(async () => root.render(<TemplateEditorChat data={data} busy={false} onSave={onSave} />));
    await click(node, 'Contact page title');
    await click(node, 'Selected Sites');
    await click(node, 'Confirm Sites');
    expect(node.textContent).toContain('Which Sites should get this change?');
    for (const checkbox of node.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
      await act(async () => checkbox.click());
    }
    await click(node, 'Confirm Sites');
    await type(node, 'How should we reach you?');
    await click(node, 'Confirm wording');
    await type(node, 'Make the question clearer');
    await click(node, 'Review edit');
    expect(node.textContent).toContain('ASCE, AMA');
    expect(node.textContent).toContain('How should we reach you?');
    expect(onSave).not.toHaveBeenCalled();
    await click(node, 'Save to draft');
    expect(onSave).toHaveBeenCalledExactlyOnceWith([
      { property: 'contact-title', site: 'asce', value: 'How should we reach you?' },
      { property: 'contact-title', site: 'ama', value: 'How should we reach you?' },
    ], 'Make the question clearer');
    expect(node.textContent).toContain('Saved.');
  } finally {
    await act(async () => root.unmount());
    node.remove();
  }
});

it('uses the open draft reason for a global-only edit and preserves a failed save for retry', async () => {
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  const onSave = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
  try {
    await act(async () => root.render(<TemplateEditorChat data={data} busy={false} draftReason="Copy review" onSave={onSave} />));
    await click(node, 'Continue label');
    expect(node.textContent).toContain('Global template · Continue');
    expect(node.textContent).not.toContain('Selected Sites');
    await type(node, 'Continue application');
    await click(node, 'Confirm wording');
    await click(node, 'Save to draft');
    expect(node.textContent).toContain('Ready to save this change to the draft?');
    await click(node, 'Save to draft');
    expect(onSave).toHaveBeenLastCalledWith([{ property: 'continue', site: null, value: 'Continue application' }], 'Copy review');
    expect(node.textContent).toContain('Saved.');
  } finally {
    await act(async () => root.unmount());
    node.remove();
  }
});
