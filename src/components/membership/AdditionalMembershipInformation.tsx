import { Alert, Box, Stack } from "@mui/material";
import type { ComponentProps } from "react";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { ClientConfig } from "../../config/clients/types";
import type { FieldDefinition } from "../../config/fields/types";
import { associatedMemberNotice } from "../../domain/membershipQualifications";
import FieldRenderer from "../forms/FieldRenderer";
import FieldGrid from "../layout/FieldGrid";
import SectionDivider from "../layout/SectionDivider";
import { clearFields, waepaConditionalFieldIds, type MembershipSetValue } from "./membershipFieldReset";

function fieldById(fields: FieldDefinition[], id: string) {
  return fields.find((field) => field.id === id);
}

function renderField(
  field: FieldDefinition | undefined,
  control: Parameters<typeof FieldRenderer>[0]["control"],
  errors: Parameters<typeof FieldRenderer>[0]["errors"],
  onValueChange?: () => void,
) {
  if (!field) return null;

  return (
    <FieldRenderer
      key={field.id}
      field={field}
      control={control}
      errors={errors}
      onValueChange={onValueChange}
    />
  );
}

function renderFieldGrid(
  fields: FieldDefinition[],
  control: Parameters<typeof FieldRenderer>[0]["control"],
  errors: Parameters<typeof FieldRenderer>[0]["errors"],
) {
  return (
    <FieldGrid columns="1fr 100px 1fr">
      {fields.map((field) => renderField(field, control, errors))}
    </FieldGrid>
  );
}

function WAEPAAdditionalFields({
  fields,
  control,
  errors,
  qualificationValue,
  associationName,
  setValue,
}: {
  fields: FieldDefinition[];
  control: Parameters<typeof FieldRenderer>[0]["control"];
  errors: Parameters<typeof FieldRenderer>[0]["errors"];
  qualificationValue: ApplicationFormValues[string] | undefined;
  associationName: string;
  setValue: MembershipSetValue;
}) {
  const selectedQualification = String(qualificationValue ?? "");
  const declarationField = fieldById(fields, "waepa-declaration");
  const attestationField = fieldById(fields, "waepa-attestation");
  const employerField = fieldById(fields, "waepa-employer");
  const startDateField = fieldById(fields, "waepa-start-date");
  const retiredEmployerField = fieldById(fields, "waepa-retired-employer");
  const retirementDateField = fieldById(fields, "waepa-retirement-date");
  const memberFirstNameField = fieldById(fields, "waepa-member-first-name");
  const memberMiddleInitialField = fieldById(fields, "waepa-member-middle-initial");
  const memberLastNameField = fieldById(fields, "waepa-member-last-name");
  const memberIdField = fieldById(fields, "waepa-member-id");

  const associateMembershipAlert = associatedMemberNotice(selectedQualification, associationName);

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {renderField(declarationField, control, errors)}
      {renderField(attestationField, control, errors, () =>
        clearFields(setValue, waepaConditionalFieldIds),
      )}

      {employerField && startDateField && (
        <>
          {renderField(employerField, control, errors)}
          {renderField(startDateField, control, errors)}
        </>
      )}

      {retiredEmployerField && retirementDateField && (
        <>
          {renderField(retiredEmployerField, control, errors)}
          {renderField(retirementDateField, control, errors)}
        </>
      )}

      {memberIdField && (
        <>
          <Alert severity="info">{associateMembershipAlert}</Alert>
          {renderFieldGrid(
            [memberFirstNameField, memberMiddleInitialField, memberLastNameField].filter(
              (field): field is FieldDefinition => Boolean(field),
            ),
            control,
            errors,
          )}
          {renderField(memberIdField, control, errors)}
        </>
      )}
      {renderField(fieldById(fields, "active-military"), control, errors)}
      {fields.filter(field => !["waepa-declaration", "waepa-attestation", ...waepaConditionalFieldIds, "active-military"].includes(field.id)).map(field => renderField(field, control, errors))}
    </Stack>
  );
}

type Props = Pick<ComponentProps<typeof FieldRenderer>, "control" | "errors"> & {
  fields: FieldDefinition[];
  client: ClientConfig;
  qualificationValue?: ApplicationFormValues[string];
  setValue: MembershipSetValue;
  note?: string;
};

/** Conditional membership questions, including physician and WAEPA follow-ups. */
export default function AdditionalMembershipInformation({ fields: additionalFields, client, control, errors, qualificationValue, setValue, note }: Props) {
  if (!additionalFields.length) return null;
  const hasAmaPhysicianFields = additionalFields.some(field => field.id.startsWith("ama-physician-"));
  const hasWaepaFields = additionalFields.some(field => field.id.startsWith("waepa-"));
  return (
    <Box sx={{ mt: 3 }}>
      <SectionDivider
        label={
          hasAmaPhysicianFields
            ? "Physician Information"
            : "Additional Membership Information"
        }
        variant="subsection"
      />
      {hasAmaPhysicianFields && (
        <Alert severity="info" sx={{ mt: 1 }}>
          To apply as a spouse of a physician, please include the
          physician&apos;s information below.
        </Alert>
      )}
      {note && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {note}
        </Alert>
      )}
      {hasWaepaFields ? (
        <WAEPAAdditionalFields
          fields={additionalFields}
          control={control}
          errors={errors}
          qualificationValue={qualificationValue}
          associationName={client.branding.acronym || client.branding.name}
          setValue={setValue}
        />
      ) : hasAmaPhysicianFields ? (
        <Stack spacing={0} sx={{ mt: 1 }}>
          {renderField(
            fieldById(additionalFields, "ama-physician-type"),
            control,
            errors,
          )}
          <FieldGrid columns="120px 1fr 1fr">
            {renderField(
              fieldById(additionalFields, "ama-physician-title"),
              control,
              errors,
            )}
            {renderField(
              fieldById(
                additionalFields,
                "ama-physician-first-name",
              ),
              control,
              errors,
            )}
            {renderField(
              fieldById(
                additionalFields,
                "ama-physician-last-name",
              ),
              control,
              errors,
            )}
          </FieldGrid>
          {renderField(
            fieldById(
              additionalFields,
              "ama-physician-birth-date",
            ),
            control,
            errors,
          )}
          {renderField(
            fieldById(additionalFields, "ama-physician-email"),
            control,
            errors,
          )}
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ mt: 1 }}>
          {additionalFields.map((field) =>
            renderField(field, control, errors),
          )}
        </Stack>
      )}
    </Box>
  );
}
