import { Stack, Typography, type StackProps } from "@mui/material";
import RateFrequencyToggle from "./RateFrequencyToggle";

export type RateFrequency = "monthly" | "annual";

type RateFrequencyControlProps = {
  value: RateFrequency;
  onChange: (value: RateFrequency) => void;
  justifyContent?: StackProps["justifyContent"];
  ariaLabel?: string;
};

/** Labeled monthly/annual control shared by quote and cart cost summaries. */
export default function RateFrequencyControl({
  value,
  onChange,
  justifyContent = "center",
  ariaLabel = "Toggle estimated cost between monthly and annual",
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
        Monthly
      </Typography>
      <RateFrequencyToggle
        checked={value === "annual"}
        onChange={(event) => onChange(event.target.checked ? "annual" : "monthly")}
        slotProps={{ input: { "aria-label": ariaLabel } }}
      />
      <Typography
        variant="caption"
        fontWeight={700}
        color={value === "annual" ? "primary.main" : "text.secondary"}
      >
        Annual
      </Typography>
    </Stack>
  );
}
