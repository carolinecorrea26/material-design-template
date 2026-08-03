import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography, type SxProps, type Theme } from "@mui/material";

type ApplicantSectionLabelProps = {
  label: string;
  icon?: SvgIconComponent;
  sx?: SxProps<Theme>;
};

/**
 * Styled label for applicant sections — icon + text centered
 * in a rounded, tinted container.
 */
export default function ApplicantSectionLabel({
  label,
  icon: Icon,
  sx,
}: ApplicantSectionLabelProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          borderRadius: "8px",
          backgroundColor: "background.surface",
          padding: "0.5rem",
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {Icon && (
        <Icon
          sx={{
            fontSize: "1.25rem",
            color: "primary.dark",
            backgroundColor: "background.iconBadge",
            borderRadius: "9999px",
            padding: "2px",
            width: "1.25rem",
            height: "1.25rem",
          }}
        />
      )}
      <Typography
        sx={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.4 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
