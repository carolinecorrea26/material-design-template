// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import type {
  RateQuoteRequest,
  RateQuoteResponse,
  EligibilityDefaults,
  Product,
} from "../types/app";

// Vite allows JSON imports; ignore TS if needed
import products from "../data/fixtures/products.json";
import eligibility from "../data/fixtures/eligibility.json";
import rates from "../data/fixtures/rates.json";

const API_BASE = "/api";

// --- Helpers (MOCK) ---
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

// --- Handlers (MSW v2 style: http.get/post + HttpResponse.json) ---
export const handlers = [
  http.get(`${API_BASE}/products`, () => {
    const normalized = (products as Product[]).map((product) => ({
      ...product,
      underwritingType:
        product.underwritingType ?? (product.quickDecision ? "QD" : "NA"),
    }));
    return HttpResponse.json(normalized);
  }),

  http.get(`${API_BASE}/eligibility/defaults`, () => {
    return HttpResponse.json(eligibility as EligibilityDefaults);
  }),

  http.post(`${API_BASE}/rate/quote`, async ({ request }) => {
    const body = (await request.json()) as RateQuoteRequest;
    const base =
      (rates?.base as Record<string, number>)?.[body.productId] ?? 0.1;

    const monthly = round2(
      base *
        (body.amount / 1000) *
        nicotineFactor(body.smoker) *
        ageBandFactor(body.age),
    );

    const response: RateQuoteResponse = { monthly };
    return HttpResponse.json(response);
  }),
];
