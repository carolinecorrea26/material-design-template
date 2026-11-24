import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { formatUSD } from '../../utils/formatUSD';
import { requirementText } from '../../domain/requirementContent';
import CoverageNeedsCalculator from './CoverageNeedsCalculator';

afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

it('uses projected fields and wording while preserving the calculator result', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const library = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'needs-copy');
  library.content.coverage.needsCalculator.intro = 'Configured calculator introduction.';
  library.content.coverage.needsCalculator.title = 'Configured estimate title';
  library.content.coverage.needsCalculator['income-label'] = 'Configured income:';
  library.fieldSurfaces.needsCalculator.mapping.fields[0].label = 'Configured income field';
  installPrototypeLibrary(library);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<CoverageNeedsCalculator />));
    expect(host.textContent).toContain('Configured calculator introduction.');
    expect(host.textContent).toContain('Configured income field');
    for (const [name, value] of [['needs-annual-income', '100000'], ['needs-years-to-replace', '10'], ['needs-outstanding-debts', '5000'], ['needs-existing-coverage', '100000']]) {
      const input = host.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    expect(host.querySelector('[role="status"]')?.textContent).toContain('Configured estimate title');
    expect(host.querySelector('[role="status"]')?.textContent).toContain('Configured income:');
    expect(host.querySelector('[role="status"]')?.textContent).toContain('$905,000');
  } finally {
    await act(async () => root.unmount()); host.remove();
  }
});

it('uses the existing canonical unavailable-rate wording for non-finite currency values', () => {
  expect(formatUSD(NaN)).toBe(requirementText('coverage.estimated-rate.estimate-unavailable'));
  expect(formatUSD(Infinity)).toBe(requirementText('coverage.estimated-rate.estimate-unavailable'));
});
