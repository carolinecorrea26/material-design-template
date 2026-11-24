// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('seeds local operations without validating historical migrations or rewriting the catalog', () => {
  const directory = mkdtempSync(join(tmpdir(), 'portal-operations-seed-'));
  const catalogBefore = readFileSync('public/catalog/portal.json', 'utf8');
  try {
    execFileSync('npm', ['run', 'mock:seed'], {
      env: { ...process.env, MOCK_OPERATIONS_SEED_DIR: directory },
      stdio: 'pipe', timeout: 30_000,
    });
    expect(readdirSync(directory)).toEqual(['operations-data.json']);
    const database = JSON.parse(readFileSync(join(directory, 'operations-data.json'), 'utf8'));
    for (const table of ['sites', 'applications', 'applicationParticipants', 'applicationEvents', 'changeRequests', 'changeItems', 'releases', 'releaseChanges', 'siteBuilderDrafts', 'auditEvents', 'migrationSchedules']) {
      expect(Array.isArray(database[table]), table).toBe(true);
      expect(new Set(database[table].map(row => row.id)).size, table).toBe(database[table].length);
    }
    expect(database.sites.some(site => site.key === 'asce')).toBe(true);
    expect(database.applications.length).toBeGreaterThan(0);
    expect(readFileSync('public/catalog/portal.json', 'utf8')).toBe(catalogBefore);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 45_000);
