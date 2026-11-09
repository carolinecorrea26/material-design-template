import { requirementValidationMessage } from "../../domain/requirementValidations";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import EligibilityFields, { type EligibilityValues } from "./EligibilityFields";

/**
 * EligibilityFields is a shared ZIP/State/Birthday trio used by Eligibility, the Home page's
 * quote entry card and inside QuoteCalculator's eligibility-collection step.
 * ZIP auto-derives State (deriveStateProvinceFromZipOrPostalCode); editing
 * ZIP again re-derives it, but a manual State edit isn't overwritten until
 * the next ZIP change. Unlike FieldRenderer's always-on RHF errors, this
 * component defers error display behind an explicit `attempted` prop — a
 * deliberate exception worth knowing before assuming FieldRenderer's
 * validation-display convention applies everywhere.
 */
const meta = {
  id: "coverage-commerce-eligibilityfields",
  title: "Components/Pages/Eligibility/Sections/Eligibility details",
  component: EligibilityFields,
  parameters: { standalone: true, docs: { description: { component: "Collects and validates applicant eligibility details." } }, layout: "padded" },
} satisfies Meta<typeof EligibilityFields>;

export default meta;

function EligibilityDemo({
  initialValues = { birthday: "", zipCode: "", state: "" },
  attempted = false,
  eligibilityError,
}: {
  initialValues?: EligibilityValues;
  attempted?: boolean;
  eligibilityError?: string;
}) {
  const [values, setValues] = useState<EligibilityValues>(initialValues);
  return (
    <Box sx={{ maxWidth: 420 }}>
      <EligibilityFields
        values={values}
        onChange={(next) => setValues((current) => ({ ...current, ...next }))}
        attempted={attempted}
        eligibilityError={eligibilityError}
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
  parameters: { standalone: true,
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
  name: "Ineligible applicant",
  render: () => (
    <EligibilityDemo
      initialValues={{ birthday: "1940-01-01", zipCode: "10001", state: "NY" }}
      attempted
      eligibilityError={requirementValidationMessage("applicant-ineligible")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The caller supplies the result of its configured eligibility checks. State and age exclusions use the same shared page alert; missing or malformed values use standard inline field messages.",
      },
    },
  },
};
