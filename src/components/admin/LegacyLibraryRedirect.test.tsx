import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import Cms from '../../pages/Cms';
import SiteDetails from '../../pages/SiteDetails';
import SiteFeatures from '../../pages/SiteFeatures';
function Destination() { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; }
it.each([
  ['/portal-admin/cms', Cms, '/admin-center/library/content?site=all'],
  ['/portal-admin/cms?site=asce', Cms, '/admin-center/library/content?site=asce'],
  ['/portal-admin/cms?client=asce', Cms, '/admin-center/library/content?site=asce'],
  ['/site-details?site=asce#flows-subsection', SiteDetails, '/admin-center/library/flows?site=asce'],
  ['/site-details?site=asce#fields-subsection', SiteDetails, '/admin-center/library/fields?site=asce'],
  ['/site-details?site=asce&scope=global', SiteDetails, '/admin-center/library/pages?site=all'],
  ['/portal-admin/site-features?site=asce', SiteFeatures, '/admin-center/library/configurations?site=asce'],
] as const)('opens the canonical Library from %s', async (url, Page, expected) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    const path = url.split(/[?#]/)[0];
    await act(async () => root.render(<MemoryRouter initialEntries={[url]}><Routes><Route path={path} element={<Page />} /><Route path='/admin-center/library/:domain' element={<Destination />} /></Routes></MemoryRouter>));
    expect(host.querySelector('output')?.textContent).toBe(expected);
    expect(host.querySelector('table')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});
