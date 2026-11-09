import { Alert, Typography } from "@mui/material";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import { requirementChildCollection } from "../../domain/requirementCollections";
import FieldRenderer from "../forms/FieldRenderer";
import EligibilityFields from "../forms/EligibilityFields";
import DynamicList from "../forms/DynamicList";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import FieldGrid from "../layout/FieldGrid";
import { FieldGroup } from "../layout/SectionDivider";

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

  const childCollection = collection ?? requirementChildCollection();
  return (
    <>
      {pageSections.map((section) => {

        const content =
          section.id === "childSection" && childNotice ? <Alert severity="info">{childNotice}</Alert> : section.id === "childSection" ? (
            <>
              <DynamicList
                control={control}
                name={childCollection.name}
                label={childCollection.label}
                maxItems={childCollection.maxItems}
                mapping={childCollection.mapping}
                renderItem={(item) => (
                  <Typography variant="body2">
                    {`${item["child-first-name"] ?? ""} ${item["child-last-name"] ?? ""}`.trim().toUpperCase()}
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
        const sectionContent = <>{note && <Alert severity="info" sx={{ mb: 2 }}>{note}</Alert>}<FieldGroup className="FieldGroup-root">{content}</FieldGroup></>;
        return (
          <div key={section.id} style={{ marginBottom: 32 }}>
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
