import { resolveMappedFields } from '../src/domain/requirementFields';
import type { ReactNode } from 'react';
import { useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { Button, Stack } from '@mui/material';
import type { FieldDefinition } from '../src/domain/fields';

const fields = resolveMappedFields({ page: 'health-si' });
function source(id: string) {
  const field = fields.find(field => field.id === id);
  if (!field) throw new Error(`Missing authored health example field: ${id}`);
  return field;
}
export const questionField = (id: string): FieldDefinition => ({ ...source('health-si-q1'), id });
export const detailField = (id: string): FieldDefinition => ({ ...source('health-detail-conditions'), id });
export default function HealthQuestionExample({ children, restored = false }: { children: (props: UseFormReturn<FieldValues>) => ReactNode; restored?: boolean }) {
  const form = useForm<FieldValues>({ defaultValues: restored ? { 'health-example-member': 'yes', 'health-example-spouse': 'no', 'health-example-member-details': [{ details: 'Saved local treatment record' }] } : {} });
  return <Stack component="form" spacing={2} sx={{ width: '100%', maxWidth: 700, mx: 'auto' }} onSubmit={form.handleSubmit(() => {})}>
    {children(form)}
    <Button type="submit">Check required answers</Button>
  </Stack>;
}
