import { useLayoutEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import PreviewRuntime from '../src/dev/preview/PreviewRuntime';
import { type SharedCatalog } from '../src/persistence/sharedCatalog';
import { buildGlobalTemplate } from '../src/dev/storybook/globalTemplate';
import type { CoverageStoryScenario } from '../src/components/coverage/coverageStoryScenarios';
import { capturedCoverageEntryScope, restoreCoverageEntryScope } from '../src/config/client/coverageProductScope';

export type CoverageEntryExampleScope = { category?: string; categories?: string; prods?: string };

/** Coverage variations use the same runtime, field/content contexts and session
 * owner as other application examples. Transport remains fictional. */
export default function CoverageScenario({ catalog, scenario, children, entryScope }: { catalog: SharedCatalog; scenario: CoverageStoryScenario; children: ReactNode; entryScope?: CoverageEntryExampleScope }) {
  const fixture = useMemo(() => buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, scenario.coverage), [catalog, scenario.capability, scenario.coverage]);
  const quote = useMemo<NonNullable<ComponentProps<typeof PreviewRuntime>['quote']>>(() => async request => {
    if (scenario.rateUnavailable) throw new Error('Storybook unavailable estimate');
    return { mode: 'mock', premiumCents: Math.max(1200, Math.round(request.amount * 0.12)), expiresAt: Date.now() + 60000, authority: 'Synthetic Storybook rates; not an insurance quote' };
  }, [scenario.rateUnavailable]);
  return <PreviewRuntime library={fixture} quote={quote}><CoverageEntryScope siteKey={fixture.site.siteKey} entryScope={entryScope}>{children}</CoverageEntryScope></PreviewRuntime>;
}

function CoverageEntryScope({ siteKey, entryScope, children }: { siteKey: string; entryScope?: CoverageEntryExampleScope; children: ReactNode }) {
  const [applied, setApplied] = useState<{ value: CoverageEntryExampleScope | undefined } | null>(null);
  useLayoutEffect(() => {
    const previous = capturedCoverageEntryScope(siteKey);
    restoreCoverageEntryScope(siteKey, entryScope);
    setApplied({ value: entryScope });
    return () => restoreCoverageEntryScope(siteKey, previous);
  }, [entryScope, siteKey]);
  return applied && applied.value === entryScope ? children : null;
}
