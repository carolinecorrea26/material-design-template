import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { resolveSiteId } from './activeSite';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { prototypeCatalogData, validateSharedCatalog } from '../persistence/sharedCatalog';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
const available = catalog.data.sites.filter(site => site.status === 'active' && !site.deletedAt).map(site => site.key);

beforeEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); window.history.replaceState(null, '', '/'); });
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); window.history.replaceState(null, '', '/'); });

it.each(['/', '/admin-center', '/admin-center/library?site=all'])('boots %s from an available catalog Site in a fresh browser', path => {
  window.history.replaceState(null, '', path);
  const siteKey = resolveSiteId(available);
  expect(siteKey).toBe(available[0]);
  expect(sessionStorage.getItem('activeSiteId')).toBe(siteKey);
  const library = resolvePrototypeLibrary(prototypeCatalogData(catalog), siteKey, 'test:startup');
  installPrototypeLibrary(library);
  expect(resolveSiteId()).toBe(siteKey);
  expect(library.site.siteKey).toBe(siteKey);
});

it('retains enrolled Site links and canonicalizes supported Site and client aliases', () => {
  for (const [query, expected] of [['site=ama-gi', 'ama-gi'], ['site=asce-default', 'asce'], ['client=waepagi', 'waepa-gi']]) {
    sessionStorage.clear();
    window.history.replaceState(null, '', `/?${query}`);
    expect(resolveSiteId(available)).toBe(expected);
    expect(sessionStorage.getItem('activeSiteId')).toBe(expected);
  }
});

it.each(['site=demo', 'site=abe', 'site=missing-site', 'client=csea'])('ignores unavailable entry %s and stale saved Site identities', query => {
  sessionStorage.setItem('activeSiteId', 'abe');
  sessionStorage.setItem('activeClientId', 'csea');
  window.history.replaceState(null, '', `/?${query}`);
  expect(resolveSiteId(available)).toBe(available[0]);
  expect(sessionStorage.getItem('activeSiteId')).toBe(available[0]);
});

it('retains an available saved Site and follows a different catalog without a real-Site allowlist', () => {
  sessionStorage.setItem('activeSiteId', 'asce-default');
  expect(resolveSiteId(available)).toBe('asce');
  expect(resolveSiteId(['synthetic-second', 'synthetic-first'])).toBe('synthetic-second');
  window.history.replaceState(null, '', '/?site=synthetic-first');
  expect(resolveSiteId(['synthetic-second', 'synthetic-first'])).toBe('synthetic-first');
});

it('does not substitute a parked Site when the catalog has no active Sites', () => {
  expect(() => resolveSiteId([])).toThrow('no active Sites');
  expect(sessionStorage.getItem('activeSiteId')).toBeNull();
});
