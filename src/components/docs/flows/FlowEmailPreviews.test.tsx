import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../../domain/prototypeLibrary';
import { allFlows } from '../../../content/docs/flows';
import { flowStages } from '../../../domain/flowStages.mjs';
import { getMockEmailSamples } from '../../../utils/mockEmail';
import { emailTemplateRows } from '../emailTemplateRows';
import FlowEmailPreviews from './FlowEmailPreviews';
import advisorFixture from '../../../../requirements/global/prototype-fixtures/advisor.json';

const advisor = allFlows.find(flow => flow.id === 'advisor')!;
beforeEach(() => {
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'flow-email-preview'));
});
afterEach(() => installPrototypeLibrary(null));
const cases = [
  ['handoff', ['Advisor', 'Applicant']],
  ['corrections', ['Advisor']],
  ['receipt', ['Applicant', 'Advisor']],
  ['notifications', ['Applicant', 'Advisor', 'Advisor', 'Applicant']],
  ['advisor-access', ['Advisor']],
] as const;

it.each(cases)('%s shows source-linked recipients and renders the canonical email lazily', async (id, recipients) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const stage = flowStages(advisor).find(stage => stage.id === id)!;
  const emails = stage.nodes.flatMap(node => (node.emailTemplateKeys ?? []).map(key => {
    const template = emailTemplateRows.find(template => template.type === key)!;
    return { ...template, key, label: template.title, recipient: node.emailRecipient ?? template.recipient };
  }));
  expect(emails.map(email => email.recipient)).toEqual(recipients);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter><FlowEmailPreviews emails={emails} siteId="asce" /></MemoryRouter>));
    expect(host.querySelector('iframe')).toBeNull();
    await act(async () => host.querySelector<HTMLButtonElement>('button')!.click());
    const email = emails[0];
    const message = getMockEmailSamples('asce', { resumeRecipient: email.recipient }).find(message => message.type === email.type)!;
    expect(host.querySelector('iframe')?.getAttribute('srcdoc')).toBe(message.html);
    expect(host.textContent).toContain(message.toEmail);
    expect(host.textContent).toContain(message.subject);
    expect(host.querySelector('a')?.getAttribute('href')).toContain(`q=${email.key}`);
    if (id === 'advisor-access') {
      expect(message.toEmail).toBe(advisorFixture.email);
      expect(message.html).not.toContain('Dear Applicant');
    }
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});
