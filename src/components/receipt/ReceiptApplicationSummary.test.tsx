import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import ReceiptApplicationSummary from './ReceiptApplicationSummary';
import EstimatedRate from '../coverage/EstimatedRate';

it('keeps selected billing periods and suppressed estimates distinct without implying a charge', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<ReceiptApplicationSummary items={[
      { id: 'monthly', productName: 'Life', applicantLabel: 'You', applicant: 'member', requestedAmount: 100000, estimatedPayment: <EstimatedRate amount={10} suffix="/mo" />, paymentMethod: 'Bank account' },
      { id: 'annual', productName: 'Term life', applicantLabel: 'Your spouse', applicant: 'spouse', requestedAmount: 200000, estimatedPayment: <EstimatedRate amount={240} suffix="/yr" />, paymentMethod: 'Bill me' },
      { id: 'suppressed', productName: 'Other coverage', applicantLabel: 'You', applicant: 'member', requestedAmount: null },
    ]} />));
    expect(container.textContent).toContain('$10.00/mo');
    expect(container.textContent).toContain('$240.00/yr');
    const suppressed = container.querySelector('[aria-label="Other coverage · You receipt"]')!;
    expect(suppressed.textContent).not.toContain('Estimated payment');
    expect(suppressed.textContent).toContain('Not available');
    expect(suppressed.textContent).toContain('Not selected');
    expect(container.textContent).not.toContain('Paid');
    await act(async () => root.render(<ReceiptApplicationSummary items={[]} />));
    expect(container.textContent).toBe('');
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
