import type { FormRouteRenderProps } from "../RoutePage";
import { isSectionVisible } from "../RoutePage";
import EligibilitySections from "../../components/eligibility/EligibilitySections";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { getPageSectionNote } from "../../config/pages";

export default function ConfiguredEligibilitySections(props: FormRouteRenderProps) {
  const client = getActiveClient();
  return <EligibilitySections {...props}
    pageSections={props.pageSections.filter(section => isSectionVisible(section, props.watchedValues))}
    applicantLabels={client.applicantLabels}
    eligibleStatesOnly={client.applicantExperience?.eligibleStatesOnly}
    childNotice={client.applicantExperience?.childEligibility?.mode === "notice-only" ? client.applicantExperience.childEligibility.note : undefined}
    collection={getPrototypeLibrary()?.fieldCollections.children}
    sectionNotes={Object.fromEntries(props.pageSections.map(section => [section.id, getPageSectionNote("eligibility", section.id)]))}
  />;
}
