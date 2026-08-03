import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import EscalatorWarningRoundedIcon from "@mui/icons-material/EscalatorWarningRounded";
import type { SxProps, Theme } from "@mui/material";
import type { CoverageApplicantId } from "./coverages/types";
import type { ClientApplicantLabels } from "./clients/types";

export type ApplicantSectionId = "self" | "spouse" | "child";

type SectionLabelConfig = {
  labels: Partial<Record<CoverageApplicantId, string>>;
  sectionTitles: Partial<Record<ApplicantSectionId, string>>;
  showIcons: {
    applicant: boolean;
    section: boolean;
  };
};

const MAX_APPLICANT_LABEL_LENGTH = 20;

const defaultApplicantLabels: Record<CoverageApplicantId, string> = {
  member: "You",
  spouse: "Your Spouse",
  child: "Your Child(ren)",
};

const defaultApplicantSectionTitles: Record<ApplicantSectionId, string> = {
  self: "You",
  spouse: "Your Spouse",
  child: "Your Child(ren)",
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
  self: PersonRoundedIcon,
  spouse: SupervisorAccountRoundedIcon,
  child: EscalatorWarningRoundedIcon,
} satisfies Record<ApplicantSectionId, typeof PersonRoundedIcon>;

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

function truncateLabel(label: string): string {
  return label.slice(0, MAX_APPLICANT_LABEL_LENGTH);
}

/**
 * Resolve applicant labels from client overrides, falling back to defaults.
 * Labels are truncated to 20 characters max.
 */
export function getResolvedApplicantLabels(
  clientOverrides?: ClientApplicantLabels,
): Record<CoverageApplicantId, string> {
  return {
    member: truncateLabel(
      clientOverrides?.member ?? defaultApplicantLabels.member,
    ),
    spouse: truncateLabel(
      clientOverrides?.spouse ?? defaultApplicantLabels.spouse,
    ),
    child: truncateLabel(
      clientOverrides?.child ?? defaultApplicantLabels.child,
    ),
  };
}

/**
 * Resolve applicant section titles from client overrides, falling back to defaults.
 * Labels are truncated to 20 characters max.
 */
export function getResolvedApplicantSectionTitles(
  clientOverrides?: ClientApplicantLabels,
): Record<ApplicantSectionId, string> {
  return {
    self: truncateLabel(
      clientOverrides?.member ?? defaultApplicantSectionTitles.self,
    ),
    spouse: truncateLabel(
      clientOverrides?.spouse ?? defaultApplicantSectionTitles.spouse,
    ),
    child: truncateLabel(
      clientOverrides?.child ?? defaultApplicantSectionTitles.child,
    ),
  };
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

/** @deprecated Use SectionHeader component directly */
export const applicantSectionBannerSx: SxProps<Theme> = {
  backgroundColor: "rgb(234 242 255 / 84%)",
  padding: "0.5rem 1.25rem",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "center",
};

/** @deprecated Use SectionHeader component directly */
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
