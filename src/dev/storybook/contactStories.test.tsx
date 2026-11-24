import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import * as stories from '../../components/contact/ContactPage.stories';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it.each(Object.entries(stories).filter(([key]) => key !== 'default'))('renders Contact %s using real fresh-start products and configuration', async (name, story) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  const original = JSON.stringify(catalog);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = (story as typeof stories.Empty).render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/contact']}><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: name, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    const library = getPrototypeLibrary()!;
    expect(container.querySelector('[name="street-address"]')).not.toBeNull();
    expect(container.querySelector('[name="phone"]')).toBeNull();
    expect(container.querySelector('[name="spouse-phone"]') !== null).toBe(['MemberAndSpouse', 'DependentOnly', 'SpouseDisability'].includes(name));
    expect(container.querySelector('[name="business-name"]') !== null).toBe(['BusinessSameAsHome', 'ProductScopedBusinessInformation', 'SpouseDisability'].includes(name));
    expect(container.textContent?.includes('Where should we send correspondence')).toBe(!['ProductScopedBusinessInformation', 'BusinessInformationHidden'].includes(name));
    expect(container.querySelector('[name="spouse-business-name"]')).toBeNull();
    if (name === 'SpouseDisability') expect(container.querySelector('[name="business-name"]')).not.toBeNull();
    if (name === 'ProductScopedBusinessInformation') expect(library.client.applicantExperience?.contact?.businessAddressProducts).toEqual(['di-ltd']);
    if (name === 'BusinessInformationHidden') expect(container.querySelector('[name="business-street-address"]')).toBeNull();
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
