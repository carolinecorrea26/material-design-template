import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { sourceHealthForms, sourceHealthForm, sourceFormQuestions, defaultPreviewOptions } from '../../../.storybook/healthForms/catalog';
import SourceHealthFormPage, { sourceFormPreviewArgs, type SourceHealthFormPageProps } from '../../../.storybook/healthForms/SourceHealthFormPage';
import source from '../../migration/sources/health-forms-questions.json';
import { Processing } from '../../components/health/HealthQdPage.stories';
import type { SharedCatalog } from '../../persistence/sharedCatalog';

type FormStories = { default: { args: SourceHealthFormPageProps; parameters: { standalone: boolean }; render: (args: SourceHealthFormPageProps, context: { id: string }) => ReactNode }; MemberOnly: object; MemberAndSpouse: { args: { includeSpouse: boolean } } };
const stories = Object.values(import.meta.glob<FormStories>('../../components/health/forms/*.stories.tsx', { eager: true }));
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('represents all 18 source sections as separate Storybook pages and accounts for every workbook row', () => {
  expect(createHash('sha256').update(readFileSync('health_forms_questions.xlsx')).digest('hex')).toBe(source.sha256);
  expect(stories).toHaveLength(18);
  expect(stories.map(story => story.default.args.formKey).sort()).toEqual(sourceHealthForms.map(form => form.key).sort());
  const rows = sourceHealthForms.flatMap(form => form.rows.map(row => row.row));
  expect(rows.sort((a,b) => a-b)).toEqual(source.questions.map(row => row.row));
  expect(new Set(rows).size).toBe(rows.length);
});

it.each(stories)('renders the supplied form $default.args.formKey with separate adult answers', async story => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  expect(story.default.parameters.standalone).toBe(true);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const args = { ...story.default.args, ...story.MemberAndSpouse.args };
  try {
    await act(async () => root.render(<MemoryRouter>{story.default.render(args, { id: args.formKey })}</MemoryRouter>));
    expect(container.textContent).toContain(args.formKey);
    expect([...container.querySelectorAll('button, [role="button"]')].filter(button => button.textContent === 'How is my health information used?')).toHaveLength(1);
    const form = sourceHealthForm(args.formKey);
    for (const row of form.rows) if (row.notes) expect(container.textContent).toContain(row.notes);
    // Only answer-bearing questions get controls. Headings/instructions never become Yes/No answers.
    for (const heading of [35,55,70,82,94,133,156,162,177,200,212]) expect(container.querySelector(`input[name="source-health-${heading}-member"]`)).toBeNull();
    const first = container.querySelector<HTMLInputElement>('input[name$="-member"][value="yes"]')!;
    expect(first).not.toBeNull();
    const spouse = container.querySelector<HTMLInputElement>(`input[name="${first.name.replace(/-member$/, '-spouse')}"][value="yes"]`)!;
    expect(spouse).not.toBeNull();
    await act(async () => first.click());
    expect(first.checked).toBe(true); expect(spouse.checked).toBe(false);
    expect(getPrototypeLibrary()).toBe(previous);
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('uses source state/pathway omissions and preserves the separate GPA variant', () => {
  const rows = (key: string, options = {}) => sourceFormQuestions(sourceHealthForm(key), { ...defaultPreviewOptions, ...options }).map(question => question.row);
  expect(rows('GPA-DI-EZ-3')).toContain(13); expect(rows('GPA-DI-EZ-3')).not.toContain(14);
  expect(rows('GPA-DI-EZ-3', { jurisdiction: 'VA' })).not.toContain(13);
  expect(rows('GPA-DI-EZ-3', { jurisdiction: 'MN' })).toContain(14);
  expect(rows('GPA-DI-EZ-3', { jurisdiction: 'MN' })).not.toContain(13);
  expect(rows('PRS1', { jurisdiction: 'MD' })).not.toContain(74);
  expect(rows('WAEPAWL')).toEqual(expect.arrayContaining([178,181,191]));
  expect(rows('GPA-DI-EZ-3 variants', { omitTobacco: true })).not.toContain(174);
  for (const row of [178,181,191]) expect(rows('WAEPAWL', { simplifiedIssue: true })).not.toContain(row);
  expect(sourceFormQuestions(sourceHealthForm('GPA-DI EZ-3 as amended by GMA-EZ-4'), defaultPreviewOptions).find(question => question.row === 117)?.details).toEqual([]);
  expect(sourceFormQuestions(sourceHealthForm('EZ-4 for AKC'), { ...defaultPreviewOptions, jurisdiction: 'IN' }).find(question => question.row === 196)?.label).toContain('chest discomfort, coronary artery disease');
  expect(sourceFormQuestions(sourceHealthForm('CI-2014'), { ...defaultPreviewOptions, jurisdiction: 'CA' }).find(question => question.row === 91)?.label).toBe('i. Substance Abuse?');
});

it('reveals source TELE-SUPP details only for the answering adult', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><SourceHealthFormPage {...sourceFormPreviewArgs} formKey="GMA-L/H-TELE-SUPP" includeSpouse /></MemoryRouter>));
    expect(container.querySelector('[name="source-health-126-member-reason"]')).toBeNull();
    await act(async () => container.querySelector<HTMLInputElement>('input[name="source-health-126-member"][value="yes"]')!.click());
    expect(container.querySelector('[name="source-health-126-member-reason"]')).not.toBeNull();
    expect(container.querySelector('[name="source-health-126-spouse-reason"]')).toBeNull();
    expect(container.querySelector('input[name="source-health-126-insurance-member"]')).not.toBeNull();
    expect(container.querySelector('input[name="source-health-132-tests-member"]')).not.toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('keeps the actual QD story on its loader beyond the normal timeout with no fabricated questions or Next action', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.useFakeTimers();
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as SharedCatalog;
  const previous = getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = Processing.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: 'qd-loader', loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    await act(async () => vi.advanceTimersByTime(120000));
    expect(container.querySelector('[role="status"]')?.textContent).toContain('QuickDecision');
    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeNull();
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Next')).toBe(false);
    expect(container.textContent).not.toContain('taking longer than expected');
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});

