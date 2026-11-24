import { ThemeProvider, createTheme } from '@mui/material/styles';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../../domain/prototypeLibrary';
import { tutorials, tutorialSectionSteps } from '../../../domain/tutorials';
import TutorialsWorkspace from '../TutorialsWorkspace';
vi.mock('../../../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../../../data/activeSite')>(), resolveSiteId: () => 'asce' }));
beforeEach(() => {
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'tutorial-email-review'));
});
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });

it('reuses secure access for completion and saved advisor access, with the missing invitation and edit emails', () => {
  const tutorial = tutorials[0];
  for (const id of ['complete', 'revise']) {
    const steps = tutorialSectionSteps(tutorial, tutorial.sections.find(item => item.id === id)!);
    expect(steps.filter(step => tutorial.sequences['secure-access'].includes(step.id)).map(step => step.id)).toEqual(tutorial.sequences['secure-access']);
  }
  expect(tutorial.steps['applicant-invitation'].emailType).toBe('advisor-sent-to-applicant');
  expect(tutorial.steps['advisor-edit-email'].emailType).toBe('advisor-edit-request');
});
it('shows unnumbered action contents, canonical email HTML, live Site frames and access state', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const click = async (text: string) => {
    const button = [...node.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === text)!;
    expect(button).toBeTruthy(); await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={['/admin-center/tutorials/advisor?site=asce&section=complete']}><Routes><Route path="/admin-center/tutorials/:tutorialId" element={<TutorialsWorkspace />} /></Routes></MemoryRouter></ThemeProvider>));
    expect(node.querySelector('a[href*="/admin-center/library/flows"]')?.getAttribute('href')).toBe('/admin-center/library/flows?site=asce&flow=advisor');
    expect(node.textContent).not.toContain('Part 1 of');
    expect(node.textContent).not.toContain('Step in this part');
    expect(node.querySelectorAll('img[src*="tutorials/"]')).toHaveLength(0);
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('Continue my application');
    expect(node.querySelector('[aria-label="Application access in this example"]')?.textContent).toContain('Applicant: can access');
    expect(node.querySelector('[aria-label="Application access in this example"]')?.textContent).toContain('Advisor: can access');
    await click('Next step');
    expect(node.querySelector('#tutorial-step-title')?.textContent).toContain('Request a secure email link');
    expect(node.querySelector('iframe')?.getAttribute('src')).toContain('/admin-center/tutorial-preview/page');
    expect(node.querySelector('iframe')?.getAttribute('src')).toContain('page=resume');
    await click('Email notifications');
    const html = node.querySelector('iframe')?.getAttribute('srcdoc');
    expect(html).toContain('Applicant email'); expect(html).toContain('returning.user@example.com');
    await click('Troubleshooting');
    expect(node.textContent).toContain('Before DocuSign');
    expect(node.textContent).toContain('During or after DocuSign');
    expect(node.querySelector('iframe')).toBeNull();
    expect(node.querySelector('[aria-label="Application access in this example"]')).toBeNull();
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});

it.each([
  ['advisor', 'review'],
  ['advisor-current', 'review-applicant'],
])('shows advisor takeover before DocuSign and locks it at signing in %s', async (id, reviewStep) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const tutorial = tutorials.find(item => item.id === id)!;
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={[`/admin-center/tutorials/${id}?site=asce&section=complete&step=${reviewStep}`]}><Routes><Route path="/admin-center/tutorials/:tutorialId" element={<TutorialsWorkspace />} /></Routes></MemoryRouter></ThemeProvider>));
    const chips = () => node.querySelector('[aria-label="Application access in this example"]')?.textContent;
    expect(chips()).toContain('Advisor: can access');
    expect(chips()).toContain('Applicant: in application');
    expect(node.textContent).toContain('take over at any point before the applicant reaches DocuSign');
    const steps = tutorialSectionSteps(tutorial, tutorial.sections.find(section => section.id === 'complete')!);
    for (let index = steps.findIndex(step => step.id === reviewStep); steps[index].id !== 'signature'; index++) {
      await act(async () => [...node.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Next step')!.click());
    }
    expect(chips()).toContain('Advisor: locked');
    expect(chips()).toContain('Applicant: in application');
    expect(node.textContent).toContain('advisor can no longer access or take over');
    await act(async () => [...node.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Next step')!.click());
    expect(chips()).toContain('Advisor: locked');
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});

it('groups email types with canonical timing and both recipient messages, without workflow controls', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const click = async (text: string) => act(async () => [...node.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === text)!.click());
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={['/admin-center/tutorials/advisor?site=asce&section=notifications']}><Routes><Route path="/admin-center/tutorials/:tutorialId" element={<TutorialsWorkspace />} /></Routes></MemoryRouter></ThemeProvider>));
    expect(node.querySelector('[aria-label="Application access in this example"]')).toBeNull();
    expect(node.textContent).not.toContain('Next step');
    expect([...node.querySelectorAll('[aria-label="Notification types"] [role="tab"]')].map(tab => tab.textContent)).toEqual(['Application sent','Application pending','Application deleted','Application completed','Application edit requested']);
    expect(node.textContent).toContain('Description'); expect(node.textContent).toContain('When notified'); expect(node.textContent).toContain('Content');
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('Application sent for signature');
    await click('Applicant email');
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('prepared and is ready to complete and sign');
    await click('Application pending');
    expect(node.textContent).toContain('days 3, 5, 7, and 9');
    await click('Application deleted');
    expect([...node.querySelectorAll('[aria-label="Email recipient"] [role="tab"]')].map(tab => tab.textContent)).toEqual(['Advisor email', 'Applicant email']);
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('It can no longer be resumed.');
    await click('Applicant email');
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('please contact your advisor');
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).not.toContain('Start my application');
    await click('Application completed'); await click('Advisor email');
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('Application submitted');
    await click('Applicant email');
    expect(node.querySelector('iframe')?.getAttribute('srcdoc')).toContain('CONF-2026-001234');
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});

