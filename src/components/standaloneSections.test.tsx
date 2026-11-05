import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as library from '../domain/prototypeLibrary';
import * as activeClient from '../config/client/getActiveClient';
import * as activeSite from '../data/activeSite';
import { fieldCatalog } from '../config/fields';
import { pageSections } from '../config/pageSections/pageSections';
import { demoClient } from '../config/clients/demo';
import type { FormRouteRenderProps } from '../app/RoutePage';
import ProfileSections from './profile/ProfileSections';
import ReviewSections from './review/ReviewSections';
import ApplicationDocumentPreview from './content/ApplicationDocumentPreview';
import { reviewDefaults } from '../content/defaults/review';
import ContactSections from './contact/ContactSections';
import EligibilitySections from './eligibility/EligibilitySections';
import MemberInformation from './membership/MemberInformation';
import MembershipStatus from './membership/MembershipStatus';
import HomeHero from './home/HomeHero';
import HomeCoverageSection from './home/HomeCoverageSection';
import AssociationIntroduction from './home/AssociationIntroduction';
import UnderwriterCredentials from './home/UnderwriterCredentials';
import HowApplyingWorksPanel from './home/HowApplyingWorksPanel';
import { useComponentContent } from './content/ComponentContentContext';
import CoverageQuestions from './coverage/CoverageQuestions';
import { ProductCard } from './coverage/ProductCatalog';
import CoverageCart from './coverage/CoverageCart';
import EstimatedRate from './coverage/EstimatedRate';
import TotalCostSummary from './coverage/TotalCostSummary';
import BeneficiaryProductRecords from './beneficiary/BeneficiaryProductRecords';
import type { CoverageDefinition } from '../domain/coverage';

const unavailable = () => { throw new Error('Standalone component attempted to read a Site/application rule'); };
beforeEach(() => {
  vi.spyOn(library, 'getPrototypeLibrary').mockImplementation(unavailable);
  vi.spyOn(activeClient, 'getActiveClient').mockImplementation(unavailable);
  vi.spyOn(activeSite, 'getActiveSite').mockImplementation(unavailable);
});
afterEach(() => vi.restoreAllMocks());

