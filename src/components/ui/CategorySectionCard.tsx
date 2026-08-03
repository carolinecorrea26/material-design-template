import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";
import CategoryHeader from "../CategoryHeader";
import { CATEGORY_SECTION_SX } from "../../config/constants";

type CategorySectionCardProps = {
  label: string;
  icon?: SvgIconComponent;
  children: ReactNode;
};

/**
 * Surface card wrapping a category header + content stack.
 * Used on Payment, Beneficiary, and ProductCatalog pages.
 */
export default function CategorySectionCard({
  label,
  icon: CatIcon,
  children,
}: CategorySectionCardProps) {
  return (
    <Box sx={CATEGORY_SECTION_SX}>
      <CategoryHeader label={label} icon={CatIcon} />
      <Stack spacing={2} sx={{ mt: 2 }}>
        {children}
      </Stack>
    </Box>
  );
}
