import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import EstimatorProductCard from "./EstimatorProductCard";

/**
 * EstimatorProductCard is the quote-estimator's deliberately simplified
 * product card — member-only (no spouse/child toggles), no riders, no
 * waiting periods — used inside QuoteCalculator (and formerly QuoteModal).
 * It's a controlled component: selection and amount live in the consumer,
 * and displayedPremium/isCalculating are computed externally rather than
 * derived internally, so every story below wires that up locally. See
 * Layout/ProductCard for the full-featured card this deliberately omits
 * from — compare them side by side to see exactly what's simplified.
 */
const meta = {
  title: "Coverage & Commerce/EstimatorProductCard",
  component: EstimatorProductCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof EstimatorProductCard>;

export default meta;

const baseProduct = {
  id: "term-life",
  name: "Term Life Insurance",
  description: "Affordable coverage for a set period of time.",
  categoryId: "LI" as const,
};

function EstimatorProductCardDemo({
  product = baseProduct,
  isCalculating = false,
  initialSelected = false,
  initialAmount = 100000,
}: {
  product?: typeof baseProduct & { underwritingType?: string; featured?: boolean };
  isCalculating?: boolean;
  initialSelected?: boolean;
  initialAmount?: number;
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [amount, setAmount] = useState(initialAmount);
  const displayedPremium = amount * 0.00035;

  return (
    <Box sx={{ maxWidth: 360 }}>
      <EstimatorProductCard
        product={product}
        currentAmount={amount}
        amountChoices={[50000, 100000, 250000, 500000]}
        selected={selected}
        isCalculating={isCalculating}
        displayedPremium={displayedPremium}
        rateSuffix="/mo"
        onToggleSelected={() => setSelected((s) => !s)}
        onAmountChange={setAmount}
      />
    </Box>
  );
}

export const Unselected: StoryObj = {
  render: () => <EstimatorProductCardDemo />,
};

export const Selected: StoryObj = {
  render: () => <EstimatorProductCardDemo initialSelected />,
};

export const Featured: StoryObj = {
  render: () => <EstimatorProductCardDemo product={{ ...baseProduct, featured: true }} />,
};

export const QuickDecisionEligible: StoryObj = {
  name: 'underwritingType="QD"',
  render: () => (
    <EstimatorProductCardDemo product={{ ...baseProduct, underwritingType: "QD" }} initialSelected />
  ),
};

export const Calculating: StoryObj = {
  name: "isCalculating (recalculating estimate)",
  render: () => <EstimatorProductCardDemo initialSelected isCalculating />,
};
