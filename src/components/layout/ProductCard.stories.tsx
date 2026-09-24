import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import ProductCard from "./ProductCard";

/**
 * ProductCard is the bordered card wrapper underneath every product row —
 * ProductCatalog's full card, EstimatorProductCard's simplified card,
 * QuoteCalculator, Beneficiary, Payment, Receipt. `selected` swaps the border and
 * background tint to a green "chosen" treatment.
 */
const meta = {
  title: "Layout/ProductCard",
  component: ProductCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProductCard>;

export default meta;

export const Unselected: StoryObj = {
  render: () => (
    <ProductCard sx={{ maxWidth: 360 }}>
      <Typography variant="productNameLabel">Term Life Insurance</Typography>
      <Typography variant="body2" color="text.secondary">$250,000 coverage</Typography>
    </ProductCard>
  ),
};

export const Selected: StoryObj = {
  render: () => (
    <ProductCard selected sx={{ maxWidth: 360 }}>
      <Typography variant="productNameLabel">Term Life Insurance</Typography>
      <Typography variant="body2" color="text.secondary">$250,000 coverage</Typography>
    </ProductCard>
  ),
};

export const SideBySide: StoryObj = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <ProductCard sx={{ maxWidth: 280 }}>
        <Typography variant="productNameLabel">Unselected</Typography>
      </ProductCard>
      <ProductCard selected sx={{ maxWidth: 280 }}>
        <Typography variant="productNameLabel">Selected</Typography>
      </ProductCard>
    </Stack>
  ),
};