it('uses current-template captures and explicit placeholders without new-template live fallbacks', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const click = async (text: string) => act(async () => [...node.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === text)!.click());
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={['/admin-center/tutorials/advisor-current?site=asce&section=complete']}><Routes><Route path="/admin-center/tutorials/:tutorialId" element={<TutorialsWorkspace />} /></Routes></MemoryRouter></ThemeProvider>));
    expect(node.querySelector('h1')?.textContent).toBe('Advisor model (current template)');
    expect(node.querySelector('img')?.getAttribute('src')).toContain('advisor-current/applicant-invitation.png');
    expect(node.querySelector('iframe')).toBeNull();
    const people = node.querySelector('[aria-label="People in these screenshots"]');
    expect(people?.children[0].textContent).toContain('Applicant: John Doe — caroline_correa@newyorklife.com');
    expect(people?.children[1].textContent).toContain('Advisor — location-central@ox6dxosw.mailosaur.net');
    await click('Next step');
    expect(node.querySelector('img')?.getAttribute('src')).toContain('advisor-current/applicant-email.png');
    expect(node.querySelector('[aria-label="Screen placeholder"]')).toBeNull();
    await click('Revise a saved application');
    for (let i = 0; i < 3; i++) await click('Next step');
    expect(node.querySelector('img')?.getAttribute('src')).toContain('advisor-current/saved-entry.png');
    expect(node.textContent).toContain('following authentication steps use the advisor’s own email and phone');
    await click('Next step');
    expect(node.querySelector('[aria-label="Screen placeholder"]')?.textContent).toContain('Request an advisor secure link');
    await click('Email notifications');
    expect(node.querySelector('img')?.getAttribute('src')).toContain('advisor-current/advisor-saved-email.png');
    await click('Applicant email');
    expect(node.querySelector('img')?.getAttribute('src')).toContain('advisor-current/applicant-invitation.png');
    await click('Application pending');
    expect(node.querySelector('[aria-label="Screen placeholder"]')).not.toBeNull();
    expect(node.querySelector('iframe')).toBeNull();
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});


it.each(['advisor', 'advisor-current'])('shows the shared FAQ and DocuSign recovery boundary in %s', async id => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={[`/admin-center/tutorials/${id}?site=asce&section=troubleshooting`]}><Routes><Route path="/admin-center/tutorials/:tutorialId" element={<TutorialsWorkspace />} /></Routes></MemoryRouter></ThemeProvider>));
    expect(node.querySelector('[aria-label="Troubleshooting frequently asked questions"]')).not.toBeNull();
    expect(node.querySelector('#applicant-technical-issue-question')?.getAttribute('aria-expanded')).toBe('true');
    expect(node.querySelector('#applicant-technical-issue-answer')?.textContent).toContain('advisor can reopen the saved application and resend');
    expect(node.querySelector('#applicant-technical-issue-answer')?.textContent).toContain('Only the applicant can resume');
    expect(node.querySelector('#applicant-technical-issue-answer')?.textContent).toContain('advisor cannot reopen');
    await act(async () => node.querySelector<HTMLButtonElement>('#authentication-issue-question')!.click());
    expect(node.querySelector('#authentication-issue-question')?.getAttribute('aria-expanded')).toBe('true');
    expect(node.querySelector('#authentication-issue-answer')?.textContent).toContain('browser is up to date');
    expect(node.querySelector('#missing-application-emails-answer')?.textContent).toContain('spam or junk folder');
    expect(node.querySelector('iframe')).toBeNull();
    expect(node.querySelector('[aria-label="Application access in this example"]')).toBeNull();
    expect(node.querySelector('[aria-label="Topics in this action"]')).toBeNull();
    expect(node.textContent).not.toContain('Next step');
    expect(node.querySelector('[aria-label="Screen placeholder"]')).toBeNull();
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});
