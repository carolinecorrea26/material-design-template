import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { bundlePath, readCatalogParts, writeCatalogBundle } from './catalog-parts.mjs';

if (process.argv.includes('--check')) {
  if (!isDeepStrictEqual(JSON.parse(fs.readFileSync(bundlePath, 'utf8')), readCatalogParts())) throw new Error('Catalog bundle is stale. Run npm run catalog:build. Edit the Library part files, not portal.json.');
} else writeCatalogBundle();
console.log('Library catalog parts and deployment bundle are in sync.');
