import { afterEach, expect, it, vi } from 'vitest';
import { printContent } from './PrintAction';

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); vi.useRealTimers(); });
it('prints only the selected disclosure and removes its isolated frame after printing', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<main>Unrelated application answers</main><section id="consent" aria-label="Electronic Consent"><h2>Consent</h2><p>Only this document</p></section>';
  printContent('consent');
  const frame = document.querySelector('iframe')!;
  const print = vi.spyOn(frame.contentWindow!, 'print').mockImplementation(() => {});
  vi.spyOn(frame.contentWindow!, 'focus').mockImplementation(() => {});
  await Promise.resolve();
  expect(print).toHaveBeenCalledOnce();
  expect(frame.contentDocument?.body.textContent).toBe('ConsentOnly this document');
  expect(frame.contentDocument?.title).toBe('Electronic Consent');
  frame.contentWindow!.dispatchEvent(new Event('afterprint'));
  expect(document.querySelector('iframe')).toBeNull();
});
