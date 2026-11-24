import { configuredComponent } from '../src/domain/componentDisplayNames.ts';

export function componentStructure(row, rows, analyzer) {
  const definition = configuredComponent(row.name);
  if (definition.registration.source !== row.source || definition.registration.storyId !== row.storyId || definition.registration.section !== row.section) throw new Error(`Fresh-start component registration differs from its canonical story: ${row.name}`);
  const trace = row.packageImport ? { components: [], elements: [] } : analyzer.trace(row.source, analyzer.module(row.source).ast);
  const contains = rows.filter(child => child.source !== row.source && (child.packageImport
    ? trace.elements.some(element => element.kind === 'package-component' && (element.origin === child.packageImport.module && element.symbol === child.packageImport.symbol || element.origin === `${child.packageImport.module}/${child.packageImport.symbol}` && element.symbol === 'default'))
    : trace.components.some(component => component.source === child.source))).map(child => child.id).sort();
  const declared = definition.contains.map(name => rows.find(child => child.name === name)?.id).sort();
  if (JSON.stringify(declared) !== JSON.stringify(contains)) throw new Error(`Fresh-start component composition differs from source: ${row.name}`);
  return { role: definition.registration.role, contains, parts: definition.parts ?? [] };
}
