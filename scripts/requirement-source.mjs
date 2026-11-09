import fs from 'node:fs';
import path from 'node:path';
import { compileRequirementCatalog } from '../src/domain/requirementCatalog.mjs';
const root = path.resolve(import.meta.dirname, '../requirements');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const files = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => name.endsWith('.json')).map(name => path.join(dir, name)) : [];
export function readRequirementSource() {
  const sites = fs.readdirSync(`${root}/parked/sites`);
  return {
    application: read(`${root}/global/application.json`),
    siteApplication: Object.fromEntries(sites.filter(site => fs.existsSync(`${root}/parked/sites/${site}/application.json`)).map(site => [site, read(`${root}/parked/sites/${site}/application.json`)])),
    fields: { fieldIds: read(`${root}/global/fields.json`), fieldDetails: read(`${root}/parked/field-details.json`), optionLists: read(`${root}/global/option-lists.json`),
      mappings: [...files(`${root}/mappings/components`), ...files(`${root}/mappings/page-fields`)].map(read),
      sites: Object.fromEntries(sites.map(site => [site, read(`${root}/parked/sites/${site}/fields.json`)])),
      sitePages: Object.fromEntries(sites.map(site => [site, Object.fromEntries(files(`${root}/parked/sites/${site}/pages`).map(file => [path.basename(file, '.json'), read(file)]))])) },
    pages: Object.fromEntries(files(`${root}/parked`).map(read).filter(page => page.page).map(page => [page.page, page])),
    products: read(`${root}/global/products.json`), configurationBindings: read(`${root}/global/configuration-bindings.json`),
    siteProducts: Object.fromEntries(sites.filter(site => fs.existsSync(`${root}/parked/sites/${site}/products.json`)).map(site => [site, read(`${root}/parked/sites/${site}/products.json`)])),
    pageDefaults: read(`${root}/parked/pages.json`),
    verification: read(`${root}/global/prototype-fixtures/verification.json`),
    configurations: files(`${root}/global/configurations`).flatMap(file => read(file).configurations),
    siteCoveragePolicies: Object.fromEntries(sites.filter(site => fs.existsSync(`${root}/parked/sites/${site}/coverage-policies.json`)).map(site => [site, read(`${root}/parked/sites/${site}/coverage-policies.json`)])),
    siteCoverage: Object.fromEntries(sites.filter(site => fs.existsSync(`${root}/parked/sites/${site}/coverage.json`)).map(site => [site, read(`${root}/parked/sites/${site}/coverage.json`)])),
    content: Object.assign({}, ...files(`${root}/global/content`).map(read)),
    contentBindings: read(`${root}/global/content-bindings.json`), coverageQuestions: read(`${root}/global/coverage-questions.json`),
    siteEligibility: Object.fromEntries(sites.filter(site => fs.existsSync(`${root}/parked/sites/${site}/eligibility.json`)).map(site => [site, read(`${root}/parked/sites/${site}/eligibility.json`)])),
  };
}
export const compileReviewedRequirements = data => compileRequirementCatalog(data, readRequirementSource());
