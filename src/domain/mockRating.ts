import { resolveRatePresentation } from "./ratePresentation";
import { applyRateModifiers, isRateModifierPolicy } from "./rateModifiers";
import type { EffectiveSite } from "./effectiveSite";
import { collectRateInputs, isRateInputPolicy, type RateDimension, type RateFacts } from "./rateInputPolicy";
import { resolveBilling, resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import type { PaymentMethod, PaymentFrequency } from "./paymentPolicy";

export type MockRatingService = { quote: (request: { siteKey: string; productKey: string; amount: number; frequency: "annual"; dimensions: Partial<Record<RateDimension, unknown>> }) => Promise<{ mode: string; premiumCents: number; expiresAt: number; authority: string }> };
/** Explicit mock boundary. Authoritative rates stay unavailable; this result
 * cannot be mistaken for a release-ready insurance quote. CSEA has no price. */
export async function quoteCandidateWithMock(site: EffectiveSite, productKey: string, facts: RateFacts, payment: { method: PaymentMethod; frequency: PaymentFrequency }, service: MockRatingService, now = Date.now(), purpose: "quote-tool" | "coverage" = "quote-tool") {
  const fail = (status: "unavailable" | "error" | "needs-information", reason: string, failureKind: "technical" | "configuration" | "inputs" = "configuration") => ({ status, failureKind, displayPrice: false, amount: null, authority: "Synthetic test rates; not an insurance quote", reason });
  const presentation = resolveRatePresentation(site, productKey, typeof facts.association === "string" ? facts.association : undefined);
  if (presentation.status !== "resolved") return fail("error", "Invalid rate presentation policy");
  if (!presentation.praseConfigured || !(purpose === "quote-tool" ? presentation.quoteToolEnabled : presentation.coverageQuoteEnabled)) return fail("unavailable", presentation.referenceTable ? "Use the configured reference rate table" : "Calculated rates are disabled by configuration");
  const journey = resolveCoverageJourneyPolicy(site, productKey);
  if (!journey || journey.payment.collection === "none") return fail("unavailable", "No rate collection configured");
  const product = site.configuration.products.find(product => product.productKey === productKey);
  const policy = product?.rateInputPolicies;
  if (policy?.length !== 1 || !isRateInputPolicy(policy[0].value)) return fail("error", "No unique valid rate input policy");
  if (policy[0].value.tobaccoLookback?.associationOverrides?.some(row => row.associationKeys.some(key => !site.assignedAssociationKeys.includes(key)))) return fail("error", "Invalid tobacco lookback Association scope");
  const collected = collectRateInputs(policy[0].value, facts, now);
  if (collected.errors.length) return fail("error", `Invalid rate inputs: ${collected.errors.join(", ")}`, "inputs");
  if (collected.missing.length) return fail("needs-information", `Required rate inputs: ${collected.missing.join(", ")}`, "inputs");
  if (typeof facts.amount !== "number" || !Number.isSafeInteger(facts.amount) || facts.amount <= 0) return fail("error", "Invalid rate amount", "inputs");
  try {
    const quote = await service.quote({ siteKey: site.siteKey, productKey, amount: facts.amount, frequency: "annual", dimensions: collected.inputs });
    if (quote.mode !== "mock" || !Number.isSafeInteger(quote.premiumCents) || quote.premiumCents < 0 || !Number.isFinite(quote.expiresAt) || quote.expiresAt <= now || !quote.authority?.includes("Synthetic")) return fail("error", "Invalid or expired mock rate response", "technical");
    const modifiers = product!.rateModifierPolicies;
    if (modifiers.length !== 1 || !isRateModifierPolicy(modifiers[0].value)) return fail("error", "No unique valid rate modifier policy");
    const adjusted = applyRateModifiers(modifiers[0].value, quote.premiumCents / 100, { membership: typeof facts.membership === "boolean" ? facts.membership : undefined, jurisdiction: typeof facts.jurisdiction === "string" ? facts.jurisdiction : undefined, ...payment });
    if (!adjusted.allowed || adjusted.annualPremium === null) return fail(adjusted.missing.length ? "needs-information" : "error", `Rate adjustment inputs: ${adjusted.missing.join(", ")}`, adjusted.missing.length ? "inputs" : "configuration");
    const billing = resolveBilling(journey, payment.method, payment.frequency, adjusted.annualPremium);
    if (!billing.displayPrice) return fail("error", "Payment choice is unavailable");
    return { status: "mock" as const, amount: billing.amount, displayPrice: true, authority: quote.authority, reason: null, inputs: collected.inputs, provenance: policy[0].provenance };
  } catch { return fail("error", "Mock rating service is unavailable", "technical"); }
}
