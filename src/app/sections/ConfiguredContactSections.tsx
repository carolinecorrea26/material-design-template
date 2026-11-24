import { shouldShowApplicantLabel } from '../../utils/applicantVisibility';
import type { ComponentProps } from "react";
import ContactSections from "../../components/contact/ContactSections";
import { isSectionVisible } from "../RoutePage";
import { getActiveClient } from "../../config/client/getActiveClient";
import { applicantParticipatesInPage } from "../../config/flowGates";

/** Application adapter: decide participation before passing sections to the view. */
export default function ConfiguredContactSections(props: ComponentProps<typeof ContactSections>) {
  const participates = (applicant: 'self' | 'spouse' | 'child') => applicantParticipatesInPage('contact', applicant, props.watchedValues);
  return <ContactSections {...props}
    pageSections={props.pageSections.filter(section => isSectionVisible(section, props.watchedValues) && (section.applicantParticipation === 'always' || participates(section.applicant ?? 'self')))}
    applicantLabels={getActiveClient().applicantLabels}
    showApplicantLabels={{ self: shouldShowApplicantLabel('self', props.watchedValues), spouse: participates('spouse'), child: participates('child') }}
  />;
}
