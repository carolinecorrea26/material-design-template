import { useForm } from "react-hook-form";
import type { Meta } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import YesNoDetailList from "./YesNoDetailList";
import type { FieldDefinition } from "../../config/fields/types";

const meta = {
  title: "Application Patterns/YesNoDetailList",
  component: YesNoDetailList,
  parameters: { layout: "padded" },
} satisfies Meta<typeof YesNoDetailList>;

export default meta;

type DemoValues = Record<string, string | boolean | string[]>;

const questionField: FieldDefinition = {
  id: "medical-treatment",
  label: "Have you received medical treatment during the past five years?",
  inputType: "radio",
  required: true,
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
  labelVariant: "standard",
};

const detailField: FieldDefinition = {
  id: "details",
  label: "Treatment details",
  inputType: "text",
  required: true,
  multiline: true,
};

export const Interactive = () => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<DemoValues>({
    defaultValues: { "medical-treatment": "no" },
  });

  return (
    <YesNoDetailList
      control={control}
      errors={errors}
      watchedValues={watch()}
      questions={[
        {
          field: questionField,
          listName: "medical-treatment-details",
          mapping: {
            fields: [detailField],
            fieldToKey: { details: "details" },
          },
          renderItem: (item) => (
            <Stack spacing={0.25}>
              <Typography variant="body2">{item.details}</Typography>
            </Stack>
          ),
        },
      ]}
    />
  );
};
