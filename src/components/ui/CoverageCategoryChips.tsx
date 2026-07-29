import { Box, Chip, Stack, Typography } from "@mui/material";
import {
  coverageCategories,
  type CoverageCategoryId,
} from "../../config/coverageCategories";
import type { CoverageDefinition } from "../../config/coverages/types";

type CoverageCategoryChipsProps = {
  coverages: CoverageDefinition[];
  selectedCategories: CoverageCategoryId[];
  onToggle: (categoryId: CoverageCategoryId) => void;
  label?: string;
};

/**
 * Multi-select chip row for choosing coverage categories.
 * Filters available categories based on the provided coverage list.
 */
export default function CoverageCategoryChips({
  coverages,
  selectedCategories,
  onToggle,
  label = "Coverage category",
}: CoverageCategoryChipsProps) {
  const availableCategories = coverageCategories.filter((category) =>
    coverages.some((coverage) => coverage.categoryId === category.id),
  );

  if (!availableCategories.length) return null;

  return (
    <Box>
      <Typography variant="overline" sx={{ mb: 1, display: "block" }}>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
        {availableCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.id);
          return (
            <Chip
              key={category.id}
              className="coverageCategoryChip"
              icon={<Icon sx={{ fontSize: "1.25rem !important" }} />}
              label={
                "shortLabel" in category ? category.shortLabel : category.label
              }
              variant={isSelected ? "filled" : "outlined"}
              color={isSelected ? "primary" : "default"}
              onClick={() => onToggle(category.id)}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
