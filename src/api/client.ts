import type {
  Product,
  EligibilityDefaults,
  RateQuoteRequest,
  RateQuoteResponse,
} from "../types/app";
import { getClientConfig } from "../config/clients";

// Static imports for all product files (ensures they're always bundled)
import productsStandard from "../data/fixtures/products.json";
import productsDemo from "../data/fixtures/products-demo.json";
import productsNar from "../data/fixtures/products-nar.json";
import productsAma from "../data/fixtures/products-ama.json";
import productsCalbar from "../data/fixtures/products-calbar.json";
import productsAvmalifetrust from "../data/fixtures/products-avmalifetrust.json";
import productsWaepa from "../data/fixtures/products-waepa.json";
import productsIeee from "../data/fixtures/products-ieee.json";
import eligibilityData from "../data/fixtures/eligibility.json";
import ratesData from "../data/fixtures/rates.json";

// Product file registry - add new clients here
const PRODUCT_FILES: Record<string, Product[]> = {
  products: productsStandard as Product[],
  "products-demo": productsDemo as Product[],
  "products-nar": productsNar as Product[],
  "products-ama": productsAma as Product[],
  "products-calbar": productsCalbar as Product[],
  "products-avmalifetrust": productsAvmalifetrust as Product[],
  "products-waepa": productsWaepa as Product[],
  "products-ieee": productsIeee as Product[],
};

export async function getProducts(): Promise<Product[]> {
  try {
    const clientConfig = getClientConfig();
    const productsFile = clientConfig.productsFile || "products";

    // Get products from the registry
    let products = PRODUCT_FILES[productsFile] || productsStandard;

    // Filter by coverage categories if specified
    if (
      clientConfig.coverageCategories &&
      clientConfig.coverageCategories.length > 0
    ) {
      products = products.filter((p) =>
        clientConfig.coverageCategories!.includes(p.category),
      );
    }

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("Invalid or empty products data");
    }

    return products.map((product) => ({
      ...product,
      underwritingType:
        product.underwritingType ?? (product.quickDecision ? "QD" : "NA"),
    }));
  } catch (error) {
    console.error("Failed to load products:", error);
    // Fallback to standard products
    return (productsStandard as Product[]).map((product) => ({
      ...product,
      underwritingType:
        product.underwritingType ?? (product.quickDecision ? "QD" : "NA"),
    }));
  }
}

export async function getEligibilityDefaults(): Promise<EligibilityDefaults> {
  // Always use mock data (this is a prototype without a real backend)
  return eligibilityData as EligibilityDefaults;
}

export async function quoteRate(
  payload: RateQuoteRequest,
): Promise<RateQuoteResponse> {
  // Always use mock data (this is a prototype without a real backend)
  try {
    const base =
      (ratesData?.base as Record<string, number>)?.[payload.productId] ?? 0.1;

    // Simple calculation for demo
    const ageBandFactor = (age?: number) =>
      age == null
        ? 1
        : age < 30
          ? 1
          : age < 40
            ? 1.1
            : age < 50
              ? 1.25
              : age < 60
                ? 1.5
                : 1.75;
    const nicotineFactor = (smoker?: boolean) => (smoker ? 1.25 : 1);
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const monthly = round2(
      base *
        (payload.amount / 1000) *
        nicotineFactor(payload.smoker) *
        ageBandFactor(payload.age),
    );

    return { monthly };
  } catch (error) {
    throw new Error(
      `Failed to calculate rate: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
