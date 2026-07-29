import type { SvgIconComponent } from "@mui/icons-material";
import { Chip, Divider, type SxProps, type Theme } from "@mui/material";

type SectionHeaderProps = {
  label: string;
  icon?: SvgIconComponent;
  sx?: SxProps<Theme>;
};

/**
 * Full-width divider with a centered primary Chip for section labeling.
 * Replaces the old SectionTitle component — handles both page-level sections
 * (e.g. "Banking Information") and applicant-scoped sections (Member, Spouse, Child).
 */
export default function SectionHeader({
  label,
  icon: Icon,
  sx,
}: SectionHeaderProps) {
  return (
    <Divider sx={[{ my: 1 }, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}>
      <Chip
        label={label}
        color="primary"
        variant="outlined"
        size="small"
        icon={Icon ? <Icon /> : undefined}
        sx={{
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          "& .MuiChip-icon": {
            fontSize: "1.2rem",
          },
        }}
      />
    </Divider>
  );
}
