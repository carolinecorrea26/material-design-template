import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
} from "@mui/material";
import SelectionGroup from "./SelectionGroup";
import type {
  CoverageCategory,
  CoverageCategoryId,
} from "../../config/coverageCategories";

type CoverageCategorySelectorProps = {
  /** Categories available for selection. */
  categories: readonly CoverageCategory[];
  /** Currently selected category IDs. */
  selectedIds: readonly CoverageCategoryId[];
  /** Toggle a category on/off. */
  onToggle: (id: CoverageCategoryId) => void;
  /** Label shown above the selector. */
  legend?: string;
  /** Whether to show a validation error state. */
  error?: boolean;
  /** Error message to display below the selector. */
  errorMessage?: string;
};

/**
 * Reusable multi-select coverage category toggle list.
 * Used on Coverage page, QuoteCalculator, and QuoteModal.
 */
export default function CoverageCategorySelector({
  categories,
  selectedIds,
  onToggle,
  legend = "Select any coverage categories that you want to apply for:",
  error = false,
  errorMessage,
}: CoverageCategorySelectorProps) {
  return (
    <FormControl component="fieldset" error={error}>
      <FormLabel component="legend" required sx={{ mb: 1.5 }}>
        {legend}
      </FormLabel>
      <Stack spacing={1.5}>
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedIds.includes(category.id);
          return (
            <SelectionGroup
              key={category.id}
              component="div"
              role="checkbox"
              aria-checked={isSelected}
              checked={isSelected}
              tabIndex={0}
              onClick={() => onToggle(category.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onToggle(category.id);
                }
              }}
            >
              <Box
                className="SelectionGroup-icon"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  sx={{
                    color: "primary.dark",
                    backgroundColor: "background.iconBadge",
                    borderRadius: "9999px",
                    padding: "2px",
                    width: "2rem",
                    height: "2rem",
                  }}
                />
              </Box>
              <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  component="span"
                  className="SelectionGroup-label"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {category.label}
                </Box>
              </Stack>
            </SelectionGroup>
          );
        })}
      </Stack>
      {error && errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
}
