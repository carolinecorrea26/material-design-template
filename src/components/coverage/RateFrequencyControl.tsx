import { requirementCoverageControl } from "../../domain/requirementFields";
import type { FieldDefinition } from "../../domain/fields";
import { Stack, Typography, type StackProps } from "@mui/material";
import RateFrequencyToggle from "./RateFrequencyToggle";

export type RateFrequency = "monthly" | "annual";

type RateFrequencyControlProps = {
  value: RateFrequency;
  onChange: (value: RateFrequency) => void;
  justifyContent?: StackProps["justifyContent"];
  ariaLabel?: string;
  field?: FieldDefinition;
};

/** Labeled monthly/annual control shared by quote and cart cost summaries. */
export default function RateFrequencyControl({
  value,
  onChange,
  justifyContent = "center",
  field,
  ariaLabel = requirementCoverageControl("rate-frequency").label,
}: RateFrequencyControlProps) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      justifyContent={justifyContent}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color={value === "monthly" ? "primary.main" : "text.secondary"}
      >
        {field?.options?.find(option => option.value === "monthly")?.label ?? requirementCoverageControl("rate-frequency").options!.find(option => option.value === "monthly")!.label}
      </Typography>
      <RateFrequencyToggle
        checked={value === "annual"}
        onChange={(event) => onChange(event.target.checked ? "annual" : "monthly")}
        slotProps={{ input: { "aria-label": field?.label ?? ariaLabel } }}
      />
      <Typography
        variant="caption"
        fontWeight={700}
        color={value === "annual" ? "primary.main" : "text.secondary"}
      >
        {field?.options?.find(option => option.value === "annual")?.label ?? requirementCoverageControl("rate-frequency").options!.find(option => option.value === "annual")!.label}
      </Typography>
    </Stack>
  );
}
