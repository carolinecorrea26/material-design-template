import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { tutorials, tutorialSectionSteps } from './tutorials';
import { tutorialNotifications } from './tutorialNotifications';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';

it('references the existing email metadata instead of copying schedules', () => {
  for (const group of tutorialNotifications.types) for (const email of group.emails) {
    expect(email.template).toBe(emailTemplateRows.find(row => row.id === email.templateId));
  }
});
it('keeps each supplied current-model capture once, unchanged, and marks every uncaptured step', () => {
  const tutorial = tutorials.find(item => item.id === 'advisor-current')!;
  const screens = Object.values(tutorial.referenceScreens!);
  expect(new Set(screens.map(screen => screen.path)).size).toBe(screens.length);
  expect(new Set(screens.map(screen => screen.sha256)).size).toBe(screens.length);
  for (const screen of Object.values(tutorial.referenceScreens!)) {
    const bytes = readFileSync(`public/${screen.path}`);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(screen.sha256);
  }
  for (const section of tutorial.sections) for (const step of tutorialSectionSteps(tutorial, section)) {
    expect(step.title).toBeTruthy();
    for (const id of step.screens ?? []) expect(tutorial.referenceScreens?.[id]).toBeTruthy();
  }
  for (const step of Object.values(tutorial.steps)) {
    expect(step.screens?.length || step.placeholder).toBeTruthy();
    expect(step.preview).toBeUndefined();
  }
});

it('keeps applicant lookup and advisor authentication identities distinct in the current reference', () => {
  const tutorial = tutorials.find(item => item.id === 'advisor-current')!;
  expect(tutorial.exampleParticipants).toEqual({
    Applicant: { name: 'John Doe', email: 'caroline_correa@newyorklife.com' },
    Advisor: { email: 'location-central@ox6dxosw.mailosaur.net' },
  });
  for (const id of ['entry', 'eligibility', 'coverage', 'contact', 'profile', 'review-advisor', 'send', 'sent-confirmation', 'applicant-email', 'applicant-link-confirmation', 'applicant-method', 'applicant-code', 'review-applicant', 'edit-confirmation', 'saved-entry']) {
    expect(tutorial.steps[id].screens).toEqual([id]);
    expect(tutorial.steps[id].placeholder).toBeUndefined();
  }
  for (const id of ['advisor-email', 'advisor-link-confirmation', 'advisor-method', 'advisor-code', 'advisor-access']) {
    expect(tutorial.steps[id].actor).toBe('Advisor');
    expect(tutorial.steps[id].placeholder).toBeTruthy();
    expect(tutorial.steps[id].screens).toEqual([]);
  }
  expect(tutorial.notificationReferences?.sent.screens).toEqual({ Applicant: ['applicant-invitation'], Advisor: ['advisor-saved-email'] });
  expect(tutorial.steps['saved-entry'].paragraphs.join(' ')).toContain('applicant email');
  expect(tutorial.steps['advisor-email'].paragraphs.join(' ')).toContain('advisor email');
});