const product: CoverageDefinition & { featured: boolean } = { id: 'example-life', name: 'Example Term Life', code: 'LI', planCode: { primary: 'LI' }, definition: 'Example benefit', underwritingType: 'FUW', options: [], categoryId: 'LI', applicants: ['member'], coverageAmounts: [{ scope: { applicantType: 'member' }, selections: [{ type: 'amountList', values: [100000, 200000] }] }], featured: false };
function Form({ children }: { children: (props: FormRouteRenderProps) => React.ReactNode }) {
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: {} });
  return children({ control: form.control, errors: form.formState.errors, setValue: form.setValue, trigger: form.trigger,
    watchedValues: form.watch(), allFields: Object.values(fieldCatalog), pageSections: [] });
}
const render = (node: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

it('renders Contact sections with no coverage answers, Site or application provider', () => {
  const html = render(<Form>{props => <ContactSections {...props} pageSections={pageSections.contact ?? []} showBusinessSection hasDiOrOo sameAsHome={false} />}</Form>);
  for (const label of ['Street Address', 'Employer', 'Spouse']) expect(html).toContain(label);
  expect(html).toContain('name="spouse-phone"');
  expect(html).toContain('name="business-street-address"');
});
it('renders explicitly supplied spouse/child Eligibility sections without dependent answers', () => {
  const html = render(<Form>{props => <EligibilitySections {...props} pageSections={(pageSections.eligibility ?? []).filter(section => ['spouseSection', 'childSection'].includes(section.id))} />}</Form>);
  expect(html).toContain('spouse-first-name');
  expect(html).toContain('Add Child');
});
it('renders Membership controls from supplied fields without a qualifying membership answer', () => {
  const html = render(<Form>{props => <><MembershipStatus membershipField={fieldCatalog.membership} client={demoClient} control={props.control} errors={props.errors} showMembershipIneligibleAlert={false} /><MemberInformation fields={['first-name', 'last-name', 'email', 'phone'].map(id => fieldCatalog[id as keyof typeof fieldCatalog])} control={props.control} errors={props.errors} /></>}</Form>);
  expect(html).toContain('name="first-name"');
  expect(html).toContain('name="phone"');
});
function HomeSections() {
  const content = useComponentContent();
  return <>
    <HomeHero content={content} client={demoClient} effectiveBranding={demoClient.branding} variant="default" isSingleTemplate={false} onApply={() => {}} onOpenQuote={() => {}} />
    <HomeCoverageSection content={content} coverageOptions={{ coverages: [product], coverageConfig: demoClient.coverages }} />
    <AssociationIntroduction content={{ ...content, home: { ...content.home, clientSection: { tagline: 'Example introduction', paragraphs: ['Example paragraph'] } } }} effectiveBranding={demoClient.branding} />
    <UnderwriterCredentials content={content} /><HowApplyingWorksPanel variant="page" />
  </>;
}
it('renders Home sections with explicit content and products', () => {
  const html = render(<HomeSections />);
  for (const text of ['Get an instant quote', 'Example Term Life', 'Example introduction', 'How does applying work?']) expect(html).toContain(text);
});
it('renders Coverage questions, cards, prices and summaries from supplied state', () => {
  const html = render(<Form>{props => <>
    <CoverageQuestions {...props} allFields={[fieldCatalog.gender]} pageSections={[{ id: 'selfCoverageQuestions', pageId: 'coverage', fieldIds: ['gender'], applicant: 'self' }]} selectedCategories={['LI']} hasSpouse={false} availableCategories={[]} categoryProducts={[]} onCategoryToggle={() => {}} />
    <ProductCard coverage={product} productApplicants={{}} storedAmounts={{}} storedRiders={{}} storedRiderAmounts={{}} storedWaitingPeriods={{}} storedMaxBenefitPeriods={{}} calculatingRateKeys={new Set()} rateFrequency="monthly" frequencyCalculating={false} onToggleApplicant={() => {}} onAmountChange={() => {}} onRiderToggle={() => {}} onRiderAmountChange={() => {}} onWaitingPeriodChange={() => {}} onMaxBenefitPeriodChange={() => {}} getVisibleApplicants={applicants => applicants} calcApplicantPremium={() => 25} generateAmountChoices={() => [100000, 200000]} />
    <CoverageCart variant="drawer" entries={[]} totalMonthly={0} onClose={() => {}} onRemoveCoverage={() => {}} />
    <EstimatedRate amount={25} /><TotalCostSummary items={[{ id: product.id, name: product.name, amount: 25 }]} total={25} />
  </>}</Form>);
  expect(html).toContain('Add coverage');
  expect(html).toContain('$25.00');
  expect(html).toContain('Total Estimated Cost');
});
it('renders Beneficiary records and actions without participation/selection rules', () => {
  const html = render(<BeneficiaryProductRecords productName={product.name} items={[{ id: '1', designation: 'primary', beneficiaryType: 'individual', firstName: 'Jordan', lastName: 'Morgan', relationship: 'Spouse', share: 100, trustName: '', trustDate: '' }]} onEdit={() => {}} onRemove={() => {}} onAdd={() => {}} />);
  expect(html).toContain('JORDAN MORGAN');
  expect(html).toContain('Add Beneficiary');
});

it('renders Profile personal, physician, financial and spouse sections without Site/application access', () => {
  const html = render(<Form>{props => <ProfileSections {...props} pageSections={pageSections.profile ?? []}
    selfHasLife selfHasDisability spouseHasLife spouseHasDisability showApplicantLabels={{ spouse: true }} />}</Form>);
  for (const id of ['height-feet', 'physician-first-name', 'has-other-life-insurance', 'has-disability-insurance', 'total-net-worth', 'spouse-height-feet', 'spouse-physician-first-name', 'spouse-has-other-life-insurance']) expect(html).toContain(`name="${id}"`);
});

it('renders Review legal sections and document from explicit data without a Site or application provider', () => {
  const html = render(<Form>{props => <ReviewSections {...props} reviewContent={reviewDefaults}
    documentPreview={<ApplicationDocumentPreview sections={[{ title: 'Example document section', groups: [{ entries: [{ label: 'Example name', value: 'Jordan Morgan' }] }] }]} associationName="Example Association" signatureName="" signedDate="" currentDate="10/28/2026" hideSignature />}
    isAdvisorApplicantFlow={false} showHealthQuestionsNote={false} showSelfLabel
    readAndSignText={'Example introduction.\n\nCONSENT: Example consent.'} beforeConsentNotices={[]} blocks={[]}
    selfConsentField={fieldCatalog['review-self-consent']} spouseConsentField={fieldCatalog['review-spouse-consent']}
    additionalFields={[]} onPrint={() => {}} onDownload={() => {}} />}</Form>);
  expect(html).toContain('Jordan Morgan');
  expect(html).toContain('Example Association');
  for (const id of ['review-self-consent', 'review-spouse-consent']) expect(html).toContain(`name="${id}"`);
  expect(html.match(/data-legal-review-section=/g)).toHaveLength(2);
});
