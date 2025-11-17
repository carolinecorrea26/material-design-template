import type { Product, EligibilityDefaults, RateQuoteRequest, RateQuoteResponse } from "../types/app";

// In development, use direct imports instead of MSW
const isDev = import.meta.env.DEV;

export async function getProducts(): Promise<Product[]> {
  if (isDev) {
    const products = await import("../data/fixtures/products.json");
    return products.default as Product[];
  }

  console.log('API: Fetching /api/products');
  const r = await fetch("/api/products");
  console.log('API: Response status:', r.status, r.statusText);
  if (!r.ok) throw new Error("Failed to fetch products");
  const data = await r.json();
  console.log('API: Parsed JSON data:', data);
  return data;
}

export async function getEligibilityDefaults(): Promise<EligibilityDefaults> {
  if (isDev) {
    const eligibility = await import("../data/fixtures/eligibility.json");
    return eligibility.default as EligibilityDefaults;
  }

  const r = await fetch("/api/eligibility/defaults");
  if (!r.ok) throw new Error("Failed to fetch eligibility defaults");
  return r.json();
}

export async function quoteRate(payload: RateQuoteRequest): Promise<RateQuoteResponse> {
  if (isDev) {
    const rates = await import("../data/fixtures/rates.json");

    const base = (rates.default?.base as Record<string, number>)?.[payload.productId] ?? 0.1;

    // Simple calculation for demo
    const ageBandFactor = (age?: number) =>
      age == null ? 1 : age < 30 ? 1 : age < 40 ? 1.1 : age < 50 ? 1.25 : age < 60 ? 1.5 : 1.75;
    const nicotineFactor = (smoker?: boolean) => (smoker ? 1.25 : 1);
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const monthly = round2(
      base * (payload.amount / 1000) * nicotineFactor(payload.smoker) * ageBandFactor(payload.age)
    );

    return { monthly };
  }

  const r = await fetch("/api/rate/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error("Failed to quote rate");
  return r.json();
}
