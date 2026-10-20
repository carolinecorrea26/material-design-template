import { getHealthDetailSurface, getHealthDetailSurfaceName, surfaceSemanticValues } from '../config/fields/storedSurfaces';
import { helpChipDefinitions } from "../content/interactionLabels";
import { QUESTIONS as questionDefinitions, createAnswerFields } from "../config/fields/healthDiFields";
import { validateHealthPage } from '../config/healthFollowUps';
import { applicantParticipatesInPage } from "../config/flowGates";
import { useState } from "react";
import { Stack, Typography } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "../app/RoutePage";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import {
  shouldShowApplicantLabel,
} from "../utils/applicantVisibility";
import YesNoDetailList, {
  type YesNoDetailQuestion,
} from "../components/forms/YesNoDetailList";
import AppDrawer from "../components/layout/AppDrawer";
import FormHelpChips from "../components/content/HelpChips";
import type { FieldDefinition } from "../config/fields/types";

// ─── Help content ─────────────────────────────────────────────────────────────

const HELP_ITEMS = [
  {
    ...helpChipDefinitions.health,
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

// ─── Mappings ─────────────────────────────────────────────────────────────────

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

const renderers = { renderGeneralItem, renderSpecificItem, renderAssistanceItem, renderFallItem };
const QUESTIONS = questionDefinitions.map(question => ({ ...question, renderItem: renderers[question.renderKind] }));

// ─── Field builders ───────────────────────────────────────────────────────────

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
  const questions: YesNoDetailQuestion[] = allFields.filter(field => field.id.startsWith("health-di-q") && field.id.endsWith("-spouse") === (applicant === "spouse")).map(field => {
    const answerId = field.id;
    const question = QUESTIONS.find(question => `health-di-${question.key}${suffix}` === answerId);
    if (!question) throw new Error(`Missing health summary renderer: ${answerId}`);
    const surface = getHealthDetailSurface("health-di", answerId);
    return { field, listName: `${answerId}-details`, mapping: surface.mapping, maxItems: surface.maxItems, label: surface.label,
      renderItem: item => question.renderItem(surfaceSemanticValues(getHealthDetailSurfaceName("health-di", answerId), item) as Record<string, string>) };
  });

  return (
    <YesNoDetailList
      questions={questions}
      control={control}
      errors={errors}
      watchedValues={watchedValues}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthDi() {
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem = HELP_ITEMS.find((i) => i.id === activeHelpId) ?? null;

  return (
    <FormRoutePage
      pageId="health-di"
      validate={values => validateHealthPage('health-di', values)}
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
        ...(applicantParticipatesInPage("health-di", "self", currentValues)
          ? createAnswerFields("self")
          : []),
        ...(applicantParticipatesInPage("health-di", "spouse", currentValues)
          ? createAnswerFields("spouse")
          : []),
      ]}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const hasSelf = applicantParticipatesInPage("health-di", "self", watchedValues);
        const hasSpouse = applicantParticipatesInPage("health-di", "spouse", watchedValues);

        return (
          <Stack spacing={3}>
            {hasSelf && (
              <ApplicantSectionDivider
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
              </ApplicantSectionDivider>
            )}
            {hasSpouse && (
              <ApplicantSectionDivider
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
              </ApplicantSectionDivider>
            )}
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}
