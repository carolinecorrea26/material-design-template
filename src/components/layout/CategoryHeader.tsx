import type { ElementType } from "react";
import { Stack, Typography } from "@mui/material";

type CategoryHeaderProps = {
  label: string;
  icon?: ElementType;
};

/**
 * Heading with an optional icon for coverage category sections. Rendered as
 * an h3 (nested under the page's h2) with h6 visual styling preserved.
 * Icon renders in primary color; label renders in default text color.
 */
export default function CategoryHeader({
  label,
  icon: Icon,
}: CategoryHeaderProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && (
        <Icon
          sx={{
            color: "primary.dark",
            borderRadius: "9999px",
            padding: "2px",
            width: "2rem",
            height: "2rem",
          }}
        />
      )}
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 700, lineHeight: 1.3 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
