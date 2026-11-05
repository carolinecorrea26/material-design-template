import { walkFiles } from './storybook-inventory.mjs';

const name = source => source.split('/').at(-1).replace(/\.[jt]sx?$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');

/** Production JSX references only. Stories, tests, Admin Center and internal
 * documentation do not create extra uses. Page contexts include conditional
 * paths; this is source coverage, not a count of mounted controls. */
export function createComponentUsage(analyzer, pages, sources = walkFiles('src').filter(source => analyzer.uiSource(source))) {
 const traced = new Map(sources.map(source => [source, analyzer.trace(source, analyzer.module(source).ast)]));
 const graph = new Map([...traced].map(([source, result]) => [source, result.components.map(component => component.source)]));
 const router = analyzer.module('src/app/router.tsx');
 const roots = router.top.get('pageComponents').properties.flatMap(property => {
  const pageKey = property.name.getText().replace(/^['"]|['"]$/g, '');
  const page = pages.find(page => page.key === pageKey && page.definition.flow !== 'internal');
  const source = router.imports.get(property.initializer.getText())?.source ?? analyzer.trace('src/app/router.tsx', property.initializer).components[0]?.source;
  return page && source ? [{ page, source }] : [];
 });
 const contexts = new Map();
 for (const { page, source } of roots) {
  const reached = new Set([source, 'src/components/layout/AppShell.tsx']);
  const queue = [...reached];
  for (const parent of queue) for (const child of graph.get(parent) ?? []) if (!reached.has(child)) { reached.add(child); queue.push(child); }
  for (const parent of reached) {
   const existing = contexts.get(parent) ?? new Map(); existing.set(page.key, page.definition.displayName ?? page.key); contexts.set(parent, existing);
  }
 }
 function usages(source, packageImport) {
  const result = new Map();
  // The router owns the common shell, rather than each page importing it.
  // Record that real route placement as well as the shell's descendants.
  if (source === 'src/components/layout/AppShell.tsx' && graph.get('src/app/router.tsx')?.includes(source)) {
   for (const { page } of roots) result.set(`${page.key}:src/app/router.tsx`, { source: 'src/app/router.tsx', label: `${page.definition.displayName ?? page.key} → App shell`, pageKey: page.key });
  }
  for (const [parent, pages] of contexts) {
   const trace = traced.get(parent);
   const used = packageImport
    ? trace?.elements.some(element => element.kind === 'package-component' && (element.origin === packageImport.module && element.symbol === packageImport.symbol || element.origin === `${packageImport.module}/${packageImport.symbol}` && element.symbol === 'default'))
    : graph.get(parent)?.includes(source);
   if (!used || parent === source) continue;
   for (const [pageKey, label] of pages) result.set(`${pageKey}:${parent}`, { source: parent, label: `${label} → ${name(parent)}`, pageKey });
  }
  return [...result.values()].sort((a, b) => a.label.localeCompare(b.label));
 }
 return usages;
}
