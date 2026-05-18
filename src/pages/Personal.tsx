import { useState } from "react";
import { Box, Button, FormLabel } from "@mui/material";
import FormRoutePage, {
  isSectionVisible,
} from "../components/form/FormRoutePage";
import FieldRenderer from "../components/form/FieldRenderer";
import ApplicantSection from "../components/form/ApplicantSection";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../components/form/applicantVisibility";
import { SECTION_SURFACE_BG } from "../components/form/sectionStyles";
import SubQuestionContainer from "../components/form/SubQuestionContainer";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";

const selfHeightFieldIds = new Set(["height-feet", "height-inches"]);
const spouseHeightFieldIds = new Set([
  "spouse-height-feet",
  "spouse-height-inches",
]);
const selfDriversLicenseFollowupFieldIds = new Set([
  "drivers-license-number",
  "drivers-license-state",
]);
const selfOutsideUsFollowupFieldIds = new Set([
  "outside-us-months",
  "outside-us-country",
]);
const selfTravelOutsideUsFollowupFieldIds = new Set([
  "travel-outside-us-country",
]);
const qdRequiredUwFlags = new Set(["FUW", "QD"]);
const qdOnlyFieldIds = new Set([
  "weight-12-months-ago-lbs",
  "has-drivers-license",
  "travel-outside-us-six-months",
  "drivers-license-number",
  "drivers-license-state",
  "travel-outside-us-country",
  "spouse-weight-12-months-ago-lbs",
  "spouse-has-drivers-license",
  "spouse-travel-outside-us-six-months",
  "spouse-drivers-license-number",
  "spouse-drivers-license-state",
  "spouse-travel-outside-us-country",
]);
const physicianNameRow = new Set([
  "physician-first-name",
  "physician-last-name",
]);
const physicianStreetRow = new Set([
  "medical-facility-street-address",
  "medical-facility-apt-suite",
]);
const physicianCityStateZipRow = new Set([
  "medical-city",
  "medical-state",
  "medical-zip-code",
]);
const physicianFieldIds = new Set([
  "physician-first-name",
  "physician-last-name",
  "physician-phone",
  "medical-facility-name",
  "medical-facility-street-address",
  "medical-facility-apt-suite",
  "medical-city",
  "medical-state",
  "medical-zip-code",
]);
const spousePhysicianNameRow = new Set([
  "spouse-physician-first-name",
  "spouse-physician-last-name",
]);
const spousePhysicianStreetRow = new Set([
  "spouse-medical-facility-street-address",
  "spouse-medical-facility-apt-suite",
]);
const spousePhysicianCityStateZipRow = new Set([
  "spouse-medical-city",
  "spouse-medical-state",
  "spouse-medical-zip-code",
]);

type PersonalSectionGroups = {
  selfPrimary: string[];
  selfConditional: string[];
  selfPhysician: string[];
  spouse: string[];
  spouseConditional: string[];
  spousePhysician: string[];
};

