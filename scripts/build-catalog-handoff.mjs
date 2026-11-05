import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { catalogPartPath, readCatalogParts } from './catalog-parts.mjs';

// Documentation exports only: these files are not runtime catalog tables.
const output = 'docs/handoff';
const catalog = readCatalogParts();
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const typeText = (type, node) => checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation)
  .replaceAll(process.cwd().replaceAll('\\', '/') + '/', '');
const source = program.getSourceFile('src/persistence/types/index.ts');
const declaration = source.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'DatabaseSchema');
const database = checker.getTypeAtLocation(declaration);
const location = node => {
  const file = node.getSourceFile();
  return { file: path.relative(process.cwd(), file.fileName), line: file.getLineAndCharacterOfPosition(node.getStart()).line + 1 };
};
const meanings = {
  id: 'Stored row identity. Preserve existing values.',
  key: 'Semantic identity used by key-based relationships. Preserve existing values.',
  displayId: 'Human-facing reference number; do not use as a foreign key.',
  position: 'Ordering within the owning collection; not a universal journey sequence.',
  definition: 'Typed definition payload. Follow the linked TypeScript declarations for nested properties.',
  providedBy: 'Source/provider metadata; null is retained when unspecified.',
  sourceReference: 'Trace to implementation or source evidence; not necessarily a URL.',
  scope: 'Applicability layer: global, client or site.',
  clientKey: 'Client scope selector where this row uses the Scope contract.',
  siteKey: 'Site selector; scope rules differ between scoped and Site assignment tables.',
  value: 'Stored value for the referenced definition; interpretation belongs to its resolver.',
};
function describeProperty(property, expand = false) {
  const node = property.valueDeclaration ?? property.declarations?.[0];
  const type = checker.getTypeOfSymbolAtLocation(property, node);
  const variants = type.isUnion() ? type.types : [type];
  const payload = checker.getNonNullableType(type);
  const declarations = (payload.aliasSymbol ?? payload.getSymbol())?.declarations ?? [];
  return {
    name: property.name,
    required: !(property.flags & ts.SymbolFlags.Optional),
    nullable: variants.some(part => part.flags & ts.TypeFlags.Null),
    type: typeText(type, node),
    description: ts.displayPartsToString(property.getDocumentationComment(checker)) || meanings[property.name] || 'See the property declaration and owning domain contract.',
    declaration: location(node),
    ...(declarations.length ? { typeDeclarations: declarations.map(location) } : {}),
    ...(expand && !payload.isUnion() && !checker.isArrayType(payload) && !checker.isTupleType(payload) ? { properties: payload.getProperties().map(child => describeProperty(child)) } : {}),
  };
}
const tables = Object.entries({ ...catalog.data, analyticsTags: catalog.analyticsTags }).sort(([a], [b]) => a.localeCompare(b)).map(([table, rows]) => {
  const symbol = database.getProperty(table);
  if (!symbol) throw new Error(`Missing schema table: ${table}`);
  const array = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const row = checker.getIndexTypeOfType(array, ts.IndexKind.Number);
  if (!row) throw new Error(`Missing schema row: ${table}`);
  return {
    table, file: `public/catalog/${catalogPartPath(table)}`, rowCount: rows.length,
    rowType: typeText(row),
    properties: row.getProperties().map(property => describeProperty(property, property.name === 'definition')),
  };
});
const dictionary = {
  formatVersion: 1,
  purpose: 'Generated row-property dictionary from TypeScript. Not a JSON Schema validator. Nested payload contracts remain in the linked source declarations.',
  tables,
};
const maps = ['membership', 'eligibility', 'coverage'].map(pageKey => {
  const d = catalog.data;
  const sections = d.pageSections.filter(row => row.pageKey === pageKey);
  const placements = d.pageFields.filter(row => row.pageKey === pageKey);
  const sectionFields = d.pageSectionFields.filter(row => sections.some(section => section.key === row.sectionKey));
  const overrides = d.siteFieldConfigurations.filter(row => row.pageKey === pageKey);
  const fieldKeys = new Set([...placements, ...sectionFields, ...overrides].map(row => row.fieldKey));
  const components = d.components.filter(row => row.definition.usages?.some(usage => usage.pageKey === pageKey) || row.definition.examples?.some(example => example.pageKey === pageKey));
  const steps = d.flowSteps.filter(row => row.definition.pageId === pageKey);
  const refs = (table, rows) => ({ table, file: `public/catalog/${catalogPartPath(table)}`, keys: rows.map(row => row.key ?? row.id) });
  return {
    pageKey,
    boundary: 'Direct saved relationships and recorded component usages/examples only. Not an exhaustive policy dependency graph or a resolved Site. Use the companion page guide and effective resolvers for conditional policies.',
    references: [
      refs('pages', d.pages.filter(row => row.key === pageKey)), refs('sitePages', d.sitePages.filter(row => row.pageKey === pageKey)),
      refs('pageSections', sections), refs('pageFields', placements), refs('pageSectionFields', sectionFields),
      refs('siteFieldConfigurations', overrides), refs('fields', d.fields.filter(row => fieldKeys.has(row.key))),
      refs('validationRules', d.validationRules.filter(row => fieldKeys.has(row.fieldKey))), refs('components', components),
      refs('flowSteps', steps), refs('flowTransitions', d.flowTransitions.filter(row => steps.some(step => row.sourceStepKey === step.key || row.targetStepKey === step.key))),
      refs('contentEntries', d.contentEntries.filter(row => row.definition.path?.[0] === pageKey)),
    ],
  };
});
const tableIndex = '# Catalog table index\n\nGenerated by `npm run docs:handoff`. Row-property types, required/nullable flags and declaration locations are in [data-dictionary.json](data-dictionary.json). Nested payloads are defined by the linked TypeScript source contracts. Counts describe the saved catalog, not resolved Site participation.\n\n| Table | Authoring file | Rows | Row type |\n| --- | --- | ---: | --- |\n' + tables.map(row => `| ${row.table} | [${row.file.replace('public/catalog/', '')}](../../${row.file}) | ${row.rowCount} | \`${row.rowType.replaceAll('|', '\\|')}\` |`).join('\n') + '\n';
for (const [file, value] of Object.entries({ 'data-dictionary.json': JSON.stringify(dictionary, null, 2) + '\n', 'page-maps.json': JSON.stringify({ formatVersion: 1, pages: maps }, null, 2) + '\n', 'table-index.md': tableIndex })) {
  const target = `${output}/${file}`;
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== value) throw new Error(`Handoff export is stale: ${target}. Run npm run docs:handoff.`);
  } else {
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(target, value);
  }
}
console.log(`Handoff dictionary: ${tables.length} tables; implementation maps: ${maps.length} pages.`);
