import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { afterEach, expect, it, vi } from 'vitest';
import { createAppTheme } from '../../app/theme';
import { DependentOnlyCoverage, EditApplication } from '../../components/layout/ConfirmationDialog.stories';
import { Default as SendApplication, ToAdvisor } from '../../components/layout/SendApplicationDialog.stories';
import { Default as Modal } from '../../components/layout/AppModal.stories';
import { Default as Drawer } from '../../components/layout/AppDrawer.stories';
import { getContent } from '../../content';

let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; container?.remove(); vi.unstubAllGlobals();
});

const cases = [
  ['dependent-only confirmation', DependentOnlyCoverage, () => getContent().dialogs.confirmation.dependentCoverage.title],
  ['edit-application confirmation', EditApplication, () => getContent().dialogs.confirmation.editApplication.title],
  ['send to applicant', SendApplication, () => getContent().dialogs.sendApplication.sendToApplicant.title],
  ['request edits from advisor', ToAdvisor, () => getContent().dialogs.sendApplication.requestEditToApplication.title],
  ['modal container', Modal, () => 'Modal title'],
  ['drawer container', Drawer, () => 'Drawer title'],
] as const;

it.each(cases)('shows %s immediately, without an extra trigger step', async (_name, story, title) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  const render = story.render as (args: Record<string, unknown>, context: unknown) => ReactNode;
  await act(async () => root!.render(<MemoryRouter><ThemeProvider theme={createAppTheme()}>{render({}, {})}</ThemeProvider></MemoryRouter>));
  expect(document.body.textContent).toContain(title());
  expect(document.body.textContent).not.toMatch(/Trigger confirmation|Trigger send confirmation|Reopen dialog/);
  // Default-open MUI overlays lock the page while their real contents are shown.
  expect(document.body.style.overflow).toBe('hidden');
});
