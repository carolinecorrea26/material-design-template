import type { ReactNode } from 'react';
import { useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { Button, Stack } from '@mui/material';
import type { FieldDefinition } from '../src/domain/fields';

export const questionField = (id: string): FieldDefinition => ({ id, label: 'Have you received treatment in the past five years?', inputType: 'radio', required: true, labelVariant: 'standard', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] });
export const detailField = (id: string): FieldDefinition => ({ id, label: 'Treatment details', inputType: 'text', required: true, maxLength: 300, multiline: true });
export default function HealthQuestionExample({ children, restored = false }: { children: (props: UseFormReturn<FieldValues>) => ReactNode; restored?: boolean }) {
  const form = useForm<FieldValues>({ defaultValues: restored ? { 'health-example-member': 'yes', 'health-example-spouse': 'no', 'health-example-member-details': [{ details: 'Saved local treatment record' }] } : {} });
  return <Stack component="form" spacing={2} sx={{ width: '100%', maxWidth: 700, mx: 'auto' }} onSubmit={form.handleSubmit(() => {})}>
    {children(form)}
    <Button type="submit">Check required answers</Button>
  </Stack>;
}
