import type { ReactNode } from "react";
import { Alert, Box } from "@mui/material";
import {
  applicantSectionTitles,
  applicantIcons,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";
import SectionHeader from "./SectionHeader";

type ApplicantSectionProps = {
  applicant: ApplicantSectionId;
  children: ReactNode;
  showLabel?: boolean;
  /** Optional info note displayed below the section header and above the children. */
  note?: string;
};

export default function ApplicantSection({
  applicant,
  children,
  showLabel = true,
  note,
}: ApplicantSectionProps) {
  const title = applicantSectionTitles[applicant];
  const Icon = applicantIcons[applicant];

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
    <Box sx={{ mb: 2, mt: 1 }}>
      <SectionHeader
        label={title}
        icon={Icon}
        chipVariant="filled"
        chipColor="default"
        sx={{ mb: 2 }}
      />

      {note && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {note}
        </Alert>
      )}

      {children}
    </Box>
  );
}