it('validates restored detail contents and ignores inactive records without discarding them', async () => {
  const { sourceFormErrors } = await import('../../../.storybook/healthForms/validation');
  const questions = sourceFormQuestions(sourceHealthForm('Supp DI'), defaultPreviewOptions);
  const values: Record<string, unknown> = Object.fromEntries(questions.filter(q => q.field).map(q => [`${q.key}-member`, 'no']));
  const first = questions.find(q => q.row === 160)!;
  values[`${first.key}-member`] = 'yes';
  values[`${first.key}-member-details`] = [{ [`${first.key}-member-date`]: '2026-02-30' }];
  expect(sourceFormErrors(questions, ['member'], values).map(error => error.message).join(' ')).toContain('valid date');
  expect(sourceFormErrors(questions, ['member'], values).length).toBeGreaterThan(1);
  values[`${first.key}-member`] = 'no';
  expect(sourceFormErrors(questions, ['member'], values)).toEqual([]);
  expect(values[`${first.key}-member-details`]).toHaveLength(1);
});

it('restores preview records through No/Yes and reports required feedback on an empty form', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><SourceHealthFormPage {...sourceFormPreviewArgs} formKey="Supp DI" initialValues={{ 'source-health-160-member': 'yes', 'source-health-160-member-details': [{ 'source-health-160-member-date': '2020-01-01', 'source-health-160-member-treatment': 'Restored treatment', 'source-health-160-member-condition': 'Example', 'source-health-160-member-physician': 'Example physician' }] }} /></MemoryRouter>));
    expect(container.textContent).toContain('Restored treatment');
    await act(async () => container.querySelector<HTMLInputElement>('input[name="source-health-160-member"][value="no"]')!.click());
    expect(container.textContent).not.toContain('Restored treatment');
    await act(async () => container.querySelector<HTMLInputElement>('input[name="source-health-160-member"][value="yes"]')!.click());
    expect(container.textContent).toContain('Restored treatment');
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Reset answers')!.click());
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Check answers')!.click());
    expect(container.textContent).toContain('required');
    expect(container.textContent).not.toContain('Answers checked for this preview');
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('keeps current and past alcohol detail bindings separate and validates required zero counts', async () => {
  const { sourceFormErrors } = await import('../../../.storybook/healthForms/validation');
  const question = sourceFormQuestions(sourceHealthForm('GMA-L/H-TELE-SUPP'), defaultPreviewOptions).filter(item => item.row === 146);
  const current = { 'source-health-146-member': 'yes', 'source-health-146-member-frequency': 'Weekly', 'source-health-146-member-wine': 0, 'source-health-146-member-beer': 0, 'source-health-146-member-liquor': 0 };
  expect(sourceFormErrors(question, ['member'], current)).toEqual([]);
  expect(sourceFormErrors(question, ['member'], { ...current, 'source-health-146-member': 'no', 'source-health-146-member-past-use': 'yes' }).length).toBeGreaterThan(0);
  expect(sourceFormErrors(question, ['member'], { ...current, 'source-health-146-member': 'no', 'source-health-146-member-past-use': 'no' })).toEqual([]);
});
