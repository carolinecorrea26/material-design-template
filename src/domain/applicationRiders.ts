import type { CoverageApplicantId, CoverageDefinition, RiderDefinition } from './coverage';
import { selectedRiderOnly } from './coverageRiderOnly';
import { getPrototypeLibrary } from './prototypeLibrary';
import { isSelectionPolicy, reconcileCoverageSelection } from './coverageSelectionPolicy';
import { applicationApplicantFacts } from '../utils/applicantFacts';
import { getCoverageAmountChoices } from '../utils/coverageAmounts';

export function applicationRiderOptions(product: CoverageDefinition, rider: RiderDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>) {
  const choices = rider.hasAmount ? getCoverageAmountChoices({ coverageAmounts: rider.coverageAmounts }, applicant).filter(amount => amount > 0) : [];
  const library = getPrototypeLibrary();
  const configured = library?.site.configuration.products.find(row => row.productKey === product.id);
  const records = configured?.selectionPolicies ?? [];
  const key = configured?.riders.find(row => row.definition?.value.id === rider.id)?.key;
  if (!configured || !records.length || !key || selectedRiderOnly(product, applicant, values)) return { available: true, choices, configured: false };
  const policy = records[0].value;
  if (records.length !== 1 || !isSelectionPolicy(policy)) throw new Error(`Invalid rider selection policy: ${product.id}`);
  if (!policy.riders.some(row => row.key === key)) return { available: true, choices, configured: false };
  const selected = values.coverageRiders as Record<string, boolean> | undefined;
  const amounts = values.coverageRiderAmounts as Record<string, number> | undefined;
  const elections = configured.riders.flatMap(row => {
    const id = row.definition?.value.id;
    return id && selected?.[`${product.id}:${id}:${applicant}`] ? [row.key] : [];
  });
  const riderAmounts = Object.fromEntries(configured.riders.flatMap(row => {
    const id = row.definition?.value.id;
    const amount = id ? amounts?.[`${product.id}:${id}:${applicant}`] : undefined;
    return amount === undefined ? [] : [[row.key, amount]];
  }));
  const state = String(values['state-province'] ?? values.state ?? '');
  const facts = {
    mode: 'new' as const, applicantKey: applicant,
    baseAmount: (values.coverageAmounts as Record<string, number> | undefined)?.[`${product.id}:${applicant}`],
    ageYears: applicationApplicantFacts(values, applicant).ageYears,
    jurisdiction: state ? state.includes('-') ? state : `US-${state}` : undefined,
  };
  const evaluate = (amount?: number) => reconcileCoverageSelection(policy, facts, {
    riders: [...new Set([...elections, key])],
    riderAmounts: { ...riderAmounts, ...(amount === undefined ? {} : { [key]: amount }) },
  });
  const result = evaluate();
  const available = result.allowed && result.election.riders.some(riderKey => riderKey === key);
  const allowedChoices = available ? choices.filter(amount => {
    const result = evaluate(amount);
    return result.allowed && result.election.riders.some(riderKey => riderKey === key) && result.election.riderAmounts[key] === amount;
  }) : [];
  return {
    available: available && (!rider.hasAmount || allowedChoices.length > 0),
    configured: true, choices: allowedChoices,
  };
}

export function reconcileApplicationRiders(products: CoverageDefinition[], values: Record<string, unknown>) {
  const selected = { ...(values.coverageRiders as Record<string, boolean> ?? {}) };
  const amounts = { ...(values.coverageRiderAmounts as Record<string, number> ?? {}) };
  const validKeys = new Set(products.flatMap(p => (p.riders ?? []).flatMap(r => p.applicants.map(a => `${p.id}:${r.id}:${a}`))));
  for (const key of new Set([...Object.keys(selected), ...Object.keys(amounts)])) if (products.some(p => key.startsWith(`${p.id}:`)) && !validKeys.has(key)) { delete selected[key]; delete amounts[key]; }
  const elections = values.coverageAmounts as Record<string, number> ?? {};
  const dependents = Array.isArray(values.dependents) ? values.dependents : [];
  for (const product of products) for (const rider of product.riders ?? []) for (const applicant of product.applicants) {
    if (rider.applicants && !rider.applicants.includes(applicant)) continue;
    const key = `${product.id}:${rider.id}:${applicant}`;
    const standalone = selectedRiderOnly(product, applicant, values);
    // Riders can be configured before Add coverage. A standalone election keeps
    // only its required rider; unrelated product/applicant selections survive.
    const available = (applicant === 'member' || dependents.includes(applicant)) && (elections[`${product.id}:${applicant}`] > 0 || standalone?.id === rider.id) && (!rider.dependentApplicant || dependents.includes(rider.dependentApplicant));
    if (!available) { delete selected[key]; delete amounts[key]; continue; }
    if (rider.included || standalone?.id === rider.id) selected[key] = true;
    else if (selected[key] === undefined && rider.defaultSelected) selected[key] = true;
    if (selected[key] && rider.hasAmount && amounts[key] === undefined && rider.defaultAmount !== undefined) amounts[key] = rider.defaultAmount;
    const options = applicationRiderOptions(product, rider, applicant, { ...values, coverageRiders: selected, coverageRiderAmounts: amounts });
    if (!options.available) { delete selected[key]; delete amounts[key]; continue; }
    if (selected[key] && rider.hasAmount && options.configured && !options.choices.includes(amounts[key])) {
      amounts[key] = rider.defaultAmount !== undefined && options.choices.includes(rider.defaultAmount) ? rider.defaultAmount : options.choices[0];
    }
    if (!selected[key]) delete amounts[key];
  }
  return { coverageRiders: selected, coverageRiderAmounts: amounts };
}
