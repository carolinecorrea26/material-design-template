import { Alert, Typography } from "@mui/material";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import { childMapping } from "../../config/fields/eligibilityListFields";
import FieldRenderer from "../forms/FieldRenderer";
import EligibilityFields from "../forms/EligibilityFields";
import DynamicList from "../forms/DynamicList";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import FieldGrid from "../layout/FieldGrid";

export type EligibilitySectionsProps = FormRouteRenderProps & {
  childNotice?: string;
  collection?: { name: string; label: string; maxItems: number; mapping: import("../forms/DynamicList").DynamicListFieldMapping<Record<string, string>> };
  sectionNotes?: Record<string, string | undefined>;
  applicantLabels?: import("../../config/clients/types").ClientApplicantLabels;
  eligibleStatesOnly?: boolean;
};

/** Renders supplied sections; application adapters own participation and Site policy. */
export default function EligibilitySections({
  control,
  errors,
  watchedValues,
  allFields,
  pageSections,
  setValue,
  childNotice, collection, sectionNotes = {}, applicantLabels, eligibleStatesOnly,
}: EligibilitySectionsProps) {

  return (
    <>
      {pageSections.map((section) => {

        const content =
          section.id === "childSection" && childNotice ? <Alert severity="info">{childNotice}</Alert> : section.id === "childSection" ? (
            <>
              <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                Only unmarried children are eligible for coverage.
              </Alert>
              <DynamicList
                control={control}
                name={collection?.name ?? "children"}
                label={collection?.label ?? "Child"}
                maxItems={collection?.maxItems ?? 10}
                mapping={collection?.mapping ?? {
                  ...childMapping,
                  fields: [...childMapping.fields, ...allFields.filter(field => field.id === "child-unmarried" || field.id === "child-full-time-student")],
                  fieldToKey: { ...childMapping.fieldToKey, "child-unmarried": "unmarried", "child-full-time-student": "fullTimeStudent" },
                }}
                renderItem={(item) => (
                  <Typography variant="body2">
                    {`${item.firstName} ${item.lastName}`.trim().toUpperCase()}
                  </Typography>
                )}
              />
            </>
          ) : section.id === "spouseSection" ? (
            (() => {
              const nameFields = ["spouse-first-name", "spouse-last-name"];
              const firstNameIndex = section.fieldIds.findIndex((id) =>
                nameFields.includes(id),
              );
              const beforeName = section.fieldIds.slice(0, firstNameIndex);
              const afterName = section.fieldIds.filter(
                (id) => !nameFields.includes(id) && !beforeName.includes(id),
              );

              return (
                <>
                  {beforeName.map((fieldId) => {
                    const field = allFields.find((f) => f.id === fieldId);
                    if (!field) return null;
                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        errors={errors}
                      />
                    );
                  })}

                  <FieldGrid columns="equal">
                    {section.fieldIds
                      .filter((fieldId) => nameFields.includes(fieldId))
                      .map((fieldId) => {
                        const field = allFields.find((f) => f.id === fieldId);
                        if (!field) return null;
                        return (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            control={control}
                            errors={errors}
                          />
                        );
                      })}
                  </FieldGrid>

                  {afterName.map((fieldId) => {
                    const field = allFields.find((f) => f.id === fieldId);
                    if (!field) return null;
                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        errors={errors}
                      />
                    );
                  })}
                </>
              );
            })()
          ) : section.id === "selfEligibility" ? (
            <EligibilityFields
              eligibleStatesOnly={eligibleStatesOnly}
              form={{ control, errors, watchedValues, setValue }}
              fields={section.fieldIds.flatMap(id => allFields.filter(field => field.id === id))}
            />
          ) : (
            <>
              {section.fieldIds.map((fieldId) => {
                const field = allFields.find((f) => f.id === fieldId);
                if (!field) return null;

                return (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    control={control}
                    errors={errors}
                  />
                );
              })}
            </>
          );

        const note = sectionNotes[section.id];
        const sectionContent = <>{note && <Alert severity="info" sx={{ mb: 2 }}>{note}</Alert>}{content}</>;
        return (
          <div key={section.id}>
            {section.applicant && section.applicant !== "self" ? (
              <ApplicantSectionDivider applicant={section.applicant} labels={applicantLabels}>
                {sectionContent}
              </ApplicantSectionDivider>
            ) : (
              <>{sectionContent}</>
            )}
          </div>
        );
      })}
    </>
  );
}
