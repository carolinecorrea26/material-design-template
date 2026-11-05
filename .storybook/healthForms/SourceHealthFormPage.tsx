import { useId, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import PageShell from '../../src/components/layout/PageShell';
import FormShell from '../../src/components/layout/FormShell';
import FieldRenderer from '../../src/components/forms/FieldRenderer';
import HealthInformationHelp from '../../src/components/health/HealthInformationHelp';
import HealthQuestion from '../../src/components/forms/HealthQuestion';
import { sourceFormErrors } from './validation';
import ApplicantSectionDivider from '../../src/components/layout/ApplicantSectionDivider';
import type { FieldDefinition } from '../../src/domain/fields';
import { defaultPreviewOptions, sourceFormQuestions, sourceHealthForm, type FormPreviewOptions, type SourceQuestion } from './catalog';

export type SourceHealthFormPageProps = FormPreviewOptions & { formKey: string; includeSpouse: boolean; initialValues?: Record<string, unknown> };

/** Storybook source-form preview. Reads no Site state and saves no applicant answers. */
export default function SourceHealthFormPage({ formKey, includeSpouse, initialValues, ...options }: SourceHealthFormPageProps) {
  const pageId = useId();
  const form = sourceHealthForm(formKey);
  const questions = sourceFormQuestions(form, options);
  const { control, watch, reset, setError, clearErrors, formState: { errors } } = useForm<FieldValues>({ defaultValues: initialValues ?? {}, shouldUnregister: false });
  const values = watch();
  const [result, setResult] = useState<{ message: string; severity: 'success' | 'error'; answers: string } | null>(null);
  const applicants = includeSpouse ? ['member', 'spouse'] : ['member'];
  const fieldsFor = (question: SourceQuestion, applicant: string) => question.details.map(field => ({ ...field, id: `${question.key}-${applicant}-${field.id}` }));
  const checkAnswers = () => {
    clearErrors();
    const invalid = sourceFormErrors(questions, applicants, values);
    invalid.forEach(error => setError(error.id, { type: 'validate', message: error.message }));
    setResult({ message: invalid[0]?.message ?? 'Answers checked for this preview.', severity: invalid.length ? 'error' : 'success', answers: JSON.stringify(values) });
  };
  const notes = form.rows.filter(row => row.notes);
  let ordinal = 0;
  return <Box sx={{ width: '100%', p: { xs: 2, md: 4 } }}><PageShell title="Health" subhead={form.key} help={<HealthInformationHelp />}>
    <Box component="form" noValidate onSubmit={event => { event.preventDefault(); checkAnswers(); }}><FormShell sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {questions.map(question => {
          const number = question.field || question.details.length ? ++ordinal : undefined;
          return <Stack key={question.key} component="section" spacing={2} aria-labelledby={`${pageId}-${question.key}`} data-source-row={question.row} data-source-question={question.field ? question.key : undefined}>
            {number && <Typography id={`${pageId}-${question.key}`} component="h2" variant="subtitle1" fontWeight={700}>Question {number}</Typography>}
            {!question.field && <Typography id={number ? undefined : `${pageId}-${question.key}`} component={number ? "p" : "h2"} variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{question.label}</Typography>}
            {(question.field || question.details.length > 0) && applicants.map(applicant => {
              const id = `${question.key}-${applicant}`;
              const showDetails = !question.field || values[id] === question.showDetailsOn;
              const fields = fieldsFor(question, applicant);
              const renderField = (field: FieldDefinition) => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />;
              return <Box component="section" key={applicant} data-source-applicant={applicant}>
                <ApplicantSectionDivider applicant={applicant === 'member' ? 'self' : 'spouse'} showLabel={includeSpouse}>
                  <Stack spacing={2}>
                    <HealthQuestion item={{ question: question.field ? { ...question.field, id } : null, fields, showDetails, repeated: question.repeat, collection: `${id}-details` }} control={control} errors={errors} />
                    {question.row === 146 && values[id] === 'no' && <>
                      {renderField({ id: `${id}-past-use`, label: 'In the past five years have you consumed any alcoholic beverages?', inputType: 'radio', required: true, labelVariant: 'standard', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] })}
                      {values[`${id}-past-use`] === 'yes' && fields.map(field => renderField({ ...field, id: field.id.replace(id, `${id}-past-use`) }))}
                    </>}
                  </Stack>
                </ApplicantSectionDivider>
              </Box>;
            })}
          </Stack>;
        })}
        {result && result.answers === JSON.stringify(values) && <Alert severity={result.severity}>{result.message}</Alert>}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={() => { reset({}); setResult(null); }}>Reset answers</Button>
          <Button variant="contained" type="submit">Check answers</Button>
        </Stack>
      </Stack>
    </FormShell></Box>
    <Box component="details" sx={{ mt: 3, p: 2 }}>
      <Typography component="summary" sx={{ cursor: 'pointer' }}>Source wording and form instructions</Typography>
      <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>{form.sourceText}</Typography>
      {notes.map(row => <Box key={row.row} sx={{ mt: 2 }}><Typography variant="subtitle2">Workbook row {row.row}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{row.notes}</Typography></Box>)}
    </Box>
  </PageShell></Box>;
}

export const sourceFormPreviewArgs = { ...defaultPreviewOptions, includeSpouse: false };
