export type PaymentChoice = { value: string; label: string };
export type ProductPaymentChoices = { productKey: string; methods: PaymentChoice[]; frequencies: PaymentChoice[] };

/** Shared choices must be accepted by every product collecting payment. */
export function commonPaymentChoices(products: ProductPaymentChoices[], kind: "methods" | "frequencies"): PaymentChoice[] {
  if (!products.length) return [];
  return products[0][kind].filter(choice => products.every(product => product[kind].some(option => option.value === choice.value)));
}

export const SHARED_METHOD_FIELD = "payment-method:all";
export const SHARED_FREQUENCY_FIELD = "payment-frequency:all";
export type SharedPaymentProduct = { productKey: string; methods: PaymentChoice[]; frequenciesByMethod: Record<string, PaymentChoice[]> };
export type SharedPaymentSettings = { allowSharedMethod?: boolean; allowSharedFrequency?: boolean };

/** Keep per-product values as the canonical payment and rating inputs. */
export function sharedPaymentState(products: SharedPaymentProduct[], values: Record<string, unknown>, settings: SharedPaymentSettings = {}) {
  const shareMethod = settings.allowSharedMethod === true;
  const shareFrequency = settings.allowSharedFrequency === true;
  const uniform = (kind: "method" | "frequency") => {
    const choices = products.map(product => String(values[`payment-${kind}:${product.productKey}`] ?? ""));
    return choices.length && choices.every(choice => choice === choices[0]) ? choices[0] : "";
  };
  const methodOptions = commonPaymentChoices(products.map(product => ({ ...product, frequencies: [] })), "methods");
  const rawMethod = String(values[SHARED_METHOD_FIELD] ?? uniform("method"));
  const method = methodOptions.some(option => option.value === rawMethod) ? rawMethod : "";
  const frequencyOptions = commonPaymentChoices(products.map(product => ({ ...product, frequencies: product.frequenciesByMethod[shareMethod ? method : String(values[`payment-method:${product.productKey}`] ?? "")] ?? [] })), "frequencies");
  const rawFrequency = String(values[SHARED_FREQUENCY_FIELD] ?? uniform("frequency"));
  const frequency = frequencyOptions.some(option => option.value === rawFrequency) ? rawFrequency : "";
  const updates: Record<string, string> = {};
  const update = (key: string, value: string) => { if ((values[key] ?? "") !== value) updates[key] = value; };
  if (shareMethod) update(SHARED_METHOD_FIELD, method);
  if (shareFrequency) update(SHARED_FREQUENCY_FIELD, frequency);
  for (const product of products) {
    if (shareMethod) update(`payment-method:${product.productKey}`, method);
    if (shareFrequency) update(`payment-frequency:${product.productKey}`, frequency);
    else if (shareMethod) {
      const selected = String(values[`payment-frequency:${product.productKey}`] ?? "");
      if (!(product.frequenciesByMethod[method] ?? []).some(option => option.value === selected)) update(`payment-frequency:${product.productKey}`, "");
    }
  }
  return { shareMethod, shareFrequency, method, frequency, methodOptions, frequencyOptions, updates };
}
