import type { ReactNode } from "react";
import { Alert, Box } from "@mui/material";
import {
  getResolvedApplicantSectionTitles,
  applicantIcons,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";
import { getActiveClient } from "../../config/client/getActiveClient";
import ApplicantSectionLabel from "./ApplicantSectionLabel";

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
  const sectionTitles = getResolvedApplicantSectionTitles(
    getActiveClient().applicantLabels,
  );
  const title = sectionTitles[applicant];
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
      <ApplicantSectionLabel label={title} icon={Icon} sx={{ mb: 2 }} />

      {note && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {note}
        </Alert>
      )}

      {children}
    </Box>
  );
}
