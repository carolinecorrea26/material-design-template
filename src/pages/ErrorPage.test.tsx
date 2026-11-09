import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ErrorPage from "./ErrorPage";
import { applicationRecovery } from '../content/applicationRecovery';

const reset = vi.hoisted(() => ({ values: vi.fn(), session: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ resetValues: reset.values }) }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ resetApplicationSession: reset.session }) }));
vi.mock('../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../data/activeSite')>(), resolveSiteId: () => 'csea' }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it.each([500, 'session-expired', 'technical-error', 'application-unavailable'] as const)("provides recovery links for %s with the same site and resets only when starting anew", async status => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status={status} /></MemoryRouter>));
  expect(container.querySelector("h1")?.textContent).toBe(applicationRecovery[status].title);
  expect(container.textContent).toContain(applicationRecovery[status].message);
  expect(container.textContent).toContain(applicationRecovery[status].guidance);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  const links = [...container.querySelectorAll<HTMLAnchorElement>("a")];
  const resume = links.find(link => link.textContent === "Resume application")!;
  const start = links.find(link => link.textContent === "Start new application")!;
  expect(resume.getAttribute("href")).toBe("/resume?site=csea");
  expect(start.getAttribute("href")).toBe("/?site=csea");
  expect(container.textContent).toContain('Questions? We’re here to help.');
  if (status === 500) expect(container.textContent).toContain('500');
  else expect(container.querySelector('[data-testid="recovery-state-icon"]')).not.toBeNull();
  await act(async () => resume.click());
  expect(reset.values).not.toHaveBeenCalled();
  await act(async () => start.click());
  expect(reset.values).toHaveBeenCalledOnce();
  expect(reset.session).toHaveBeenCalledOnce();
});
it('offers home and resume on a missing page without clearing an application', async () => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status={404} /></MemoryRouter>));
  expect(container.querySelector('h1')?.textContent).toBe('Page not found');
  expect(container.textContent).toContain('404');
  const home = [...container.querySelectorAll<HTMLAnchorElement>('a')].find(link => link.textContent === 'Return to home')!;
  const resume = [...container.querySelectorAll<HTMLAnchorElement>('a')].find(link => link.textContent === 'Resume application')!;
  expect(home.getAttribute('href')).toBe('/?site=csea');
  expect(resume.getAttribute('href')).toBe('/resume?site=csea');
  await act(async () => home.click());
  await act(async () => resume.click());
  expect(reset.values).not.toHaveBeenCalled();
  expect(reset.session).not.toHaveBeenCalled();
});
it('provides a maintenance icon and support without navigation actions', async () => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status="maintenance" /></MemoryRouter>));
  expect(container.querySelector('h1')?.textContent).toBe('We’ll be back soon');
  expect(container.textContent).toContain('Questions? We’re here to help.');
  expect(container.textContent).not.toContain('Start new application');
  expect(container.querySelector('[data-testid="recovery-state-icon"]')).not.toBeNull();
  expect(container.querySelectorAll('a.MuiButton-root, button.MuiButton-root')).toHaveLength(0);
  expect(container.textContent).not.toContain('Return to home');
  expect(reset.values).not.toHaveBeenCalled();
  expect(reset.session).not.toHaveBeenCalled();
});

it('explains a technical resume issue and carries the application ID into support', async () => {
  await act(async () => root.render(<MemoryRouter><ErrorPage incident={{ code: 'APPLICATION_UNAVAILABLE', operation: 'resume', outcome: 'failed', applicationId: 'APP-12345678' }} /></MemoryRouter>));
  expect(container.textContent).toContain('We ran into a technical issue when trying to resume your application.');
  expect(container.textContent).toContain('Please try again or contact the administrator for help.');
  expect(container.querySelector('section')?.textContent).toContain('Please include your application ID for reference when contacting support: APP-12345678');
  expect(container.textContent).not.toContain('We can’t resume this application.');
});

it.each(['payment', 'submission'] as const)('offers a safe return for a confirmed %s failure without clearing the application', async operation => {
  await act(async () => root.render(<MemoryRouter><ErrorPage incident={{ code: 'TECHNICAL_ERROR', operation, outcome: 'failed', applicationId: 'APP-12345678' }} /></MemoryRouter>));
  expect(container.querySelector('h1')?.textContent).toBe('We ran into an issue');
  const link = [...container.querySelectorAll<HTMLAnchorElement>('a')].find(link => link.textContent === 'Return to payment')!;
  expect(link.getAttribute('href')).toBe('/payment?site=csea');
  await act(async () => link.click());
  expect(reset.values).not.toHaveBeenCalled();
  expect(reset.session).not.toHaveBeenCalled();
});

it.each(['payment', 'submission'] as const)('shows support without repeat or start-new links when %s is unconfirmed', async operation => {
  await act(async () => root.render(<MemoryRouter><ErrorPage incident={{ code: 'TECHNICAL_ERROR', operation, outcome: 'unknown', applicationId: 'APP-12345678' }} /></MemoryRouter>));
  expect(container.querySelector('h1')?.textContent).toBe('We ran into an issue');
  expect(container.textContent).toContain(`We can’t confirm the result of your ${operation} yet.`);
  expect(container.textContent).toContain('APP-12345678');
  expect([...container.querySelectorAll('a')].every(link => /^(tel:|mailto:|https:)/.test(link.getAttribute('href')!))).toBe(true);
  expect(reset.values).not.toHaveBeenCalled();
});
