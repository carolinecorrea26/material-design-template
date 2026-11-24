import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { Empty, WithoutPhysicianInformation, FinancialThreshold, BelowFinancialThreshold, DisabilityRecords, SpouseOnlyDisability } from '../../components/profile/ProfilePage.stories';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it.each([
  ['Default effective policy', Empty, false],
  ['Physician section hidden', WithoutPhysicianInformation, false],
  ['Synthetic threshold reached', FinancialThreshold, true],
  ['Synthetic threshold not reached', BelowFinancialThreshold, false],
  ['Spouse-only DI', SpouseOnlyDisability, false],
  ['Configured disability record', DisabilityRecords, false],
] as const)('renders Profile %s from the real page and cleans up its fixture', async (name, story, financial) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/profile']}><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: name, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    expect(container.querySelector('input[name="total-net-worth"]') !== null).toBe(financial);
    expect(container.textContent).toContain('Other coverage');
    expect(container.textContent?.includes('Physician information')).toBe(story !== WithoutPhysicianInformation);
    if (story === SpouseOnlyDisability) {
      expect(container.querySelector('input[name="height-feet"]')).toBeNull();
      expect(container.querySelector('input[name="spouse-height-feet"]')).not.toBeNull();
    }
    if (story === DisabilityRecords) expect(container.textContent).toContain('Example Carrier');
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
