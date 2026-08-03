import type { SvgIconComponent } from "@mui/icons-material";
import {
  Chip,
  Divider,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

type SectionHeaderProps = {
  label: string;
  icon?: SvgIconComponent;
  /**
   * Semantic presets — use these instead of specifying chipVariant/chipColor/size individually:
   *  "subsection" — outlined, default gray, small (coverage question sub-sections, page sections)
   */
  variant?: "subsection";
  /**
   * "filled"   — solid chip background
   * "outlined" — bordered chip (default)
   * "text"     — plain label text, no chip
   */
  chipVariant?: "filled" | "outlined" | "text";
  /**
   * "primary" (default) — theme primary color
   * "default"           — MUI default gray (for coverage question sub-sections)
   */
  chipColor?: "primary" | "default";
  /** "default" — larger (applicant + category)  "small" — smaller (sub-sections + standalone) */
  size?: "default" | "small";
  sx?: SxProps<Theme>;
};

/**
 * Full-width divider with a centered label chip.
 *
 * Assignments:
 *  Coverage question sub-sections → chipVariant="filled"  chipColor="default"  size="small"
 *  Standalone page sections       → chipVariant="filled"  chipColor="default"  size="small"
 */
export default function SectionHeader({
  label,
  icon: Icon,
  variant,
  chipVariant: chipVariantProp = "outlined",
  chipColor: chipColorProp = "primary",
  size: sizeProp = "default",
  sx,
}: SectionHeaderProps) {
  // Apply variant presets
  const chipVariant = variant === "subsection" ? "outlined" : chipVariantProp;
  const chipColor = variant === "subsection" ? "default" : chipColorProp;
  const size = variant === "subsection" ? "small" : sizeProp;
  const isSmall = size === "small";
  const chipSx = {
    fontWeight: 700,
    fontSize: isSmall ? "0.75rem" : "0.875rem",
    letterSpacing: "0",
    padding: isSmall ? "0.25rem 0.5rem" : "1rem 0.75rem",
    marginBottom: isSmall ? "0.5rem" : "0.25rem",
    "& .MuiChip-icon": {
      fontSize: isSmall ? "0.95rem" : "1.25rem",
      marginRight: "0rem",
    },
  };

  return (
    <Divider
      // textAlign="center"
      sx={[
        { my: isSmall ? 0.5 : 1 },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {chipVariant === "text" ? (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: isSmall ? "0.75rem" : "0.875rem",
            color: "text.secondary",
            textTransform: "uppercase",
            px: 1,
          }}
        >
          {label}
        </Typography>
      ) : (
        <Chip
          label={label}
          color={chipColor}
          variant={chipVariant === "filled" ? "outlined" : "filled"}
          size="small"
          icon={Icon ? <Icon /> : undefined}
          sx={chipSx}
        />
      )}
    </Divider>
  );
}
