import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const FieldGroup = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5),
  [theme.breakpoints.up("sm")]: { padding: theme.spacing(2) },
}));

type SectionHeaderProps = {
  label: string;
  icon?: SvgIconComponent;
  /**
   * Semantic presets — use these instead of specifying chipVariant/chipColor/size individually:
   *  "subsection" — uppercase, spaced text (field-group sections)
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
  children?: ReactNode;
  note?: ReactNode;
  sx?: SxProps<Theme>;
};

/** Labeled divider with an optional shared field-group surface below it. */
export default function SectionDivider({
  label,
  icon: Icon,
  variant,
  chipVariant: chipVariantProp = "outlined",
  chipColor: chipColorProp = "primary",
  size: sizeProp = "default",
  children,
  note,
  sx,
}: SectionHeaderProps) {
  const chipVariant = variant === "subsection" ? "text" : chipVariantProp;
  const chipColor = variant === "subsection" ? "default" : chipColorProp;
  const size = variant === "subsection" ? "small" : sizeProp;
  const isSmall = size === "small";
  const chipSx = {
    fontWeight: 700,
    fontSize: isSmall ? "0.75rem" : "0.875rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: isSmall ? "0.25rem 0.5rem" : "1rem 0.75rem",
    marginBottom: isSmall ? "0.5rem" : "0.25rem",
    "& .MuiChip-icon": {
      fontSize: isSmall ? "0.95rem" : "1.25rem",
      marginRight: "0rem",
    },
  };

  const heading = (
    <Divider
      sx={[
        { mt: 2, mb: 2 },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {chipVariant === "text" ? (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1 }}>
          {Icon && <Icon sx={{ fontSize: isSmall ? "0.95rem" : "1.25rem", color: "text.secondary" }} />}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: isSmall ? "0.75rem" : "0.875rem",
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </Typography>
        </Stack>
      ) : (
        <Chip
          label={label}
          color={chipColor}
          variant={chipVariant === "filled" ? "filled" : "outlined"}
          size="small"
          icon={Icon ? <Icon /> : undefined}
          sx={chipSx}
        />
      )}
    </Divider>
  );

  if (children === undefined) return heading;

  return (
    <Box component="section" aria-label={label} sx={{ mb: 4 }}>
      {heading}
      {note}
      <FieldGroup className="FieldGroup-root">
        {children}
      </FieldGroup>
    </Box>
  );
}
