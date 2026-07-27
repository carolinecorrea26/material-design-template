import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import type { SxProps, Theme } from "@mui/material";
import type { CoverageApplicantId } from "./coverages/types";

export type ApplicantSectionId = "self" | "spouse" | "child";

type SectionLabelConfig = {
  labels: Partial<Record<CoverageApplicantId, string>>;
  sectionTitles: Partial<Record<ApplicantSectionId, string>>;
  showIcons: {
    applicant: boolean;
    section: boolean;
  };
};

const defaultApplicantLabels: Record<CoverageApplicantId, string> = {
  member: "Member",
  spouse: "Spouse",
  child: "Child",
};

const defaultApplicantSectionTitles: Record<ApplicantSectionId, string> = {
  self: "Member",
  spouse: "Spouse",
  child: "Child",
};

// Configure section labels and icon visibility here.
export const sectionLabelConfig: SectionLabelConfig = {
  labels: {},
  sectionTitles: {},
  showIcons: {
    applicant: true,
    section: true,
  },
};

export const applicantLabels: Record<CoverageApplicantId, string> = {
  ...defaultApplicantLabels,
  ...sectionLabelConfig.labels,
};

export const applicantSectionTitles: Record<ApplicantSectionId, string> = {
  ...defaultApplicantSectionTitles,
  ...sectionLabelConfig.sectionTitles,
};

export const applicantIcons = {
  self: PersonOutlineIcon,
  spouse: FavoriteBorderIcon,
  child: ChildCareIcon,
} satisfies Record<ApplicantSectionId, typeof PersonOutlineIcon>;

export const coverageApplicantToSection: Record<
  CoverageApplicantId,
  ApplicantSectionId
> = {
  member: "self",
  spouse: "spouse",
  child: "child",
};

export function getApplicantIcon(applicant: CoverageApplicantId) {
  return applicantIcons[coverageApplicantToSection[applicant]];
}

export function shouldShowSectionLabelIcon(
  kind: keyof SectionLabelConfig["showIcons"],
  showIcon?: boolean,
) {
  if (showIcon == null) {
    return sectionLabelConfig.showIcons[kind];
  }

  return showIcon;
}

/** Shared banner style used by ApplicantSection to visually group fields by applicant. */
export const applicantSectionBannerSx: SxProps<Theme> = {
  backgroundColor: "rgb(234 242 255 / 84%)",
  padding: "0.5rem 1.25rem",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "center",
};

export const sectionTitleIconSx: SxProps<Theme> = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  backgroundColor: "rgba(7, 104, 255, 0.08)",
  color: "primary.main",
  "& svg": {
    width: "0.875em",
    height: "0.875em",
  },
};

export const inlineCoverageIconSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: "primary.main",
  "& svg": {
    width: "0.875em",
    height: "0.875em",
  },
};
