import { useApplicationForm } from "../app/ApplicationFormContext";
import MembershipStatus from "../components/membership/MembershipStatus";
import MemberInformation from "../components/membership/MemberInformation";
import { FieldGroup } from "../components/layout/SectionDivider";
import AdditionalMembershipInformation from "../components/membership/AdditionalMembershipInformation";
import MembershipHelp from "../app/sections/ConfiguredMembershipHelp";
import { clearWAEPAFields } from "../components/membership/membershipFieldReset";

import { getActiveClient } from "../config/client/getActiveClient";
import { getPageSectionNote } from "../config/pages";
import FormRoutePage from "../app/RoutePage";
import { membershipIneligibilityMessage } from "../domain/applicantExperience";

import { getResolvedFieldsForSite } from "../config/fields/resolvedFieldRegistry";
import { shouldShowMembershipFollowUpFields } from "../config/clientFields/membershipFollowUpVisibility";
import {
  getActiveSite,
  resolveActiveAssociation,
  resolveActiveAssociationFromApplication,
} from "../data";

const defaultMemberInformationFieldIds = new Set(["title", "first-name", "last-name", "email", "phone"]);

export default function Membership() {
  const client = getActiveClient();
  const site = getActiveSite();
  const { setActiveAssociationId } = useApplicationForm();
  const pageId = "membership";

  return (
    <FormRoutePage
      pageId={pageId}
      help={<MembershipHelp />}
      initialTransitionMessage="Loading your membership application..."
      disableNextButton={(values) => {
        const associationResolution = resolveActiveAssociationFromApplication(
          site.id,
          values,
        );
        if (
          site.associationSelection?.mode === "url-parameter" &&
          associationResolution.status !== "resolved"
        ) {
          return true;
        }
        return (
          values.membership === "no"
        );
      }}
      validate={(values) => membershipIneligibilityMessage(client.applicantExperience, values)}
    >
      {({ control, errors, watchedValues, allFields, setValue }) => {
        const membershipField = allFields.find(
          (field) => field.id === "membership",
        );
        const remainingFields = allFields.filter(
          (field) => field.id !== "membership",
        );

        const membershipValue = watchedValues.membership;
        const associationResolution = resolveActiveAssociationFromApplication(
          site.id,
          watchedValues,
        );
        const associationLinkError =
          site.associationSelection?.mode === "url-parameter" &&
          associationResolution.status !== "resolved"
            ? associationResolution.message
            : undefined;

        const showMembershipIneligibleAlert =
          membershipValue === "no";

        const showMembershipFollowUpFields =
          shouldShowMembershipFollowUpFields({
            membershipOptions: membershipField?.options?.map(option => option.value) ?? [],
            selectionMode: site.associationSelection?.mode,
            membershipValue,
            associationStatus: associationResolution.status,
          });

        const additionalFields = remainingFields.filter(
          (field) => !defaultMemberInformationFieldIds.has(field.id),
        );
        const hasAdditionalFields = additionalFields.length > 0;

        return (
          <>
            <FieldGroup className="FieldGroup-root">
            <MembershipStatus
              membershipField={membershipField}
              client={client}
              control={control}
              errors={errors}
              associationLinkError={associationLinkError}
              showMembershipIneligibleAlert={showMembershipIneligibleAlert}
              onMembershipChange={(nextValue) => {
                if (
                  site.associationSelection?.mode === "select" &&
                  typeof nextValue === "string"
                ) {
                  setActiveAssociationId?.(
                    resolveActiveAssociation(site.id, {
                      selectedAssociationId: nextValue,
                    }).association?.id ?? null,
                  );
                }
                if (getResolvedFieldsForSite("membership", site.id).some(field => field.id === "waepa-attestation")) {
                  clearWAEPAFields(setValue);
                }
              }}
            />
            {showMembershipFollowUpFields && <MemberInformation fields={remainingFields} control={control} errors={errors} />}
            </FieldGroup>
            {showMembershipFollowUpFields && (
              <>
                {hasAdditionalFields && (
                  <AdditionalMembershipInformation
                    fields={additionalFields}
                    client={client}
                    control={control}
                    errors={errors}
                    qualificationValue={watchedValues["waepa-attestation"]}
                    setValue={setValue}
                    note={getPageSectionNote(pageId, "membershipInformation")}
                  />
                )}
              </>
            )}
          </>
        );
      }}
    </FormRoutePage>
  );
}
