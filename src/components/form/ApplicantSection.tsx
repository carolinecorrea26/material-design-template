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
          padding: "0rem 1.25rem",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="formApplicantSectionLabel"
          sx={{ color: "#4e6d9c", display: "block" }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}
