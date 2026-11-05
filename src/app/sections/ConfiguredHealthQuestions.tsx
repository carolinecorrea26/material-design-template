import type { FormRouteRenderProps } from '../RoutePage';
import type { configuredHealthQuestionnaire } from '../../domain/configuredHealthQuestionnaire';
import HealthQuestion from '../../components/forms/HealthQuestion';
import type { HealthQuestionEntry } from '../../components/forms/HealthQuestionList';

/** The page resolves the questionnaire; the view receives only its explicit presentation. */
export function configuredHealthQuestionEntries({ questionnaire, applicant, control, errors }: {
  questionnaire: ReturnType<typeof configuredHealthQuestionnaire>;
  applicant: 'self' | 'spouse';
} & Pick<FormRouteRenderProps, 'control' | 'errors'>): HealthQuestionEntry[] {
  return questionnaire.items.map(item => ({
    key: item.groupKey ?? item.key, order: item.position, applicant,
    content: <HealthQuestion item={item} control={control} errors={errors} />,
  }));
}
