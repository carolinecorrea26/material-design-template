import type { Meta, StoryObj } from '@storybook/react-vite';
import Contact from '../../pages/Contact';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const baseValues = {
  membership: 'yes', 'birth-date': '1990-01-01', 'zip-postal-code': '22101', 'state-province': 'VA',
  dependents: [], coverageSelections: ['li-10yr'],
  productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 },
};
const homeAddress = { 'street-address': '100 Example Street', city: 'Example City', state: 'VA', 'zip-code': '22101' };
const scenarios = {
  spouseDisability: { capability: 'standard' as const, description: 'Spouse-only DI still collects the member address and employer because spouse disability depends on member employment. Spouse personal contact fields remain separate.', values: { ...baseValues, ...homeAddress, dependents: ['spouse'], coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['spouse'] }, coverageAmounts: { 'di-ltd:spouse': 1000 }, 'correspondence-to': 'residential', 'business-address-same-as-home': true } },
  dependentOnly: { capability: 'standard' as const, description: 'Dependent-only coverage still requires the member residential address and correspondence choice. Spouse contact remains separate.', values: { ...baseValues, ...homeAddress, dependents: ['spouse'], coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['spouse'] }, coverageAmounts: { 'li-10yr:spouse': 100000 } } },
  empty: { capability: 'standard' as const, description: 'Review residential address and correspondence. Next runs the real required-field validation. Choosing business correspondence reveals the saved business-address fields.', values: baseValues },
  completed: { capability: 'standard' as const, description: 'Fictional restored residential address. Review editing, correspondence changes and Next validation.', values: { ...baseValues, ...homeAddress, 'correspondence-to': 'residential' } },
  business: { capability: 'standard' as const, description: 'Disability selection reveals Business / Employer information. Toggle same-as-home, edit the home address, then uncheck to review copied values and separate business edits.', values: { ...baseValues, ...homeAddress, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 }, 'correspondence-to': 'residential', 'business-address-same-as-home': true } },
  spouse: { capability: 'standard' as const, description: 'Member and spouse contact details use separate saved field bindings. Applicant labels follow the selected coverage applicants.', values: { ...baseValues, ...homeAddress, dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000 } } },
  productScoped: { capability: 'standard' as const, contact: { hideBusinessAddress: true, hideCorrespondence: true, businessAddressProducts: ['di-ltd'] }, description: 'Product-scoped business details: the saved product-scoped business section appears, while correspondence remains hidden.', values: { ...baseValues, ...homeAddress, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } } },
  hidden: { capability: 'standard' as const, contact: { hideBusinessAddress: true }, description: 'Complete business-address hiding also hides correspondence and saves Home. A retained Business answer is replaced while separate business-address drafts remain retained.', values: { ...baseValues, ...homeAddress, coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 }, 'correspondence-to': 'business' } },
} satisfies Record<string, ApplicationPageScenario>;

const meta = {
  id: "pages-contact-whole-page",
  title: "Components/Pages/Contact/Whole page",
  component: Contact,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen',
    review: {
      scope: 'page-composition',
      focus: 'Review Contact’s wording, section order, correspondence, same-as-home copying and conditional business/spouse sections. Shared address and phone UI are reviewed once in their own examples.',
      references: [{ label: 'Shared address component', storyId: 'forms-field-groups-address-fields--default' }, { label: 'Shared phone component', storyId: 'forms-phonefield--independent-contacts' }],
    },
    docs: { description: { component: 'The real Contact page and shared application frame, with residential address, conditional business/employer details and spouse contact information. Fresh-start global definitions, explicit synthetic configuration assignments and fictional local answers; navigation stops at a local message.' } } },
} satisfies Meta<typeof Contact>;
export default meta;
const example = (scenario: ApplicationPageScenario): StoryObj<typeof meta> => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Contact /></ApplicationPageExample> });
export const Empty = example(scenarios.empty);
export const RestoredAddress = example(scenarios.completed);
export const BusinessSameAsHome = example(scenarios.business);
export const MemberAndSpouse = example(scenarios.spouse);
export const ProductScopedBusinessInformation = example(scenarios.productScoped);
export const BusinessInformationHidden = example(scenarios.hidden);

export const DependentOnly = example(scenarios.dependentOnly);

export const SpouseDisability = example(scenarios.spouseDisability);
