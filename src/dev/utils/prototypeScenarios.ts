import { getEntryScopedCoverages } from '../../config/client/getActiveClientCoverages';
import samples from '../../../requirements/global/prototype-fixtures/application-scenarios.json';
import { getClientPageFields } from '../../config/clientFields/getClientPageFields';
import dayjs from 'dayjs';
import type { PrototypeLibrary } from '../../domain/prototypeLibrary';
import type { CoverageApplicantId } from '../../domain/coverage';
import { resolveCoverageJourneyPolicy } from '../../domain/coverageJourneyPolicy';
import { createCoverageJourneyFixture } from './coverageScenario';
import { journeyFormValues } from './journeyFormValues';
import { getDefaultValueForField, generateFormDataUpToPage } from './generateFormData';
import type { PageId } from '../../types';
import type { ApplicationFormValues } from '../../app/ApplicationFormContext';

export const prototypeScenarios = [
  { id: 'member', label: 'Member', applicants: ['member'] },
  { id: 'member-spouse', label: 'Member + spouse', applicants: ['member', 'spouse'] },
  { id: 'member-child', label: 'Member + child', applicants: ['member', 'child'] },
  { id: 'household', label: 'Member + spouse + child', applicants: ['member', 'spouse', 'child'] },
  { id: 'mixed-products', label: 'Life + disability', applicants: ['member'] },
  { id: 'no-products', label: 'Error: no eligible products', applicants: ['member'] },
  { id: 'required-error', label: 'Error: required information', applicants: ['member'] },
  { id: 'amount-error', label: 'Error: benefit amount', applicants: ['member'] },
  { id: 'receipt-approved', label: 'Receipt: conditionally approved', applicants: ['member'] },
  { id: 'receipt-referred', label: 'Receipt: referred', applicants: ['member'] },
  { id: 'receipt-declined', label: 'Receipt: declined', applicants: ['member'] },
] as const;
export type PrototypeScenarioId = typeof prototypeScenarios[number]['id'];
export function scenarioProducts(library: PrototypeLibrary, id: PrototypeScenarioId) {
  const scenario = prototypeScenarios.find(row => row.id === id)!;
  const offering = getEntryScopedCoverages(library);
  if (id === 'mixed-products' && !['LI', 'DI'].every(category => offering.some(product => product.categoryId === category && product.applicants.includes('member')))) return [];
  return offering.filter(product => scenario.applicants.every(applicant => product.applicants.includes(applicant as CoverageApplicantId))
    && (!id.startsWith('receipt-') || resolveCoverageJourneyPolicy(library.site, product.id)?.quickDecision != null || product.underwritingType === 'QD'));
}
/** Internal synthetic answers use the same policy-driven seeds as journey tests. */
export function buildPrototypeScenario(library: PrototypeLibrary, id: PrototypeScenarioId, productKey?: string): ApplicationFormValues {
  const scenario = prototypeScenarios.find(row => row.id === id)!;
  const product = scenarioProducts(library, id).find(row => row.id === productKey) ?? scenarioProducts(library, id)[0];
  if (!product) throw new Error('This scenario has no matching product in the effective Site.');
  const products = [product];
  if (id === 'mixed-products') {
    const offering = getEntryScopedCoverages(library);
    const life = offering.find(row => row.categoryId === 'LI' && row.applicants.includes('member'));
    const disability = offering.find(row => row.categoryId === 'DI' && row.applicants.includes('member'));
    if (!life || !disability) throw new Error('This Site does not offer a member Life and Disability combination.');
    products.splice(0, 1, life, disability);
  }
  const inputs = products.flatMap(product => scenario.applicants.map(applicant => {
    const policy = resolveCoverageJourneyPolicy(library.site, product.id)!;
    const mapping = policy.mappings.find(row => row.when.applicantKey === applicant && row.when.mode === 'new');
    if (!mapping) throw new Error(`Missing effective new-application mapping: ${product.id}/${applicant}`);
    return createCoverageJourneyFixture(library.site, product.id, mapping.when).input;
  }));
  const seed = journeyFormValues(library, inputs);
  for (const prefix of ['', 'spouse-']) for (const [key, value] of Object.entries(samples.baseline)) seed[prefix + key] = value;
  const membership = getClientPageFields('membership', seed).find(field => field.id === 'membership');
  if (membership?.options && !membership.options.some(option => option.value === seed.membership)) seed.membership = getDefaultValueForField(membership);
  const values = generateFormDataUpToPage('receipt', seed);
  for (const page of library.pages) for (const field of getClientPageFields(page.id as PageId, values)) if (field.inputType === 'checkbox' && field.required) values[field.id] = true;
  for (const surface of Object.values(library.fieldSurfaces)) for (const field of surface.mapping.fields) {
    if (field.inputType === 'checkbox' && field.required) values[field.id] = true;
    else if (['payment-information-opt-in', 'beneficiary-information-opt-in'].includes(field.id) && values[field.id] === undefined) values[field.id] = getDefaultValueForField(field);
  }
  const recordFields = library.fieldSurfaces.beneficiaryIndividual.mapping;
  values.beneficiaries = Object.fromEntries(inputs.filter(input => input.applicantKey !== 'child').map(input => [`${input.productKey}:${input.applicantKey}`, [{
    ...Object.fromEntries(recordFields.fields.map(field => [recordFields.fieldToKey[field.id], getDefaultValueForField(field)])),
    id: `scenario-${input.productKey}-${input.applicantKey}`, designation: 'primary', beneficiaryType: 'individual', share: 100,
  }]]));
  if (id === 'no-products') Object.assign(values, { 'birth-date': dayjs().subtract(110, 'year').format('YYYY-MM-DD'), dependents: [], coverageSelections: [], productApplicants: {} });
  if (id === 'required-error') values['first-name'] = '';
  if (id === 'amount-error') values.coverageAmounts = Object.fromEntries(inputs.map(input => [`${input.productKey}:${input.applicantKey}`, -1]));
  if (id.startsWith('receipt-')) values.qdDecisions = Object.fromEntries(inputs.map(input => [`${input.productKey}:${input.applicantKey}`, id === 'receipt-approved' ? 'conditionally-approved' : id === 'receipt-referred' ? 'referred' : 'soft-declined']));
  return values;
}
