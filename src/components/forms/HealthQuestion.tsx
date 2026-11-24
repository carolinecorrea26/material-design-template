import FieldGrid from '../layout/FieldGrid';
import type { ComponentProps, ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import type { FieldDefinition } from '../../domain/fields';
import FieldRenderer from './FieldRenderer';
import DynamicList, { type DynamicListFieldMapping } from './DynamicList';
import { requirementText } from '../../domain/requirementContent';

export type HealthQuestionItem = {
  question: FieldDefinition | null;
  fields: FieldDefinition[];
  showDetails: boolean;
  repeated?: boolean;
  collection: string;
  detailsLabel?: string;
  mapping?: DynamicListFieldMapping<Record<string, string>>;
  renderItem?: (row: Record<string, string>) => ReactNode;
  maxItems?: number;
  questionMargin?: ComponentProps<typeof FieldRenderer>['margin'];
};

/** Renders an explicit health answer and its direct fields or repeated detail records. */
export default function HealthQuestion({ item, control, errors }: {
  item: HealthQuestionItem;
} & Pick<ComponentProps<typeof FieldRenderer>, 'control' | 'errors'>) {
  return <FieldGrid>
    {item.question && <FieldRenderer field={item.question} control={control} errors={errors} margin={item.questionMargin} />}
    {item.showDetails && (item.repeated ? <DynamicList control={control} name={item.collection} label={item.detailsLabel ?? requirementText('health.condition-details-label')} maxItems={item.maxItems ?? Number.MAX_SAFE_INTEGER}
      mapping={item.mapping ?? { fields: item.fields, fieldToKey: Object.fromEntries(item.fields.map(field => [field.id, field.id])) }}
      renderItem={item.renderItem ?? (row => <Stack>{item.fields.map(field => <Typography key={field.id} variant="body2">{field.label}: {row[field.id]}</Typography>)}</Stack>)} /> : item.fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />))}
  </FieldGrid>;
}
