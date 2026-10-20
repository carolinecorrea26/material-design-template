import type { CoverageDefinition } from './coverage';
import { selectedRiderOnly } from './coverageRiderOnly';
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
    if (!selected[key]) delete amounts[key];
  }
  return { coverageRiders: selected, coverageRiderAmounts: amounts };
}
