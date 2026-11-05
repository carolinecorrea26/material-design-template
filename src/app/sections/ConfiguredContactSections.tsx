import type { ComponentProps } from "react";
import ContactSections from "../../components/contact/ContactSections";
import { isSectionVisible } from "../RoutePage";
import { getActiveClient } from "../../config/client/getActiveClient";
import { shouldShowApplicantLabel } from "../../utils/applicantVisibility";

/** Application adapter: decide participation before passing sections to the view. */
export default function ConfiguredContactSections(props: ComponentProps<typeof ContactSections>) {
  return <ContactSections {...props}
    pageSections={props.pageSections.filter(section => section.id === "contactBusinessInfo" || isSectionVisible(section, props.watchedValues))}
    applicantLabels={getActiveClient().applicantLabels}
    showApplicantLabels={Object.fromEntries((["self", "spouse", "child"] as const).map(applicant => [applicant, shouldShowApplicantLabel(applicant, props.watchedValues)]))}
  />;
}
