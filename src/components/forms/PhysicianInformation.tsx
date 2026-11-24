import AddressFields, { type AddressFieldMapping } from "./AddressFields";
import FieldGrid from "../layout/FieldGrid";
import type { FieldDefinition } from "../../config/fields/types";
import FieldRenderer from "./FieldRenderer";
import SectionDivider from "../layout/SectionDivider";
import { requirementText } from '../../domain/requirementContent';

type PhysicianInformationProps = {
  fieldIds: string[];
  allFields: FieldDefinition[];
  control: unknown;
  errors: unknown;
  nameRow: Set<string>;
  addressFieldIds: AddressFieldMapping;
  title?: string;
};

export default function PhysicianInformation({
  fieldIds,
  allFields,
  control,
  errors,
  nameRow,
  addressFieldIds,
  title = requirementText('physician.title'),
}: PhysicianInformationProps) {
  const phoneField = fieldIds.find((id) => id.includes("physician-phone"));
  const facilityField = fieldIds.find((id) => id.includes("facility-name"));

  function renderField(fieldId: string) {
    const field = allFields.find((entry) => entry.id === fieldId);
    if (!field) return null;

    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={control as never}
        errors={errors as never}
      />
    );
  }

  return (
    <SectionDivider
      label={title}
      variant="subsection"
      sx={{ mb: 1 }}
    >

      <FieldGrid columns="equal">
        {fieldIds
          .filter((id) => nameRow.has(id))
          .map((fieldId) => renderField(fieldId))}
      </FieldGrid>

      {phoneField ? renderField(phoneField) : null}
      {facilityField ? renderField(facilityField) : null}

      <AddressFields
        fields={fieldIds.flatMap(id => allFields.filter(field => field.id === id))}
        fieldIds={addressFieldIds}
        control={control as never}
        errors={errors as never}
      />
    </SectionDivider>
  );
}
