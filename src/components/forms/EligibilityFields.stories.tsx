import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import EligibilityFields, { type EligibilityValues } from "./EligibilityFields";

/**
 * EligibilityFields is a shared DOB/ZIP/State trio used by the Home page's
 * quote entry card and inside QuoteCalculator's eligibility-collection step.
 * ZIP auto-derives State (deriveStateProvinceFromZipOrPostalCode); editing
 * ZIP again re-derives it, but a manual State edit isn't overwritten until
 * the next ZIP change. Unlike FieldRenderer's always-on RHF errors, this
 * component defers error display behind an explicit `attempted` prop — a
 * deliberate exception worth knowing before assuming FieldRenderer's
 * validation-display convention applies everywhere.
 */
const meta = {
  title: "Coverage & Commerce/EligibilityFields",
  component: EligibilityFields,
  parameters: { layout: "padded" },
} satisfies Meta<typeof EligibilityFields>;

export default meta;

function EligibilityDemo({
  initialValues = { birthday: "", zipCode: "", state: "" },
  attempted = false,
  ageError,
}: {
  initialValues?: EligibilityValues;
  attempted?: boolean;
  ageError?: string;
}) {
  const [values, setValues] = useState<EligibilityValues>(initialValues);
  return (
    <Box sx={{ maxWidth: 420 }}>
      <EligibilityFields
        values={values}
        onChange={(next) => setValues((current) => ({ ...current, ...next }))}
        attempted={attempted}
        ageError={ageError}
      />
    </Box>
  );
}

export const Default: StoryObj = {
  render: () => <EligibilityDemo />,
};

export const ZipAutoDerivesState: StoryObj = {
  name: "ZIP auto-derives State (try editing ZIP)",
  render: () => <EligibilityDemo initialValues={{ birthday: "", zipCode: "10001", state: "NY" }} />,
  parameters: {
    docs: {
      description: {
        story:
          "Pre-filled from a real ZIP so State starts correctly derived. Change the ZIP to see State update automatically; a manual State selection afterward survives until ZIP changes again.",
      },
    },
  },
};

export const RequiredErrors: StoryObj = {
  name: "attempted=true, all fields empty",
  render: () => <EligibilityDemo attempted />,
};

export const AgeIneligible: StoryObj = {
  name: "ageError (age 80+)",
  render: () => (
    <EligibilityDemo
      initialValues={{ birthday: "1940-01-01", zipCode: "10001", state: "NY" }}
      attempted
      ageError="We're sorry, but coverage is not available for applicants age 80 or older."
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "ageError is computed externally by the exported validateEligibility() helper, not by this component — callers own the age >= 80 exclusion rule and pass the resulting message in.",
      },
    },
  },
};
