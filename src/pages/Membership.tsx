import PageHelp from "../components/content/PageHelp";
import { pageHelpItems } from "../content/helpContent";
import { Fragment, type ReactNode } from "react";
import { useApplicationForm, type ApplicationFormValues } from "../app/ApplicationFormContext";
import MembershipStatus from "../components/membership/MembershipStatus";
import MemberInformation from "../components/membership/MemberInformation";
import { FieldGroup } from "../components/layout/SectionDivider";
import AdditionalMembershipInformation from "../components/membership/AdditionalMembershipInformation";
import { clearWAEPAFields } from "../components/membership/membershipFieldReset";

import { getActiveClient } from "../config/client/getActiveClient";
import { getPageSectionNote } from "../config/pages";
import FormRoutePage from "../app/RoutePage";
import { membershipIneligibilityMessage } from "../domain/applicantExperience";
import { requirementText } from "../domain/requirementContent";

import { getResolvedFieldsForSite } from "../config/fields/resolvedFieldRegistry";
import { getPageSections } from "../config/pageSections/getPageSections";
import type { PageSectionComponent } from "../config/pageSections/types";
import { resolveVisibilityCondition } from "../config/conditions";
import { isMembershipAttestationStop, membershipOutcome } from '../config/clientFields/membershipFollowUpVisibility';
import { resolveAssociationMembershipField } from '../config/clientFields/getClientPageFields';
import {
  getActiveSite,
  getAssociationsForSite,
  resolveActiveAssociation,
  resolveActiveAssociationFromApplication,
} from "../data";

export default function Membership() {
  const client = getActiveClient();
  const site = getActiveSite();
  const { setActiveAssociationId } = useApplicationForm();
  const pageId = "membership";
  const membershipDefinition = getResolvedFieldsForSite(pageId, site.id).find(field => field.id === 'membership');
  const fieldForValues = (values: ApplicationFormValues) => membershipDefinition && resolveAssociationMembershipField(membershipDefinition, site, getAssociationsForSite(site.id), resolveActiveAssociationFromApplication(site.id, values));

  return (
    <FormRoutePage
      pageId={pageId}
      help={<PageHelp items={pageHelpItems(pageId)} />}
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
        return isMembershipAttestationStop(fieldForValues(values), values.membership);
      }}
      validate={(values) => membershipIneligibilityMessage(client.applicantExperience, values) ?? (membershipOutcome(fieldForValues(values), values.membership) === 'not-eligible' ? requirementText('membership.not-member.message') : undefined)}
    >
      {({ control, errors, watchedValues, allFields, setValue }) => {
        const membershipField = allFields.find(
          (field) => field.id === "membership",
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

        const showMembershipIneligibleAlert = isMembershipAttestationStop(membershipField, membershipValue);

        const sections = getPageSections(pageId);
        if (!sections.length || sections.some(section => !section.composition?.length)) throw new Error("Missing fresh-start Membership composition");
        const renderComponent = (component: PageSectionComponent, sectionFieldIds: string[]): ReactNode => {
          const fields = (component.fieldIds ?? sectionFieldIds).flatMap(id => allFields.filter(field => field.id === id));
          if (component.type === "FieldGroup") return <FieldGroup className="FieldGroup-root">{component.components?.map((child, index) => <Fragment key={`${child.type}-${index}`}>{renderComponent(child, sectionFieldIds)}</Fragment>)}</FieldGroup>;
          if (component.type === "MemberInformation") return fields.length ? <MemberInformation fields={fields} control={control} errors={errors} /> : null;
          if (component.type === "AdditionalMembershipInformation") return fields.length ? <AdditionalMembershipInformation
            fields={fields} client={client} control={control} errors={errors}
            qualificationValue={watchedValues["waepa-attestation"]} setValue={setValue}
            note={getPageSectionNote(pageId, "membershipInformation")}
          /> : null;
          if (component.type !== "MembershipStatus") throw new Error(`Unsupported Membership component: ${component.type}`);
          return <MembershipStatus
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
            />;
        };
        return <>{sections.filter(section => resolveVisibilityCondition(section, watchedValues, allFields)).map(section => <Fragment key={section.id}>
          {section.composition!.map((component, index) => <Fragment key={`${component.type}-${index}`}>{renderComponent(component, section.fieldIds)}</Fragment>)}
        </Fragment>)}</>;
      }}
    </FormRoutePage>
  );
}
