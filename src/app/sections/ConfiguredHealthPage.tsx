import FormRoutePage, { type FormRouteRenderProps } from '../RoutePage';
import HealthQuestionList from './ConfiguredHealthQuestionList';
import { configuredHealthQuestionEntries } from './ConfiguredHealthQuestions';
import HealthQuestion from '../../components/forms/HealthQuestion';
import HealthDetailSummary from '../../components/forms/HealthDetailSummary';
import type { HealthQuestionEntry } from '../../components/forms/HealthQuestionList';
import { defaultHealthQuestionIds, defaultHealthDetailSummary } from '../../config/fields/healthPageFields';
import { getHealthDetailSurface, getHealthDetailSurfaceName, surfaceSemanticValues } from '../../config/fields/storedSurfaces';
import { applicantParticipatesInPage } from '../../config/flowGates';
import { validateHealthPage } from '../../config/healthFollowUps';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { configuredHealthQuestionnaire } from '../../domain/configuredHealthQuestionnaire';
import type { FieldDefinition } from '../../domain/fields';

type Applicant = 'self' | 'spouse';
type DefaultPage = 'health-si' | 'health-tele' | 'health-di-supp';
type Props = {
  pageId: DefaultPage;
  defaultFields: (applicant: Applicant) => FieldDefinition[];
  resolveConfigured?: boolean;
};
const applicants = ['self', 'spouse'] as const;

/** Bind the common page/entry composition without owning questionnaire or participation policy. */
export default function ConfiguredHealthPage({ pageId, defaultFields, resolveConfigured = false }: Props) {
  const resolve = (applicant: Applicant, values: Record<string, unknown>) => {
    const library = getPrototypeLibrary();
    return resolveConfigured && library ? configuredHealthQuestionnaire(library.site, pageId, applicant, values) : null;
  };
  function entries({ control, errors, watchedValues, allFields }: FormRouteRenderProps): HealthQuestionEntry[] {
    return applicants.filter(applicant => applicantParticipatesInPage(pageId, applicant, watchedValues)).flatMap(applicant => {
      const questionnaire = resolve(applicant, watchedValues);
      if (questionnaire && questionnaire.status !== 'unassigned') return configuredHealthQuestionEntries({ questionnaire, applicant, control, errors });
      const ids = defaultHealthQuestionIds(pageId, applicant);
      return allFields.filter(field => ids.has(field.id)).map((field, order) => {
        const surface = getHealthDetailSurface(pageId, field.id);
        const surfaceName = getHealthDetailSurfaceName(pageId, field.id);
        return { key: field.id.replace(/-spouse$/, ''), order, applicant,
          content: <HealthQuestion control={control} errors={errors} item={{
            question: { ...field, labelVariant: 'standard' }, questionMargin: 'none',
            fields: surface.mapping.fields, mapping: surface.mapping, maxItems: surface.maxItems,
            collection: `${field.id}-details`, repeated: true,
            showDetails: watchedValues[field.id] === 'yes' && surface.mapping.fields.length > 0,
            detailsLabel: surface.label,
            renderItem: row => <HealthDetailSummary kind={defaultHealthDetailSummary(pageId, field.id)} values={surfaceSemanticValues(surfaceName, row) as Record<string, string>} />,
          }} /> };
      });
    });
  }
  return <FormRoutePage pageId={pageId} validate={values => validateHealthPage(pageId, values)} devFillFields={values => {
    const configured = applicants.map(applicant => ({ applicant, result: resolve(applicant, values) }));
    if (configured.some(({ result }) => result && result.status !== 'unassigned')) return configured.flatMap(({ applicant, result }) => applicantParticipatesInPage(pageId, applicant, values) ? result?.fields ?? [] : []);
    return applicants.flatMap(applicant => applicantParticipatesInPage(pageId, applicant, values) ? defaultFields(applicant) : []);
  }}>{props => <HealthQuestionList values={props.watchedValues} entries={entries(props)} />}</FormRoutePage>;
}
