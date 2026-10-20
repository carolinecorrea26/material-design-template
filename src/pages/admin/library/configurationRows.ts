import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { resolveEffectiveSite } from '../../../domain/effectiveSite';
import { configurationOwner, configurationPath, flagOwner, primaryConfigurationDefinitions, type LibraryOwner } from '../../../domain/libraryOwnership';
import { humanize, readableValue } from './libraryRecordColumns';

export type ConfigurationInspectionRow = { key: string; name: string; description: string; group: string; values: string; options: string; scope: string; usedIn: string; source: string; owner: LibraryOwner; referenceKey: string };

export function configurationRows(catalog: LibraryCatalog, siteKey: string): ConfigurationInspectionRow[] {
  const { data } = catalog;
  const site = data.sites.find(row => row.key === siteKey);
  if (siteKey !== 'all' && !site) return [];
  const resolved = site ? resolveEffectiveSite(data, siteKey) : null;
  const effective = resolved?.configuration.configurations ?? [];
  const rows: ConfigurationInspectionRow[] = primaryConfigurationDefinitions(data.configurationDefinitions).map(row => {
    const alias = data.configurationDefinitions.find(item => !item.definition.path && configurationPath(item) === configurationPath(row));
    const raw = alias?.definition.metadata ?? row.definition.metadata;
    const metadata = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const owner = configurationOwner(row);
    const target = row.definition.target;
    const product = target && 'productKey' in target ? target.productKey : '';
    if (site && product && !resolved!.products.some(item => item.productKey === product)) return null;
    const values = site ? effective.filter(value => value.key === row.key).map(value => value.value) : data.configurationValues.filter(value => value.configurationKey === row.key).map(value => ({ scope: value.siteKey ?? value.clientKey ?? 'Global', value: value.value }));
    const declaredDefault = metadata.defaultValue;
    return { key: row.key, name: String(metadata.label ?? metadata.name ?? humanize(configurationPath(row) || row.key)), description: String(metadata.description ?? `Controls ${humanize(target?.kind ?? (configurationPath(row) || row.key)).toLowerCase()}.`), group: String(metadata.group ?? (owner === 'rules' ? 'Business policy references' : 'Portal settings')),
      values: owner !== 'configurations' ? 'See owning requirements' : values.length ? readableValue(values) : declaredDefault !== undefined ? `Declared default: ${readableValue(declaredDefault)}\nNo stored assignment` : 'Not configured',
      options: readableValue(metadata.options ?? metadata.values), scope: site ? siteKey : String(metadata.scope ?? 'Site configuration'), usedIn: String(metadata.usedIn ?? 'Applicant portal'), source: String(metadata.sourcePath ?? row.sourceReference ?? 'Source not recorded'), owner,
      referenceKey: owner === 'products' ? product : owner === 'pages' ? configurationPath(row).split('.')[2] ?? '' : owner === 'fields' ? /^fields\.[^.]+\.overrides\.([^.]+)/.exec(configurationPath(row))?.[1] ?? '' : ['themes', 'client-information', 'flows'].includes(owner) ? '' : row.key,
    };
  }).filter((row): row is ConfigurationInspectionRow => row !== null);
  rows.unshift({ key: 'site.templateType', name: 'Application template', description: 'Select the single-page or multi-step application layout.', group: 'Application layout', values: site ? site.templateType : data.sites.map(site => `${site.name}: ${site.templateType}`).join('\n'), options: 'single — Single-page\nmulti — Multi-step', scope: site ? siteKey : 'Site', usedIn: 'Application layout and page previews', source: 'Site.templateType', owner: 'configurations', referenceKey: 'site.templateType' });
  for (const flag of data.flagDefinitions.filter(row => flagOwner(row.persistence) === 'configurations')) {
    const assignments = data.flagAssignments.filter(row => row.flagKey === flag.key && (!site || (!row.siteKey || row.siteKey === siteKey) && (!row.clientKey || row.clientKey === resolved?.clientKey)));
    rows.push({ key: flag.key, name: flag.name, description: flag.description, group: 'Site switches', values: assignments.length ? readableValue(assignments.map(row => ({ scope: row.siteKey ?? row.clientKey ?? 'Global', value: row.value }))) : 'Not configured', options: readableValue(flag.allowedValues ?? (flag.valueType === 'boolean' ? [true, false] : null)), scope: flag.level, usedIn: 'Applicant portal', source: flag.sourceReference ?? 'Source not recorded', owner: 'configurations', referenceKey: flag.key });
  }
  return rows;
}
