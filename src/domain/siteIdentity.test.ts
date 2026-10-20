import { describe, expect, it } from 'vitest';
import { canonicalSiteKey, normalizeSiteReferences } from './siteIdentity.mjs';
import { siteEntities, getSite } from '../data';
import { getLibrarySelection } from '../pages/admin/library/LibrarySiteSelector';
import { resolveSiteId } from '../data/activeSite';

describe('main Site identity and old references', () => {
  it('uses client names for main sites and preserves distinct variants', () => {
    expect(siteEntities.map(row => row.id)).toEqual(expect.arrayContaining(['asce', 'waepa', 'waepa-gi', 'ama', 'abe', 'csea']));
    expect(siteEntities.some(row => row.id.endsWith('-default') || row.id === 'waepa-standard')).toBe(false);
    expect(canonicalSiteKey('waepa-standard')).toBe('waepa');
    expect(canonicalSiteKey('waepa-gi')).toBe('waepa-gi');
    expect(canonicalSiteKey('custom-client-default')).toBe('custom-client-default');
  });
  it('accepts legacy bookmarks and saved active site selections', () => {
    expect(getSite('asce-default')?.id).toBe('asce');
    expect(getLibrarySelection(new URLSearchParams('site=waepa-standard'))).toBe('waepa');
    sessionStorage.setItem('activeSiteId', 'asce-default');
    expect(resolveSiteId()).toBe('asce');
    sessionStorage.removeItem('activeSiteId');
  });
  it('normalizes relationship and draft references without mutating their source or revision evidence', () => {
    const old = { siteKey: 'asce-default', sites: [{ id: 'asce-default', key: 'asce-default' }], assignment: { key: 'draft.asce-default.membership.first-name', siteId: 'asce-default' }, heads: { 'waepa-standard': 'release-1' }, sourceReference: 'asce-default.original-source', revision: 'asce-default.original-revision', source: 'asce-default', recipient: 'asce-default.member@example.invalid', values: { 'first-name': 'asce-default' }, accounts: { 'asce-default': { username: 'asce-default' } } };
    const next = normalizeSiteReferences(old);
    expect(next.siteKey).toBe('asce');
    expect(next.sites).toEqual([{ id: 'asce', key: 'asce' }]);
    expect(next.assignment).toEqual({ key: 'draft.asce.membership.first-name', siteId: 'asce' });
    expect(next.heads).toEqual({ waepa: 'release-1' });
    expect(next.sourceReference).toBe(old.sourceReference);
    expect(next.revision).toBe(old.revision);
    expect(next.source).toBe(old.source);
    expect(next.recipient).toBe(old.recipient);
    expect(next.values).toEqual(old.values);
    expect(next.accounts).toEqual(old.accounts);
    expect(old.siteKey).toBe('asce-default');
    expect(normalizeSiteReferences(next)).toEqual(next);
  });
  it('refuses conflicting saved references instead of overwriting a release head', () => {
    expect(() => normalizeSiteReferences({ heads: { 'asce-default': 'release-1', asce: 'release-2' } })).toThrow('Conflicting old and current Site identities');
  });
});
