import { candidateMockRatingService } from '../src/mock/client';
import { ComponentContentContext } from "../src/components/content/ComponentContentContext";
import { FieldDefinitionsContext } from "../src/components/forms/FieldDefinitionsContext";
import { ClientIconContext } from "../src/components/content/ClientIconContext";
import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from '@mui/material';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ApplicationFormContext, type ApplicationFormValues } from '../src/app/ApplicationFormContext';
import { getPrototypeLibrary, installPrototypeLibrary, type PrototypeLibrary } from '../src/domain/prototypeLibrary';
import { type SharedCatalog } from '../src/persistence/sharedCatalog';
import { withApplicantsApplying } from '../src/utils/applicantsApplying';

import { buildGlobalTemplate, type TemplateCapability } from '../src/dev/storybook/globalTemplate';

export type ApplicationPageScenario = { capability: TemplateCapability; description: string; values: ApplicationFormValues; estimatedRates?: boolean; configureFixture?: (fixture: PrototypeLibrary) => void };

/** Real page and saved Site rules, with fictional answers held only in React state. */
export default function ApplicationPageExample({ catalog, scenario, children }: { catalog: SharedCatalog; scenario: ApplicationPageScenario; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const fixture = useMemo(() => {
    const library = buildGlobalTemplate(catalog, scenario.capability);
    scenario.configureFixture?.(library);
    return library;
  }, [catalog, scenario]);
  const location = useLocation();
  const [startPath] = useState(location.pathname);
  const [values, setValues] = useState<ApplicationFormValues>(() => withApplicantsApplying(scenario.values) as ApplicationFormValues);
  const setPageValues = useCallback((patch: ApplicationFormValues) => setValues(current => withApplicantsApplying({ ...current, ...patch }) as ApplicationFormValues), []);
  useLayoutEffect(() => {
    const previous = getPrototypeLibrary();
    const previousQuote = candidateMockRatingService.quote;
    if (scenario.estimatedRates) candidateMockRatingService.quote = async request => ({ mode: 'mock', premiumCents: Math.round(request.amount * 0.12), expiresAt: Date.now() + 60000, authority: 'Synthetic Storybook estimate; not an insurance quote' });
    installPrototypeLibrary(fixture);
    setReady(true);
    return () => { installPrototypeLibrary(previous); if (scenario.estimatedRates) candidateMockRatingService.quote = previousQuote; };
  }, [fixture]);
  if (!ready) return null;
  return <ComponentContentContext value={fixture.content}><FieldDefinitionsContext value={fixture.fields}><ClientIconContext value={fixture.client.branding}><ApplicationFormContext.Provider value={{ values, setPageValues, resetValues: () => setValues({}) }}>
      <Routes>
        <Route path={startPath} element={<>{children}</>} />
        <Route path="*" element={<Alert severity="success">The application would now open {location.pathname}. This local example stops here.</Alert>} />
      </Routes>
  </ApplicationFormContext.Provider></ClientIconContext></FieldDefinitionsContext></ComponentContentContext>;
}
