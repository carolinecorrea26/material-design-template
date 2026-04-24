import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import {
  applicantIcons,
  applicantSectionTitles,
  sectionTitleIconSx,
  shouldShowSectionLabelIcon,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";

type ApplicantSectionProps = {
  applicant: ApplicantSectionId;
  children: ReactNode;
  showLabel?: boolean;
  showIcon?: boolean;
};

export default function ApplicantSection({
  applicant,
  children,
  showLabel = true,
  showIcon,
}: ApplicantSectionProps) {
  const Icon = applicantIcons[applicant];
  const title = applicantSectionTitles[applicant];
  const iconVisible = shouldShowSectionLabelIcon("applicant", showIcon);

  if (!showLabel) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        {iconVisible ? (
          <Box sx={sectionTitleIconSx}>
            <Icon />
          </Box>
        ) : null}

        <Typography
          sx={{
            lineHeight: 2.66,
            textTransform: "uppercase",
            color: "#4a6081",
            display: "block",
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "1px",
          }}
        >
          {title}
        </Typography>
      </Stack>

      <Box
        sx={{
          px: 0,
          py: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
