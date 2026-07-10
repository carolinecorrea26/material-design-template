import { Alert, Box, Stack, Typography } from "@mui/material";
import type { UseFormSetValue } from "react-hook-form";

import { getActiveClient } from "../config/client/getActiveClient";
import { getPageSectionNote } from "../config/pages";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import FieldRenderer from "../components/fields/FieldRenderer";
import FormRoutePage from "../components/page/RoutePage";
import FormSectionTitle from "../components/page/SectionTitle";
import FormPageHelp from "../components/help/Panel";
import CostEstimateDrawerContent from "../components/overlays/CostEstimate";
import type { FieldDefinition } from "../config/fields/types";
import {
  coverageOptionsAvailableHelpItem,
  // groupInsuranceHelpItem,
  howApplyingWorksHelpItem,
} from "../content/helpContent";

type MembershipFormValue = string | boolean | string[];
type MembershipSetValue = UseFormSetValue<Record<string, MembershipFormValue>>;

const defaultMemberInformationFieldIds = new Set([
  "title",
  "first-name",
  "last-name",
  "email",
  "phone",
]);

const waepaConditionalFieldIds = [
  "waepa-employer",
  "waepa-start-date",
  "waepa-retired-employer",
  "waepa-retirement-date",
  "waepa-member-first-name",
  "waepa-member-last-name",
  "waepa-member-id",
];

const clearFieldOptions = {
  shouldDirty: true,
  shouldTouch: false,
  shouldValidate: false,
};

function clearFields(setValue: MembershipSetValue, fieldIds: string[]) {
  fieldIds.forEach((fieldId) => {
    setValue(fieldId, "", clearFieldOptions);
  });
}

function clearWAEPAFields(setValue: MembershipSetValue) {
  setValue("waepa-declaration", false, clearFieldOptions);
  clearFields(setValue, ["waepa-attestation", ...waepaConditionalFieldIds]);
}

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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: { xs: 0, sm: 2 },
      }}
    >
      {fields.map((field) => renderField(field, control, errors))}
    </Box>
  );
}

function WAEPAAdditionalFields({
  fields,
  control,
  errors,
  qualificationValue,
  setValue,
}: {
  fields: FieldDefinition[];
  control: Parameters<typeof FieldRenderer>[0]["control"];
  errors: Parameters<typeof FieldRenderer>[0]["errors"];
  qualificationValue: ApplicationFormValues[string] | undefined;
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
  const memberLastNameField = fieldById(fields, "waepa-member-last-name");
  const memberIdField = fieldById(fields, "waepa-member-id");

  const associateMembershipAlert =
    selectedQualification === "spouse-associate"
      ? "To apply as an Associate Member, please include your spouse's current WAEPA membership information."
      : selectedQualification === "child-associate"
        ? "To apply as an Associate Member, please include your parent's current WAEPA membership information."
        : undefined;

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {renderField(declarationField, control, errors)}
      {renderField(attestationField, control, errors, () =>
        clearFields(setValue, waepaConditionalFieldIds),
      )}

      {selectedQualification === "federal-active" && (
        <>
          {renderField(employerField, control, errors)}
          {renderField(startDateField, control, errors)}
        </>
      )}

      {selectedQualification === "federal-annuitant" && (
        <>
          {renderField(retiredEmployerField, control, errors)}
          {renderField(retirementDateField, control, errors)}
        </>
      )}

      {associateMembershipAlert && (
        <>
          <Alert severity="info">{associateMembershipAlert}</Alert>
          {renderFieldGrid(
            [memberFirstNameField, memberLastNameField].filter(
              (field): field is FieldDefinition => Boolean(field),
            ),
            control,
            errors,
          )}
          {renderField(memberIdField, control, errors)}
        </>
      )}
    </Stack>
  );
}

