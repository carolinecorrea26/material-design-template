import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { createComponentAnalyzer } from './storybook-component-analysis.mjs';
import { readStoryInventory, walkFiles } from './storybook-inventory.mjs';

const analyzer = createComponentAnalyzer();
const allFiles = walkFiles('src').filter(file => /\.tsx$/.test(file) && !/\.(stories|test)\./.test(file));
const storyModules = readStoryInventory().filter(story => !story.file.startsWith('src/pages/admin/') && !/\/components\/(admin|docs)\//.test(story.file));
const stories = storyModules.flatMap(story => analyzer.stories(story.file));
const noteStories = {
 'component-reuse--catalog': 'Generated index linking to canonical component examples; not a second component implementation.',
 'content-helpchips--accessibility-note': 'Accessibility commentary; not a component example.',
 'forms-conditionalgroup--accessibility-note': 'Accessibility commentary; not a component example.',
 'layout-sectiondivider--fixed-note': 'Historical fix commentary; not a component example.',
};
const graph = new Map();
const sourceElements = [];
for (const source of allFiles.filter(analyzer.uiSource)) {
 const result = analyzer.trace(source, analyzer.module(source).ast);
 graph.set(source, result.components.map(component => component.source));
 sourceElements.push({ source, elements: result.elements, dynamicOrUnresolvedBindings: result.unresolved });
}
function reachable(roots) {
 const result = new Set(roots), queue = [...roots];
 for (const source of queue) for (const child of graph.get(source) ?? []) if (!result.has(child)) { result.add(child); queue.push(child); }
 return result;
}
const storyReach = new Map(stories.map(story => [story.id, reachable(story.components.map(component => component.source))]));
const catalog = JSON.parse(fs.readFileSync('public/catalog/portal.json', 'utf8'));
const special = {
 'src/components/layout/InternalPageShell.tsx': { disposition: 'internal-reference-shell', reason: 'Shell for internal reference/documentation routes; accounted separately from applicant UI.' },
 'src/components/home/HeroClouds.tsx': { disposition: 'page-only-decoration', reason: 'Real Home decoration. No Home-page composition story mounts it.' },
 'src/components/content/ClientCategoryIcon.tsx': { disposition: 'configured-component-factory', reason: 'Real category icons are supplied through coverageCategories/clientCategoryIcon to the selector and product stories. Custom artwork/failure variants are not independently demonstrated.', relatedSource: 'src/config/coverageCategories.ts' },
 'src/components/demo/ApplicantMockOutbox.tsx': { disposition: 'demo-only-without-story', reason: 'Explicit local delivery simulation on Demo resume pages. No dedicated Storybook example.' },
 'src/components/demo/DemoApplicationActions.tsx': { disposition: 'demo-only-without-story', reason: 'Explicit Demo-only resume shortcuts. No dedicated Storybook example.' },
};
const components = allFiles.filter(source => source.startsWith('src/components/') && !/\/components\/(admin|docs)\//.test(source)).map(source => {
 const direct = stories.filter(story => story.components.some(component => component.source === source)).map(story => story.id);
 const composed = stories.filter(story => !direct.includes(story.id) && storyReach.get(story.id).has(source)).map(story => story.id);
 const consumers = [...graph].filter(([parent, children]) => parent !== source && children.includes(source)).map(([parent]) => parent);
 const specialCase = special[source];
 return { source, exports: [...analyzer.module(source).exports].sort(), disposition: specialCase?.disposition ?? (direct.length ? 'direct-story' : composed.length ? 'composed-reference-only' : 'missing-story'),
  reason: specialCase?.reason ?? (direct.length ? 'A story render resolves to this actual source module.' : composed.length ? 'Referenced by a real parent component in Storybook. This does not establish independent state coverage.' : 'Live portal component has no direct or parent composition example.'),
  ...(specialCase?.relatedSource ? { relatedSource: specialCase.relatedSource } : {}), directStories: direct, composedStories: composed, consumers };
});
const matchesPackage = (story, binding) => story?.elements.some(element => element.kind === 'package-component' && element.origin === binding.module && element.symbol === binding.symbol);
const packageStory = story => storyModules.find(module => module.file === story.file)?.packageComponents.some(component => matchesPackage(story, component.packageImport));
const actualExample = story => story.components.length > 0 || packageStory(story);
const catalogExamples = catalog.data.components.map(row => {
 const binding = row.definition.packageImport;
 const story = stories.find(story => story.id === row.definition.storyId);
 let sourceExists = fs.existsSync(row.definition.source);
 if (binding) { try { sourceExists = fs.existsSync(require.resolve(row.definition.source)); } catch { sourceExists = false; } }
 return { key: row.key, source: row.definition.source, storyId: row.definition.storyId,
  sourceExists, storyExists: !!story, rendersSource: binding ? !!matchesPackage(story, binding) : storyReach.get(row.definition.storyId)?.has(row.definition.source) ?? false,
  referenceKind: binding ? 'package-component' : story?.components.some(component => component.source === row.definition.source) ? 'direct' : 'composed',
 };
});
const legacyExamples = analyzer.module('src/content/docs/componentInventory.ts').top.get('componentsData').elements.map(item => {
 const row = Object.fromEntries(item.properties.filter(property => property.name && property.initializer).map(property => [property.name.getText(), property.initializer.text]));
 return { name:row.name, source:row.sourcePath, storyId:row.storybookId, sourceExists:fs.existsSync(row.sourcePath), storyExists:storyReach.has(row.storybookId), rendersSource:storyReach.get(row.storybookId)?.has(row.sourcePath) ?? false };
});
const router = analyzer.module('src/app/router.tsx');
const pageMap = router.top.get('pageComponents');
const pages = pageMap.properties.map(property => {
 const pageId = property.name.getText().replace(/^['"]|['"]$/g, ''), binding = property.initializer.getText(), source = router.imports.get(binding)?.source;
 const definition = catalog.data.pages.find(page => page.key === pageId)?.definition;
 const descendants = reachable([source]);
 return { pageId, source, path: definition?.path ?? null, type: definition?.type ?? 'not-in-saved-page-catalog',
  directStories: stories.filter(story => story.components.some(component => component.source === source)).map(story => story.id),
  missingComponentExamples: components.filter(component => component.disposition === 'missing-story' && descendants.has(component.source)).map(component => component.source),
  boundary: definition?.type === 'internal' ? 'Internal reference route, not an applicant component example.' : 'Real page composition; shared component examples do not certify the whole page or all business branches.' };
});
pages.push({ pageId:'error-pages', source:'src/pages/ErrorPage.tsx', path:'/404, /500, *', type:'error', directStories:[], missingComponentExamples:[], boundary:'Real shared 404/500 page. No dedicated page-composition examples.' });
const errors = [
 ...stories.filter(story => story.unresolved.length).map(story => ({ type:'unresolved-story-binding', story:story.id, details:story.unresolved })),
 ...stories.filter(story => !actualExample(story) && !noteStories[story.id]).map(story => ({ type:'story-without-real-source-render', story:story.id })),
 ...legacyExamples.filter(row => !row.sourceExists || !row.storyExists || !row.rendersSource).map(row => ({ type:'invalid-legacy-inventory-example', ...row })),
 ...catalogExamples.filter(row => !row.sourceExists || !row.storyExists || !row.rendersSource).map(row => ({ type:'invalid-catalog-example', ...row })),
];
const stateGaps = [
 { source:'src/components/layout/AppShell.tsx', missingExamples:['advisorSend','resumeEmailCode'], evidence:'AppShell.stories.tsx demonstrates applicationForm, homepage and advisorLogin only.' },
 { source:'src/components/content/ClientCategoryIcon.tsx', missingExamples:['Client artwork','Broken artwork fallback'], evidence:'The factory is wired through real category configuration; stock-icon stories do not establish these states.' },
 { source:'src/app/SinglePageApplication.tsx', missingExamples:['Embedded single-page application and section navigation'], evidence:'SinglePageSections and StepEditButton have no Storybook composition reference.' },
];
let built = { status:'not-checked' };
if (process.argv.includes('--verify-built')) {
 const index = JSON.parse(fs.readFileSync('storybook-static/index.json', 'utf8'));
 const ids = new Set(Object.values(index.entries).filter(entry => entry.type === 'story').map(entry => entry.id));
 const missing = stories.filter(story => !ids.has(story.id)).map(story => story.id);
 built = { status:missing.length ? 'mismatch' : 'all-non-admin-story-ids-present', nonAdminStories:stories.length, missing, indexSha256:crypto.createHash('sha256').update(fs.readFileSync('storybook-static/index.json')).digest('hex') };
 for (const story of missing) errors.push({ type:'story-missing-from-build', story });
}
const inventoryFiles = [...new Set([...storyModules.map(story => story.file), ...walkFiles('.storybook').filter(file => /\.[jt]sx?$/.test(file)), ...sourceElements.map(row => row.source), '.storybook/main.ts', '.storybook/preview.tsx', 'src/content/docs/components.ts', 'src/content/docs/componentInventory.ts', 'src/docs/pageCoverageData.ts', 'scripts/generate-component-catalog.mjs', 'scripts/storybook-component-analysis.mjs', 'scripts/storybook-component-analysis.test.mjs', 'scripts/audit-storybook-components.mjs'])].sort();
const count = disposition => components.filter(row => row.disposition === disposition).length;
const report = {
 formatVersion:1,
 scope:'Current portal source and configured Storybook examples; Admin Center is excluded. Internal reference/documentation UI, compatibility shims and Demo-only utilities are explicitly accounted for, not silently counted as applicant stories.',
 method:'TypeScript JSX render tracing follows local harnesses, aliased imports and CSF default rendering. Explicit renders do not receive credit merely for declaring meta.component. Per-source JSX/package/native elements and page compositions are inventoried. Composition references are potential source coverage, not exhaustive runtime or state verification.',
 verdict:{ actualComponents:errors.length ? 'unresolved-errors' : 'all-component-examples-resolve-to-real-source', completeVisualCoverage:'incomplete', allComponentModulesAccountedFor:true, inventedComponentsDetected:stories.filter(story => story.unresolved.length || !actualExample(story) && !noteStories[story.id]).length },
 summary:{ nonAdminStoryModules:storyModules.length, exportedStories:stories.length, actualComponentExamples:stories.filter(actualExample).length, commentaryOnlyExamples:stories.filter(story => !actualExample(story) && noteStories[story.id]).length,
 componentModules:components.length, directStoryModules:count('direct-story'), composedReferenceOnly:count('composed-reference-only'), missingStoryModules:count('missing-story'), pageOnlyDecoration:count('page-only-decoration'), configuredFactories:count('configured-component-factory'), demoOnlyWithoutStory:count('demo-only-without-story'), compatibilityAliases:count('compatibility-alias'), internalReferenceShells:count('internal-reference-shell'), savedCatalogExamples:catalogExamples.length, legacyInventoryExamples:legacyExamples.length, invalidCatalogExamples:catalogExamples.filter(row => !row.sourceExists || !row.storyExists || !row.rendersSource).length, inventoriedSourceModules:sourceElements.length, inventoriedJsxReferences:sourceElements.reduce((sum,row) => sum+row.elements.reduce((sum,element) => sum+element.occurrences,0),0), errors:errors.length },
 theme:{ preview:'.storybook/preview.tsx', source:'src/app/theme.ts', status:'Shared createAppTheme, ThemeProvider and CssBaseline are used; preset switching changes theme only, not the selected Site or production integration data.' },
 fixtures:'Story-local form values, callbacks, provider values and sample content are test fixtures. They are not replacement component implementations and do not certify production service integration or every Site policy.',
 savedCatalogComponentsSha256:crypto.createHash('sha256').update(JSON.stringify(catalog.data.components)).digest('hex'),
 built, errors, components, catalogExamples, legacyExamples, stateGaps, pages,
 applicationInfrastructure:sourceElements.filter(row => row.source.startsWith('src/app/')).map(row => ({ source:row.source, directStories:stories.filter(story => story.components.some(component => component.source === row.source)).map(story => story.id) })),
 otherUiSources:allFiles.filter(source => !analyzer.uiSource(source)).map(source => ({ source, disposition:/\/(components|pages)\/admin\//.test(source) ? 'admin-center-excluded' : source.startsWith('src/dev/') ? 'developer-tooling' : 'internal-reference-or-documentation' })),
 stories:stories.map(story => ({ ...story, status:actualExample(story) ? 'real-source-render' : noteStories[story.id] ? 'commentary-only' : 'needs-review', ...(noteStories[story.id] ? { note:noteStories[story.id] } : {}) })),
 sourceElements,
 sourceSha256:Object.fromEntries(inventoryFiles.map(file => [file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')])),
};
const destination = 'docs/project-review/storybook-component-audit.json';
if (process.argv.includes('--write')) fs.writeFileSync(destination, JSON.stringify(report,null,2)+'\n');
if (process.argv.includes('--check') && fs.readFileSync(destination,'utf8') !== JSON.stringify(report,null,2)+'\n') throw new Error('Storybook audit changed. Reverify and regenerate with --write.');
console.log(JSON.stringify({ verdict:report.verdict, summary:report.summary, missingExamples:components.filter(row => row.disposition === 'missing-story').map(row => row.source), errors },null,2));
if (errors.length) process.exitCode = 1;
