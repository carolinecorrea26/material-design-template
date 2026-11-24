import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../requirements/global/content/application-ui.json', async original => {
  const module = await original<{ default: Record<string, unknown> }>();
  return { default: { ...module.default, 'interface.session-title': 'JSON session warning', 'interface.help-call': 'JSON help at {{phone}}', 'interface.edit-step': 'JSON edit {{label}}' } };
});
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { contentRows } from '../pages/admin/library/contentRows';
import { useInterfaceText } from '../components/content/useInterfaceText';
import SessionExpiryAlert from '../components/feedback/SessionExpiryAlert';
import ClientHelpBanner from '../components/layout/ClientHelpBanner';
import StepEditButton from '../components/navigation/StepEditButton';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function CopyProbe() { const text = useInterfaceText(); return <p>{text('session-title')}</p>; }

it('projects changed shared interface JSON into Library, application and Storybook', () => {
  const rows = contentRows(catalog, 'all');
  expect(rows.find(row => row.key === 'interface.session-title')?.defaultValue).toBe('JSON session warning');
  for (const library of [resolvePrototypeLibrary(catalog.data, 'asce', 'interface-copy'), buildGlobalTemplate(catalog)]) {
    installPrototypeLibrary(library);
    expect(renderToStaticMarkup(<CopyProbe />)).toContain('JSON session warning');
    expect(renderToStaticMarkup(<StepEditButton label="Profile" onClick={() => {}} />)).toContain('aria-label="JSON edit Profile"');
    expect(renderToStaticMarkup(<ClientHelpBanner client={library.client} />)).toContain('JSON help at');
  }
});

it('uses a later installed warning revision and keeps the shared timer and extension action', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'later-warning');
  library.content.shared.interfaceMessages['session-title'] = 'Current session warning';
  library.content.shared.interfaceMessages['session-keep-active'] = 'Extend this session';
  installPrototypeLibrary(library);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host), extend = vi.fn();
  try {
    await act(async () => root.render(<SessionExpiryAlert secondsLeft={61} onKeepActive={extend} />));
    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain('Current session warning');
    expect(dialog.querySelector('[role="timer"]')?.textContent).toBe('Time remaining: 1:01');
    await act(async () => [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Extend this session')!.click());
    expect(extend).toHaveBeenCalledOnce();
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it('offers chat only with its configured destination and opens that destination', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'configured-help'); installPrototypeLibrary(library);
  const client = structuredClone(library.client); client.features = { ...client.features, chat: true, chatUrl: undefined };
  client.support.helpPhone = { phone: '5551212121', phoneDisplay: '555-121-2121' };
  const withoutChat = renderToStaticMarkup(<ClientHelpBanner client={client} />);
  expect(withoutChat).not.toContain('Chat now');
  expect(withoutChat).toContain('href="tel:5551212121"');
  expect(withoutChat).toContain('555-121-2121');
  client.features.chatUrl = 'https://example.org/configured-chat';
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<ClientHelpBanner client={client} />));
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === 'Chat now')!.click());
    expect(open).toHaveBeenCalledWith(client.features.chatUrl, 'ClientChat', expect.any(String));
  } finally { await act(async () => root.unmount()); host.remove(); }
});
