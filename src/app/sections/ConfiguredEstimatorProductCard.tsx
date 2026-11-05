import { useContext } from "react";
import { ApplicationFormContext } from "../ApplicationFormContext";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { associationRatesSuppressed } from "../../domain/ratePresentation";
import type { ComponentProps } from "react";
import EstimatorProductCard from "../../components/coverage/EstimatorProductCard";
import { getSurfaceField } from "../../config/fields/storedSurfaces";
export default function ConfiguredEstimatorProductCard(props: ComponentProps<typeof EstimatorProductCard>) {
  const application = useContext(ApplicationFormContext), library = getPrototypeLibrary();
  return <EstimatorProductCard {...props} rateDisplay={library && associationRatesSuppressed(library.site, application?.values ?? {}) ? { status: "hidden" } : props.rateDisplay} amountField={getSurfaceField("quoteInputs", props.product.categoryId === "DI" || props.product.categoryId === "OO" ? "quote-monthly-amount" : "quote-amount") ?? null} selectionField={getSurfaceField("quoteInputs", "quote-selection") ?? null} />;
}
