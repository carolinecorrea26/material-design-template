import { getResumePolicy } from '../../config/resumePolicy';
import PreviewRuntime from './PreviewRuntime';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert } from '@mui/material';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ApplicationFormContext, type ApplicationFormValues } from '../../app/ApplicationFormContext';
import { resolvePrototypeLibrary, type PrototypeLibrary } from '../../domain/prototypeLibrary';
import { type SharedCatalog } from '../../persistence/sharedCatalog';
import { withApplicantsApplying } from '../../utils/applicantsApplying';

import { buildGlobalTemplate, type TemplateCapability, type MembershipExampleConfiguration, type EligibilityExampleConfiguration, type BeneficiaryExampleConfiguration, type ContactExampleConfiguration, type ProfileExampleConfiguration, type ReviewExampleConfiguration, type HealthExampleConfiguration, type PaymentExampleConfiguration, type HomeExampleConfiguration } from '../storybook/globalTemplate';

export type ApplicationPageScenario = { siteKey?: string; capability: TemplateCapability; membership?: MembershipExampleConfiguration; eligibility?: EligibilityExampleConfiguration; beneficiary?: BeneficiaryExampleConfiguration; contact?: ContactExampleConfiguration; profile?: ProfileExampleConfiguration; review?: ReviewExampleConfiguration; health?: HealthExampleConfiguration; payment?: PaymentExampleConfiguration; home?: HomeExampleConfiguration; savedApplicationAgeDays?: number; description: string; values: ApplicationFormValues; estimatedRates?: boolean };

/** Real page and saved Site rules, with fictional answers held only in React state. */
export default function ApplicationPageExample({ catalog, scenario, children, library: suppliedLibrary, onSave }: { catalog?: SharedCatalog; library?: PrototypeLibrary; onSave?: (values: ApplicationFormValues) => void; scenario: ApplicationPageScenario; children: ReactNode }) {
  const fixture = useMemo(() => {
    if (suppliedLibrary) return suppliedLibrary;
    if (!catalog) throw new Error('A resolved preview Library or shared catalog is required');
    const library = scenario.siteKey ? resolvePrototypeLibrary(catalog.data, scenario.siteKey, 'storybook:effective-site') : buildGlobalTemplate(catalog, scenario.capability, scenario.membership, scenario.eligibility, undefined, scenario.beneficiary, scenario.contact, scenario.profile, scenario.review, scenario.health, scenario.payment, scenario.home);
    return library;
  }, [catalog, scenario, suppliedLibrary]);
  return <PreviewRuntime library={fixture} estimatedRates={scenario.estimatedRates}><ApplicationPageState scenario={scenario} onSave={onSave}>{children}</ApplicationPageState></PreviewRuntime>;
}
function ApplicationPageState({ scenario, onSave, children }: { scenario: ApplicationPageScenario; onSave?: (values: ApplicationFormValues) => void; children: ReactNode }) {
  const location = useLocation();
  const [startPath] = useState(location.pathname);
  const [exampleTime] = useState(Date.now);
  const [values, setValues] = useState<ApplicationFormValues>(() => withApplicantsApplying(scenario.values) as ApplicationFormValues);
  const setPageValues = useCallback((patch: ApplicationFormValues) => setValues(current => withApplicantsApplying({ ...current, ...patch }) as ApplicationFormValues), []);
  return <ApplicationFormContext.Provider value={{ values, setPageValues, ...(scenario.savedApplicationAgeDays !== undefined ? { savedApplicationExpiresAt: exampleTime + (getResumePolicy().retentionDays - scenario.savedApplicationAgeDays) * 86400000 } : {}), restoreApplication: application => setValues(application.values as ApplicationFormValues), saveApplication: onSave ? async next => { onSave(next); return null; } : undefined, resetValues: () => setValues({}) }}>
      <Routes>
        <Route path={startPath} element={<>{children}</>} />
        <Route path="*" element={<Alert severity="success">The application would now open {location.pathname}. This local example stops here.</Alert>} />
      </Routes>
  </ApplicationFormContext.Provider>;
}
