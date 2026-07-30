import { useState } from "react";
import { Box, FormLabel, Stack, Typography } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "../app/RoutePage";
import ApplicantSection from "../components/forms/ApplicantSection";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../utils/applicantVisibility";
import FieldRenderer from "../components/forms/FieldRenderer";
import DynamicList from "../components/forms/DynamicList";
import AppDrawer from "../components/ui/AppDrawer";
import FormHelpChips from "../components/content/HelpChips";
import type { FieldDefinition } from "../config/fields/types";

// ─── Help content ─────────────────────────────────────────────────────────────

const HELP_ITEMS = [
  {
    id: "health-info-use",
    label: "How is my health information used?",
    title: "How is my health information used?",
    content: (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.7 }}
      >
        Some insurance products require health information as part of the
        application process. Your health information is only used to review your
        application and is handled securely in accordance with our privacy
        practices. This information helps when providing a decision for your
        requested coverage.
      </Typography>
    ),
  },
];

// ─── DynamicList: health-details-specific ────────────────────────────────────

const detailsFields: FieldDefinition[] = [
  {
    id: "onset",
    label: "Month/Year of Onset",
    inputType: "text",
    format: "month-year",
    required: true,
    helperText: "mm/yyyy",
    labelVariant: "standard",
  },
  {
    id: "conditionsDetails",
    label:
      "Condition/Medication & Details (e.g. Medical Advice Given, Treatment, Results, Date Recovered)",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and Address of Each Physician, Practitioner, and Hospital",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

const detailsMapping = {
  fields: detailsFields,
  fieldToKey: {
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

function renderDetailsItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.onset && (
        <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)" }}>
          Onset: {item.onset}
        </span>
      )}
      <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
        {item.conditionsDetails || "No details provided"}
      </span>
    </Stack>
  );
}

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key: "q1",
    label:
      "Are you now taking any prescribed medication or receiving or contemplating any medical attention or surgical treatment?",
  },
  {
    key: "q2",
    label:
      "During the past five years, have you ever been medically diagnosed by a physician as having or been treated for: heart or circulatory trouble, elevated blood pressure, chest pain or pressure, gynecological or genitourinary disorders, ulcers, cancer, diabetes, mental or nervous disorder or psychotherapeutic treatment, epilepsy, respiratory disorder, kidney or liver disorder, including hepatitis, enlarged lymph nodes or immunodeficiency disorder, thyroid disorder, blood disorder, allergies, blood, pus or sugar in urine, back trouble/disorder, bone or joint disorder, arthritis, varicose veins, or unexplained weight loss?",
  },
  {
    key: "q3",
    label:
      "During the past five years have you ever been counseled, treated or hospitalized for the use of alcohol or drugs?",
  },
  {
    key: "q4",
    label: "Are you now pregnant?",
  },
  {
    key: "q5",
    label:
      "Are you now disabled, or applied or applying for, or receiving any disability or Workers\u2019 Compensation benefits or a waiver of premium for life or health insurance?",
  },
];

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// ─── Field builders ───────────────────────────────────────────────────────────

function createAnswerFields(applicant: "self" | "spouse"): FieldDefinition[] {
  const suffix = applicant === "spouse" ? "-spouse" : "";
  return QUESTIONS.map((q) => ({
    id: `health-si-${q.key}${suffix}`,
    label: q.label,
    inputType: "radio" as const,
    required: true,
    options: yesNoOptions,
    labelVariant: "standard" as const,
  }));
}

// ─── Per-applicant question set ───────────────────────────────────────────────

interface QuestionSetProps {
  applicant: "self" | "spouse";
  control: FormRouteRenderProps["control"];
  errors: FormRouteRenderProps["errors"];
  watchedValues: FormRouteRenderProps["watchedValues"];
  allFields: FieldDefinition[];
}

function QuestionSet({
  applicant,
  control,
  errors,
  watchedValues,
  allFields,
}: QuestionSetProps) {
  const suffix = applicant === "spouse" ? "-spouse" : "";

  return (
    <Stack component="ol" spacing={3} sx={{ listStyle: "none", pl: 0 }}>
      {QUESTIONS.map((q, index) => {
        const answerId = `health-si-${q.key}${suffix}`;
        const listName = `health-si-${q.key}${suffix}-details`;
        const isYes = watchedValues[answerId] === "yes";
        const questionField = allFields.find((f) => f.id === answerId);
        if (!questionField) return null;

        return (
          <Box
            key={answerId}
            component="li"
            sx={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: 1.5,
              alignItems: "start",
            }}
          >
            <Box component="span" sx={{ fontWeight: 500, textAlign: "right" }}>
              {index + 1}.
            </Box>

            <Stack spacing={2}>
              <Box>
                <FormLabel required sx={{ display: "inline-block", mb: 1 }}>
                  {questionField.label}
                </FormLabel>
                <FieldRenderer
                  field={questionField}
                  control={control}
                  errors={errors}
                  hideLabel
                  margin="none"
                />
              </Box>

              {isYes && (
                <DynamicList
                  control={control}
                  name={listName}
                  label="details"
                  mapping={detailsMapping}
                  renderItem={renderDetailsItem}
                />
              )}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthSi() {
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem = HELP_ITEMS.find((i) => i.id === activeHelpId) ?? null;

  return (
    <FormRoutePage
      pageId="health-si"
      help={
        <>
          <FormHelpChips items={HELP_ITEMS} onSelect={setActiveHelpId} />
          <AppDrawer
            open={!!activeHelpItem}
            title={activeHelpItem?.title ?? ""}
            onClose={() => setActiveHelpId(null)}
          >
            {activeHelpItem?.content}
          </AppDrawer>
        </>
      }
      devFillFields={(currentValues) => [
        ...(isApplicantApplying("self", currentValues)
          ? createAnswerFields("self")
          : []),
        ...(isApplicantApplying("spouse", currentValues)
          ? createAnswerFields("spouse")
          : []),
      ]}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const hasSelf = isApplicantApplying("self", watchedValues);
        const hasSpouse = isApplicantApplying("spouse", watchedValues);

        return (
          <Stack spacing={3}>
            {hasSelf && (
              <ApplicantSection
                applicant="self"
                showLabel={shouldShowApplicantLabel("self", watchedValues)}
              >
                <QuestionSet
                  applicant="self"
                  control={control}
                  errors={errors}
                  watchedValues={watchedValues}
                  allFields={allFields}
                />
              </ApplicantSection>
            )}
            {hasSpouse && (
              <ApplicantSection
                applicant="spouse"
                showLabel={shouldShowApplicantLabel("spouse", watchedValues)}
              >
                <QuestionSet
                  applicant="spouse"
                  control={control}
                  errors={errors}
                  watchedValues={watchedValues}
                  allFields={allFields}
                />
              </ApplicantSection>
            )}
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}
