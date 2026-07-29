import type { SvgIconComponent } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

type CategoryHeaderProps = {
  label: string;
  icon?: SvgIconComponent;
};

/**
 * Simple h6 heading with an optional icon for coverage category sections.
 * Icon renders in primary color; label renders in default text color.
 */
export default function CategoryHeader({ label, icon: Icon }: CategoryHeaderProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && (
        <Icon sx={{ color: "primary.main", fontSize: "1.25rem" }} />
      )}
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
        {label}
      </Typography>
    </Stack>
  );
}
