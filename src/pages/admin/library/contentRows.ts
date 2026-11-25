import { presentContent } from './contentPresentation';
import { compileRequirementCatalog, type RequirementCatalogSource } from '../../../domain/requirementCatalog.mjs';
import { compileLibraryCatalog, type LibraryCatalog } from '../../../services/libraryCatalogService';
import { freshStartSource } from '../../../domain/freshStartCatalog';
import { canonicalContentKey, resolveContentReferences } from '../../../domain/contentReferences.mjs';
import { resolveCompiledEffectiveSite } from '../../../domain/effectiveSite';
import { humanize } from './libraryRecordColumns';

export type ContentUsage = { pageKey?: string; location: string; component?: string; when?: string; channel: string };
export type ContentRow = { key: string; name: string; defaultValue: unknown; value: unknown; configurable: boolean; status: string; uses: string[]; references: string[]; usages: ContentUsage[]; sourceFile?: string; overrideFile?: string };

/** One authoring item with all its placements. Storage projections are usages, not editable copies. */
export function contentRows(catalog: LibraryCatalog, siteKey: string, sourceOverride?: RequirementCatalogSource) {
  const source = sourceOverride ?? freshStartSource();
  const data = sourceOverride
    ? compileRequirementCatalog(catalog.data, sourceOverride, undefined, catalog.siteScope)
    : compileLibraryCatalog(catalog, 'all').data;
  const refs = source.contentReferences ?? {};
  const owner = (key: string) => canonicalContentKey(key, refs);
  const authored = resolveContentReferences(source.content, refs);
  const effective = siteKey === 'all' ? undefined : resolveCompiledEffectiveSite(data, siteKey);
  const effectiveValues = new Map(effective?.configuration.content.map(row => [row.key, row.value]));
  const rows = new Map<string, ContentRow>();
  const entryOwner = new Map(data.contentEntries.map(entry => [entry.key, owner(entry.definition.sourceKey ?? entry.key)]));
  const slots = new Set(Object.values(source.pages).flatMap(page => Object.keys(page.contentSlots ?? {})).map(owner));
  const overrides = new Set(Object.values(source.fields.sitePages?.[siteKey] ?? {}).flatMap(page => Object.keys((page as { content?: Record<string, unknown> }).content ?? {})).map(owner));
  const overrideFiles = new Map(Object.entries(source.fields.sitePages?.[siteKey] ?? {}).flatMap(([pageKey, page]) => Object.keys((page as { content?: Record<string, unknown> }).content ?? {}).map(key => [owner(key), `requirements/parked/sites/${siteKey}/pages/${pageKey}.json`] as const)));
  const add = (key: string, defaultValue: unknown, value: unknown): ContentRow => {
    let row = rows.get(key);
    if (!row) {
      row = { key, name: key.startsWith('people.') ? `Applicant label · ${humanize(key.slice(7))}` : humanize(key), defaultValue, value, configurable: slots.has(key) || key.startsWith('coverage.category.') && key.endsWith('.description'), status: siteKey === 'all' ? 'Global default' : overrides.has(key) || JSON.stringify(defaultValue) !== JSON.stringify(value) ? 'Site override' : 'Inherited', uses: [], references: [key], usages: [], sourceFile: source.contentSources[key], overrideFile: overrideFiles.get(key) };
      rows.set(key, row);
    }
    return row;
  };
  for (const [key, value] of Object.entries(source.content)) add(key, value, value);
  for (const [alias, target] of Object.entries(refs)) add(owner(target), authored[owner(target)], authored[owner(target)]).references.push(alias);
  for (const entry of data.contentEntries) {
    const key = entryOwner.get(entry.key)!;
    // A captured definition or a binding alone is not proof of displayed content.
    if (!Object.hasOwn(authored, key)) continue;
    const base = authored[key];
    const value = effectiveValues.has(entry.key) ? effectiveValues.get(entry.key) : base;
    const row = add(key, base, value);
    if (effectiveValues.has(entry.key)) row.value = value;
    if (!row.references.includes(entry.key)) row.references.push(entry.key);
    if (entry.key !== key) row.uses.push(entry.key);
  }
  for (const placement of source.contentInventory.placements) for (const key of placement.keys) {
    const row = rows.get(owner(key));
    if (!row) continue;
    for (const pageKey of placement.pages ?? [undefined]) {
      row.usages.push({ pageKey, location: placement.location, component: placement.component, when: placement.when, channel: placement.channel });
      if (pageKey) row.uses.push(pageKey);
    }
  }
  for (const [pageKey, page] of Object.entries(source.pages)) {
    for (const key of [...Object.values(page.content ?? {}).flat(), ...Object.keys(page.contentSlots ?? {})]) {
      const row = rows.get(owner(key));
      if (row) {
        const consumer = page.consumerKey ?? pageKey;
        row.uses.push(consumer);
        if (!row.usages.some(usage => usage.pageKey === consumer)) row.usages.push({ pageKey: consumer, location: 'Page content', channel: key.startsWith('receipt.email.') ? 'Email' : 'Site' });
      }
    }
  }
  for (const [key, targets] of Object.entries(source.contentBindings)) {
    const row = rows.get(owner(key));
    if (row) row.uses.push(...[targets].flat());
  }
  const documents = data.documentDefinitions;
  for (const document of documents) {
    const contentKey = document.definition.contentKey ?? document.key;
    const matching = data.contentEntries.filter(entry => entry.key === contentKey || entry.key.startsWith(`${contentKey}.`));
    if (matching.length) {
      for (const entry of matching) rows.get(entryOwner.get(entry.key)!)?.uses.push(`Document: ${document.key}`);
    } else if (document.definition.productKey) {
      const definition = data.configurationDefinitions.find(row => row.definition.target?.kind === 'product-presentation' && row.definition.target.productKey === document.definition.productKey && row.definition.target.property === 'brochureUrl');
      const base = definition ? data.configurationValues.find(row => row.configurationKey === definition.key && row.scope === 'global')?.value : undefined;
      const value = definition ? effective?.configuration.configurations.find(row => row.key === definition.key)?.value ?? base : undefined;
      const row = add(document.key, base, value); row.configurable = true; row.uses.push(`Product: ${document.definition.productKey}`);
      row.sourceFile = 'requirements/global/products.json';
      if (definition) row.references.push(definition.key);
      if (JSON.stringify(base) !== JSON.stringify(value)) row.overrideFile = `requirements/parked/sites/${siteKey}/products.json`;
      row.usages.push({ location: `Product information › ${humanize(document.definition.productKey)} › Brochure link`, channel: 'Site', when: 'When this product offers a brochure', component: 'ProductCatalog' });
    }
  }
  const excluded = new Set(source.contentInventory.exclusions.flatMap(group => group.keys).map(owner));
  const pageIds = Object.values(source.pages).sort((a, b) => a.position - b.position).map(page => page.consumerKey ?? page.page);
  return [...rows.values()].filter(row => !excluded.has(row.key) && row.usages.length).map(row => ({ ...row, status: siteKey === 'all' ? 'Global default' : overrides.has(row.key) || JSON.stringify(row.defaultValue) !== JSON.stringify(row.value) ? 'Site override' : 'Inherited', uses: [...new Set(row.uses)].sort(), references: [...new Set(row.references)].sort() })).map(row => presentContent(row, pageIds)).sort((a, b) => a.order - b.order || (a.area === 'Shared' ? a.key.split('.')[0].localeCompare(b.key.split('.')[0]) || a.name.localeCompare(b.name) : a.priority - b.priority));
}
