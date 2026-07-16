import type { ReactNode } from "react";
import { Alert, Box, Typography } from "@mui/material";
import {
  applicantSectionTitles,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";

type ApplicantSectionProps = {
  applicant: ApplicantSectionId;
  children: ReactNode;
  showLabel?: boolean;
  /** Optional info note displayed below the applicant title and above the children */
  note?: string;
};

export default function ApplicantSection({
  applicant,
  children,
  showLabel = true,
  note,
}: ApplicantSectionProps) {
  const title = applicantSectionTitles[applicant];

  if (!showLabel) {
    return (
      <>
        {note && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {note}
          </Alert>
        )}
        {children}
      </>
    );
  }

  return (
    <Box sx={{ mb: 4, mt: 3 }}>
      <Box
        sx={{
          background: "rgb(234 242 255 / 84%)",
          padding: "0.5rem 1.25rem",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Typography variant="formSectionLabel" sx={{ display: "block" }}>
          {title}
        </Typography>
      </Box>

      {note && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {note}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}
