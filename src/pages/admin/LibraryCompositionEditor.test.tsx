import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { createReviewedMigrationDatabase } from '../../migration/fixtures';
import { LocalStorageAdapter } from '../../persistence/localAdapter';
import { createPortalDataRepository } from '../../repositories/portalDataRepository';
import { validateSharedCatalog } from '../../persistence/sharedCatalog';
import { createLibraryDraft, editDraftPageRequirement, editDraftParticipation, sitePageRequirementOptions, type LibraryDraft } from '../../domain/libraryDraft';
import LibraryCompositionEditor from './LibraryCompositionEditor';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
const draft = (): LibraryDraft => ({ formatVersion: 1, siteKey: 'asce', baseRevision: `local:v1:sha256:${'0'.repeat(64)}`, editVersion: 0, data: structuredClone(catalog.data) });
afterEach(() => vi.unstubAllGlobals());

it('offers only declared Beneficiary and Payment page controls', () => {
  const html = renderToStaticMarkup(<LibraryCompositionEditor draft={draft()} update={() => {}} />);
  expect(html).toContain('Page list and order are global.');
  expect(html).toContain('Beneficiary');
  expect(html).toContain('Payment');
  expect(html).not.toContain('Membership');
  expect(html).not.toContain('Health TELE');
});

it('enforces the same page permissions at the draft mutation boundary and supports optional mode', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const original = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(createReviewedMigrationDatabase())).open(), 'asce');
  for (const page of ['membership', 'contact', 'health-qd', 'resume']) {
    expect(sitePageRequirementOptions(page)).toEqual([]);
    expect(() => editDraftParticipation(original, 'page', page, false)).toThrow('Page participation is global');
  }
  for (const page of ['beneficiary', 'payment']) {
    expect(sitePageRequirementOptions(page)).toEqual(['none', 'optional', 'required']);
    const edited = editDraftPageRequirement(original, page, 'optional');
    expect(edited.data.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === page)?.requirement).toBe('optional');
    expect(edited.editVersion).toBe(original.editVersion + 1);
  }
  expect(original.data.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'payment')?.requirement).toBe('required');
});
