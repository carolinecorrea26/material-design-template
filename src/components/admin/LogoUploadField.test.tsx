import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import LogoUploadField from './LogoUploadField';

it('rejects unsupported files, previews a dropped logo, and lets the user remove it', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const uploaded = vi.fn();
  function Form() {
    const [logo, setLogo] = useState('');
    return <LogoUploadField label="Association logo" value={logo} onChange={value => { uploaded(value); setLogo(value); }} required />;
  }
  try {
    await act(async () => root.render(<Form />));
    const dropZone = container.querySelector('[role="group"]')!;
    const drop = (file: File) => {
      const event = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
      dropZone.dispatchEvent(event);
    };
    await act(async () => drop(new File(['example'], 'logo.svg', { type: 'image/svg+xml' })));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Choose one PNG');
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jTioAAAAASUVORK5CYII='), code => code.charCodeAt(0));
    await act(async () => {
      drop(new File([bytes], 'logo.png', { type: 'image/png' }));
      await vi.waitFor(() => expect(uploaded).toHaveBeenCalledOnce());
    });
    expect(container.textContent).toContain('logo.png');
    expect(container.querySelector('img')?.alt).toBe('Association logo preview');
    const remove = [...container.querySelectorAll('button')].find(button => button.textContent === 'Remove')!;
    await act(async () => remove.click());
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('input[type=file]')).toBeTruthy();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
