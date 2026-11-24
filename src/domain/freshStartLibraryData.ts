import { compileApplicationSiteIdentities } from './requirementApplicationCatalog.mjs';
import { freshStartSource } from './freshStartCatalog';
import { compileRequirementCatalog, type RequirementCatalogSource } from './requirementCatalog.mjs';
import type { DatabaseSchema } from '../persistence/types';
import type { SnapshotTable } from '../persistence/snapshot';

type CatalogData = Pick<DatabaseSchema, SnapshotTable>;

/** Reconstruct the active Library from authored template records. Captured
 * multi-client evidence remains in operational/migration snapshots, outside this view. */
export function freshStartLibraryData(data: CatalogData, source: RequirementCatalogSource = freshStartSource(), siteScope: readonly string[] = Object.keys(source.fields.sites)): CatalogData {
  data = compileApplicationSiteIdentities({ ...data, sites: data.sites.filter(site => siteScope.includes(site.key)) }, source, undefined, siteScope);
  const sites = data.sites.filter(site => Object.hasOwn(source.fields.sites, site.key));
  const siteKeys = new Set(sites.map(site => site.key));
  const siteIds = new Set(sites.map(site => site.id));
  const clientIds = new Set(sites.map(site => site.clientId));
  const clients = data.clients.filter(client => clientIds.has(client.id));
  const clientKeys = new Set(clients.map(client => client.key));
  const products = new Set(source.products.catalog.products.map(product => product.key));
  const owned = new Set(['fields', 'validationRules', ...Object.keys(source.products.catalog), ...Object.keys(source.application.records),
    ...sites.flatMap(site => [...Object.keys(source.siteProducts[site.key]?.catalog ?? {}), ...Object.keys(source.siteApplication[site.key]?.records ?? {})])]);
  const input = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, owned.has(table) ? [] : rows.filter(row => {
    const record = row as unknown as Record<string, unknown>;
    return (!record.siteKey || siteKeys.has(String(record.siteKey))) && (!record.siteId || siteIds.has(String(record.siteId))) &&
      (!record.clientKey || clientKeys.has(String(record.clientKey))) && (!record.clientId || clientIds.has(String(record.clientId))) &&
      (!record.productKey || products.has(String(record.productKey)));
  })])) as CatalogData;
  input.sites = sites;
  input.clients = clients;
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
