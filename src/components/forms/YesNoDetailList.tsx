import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { FieldDefinition } from "../../config/fields/types";
import IconListItem from "../layout/IconListItem";
import DynamicList, { type DynamicListFieldMapping } from "./DynamicList";
import FieldRenderer from "./FieldRenderer";

export type YesNoDetailQuestion = {
  field: FieldDefinition;
  listName: string;
  maxItems?: number;
  label?: string;
  mapping: DynamicListFieldMapping<Record<string, string>>;
  renderItem: (item: Record<string, string>) => ReactNode;
};

type YesNoDetailListProps = Pick<
  FormRouteRenderProps,
  "control" | "errors" | "watchedValues"
> & {
  questions: YesNoDetailQuestion[];
};

export function YesNoDetailQuestionFields({ question, control, errors, watchedValues }: Omit<YesNoDetailListProps, "questions"> & { question: YesNoDetailQuestion }) {
  return <Stack spacing={2}>
    <FieldRenderer field={{ ...question.field, labelVariant: 'standard' }} control={control} errors={errors} margin="none" />
    {watchedValues[question.field.id] === "yes" && question.mapping.fields.length > 0 && <DynamicList
      control={control} name={question.listName} label={question.label ?? "details"} maxItems={question.maxItems}
      mapping={question.mapping} renderItem={question.renderItem}
    />}
  </Stack>;
}

/** Numbered yes/no questions that reveal a canonical DynamicList on “Yes”. */
export default function YesNoDetailList({
  questions,
  control,
  errors,
  watchedValues,
}: YesNoDetailListProps) {
  return (
    <Stack component="ol" spacing={3} sx={{ listStyle: "none", pl: 0 }}>
      {questions.map((question, index) => (
        <IconListItem key={question.field.id} icon={`${index + 1}.`}>
          <YesNoDetailQuestionFields question={question} control={control} errors={errors} watchedValues={watchedValues} />
        </IconListItem>
      ))}
    </Stack>
  );
}
