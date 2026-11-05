import fs from 'node:fs';
import { readStoryInventory } from './storybook-inventory.mjs';

const stories = readStoryInventory().filter(row => !row.file.includes('/admin/'));
const roots = new Set(['Foundations', 'Components', 'Reference']);
const ids = new Set();
for (const row of stories) {
  if (!roots.has(row.title.split('/')[0])) throw new Error(`Unexpected sidebar root: ${row.title}`);
  for (const id of row.storyIds) {
    if (ids.has(id)) throw new Error(`Duplicate story ID: ${id}`);
    ids.add(id);
  }
}
const pages = new Map();
for (const row of stories.filter(row => row.title.startsWith('Components/Pages/'))) {
  const [, , page, kind] = row.title.split('/');
  if (!['Whole page', 'Sections'].includes(kind)) throw new Error(`Page examples must be Whole page or Sections: ${row.title}`);
  const kinds = pages.get(page) ?? new Set(); kinds.add(kind); pages.set(page, kinds);
}
for (const [page, kinds] of pages) if (!kinds.has('Whole page')) throw new Error(`Missing complete page example: ${page}`);
const components = JSON.parse(fs.readFileSync('public/catalog/components/components.json', 'utf8')).components;
for (const { definition } of components.filter(row => row.definition.role === 'page-section' && row.definition.name !== 'ApplicationErrorState')) {
  if (!definition.examples.some(example => /^Components \/ Pages \/ .+ \/ Sections(?: \/|$)/.test(example.section))) throw new Error(`Page section lacks a contextual section example: ${definition.name}`);
}
for (const id of ['overlays-confirmationdialog--dependent-only-coverage', 'overlays-confirmationdialog--edit-application', 'overlays-sendapplicationdialog--to-advisor', 'pages-beneficiary-whole-page--add-beneficiary-dialog', 'pages-beneficiary-whole-page--edit-individual-dialog', 'pages-beneficiary-whole-page--edit-trust-dialog', 'pages-beneficiary-whole-page--apply-to-other-coverages', 'forms-dynamiclist--add-record', 'forms-dynamiclist--edit-record', 'forms-dynamiclist--remove-record']) {
  if (!ids.has(id)) throw new Error(`Missing application dialog scenario: ${id}`);
}
console.log(`Storybook organization: ${pages.size} page families have whole-page examples; all ${components.filter(row => row.definition.role === 'page-section').length} registered page sections accounted for; ${ids.size} unique story IDs.`);
