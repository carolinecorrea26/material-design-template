import type { EffectiveSite } from "./effectiveSite";

/** A captured Library outcome controls price display. Reference tables, generic
 * prototype prices and a caller-supplied estimate cannot become a base premium.
 */
export function resolveNormalizedRate(site: EffectiveSite, productKey: string) {
  const product = site.configuration.products.find(product => product.productKey === productKey);
  if (!product) return { status: "unresolved" as const, amount: null, displayPrice: false, reason: "Product is unavailable", provisional: false, revisit: false, provenance: [] };
  const value = product.rating.outcome?.value;
  if (product.rating.status === "unavailable" && value && typeof value === "object" && !Array.isArray(value) && "reason" in value && typeof value.reason === "string") {
    return { status: "unavailable" as const, amount: null, displayPrice: false, reason: value.reason, provisional: "provisional" in value && value.provisional === true, revisit: "revisit" in value && value.revisit === true, provenance: product.rating.outcome!.provenance };
  }
  return { status: "unresolved" as const, amount: null, displayPrice: false, reason: "No executable authoritative rate policy", provisional: false, revisit: false, provenance: product.rating.outcome?.provenance ?? [] };
}
