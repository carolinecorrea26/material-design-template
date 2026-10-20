// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { builderRelease } from './builder-release.mjs';
function fixture(actor) {
  const drafts = { library: { id: 'library', siteKey: 'test-site', version: 1, payload: { data: {} } } };
  const state = { builderDrafts: { build: { id: 'build', siteKey: 'test-site', ownerId: 'alice', libraryDraftId: 'library' } }, launchQueue: { launch: { id: 'launch', siteKey: 'test-site', status: 'Scheduled' } } };
  return { state, call: (path, body) => builderRelease({ path, body, state, actor, drafts, commit: fn => fn(), clock: Date.now }) };
}
describe('builder ownership', () => {
  it('allows viewing other builds but refuses edits, claiming, and release changes', async () => {
    const { call } = fixture('bob');
    expect((await call('/builder/drafts', {}))[0]).toMatchObject({ ownerId: 'alice', canEdit: false });
    for (const [path, body] of [
      ['/builder/draft/update', { id: 'build', patch: { deletedAt: 'now' } }],
      ['/builder/draft/create', { libraryDraftId: 'library', siteKey: 'test-site' }],
      ['/builder/review', { id: 'library' }],
      ['/builder/cancel', { queueId: 'launch' }],
      ['/builder/rollback', { siteKey: 'test-site' }],
    ]) await expect(call(path, body)).rejects.toMatchObject({ status: 403 });
  });
  it('preserves ownership when the owner resumes or archives', async () => {
    const { call } = fixture('alice');
    expect((await call('/builder/drafts', {}))[0].canEdit).toBe(true);
    expect(await call('/builder/draft/update', { id: 'build', patch: { deletedAt: 'now' } })).toMatchObject({ ownerId: 'alice', deletedAt: 'now' });
    expect(await call('/builder/draft/create', { libraryDraftId: 'library', siteKey: 'test-site' })).toMatchObject({ id: 'build', ownerId: 'alice' });
  });
});
