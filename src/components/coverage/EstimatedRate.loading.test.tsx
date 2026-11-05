import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { Typography } from '@mui/material';
import EstimatedRate from './EstimatedRate';

it('keeps the estimate label and amount reservation while presenting only the loading status', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    const render = async (isCalculating: boolean) => act(async () => root.render(<Typography>Est. cost: <EstimatedRate amount={262.5} suffix="/mo" isCalculating={isCalculating} sx={{ fontSize: '1.25rem' }} /></Typography>));
    await render(false);
    const amount = container.querySelector('span > span')!;
    expect(amount.textContent).toBe('$262.50/mo');
    await render(true);
    expect(container.textContent).toContain('Est. cost:');
    expect(amount.isConnected).toBe(true);
    expect(amount.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('Recalculating estimated cost');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-hidden')).toBe('true');
    await render(false);
    expect(amount.getAttribute('aria-hidden')).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
