import { NotAMember as StandaloneNotAMember } from '../../components/membership/MembershipStatus.stories';
import membershipCopy from '../../../requirements/global/content/membership.json';
import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { StandardMembership, MemberConfirmed, NotAMember, NewOrCurrentMembership, CategoryMembership, AssociationSelection } from '../../components/membership/MembershipPage.stories';
import { MemberId } from '../../components/membership/AdditionalMembershipInformation.stories';
import { Default as MemberInformation } from '../../components/membership/MemberInformation.stories';

vi.mock('../../persistence/sharedCatalog', async original => {
  const source = await original<typeof import('../../persistence/sharedCatalog')>();
  return { ...source, readSharedCatalog: async () => catalog };
});
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const originalCatalog = JSON.stringify(catalog);
afterEach(() => vi.unstubAllGlobals());
it.each([
  ['Unanswered', StandardMembership, false, false],
  ['Confirmed', MemberConfirmed, true, true],
  ['Not a member', NotAMember, false, false],
  ['New/current', NewOrCurrentMembership, true, false],
  ['Category', CategoryMembership, true, false],
  ['Association', AssociationSelection, false, false],
] as const)('renders Membership %s from configured composition and outcomes', async (name, story, hasContact, hasId) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: name, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    expect(!!container.querySelector('[name="first-name"]')).toBe(hasContact);
    expect(!!container.querySelector('[name="phone"]')).toBe(hasContact);
    if (hasContact) expect(container.querySelector<HTMLInputElement>('input[name="phone-type"]')?.value).toBe('mobile');
    expect(!!container.querySelector('[name="member-id"]')).toBe(hasId);
    expect(container.querySelector('input[name="title"]')).toBeNull();
    if (name === 'Not a member') expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    if (name === 'New/current') {
      expect(container.querySelector('input[name="membership"][value="new"]')).not.toBeNull();
      expect(container.querySelector('input[name="membership"][value="current"]')).not.toBeNull();
    }
    if (name === 'Category') expect(container.textContent).toContain('Professional member');
    if (name === 'Association') {
      expect(container.querySelector('input[role="combobox"]')?.getAttribute('placeholder')).toBe('Search or select association');
      await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Open"]')!.click());
      await act(async () => document.querySelector<HTMLElement>('[role="option"]')!.click());
      expect(container.querySelector('[name="first-name"]')).not.toBeNull();
      expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    }
    expect(JSON.stringify(catalog)).toBe(originalCatalog);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
it.each([['Membership status', StandaloneNotAMember, 'membership', 'first-name'], ['Member information', MemberInformation, 'first-name', 'member-id'], ['Additional information', MemberId, 'member-id', 'first-name']] as const)('uses compiled component field placement for standalone %s', async (name, story, included, excluded) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary(), container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as () => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render()}</MemoryRouter>));
    expect(container.querySelector(`[name="${included}"]`)).not.toBeNull();
    if (name === 'Membership status') expect(container.textContent).toContain(membershipCopy['membership.not-member.heading']);
    expect(container.querySelector(`[name="${excluded}"]`)).toBeNull();
    expect(getPrototypeLibrary()).toBe(previous);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
