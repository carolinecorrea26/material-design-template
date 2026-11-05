import type { ComponentProps } from "react";
import ApplicantSectionDivider from "../../components/layout/ApplicantSectionDivider";
import { getActiveClient } from "../../config/client/getActiveClient";
export default function ConfiguredApplicantSectionDivider(props: ComponentProps<typeof ApplicantSectionDivider>) {
  return <ApplicantSectionDivider labels={getActiveClient().applicantLabels} {...props} />;
}
