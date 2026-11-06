import { useId, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import { FieldGroup } from "../layout/SectionDivider";
import type { ClientApplicantLabels } from "../../config/clients/types";
import { shouldShowApplicantLabel } from "../../utils/applicantVisibility";

export type HealthQuestionEntry = {
  key: string;
  order: number;
  applicant: "self" | "spouse";
  content: ReactNode;
};

/** One question at a time, with independent applicant controls and detail lists. */
export default function HealthQuestionList({ entries, values, labels }: { entries: HealthQuestionEntry[]; values: Record<string, unknown>; labels?: ClientApplicantLabels }) {
  const id = useId();
  const groups = new Map<string, { key: string; order: number; entries: HealthQuestionEntry[] }>();
  for (const entry of entries) {
    const group = groups.get(entry.key) ?? { key: entry.key, order: entry.order, entries: [] };
    group.entries.push(entry);
    groups.set(entry.key, group);
  }
  return <Stack spacing={3}>{[...groups.values()].sort((a, b) => a.order - b.order).map((group, index) => <Stack
    component="section" key={group.key} spacing={2} aria-labelledby={`${id}-${index}`} data-health-question={group.key}
  >
    <Typography component="h2" variant="subtitle1" fontWeight={700} id={`${id}-${index}`}>Question {index + 1}</Typography>
    {[...group.entries].sort((a, b) => Number(a.applicant === "spouse") - Number(b.applicant === "spouse")).map(entry => <Box
      component="section" key={entry.applicant} aria-label={entry.applicant === "self" ? "Member" : "Spouse"} data-health-applicant={entry.applicant}
    >
      <ApplicantSectionDivider labels={labels} applicant={entry.applicant} showLabel={shouldShowApplicantLabel(entry.applicant, values)}>
        <FieldGroup className="FieldGroup-root">{entry.content}</FieldGroup>
      </ApplicantSectionDivider>
    </Box>)}
  </Stack>)}</Stack>;
}
