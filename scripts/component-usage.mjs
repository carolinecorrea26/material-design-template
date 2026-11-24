import { walkFiles } from './storybook-inventory.mjs';
import ts from 'typescript';

const name = source => source.split('/').at(-1).replace(/\.[jt]sx?$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');

/** Production JSX references only. Stories, tests, Admin Center and internal
 * documentation do not create extra uses. Page contexts include conditional
 * paths; this is source coverage, not a count of mounted controls. */
export function createComponentUsage(analyzer, pages, sources = walkFiles('src').filter(source => analyzer.uiSource(source))) {
 const traced = new Map(sources.map(source => [source, analyzer.trace(source, analyzer.module(source).ast)]));
 const graph = new Map([...traced].map(([source, result]) => [source, result.components.map(component => component.source)]));
 const routerFile = 'src/app/router.tsx';
 function entries(file, node, ancestry = new Set()) {
  if (!node) throw new Error(`Missing page component registry in ${file}`);
  const identity = `${file}:${node.pos}:${node.end}`;
  if (ancestry.has(identity)) throw new Error(`Circular page component registry in ${file}`);
  const trail = new Set(ancestry).add(identity), mod = analyzer.module(file);
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return entries(file, node.expression, trail);
  if (ts.isIdentifier(node)) {
   const imported = mod.imports.get(node.text);
   return imported?.source ? entries(imported.source, analyzer.module(imported.source).top.get(imported.symbol), trail) : entries(file, mod.top.get(node.text), trail);
  }
  if (!ts.isObjectLiteralExpression(node)) throw new Error(`Unsupported page component registry in ${file}`);
  return node.properties.flatMap(property => {
   if (ts.isSpreadAssignment(property)) return entries(file, property.expression, trail);
   if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) throw new Error(`Unsupported page component entry in ${file}`);
   return [{ file, pageKey: property.name.getText().replace(/^['"]|['"]$/g, ''), expression: ts.isShorthandPropertyAssignment(property) ? property.name : property.initializer }];
  });
 }
 // Object spreads retain their module's bindings; later keys replace earlier ones.
 const registry = new Map(entries(routerFile, analyzer.module(routerFile).top.get('pageComponents')).map(entry => [entry.pageKey, entry]));
 const roots = [...registry.values()].flatMap(({ file, pageKey, expression }) => {
  const page = pages.find(page => page.key === pageKey && page.definition.flow !== 'internal');
  const source = analyzer.module(file).imports.get(expression.getText())?.source ?? analyzer.trace(file, expression).components[0]?.source;
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
