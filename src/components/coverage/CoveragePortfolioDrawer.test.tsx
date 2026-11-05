import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import CoveragePortfolioDrawer from './CoveragePortfolioDrawer';

it('keeps rider amounts with their rider and excludes rider badges from coverage without riders', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<CoveragePortfolioDrawer open onClose={() => {}} />));
    const chips = [...document.querySelectorAll('.MuiChip-label')].map(chip => chip.textContent);
    expect(chips).toEqual(['Chronic Illness Rider (CIR)', 'Accidental Death Rider: $100,000']);
    const disabilityTitle = [...document.querySelectorAll('p')].find(element => element.textContent === 'Long Term Disability')!;
    const disabilityCard = disabilityTitle.parentElement!.parentElement!;
    expect(disabilityCard.textContent).toContain('$3,500 / month');
    expect(disabilityCard.querySelector('.MuiChip-root')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
