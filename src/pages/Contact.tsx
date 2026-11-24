import FormRoutePage from "../app/RoutePage";
import ContactSections from "../app/sections/ConfiguredContactSections";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { contactCarryForwardTransition, executeApplicationTransition } from "../config/applicationTransitions";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getActiveClient } from "../config/client/getActiveClient";
import { contactEmployerCoverageCategories, contactHiddenCorrespondenceValue, showContactBusinessSection } from "../domain/applicantExperience";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { addressFieldNames } from "../components/forms/AddressFields";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { useEffect } from 'react';

function businessParticipation(values: ApplicationFormValues) {
  const entries = buildSelectedCoverageEntries(values, getActiveClientCoverages());
  // Disability/overhead elections use the member's employment, including spouse-only DI.
  const employer = entries.some(entry => contactEmployerCoverageCategories.includes(entry.coverage.categoryId));
  const experience = getActiveClient().applicantExperience;
  const products = [...new Set(entries.map(entry => entry.coverageId))];
  const fields = getClientPageFields('contact', values);
  const memberBusiness = showContactBusinessSection(experience, employer, fields.some(field => field.id === 'correspondence-to') ? values['correspondence-to'] : undefined, products);
  return {
    memberEmployer: employer,
    memberBusiness,
    correspondenceVisible: fields.some(field => field.id === 'correspondence-to'),
    sameAsHome: memberBusiness && employer && fields.some(field => field.id === 'business-address-same-as-home') && values['business-address-same-as-home'] === true,
  };
}

export default function Contact() {
  const { values, setPageValues } = useApplicationForm();
  const defaultValueOverrides = executeApplicationTransition(contactCarryForwardTransition, values, values);
  const participation = businessParticipation(values);
  useEffect(() => {
    if (!participation.correspondenceVisible && values['correspondence-to'] !== contactHiddenCorrespondenceValue) setPageValues({ 'correspondence-to': contactHiddenCorrespondenceValue });
  }, [participation.correspondenceVisible, values, setPageValues]);
  // Seed the member business address before the parent reset, including carry-forward.
  if (participation.sameAsHome) {
    for (const key of addressFieldNames) {
      const value = defaultValueOverrides[key];
      if (typeof value === 'string') defaultValueOverrides[`business-${key}`] = value;
    }
  }
  return <FormRoutePage pageId="contact" defaultValueOverrides={defaultValueOverrides as Record<string, string | boolean | string[]>}
    prepareSubmitValues={submitted => businessParticipation(submitted).correspondenceVisible ? submitted : { ...submitted, 'correspondence-to': contactHiddenCorrespondenceValue }}>
    {({ control, errors, watchedValues, allFields, pageSections, setValue }) => {
      const current = businessParticipation(watchedValues);
      return <ContactSections control={control} errors={errors} watchedValues={watchedValues} allFields={allFields} pageSections={pageSections} setValue={setValue}
        showBusinessSection={current.memberBusiness} sameAsHome={current.sameAsHome} hasDiOrOo={current.memberEmployer} />;
    }}
  </FormRoutePage>;
}
