import ApplicationDocumentPreview, { type ApplicationDocumentPreviewProps } from "../../components/content/ApplicationDocumentPreview";
import { buildDocumentSections, documentPages } from "../../components/content/applicationDocumentSections";
import { getActiveClient } from "../../config/client/getActiveClient";
import type { ApplicationFormValues } from "../ApplicationFormContext";

/** Resolve the application readout before rendering the standalone document view. */
export default function ConfiguredApplicationDocumentPreview({ values, ...props }: Omit<ApplicationDocumentPreviewProps, "sections" | "associationName" | "sectionPages"> & { values: ApplicationFormValues }) {
  return <ApplicationDocumentPreview {...props} sections={buildDocumentSections(values)} associationName={getActiveClient().branding.name} sectionPages={documentPages} />;
}
