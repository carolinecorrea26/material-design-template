import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import { sectionTitleIconSx } from "../../config/formSectionTitle";

export type SectionTitleVariant = "section" | "applicant";

type SectionTitleProps = {
  label: string;
  icon?: SvgIconComponent;
  /**
   * Controls the visual treatment of the title:
   *
   * "section" (default) — plain label with no background. Used for page-level
   * section groupings like "Banking Information" or "Membership Information".
   *
   * "applicant" — blue-tinted banner background with centered layout. Used
   * wherever fields are scoped to a specific applicant (Member, Spouse, Child).
   *
   * Additional variants can be added here as the design system grows.
   */
  variant?: SectionTitleVariant;
  sx?: SxProps<Theme>;
};

const variantStyles: Record<SectionTitleVariant, SxProps<Theme>> = {
  section: {},
  applicant: {
    backgroundColor: "rgb(234 242 255 / 84%)",
    padding: "0.5rem 1.25rem",
    borderRadius: "8px",
    justifyContent: "center",
  },
};

export default function SectionTitle({
  label,
  icon: Icon,
  variant = "section",
  sx,
}: SectionTitleProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={[
        variantStyles[variant],
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {Icon ? (
        <Box sx={sectionTitleIconSx}>
          <Icon />
        </Box>
      ) : null}

      <Box
        component="span"
        sx={{
          typography: "formSectionLabel",
          display: "block",
        }}
      >
        {label}
      </Box>
    </Stack>
  );
}
