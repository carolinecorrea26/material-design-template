import { compileRequirementCatalog, type RequirementCatalogSource, type RequirementPage } from "./requirementCatalog.mjs";
import { defaultRequirementFieldSource } from "./requirementFields";
import bindings from "../../requirements/global/content-bindings.json";
import pageDefaults from "../../requirements/parked/pages.json";
import coverageQuestions from "../../requirements/global/coverage-questions.json";
import verification from "../../requirements/global/prototype-fixtures/verification.json";
import products from "../../requirements/global/products.json";
import configurationBindings from "../../requirements/global/configuration-bindings.json";
import application from '../../requirements/global/application.json';

const document = <T,>(module: unknown): T => ((module as { default?: T }).default ?? module) as T;
export function freshStartSource(): RequirementCatalogSource {
  return {
    fields: defaultRequirementFieldSource(), pageDefaults, coverageQuestions, contentBindings: bindings, verification, products, configurationBindings, application,
    siteApplication: Object.fromEntries(Object.entries(import.meta.glob('../../requirements/parked/sites/*/application.json', { eager: true })).map(([path, module]) => [path.split('/').at(-2)!, document<RequirementCatalogSource['siteApplication'][string]>(module)])),
    configurations: Object.values(import.meta.glob("../../requirements/global/configurations/*.json", { eager: true })).flatMap(module => document<{ configurations: RequirementCatalogSource['configurations'] }>(module).configurations),
    pages: Object.fromEntries(Object.values(import.meta.glob("../../requirements/parked/*.json", { eager: true })).map(module => document<RequirementPage>(module)).filter(page => page.definition && page.layout).map(page => [page.page, page])),
    content: Object.assign({}, ...Object.values(import.meta.glob("../../requirements/global/content/*.json", { eager: true })).map(module => document(module))),
    siteEligibility: Object.fromEntries(Object.entries(import.meta.glob("../../requirements/parked/sites/*/eligibility.json", { eager: true })).map(([path, module]) => [path.split('/').at(-2)!, document<RequirementCatalogSource['siteEligibility'][string]>(module)])),
    siteCoveragePolicies: Object.fromEntries(Object.entries(import.meta.glob("../../requirements/parked/sites/*/coverage-policies.json", { eager: true })).map(([path, module]) => [path.split('/').at(-2)!, document(module)])),
    siteCoverage: Object.fromEntries(Object.entries(import.meta.glob("../../requirements/parked/sites/*/coverage.json", { eager: true })).map(([path, module]) => [path.split('/').at(-2)!, document(module)])),
    siteProducts: Object.fromEntries(Object.entries(import.meta.glob("../../requirements/parked/sites/*/products.json", { eager: true })).map(([path, module]) => [path.split('/').at(-2)!, document<RequirementCatalogSource['siteProducts'][string]>(module)])),
  };
}
/** One entry boundary for all reviewed page consumers, including saved snapshots. */
export function withFreshStartCatalog<T>(data: T, siteKey?: string): T {
  return compileRequirementCatalog(data, freshStartSource(), siteKey);
}
