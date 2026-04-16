import { Stack, Chip } from "@mui/material";
import type { SyntheticEvent } from "react";
import type { CoverageApplicantId } from "../../config/coverages/types";

type DependentChipSelectorProps = {
  /** Applicant IDs available for selection (filtered based on Eligibility dependents) */
  applicantIds: CoverageApplicantId[];
  /** Currently selected applicant IDs for this product */
  selectedApplicants: CoverageApplicantId[];
  /** Called when selection changes */
  onChange: (nextApplicants: CoverageApplicantId[]) => void;
};

const applicantLabels: Record<CoverageApplicantId, string> = {
  member: "Member",
  spouse: "Spouse",
  child: "Child",
};

export default function DependentChipSelector({
  applicantIds,
  selectedApplicants,
  onChange,
}: DependentChipSelectorProps) {
  function stopCardToggle(event: SyntheticEvent) {
    event.stopPropagation();
  }

  // Always include member; only add spouse/child if in applicantIds
  const displayApplicants: CoverageApplicantId[] = ["member"];
  if (applicantIds.includes("spouse")) {
    displayApplicants.push("spouse");
  }
  if (applicantIds.includes("child")) {
    displayApplicants.push("child");
  }

  function toggleApplicant(applicant: CoverageApplicantId) {
    const nextApplicants = selectedApplicants.includes(applicant)
      ? selectedApplicants.filter((a) => a !== applicant)
      : [...selectedApplicants, applicant];

    onChange(nextApplicants);
  }

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      {displayApplicants.map((applicant) => {
        const isSelected = selectedApplicants.includes(applicant);

        return (
          <Chip
            key={applicant}
            label={applicantLabels[applicant]}
            onMouseDown={stopCardToggle}
            onPointerDown={stopCardToggle}
            onKeyDown={stopCardToggle}
            onClick={(e) => {
              e.stopPropagation();
              toggleApplicant(applicant);
            }}
            variant="outlined"
            color={isSelected ? "primary" : "default"}
            sx={{
              borderColor: isSelected ? "primary.main" : "grey.400",
              cursor: "pointer",
              color: isSelected ? "primary.main" : "text.primary",
              "&:hover": {
                borderColor: isSelected ? "primary.main" : "grey.500",
                backgroundColor: isSelected
                  ? "action.hover"
                  : "action.selected",
              },
            }}
          />
        );
      })}
    </Stack>
  );
}
