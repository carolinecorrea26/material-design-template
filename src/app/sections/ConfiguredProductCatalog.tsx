import type { ComponentProps } from "react";
import ProductCatalog, { ProductCard as ProductCardView, type ProductPresentation } from "../../components/coverage/ProductCatalog";
import { useApplicationForm } from "../ApplicationFormContext";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveSite } from "../../data";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { associationRatesSuppressed, resolveRatePresentation } from "../../domain/ratePresentation";
import { activeFeaturedProduct } from "../../config/client/coverageProductScope";
import { getMaxAggregateNotes } from "../../config/coverageConstants";
import { coverageCategories } from "../../config/coverageCategories";
import { applicationCoverageName } from "../../domain/coverageRuntime";
function presentationFor(products: ComponentProps<typeof ProductCatalog>["categoryProducts"], values: import("../ApplicationFormContext").ApplicationFormValues) {
  const client = getActiveClient(), library = getPrototypeLibrary(), siteId = getActiveSite().id;
  const presentation: ProductPresentation = {
    productNames: Object.fromEntries(products.map(product => [product.id, applicationCoverageName(product, values)])),
    coverageConfig: client.coverages, applicantLabels: client.applicantLabels, helpPhone: client.support.helpPhone,
    featuredProduct: activeFeaturedProduct(siteId),
    aggregateNotes: Object.fromEntries(coverageCategories.map(category => [category.id, getMaxAggregateNotes(category.id, siteId)])),
    ratesSuppressed: library ? associationRatesSuppressed(library.site, values) : false,
    ratePresentations: library ? Object.fromEntries(products.map(product => [product.id, resolveRatePresentation(library.site, product.id, String(values.association ?? values.membership ?? ""))])) : {},
  };
  return presentation;
}
export default function ConfiguredProductCatalog(props: ComponentProps<typeof ProductCatalog>) {
  const { values } = useApplicationForm();
  return <ProductCatalog {...props} applicationValues={values} presentation={presentationFor(props.categoryProducts, values)} />;
}
export function ProductCard(props: ComponentProps<typeof ProductCardView>) {
  const { values } = useApplicationForm();
  return <ProductCardView {...props} applicationValues={values} presentation={presentationFor([props.coverage], values)} />;
}
