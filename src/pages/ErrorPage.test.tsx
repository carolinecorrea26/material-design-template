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
it.each([500, 'session-expired', 'technical-error'] as const)("provides recovery links for %s with the same site and resets only when starting anew", async status => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status={status} /></MemoryRouter>));
  expect(container.querySelector("h1")?.textContent).toBe(applicationRecovery[status].title);
  expect(container.textContent).toContain(applicationRecovery[status].message);
  expect(container.textContent).toContain(applicationRecovery[status].guidance);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Questions? We’re here to help.');
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
  expect(container.querySelector('h1')?.textContent).toBe('This page does not exist');
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

it('uses the Error variant for an invalid HTTP request', async () => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status={400} /></MemoryRouter>));
  expect(container.querySelector('[data-recovery-family]')?.getAttribute('data-recovery-family')).toBe('error');
  expect(container.textContent).toContain('400');
});
it('uses generic technical content without operation-specific recovery controls', async () => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status="technical-error" /></MemoryRouter>));
  expect(container.textContent).toContain('There was a technical issue when trying to open this page. Please resume your application below or get assistance below.');
  expect(container.textContent).not.toContain('Return to payment');
  expect(container.textContent).not.toContain('payment or submission');
});
