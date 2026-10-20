/** Authored billing choices; processor execution and payment details are separate. */
export type PaymentMethod = "bank-account" | "credit-card" | "bill-me";
export type PaymentFrequency = "monthly" | "quarterly" | "semiannual" | "annual";
export type PaymentPolicy = {
  collection: "required" | "optional" | "none";
  methods: Array<{ method: PaymentMethod; frequencies: PaymentFrequency[] }>;
  defaultMethod: PaymentMethod | null;
  defaultFrequency: PaymentFrequency | null;
  frequencyLocked: boolean;
  synchronizeAcrossProducts: boolean;
};

export function validatePaymentPolicy(policy: PaymentPolicy): void {
  const methods = new Set(policy.methods.map(option => option.method));
  if (!["required", "optional", "none"].includes(policy.collection) || methods.size !== policy.methods.length || policy.methods.some(option => !["bank-account", "credit-card", "bill-me"].includes(option.method) || !option.frequencies.length || new Set(option.frequencies).size !== option.frequencies.length || option.frequencies.some(frequency => !["monthly", "quarterly", "semiannual", "annual"].includes(frequency)))) throw new Error("Invalid payment policy choices");
  if (policy.collection === "none") {
    if (policy.methods.length || policy.defaultMethod !== null || policy.defaultFrequency !== null || policy.frequencyLocked) throw new Error("Payment collection is disabled");
  } else if (!policy.methods.length || (policy.defaultMethod !== null && !methods.has(policy.defaultMethod)) || (policy.defaultFrequency !== null && (policy.defaultMethod === null || !policy.methods.find(option => option.method === policy.defaultMethod)?.frequencies.includes(policy.defaultFrequency)))) throw new Error("Invalid payment policy defaults");
  if (policy.frequencyLocked && (policy.defaultFrequency === null || policy.methods.some(option => option.frequencies.length !== 1 || option.frequencies[0] !== policy.defaultFrequency))) throw new Error("Conflicting locked payment frequency");
}

export function paymentSelectionAllowed(policy: PaymentPolicy, method: PaymentMethod, frequency: PaymentFrequency): boolean {
  validatePaymentPolicy(policy);
  return policy.collection !== "none" && Boolean(policy.methods.find(option => option.method === method)?.frequencies.includes(frequency));
}


/** Retain valid user choices; clear a frequency when changing methods invalidates it. */
export function reconcilePaymentSelection(policy: PaymentPolicy, method: PaymentMethod | null, frequency: PaymentFrequency | null) {
  validatePaymentPolicy(policy);
  if (policy.collection === "none") return { method: null, frequency: null };
  const selectedMethod = method !== null && policy.methods.some(option => option.method === method) ? method : policy.defaultMethod;
  const selectedFrequency = selectedMethod !== null && frequency !== null && paymentSelectionAllowed(policy, selectedMethod, frequency)
    ? frequency : policy.frequencyLocked ? policy.defaultFrequency : null;
  return { method: selectedMethod, frequency: selectedFrequency };
}
