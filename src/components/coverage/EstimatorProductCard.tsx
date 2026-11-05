import type { RateDisplayState } from '../../domain/rateDisplay';
import type { FieldDefinition } from "../../config/fields/types";
import { residencyExclusionDiagnostic } from "../../domain/residencyPolicy";
import EstimatedRate from "./EstimatedRate";
import {
  Alert,
  Box,
  Stack,
} from "@mui/material";
import ProductCardSurface from "../layout/ProductCard";
import FeaturedBadge from "./FeaturedBadge";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import type { CoverageCategoryId } from "../../config/coverages/types";
import { formatUSD } from "../../utils/formatUSD";

type EstimatorProductCardProps = {
  amountField?: FieldDefinition | null;
  selectionField?: FieldDefinition | null;
  unavailableReason?: string;
  rateDisplay?: RateDisplayState;
  product: {
    id: string;
    name: string;
    description?: string;
    definition?: string;
    categoryId: CoverageCategoryId;
    underwritingType?: string;
    featured?: boolean;
  };
  /** Currently selected amount for member applicant. */
  currentAmount: number;
  /** Available amount choices for the dropdown. */
  amountChoices: number[];
  /** Whether a "member" applicant is selected. */
  selected: boolean;
  /** Whether the rate is currently recalculating. */
  isCalculating: boolean;
  /** Displayed premium (already adjusted for rate frequency). */
  displayedPremium: number;
  /** Rate suffix, e.g. "/mo" or "/yr". */
  rateSuffix: string;
  onToggleSelected: () => void;
  onAmountChange: (amount: number) => void;
};

/**
 * Product card used inside the quote estimator (QuoteCalculator).
 * Simplified version of the full ProductCard in ProductCatalog — member-only,
 * no riders, no waiting periods.
 */
export default function EstimatorProductCard({
  amountField: suppliedAmountField,
  selectionField = { id: "quote-selection", label: "Select for myself", inputType: "checkbox" },
  unavailableReason,
  rateDisplay,
  product,
  currentAmount,
  amountChoices,
  selected,
  isCalculating,
  displayedPremium,
  rateSuffix,
  onToggleSelected,
  onAmountChange,
}: EstimatorProductCardProps) {
  const amountField: FieldDefinition | null = suppliedAmountField === undefined ? { id: "quote-amount", label: product.categoryId === "DI" || product.categoryId === "OO" ? "Monthly benefit amount" : "Benefit amount", inputType: "dropdown" } : suppliedAmountField;

  return (
    <ProductCardSurface
      selected={selected}
      productName={product.name}
      description={product.description ?? product.definition}
      quickDecision={product.underwritingType === "QD"}
      headerAction={product.featured && <FeaturedBadge />}
    >
      {/* Select for myself row */}
      {unavailableReason && unavailableReason !== residencyExclusionDiagnostic && <Alert severity="warning">{unavailableReason}</Alert>}
      {selectionField && <ControlledFieldRenderer
        field={{ ...selectionField, id: `${product.id}-selection`, disabled: selectionField.disabled || !selected && !!unavailableReason }}
        value={selected}
        onChange={onToggleSelected}
      />}

      {/* Benefit amount + estimated cost */}
      {amountField && <Box>
        <ControlledFieldRenderer
          field={{ ...amountField, id: `${product.id}-member-amount`, options: amountChoices.map(amount => ({ value: String(amount), label: formatUSD(amount, 0) })) }}
          value={amountChoices.includes(currentAmount) ? String(currentAmount) : ""}
          onChange={value => onAmountChange(Number(value))}
        />

        {currentAmount > 0 && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ mt: 0.5, minHeight: 20 }}
          >
              <EstimatedRate display={rateDisplay} amount={displayedPremium} suffix={rateSuffix} isCalculating={isCalculating} label="Est. cost:" appearance="product" />
          </Stack>
        )}
      </Box>}
    </ProductCardSurface>
  );
}
