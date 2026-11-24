import ApplicationPageExample from '../preview/ApplicationPageExample';
import PreviewRuntime from '../preview/PreviewRuntime';
import preview from '../../../.storybook/preview';
import { readFileSync } from 'node:fs';
import { act, useContext, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext, useApplicationSession } from '../../app/ApplicationSessionContext';
import { applicationSessionStorage } from '../../app/applicationSessionStorage';
import { ComponentContentContext } from '../../components/content/ComponentContentContext';
import { FieldDefinitionsContext } from '../../components/forms/FieldDefinitionsContext';
import { ClientIconContext } from '../../components/content/ClientIconContext';
import CoverageScenario from '../../../.storybook/coverageScenario';
import { coverageStoryScenarios } from '../../components/coverage/coverageStoryScenarios';
import { capturedCoverageEntryScope } from '../../config/client/coverageProductScope';
import { getPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { getFormTemplate } from '../../config/template/resolveTemplate';
import { Embedded } from '../../app/SinglePageApplication.stories';
import { ConfiguredArtwork, BrokenArtwork } from '../../components/content/ClientCategoryIcon.stories';

afterEach(() => vi.unstubAllGlobals());
it('mounts real embedded application sections through the supported template contract and restores preview state', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const original = JSON.stringify(catalog), previous = getPrototypeLibrary(), url = window.location.href;
  const stored = sessionStorage.getItem('activeFormTemplate');
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = Embedded.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted() {}, setAdvisorApplicantFlow() {}, resetApplicationSession() {} }}>{render({}, { loaded: { catalog } })}</ApplicationSessionContext></MemoryRouter>));
    expect(getFormTemplate()).toBe('single');
    expect(host.querySelector('[data-single-page-step] form')).not.toBeNull();
    const fields = getPrototypeLibrary()!.site.configuration.pages.find(page => page.key === 'membership')!.fields.filter(field => field.included).map(field => field.definition.id);
    expect([...host.querySelectorAll<HTMLInputElement>('form input')].some(input => fields.includes(input.name))).toBe(true);
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); host.remove(); }
  expect(window.location.href).toBe(url);
  expect(sessionStorage.getItem('activeFormTemplate')).toBe(stored);
  expect(getPrototypeLibrary()).toBe(previous);
});

it('uses configured artwork and the existing factory fallback after an image error', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = (story: typeof ConfiguredArtwork) => (story.render as unknown as () => ReactNode)();
  try {
    await act(async () => root.render(render(ConfiguredArtwork)));
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/logo.svg');
    await act(async () => root.render(render(BrokenArtwork)));
    await act(async () => host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('svg title')?.textContent).toBe('Life coverage');
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it('isolates whole-page runtimes and safely restores nested preview owners', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  expect(preview.parameters?.docs).toMatchObject({ story: { inline: false } });
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const previous = getPrototypeLibrary();
  const first = resolvePrototypeLibrary(catalog.data, 'asce', 'preview-isolation');
  const second = resolvePrototypeLibrary(catalog.data, 'waepa-gi', 'preview-isolation');
  const scenario = { capability: 'multipleTerms' as const, description: '', values: {} };
  function Probe({ id }: { id: string }) { return <output data-probe={id}>{getPrototypeLibrary()?.site.siteKey}</output>; }
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationPageExample library={first} scenario={scenario}><Probe id="first" /></ApplicationPageExample><ApplicationPageExample library={second} scenario={scenario}><Probe id="second" /></ApplicationPageExample></MemoryRouter>));
    expect(host.querySelector('[data-probe="first"]')?.textContent).toBe('asce');
    expect(host.querySelector('[data-probe="second"]')).toBeNull();
    expect(host.textContent).toContain('separate preview frames');
    expect(getPrototypeLibrary()).toBe(first);
    await act(async () => root.render(<MemoryRouter><PreviewRuntime library={first}><ApplicationPageExample key="isolated" library={second} scenario={scenario}><Probe id="nested" /></ApplicationPageExample><ApplicationPageExample library={first} scenario={scenario}><Probe id="sibling" /></ApplicationPageExample></PreviewRuntime></MemoryRouter>));
    expect(host.querySelector('[data-probe="nested"]')?.textContent).toBe('waepa-gi');
    expect(host.querySelector('[data-probe="sibling"]')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});

