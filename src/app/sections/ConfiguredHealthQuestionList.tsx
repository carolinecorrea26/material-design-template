import type { ComponentProps } from 'react';
import HealthQuestionList from '../../components/forms/HealthQuestionList';
import { getActiveClient } from '../../config/client/getActiveClient';

export default function ConfiguredHealthQuestionList(props: ComponentProps<typeof HealthQuestionList>) {
  return <HealthQuestionList {...props} labels={getActiveClient().applicantLabels} />;
}
