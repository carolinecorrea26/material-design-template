import { Box } from "@mui/material";
import type { FieldDefinition } from "../../config/fields/types";
import FieldRenderer from "./FieldRenderer";
import SectionHeader from "./SectionHeader";

type PhysicianInformationProps = {
  fieldIds: string[];
  allFields: FieldDefinition[];
  control: unknown;
  errors: unknown;
  nameRow: Set<string>;
  streetRow: Set<string>;
  cityStateZipRow: Set<string>;
};

export default function PhysicianInformation({
  fieldIds,
  allFields,
  control,
  errors,
  nameRow,
  streetRow,
  cityStateZipRow,
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
    <>
      <SectionHeader
        label="Physician information"
        variant="subsection"
        sx={{ mb: 1 }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: { xs: 0, sm: 2 },
        }}
      >
        {fieldIds
          .filter((id) => nameRow.has(id))
          .map((fieldId) => renderField(fieldId))}
      </Box>

      {phoneField ? renderField(phoneField) : null}
      {facilityField ? renderField(facilityField) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: { xs: 0, sm: 2 },
        }}
      >
        {fieldIds
          .filter((id) => streetRow.has(id))
          .map((fieldId) => renderField(fieldId))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: { xs: 0, sm: 2 },
        }}
      >
        {fieldIds
          .filter((id) => cityStateZipRow.has(id))
          .map((fieldId) => renderField(fieldId))}
      </Box>
    </>
  );
}
