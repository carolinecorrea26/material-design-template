import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { freshStartSource } from '../domain/freshStartCatalog';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { configuredHealthQuestionnaire, type HealthQuestionnairePolicy } from '../domain/configuredHealthQuestionnaire';
import { resolveJourneyUnderwriting } from '../domain/coverageJourneyUnderwriting';
import { resolvePageParticipation } from '../config/flowGates';
import { healthPageScenario } from '../../.storybook/healthPageScenario';
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
afterEach(() => installPrototypeLibrary(null));
it('selects independent and combined TELE variants per adult from one source-compiled policy', () => {
  const source = structuredClone(freshStartSource());
  const products = ['li-term', 'di-ltd', 'li-add'];
  const questions = ['health-li-q1', 'health-di-q1', 'health-ci-q1'];
  const item = (index: number) => ({ key: `synthetic-${index}`, questionFieldKey: questions[index], fieldKeys: [], sourceReferences: ['requirements/parked/health-tele.json; requirements/parked/health-di-supp.json'] });
  const policy: HealthQuestionnairePolicy = { version: 1, applicability: 'site', associationKeys: [], pageId: 'health-tele', variants: [
    ...products.map((key, index) => ({ key, when: { only: [key], any: [key] }, items: [item(index)] })),
    { key: 'life-and-disability', when: { only: products.slice(0, 2), any: ['li-term'], otherThan: ['li-term'] }, items: [item(0), item(1)] },
  ] };
  const id = 'synthetic.tele-questionnaire';
  source.application.records.configurationDefinitions.push({ id, key: id, position: 0, definition: { target: { kind: 'site-health-questionnaires' } } });
  source.siteApplication.asce.records.configurationValues.push({ id, key: id, configurationKey: id, scope: 'site', siteKey: '{{site}}', clientKey: null, position: 0, value: policy });
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'synthetic-tele-variants', source);
  for (const [index, key] of products.entries()) {
    const result = configuredHealthQuestionnaire(library.site, 'health-tele', 'member', { coverageSelections: [key], productApplicants: { [key]: ['member'] }, coverageAmounts: { [`${key}:member`]: 10000 } });
    expect(result.status).toBe('resolved');
    expect(result.items.map(row => row.question?.id)).toEqual([`${questions[index]}-member`]);
  }
  const mixed = { dependents: ['spouse'], coverageAmounts: { 'li-term:member': 100000, 'di-ltd:member': 1000, 'li-add:spouse': 10000 }, coverageSelections: products, productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'], 'li-add': ['spouse'] } };
  expect(configuredHealthQuestionnaire(library.site, 'health-tele', 'member', mixed).items.map(row => row.question?.id)).toEqual(['health-li-q1-member', 'health-di-q1-member']);
  expect(configuredHealthQuestionnaire(library.site, 'health-tele', 'spouse', mixed).items.map(row => row.question?.id)).toEqual(['health-ci-q1-spouse']);
});
it('routes ordinary DI telesupplement processing to TELE without automatically adding DI SUPP', () => {
  const source = structuredClone(freshStartSource());
  source.fields.sitePages!.asce['health-tele'] = { page: 'health-tele', requirement: 'required', position: 9, fieldOverrides: [] };
  source.fields.sitePages!.asce['health-di-supp'] = { page: 'health-di-supp', requirement: 'required', position: 11, fieldOverrides: [] };
  const assignment = source.siteProducts.asce.catalog!.configurationValues.find(row => row.configurationKey === 'template.di-ltd.journey-policy')!;
  delete (assignment.value as { healthPageByUnderwriting?: unknown }).healthPageByUnderwriting;
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'synthetic-di-tele', source);
  installPrototypeLibrary(library);
  const values = healthPageScenario('di').values;
  expect(resolveJourneyUnderwriting(library.site, 'di-ltd', 'member', 40, 8000).healthPage).toBe('health-tele');
  expect(resolvePageParticipation('health-tele', values)).toBe(true);
  expect(resolvePageParticipation('health-di-supp', values)).toBe(false);
});
