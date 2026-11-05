import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import ApplicationEstimate from './ApplicationEstimate';
it('keeps the form action in the estimate surface and reserves space at the document end', async () => {
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
 const container=document.createElement('div');document.body.append(container); const root=createRoot(container);
 try {
  await act(async()=>root.render(<ApplicationEstimate display={{status:'available',amount:35}} items={[]} actions={<button form="review-form">Next</button>} />));
  const surface=document.querySelector('aside[aria-label="Application estimate and actions"]')!;
  expect(surface.querySelector('button[form="review-form"]')?.textContent).toBe('Next');
  expect(document.querySelector('[data-estimate-spacer]')?.parentElement).toBe(document.body);
  expect(surface.textContent).toContain('$35.00');
  await act(async()=>root.render(<ApplicationEstimate display={{status:'hidden'}} items={[]} actions={<button form="review-form">Next</button>} />));
  expect(document.querySelector('aside[aria-label="Application estimate and actions"]')).toBeNull();
  expect(document.querySelector('[data-estimate-spacer]')).toBeNull();
  expect(container.querySelector('button')?.textContent).toBe('Next');
 } finally {await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();}
});
