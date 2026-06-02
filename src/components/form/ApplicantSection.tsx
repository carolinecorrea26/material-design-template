import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import {
  applicantSectionTitles,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";

type ApplicantSectionProps = {
  applicant: ApplicantSectionId;
  children: ReactNode;
  showLabel?: boolean;
};

export default function ApplicantSection({
  applicant,
  children,
  showLabel = true,
}: ApplicantSectionProps) {
  const title = applicantSectionTitles[applicant];

  if (!showLabel) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ mb: 4, mt: 3 }}>
      <Box
        sx={{
          background: "rgb(234 242 255 / 84%)",
          padding: "0.5rem 1.25rem",
          borderRadius: "20px 20px 4px 4px",
          display: "flex",
          justifyContent: "center",
          mb: 1.5,
        }}
      >
        <Typography
          variant="formApplicantSectionLabel"
          sx={{ color: "#4e6d9c", display: "block" }}
        >
          {title}
        </Typography>
      </Box>

      <Box>{children}</Box>
    </Box>
  );
}
