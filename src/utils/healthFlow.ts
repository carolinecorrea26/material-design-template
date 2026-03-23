import type { Product, SelectedItem, UnderwritingType } from "../types/app";

const HEALTH_QUESTION_UNDERWRITING: ReadonlyArray<UnderwritingType> = [
  "FUW",
  "QD",
  "SI",
  "CIR",
];

const HEALTH_ROUTES = {
  si: "/health-information",
  qd: "/health-information-quickdecision",
  disability: "/health-information-disability",
  cir: "/health-information-chronic-illness-rider",
} as const;

const CHRONIC_ILLNESS_RIDER_PATTERNS = [/chronic/i, /illness/i, /cir/i];

export function getHealthFlow(
  coverage: SelectedItem[] | undefined,
  products: Product[],
) {
  const selectedItems = Array.isArray(coverage) ? coverage : [];
  const selectedById = new Map(
    products.map((product) => [product.id, product]),
  );

  const selectedProducts = selectedItems
    .map((item) => selectedById.get(item.productId))
    .filter((product): product is Product => Boolean(product));

  const hasQD = selectedProducts.some(
    (product) => product.underwritingType === "QD",
  );
  const hasSI = selectedProducts.some(
    (product) => product.underwritingType === "SI",
  );
  const hasDisability = selectedProducts.some(
    (product) => product.category === "DI",
  );
  const hasCIR =
    selectedProducts.some((product) => product.underwritingType === "CIR") ||
    selectedItems.some((item) => {
      if (!item.riders) return false;
      return Object.entries(item.riders).some(([key, value]) => {
        if (!value) return false;
        return CHRONIC_ILLNESS_RIDER_PATTERNS.some((pattern) =>
          pattern.test(key),
        );
      });
    });

  const routes: string[] = [];
  if (hasSI) routes.push(HEALTH_ROUTES.si);
  if (hasQD) routes.push(HEALTH_ROUTES.qd);
  if (hasDisability) routes.push(HEALTH_ROUTES.disability);
  if (hasCIR) routes.push(HEALTH_ROUTES.cir);

  const hasHealthQuestions = selectedProducts.some((product) =>
    HEALTH_QUESTION_UNDERWRITING.includes(product.underwritingType ?? "NA"),
  );

  return {
    routes,
    hasQD,
    hasSI,
    hasDisability,
    hasCIR,
    hasHealthQuestions,
  };
}
