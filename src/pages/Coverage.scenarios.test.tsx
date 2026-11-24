import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Coverage from './Coverage';
import CoveragePageExample, { coveragePageScenarios, type CoveragePageScenario } from '../../.storybook/coveragePageExample';
import { ApplicationSessionProvider } from '../app/ApplicationSessionContext';
import type { SharedCatalog } from '../persistence/sharedCatalog';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { coverageLinkUnavailableMessage } from '../content/interactionLabels';
import { requirementText } from '../domain/requirementContent';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as SharedCatalog;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
  vi.useFakeTimers();
  window.history.replaceState(null, '', '/');
  window.sessionStorage.clear();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
async function render(scenario: CoveragePageScenario) {
  await act(async () => root.render(<MemoryRouter initialEntries={['/coverage']}><ApplicationSessionProvider><CoveragePageExample catalog={catalog} scenario={scenario}><Coverage /></CoveragePageExample></ApplicationSessionProvider></MemoryRouter>));
}
async function click(label: string, scope: ParentNode = container) {
  const button = [...scope.querySelectorAll('button')].find(button => button.textContent?.trim() === label);
  expect(button, `Missing ${label}; page: ${container.textContent}`).toBeDefined();
  await act(async () => button!.click());
}
async function settle(ms = 1600) { await act(async () => vi.advanceTimersByTimeAsync(ms)); }

it.each(['applyForAdditional', 'applyForTotal'] as const)('uses the configured %s message without changing the selected benefit', async increaseNote => {
  await render({ ...coveragePageScenarios.dependentOnly, coverage: { increaseNote } });
  await settle();
  expect(container.textContent).toContain(requirementText(increaseNote === 'applyForTotal' ? 'coverage.increase.total-note' : 'coverage.increase.additional-note'));
  const amount = container.querySelector<HTMLInputElement>('input[name="li-term:spouse-amount"]');
  expect(amount?.value).toBe('$100,000');
});

it('renders the empty entry notice and restores the previous entry scope on unmount', async () => {
  window.sessionStorage.setItem('coverage-category-scope:ama', 'LI');
  await render(coveragePageScenarios.emptyEntry);
  expect(container.textContent).toContain(coverageLinkUnavailableMessage);
  await act(async () => root.unmount());
  expect(window.sessionStorage.getItem('coverage-category-scope:ama')).toBe('LI');
  expect(getPrototypeLibrary()).toBeNull();
  root = createRoot(container);
});
it('removes unavailable saved selections without removing the permitted product', async () => {
  await render(coveragePageScenarios.restrictedEntry);
  expect(container.textContent).toContain('Some previously selected coverage is not available through this link');
  await click('Remove unavailable selections');
  expect(container.textContent).not.toContain('Some previously selected coverage is not available through this link');
  await settle();
  expect(container.querySelectorAll('input[type="checkbox"]:checked').length).toBeGreaterThan(0);
});
it('runs whole-page validation before allowing navigation', async () => {
  await render(coveragePageScenarios.interactive);
  await click('Next'); await settle();
  expect(container.textContent).not.toContain('Coverage completed.');
  expect(container.textContent).toContain('Please select at least one coverage to continue.');
  expect(container.querySelector('#coverage-form')).not.toBeNull();
});
it('opens the dependent-only confirmation through Next, cancels and then continues', async () => {
  await render(coveragePageScenarios.dependentOnly);
  await settle();
  await click('Next'); await settle();
  expect(document.querySelector('[role="alertdialog"]')?.textContent, document.body.textContent ?? '').toContain('To apply for dependent coverage, the member must be insured with this group coverage.');
  await click('Cancel', document); await settle(300);
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  expect(container.textContent).not.toContain('Coverage completed.');
  await click('Next'); await settle();
  await click('Continue', document); await settle(10000);
  expect(container.textContent).toContain('Coverage completed.');
});
it('opens the saved reference rates from the complete page', async () => {
  await render(coveragePageScenarios.referenceRates);
  await click('See my coverage options'); await settle();
  await click('View rate table');
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(document.body.textContent).toContain('Reference rates. Your actual premium');
});
it('uses projected question participation when switching from AD&D to Disability', async () => {
  await render(coveragePageScenarios.interactive);
  async function selectCategory(id: 'AD' | 'DI') {
    const input = container.querySelector<HTMLInputElement>(`input[name="coverage-categories"][value="${id}"]`);
    expect(input, `Missing category ${id}`).not.toBeNull();
    await act(async () => input!.click());
  }
  await selectCategory('AD'); await settle();
  expect([...container.querySelectorAll('button')].some(button => button.textContent?.includes('See my coverage options'))).toBe(false);
  expect(container.textContent).toContain('Add coverage');
  await selectCategory('DI'); await settle();
  expect([...container.querySelectorAll('button')].some(button => button.textContent?.includes('See my coverage options'))).toBe(true);
  expect(container.querySelector('[name="hours-worked-per-week"]')).not.toBeNull();
});
it('preselects base coverage after reveal and preserves the applicant’s subsequent removal', async () => {
  await render(coveragePageScenarios.preselected);
  await click('See my coverage options'); await settle();
  const selected = [...container.querySelectorAll<HTMLInputElement>('input[name$="-selected"]')].filter(input => input.checked);
  expect(selected).toHaveLength(5);
  const first = selected[0], name = first.name;
  await act(async () => first.click()); await settle();
  expect(container.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.checked).toBe(false);
  expect([...container.querySelectorAll<HTMLInputElement>('input[name$="-selected"]')].filter(input => input.checked)).toHaveLength(4);
});
it('continues a child-only application supported by verified existing member Life', async () => {
  await render(coveragePageScenarios.existingDependent); await settle();
  await click('Next'); await settle();
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
  await click('Continue', document); await settle(10000);
  expect(container.textContent).toContain('Coverage completed.');
});
it.each([false, true])('preserves the confirmed $10,000 Term Life minimum with and without verified coverage: verified=%s', async verified => {
    await render(verified ? coveragePageScenarios.verifiedExistingMember : coveragePageScenarios.interactive);
    const category = container.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]')!;
    await act(async () => category.click());
    await click('See my coverage options'); await settle();
    const amount = container.querySelector<HTMLInputElement>('input[name="li-term:member-amount"]');
    expect(amount?.value, container.textContent ?? '').toBe('$10,000');
});