it('keeps preview session flags in memory across nested fixtures and resets them for a new example', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'preview-session');
  const scope = { siteKey: library.site.siteKey };
  const key = `applicationSession:${JSON.stringify([scope.siteKey, 'draft'])}`;
  const previous = sessionStorage.getItem(key);
  applicationSessionStorage.writeReviewSubmitted(true, scope);
  applicationSessionStorage.writeAdvisorApplicantFlow(true, scope);
  const persisted = sessionStorage.getItem(key);
  function Probe() {
    const state = useApplicationSession();
    return <><output>{JSON.stringify([state.reviewSubmitted, state.advisorApplicantFlow])}</output><button onClick={() => { state.markReviewSubmitted(); state.setAdvisorApplicantFlow(true); }}>Lock</button><button onClick={state.resetApplicationSession}>Reset</button></>;
  }
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = (id: string) => <PreviewRuntime key={id} library={library}><PreviewRuntime library={library}><Probe /></PreviewRuntime></PreviewRuntime>;
  try {
    await act(async () => root.render(render('first')));
    expect(host.querySelector('output')?.textContent).toBe('[false,false]');
    await act(async () => host.querySelectorAll('button')[0].click());
    expect(host.querySelector('output')?.textContent).toBe('[true,true]');
    expect(sessionStorage.getItem(key)).toBe(persisted);
    await act(async () => host.querySelectorAll('button')[1].click());
    expect(host.querySelector('output')?.textContent).toBe('[false,false]');
    await act(async () => host.querySelectorAll('button')[0].click());
    await act(async () => root.render(render('second')));
    expect(host.querySelector('output')?.textContent).toBe('[false,false]');
    expect(sessionStorage.getItem(key)).toBe(persisted);
  } finally {
    await act(async () => root.unmount()); host.remove();
    if (previous === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, previous);
  }
});

it('uses the common runtime and matching presentation contexts for Coverage examples', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const previous = getPrototypeLibrary();
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'coverage-owner');
  function Probe() {
    const active = getPrototypeLibrary()!;
    expect(useContext(ComponentContentContext)).toBe(active.content);
    expect(useContext(FieldDefinitionsContext)).toBe(active.fields);
    expect(useContext(ClientIconContext)).toBe(active.client.branding);
    return <output>{active.site.siteKey}</output>;
  }
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const scenario = coverageStoryScenarios.firstProduct;
  const coverage = <CoverageScenario catalog={catalog} scenario={scenario} entryScope={{ categories: 'LI' }}><Probe /></CoverageScenario>;
  try {
    await act(async () => root.render(<PreviewRuntime library={library}>{coverage}</PreviewRuntime>));
    const coverageSite = host.querySelector('output')!.textContent!;
    expect(getPrototypeLibrary()?.site.siteKey).toBe(coverageSite);
    expect(capturedCoverageEntryScope(coverageSite).category).toBe('LI');
    await act(async () => root.render(<PreviewRuntime library={library}><span>Parent restored</span></PreviewRuntime>));
    expect(getPrototypeLibrary()).toBe(library);
    expect(capturedCoverageEntryScope(coverageSite)).toEqual({});
    await act(async () => root.render(<><PreviewRuntime library={library}><span>Owner</span></PreviewRuntime>{coverage}</>));
    expect(host.querySelector('output')).toBeNull();
    expect(host.textContent).toContain('separate preview frames');
    expect(getPrototypeLibrary()).toBe(library);
    expect(capturedCoverageEntryScope(coverageSite)).toEqual({});
  } finally { await act(async () => root.unmount()); host.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
