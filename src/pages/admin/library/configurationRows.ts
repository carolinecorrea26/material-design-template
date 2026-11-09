import { withFreshStartCatalog } from "../../../domain/freshStartCatalog";
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { resolveEffectiveSite } from '../../../domain/effectiveSite';
import { configurationOwner, configurationPath, flagOwner, primaryConfigurationDefinitions, type LibraryOwner } from '../../../domain/libraryOwnership';
import { humanize, readableValue } from './libraryRecordColumns';
import { isPageParticipationPath } from '../../../domain/pageParticipation';
import { coverageConfigurationDefinitions } from '../../../domain/requirementCoveragePolicy';
import amountControls from '../../../../requirements/global/configurations/coverage-amount-controls.json';
import productPresentation from '../../../../requirements/global/configurations/product-presentation.json';

export type ConfigurationInspectionRow = { key: string; name: string; description: string; group: string; values: string; options: string; scope: string; usedIn: string; source: string; owner: LibraryOwner; referenceKey: string };

export function configurationRows(catalog: LibraryCatalog, siteKey: string): ConfigurationInspectionRow[] {
  catalog = { ...catalog, data: withFreshStartCatalog(catalog.data, siteKey === "all" ? undefined : siteKey) };
  const { data } = catalog;
  const site = data.sites.find(row => row.key === siteKey);
  if (siteKey !== 'all' && !site) return [];
  const resolved = site ? resolveEffectiveSite(data, siteKey) : null;
  const effective = resolved?.configuration.configurations ?? [];
  const rows: ConfigurationInspectionRow[] = primaryConfigurationDefinitions(data.configurationDefinitions)
    .filter(row => row.definition.target?.kind !== 'site-page-participation' && !isPageParticipationPath(configurationPath(row).split('.'))).map(row => {
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
  for (const [pageKey, label] of [['payment', 'Payment'], ['beneficiary', 'Beneficiary']] as const) {
    const modeLabel = (value: string | undefined) => value === 'none' ? 'Not used' : value === 'required' ? 'Required' : value === 'optional' ? 'Optional' : 'Not configured';
    const values = site ? modeLabel(data.sitePages.find(row => row.siteKey === siteKey && row.pageKey === pageKey)?.requirement)
      : data.sites.map(site => `${site.key}: ${modeLabel(data.sitePages.find(row => row.siteKey === site.key && row.pageKey === pageKey)?.requirement)}`).join('\n');
    rows.unshift({ key: `pages.requirements.${pageKey}`, name: `${label} collection`, description: `Set whether ${label.toLowerCase()} information is required, optional or not collected.`, group: 'Page settings', values,
      options: 'Required\nOptional\nNot used', scope: site ? siteKey : 'Site', usedIn: `${label} page`, source: 'site_pages.requirement', owner: 'configurations', referenceKey: pageKey });
  }
  rows.unshift({ key: 'site.templateType', name: 'Application template', description: 'Select the single-page or multi-step application layout.', group: 'Application layout', values: site ? site.templateType : data.sites.map(site => `${site.name}: ${site.templateType}`).join('\n'), options: 'single — Single-page\nmulti — Multi-step', scope: site ? siteKey : 'Site', usedIn: 'Application layout and page previews', source: 'Site.templateType', owner: 'configurations', referenceKey: 'site.templateType' });
  for (const flag of data.flagDefinitions.filter(row => flagOwner(row.persistence) === 'configurations')) {
    const assignments = data.flagAssignments.filter(row => row.flagKey === flag.key && (!site || (!row.siteKey || row.siteKey === siteKey) && (!row.clientKey || row.clientKey === resolved?.clientKey)));
    rows.push({ key: flag.key, name: flag.name, description: flag.description, group: 'Site switches', values: assignments.length ? readableValue(assignments.map(row => ({ scope: row.siteKey ?? row.clientKey ?? 'Global', value: row.value }))) : 'Not configured', options: readableValue(flag.allowedValues ?? (flag.valueType === 'boolean' ? [true, false] : null)), scope: flag.level, usedIn: 'Applicant portal', source: flag.sourceReference ?? 'Source not recorded', owner: 'configurations', referenceKey: flag.key });
  }
  for (const current of (site ? [site] : data.sites)) for (const assignment of (site ? resolved! : resolveEffectiveSite(data, current.key)).configuration.coverageRequirements) {
    const offered = (site ? resolved! : resolveEffectiveSite(data, current.key)).products.some(product => product.productKey === assignment.product);
    if (!offered) continue;
    const definition = coverageConfigurationDefinitions.find(row => row.id === assignment.configuration)!;
    const band = assignment.minimumAgeYears === undefined ? '' : ` · ages ${assignment.minimumAgeYears}–${assignment.maximumAgeYears}`;
    rows.push({ key: `requirements:${current.key}:${assignment.configuration}:${assignment.product}:${assignment.applicants.join('-')}${band}`,
      name: definition.name, description: `${assignment.product} · ${assignment.applicants.join(', ')}${band}`,
      group: 'Coverage requirements', values: readableValue(assignment.value), options: 'options' in definition ? readableValue(definition.options) : definition.type,
      scope: current.key, usedIn: 'Coverage · Library · prototype · Storybook', source: `requirements/parked/sites/${current.key}/coverage.json\n${assignment.source}`,
      owner: 'configurations', referenceKey: assignment.configuration });
  }
  // These are global template definitions. Their availability must not depend
  // on whether the selected effective Site has reviewed policy assignments.
  for (const definition of amountControls.configurations) rows.push({
      key: `requirements:${definition.id}`, referenceKey: definition.id, name: definition.name,
      description: 'Global template configuration; runtime supported. Effective Sites inherit the definition and may supply values or product/applicant overrides.',
      group: 'Coverage amount controls',
      values: definition.id === 'coverage-amount-default-value' ? 'No specific amount assigned' : `Declared default: ${readableValue(definition.default)}`,
      options: 'options' in definition ? readableValue(definition.options) : definition.type,
      scope: 'Global template',
      usedIn: 'Coverage · prototype · Storybook', owner: 'configurations',
      source: `requirements/global/configurations/coverage-amount-controls.json\n${definition.source}`,
  });
  for (const definition of productPresentation.configurations) rows.push({
      key: `requirements:${definition.id}`, referenceKey: definition.id, name: definition.name,
      description: 'Global template presentation configuration. Effective Sites supply ordering values; featured_prod takes precedence across category/product displays.',
      group: 'Category and product presentation',
      values: `Declared default: ${readableValue(definition.default)}`,
      options: `Ordered ${definition.format} list`, scope: 'Global template',
      usedIn: 'Home · quote tools · About Coverage panels/drawers · application menu · Coverage · other category/product lists',
      source: `requirements/global/configurations/product-presentation.json\n${definition.source}`,
      owner: 'configurations',
  });
  return rows;
}