export default function Membership() {
  const client = getActiveClient();
  const pageId = "membership";

  const helpItems = [
    coverageOptionsAvailableHelpItem,
    howApplyingWorksHelpItem,
    {
      id: "estimate-cost",
      label: "How much does it cost?",
      title: "How much does it cost?",
      content: <CostEstimateDrawerContent />,
    },
    // groupInsuranceHelpItem(client.branding.name),
  ];

  return (
    <FormRoutePage
      pageId={pageId}
      help={<FormPageHelp items={helpItems} />}
      initialTransitionMessage="Loading your membership application..."
      disableNextButton={(values) =>
        client.id !== "ama" &&
        client.id !== "waepa" &&
        values.membership === "no"
      }
    >
      {({ control, errors, watchedValues, allFields, setValue }) => {
        const membershipField = allFields.find(
          (field) => field.id === "membership",
        );
        const remainingFields = allFields.filter(
          (field) => field.id !== "membership",
        );

        const membershipValue = watchedValues.membership;

        const showMembershipIneligibleAlert =
          client.id !== "ama" &&
          client.id !== "waepa" &&
          membershipValue === "no";

        const showMembershipFollowUpFields =
          client.id === "ama"
            ? Boolean(membershipValue)
            : client.id === "waepa"
              ? membershipValue === "current" || membershipValue === "new"
              : membershipValue === "yes";

        const hasTitleField = remainingFields.some(
          (field) => field.id === "title",
        );
        const nameFields = remainingFields.filter((field) =>
          ["title", "first-name", "last-name"].includes(field.id),
        );
        const contactFields = remainingFields.filter((field) =>
          ["email", "phone"].includes(field.id),
        );
        const additionalFields = remainingFields.filter(
          (field) => !defaultMemberInformationFieldIds.has(field.id),
        );
        const hasAdditionalFields = additionalFields.length > 0;

        return (
          <>
            {membershipField && (
              <FieldRenderer
                key={membershipField.id}
                field={membershipField}
                control={control}
                errors={errors}
                onValueChange={() => {
                  if (client.id === "waepa") {
                    clearWAEPAFields(setValue);
                  }
                }}
              />
            )}

            {showMembershipIneligibleAlert && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="body2">
                    We're sorry, but only members are eligible to apply for this
                    coverage.
                  </Typography>

                  {/* <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Check your membership
                    </Typography>
                    <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                      <Typography component="li" variant="body2">
                        Look for a membership card or welcome email from your
                        association.
                      </Typography>
                      <Typography component="li" variant="body2">
                        Check if you receive association newsletters, journals,
                        or other member communications.
                      </Typography>
                      <Typography component="li" variant="body2">
                        Log in to your association&apos;s member portal to
                        verify your status.
                      </Typography>
                    </Stack>
                  </Box> */}

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Not yet a member?
                    </Typography>
                    <Typography variant="body2">
                      You can apply for membership with your association to
                      become eligible for coverage. Contact{" "}
                      {client.branding.name} or visit your association&apos;s
                      website to learn about membership options and how to join.
                    </Typography>
                  </Box>

                  {client.support.website && (
                    <Typography variant="body2">
                      For more information, visit{" "}
                      <Typography
                        component="a"
                        href={`https://${client.support.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "primary.main",
                          textDecoration: "underline",
                          font: "inherit",
                        }}
                      >
                        {client.support.website}
                      </Typography>{" "}
                      or call {client.support.phoneDisplay}.
                    </Typography>
                  )}
                </Stack>
              </Alert>
            )}

            {showMembershipFollowUpFields && (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: hasTitleField ? "120px 1fr 1fr" : "1fr 1fr",
                    },
                    gap: { xs: 0, sm: 2 },
                  }}
                >
                  {nameFields.map((field) =>
                    renderField(field, control, errors),
                  )}
                </Box>

                {contactFields.map((field) =>
                  renderField(field, control, errors),
                )}

                {hasAdditionalFields && (
                  <Box sx={{ mt: 3 }}>
                    <FormSectionTitle
                      label={
                        client.id === "ama" && membershipValue === "spouse"
                          ? "Physician Information"
                          : "Membership Information"
                      }
                    />
                    {client.id === "ama" && membershipValue === "spouse" && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        To apply as a spouse of a physician, please include the
                        physician&apos;s information below.
                      </Alert>
                    )}
                    {getPageSectionNote(pageId, "membershipInformation") && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        {getPageSectionNote(pageId, "membershipInformation")}
                      </Alert>
                    )}
                    {client.id === "waepa" ? (
                      <WAEPAAdditionalFields
                        fields={additionalFields}
                        control={control}
                        errors={errors}
                        qualificationValue={watchedValues["waepa-attestation"]}
                        setValue={setValue}
                      />
                    ) : client.id === "ama" ? (
                      <Stack spacing={0} sx={{ mt: 1 }}>
                        {renderField(
                          fieldById(additionalFields, "ama-physician-type"),
                          control,
                          errors,
                        )}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "120px 1fr 1fr",
                            },
                            gap: { xs: 0, sm: 2 },
                          }}
                        >
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
                        </Box>
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
                )}
              </>
            )}
          </>
        );
      }}
    </FormRoutePage>
  );
}
