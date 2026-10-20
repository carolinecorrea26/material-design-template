import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const args = process.argv.slice(2), options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--input', '--output', '--collection', '--id'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) throw new Error('Usage: npm run pages:migrate-snapshot -- --input FILE --output NEW_FILE [--collection drafts|releases|prototypeReleases --id ID]');
  options[args[i]] = args[i + 1];
}
if (!options['--input'] || !options['--output']) throw new Error('Both --input and --output are required');
if (!!options['--collection'] !== !!options['--id'] || options['--collection'] && !['drafts', 'releases', 'prototypeReleases'].includes(options['--collection'])) throw new Error('Select a collection and record ID together');
const input = resolve(options['--input']), output = resolve(options['--output']), reportPath = `${output}.migration.json`;
if (input === output || existsSync(output) || existsSync(reportPath)) throw new Error('Choose new output paths; original snapshots and existing outputs are preserved');
const sourceBytes = readFileSync(input), source = JSON.parse(sourceBytes);
const record = options['--collection'] ? source[options['--collection']]?.[options['--id']] : source;
if (!record) throw new Error('Snapshot record not found');
const payload = record.payload ?? record;
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
try {
  const { migratePageCatalogSnapshot } = await vite.ssrLoadModule('/src/domain/pageCatalogMigration.ts');
  const { draft, changes } = migratePageCatalogSnapshot(payload);
  const report = { migration: '202610090001_page_catalog_contract', migrations: ['202610090001_page_catalog_contract', '202610090002_field_collections'], source: input, sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'), collection: options['--collection'] ?? null, sourceId: options['--id'] ?? record.id ?? null, siteKey: draft.siteKey, output, requiresReview: true, changes };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  writeFileSync(output, JSON.stringify(draft) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Validated draft: ${output}\nMigration report: ${reportPath}\n${changes.length} metadata changes. Save as a new draft, review and publish through the existing workflow.`);
} finally { await vite.close(); }
