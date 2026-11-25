import { compileApplicationSiteIdentities } from './requirementApplicationCatalog.mjs';
import { freshStartSource } from './freshStartCatalog';
import { compileRequirementCatalog, type RequirementCatalogSource } from './requirementCatalog.mjs';
import type { DatabaseSchema } from '../persistence/types';
import type { SnapshotTable } from '../persistence/snapshot';

type CatalogData = Pick<DatabaseSchema, SnapshotTable>;

/** Reconstruct the active Library from authored template records. */
export function freshStartLibraryData(data: CatalogData, source: RequirementCatalogSource = freshStartSource(), siteScope: readonly string[] = Object.keys(source.fields.sites)): CatalogData {
  data = compileApplicationSiteIdentities({ ...data, sites: data.sites.filter(site => siteScope.includes(site.key)) }, source, undefined, siteScope);
  const sites = data.sites.filter(site => Object.hasOwn(source.fields.sites, site.key));
  const siteKeys = new Set(sites.map(site => site.key));
  const siteIds = new Set(sites.map(site => site.id));
  const hostingAssociationIds = new Set(sites.map(site => site.hostingAssociationId));
  const hostingAssociationKeys = new Set(data.associationEntities.filter(association => hostingAssociationIds.has(association.id)).map(association => association.key));
  const products = new Set(source.products.catalog.products.map(product => product.key));
  const owned = new Set(['fields', 'validationRules', ...Object.keys(source.products.catalog), ...Object.keys(source.application.records),
    ...sites.flatMap(site => [...Object.keys(source.siteProducts[site.key]?.catalog ?? {}), ...Object.keys(source.siteApplication[site.key]?.records ?? {})])]);
  const input = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, owned.has(table) ? [] : rows.filter(row => {
    const record = row as unknown as Record<string, unknown>;
    return (!record.siteKey || siteKeys.has(String(record.siteKey))) && (!record.siteId || siteIds.has(String(record.siteId))) &&
      (!record.hostingAssociationKey || hostingAssociationKeys.has(String(record.hostingAssociationKey))) && (!record.hostingAssociationId || hostingAssociationIds.has(String(record.hostingAssociationId))) &&
      (!record.productKey || products.has(String(record.productKey)));
  })])) as CatalogData;
  input.sites = sites;
  input.productCoveragePlans = input.productCoveragePlans.filter(row => products.has(row.productKey));
  const plans = new Set(input.productCoveragePlans.map(row => row.planKey));
  input.coveragePlanDefinitions = input.coveragePlanDefinitions.filter(row => plans.has(row.key));
  input.coveragePlanVariants = input.coveragePlanVariants.filter(row => plans.has(row.planKey));
  const variants = new Set(input.coveragePlanVariants.map(row => row.key));
  input.planAmountRules = input.planAmountRules.filter(row => variants.has(row.variantKey));
  input.planBenefitPeriods = input.planBenefitPeriods.filter(row => variants.has(row.variantKey));
  input.semanticRequirements = input.semanticRequirements.filter(row => {
    const value = row.value as Record<string, unknown> | null;
    return !!value && siteKeys.has(String(value.siteKey)) && (!value.productKey || products.has(String(value.productKey)));
  });
  return compileRequirementCatalog(input, source, undefined, siteScope);
}
