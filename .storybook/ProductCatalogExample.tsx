import { useState } from 'react';
import ProductCatalog from '../src/components/coverage/ProductCatalog';
import { coverageCategories } from '../src/config/coverageCategories';
import type { PrototypeLibrary } from '../src/domain/prototypeLibrary';
import type { CoverageApplicantId } from '../src/config/coverages/types';
import { getCoverageAmountChoices } from '../src/utils/coverageAmounts';
import { baseMonthlyPremium } from '../src/domain/pricing';
/** Local selection interactions with authored product inputs; no application/rating service. */
export default function ProductCatalogExample({ fixture }: { fixture: PrototypeLibrary }) {
  const products = fixture.products.filter(product => product.categoryId === 'LI').map(product => ({ ...product, featured: product.featured ?? false }));
  const [applicants, setApplicants] = useState<Record<string, CoverageApplicantId[]>>({});
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [riders, setRiders] = useState<Record<string, boolean>>({});
  const [riderAmounts, setRiderAmounts] = useState<Record<string, number>>({});
  const [waiting, setWaiting] = useState<Record<string, string>>({});
  const [periods, setPeriods] = useState<Record<string, string>>({});
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly');
  const selected = products.filter(product => applicants[product.id]?.length).map(product => product.id);
  const premium = (product: typeof products[number], applicant: CoverageApplicantId) => baseMonthlyPremium(product.categoryId, amounts[`${product.id}:${applicant}`] ?? 0);
  return <ProductCatalog presentation={{ coverageConfig: fixture.client.coverages, applicantLabels: fixture.client.applicantLabels, helpPhone: fixture.client.support.helpPhone }}
    availableCategories={[...coverageCategories]} selectedCategories={['LI']} categoryProducts={products} categoryEligibility={{}} allCategoriesIneligible={false} hasQdCategorySelected={false}
    selectedCoverageIds={selected} productApplicants={applicants} storedAmounts={amounts} storedRiders={riders} storedRiderAmounts={riderAmounts}
    storedWaitingPeriods={waiting} storedMaxBenefitPeriods={periods} calculatingRateKeys={new Set()} rateFrequency={frequency} frequencyCalculating={false} selectionCalculating={false}
    showRateFrequencyToggle showProducts productsLoading={false} grandTotal={products.filter(product => selected.includes(product.id)).reduce((sum, product) => sum + premium(product, 'member'), 0)} activeClient={fixture.client}
    onToggleApplicant={(id, applicant) => setApplicants(current => ({ ...current, [id]: current[id]?.includes(applicant) ? current[id].filter(value => value !== applicant) : [...current[id] ?? [], applicant] }))}
    onAmountChange={(key, amount) => setAmounts(current => ({ ...current, [key]: amount }))} onFrequencyToggle={setFrequency}
    onRiderToggle={(id, rider, applicant) => setRiders(current => ({ ...current, [`${id}:${rider}:${applicant}`]: !current[`${id}:${rider}:${applicant}`] }))}
    onRiderAmountChange={(id, rider, applicant, amount) => setRiderAmounts(current => ({ ...current, [`${id}:${rider}:${applicant}`]: amount }))}
    onWaitingPeriodChange={(id, value, applicant) => setWaiting(current => ({ ...current, [`${id}:${applicant}`]: value }))}
    onMaxBenefitPeriodChange={(id, value, applicant) => setPeriods(current => ({ ...current, [`${id}:${applicant}`]: value }))}
    getVisibleApplicants={applicants => applicants.filter(applicant => applicant === 'member')} calcApplicantPremium={premium}
    generateAmountChoices={(product, applicant = 'member') => getCoverageAmountChoices(product, applicant)} hasSpouse={false} />;
}

