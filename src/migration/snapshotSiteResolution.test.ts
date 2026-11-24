import { expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from './fixtures';
import { resolveAuditSnapshotSite, withSnapshotSiteResolution } from './snapshotSiteResolution';

it('shares an immutable projection within one audit and re-resolves after the audit', () => {
  const data = createReviewedMigrationDatabase();
  const before = JSON.stringify(data);
  const site = withSnapshotSiteResolution(() => {
    const first = resolveAuditSnapshotSite(data, 'waepa');
    expect(resolveAuditSnapshotSite(data, 'waepa')).toBe(first);
    expect(Object.isFrozen(first.configuration.products[0])).toBe(true);
    return first;
  });
  expect(JSON.stringify(data)).toBe(before);
  expect(Object.isFrozen(data.fields[0].definition)).toBe(false);
  data.sites.find(row => row.key === 'waepa')!.name = 'Edited between audits';
  const next = withSnapshotSiteResolution(() => resolveAuditSnapshotSite(data, 'waepa'));
  expect(next).not.toBe(site);
  expect(next.name.value).toBe('Edited between audits');
  expect(site.name.value).not.toBe(next.name.value);
});
