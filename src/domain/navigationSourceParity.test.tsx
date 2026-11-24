import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

// Change the authored module once; every consumer must pick it up despite old deployment values.
vi.mock('../../requirements/global/content/application.json', async original => {
  const module = await original<{ default: Record<string, unknown> }>();
  return { default: { ...module.default,
    'navigation.progress-step-labels.getting-started': 'Source-owned progress heading',
    'navigation.back-message': 'Source-owned back transition',
    'navigation.transition-messages.contact': ['Source-owned contact save', 'Source-owned contact continuation'],
    'footer.terms-of-use-content.title': 'Source-owned legal document',
  } };
});
vi.mock('../../requirements/global/content/coverage.json', async original => {
  const module = await original<{ default: Record<string, unknown> }>();
  return { default: { ...module.default, 'coverage.error.correct': 'Source-owned coverage correction', 'coverage.summary.starting-at': 'Source amount from {{minimum}}' } };
});
vi.mock('../../requirements/global/content/emails.json', async original => {
  const module = await original<{ default: Record<string, unknown> }>();
  return { default: { ...module.default, 'email.autosave.intro': 'Source-owned saved message for {{associationName}}.' } };
});

import { freshStartSource } from './freshStartCatalog';
import { resolvePrototypeLibrary, installPrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { contentRows } from '../pages/admin/library/contentRows';
import { navigationDefaults } from '../content/defaults/navigation';
import { coverageDefaults } from '../content/defaults/coverage';
import { footerDefaults } from '../content/defaults/footer';
import { formatCoverageRange } from '../utils/formatCoverageRange';
import * as legalStories from '../components/content/LegalDocList.stories';
import type { ReactElement } from 'react';
import { progressSteps } from '../config/progressSteps';
import { getBackMessage, getForwardMessages } from '../config/transitionMessages';
import { useComponentContent } from '../components/content/ComponentContentContext';
import type { LibraryCatalog } from '../services/libraryCatalogService';
import { buildContent } from '../content';
import * as defaults from '../content/defaults';
import { canonicalContentKey } from './contentReferences.mjs';
import homeExamples from '../../requirements/global/prototype-fixtures/home-examples.json';
import { getMockEmailSamples } from '../utils/mockEmail';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;
afterEach(() => installPrototypeLibrary(null));
function NavigationProbe() {
  const content = useComponentContent();
  return <><span>{content.navigation.progressStepLabels['getting-started']}</span><span>{progressSteps.find(step => step.id === 'getting-started')!.label}</span><span>{getBackMessage()}</span></>;
}

it('propagates changed JSON wording into Library, prototype, Storybook and standalone defaults', () => {
  const source = freshStartSource();
  const rows = contentRows(catalog, 'all', source);
  const prototype = resolvePrototypeLibrary(catalog.data, 'asce', 'navigation-source', source);
  const story = buildGlobalTemplate(catalog);
  expect(Object.hasOwn(buildContent('asce'), 'statusMessages')).toBe(false);
  for (const content of [prototype.content, story.content]) expect(Object.hasOwn(content, 'statusMessages')).toBe(false);
  for (const content of [coverageDefaults, prototype.content.coverage, story.content.coverage]) expect(content.correctErrorsMessage).toBe('Source-owned coverage correction');
  for (const content of [footerDefaults, prototype.content.footer, story.content.footer]) expect(content.termsOfUseContent.title).toBe('Source-owned legal document');
  expect(formatCoverageRange({ minAmount: 100 })).toBe('Source amount from $100');
  for (const content of [navigationDefaults, prototype.content.navigation, story.content.navigation]) {
    expect(content.progressStepLabels['getting-started']).toBe(source.content['navigation.progress-step-labels.getting-started']);
    expect(content.backMessage).toBe(source.content['navigation.back-message']);
    expect(content.transitionMessages.contact).toEqual(source.content['navigation.transition-messages.contact']);
  }
  expect(rows.find(row => row.key === 'navigation.back-message')?.defaultValue).toBe(source.content['navigation.back-message']);
  expect(rows.find(row => row.key === 'navigation.progress-step-labels.getting-started')?.defaultValue).toBe(source.content['navigation.progress-step-labels.getting-started']);
  expect(rows.find(row => row.key === 'coverage.error.correct')?.defaultValue).toBe('Source-owned coverage correction');
  expect(rows.find(row => row.key === 'footer.terms-of-use-content.title')?.defaultValue).toBe('Source-owned legal document');
  for (const fixture of [prototype, story]) {
    installPrototypeLibrary(fixture);
    expect(getMockEmailSamples(fixture.site.siteKey).find(email => email.type === 'autosave')?.html).toContain('Source-owned saved message for');
    const html = renderToStaticMarkup(<NavigationProbe />);
    expect(html).toContain('Source-owned progress heading');
    expect(html).toContain('Source-owned back transition');
    expect(getForwardMessages('contact')).toEqual(source.content['navigation.transition-messages.contact']);
  }
  expect(rows.find(row => row.key === 'email.autosave.intro')?.defaultValue).toBe('Source-owned saved message for {{associationName}}.');
});

it('reads a newly installed revision after navigation modules have already loaded', () => {
  const source = structuredClone(freshStartSource());
  source.content['navigation.progress-step-labels.getting-started'] = 'New revision progress heading';
  source.content['navigation.back-message'] = 'New revision back transition';
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'new-navigation-revision', source));
  expect(progressSteps.find(step => step.id === 'getting-started')?.label).toBe('New revision progress heading');
  expect(getBackMessage()).toBe('New revision back transition');
  expect(renderToStaticMarkup(<NavigationProbe />)).not.toContain('Source-owned progress heading');
});

