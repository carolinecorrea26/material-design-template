// Records the resolved prototype library for every site. The redesignv6 requirements
// model must reproduce these files exactly. Usage: --write to record, --check to compare.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const directory = 'golden/effective-sites';
const mode = process.argv.includes('--write') ? 'write' : process.argv.includes('--check') ? 'check' : null;
if (!mode) throw new Error('Pass --write or --check.');

const catalog = JSON.parse(fs.readFileSync(resolve('public/catalog/portal.json'), 'utf8'));
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { resolvePrototypeLibrary } = await vite.ssrLoadModule('/src/domain/prototypeLibrary.ts');
  const { effectiveSiteSnapshotTables } = await vite.ssrLoadModule('/src/persistence/catalogTables.ts');
  const data = Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, catalog.data[table]]));
  // The catalog hash is a build detail, not part of the resolved behavior.
  const revision = 'golden';
  const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : item, 2) + '\n';
  const failures = [];
  fs.mkdirSync(directory, { recursive: true });
  const summary = [];
  for (const { key } of catalog.data.sites) {
    const text = stable(resolvePrototypeLibrary(data, key, revision));
    const file = `${directory}/${key}.json`;
    summary.push(`${key}: ${(text.length / 1024).toFixed(0)} KB sha256:${createHash('sha256').update(text).digest('hex').slice(0, 12)}`);
    if (mode === 'write') fs.writeFileSync(file, text);
    else if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) failures.push(key);
  }
  console.log(summary.join('\n'));
  if (failures.length) throw new Error(`Resolved sites differ from golden files: ${failures.join(', ')}`);
  console.log(mode === 'write' ? 'Golden files written.' : 'Resolved sites match golden files.');
} finally { await vite.close(); }
