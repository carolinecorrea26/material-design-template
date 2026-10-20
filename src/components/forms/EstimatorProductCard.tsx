import { getSurfaceField } from "../../config/fields/storedSurfaces";
import { residencyExclusionDiagnostic } from "../../domain/residencyPolicy";
import EstimatedRate from "../ui/EstimatedRate";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ProductCardSurface from "../layout/ProductCard";
import FeaturedBadge from "../ui/FeaturedBadge";
import QuickDecisionIndicator from "../ui/QuickDecisionIndicator";
import SelectionGroup from "./SelectionGroup";
import type { CoverageCategoryId } from "../../config/coverages/types";
import { formatUSD } from "../../utils/formatUSD";

type EstimatorProductCardProps = {
  unavailableReason?: string;
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
  unavailableReason,
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
  const amountLabelId = `${product.id}-member-amount-label`;
  const amountField = getSurfaceField('quoteInputs', product.categoryId === 'DI' || product.categoryId === 'OO' ? 'quote-monthly-amount' : 'quote-amount');
  const selectionField = getSurfaceField('quoteInputs', 'quote-selection');
  const amountLabel = amountField?.label;

  return (
    <ProductCardSurface
      selected={selected}
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {/* Title row */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1}
      >
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="productNameLabel">
            {product.name}
            {product.underwritingType === "QD" && <QuickDecisionIndicator />}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product.description ?? product.definition}
          </Typography>
        </Stack>
        {product.featured && <FeaturedBadge />}
      </Stack>

      {/* Select for myself row */}
      {unavailableReason && unavailableReason !== residencyExclusionDiagnostic && <Alert severity="warning">{unavailableReason}</Alert>}
      {selectionField && <SelectionGroup disabled={selectionField.disabled || !selected && !!unavailableReason}>
        <Checkbox
          disabled={selectionField.disabled || !selected && !!unavailableReason}
          slotProps={{ input: { "aria-label": selectionField.label } }}
          checked={selected}
          onChange={onToggleSelected}
          size="small"
          sx={{
            p: 0,
            color: "text.primary",
            "&.Mui-checked": { color: "primary.main" },
          }}
        />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {selectionField.label}
        </Typography>
        {selected ? (
          <Chip
            label="Added"
            size="small"
            color="success"
            sx={{
              height: 22,
              "& .MuiChip-label": { fontSize: "0.7rem", fontWeight: 600, px: 1 },
            }}
          />
        ) : (
          <Chip
            label="Add"
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              borderColor: "grey.300",
              color: "text.secondary",
              "& .MuiChip-label": { fontSize: "0.7rem", fontWeight: 600, px: 1 },
            }}
          />
        )}
      </SelectionGroup>}

      {/* Benefit amount + estimated cost */}
      {amountField && <Box>
        <FormControl fullWidth required={amountField.required} disabled={amountField.disabled}>
          <InputLabel id={amountLabelId}>{amountLabel}</InputLabel>
          <Select
            labelId={amountLabelId}
            label={amountLabel}
            value={amountChoices.includes(currentAmount) ? currentAmount : ""}
            onChange={(event) => onAmountChange(Number(event.target.value))}
          >
            {amountChoices.map((amount) => (
              <MenuItem key={amount} value={amount}>
                {formatUSD(amount, 0)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentAmount > 0 && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ mt: 0.5, minHeight: 20 }}
          >
            {isCalculating ? (
              <CircularProgress
                size={14}
                thickness={4}
                aria-label="Recalculating estimated cost"
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                Est. cost:{" "}
                <EstimatedRate amount={displayedPremium} suffix={rateSuffix} variant="body2" sx={{ color: "primary.main", fontWeight: 700, fontSize: "1.25rem" }} />
              </Typography>
            )}
          </Stack>
        )}
      </Box>}
    </ProductCardSurface>
  );
}
