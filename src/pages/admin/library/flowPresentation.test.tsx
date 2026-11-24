import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { projectLibraryCatalog } from '../../../services/libraryCatalogService';
import { storedFlowRows } from './storedFlows';
import { flowComponentExample } from './flowPresentation';
import StoredFlowsLibrary from './StoredFlowsLibrary';

const catalog = projectLibraryCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
vi.mock('./LibraryCatalogContext', () => ({ useLibraryCatalog: () => catalog }));
it('selects the existing component and advisor-edit variant from Components records', () => {
  const flow = storedFlowRows(catalog, 'asce').find(row => row.definition.id === 'advisor')!.definition;
  const edit = flow.nodes.find(node => node.id === 'advisor-edit-dialog')!;
  expect(flowComponentExample(edit, catalog.data.components)?.example?.storyId).toBe('overlays-sendapplicationdialog--to-advisor');
  const membership = flow.nodes.find(node => node.pageId === 'membership')!;
  expect(flowComponentExample(membership, catalog.data.components)?.example?.pageKey).toBe('membership');
  for (const page of catalog.data.pages.filter(page => page.definition.groupId === 'health')) {
    expect(flowComponentExample({ ...membership, pageId: page.key }, catalog.data.components)?.example?.pageKey).toBe(page.key);
  }
});
it('shows one row per step, lazy component previews and readable email links without mapped requirements', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/?site=asce&flow=advisor&view=steps']}><StoredFlowsLibrary siteKey="asce" /></MemoryRouter>));
    expect(host.textContent).not.toContain('Mapped requirements');
    const rows = host.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(25);
    const labels = [...rows].map(row => row.children[1]?.textContent);
    expect(new Set(labels).size).toBe(labels.length);
    expect(host.querySelector('iframe')).toBeNull();
    const details = host.querySelector<HTMLDetailsElement>('details')!;
    await act(async () => { details.open = true; details.dispatchEvent(new Event('toggle')); });
    expect(host.querySelector('iframe')?.getAttribute('src')).toContain('iframe.html?id=');
    const email = host.querySelector('a[href*="/library/emails"]')!;
    expect(email.textContent).not.toContain('advisor-');
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});

it('keeps Advisor recovery, corrections and reminders outside the main application stages', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/?site=asce&flow=advisor']}><StoredFlowsLibrary siteKey="asce" /></MemoryRouter>));
    const stages = host.querySelector('[aria-label="Application stages"]')!;
    expect([...stages.querySelectorAll('h6')].map(heading => heading.textContent)).toEqual(['Advisor entry', 'Getting started', 'Choose your coverage', 'Your application details', 'Send to applicant for review', 'Applicant access', 'Review your application', 'E-sign and submit', 'Receipt']);
    const related = host.querySelector('[aria-label="Related processes"]')!;
    expect([...related.querySelectorAll('button')].map(button => button.textContent)).toEqual(['Advisor access', 'Request edit', 'Reminders and deletion']);
    expect(stages.textContent).not.toContain('Reminders and deletion');
    expect(stages.textContent).toContain('Advisor → Applicant');
    expect(host.querySelector('iframe')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});

it.each(['all', 'asce'])('renders shared TPA topology with linked effective settings (%s)', async site => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={[`/?site=${site}&flow=tpaVerification&view=steps`]}><StoredFlowsLibrary siteKey={site} /></MemoryRouter>));
    expect(host.textContent).toContain('Effective TPA mode');
    expect(host.textContent).toContain('Address required first?');
    expect(host.textContent).not.toContain('ASCE lookup uses');
    expect(host.querySelector(`a[href="/admin-center/library/configurations?site=${site}&q=tpaIntegration.lookupFields&table=configurationDefinitions"]`)).not.toBeNull();
    expect(host.textContent).toContain(site === 'asce' ? 'coverage-verification' : 'none');
    if (site === 'asce') { expect(host.textContent).toContain('member-id'); expect(host.textContent).toContain('state-province'); }
    expect(host.querySelector('iframe')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});
