import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from "@mui/material";
import Diversity1RoundedIcon from "@mui/icons-material/Diversity1Rounded";
import CategoryCard from "./CategoryCard";

/**
 * CategoryCard wraps CategoryHeader plus a content Stack in the shared
 * category-section surface (CATEGORY_SECTION_SX). Used on Payment,
 * Beneficiary, and ProductCatalog.
 */
const meta = {
  title: "Layout/CategoryCard",
  component: CategoryCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CategoryCard>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <CategoryCard label="Life Insurance" icon={Diversity1RoundedIcon}>
      <Typography variant="body2">Product cards for this category go here.</Typography>
      <Typography variant="body2">A second content block.</Typography>
    </CategoryCard>
  ),
};
