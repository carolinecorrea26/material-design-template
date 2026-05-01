import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import FormRoutePage, {
  isSectionVisible,
} from "../components/form/FormRoutePage";
import FieldRenderer from "../components/form/FieldRenderer";
import ApplicantSection from "../components/form/ApplicantSection";
import { shouldShowApplicantLabel } from "../components/form/applicantVisibility";
import FormSectionTitle from "../components/form/FormSectionTitle";
import { useApplicationForm } from "../state/ApplicationFormContext";
import { getSelectedCategoryIds } from "../config/formFlow";

const streetRow = new Set(["street-address", "apt-suite"]);
const cityStateZipRow = new Set(["city", "state", "zip-code"]);

const businessStreetRow = new Set([
  "business-street-address",
  "business-apt-suite",
]);
const businessCityStateZipRow = new Set([
  "business-city",
  "business-state",
  "business-zip-code",
]);

export default function Contact() {
  const { values } = useApplicationForm();
  const selectedCategories = getSelectedCategoryIds(values);
  const hasDiOrOo = selectedCategories.some(
    (cat) => cat === "DI" || cat === "OO",
  );

  const defaultValueOverrides: Record<string, string> = {};
  if (!values["state"] && values["state-province"]) {
    defaultValueOverrides["state"] = values["state-province"] as string;
  }
  if (!values["zip-code"] && values["zip-postal-code"]) {
    defaultValueOverrides["zip-code"] = values["zip-postal-code"] as string;
  }

  return (
    <FormRoutePage
      pageId="contact"
      defaultValueOverrides={defaultValueOverrides}
    >
      {({
        control,
        errors,
        watchedValues,
        allFields,
        pageSections,
        setValue,
      }) => {
        const correspondenceTo = watchedValues["correspondence-to"];
        const showBusinessSection =
          correspondenceTo === "business" || hasDiOrOo;
        const sameAsHome = Boolean(
          watchedValues["business-address-same-as-home"],
        );

        return (
          <ContactFields
            control={control}
            errors={errors}
            watchedValues={watchedValues}
            allFields={allFields}
            pageSections={pageSections}
            setValue={setValue}
            showBusinessSection={showBusinessSection}
            sameAsHome={sameAsHome}
          />
        );
      }}
    </FormRoutePage>
  );
}

