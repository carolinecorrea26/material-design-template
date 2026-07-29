import { Box, FormLabel, Stack } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "../app/RoutePage";
import ApplicantSection from "../components/forms/ApplicantSection";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../utils/applicantVisibility";
import FieldRenderer from "../components/forms/FieldRenderer";
import ConditionalGroup from "../components/forms/ConditionalGroup";
import type { FieldDefinition } from "../config/fields/types";

const HEALTH_QUESTIONS = [
  "Are you currently confined to a hospital, nursing home, psychiatric facility, incarcerated in a prison/correctional facility, currently on parole or currently receiving home health care/assisted living care?",
  "During the last five years, have you ever been declined, postponed, or offered rated life or health insurance or been denied a reinstatement, reissue or renewal for life or health insurance, or are you currently receiving disability benefits?",
  "Are you currently undergoing a medical evaluation for any condition not yet given a diagnosis?",
  "In the last five years, have you been convicted of a felony; been charged or convicted with assault; been charged with operating a vehicle while under the influence of alcohol or drugs; been charged three or more times with a moving violation; currently have a revoked or suspended license; or currently on parole or incarcerated in a correctional institution?",
  "During the last five years, has any person to be insured been medically diagnosed by a licensed member of the medical profession with HIV or AIDS, or tested positive for Human Immunodeficiency Virus (HIV)?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for heart disease, a heart attack, chest pains, irregular heartbeat, arrhythmia, open heart surgery, defibrillator or a pacemaker?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for diabetes, a stroke (CVA), a transient ischemic attack (TIA), aneurysm or kidney disease?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for depression, anxiety, mental disorder, suicide attempt(s), drug use or treatment, or alcohol abuse or treatment?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cirrhosis, hepatitis, Lou Gehrig's Disease/ALS or other neuro-muscular, paralysis or seizure disorder?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cancer (except basal cell or squamous cell skin cancer), tumors, cysts, masses or growths of any type, lymphoma, any blood disorder, except HIV, or connective tissue disorder?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for Crohn's disease, disorder of pancreas, disorder of the immune system, except HIV?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for hypertension, elevated cholesterol, respiratory disease or disorder, or sleep apnea?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for anemia, colitis or arthritis?",
  "During the past five years, have you flown an airplane (other than scheduled commercial or corporate aviation); engaged in any of the following: sky sports, underwater sports, climbing sports, motor sports, in any type vehicle, or any extreme sport (bungee jumping, cave exploration, heliskiing, rodeo riding, etc)?",
  "Have any of your siblings or either of your parents been diagnosed with or died from cancer or cardiovascular disease prior to age 60?",
];

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function createHealthQuestionFields(
  applicant: "self" | "spouse",
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  HEALTH_QUESTIONS.forEach((question, index) => {
    const questionNum = index + 1;
    const suffix = applicant === "spouse" ? "-spouse" : "";

    fields.push({
      id: `health-si-q${questionNum}${suffix}`,
      label: question,
      inputType: "radio",
      required: true,
      options: yesNoOptions,
      labelVariant: "standard",
    });

    // Onset date field (MM/YYYY)
    fields.push({
      id: `health-si-q${questionNum}-onset${suffix}`,
      label: "Month/Year of Onset",
      inputType: "text",
      required: false,
      placeholder: "MM/YYYY",
      labelVariant: "standard",
    });

    // Condition/Medication details field
    fields.push({
      id: `health-si-q${questionNum}-details${suffix}`,
      label:
        "Condition/Medication & Details (Medical Advice Given, Treatment, Results, Date Recovered)",
      inputType: "text",
      required: false,
      multiline: true,
      minRows: 4,
      labelVariant: "standard",
    });

    // Physician info field
    fields.push({
      id: `health-si-q${questionNum}-physician${suffix}`,
      label: "Name and Address of Each Physician, Practitioner, and Hospital",
      inputType: "text",
      required: false,
      multiline: true,
      minRows: 4,
      labelVariant: "standard",
    });
  });

  return fields;
}

type QuestionSetType = "self" | "spouse";

interface HealthQuestionSetProps {
  applicant: QuestionSetType;
  control: FormRouteRenderProps["control"];
  errors: FormRouteRenderProps["errors"];
  watchedValues: FormRouteRenderProps["watchedValues"];
  allFields: FieldDefinition[];
}

function HealthQuestionSet({
  applicant,
  control,
  errors,
  watchedValues,
  allFields,
}: HealthQuestionSetProps) {
  return (
    <Stack
      component="ol"
      spacing={3}
      sx={{
        listStyle: "none",
        paddingLeft: 0,
      }}
    >
      {HEALTH_QUESTIONS.map((_, index) => {
        const questionNum = index + 1;
        const suffix = applicant === "spouse" ? "-spouse" : "";
        const answerFieldId = `health-si-q${questionNum}${suffix}`;
        const onsetFieldId = `health-si-q${questionNum}-onset${suffix}`;
        const detailsFieldId = `health-si-q${questionNum}-details${suffix}`;
        const physicianFieldId = `health-si-q${questionNum}-physician${suffix}`;

        const answerValue = watchedValues[answerFieldId];
        const showDetails = answerValue === "yes";

        const questionField = allFields.find((f) => f.id === answerFieldId);
        if (!questionField) return null;

        return (
          <Box
            key={`q${questionNum}-${applicant}`}
            component="li"
            sx={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: 1.5,
              alignItems: "start",
            }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 500,
                // lineHeight: 1.75,
                // minWidth: "1.5rem",
                textAlign: "right",
              }}
            >
              {questionNum}.
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

              {showDetails && (
                <ConditionalGroup>
                  <Stack spacing={2}>
                    {/* Onset date field */}
                    {(() => {
                      const field = allFields.find(
                        (f) => f.id === onsetFieldId,
                      );
                      if (!field) return null;
                      return (
                        <FieldRenderer
                          field={{
                            ...field,
                            required: true,
                          }}
                          control={control}
                          errors={errors}
                        />
                      );
                    })()}

                    {/* Details field */}
                    {(() => {
                      const field = allFields.find(
                        (f) => f.id === detailsFieldId,
                      );
                      if (!field) return null;
                      return (
                        <FieldRenderer
                          field={{
                            ...field,
                            required: true,
                          }}
                          control={control}
                          errors={errors}
                        />
                      );
                    })()}

                    {/* Physician field */}
                    {(() => {
                      const field = allFields.find(
                        (f) => f.id === physicianFieldId,
                      );
                      if (!field) return null;
                      return (
                        <FieldRenderer
                          field={{
                            ...field,
                            required: true,
                          }}
                          control={control}
                          errors={errors}
                        />
                      );
                    })()}
                  </Stack>
                </ConditionalGroup>
              )}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function HealthSi() {
  return (
    <FormRoutePage
      pageId="health-si"
      devFillFields={(currentValues) => [
        ...(isApplicantApplying("self", currentValues)
          ? createHealthQuestionFields("self")
          : []),
        ...(isApplicantApplying("spouse", currentValues)
          ? createHealthQuestionFields("spouse")
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
                <HealthQuestionSet
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
                <HealthQuestionSet
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
