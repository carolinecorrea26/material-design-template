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
  id: "layout-productcard",
  title: "Components/Content and data display/Cards/Product card",
  component: ProductCard,
  parameters: { docs: { description: { component: "Shared product container and title across Coverage, Beneficiary, Payment, quote estimates and Receipt. Owns consistent title typography, optional brochure link, description and header adornments. Each flow supplies its own body and selection state." } }, layout: "padded" },
} satisfies Meta<typeof ProductCard>;

export default meta;

export const Unselected: StoryObj = {
  render: () => (
    <ProductCard productName="Term Life Insurance" sx={{ maxWidth: 360 }}>
      <Typography variant="body2" color="text.secondary">$250,000 coverage</Typography>
    </ProductCard>
  ),
};

export const Selected: StoryObj = {
  render: () => (
    <ProductCard selected productName="Term Life Insurance" sx={{ maxWidth: 360 }}>
      <Typography variant="body2" color="text.secondary">$250,000 coverage</Typography>
    </ProductCard>
  ),
};

export const SideBySide: StoryObj = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <ProductCard productName="Unselected" sx={{ maxWidth: 280 }} />
      <ProductCard selected productName="Selected" sx={{ maxWidth: 280 }} />
    </Stack>
  ),
};

export const SharedTitle: StoryObj = {
  render: () => <Stack spacing={2} sx={{ maxWidth: 440 }}>
    <ProductCard productName="Term Life Insurance" quickDecision brochureUrl="/" description="Coverage and quote examples can include a description and brochure link.">
      <Typography variant="body2">Coverage controls appear here.</Typography>
    </ProductCard>
    <ProductCard productName="Term Life Insurance" quickDecision>
      <Typography variant="body2">Beneficiary or payment controls appear here.</Typography>
    </ProductCard>
  </Stack>,
};
