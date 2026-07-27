import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { Alert, Box } from "@mui/material";
import {
  applicantSectionTitles,
  applicantSectionBannerSx,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";
import FormSectionTitle from "./SectionTitle";

type ApplicantSectionProps = {
  applicant: ApplicantSectionId;
  children: ReactNode;
  showLabel?: boolean;
  /** Optional icon rendered beside the applicant label in the banner. */
  icon?: SvgIconComponent;
  /** Optional info note displayed below the applicant banner and above the children. */
  note?: string;
};

export default function ApplicantSection({
  applicant,
  children,
  showLabel = true,
  icon,
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
      <Box sx={applicantSectionBannerSx}>
        <FormSectionTitle label={title} icon={icon} />
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
