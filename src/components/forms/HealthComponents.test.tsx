import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as activeClient from '../../config/client/getActiveClient';
import * as library from '../../domain/prototypeLibrary';
import { MemberAndSpouse, RestoredAnswers, SpouseOnly } from './HealthQuestionList.stories';
import { DirectDetails, RestoredRecord } from './HealthQuestion.stories';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([
  ['independent adults', MemberAndSpouse, 2], ['spouse only', SpouseOnly, 1], ['restored adults', RestoredAnswers, 2], ['direct details', DirectDetails, 1], ['restored record', RestoredRecord, 1],
] as const)('renders %s without Site or application state', async (_name, story, count) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(activeClient, 'getActiveClient').mockImplementation(() => { throw new Error('A standalone health component cannot read the active client'); });
  vi.spyOn(library, 'getPrototypeLibrary').mockImplementation(() => { throw new Error('A standalone health component cannot read the active Site'); });
  const installed = vi.spyOn(library, 'installPrototypeLibrary');
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render({}, {})}</MemoryRouter>));
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(count);
    const member = container.querySelector<HTMLInputElement>('input[name="health-example-member"][value="yes"]');
    if (member) {
      await act(async () => member.click());
      expect(container.querySelector<HTMLInputElement>('input[name="health-example-spouse"][value="yes"]')?.checked ?? false).toBe(false);
    }
    if (_name.startsWith('restored')) expect(container.textContent).toContain('Saved local treatment record');
    expect(installed).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); container.remove(); }
});
