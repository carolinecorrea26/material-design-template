import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { healthPageScenario } from '../../.storybook/healthPageScenario';
import examples from '../../requirements/global/prototype-fixtures/health-questionnaires.json';
import { configuredHealthQuestionnaire, isHealthQuestionnairePolicy } from '../domain/configuredHealthQuestionnaire';
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from '../domain/prototypeLibrary';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { validateHealthPage } from '../config/healthFollowUps';
import { requirementValidationMessage } from '../domain/requirementValidations';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let baseline: PrototypeLibrary;
beforeAll(() => { baseline = resolvePrototypeLibrary(catalog.data, 'asce', 'configured-health-test'); });
afterEach(() => installPrototypeLibrary(null));
const setup = (kind: 'ci' | 'cir', spouse = false) => {
  window.history.replaceState(null, '', `/?site=asce`);
  const scenario = healthPageScenario(kind, spouse);
  const fixture = buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, undefined, undefined, undefined, undefined, undefined, scenario.health);
  installPrototypeLibrary(fixture);
  return { fixture, values: { ...scenario.values } as Record<string, unknown>, page: (kind === 'ci' ? 'health-tele' : 'health-cir') as 'health-tele' | 'health-cir' };
};
const answerAll = (page: 'health-tele' | 'health-cir', fixture: PrototypeLibrary, values: Record<string, unknown>) => {
  for (const applicant of ['member', 'spouse']) for (const item of configuredHealthQuestionnaire(fixture.site, page, applicant, values).items) {
    if (item.question) values[item.question.id] = item.question.inputType === 'dropdown' ? item.question.options![0].value : 'no';
  }
};
it('uses valid authored prototype assignments and preserves effective-Site participation', () => {
  for (const value of Object.values(examples)) expect(isHealthQuestionnairePolicy(value)).toBe(true);
  for (const page of ['health-tele', 'health-cir']) expect(baseline.site.configuration.pages.find(row => row.key === page)?.requirement).toBe('required');
  expect(baseline.site.configuration.healthQuestionnairePolicies).toHaveLength(0);
});
it.each(['ci', 'cir'] as const)('validates applicable configured %s answers and rejects invalid questionnaire configuration', kind => {
  const { fixture, values, page } = setup(kind);
  expect(validateHealthPage(page, values as never)).toBeDefined();
  answerAll(page, fixture, values);
  expect(validateHealthPage(page, values as never)).toBeUndefined();
  const policies = fixture.site.configuration.healthQuestionnairePolicies;
  fixture.site.configuration.healthQuestionnairePolicies = [];
  if (kind === 'ci') expect(validateHealthPage(page, values as never)).toContain('Answer');
  else {
    // No assigned separate CIR questionnaire means no separate CIR form; malformed configuration still blocks.
    expect(validateHealthPage(page, values as never)).toBeUndefined();
    fixture.site.configuration.healthQuestionnairePolicies = policies.map(row => ({ ...row, value: {} }));
    expect(validateHealthPage(page, values as never)).toBe(requirementValidationMessage('health-questionnaire-resolution'));
  }
});
it('selects CI jurisdiction wording independently of member/spouse answers', () => {
  const { fixture, values } = setup('ci', true);
  const original = configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', values);
  expect(original.items).toHaveLength(16);
  expect(original.fields.some(field => field.label.includes('Alcoholism or drug habit?'))).toBe(true);
  const california = configuredHealthQuestionnaire(fixture.site, 'health-tele', 'spouse', { ...values, 'state-province': 'CA' });
  expect(california.items).toHaveLength(16);
  expect(california.fields.some(field => field.label.includes('Substance Abuse?'))).toBe(true);
  expect(california.fields.every(field => field.id.endsWith('-spouse'))).toBe(true);
});
it('resolves Association-scoped questionnaires from the effective Site context rather than a Yes/No membership answer', () => {
  const { fixture, values } = setup('ci');
  const policy = fixture.site.configuration.healthQuestionnairePolicies[0].value;
  if (!isHealthQuestionnairePolicy(policy)) throw new Error('Invalid test questionnaire');
  delete policy.applicability;
  const association = fixture.associationContext.selection.fixedAssociationId!;
  policy.associationKeys = [association];
  expect(configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', { ...values, membership: 'yes', association: 'stale-association' }).status).toBe('resolved');
  fixture.associationContext.selection = { mode: 'url-parameter' };
  window.history.replaceState(null, '', `/?association=${association}`);
  expect(configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', { ...values, membership: 'yes' }).status).toBe('resolved');
  window.history.replaceState(null, '', '/');
  expect(configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', { ...values, membership: association }).status).toBe('unassigned');
  fixture.associationContext.selection = { mode: 'select' };
  expect(configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', { ...values, membership: association }).status).toBe('resolved');
  expect(configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', { ...values, membership: false }).status).toBe('unassigned');
  policy.associationKeys = ['unassigned-association'];
  expect(configuredHealthQuestionnaire(fixture.site, 'health-tele', 'member', values).status).toBe('unassigned');
});
it('uses CIR activities and Other-dwelling follow-ups only while applicable', () => {
  const { fixture, values, page } = setup('cir');
  answerAll(page, fixture, values);
  values['health-cir-q1-member'] = 'yes';
  expect(validateHealthPage(page, values as never)).toContain('Activities');
  let result = configuredHealthQuestionnaire(fixture.site, page, 'member', values);
  values[result.items[0].fields[0].id] = ['Bathing'];
  expect(validateHealthPage(page, values as never)).toBeUndefined();
  values['health-cir-q11-member'] = 'other';
  expect(validateHealthPage(page, values as never)).toContain('Please specify');
  result = configuredHealthQuestionnaire(fixture.site, page, 'member', values);
  values[result.items.find(item => item.question?.id === 'health-cir-q11-member')!.fields[0].id] = 'Example dwelling';
  expect(validateHealthPage(page, values as never)).toBeUndefined();
  values.coverageRiders = {};
  expect(configuredHealthQuestionnaire(fixture.site, page, 'member', values).status).toBe('unassigned');
  expect(validateHealthPage(page, values as never)).toBeUndefined();
});
