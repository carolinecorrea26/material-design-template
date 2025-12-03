import type { Product, EligibilityDefaults, RateQuoteRequest, RateQuoteResponse } from "../types/app";
import { ACTIVE_CLIENT_ID } from "../config/clients";

// In development, use direct imports instead of MSW
// const isDev = import.meta.env.DEV;
const isDev = true;

export async function getProducts(): Promise<Product[]> {
  try {
    // Use demo products for demo client, otherwise use standard products
    const productsPath = ACTIVE_CLIENT_ID === 'demo' 
      ? "/data/fixtures/products-demo.json"
      : "/data/fixtures/products.json";
    
    const res = await fetch(productsPath, {
      headers: { Accept: "application/json" }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch ${productsPath}: ${res.status} ${res.statusText}`);
    }
    
    const products = await res.json() as Product[];
    
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("Invalid or empty products data");
    }
    
    return products;
  } catch (error) {
    console.error("Failed to load products, using fallback:", error);
    
    // Return fallback products
    return [
      {
        id: "term-life",
        name: "Term Life Insurance",
        category: "LI",
        amounts: [50000, 100000, 250000, 500000],
        eligibleApplicants: ["self", "spouse"]
      },
      {
        id: "disability",
        name: "Disability Insurance",
        category: "DI",
        amounts: [1000, 2000, 5000],
        eligibleApplicants: ["self", "spouse"]
      },
      {
        id: "office-overhead",
        name: "Office Overhead Expense",
        category: "DI",
        amounts: [2500, 5000, 10000],
        eligibleApplicants: ["self"]
      },
      {
        id: "supplemental-health",
        name: "Supplemental Health",
        category: "SH",
        amounts: [10000, 25000, 50000],
        eligibleApplicants: ["self", "spouse", "child"]
      }
    ];
  }
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
    try {
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
    } catch (error) {
      throw new Error(`Failed to load rates fixture: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const r = await fetch("/api/rate/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Failed to quote rate: ${r.status} ${r.statusText}. Response: ${text.substring(0, 200)}`);
  }
  
  const responseText = await r.text();
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    throw new Error(`Invalid JSON in quoteRate response: ${parseError instanceof Error ? parseError.message : String(parseError)}. Response: ${responseText.substring(0, 200)}`);
  }
}