export default function Personal() {
  const [showPhysician, setShowPhysician] = useState(false);
  const [showSpousePhysician, setShowSpousePhysician] = useState(false);

  return (
    <FormRoutePage pageId="personal">
      {({ control, errors, watchedValues, allFields, pageSections }) =>
        (() => {
          const selectedCoverageIds = Array.isArray(
            watchedValues["coverageSelections"],
          )
            ? watchedValues["coverageSelections"]
            : [];
          const selectedCoverageIdSet = new Set(selectedCoverageIds);
          const hasQdUwProduct = getActiveClientCoverages().some(
            (coverage) =>
              selectedCoverageIdSet.has(coverage.id) &&
              qdRequiredUwFlags.has(coverage.underwritingType),
          );

          const visibleSections = pageSections.filter((section) =>
            isSectionVisible(section, watchedValues),
          );

          const sectionGroups = visibleSections.reduce<PersonalSectionGroups>(
            (acc, section) => {
              if (section.id === "personalSelf") {
                acc.selfPrimary.push(...section.fieldIds);
                return acc;
              }

              if (section.id === "personalSelfPhysician") {
                acc.selfPhysician.push(...section.fieldIds);
                return acc;
              }

              if (section.applicant === "self") {
                acc.selfConditional.push(...section.fieldIds);
                return acc;
              }

              if (section.id === "personalSpousePhysician") {
                acc.spousePhysician.push(...section.fieldIds);
                return acc;
              }

              if (section.id === "personalSpouse") {
                acc.spouse.push(...section.fieldIds);
                return acc;
              }

              if (section.applicant === "spouse") {
                acc.spouseConditional.push(...section.fieldIds);
              }

              return acc;
            },
            {
              selfPrimary: [],
              selfConditional: [],
              selfPhysician: [],
              spouse: [],
              spouseConditional: [],
              spousePhysician: [],
            },
          );

          const selfPrimaryFieldIds = sectionGroups.selfPrimary.filter(
            (id) =>
              !physicianFieldIds.has(id) &&
              (hasQdUwProduct || !qdOnlyFieldIds.has(id)),
          );
          const selfConditionalFieldIds = sectionGroups.selfConditional.filter(
            (id) => hasQdUwProduct || !qdOnlyFieldIds.has(id),
          );
          const spouseFieldIds = sectionGroups.spouse.filter(
            (id) => hasQdUwProduct || !qdOnlyFieldIds.has(id),
          );
          const spouseConditionalFieldIds =
            sectionGroups.spouseConditional.filter(
              (id) => hasQdUwProduct || !qdOnlyFieldIds.has(id),
            );

          const hasSelf = isApplicantApplying("self", watchedValues);
          // const hasSpouse = isApplicantApplying("spouse", watchedValues);
          return (
            <>
              {hasSelf && (
                <ApplicantSection
                  applicant="self"
                  showLabel={shouldShowApplicantLabel("self", watchedValues)}
                >
                  <Box>
                    <FormLabel sx={{ mb: 1, display: "block" }}>
                      Height
                    </FormLabel>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      {selfPrimaryFieldIds
                        .filter((fieldId) => selfHeightFieldIds.has(fieldId))
                        .map((fieldId) => {
                          const field = allFields.find((f) => f.id === fieldId);
                          if (!field) return null;

                          return (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              control={control}
                              errors={errors}
                              margin="none"
                            />
                          );
                        })}
                    </Box>
                  </Box>

                  {selfPrimaryFieldIds
                    .filter((fieldId) => !selfHeightFieldIds.has(fieldId))
                    .map((fieldId) => {
                      const field = allFields.find((f) => f.id === fieldId);
                      if (!field) return null;

                      return (
                        <Box key={field.id}>
                          <FieldRenderer
                            field={field}
                            control={control}
                            errors={errors}
                          />

                          {fieldId === "has-drivers-license" &&
                            selfConditionalFieldIds.filter((id) =>
                              selfDriversLicenseFollowupFieldIds.has(id),
                            ).length > 0 &&
                            watchedValues[fieldId] === "yes" && (
                              <SubQuestionContainer>
                                {selfConditionalFieldIds
                                  .filter((id) =>
                                    selfDriversLicenseFollowupFieldIds.has(id),
                                  )
                                  .map((conditionalFieldId) => {
                                    const conditionalField = allFields.find(
                                      (f) => f.id === conditionalFieldId,
                                    );
                                    if (!conditionalField) return null;

                                    return (
                                      <Box
                                        key={conditionalField.id}
                                        sx={{ mb: 2 }}
                                      >
                                        <FieldRenderer
                                          field={conditionalField}
                                          control={control}
                                          errors={errors}
                                        />
                                      </Box>
                                    );
                                  })}
                              </SubQuestionContainer>
                            )}

                          {fieldId === "intend-live-outside-us" &&
                            selfConditionalFieldIds.filter((id) =>
                              selfOutsideUsFollowupFieldIds.has(id),
                            ).length > 0 &&
                            watchedValues[fieldId] === "yes" && (
                              <SubQuestionContainer>
                                {selfConditionalFieldIds
                                  .filter((id) =>
                                    selfOutsideUsFollowupFieldIds.has(id),
                                  )
                                  .map((conditionalFieldId) => {
                                    const conditionalField = allFields.find(
                                      (f) => f.id === conditionalFieldId,
                                    );
                                    if (!conditionalField) return null;

                                    return (
                                      <Box
                                        key={conditionalField.id}
                                        sx={{ mb: 2 }}
                                      >
                                        <FieldRenderer
                                          key={conditionalField.id}
                                          field={conditionalField}
                                          control={control}
                                          errors={errors}
                                        />
                                      </Box>
                                    );
                                  })}
                              </SubQuestionContainer>
                            )}

                          {fieldId === "travel-outside-us-six-months" &&
                            selfConditionalFieldIds.filter((id) =>
                              selfTravelOutsideUsFollowupFieldIds.has(id),
                            ).length > 0 &&
                            watchedValues[fieldId] === "yes" && (
                              <SubQuestionContainer>
                                {selfConditionalFieldIds
                                  .filter((id) =>
                                    selfTravelOutsideUsFollowupFieldIds.has(id),
                                  )
                                  .map((conditionalFieldId) => {
                                    const conditionalField = allFields.find(
                                      (f) => f.id === conditionalFieldId,
                                    );
                                    if (!conditionalField) return null;

                                    return (
                                      <Box
                                        key={conditionalField.id}
                                        sx={{ mb: 2 }}
                                      >
                                        <FieldRenderer
                                          key={conditionalField.id}
                                          field={conditionalField}
                                          control={control}
                                          errors={errors}
                                        />
                                      </Box>
                                    );
                                  })}
                              </SubQuestionContainer>
                            )}
                        </Box>
                      );
                    })}

                  {selfConditionalFieldIds.map((fieldId) => {
                    if (
                      selfDriversLicenseFollowupFieldIds.has(fieldId) ||
                      selfOutsideUsFollowupFieldIds.has(fieldId) ||
                      selfTravelOutsideUsFollowupFieldIds.has(fieldId)
                    ) {
                      return null;
                    }

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

                  {showPhysician && (
                    <Box
                      sx={{
                        backgroundColor: SECTION_SURFACE_BG,
                        borderRadius: 1.5,
                        px: { xs: 2, sm: 2.5 },
                        py: 1.5,
                        mt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {sectionGroups.selfPhysician
                          .filter((fieldId) => physicianNameRow.has(fieldId))
                          .map((fieldId) => {
                            const field = allFields.find(
                              (f) => f.id === fieldId,
                            );
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
                      </Box>

                      {sectionGroups.selfPhysician
                        .filter((fieldId) => fieldId === "physician-phone")
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

                      {sectionGroups.selfPhysician
                        .filter(
                          (fieldId) => fieldId === "medical-facility-name",
                        )
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

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {sectionGroups.selfPhysician
                          .filter((fieldId) => physicianStreetRow.has(fieldId))
                          .map((fieldId) => {
                            const field = allFields.find(
                              (f) => f.id === fieldId,
                            );
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
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {sectionGroups.selfPhysician
                          .filter((fieldId) =>
                            physicianCityStateZipRow.has(fieldId),
                          )
                          .map((fieldId) => {
                            const field = allFields.find(
                              (f) => f.id === fieldId,
                            );
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
                      </Box>
                    </Box>
                  )}

                  <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={() => setShowPhysician((current) => !current)}
                    sx={{ mt: 2, textTransform: "none", fontWeight: 600 }}
                  >
                    {showPhysician
                      ? "Hide your physician information (optional)"
                      : "Add your physician information (optional)"}
                  </Button>
                </ApplicantSection>
              )}

              {sectionGroups.spouse.length > 0 && (
                <ApplicantSection applicant="spouse">
                  <Box>
                    <FormLabel sx={{ mb: 1, display: "block" }}>
                      Height
                    </FormLabel>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      {spouseFieldIds
                        .filter((fieldId) => spouseHeightFieldIds.has(fieldId))
                        .map((fieldId) => {
                          const field = allFields.find((f) => f.id === fieldId);
                          if (!field) return null;

                          return (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              control={control}
                              errors={errors}
                              margin="none"
                            />
                          );
                        })}
                    </Box>
                  </Box>

                  {spouseFieldIds.map((fieldId) => {
                    if (spouseHeightFieldIds.has(fieldId)) {
                      return null;
                    }

                    const field = allFields.find((f) => f.id === fieldId);
                    if (!field) return null;

                    const spouseDriversLicenseFollowupFieldIds = new Set([
                      "spouse-drivers-license-number",
                      "spouse-drivers-license-state",
                    ]);
                    const spouseOutsideUsFollowupFieldIds = new Set([
                      "spouse-outside-us-months",
                      "spouse-outside-us-country",
                    ]);
                    const spouseTravelOutsideUsFollowupFieldIds = new Set([
                      "spouse-travel-outside-us-country",
                    ]);

                    return (
                      <Box key={field.id}>
                        <FieldRenderer
                          field={field}
                          control={control}
                          errors={errors}
                        />

                        {fieldId === "spouse-has-drivers-license" &&
                          spouseConditionalFieldIds.filter((id) =>
                            spouseDriversLicenseFollowupFieldIds.has(id),
                          ).length > 0 &&
                          watchedValues[fieldId] === "yes" && (
                            <SubQuestionContainer>
                              {spouseConditionalFieldIds
                                .filter((id) =>
                                  spouseDriversLicenseFollowupFieldIds.has(id),
                                )
                                .map((conditionalFieldId) => {
                                  const conditionalField = allFields.find(
                                    (f) => f.id === conditionalFieldId,
                                  );
                                  if (!conditionalField) return null;

                                  return (
                                    <Box
                                      key={conditionalField.id}
                                      sx={{ mb: 2 }}
                                    >
                                      <FieldRenderer
                                        field={conditionalField}
                                        control={control}
                                        errors={errors}
                                      />
                                    </Box>
                                  );
                                })}
                            </SubQuestionContainer>
                          )}

                        {fieldId === "spouse-intend-live-outside-us" &&
                          spouseConditionalFieldIds.filter((id) =>
                            spouseOutsideUsFollowupFieldIds.has(id),
                          ).length > 0 &&
                          watchedValues[fieldId] === "yes" && (
                            <SubQuestionContainer>
                              {spouseConditionalFieldIds
                                .filter((id) =>
                                  spouseOutsideUsFollowupFieldIds.has(id),
                                )
                                .map((conditionalFieldId) => {
                                  const conditionalField = allFields.find(
                                    (f) => f.id === conditionalFieldId,
                                  );
                                  if (!conditionalField) return null;

                                  return (
                                    <Box
                                      key={conditionalField.id}
                                      sx={{ mb: 2 }}
                                    >
                                      <FieldRenderer
                                        key={conditionalField.id}
                                        field={conditionalField}
                                        control={control}
                                        errors={errors}
                                      />
                                    </Box>
                                  );
                                })}
                            </SubQuestionContainer>
                          )}

                        {fieldId === "spouse-travel-outside-us-six-months" &&
                          spouseConditionalFieldIds.filter((id) =>
                            spouseTravelOutsideUsFollowupFieldIds.has(id),
                          ).length > 0 &&
                          watchedValues[fieldId] === "yes" && (
                            <SubQuestionContainer>
                              {spouseConditionalFieldIds
                                .filter((id) =>
                                  spouseTravelOutsideUsFollowupFieldIds.has(id),
                                )
                                .map((conditionalFieldId) => {
                                  const conditionalField = allFields.find(
                                    (f) => f.id === conditionalFieldId,
                                  );
                                  if (!conditionalField) return null;

                                  return (
                                    <Box
                                      key={conditionalField.id}
                                      sx={{ mb: 2 }}
                                    >
                                      <FieldRenderer
                                        key={conditionalField.id}
                                        field={conditionalField}
                                        control={control}
                                        errors={errors}
                                      />
                                    </Box>
                                  );
                                })}
                            </SubQuestionContainer>
                          )}
                      </Box>
                    );
                  })}

                  {spouseConditionalFieldIds.map((fieldId) => {
                    const spouseDriversLicenseFollowupFieldIds = new Set([
                      "spouse-drivers-license-number",
                      "spouse-drivers-license-state",
                    ]);
                    const spouseOutsideUsFollowupFieldIds = new Set([
                      "spouse-outside-us-months",
                      "spouse-outside-us-country",
                    ]);
                    const spouseTravelOutsideUsFollowupFieldIds = new Set([
                      "spouse-travel-outside-us-country",
                    ]);

                    if (
                      spouseDriversLicenseFollowupFieldIds.has(fieldId) ||
                      spouseOutsideUsFollowupFieldIds.has(fieldId) ||
                      spouseTravelOutsideUsFollowupFieldIds.has(fieldId)
                    ) {
                      return null;
                    }

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

                  {showSpousePhysician && (
                    <Box
                      sx={{
                        backgroundColor: SECTION_SURFACE_BG,
                        borderRadius: 1.5,
                        px: { xs: 2, sm: 2.5 },
                        py: 1.5,
                        mt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {sectionGroups.spousePhysician
                          .filter((fieldId) =>
                            spousePhysicianNameRow.has(fieldId),
                          )
                          .map((fieldId) => {
                            const field = allFields.find(
                              (f) => f.id === fieldId,
                            );
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
                      </Box>

                      {sectionGroups.spousePhysician
                        .filter(
                          (fieldId) => fieldId === "spouse-physician-phone",
                        )
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

                      {sectionGroups.spousePhysician
                        .filter(
                          (fieldId) =>
                            fieldId === "spouse-medical-facility-name",
                        )
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

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {sectionGroups.spousePhysician
                          .filter((fieldId) =>
                            spousePhysicianStreetRow.has(fieldId),
                          )
                          .map((fieldId) => {
                            const field = allFields.find(
                              (f) => f.id === fieldId,
                            );
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
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {sectionGroups.spousePhysician
                          .filter((fieldId) =>
                            spousePhysicianCityStateZipRow.has(fieldId),
                          )
                          .map((fieldId) => {
                            const field = allFields.find(
                              (f) => f.id === fieldId,
                            );
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
                      </Box>
                    </Box>
                  )}

                  <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={() =>
                      setShowSpousePhysician((current) => !current)
                    }
                    sx={{ mt: 2, textTransform: "none", fontWeight: 600 }}
                  >
                    {showSpousePhysician
                      ? "Hide spouse physician information (optional)"
                      : "Add spouse physician information (optional)"}
                  </Button>
                </ApplicantSection>
              )}
            </>
          );
        })()
      }
    </FormRoutePage>
  );
}
