import type { Product, EligibilityDefaults, RateQuoteRequest, RateQuoteResponse } from "../types/app";
import { ACTIVE_CLIENT_ID, getClientConfig } from "../config/clients";

// Static imports for all product files (ensures they're always bundled)
import productsStandard from "../data/fixtures/products.json";
import productsDemo from "../data/fixtures/products-demo.json";
import productsNar from "../data/fixtures/products-nar.json";
import productsAma from "../data/fixtures/products-ama.json";
import productsCalbar from "../data/fixtures/products-calbar.json";
import productsAvmalifetrust from "../data/fixtures/products-avmalifetrust.json";
import productsWaepa from "../data/fixtures/products-waepa.json";
import productsIeee from "../data/fixtures/products-ieee.json";

// Product file registry - add new clients here
const PRODUCT_FILES: Record<string, Product[]> = {
  'products': productsStandard,
  'products-demo': productsDemo,
  'products-nar': productsNar,
  'products-ama': productsAma,
  'products-calbar': productsCalbar,
  'products-avmalifetrust': productsAvmalifetrust,
  'products-waepa': productsWaepa,
  'products-ieee': productsIeee,
};

export async function getProducts(): Promise<Product[]> {
  try {
    const clientConfig = getClientConfig();
    const productsFile = clientConfig.productsFile || 'products';
    
    // Get products from the registry
    let products = PRODUCT_FILES[productsFile] || productsStandard;
    
    // Filter by coverage categories if specified
    if (clientConfig.coverageCategories && clientConfig.coverageCategories.length > 0) {
      products = products.filter(p => clientConfig.coverageCategories!.includes(p.category));
    }
    
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("Invalid or empty products data");
    }
    
    return products;
  } catch (error) {
    console.error("Failed to load products:", error);
    // Fallback to standard products
    return productsStandard as Product[];
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