function ContactFields({
  control,
  errors,
  watchedValues,
  allFields,
  pageSections,
  setValue,
  showBusinessSection,
  sameAsHome,
}: {
  control: any;
  errors: any;
  watchedValues: any;
  allFields: any[];
  pageSections: any[];
  setValue: any;
  showBusinessSection: boolean;
  sameAsHome: boolean;
}) {
  const homeStreetAddress = watchedValues["street-address"];
  const homeAptSuite = watchedValues["apt-suite"];
  const homeCity = watchedValues["city"];
  const homeState = watchedValues["state"];
  const homeZipCode = watchedValues["zip-code"];

  const businessStreetAddress = watchedValues["business-street-address"];
  const businessAptSuite = watchedValues["business-apt-suite"];
  const businessCity = watchedValues["business-city"];
  const businessState = watchedValues["business-state"];
  const businessZipCode = watchedValues["business-zip-code"];

  // Copy home address to business address when checkbox is checked
  useEffect(() => {
    if (!sameAsHome) {
      return;
    }

    const homeToBusinessValues: Record<string, string | undefined> = {
      "business-street-address": homeStreetAddress,
      "business-apt-suite": homeAptSuite,
      "business-city": homeCity,
      "business-state": homeState,
      "business-zip-code": homeZipCode,
    };

    const businessAddressValues: Record<string, string | undefined> = {
      "business-street-address": businessStreetAddress,
      "business-apt-suite": businessAptSuite,
      "business-city": businessCity,
      "business-state": businessState,
      "business-zip-code": businessZipCode,
    };

    for (const [businessField, homeVal] of Object.entries(
      homeToBusinessValues,
    )) {
      const businessVal = businessAddressValues[businessField];

      if (homeVal !== undefined && homeVal !== businessVal) {
        setValue(businessField, homeVal, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    }
  }, [
    sameAsHome,
    homeStreetAddress,
    homeAptSuite,
    homeCity,
    homeState,
    homeZipCode,
    businessStreetAddress,
    businessAptSuite,
    businessCity,
    businessState,
    businessZipCode,
    setValue,
  ]);

  return (
    <>
      {pageSections.map((section) => {
        // Business section uses custom OR visibility
        if (section.id === "contactBusinessInfo") {
          if (!showBusinessSection) return null;
        } else {
          if (!isSectionVisible(section, watchedValues)) return null;
        }

        if (section.id === "contactResidentialAddress") {
          // Find the business section for rendering inside Self container
          const businessSection = pageSections.find(
            (s) => s.id === "contactBusinessInfo",
          );

          const content = (
            <>
              {/* Residential Address sub-section label */}
              <FormSectionTitle icon={HomeOutlinedIcon} label="Home Address" />

              {/* Street address + Apt/Suite row */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                  gap: { xs: 0, sm: 2 },
                }}
              >
                {section.fieldIds
                  .filter((id: string) => streetRow.has(id))
                  .map((fieldId: string) => {
                    const field = allFields.find((f: any) => f.id === fieldId);
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

              {/* City / State / Zip row */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                  gap: { xs: 0, sm: 2 },
                }}
              >
                {section.fieldIds
                  .filter((id: string) => cityStateZipRow.has(id))
                  .map((fieldId: string) => {
                    const field = allFields.find((f: any) => f.id === fieldId);
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

              {/* Other fields (correspondence-to) */}
              {section.fieldIds
                .filter(
                  (id: string) =>
                    !streetRow.has(id) && !cityStateZipRow.has(id),
                )
                .map((fieldId: string) => {
                  const field = allFields.find((f: any) => f.id === fieldId);
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

              {/* Business / Employer Info inside Self container */}
              {showBusinessSection && businessSection && (
                <Box sx={{ mt: 2 }}>
                  <FormSectionTitle
                    icon={BusinessCenterOutlinedIcon}
                    label="Business / Employer Information"
                  />

                  {renderBusinessFields(
                    businessSection,
                    allFields,
                    control,
                    errors,
                    sameAsHome,
                  )}
                </Box>
              )}
            </>
          );

          return (
            <div key={section.id}>
              <ApplicantSection
                applicant="self"
                showLabel={shouldShowApplicantLabel(
                  "self",
                  watchedValues,
                  "contact",
                )}
              >
                {content}
              </ApplicantSection>
            </div>
          );
        }

        // Skip standalone business section rendering — it's inside Self now
        if (section.id === "contactBusinessInfo") {
          return null;
        }

        // Spouse section and default rendering
        const content = (
          <>
            {section.fieldIds.map((fieldId: string) => {
              const field = allFields.find((f: any) => f.id === fieldId);
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

        return (
          <div key={section.id}>
            {section.applicant ? (
              <ApplicantSection
                applicant={section.applicant}
                showLabel={shouldShowApplicantLabel(
                  section.applicant,
                  watchedValues,
                  "contact",
                )}
              >
                {content}
              </ApplicantSection>
            ) : (
              <>
                {section.title && (
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    {section.title}
                  </Typography>
                )}
                {content}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

function renderBusinessFields(
  section: any,
  allFields: any[],
  control: any,
  errors: any,
  sameAsHome: boolean,
) {
  const nonAddressNonPhone = section.fieldIds.filter(
    (id: string) =>
      !businessStreetRow.has(id) &&
      !businessCityStateZipRow.has(id) &&
      id !== "business-phone",
  );

  return (
    <>
      {nonAddressNonPhone.map((fieldId: string) => {
        const field = allFields.find((f: any) => f.id === fieldId);
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

      {!sameAsHome && (
        <>
          {/* Business street + apt row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
              gap: { xs: 0, sm: 2 },
            }}
          >
            {section.fieldIds
              .filter((id: string) => businessStreetRow.has(id))
              .map((fieldId: string) => {
                const field = allFields.find((f: any) => f.id === fieldId);
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

          {/* Business city / state / zip row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
              gap: { xs: 0, sm: 2 },
            }}
          >
            {section.fieldIds
              .filter((id: string) => businessCityStateZipRow.has(id))
              .map((fieldId: string) => {
                const field = allFields.find((f: any) => f.id === fieldId);
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
        </>
      )}

      {/* Business phone */}
      {section.fieldIds
        .filter((id: string) => id === "business-phone")
        .map((fieldId: string) => {
          const field = allFields.find((f: any) => f.id === fieldId);
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
}
