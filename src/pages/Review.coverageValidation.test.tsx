import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import Review from './Review';
const values = vi.hoisted(() => ({ membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'NY', dependents: [], coverageSelections: ['li-10yr', 'li-20yr'], productApplicants: { 'li-10yr': ['member'], 'li-20yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 1500000, 'li-20yr:member': 1500000 } }));
vi.mock('../app/RoutePage', () => ({ default: ({ validate }: { validate: (values: Record<string, unknown>) => string | undefined }) => <output>{validate(values)}</output> }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, setAdvisorApplicantFlow: () => {} }) }));
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it('rejects an over-limit restored portfolio at the actual Review page boundary', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'review-portfolio-validation'));
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
    expect(host.textContent).toContain('$2,000,000');
  } finally { await act(async () => root.unmount()); host.remove(); }
});
