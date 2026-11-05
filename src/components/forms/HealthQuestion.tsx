import type { ComponentProps } from 'react';
import { Stack, Typography } from '@mui/material';
import type { FieldDefinition } from '../../domain/fields';
import FieldRenderer from './FieldRenderer';
import DynamicList from './DynamicList';

export type HealthQuestionItem = {
  question: FieldDefinition | null;
  fields: FieldDefinition[];
  showDetails: boolean;
  repeated?: boolean;
  collection: string;
};

/** Renders an explicit health answer and its direct fields or repeated detail records. */
export default function HealthQuestion({ item, control, errors }: {
  item: HealthQuestionItem;
} & Pick<ComponentProps<typeof FieldRenderer>, 'control' | 'errors'>) {
  return <Stack spacing={2}>
    {item.question && <FieldRenderer field={item.question} control={control} errors={errors} />}
    {item.showDetails && (item.repeated ? <DynamicList control={control} name={item.collection} label="condition details" maxItems={Number.MAX_SAFE_INTEGER}
      mapping={{ fields: item.fields, fieldToKey: Object.fromEntries(item.fields.map(field => [field.id, field.id])) }}
      renderItem={row => <Stack>{item.fields.map(field => <Typography key={field.id} variant="body2">{field.label}: {row[field.id]}</Typography>)}</Stack>} /> : item.fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />))}
  </Stack>;
}
