import { freshStartSource, withFreshStartCatalog } from "../../../domain/freshStartCatalog";
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { resolveCompiledEffectiveSite } from '../../../domain/effectiveSite';
import { configurationOwner, configurationPath, flagOwner, primaryConfigurationDefinitions, type LibraryOwner } from '../../../domain/libraryOwnership';
import { humanize, readableValue } from './libraryRecordColumns';
import { isPageParticipationPath } from '../../../domain/pageParticipation';
import { coverageConfigurationDefinitions, coveragePolicyConfigurationDefinitions } from '../../../domain/requirementCoveragePolicy';
import amountControls from '../../../../requirements/global/configurations/coverage-amount-controls.json';
import productPresentation from '../../../../requirements/global/configurations/product-presentation.json';

export type ConfigurationInspectionRow = { key: string; name: string; description: string; group: string; values: string; options: string; scope: string; usedIn: string; source: string; owner: LibraryOwner; referenceKey: string };

export function configurationRows(catalog: LibraryCatalog, siteKey: string): ConfigurationInspectionRow[] {
  catalog = { ...catalog, data: withFreshStartCatalog(catalog.data, siteKey === "all" ? undefined : siteKey, catalog.siteScope) };
  const { data } = catalog;
  const site = data.sites.find(row => row.key === siteKey);
  if (siteKey !== 'all' && !site) return [];
  const resolved = site ? resolveCompiledEffectiveSite(data, siteKey) : null;
  const effective = resolved?.configuration.configurations ?? [];
  const source = freshStartSource();
  const formTemplate = source.configurations.find(configuration => configuration.id === 'form-template')!;
  const rows: ConfigurationInspectionRow[] = primaryConfigurationDefinitions(data.configurationDefinitions)
    .filter(row => row.definition.target?.kind !== 'site-page-participation' && configurationPath(row) !== 'features.defaultTemplate' && !isPageParticipationPath(configurationPath(row).split('.'))).map(row => {
    const alias = data.configurationDefinitions.find(item => !item.definition.path && configurationPath(item) === configurationPath(row));
    const raw = row.definition.metadata ?? alias?.definition.metadata;
    const metadata = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const owner = configurationOwner(row);
    const target = row.definition.target;
    const product = target && 'productKey' in target ? target.productKey : '';
    if (site && product && !resolved!.products.some(item => item.productKey === product)) return null;
    const values = site ? effective.filter(value => value.key === row.key).map(value => value.value) : data.configurationValues.filter(value => value.configurationKey === row.key).map(value => ({ scope: value.siteKey ?? value.clientKey ?? 'Global', value: value.value }));
    const declaredDefault = metadata.defaultValue;
    return { key: row.key, name: String(metadata.label ?? metadata.name ?? humanize(configurationPath(row) || row.key)), description: String(metadata.description ?? `Controls ${humanize(target?.kind ?? (configurationPath(row) || row.key)).toLowerCase()}.`), group: String(metadata.group ?? (owner === 'rules' ? 'Business policy references' : 'Portal settings')),
      values: owner !== 'configurations' ? 'See owning requirements' : values.length ? readableValue(values) : declaredDefault !== undefined ? `Declared default: ${readableValue(declaredDefault)}\nNo stored assignment` : 'Not configured',
      options: readableValue(metadata.options ?? metadata.values), scope: String(metadata.scope ?? (site ? siteKey : 'Site configuration')), usedIn: String(metadata.usedIn ?? 'Applicant portal'), source: String(metadata.sourcePath ?? row.sourceReference ?? 'Source not recorded'), owner,
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
  rows.unshift({ key: 'site.templateType', name: 'Application template', description: `Select the application layout. ${formTemplate.status}; default: ${formTemplate.default}.`, group: 'Application layout', values: site ? site.templateType : data.sites.map(site => `${site.name}: ${site.templateType}`).join('\n'), options: formTemplate.options!.join('\n'), scope: 'Global template', usedIn: 'Application layout and page previews', source: 'requirements/global/configurations/presentation.json#form-template; effective-Site Home configuration', owner: 'configurations', referenceKey: 'site.templateType' });
  for (const flag of data.flagDefinitions.filter(row => flagOwner(row.persistence) === 'configurations')) {
    const assignments = data.flagAssignments.filter(row => row.flagKey === flag.key && (!site || (!row.siteKey || row.siteKey === siteKey) && (!row.clientKey || row.clientKey === resolved?.clientKey)));
    rows.push({ key: flag.key, name: flag.name, description: flag.description, group: 'Site switches', values: assignments.length ? readableValue(assignments.map(row => ({ scope: row.siteKey ?? row.clientKey ?? 'Global', value: row.value }))) : 'Not configured', options: readableValue(flag.allowedValues ?? (flag.valueType === 'boolean' ? [true, false] : null)), scope: flag.level, usedIn: 'Applicant portal', source: flag.sourceReference ?? 'Source not recorded', owner: 'configurations', referenceKey: flag.key });
  }
  for (const current of (site ? [site] : data.sites)) {
    const effectiveSite = site ? resolved! : resolveCompiledEffectiveSite(data, current.key);
    for (const assignment of effectiveSite.configuration.coverageRequirements) {
    const offered = effectiveSite.products.some(product => product.productKey === assignment.product);
    if (!offered) continue;
    const definition = coverageConfigurationDefinitions.find(row => row.id === assignment.configuration)!;
    const band = assignment.minimumAgeYears === undefined ? '' : ` · ages ${assignment.minimumAgeYears}–${assignment.maximumAgeYears}`;
    rows.push({ key: `requirements:${current.key}:${assignment.configuration}:${assignment.product}:${assignment.applicants.join('-')}${band}`,
      name: definition.name, description: `${assignment.product} · ${assignment.applicants.join(', ')}${band}`,
      group: 'Coverage requirements', values: readableValue(assignment.value), options: 'options' in definition ? readableValue(definition.options) : definition.type,
      scope: current.key, usedIn: 'Coverage · Library · prototype · Storybook', source: `requirements/parked/sites/${current.key}/coverage.json\n${assignment.source}`,
      owner: 'configurations', referenceKey: assignment.configuration });
  }
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
      usedIn: `Coverage · prototype · Storybook${definition.productApplicantOverrides ? ' · Site/product/applicant overrides' : ''}`, owner: 'configurations',
      source: `requirements/global/configurations/coverage-amount-controls.json\n${definition.source}`,
  });
  for (const definition of coveragePolicyConfigurationDefinitions) rows.push({
    key: `requirements:global:${definition.id}`, referenceKey: definition.id, name: definition.name,
    description: `${definition.name}. Omitted overrides preserve the product policy; these are not page-only eligibility values.`,
    group: 'Coverage product/applicant policy', values: `Declared default: ${readableValue(definition.default)}\nNo override means retain the assigned product policy`,
    options: 'options' in definition ? readableValue(definition.options) : definition.type,
    scope: 'Global template', usedIn: 'Coverage · assigned product/applicant pairs', owner: 'rules',
    source: 'requirements/global/configurations/coverage-policy.json',
  });
  for (const [pageKey, page] of Object.entries(source.pages)) for (const [key, slot] of Object.entries(page.contentSlots ?? {})) {
    const target = [source.contentBindings[key] ?? key].flat()[0];
    const value = resolved?.configuration.content.find(row => row.key === target)?.value ?? source.content[key];
    rows.push({ key: `content:${key}`, referenceKey: target, name: slot.name,
      description: `${slot.kind === 'notes' ? 'Optional shared or product-scoped notes; an empty list hides them. ' : slot.kind === 'notice' ? 'Optional entry notice; enablement is configured separately. ' : slot.optional ? 'Optional content; blank content hides it. ' : ''}Global content default; effective Sites may override this slot.${slot.requiredWhen ? ` Required when ${slot.requiredWhen.configuration} equals ${readableValue(slot.requiredWhen.equals ?? true)}.` : ''}`,
      group: `${page.definition.displayName ?? pageKey} content`, values: readableValue(value), options: slot.kind === 'notes' ? 'List of { id, text, productKeys }; empty productKeys displays once for all products, otherwise only inside assigned selected products. Informational copy does not change prices.' : slot.kind === 'image' ? 'Image source and alternative text' : slot.kind === 'notice' ? 'Notice title and text; enabled separately' : slot.optional ? 'Configured content or omitted section' : 'Text',
      scope: site ? siteKey : 'Global template', usedIn: String(page.definition.displayName ?? pageKey), owner: 'content',
      source: `requirements/parked/${pageKey}.json#contentSlots
requirements/global/content-bindings.json` });
  }
  const categoryOptions = (source.fields.optionLists as Record<string, Array<{value: string; label: string}>>)['coverage-categories'];
  for (const definition of productPresentation.configurations) {
    const isOrder = definition.type === 'string-list';
    const categories = definition.id.startsWith('category-');
    const property = typeof definition.contentProperty === 'string' ? definition.contentProperty : definition.id.endsWith('-names') ? 'name' : 'description';
    const defaults = isOrder || 'contentProperty' in definition ? definition.default : categories
      ? Object.fromEntries(categoryOptions.map(option => [option.value, property === 'name' ? option.label : source.content[`coverage.category.${option.value.toLowerCase()}.description`]]))
      : Object.fromEntries(source.products.products.map(product => [product.id, source.content[product.content[property]!]]));
    const assigned = (categories ? source.siteProducts[siteKey]?.categories : source.siteProducts[siteKey]?.products) as Record<string, Record<string, unknown>> | undefined;
    const overrides = Object.fromEntries(Object.entries(assigned ?? {}).filter(([, value]) => value[property] !== undefined).map(([key, value]) => [key, value[property]]));
    const values = !isOrder && site ? { ...defaults as Record<string, unknown>, ...overrides } : defaults;
    rows.push({ key: `requirements:${definition.id}`, referenceKey: definition.id, name: definition.name,
      description: isOrder ? 'Global template presentation configuration. Effective Sites supply ordering values; featured_prod takes precedence across category/product displays.' : 'Global template content configuration. Effective Sites may override the canonical category/product content once for every display.',
      group: 'Category and product presentation', values: `${site && !isOrder ? 'Effective values' : 'Declared default'}: ${readableValue(values)}`,
      options: 'format' in definition ? `Ordered ${definition.format} list` : 'Content overrides keyed by category/product ID; omitted values inherit global content', scope: 'Global template',
      usedIn: 'Home · quote tools · About Coverage panels/drawers · application menu · Coverage · other category/product lists',
      source: `requirements/global/configurations/product-presentation.json
${definition.source}`, owner: 'configurations' });
  }
  return rows;
}
