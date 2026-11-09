import asceEligibility from "../requirements/parked/sites/asce/eligibility.json";
import React from 'react';
import { Alert } from '@mui/material';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ApplicationFormContext, type ApplicationFormValues } from '../src/app/ApplicationFormContext';
import { withApplicantsApplying } from '../src/utils/applicantsApplying';
import CoverageScenario from './coverageScenario';
import { coverageStoryBaseValues, type CoverageStoryScenario } from '../src/components/coverage/coverageStoryScenarios';
import type { SharedCatalog } from '../src/persistence/sharedCatalog';

export type CoveragePageScenario = CoverageStoryScenario & { entryScope?: { category: string; prods?: string } };
export const coveragePageScenarios = {
  campaignAmounts: { capability: 'multipleTerms', categories: ['LI'], description: 'Reveal products to see the amt campaign preset of $200,000 for Term Life with its dropdown locked by dprods. The preset does not add coverage; Add coverage is still a separate action. Uses the same page and amount resolver as the prototype.', values: { dependents: [], gender: 'male', smoker: 'no', coverageEntryScope: { amt: 'G-10500-1_200000', dprods: 'G-10500-1' } } },
  verifiedExistingMember: { capability: 'multipleTerms', categories: [], description: 'Post-verification ASCE existing-member-with-existing-coverage flow. Open View coverage portfolio, then select Life and reveal products: member Term Life offers at most $750,000 after the fixture’s $250,000 in force. Other product and combined Life capacity uses the same JSON portfolio and configured limits. The journey test performs lookup, address collection and verification. No live TPA service is connected.', values: { ...asceEligibility.tpa.prototypeRecords[0].facts, membership: 'yes', 'zip-postal-code': '10001', 'tpa-existing-member': true, 'tpa-active-coverage': true, 'tpa-verified': true, 'tpa-portfolio-enabled': true } },
  interactive: { capability: 'optionalBeneficiaries', categories: [], description: 'Choose a category, complete its questions, reveal products and add coverage. Next runs the real page validation. Prices are synthetic; application answers remain local to this example.' },
  emptyEntry: { capability: 'physicianMembership', categories: [], entryScope: { category: 'DI', prods: 'G-00000-0' }, description: 'This entry link matches no products. The real page displays its unavailable-link notice.' },
  restrictedEntry: { capability: 'physicianMembership', categories: ['DI'], entryScope: { category: 'DI', prods: 'G-30639-0' }, description: 'The saved Life selection is outside this disability entry link. Remove unavailable selections explicitly; the allowed disability selection remains.', values: { membership: 'physician', coverageSelections: ['di-step-rated', 'li-term'], productApplicants: { 'di-step-rated': ['member'], 'li-term': ['member'] }, coverageAmounts: { 'di-step-rated:member': 1000, 'li-term:member': 100000 } } },
  dependentOnly: { capability: 'professionalEducation', categories: ['LI'], description: 'Only the spouse has selected coverage. After products load, choose Next to open the real confirmation. Cancel keeps you here; Continue completes navigation within this example.', values: { dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', 'spouse-gender': 'female', 'spouse-smoker': 'no', 'spouse-hours-worked-per-week': '40', 'spouse-average-monthly-income': '8000', coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['spouse'] }, coverageAmounts: { 'li-group-term:spouse': 100000 } } },
  referenceRates: { capability: 'occupationAndChildNotice', categories: ['DI'], description: 'Reveal products and open View rate table to inspect the sample reference rates in the real Coverage page.', values: { 'state-province': 'NY', 'zip-postal-code': '10001', 'csea-occupation-group': 'group-1-clerical' } },
} satisfies Record<string, CoveragePageScenario>;

function LocalPage({ scenario, children }: { scenario: CoveragePageScenario; children: React.ReactNode }) {
  const location = useLocation();
  const [startPath] = React.useState(location.pathname);
  const [values, setValues] = React.useState<ApplicationFormValues>(() => withApplicantsApplying({ ...coverageStoryBaseValues, ...scenario.values, selectedCategoryChips: scenario.categories }) as ApplicationFormValues);
  const setPageValues = React.useCallback((patch: ApplicationFormValues) => setValues(current => withApplicantsApplying({ ...current, ...patch }) as ApplicationFormValues), []);
  return <ApplicationFormContext.Provider value={{ values, setPageValues, resetValues: () => setValues({}) }}>
    <Routes>
      <Route path={startPath} element={<>{children}</>} />
      <Route path="*" element={<Alert severity="success">Coverage completed. The application would now open {location.pathname}. This example stops here.</Alert>} />
    </Routes>
  </ApplicationFormContext.Provider>;
}

export default function CoveragePageExample({ catalog, scenario, children }: { catalog: SharedCatalog; scenario: CoveragePageScenario; children: React.ReactNode }) {
  return <CoverageScenario catalog={catalog} scenario={scenario} entryScope={scenario.entryScope}>
    <LocalPage scenario={scenario}>{children}</LocalPage>
  </CoverageScenario>;
}
