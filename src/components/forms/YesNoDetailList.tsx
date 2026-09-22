import { Box, FormLabel, Stack } from "@mui/material";
import type { ReactNode } from "react";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { FieldDefinition } from "../../config/fields/types";
import IconListItem from "../layout/IconListItem";
import DynamicList, { type DynamicListFieldMapping } from "./DynamicList";
import FieldRenderer from "./FieldRenderer";

export type YesNoDetailQuestion = {
  field: FieldDefinition;
  listName: string;
  mapping: DynamicListFieldMapping<Record<string, string>>;
  renderItem: (item: Record<string, string>) => ReactNode;
};

type YesNoDetailListProps = Pick<
  FormRouteRenderProps,
  "control" | "errors" | "watchedValues"
> & {
  questions: YesNoDetailQuestion[];
};

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
          <Stack spacing={2}>
            <Box>
              <FormLabel
                required={question.field.required}
                id={`${question.field.id}-label`}
                sx={{ display: "inline-block", mb: 1 }}
              >
                {question.field.label}
              </FormLabel>
              <FieldRenderer
                field={question.field}
                control={control}
                errors={errors}
                hideLabel
                margin="none"
              />
            </Box>
            {watchedValues[question.field.id] === "yes" && (
              <DynamicList
                control={control}
                name={question.listName}
                label="details"
                mapping={question.mapping}
                renderItem={question.renderItem}
              />
            )}
          </Stack>
        </IconListItem>
      ))}
    </Stack>
  );
}
