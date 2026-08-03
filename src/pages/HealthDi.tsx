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
import { YES_NO_OPTIONS } from "../config/constants";
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

// ─── DynamicList field definitions ───────────────────────────────────────────

const generalFields: FieldDefinition[] = [
  {
    id: "details",
    label: "Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

const specificFields: FieldDefinition[] = [
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
    label: "Conditions & Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and address of each physician, practitioner, and hospital",
    inputType: "text",
    required: false,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

const assistanceFields: FieldDefinition[] = [
  {
    id: "assistanceType",
    label: "Assistance Type",
    inputType: "dropdown",
    required: true,
    placeholder: "Select",
    options: [
      { value: "bathing", label: "Bathing" },
      { value: "dressing", label: "Dressing" },
      { value: "eating", label: "Eating" },
      { value: "walking", label: "Walking" },
      {
        value: "moving",
        label: "Moving in/out of a bed or chair or wheel chair",
      },
      { value: "toileting", label: "Toileting" },
      { value: "bowel-bladder", label: "Bowel or bladder control" },
    ],
  },
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
    label: "Conditions & Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and address of each physician, practitioner, and hospital",
    inputType: "text",
    required: false,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

const fallDiagnosisFields: FieldDefinition[] = [
  {
    id: "fallType",
    label: "Fall Type/Diagnosis",
    inputType: "text",
    required: true,
    labelVariant: "standard",
  },
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
    label: "Conditions & Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and address of each physician, practitioner, and hospital",
    inputType: "text",
    required: false,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

// ─── Mappings ─────────────────────────────────────────────────────────────────

const generalMapping = {
  fields: generalFields,
  fieldToKey: { details: "details" } as const,
};

const specificMapping = {
  fields: specificFields,
  fieldToKey: {
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

const assistanceMapping = {
  fields: assistanceFields,
  fieldToKey: {
    assistanceType: "assistanceType",
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

const fallDiagnosisMapping = {
  fields: fallDiagnosisFields,
  fieldToKey: {
    fallType: "fallType",
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

// ─── Item renderers ───────────────────────────────────────────────────────────

function renderGeneralItem(item: Record<string, string>) {
  return (
    <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
      {item.details || "No details provided"}
    </span>
  );
}

function renderSpecificItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.onset && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          Onset: {item.onset}
        </span>
      )}
      <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
        {item.conditionsDetails || "No details provided"}
      </span>
    </Stack>
  );
}

function renderAssistanceItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.assistanceType && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          {item.assistanceType}
        </span>
      )}
      {item.onset && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          Onset: {item.onset}
        </span>
      )}
      <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
        {item.conditionsDetails || "No details provided"}
      </span>
    </Stack>
  );
}

function renderFallItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.fallType && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          {item.fallType}
        </span>
      )}
      {item.onset && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          Onset: {item.onset}
        </span>
      )}
      <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
        {item.conditionsDetails || "No details provided"}
      </span>
    </Stack>
  );
}

// ─── Question definitions ─────────────────────────────────────────────────────

type MappingType =
  | typeof generalMapping
  | typeof specificMapping
  | typeof assistanceMapping
  | typeof fallDiagnosisMapping;

type QuestionDef = {
  key: string;
  label: string;
  mapping: MappingType;
  renderItem: (item: Record<string, string>) => React.ReactNode;
};

const QUESTIONS: QuestionDef[] = [
  {
    key: "q1",
    label:
      "Do you currently need or in the past 5 years have you needed human assistance or supervision to perform any of the following activities? Bathing, dressing, eating, walking, moving in/out of a bed or chair or wheel chair, toileting, bowel or bladder control. If \u201cYes,\u201d please check all that apply.",
    mapping: assistanceMapping,
    renderItem: renderAssistanceItem,
  },
  {
    key: "q2",
    label:
      "Within the past 5 years, have you had a fall or been diagnosed or treated by a member of the medical profession for a fracture, paralysis, numbness, balance problems or skin ulcers?",
    mapping: fallDiagnosisMapping,
    renderItem: renderFallItem,
  },
  {
    key: "q3",
    label:
      "Do you currently or in the past 5 years, have you been wheelchair-dependent or required supportive equipment such as braces, crutches, walker, cane, back support, or splint?",
    mapping: specificMapping,
    renderItem: renderSpecificItem,
  },
  {
    key: "q4",
    label:
      "Within the past 6 months, have you had or been recommended by a member of the medical profession to have physical therapy?",
    mapping: specificMapping,
    renderItem: renderSpecificItem,
  },
  {
    key: "q5",
    label:
      "Within the past 5 years, have you been evaluated, counseled, treated by a member of the medical profession or hospitalized for any problems with memory or ability to think or reason?",
    mapping: specificMapping,
    renderItem: renderSpecificItem,
  },
  {
    key: "q6",
    label:
      "Within the past 5 years, have you been confined or had confinement been recommended by a member of the medical profession to a hospital, nursing home, rehabilitation facility, assisted living unit or extended care facility?",
    mapping: specificMapping,
    renderItem: renderSpecificItem,
  },
  {
    key: "q7",
    label:
      "Within the past 5 years, have you been declined for issue, reinstatement or renewal of any type of long-term care insurance?",
    mapping: generalMapping,
    renderItem: renderGeneralItem,
  },
];

// ─── Field builders ───────────────────────────────────────────────────────────

function createAnswerFields(applicant: "self" | "spouse"): FieldDefinition[] {
  const suffix = applicant === "spouse" ? "-spouse" : "";
  return QUESTIONS.map((q) => ({
    id: `health-di-${q.key}${suffix}`,
    label: q.label,
    inputType: "radio" as const,
    required: true,
    options: YES_NO_OPTIONS,
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
        const answerId = `health-di-${q.key}${suffix}`;
        const listName = `health-di-${q.key}${suffix}-details`;
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
                  mapping={q.mapping as any}
                  renderItem={q.renderItem}
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

export default function HealthDi() {
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem = HELP_ITEMS.find((i) => i.id === activeHelpId) ?? null;

  return (
    <FormRoutePage
      pageId="health-di"
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
