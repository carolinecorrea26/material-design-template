import { readStoryInventory } from './storybook-inventory.mjs';
import fs from 'node:fs';
import { createComponentUsage } from './component-usage.mjs';
import { libraryMetadata } from '../src/domain/provenance.ts';
import { createComponentAnalyzer, storyForComponent } from './storybook-component-analysis.mjs';
import { catalogPartPath, readCatalogParts, writeCatalogBundle } from './catalog-parts.mjs';
import { componentStructure } from './component-structure.mjs';
import { configuredComponent } from '../src/domain/componentDisplayNames.ts';
import { validateComponentStructure } from '../src/domain/componentCatalog.ts';
const analyzer = createComponentAnalyzer();
const rows = new Map();
const saved = readCatalogParts();
const usage = createComponentUsage(analyzer, saved.data.pages);
const modules = readStoryInventory().filter(story => story.file.startsWith('src/components/') && !/\/(admin|docs)\//.test(story.file) || story.file === 'src/app/RoutePage.stories.tsx');
const storyExamples = new Map();
const storyIds = new Map();
for (const story of modules) {
 const renderedStories = analyzer.stories(story.file);
 for (const example of renderedStories) storyIds.set(example.id, example);
 const components = [...story.components, ...story.packageComponents];
 if (story.file === 'src/app/RoutePage.stories.tsx') components.push({ name: 'FormRoutePage', source: 'src/app/RoutePage.tsx', ownsStory: true });
 for (const component of components) {
  const { name, source, ownsStory, packageImport } = component;
  const example = packageImport ? renderedStories.find(story => story.elements.some(element => element.origin === packageImport.module && element.symbol === packageImport.symbol)) : storyForComponent(renderedStories, source);
  if (!example) throw new Error(`No actual render found for ${source} in ${story.file}`);
  const examples = storyExamples.get(source) ?? new Map();
  const page = saved.data.pages.find(page => {
    const section = `Components / Pages / ${page.definition.displayName}`;
    return story.section === section || story.section.startsWith(`${section} / `);
  });
  examples.set(story.title, { label: story.title.split('/').at(-1), storyId: example.id, section: story.section, ...(page && story.pagePosition !== undefined ? { pageKey: page.key, position: story.pagePosition } : {}) });
  for (const [exportName, pageKey] of Object.entries(story.pageStories)) {
   const page = saved.data.pages.find(row => row.key === pageKey);
   const example = renderedStories.find(row => row.export === exportName);
   if (!page || !example) throw new Error(`Invalid page story: ${story.file} ${exportName} ${pageKey}`);
   examples.set(`${story.title}:${pageKey}`, { label: page.definition.displayName, storyId: example.id, section: `Components / Pages / ${page.definition.displayName} / Whole page`, pageKey, position: 0 });
  }
  storyExamples.set(source, examples);
  if (rows.has(name) && !ownsStory) continue;
  rows.set(name, { id: 'component-'+name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase(), name, section: story.section, description: configuredComponent(name).description, displayName: configuredComponent(name).displayName, storyId: example.id, source, ...(packageImport ? { packageImport } : {}) });
 }
}
const sectionOrder = ['Components', 'Reference'];
const catalog = [...rows.values()].map(row => ({ ...row, ...componentStructure(row, [...rows.values()], analyzer), usages: usage(row.source, row.packageImport), examples: [...storyExamples.get(row.source).values()] }))
 .sort((a,b)=>sectionOrder.indexOf(a.section.split(' / ')[0])-sectionOrder.indexOf(b.section.split(' / ')[0])||a.section.localeCompare(b.section)||a.name.localeCompare(b.name));
// Page-only story modules compose existing registered components through their
// actual controllers. Link their explicit page examples without inventing a
// component identity for a page or its Storybook harness.
for (const module of modules.filter(module => Object.keys(module.pageStories).length || module.title.endsWith('/Whole page'))) {
 const rendered = analyzer.stories(module.file);
 const page = saved.data.pages.find(page => module.title === `Components/Pages/${page.definition.displayName}/Whole page`);
 const selections = Object.entries(module.pageStories);
 if (!selections.length && page && rendered[0]) selections.push([rendered[0].export, page.key]);
 for (const [exportName, pageKey] of selections) {
  const page = saved.data.pages.find(page => page.key === pageKey);
  const example = rendered.find(story => story.export === exportName);
  if (!page || !example) throw new Error(`Invalid page story: ${module.file} ${exportName} ${pageKey}`);
  const reachable = new Set(example.components.map(component => component.source));
  for (const source of reachable) for (const child of analyzer.trace(source, analyzer.module(source).ast).components) reachable.add(child.source);
  const owners = catalog.filter(component => reachable.has(component.source));
  if (!owners.length) throw new Error(`Page story has no registered production components: ${example.id}`);
  for (const owner of owners) {
    owner.examples = owner.examples.filter(prior => prior.storyId !== example.id || prior.pageKey && prior.pageKey !== pageKey);
    owner.examples.push({ label: page.definition.displayName, storyId: example.id, section: `Components / Pages / ${page.definition.displayName} / Whole page`, pageKey, position: 0 });
  }
 }
}
for (const row of catalog) for (const example of configuredComponent(row.name).registration.examples ?? []) {
 if (!storyIds.has(example.storyId) || !storyForComponent([storyIds.get(example.storyId)], row.source)) throw new Error(`Missing actual component render for example: ${example.storyId}`);
 row.examples = [...row.examples.filter(prior => prior.storyId !== example.storyId), { ...example, section: row.section }];
}
for (const row of catalog) if (row.usages.length === 0) throw new Error(`Component has no production usage: ${row.name}. Remove its implementation and story instead of keeping a reference-only component.`);
validateComponentStructure(catalog.map(row => ({ key: row.id, definition: row })));
if (process.argv.includes('--check')) {
 for (const { id, ...definition } of catalog) {
  const row = saved.data.components.find(row => row.key === id);
  if (!row || JSON.stringify(row.definition) !== JSON.stringify({ ...definition, storybookPath: `?path=/story/${definition.storyId}` })) throw new Error('Saved component catalog is stale. Run node scripts/generate-component-catalog.mjs --write-catalog.');
 }
 if (saved.data.components.length !== catalog.length) throw new Error('Saved component identities differ from the generated catalog.');
}
if (process.argv.includes('--write-catalog')) {
 const additions = catalog.filter(row => !saved.data.components.some(saved => saved.key === row.id));
 const removed = saved.data.components.filter(row => !catalog.some(next => next.id === row.key));
 if (removed.length && !process.argv.includes('--remove-records') || additions.length && !process.argv.includes('--add-records')) throw new Error(`Component identities changed; additions: ${additions.map(row => row.id).join(', ') || 'none'}; removals: ${removed.map(row => row.key).join(', ') || 'none'}. Reconcile explicitly with --add-records or --remove-records.`);
 if (removed.length) saved.data.components = saved.data.components.filter(row => catalog.some(next => next.id === row.key));
 for (const row of catalog) {
  let target = saved.data.components.find(saved => saved.key === row.id);
  if (!target) {
   target = { id: row.id, key: row.id, position: saved.data.components.length, ...libraryMetadata('components', row.id, row.source) };
   saved.data.components.push(target);
  }
  const { id, ...definition } = row;
  target.definition = { ...definition, storybookPath: `?path=/story/${row.storyId}` };
  target.sourceReference = row.source;
 }
 fs.writeFileSync(`public/catalog/${catalogPartPath('components')}`, JSON.stringify({ components: saved.data.components }, null, 2)+'\n');
 writeCatalogBundle();
}
console.log(`Cataloged ${rows.size} components; ${catalog.filter(row => row.usages.length >= 2).length} used in multiple places`);
