import type { FormRouteRenderProps } from "../../app/RoutePage";
import FieldRenderer from "../forms/FieldRenderer";
import ConditionalGroup from "../forms/ConditionalGroup";
import FieldGrid from "../layout/FieldGrid";

export type ProfilePersonalInformationProps = Pick<FormRouteRenderProps, "allFields" | "control" | "errors" | "watchedValues"> & {
  applicant?: "self" | "spouse";
  fieldIds: string[];
};

/** Personal fields and local follow-ups shared by member and spouse, with independent answer identities. */
export default function ProfilePersonalInformation({ applicant = "self", fieldIds, allFields, control, errors, watchedValues }: ProfilePersonalInformationProps) {
  const prefix = applicant === "spouse" ? "spouse-" : "";
  const heightFields = new Set([`${prefix}height-feet`, `${prefix}height-inches`]);
  const questionFieldIds = new Set([
    `${prefix}has-drivers-license`,
    `${prefix}intend-live-outside-us`,
    `${prefix}travel-outside-us-six-months`,
  ]);

  function renderField(fieldId: string, margin: "none" | "normal" = "normal") {
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return null;
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={control}
        errors={errors}
        margin={margin}
      />
    );
  }

  return (
    <>
      {/* Height fields use the shared stacked default. */}
      <FieldGrid gap={2}>
        {fieldIds
          .filter((id) => heightFields.has(id))
          .map((fieldId) => renderField(fieldId, "none"))}
      </FieldGrid>

      {/* Remaining fields rendered normally */}
      {fieldIds
        .filter((id) => !heightFields.has(id) && !questionFieldIds.has(id))
        .map((fieldId) => renderField(fieldId))}

      {renderField(`${prefix}has-drivers-license`)}
      {watchedValues[`${prefix}has-drivers-license`] === "yes" && (
        <ConditionalGroup>
          {renderField(`${prefix}drivers-license-number`)}
          {renderField(`${prefix}drivers-license-state`)}
        </ConditionalGroup>
      )}

      {renderField(`${prefix}intend-live-outside-us`)}
      {watchedValues[`${prefix}intend-live-outside-us`] === "yes" && (
        <ConditionalGroup>
          {renderField(`${prefix}outside-us-months`)}
          {renderField(`${prefix}outside-us-country`)}
        </ConditionalGroup>
      )}

      {renderField(`${prefix}travel-outside-us-six-months`)}
      {watchedValues[`${prefix}travel-outside-us-six-months`] === "yes" && (
        <ConditionalGroup>
          {renderField(`${prefix}travel-outside-us-country`)}
        </ConditionalGroup>
      )}
    </>
  );
}
