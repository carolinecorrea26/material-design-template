import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  getResolvedApplicantSectionTitles,
  applicantIcons,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";
import type { ClientApplicantLabels } from "../../config/clients/types";

export function ApplicantSectionLabel({
  label,
  icon: Icon,
  sx,
}: {
  label: string;
  icon?: SvgIconComponent;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          borderRadius: "8px",
          backgroundColor: "action.hover",
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
            backgroundColor: "grey.200",
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

type ApplicantSectionDividerProps = {
  applicant: ApplicantSectionId;
  children: ReactNode;
  showLabel?: boolean;
  labels?: ClientApplicantLabels;
  /** Optional info note displayed below the section header and above the children. */
  note?: string;
};

export default function ApplicantSectionDivider({
  applicant,
  children,
  showLabel = true,
  labels,
  note,
}: ApplicantSectionDividerProps) {
  const sectionTitles = getResolvedApplicantSectionTitles(
    labels,
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
