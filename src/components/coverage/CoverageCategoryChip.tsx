import * as React from "react";
import { Chip } from "@mui/material";
import CoverageIcon from "../../utils/coverageIcons";
import { commonStyles } from "../../theme/commonStyles";
import type { CoverageCategory } from "../../types/app";

interface CoverageCategoryChipProps {
  category: CoverageCategory;
  size?: "small" | "medium";
}

export default function CoverageCategoryChip({ category, size = "small" }: CoverageCategoryChipProps) {
  return (
    <Chip
      icon={<CoverageIcon category={category} sx={{ color: 'primary.main' }} />}
      label=""
      size={size}
      sx={commonStyles.iconOnlyChip}
    />
  );
}