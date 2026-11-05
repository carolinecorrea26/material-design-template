import { useLayoutEffect, useState, type ReactNode } from 'react';
import { getPrototypeLibrary, installPrototypeLibrary } from '../src/domain/prototypeLibrary';
import { type SharedCatalog } from '../src/persistence/sharedCatalog';
import { candidateMockRatingService } from '../src/mock/client';
import { buildGlobalTemplate, globalTemplateKey } from '../src/dev/storybook/globalTemplate';
import type { CoverageStoryScenario } from '../src/components/coverage/coverageStoryScenarios';

/** Install the same saved library as the prototype, with a local synthetic rate transport. */
export default function CoverageScenario({ catalog, scenario, children, entryScope }: { catalog: SharedCatalog; scenario: CoverageStoryScenario; children: ReactNode; entryScope?: { category: string; prods?: string } }) {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const previous = getPrototypeLibrary();
    const previousQuote = candidateMockRatingService.quote;
    const scopeKeys = ['coverage-category-scope', 'coverage-product-scope', 'coverage-featured-product'].map(prefix => `${prefix}:${globalTemplateKey}`);
    const previousScope = scopeKeys.map(key => window.sessionStorage.getItem(key));
    scopeKeys.forEach(key => window.sessionStorage.removeItem(key));
    if (entryScope) {
      window.sessionStorage.setItem(scopeKeys[0], entryScope.category);
      if (entryScope.prods !== undefined) window.sessionStorage.setItem(scopeKeys[1], entryScope.prods);
    }
    installPrototypeLibrary(buildGlobalTemplate(catalog, scenario.capability));
    candidateMockRatingService.quote = async request => {
      if (scenario.rateUnavailable) throw new Error('Storybook unavailable estimate');
      return { mode: 'mock', premiumCents: Math.max(1200, Math.round(request.amount * 0.12)), expiresAt: Date.now() + 60000, authority: 'Synthetic Storybook rates; not an insurance quote' };
    };
    setReady(true);
    return () => {
      installPrototypeLibrary(previous); candidateMockRatingService.quote = previousQuote;
      scopeKeys.forEach((key, index) => { const value = previousScope[index]; if (value === null) window.sessionStorage.removeItem(key); else window.sessionStorage.setItem(key, value); });
    };
  }, [catalog, scenario, entryScope]);
  return ready ? children : null;
}
