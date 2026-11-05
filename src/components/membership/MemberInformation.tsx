import type { ComponentProps } from "react";
import type { FieldDefinition } from "../../config/fields/types";
import FieldRenderer from "../forms/FieldRenderer";
import FieldGrid from "../layout/FieldGrid";

type Props = Pick<ComponentProps<typeof FieldRenderer>, "control" | "errors"> & { fields: FieldDefinition[] };

/** Applicant name, email and phone collected after membership is confirmed. */
export default function MemberInformation({ fields, control, errors }: Props) {
  const nameFields = fields.filter(field => ["title", "first-name", "last-name"].includes(field.id));
  const contactFields = fields.filter(field => ["email", "phone"].includes(field.id));
  return <>
    <FieldGrid columns={nameFields.some(field => field.id === "title") ? "120px 1fr 1fr" : "equal"}>
      {nameFields.map((field) =>
        <FieldRenderer key={field.id} field={field} control={control} errors={errors} />,
      )}
    </FieldGrid>

    {contactFields.map((field) =>
      <FieldRenderer key={field.id} field={field} control={control} errors={errors} />,
    )}
  </>;
}
