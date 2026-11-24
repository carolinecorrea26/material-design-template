import type { ComponentProps } from 'react';
import HealthQuestionList from '../../components/forms/HealthQuestionList';
import { shouldShowApplicantLabel } from '../../utils/applicantVisibility';
import { getActiveClient } from '../../config/client/getActiveClient';

type Props = Omit<ComponentProps<typeof HealthQuestionList>, "applicantHeadings"> & { values: Record<string, unknown> };
export default function ConfiguredHealthQuestionList({ values, ...props }: Props) {
  return <HealthQuestionList {...props} labels={getActiveClient().applicantLabels} applicantHeadings={{ self: shouldShowApplicantLabel("self", values), spouse: shouldShowApplicantLabel("spouse", values) }} />;
}