it('keeps every bound default section aligned with its JSON owner and consumer projections', () => {
  const source = freshStartSource();
  const prototype = resolvePrototypeLibrary(catalog.data, 'asce', 'bound-content-sections', source);
  const story = buildGlobalTemplate(catalog);
  const roots = ['home', 'coverage', 'navigation', 'footer', 'review', 'receipt', 'help', 'shared', 'beneficiary', 'dialogs'] as const;
  const read = (value: unknown, path: string[]) => path.reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, value);
  for (const [key, targets] of Object.entries(source.contentBindings)) for (const target of [targets].flat()) {
    const [root, ...path] = target.split('.');
    if (!roots.includes(root as typeof roots[number])) continue;
    const section = defaults[`${root as typeof roots[number]}Defaults`];
    expect(read(section, path), target).toEqual(source.content[canonicalContentKey(key, source.contentReferences)]);
    expect(read(story.content, target.split('.')), target).toEqual(read(prototype.content, target.split('.')));
  }
});

it('renders legal stories from the installed revision after story modules have loaded', () => {
  const source = structuredClone(freshStartSource());
  source.content['footer.terms-of-use-content.sections'] = [{ type: 'paragraph', text: 'New revision legal paragraph' }];
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'new-legal-revision', source));
  const render = legalStories.TermsOfUse.render as () => ReactElement;
  expect(renderToStaticMarkup(render())).toContain('New revision legal paragraph');
});

it('compiles named Home examples through supported source assignments rather than patching content', () => {
  const association = buildGlobalTemplate(catalog, 'standard', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, homeExamples.associationIntroduction);
  expect(association.content.home.clientSection).toEqual(homeExamples.associationIntroduction.clientSection);
  expect(association.site.configuration.content.find(row => row.key === 'home.clientSection')?.value).toEqual(homeExamples.associationIntroduction.clientSection);
  const notice = buildGlobalTemplate(catalog, 'standard', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, homeExamples.entryNotice);
  expect(notice.client.features?.homeLandingNotice).toBe(true);
  expect(notice.content.home.landingNotice).toEqual(homeExamples.entryNotice.landingNotice);
  expect(notice.site.configuration.content.find(row => row.key === 'home.landingNotice')?.value).toEqual(homeExamples.entryNotice.landingNotice);
});
