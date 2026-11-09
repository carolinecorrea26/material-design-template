import type { ComponentProps } from "react";
import ContactSections from "../../components/contact/ContactSections";
import { isSectionVisible } from "../RoutePage";
import { getActiveClient } from "../../config/client/getActiveClient";
import { shouldShowApplicantLabel } from "../../utils/applicantVisibility";
import { FieldDefinitionsContext } from "../../components/forms/FieldDefinitionsContext";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";

/** Application adapter: decide participation before passing sections to the view. */
export default function ConfiguredContactSections(props: ComponentProps<typeof ContactSections>) {
  const definitions = [...new Map([...(getPrototypeLibrary()?.fields ?? []), ...props.allFields].map(field => [field.id, field])).values()];
  return <FieldDefinitionsContext value={definitions}><ContactSections {...props}
    pageSections={props.pageSections.filter(section => section.id === "contactBusinessInfo" || isSectionVisible(section, props.watchedValues))}
    applicantLabels={getActiveClient().applicantLabels}
    showApplicantLabels={Object.fromEntries((["self", "spouse", "child"] as const).map(applicant => [applicant, shouldShowApplicantLabel(applicant, props.watchedValues)]))}
  /></FieldDefinitionsContext>;
}
