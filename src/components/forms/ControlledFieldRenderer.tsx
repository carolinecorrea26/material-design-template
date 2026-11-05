import { useForm, type FieldErrors } from "react-hook-form";
import type { FieldDefinition } from "../../config/fields/types";
import FieldRenderer from "./FieldRenderer";
import type { ReactNode } from "react";

type FieldValue = string | boolean | string[];
type FormValues = Record<string, FieldValue>;

/** Adapts externally owned values to the same renderer used by application forms. */
export default function ControlledFieldRenderer({
  field,
  value,
  onChange,
  error,
  reserveFeedbackSpace,
  feedback,
}: {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
  reserveFeedbackSpace?: boolean;
  feedback?: ReactNode;
}) {
  const { control, getValues } = useForm<FormValues>({ values: { [field.id]: value } });
  const errors: FieldErrors<FormValues> = error
    ? { [field.id]: { type: "validate", message: error } }
    : {};
  return (
    <FieldRenderer
      field={field}
      control={control}
      errors={errors}
      margin="none"
      reserveFeedbackSpace={reserveFeedbackSpace}
      feedback={feedback}
      onValueChange={() => onChange(getValues(field.id))}
    />
  );
}
