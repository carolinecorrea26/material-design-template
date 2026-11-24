import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import Payment from './Payment';
import { paymentDefaultSections } from '../config/fields/paymentFields';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { mockRequest } from '../mock/client';
const continueNavigation = vi.fn();
vi.mock('../mock/client', () => ({ mockRequest: vi.fn() }));
vi.mock('../components/forms/FieldRenderer', () => ({ default: () => null }));
vi.mock('../app/usePrototypeRates', () => ({ usePrototypeRates: () => ({ premium: () => NaN, display: () => ({ status: 'needs-information' }) }) }));
vi.mock('../app/RoutePage', () => ({ default: ({ children, onBeforeNext }: { children: (props: unknown) => unknown; onBeforeNext?: (props: unknown) => unknown }) => <>
  <button onClick={() => { if (!onBeforeNext || onBeforeNext({ values: {}, continueNavigation }) !== false) continueNavigation(); }}>Test Next</button>
  {children({ watchedValues: {}, errors: {}, control: undefined, setValue: () => {}, pageSections: paymentDefaultSections })}
</> }));
it.each(['true', 'false'])('does not add payment authorization/submission to normal Next when mock platform=%s', async enabled => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', enabled); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.clearAllMocks();
  window.history.replaceState(null, '', '/payment?site=asce');
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'payment-collection-only'));
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<MemoryRouter><Payment /></MemoryRouter>));
    expect(host.textContent).not.toMatch(/Authorize payment|Try declined payment/);
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === 'Test Next')!.click());
    expect(mockRequest).not.toHaveBeenCalled(); expect(continueNavigation).toHaveBeenCalledOnce();
  } finally { await act(async () => root.unmount()); host.remove(); installPrototypeLibrary(null); vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
});
