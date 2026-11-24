import { ProductCard } from '../src/components/coverage/ProductCatalog';
import type { PrototypeLibrary } from '../src/domain/prototypeLibrary';
import { requirementCoverageControl } from '../src/domain/requirementFields';
import { getCoverageAmountChoices } from '../src/utils/coverageAmounts';
import type { QuotePriceComponent } from '../src/domain/rateBreakdown';
import type { CoverageApplicantId } from '../src/domain/coverage';
import sample from '../requirements/global/prototype-fixtures/cost-breakdown.json';

/** Real source-compiled controls with a fictional provider quote, not a second calculator. */
export default function CostBreakdownExample({ fixture, itemized = true }: { fixture: PrototypeLibrary; itemized?: boolean }) {
  const product = fixture.products.find(product => product.id === sample.product)!;
  const key = `${product.id}:${sample.applicant}`, riderKey = `${product.id}:${sample.rider}:${sample.applicant}`;
  const noop = () => {};
  return <ProductCard coverage={{ ...product, featured: false }} presentation={{ coverageConfig: fixture.client.coverages, applicantLabels: fixture.client.applicantLabels }}
    controlDefinition={(id, applicant) => requirementCoverageControl(id, applicant, fixture)}
    applicationValues={{ membership: 'yes', gender: 'female', smoker: 'no', 'birth-date': '1990-01-01', 'state-province': 'VA' }}
    productApplicants={{ [product.id]: [sample.applicant as CoverageApplicantId] }} storedAmounts={{ [key]: sample.amount }} storedRiders={{ [riderKey]: true }} storedRiderAmounts={{ [riderKey]: sample.riderAmount }} storedWaitingPeriods={{}} storedMaxBenefitPeriods={{}} calculatingRateKeys={new Set()} rateFrequency="monthly" frequencyCalculating={false}
    onToggleApplicant={noop} onAmountChange={noop} onRiderToggle={noop} onRiderAmountChange={noop} onWaitingPeriodChange={noop} onMaxBenefitPeriodChange={noop}
    getVisibleApplicants={() => [sample.applicant as CoverageApplicantId]} calcApplicantPremium={() => sample.quote.amount} generateAmountChoices={(product, applicant = 'member') => getCoverageAmountChoices(product, applicant)}
    getRateDisplay={() => ({ status: 'available', amount: sample.quote.amount, ...(itemized ? { breakdown: sample.quote.breakdown as QuotePriceComponent[] } : {}) })} />;
}
