import ApplicationDocumentPreview, { type ApplicationDocumentPreviewProps } from "../../components/content/ApplicationDocumentPreview";
import { buildDocumentSections, documentPages } from "../../components/content/applicationDocumentSections";
import { getActiveClient } from "../../config/client/getActiveClient";
import type { ApplicationFormValues } from "../ApplicationFormContext";
import { paymentPeriodSuffix, useApplicationEstimates } from "../estimates/useApplicationEstimates";
import EstimatedRate from "../../components/coverage/EstimatedRate";

/** Resolve the application readout before rendering the standalone document view. */
export default function ConfiguredApplicationDocumentPreview({ values, ...props }: Omit<ApplicationDocumentPreviewProps, "sections" | "associationName" | "sectionPages"> & { values: ApplicationFormValues }) {
  const estimates = useApplicationEstimates(values);
  const sections = buildDocumentSections(values).map(section => ({
    ...section,
    groups: section.groups.map(group => {
      const estimate = "coverageKey" in group ? estimates.items.find(item => item.id === group.coverageKey) : undefined;
      return estimate && estimate.display.status !== "hidden" && estimate.display.status !== "needs-information" ? {
        ...group, entries: [...group.entries, { label: "Estimated rate", value: <EstimatedRate appearance="inline" display={estimate.display} suffix={paymentPeriodSuffix(estimate.period)} /> }],
      } : group;
    }),
  }));
  return <ApplicationDocumentPreview {...props} sections={sections} associationName={getActiveClient().branding.name} sectionPages={documentPages} />;
}
